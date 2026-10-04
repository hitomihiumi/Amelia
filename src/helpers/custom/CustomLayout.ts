import {
  ActionRowBuilder,
  ButtonBuilder,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageActionRowComponentBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from "discord.js";
import {
  ButtonCustom,
  LAYOUT_LIMITS,
  LayoutComponent,
  LayoutContainerChild,
  LayoutCustom,
  SelectMenuCustom,
  isLayoutAccentColor,
  layoutAccentToInt,
} from "../../types/helpers";
import { CustomButton } from "./CustomButton";
import { CustomSelectMenu } from "./CustomSelectMenu";
import { substituteVariables, VariableContext } from "./substitute";

/** The stored buttons and select menus a layout may point at (`utils.components.*`). */
export interface LayoutBuildLibrary {
  buttons: ButtonCustom[];
  selectMenus: SelectMenuCustom[];
}

export interface LayoutBuildOptions {
  /** Called for every piece that was dropped or degraded because it could not be rendered. */
  onWarn?: (message: string) => void;
}

export type LayoutTopLevelBuilder =
  | ContainerBuilder
  | SectionBuilder
  | TextDisplayBuilder
  | MediaGalleryBuilder
  | SeparatorBuilder
  | ActionRowBuilder<MessageActionRowComponentBuilder>;

export interface LayoutPayload {
  components: LayoutTopLevelBuilder[];
  /** Always `IsComponentsV2`. Combine it with other flags using `|`, never overwrite it. */
  flags: MessageFlags.IsComponentsV2;
}

// ==================== RESOLVED TREE ====================
// The stored layout after placeholder substitution and re-validation. Everything in here is
// known to be renderable, apart from the limits and duplicates that `finalize` takes care of.

interface RText {
  kind: "text";
  content: string;
}

interface RSeparator {
  kind: "separator";
  divider: boolean;
  spacing: SeparatorSpacingSize;
}

interface RGalleryItem {
  url: string;
  description?: string;
  spoiler: boolean;
}

interface RGallery {
  kind: "gallery";
  items: RGalleryItem[];
}

interface RButton {
  id: string;
  builder: ButtonBuilder;
}

interface RSelect {
  id: string;
  builder: StringSelectMenuBuilder;
}

interface RSection {
  kind: "section";
  texts: string[];
  accessory:
    | { kind: "thumbnail"; url: string; description?: string; spoiler: boolean }
    | { kind: "button"; button: RButton };
}

interface RActions {
  kind: "actions";
  buttons: RButton[];
  select?: RSelect;
}

type RChild = RText | RSeparator | RGallery | RSection | RActions;

interface RContainer {
  kind: "container";
  accentColor?: number;
  spoiler: boolean;
  children: RChild[];
}

type RTop = RChild | RContainer;

// ==================== HELPERS ====================

/** A real http(s) link, checked after placeholders were filled in. */
function isHttpUrl(value: string): boolean {
  if (!value || value.length > LAYOUT_LIMITS.MAX_URL_LENGTH) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function cutDescription(value: string): string | undefined {
  const text = value.trim();
  if (text === "") return undefined;
  return text.length > LAYOUT_LIMITS.MAX_MEDIA_DESCRIPTION
    ? text.slice(0, LAYOUT_LIMITS.MAX_MEDIA_DESCRIPTION)
    : text;
}

function countNode(node: RTop): number {
  switch (node.kind) {
    case "section":
      return 1 + node.texts.length + 1;
    case "actions":
      return 1 + node.buttons.length + (node.select ? 1 : 0);
    case "container":
      return 1 + node.children.reduce((sum, child) => sum + countNode(child), 0);
    default:
      return 1;
  }
}

// ==================== BUILDER ====================

/**
 * Turns a stored layout into the payload of a Components V2 message.
 *
 * Placeholders are substituted with `context` (the same variables embeds use) and the result is
 * validated again, because substitution can make a stored value invalid. Whatever cannot be
 * rendered is dropped or degraded instead of throwing (see docs/COMPONENTS_V2.md), and the 40
 * component / 4000 character limits are enforced by cutting from the end.
 *
 * The payload never carries `content`, `embeds`, `stickers` or `poll`: Discord rejects them next to
 * the `IsComponentsV2` flag. Returns `null` when nothing renderable is left.
 */
export function buildLayoutPayload(
  layout: LayoutCustom,
  library: LayoutBuildLibrary,
  context?: VariableContext,
  options: LayoutBuildOptions = {},
): LayoutPayload | null {
  const warn = (message: string) => options.onWarn?.(`Layout "${layout?.id}": ${message}`);

  const buttons = new Map<string, ButtonCustom>();
  for (const button of library?.buttons ?? []) buttons.set(button.id, button);
  const selectMenus = new Map<string, SelectMenuCustom>();
  for (const menu of library?.selectMenus ?? []) selectMenus.set(menu.id, menu);

  const sub = (value: unknown): string =>
    typeof value === "string" ? substituteVariables(value, context) : "";

  // ---------- resolve: substitute, re-validate, degrade ----------

  const resolveText = (value: unknown): string | null => {
    const text = sub(value);
    return text.trim() === "" ? null : text;
  };

  const resolveButton = (id: unknown): RButton | null => {
    const data = typeof id === "string" ? buttons.get(id) : undefined;
    if (!data) {
      warn(`button "${String(id)}" does not exist anymore, skipped`);
      return null;
    }
    try {
      const builder = new CustomButton(data).getButton();
      builder.toJSON(); // throws when Discord would reject it (link without url, no label ...)
      return { id: data.id, builder };
    } catch (error) {
      warn(`button "${data.id}" is invalid, skipped (${(error as Error).message})`);
      return null;
    }
  };

  const resolveSelect = (id: unknown): RSelect | null => {
    const data = typeof id === "string" ? selectMenus.get(id) : undefined;
    if (!data) {
      warn(`select menu "${String(id)}" does not exist anymore, skipped`);
      return null;
    }
    try {
      const builder = new CustomSelectMenu(data).getSelectMenu();
      const optionCount = builder.options.length;
      // the builder alone accepts a menu without options, Discord does not
      if (optionCount < 1 || optionCount > 25) throw new Error(`${optionCount} options`);
      builder.toJSON();
      return { id: data.id, builder };
    } catch (error) {
      warn(`select menu "${data.id}" is invalid, skipped (${(error as Error).message})`);
      return null;
    }
  };

  const resolveChild = (child: LayoutContainerChild | undefined): RChild[] => {
    if (!child || typeof child !== "object") return [];

    switch (child.type) {
      case "text": {
        const content = resolveText(child.content);
        return content === null ? [] : [{ kind: "text", content }];
      }

      case "separator":
        return [
          {
            kind: "separator",
            divider: child.divider !== false,
            spacing:
              child.spacing === "large" ? SeparatorSpacingSize.Large : SeparatorSpacingSize.Small,
          },
        ];

      case "gallery": {
        const items: RGalleryItem[] = [];
        for (const item of Array.isArray(child.items) ? child.items : []) {
          const url = sub(item?.url).trim();
          if (!isHttpUrl(url)) {
            warn(`gallery item dropped, "${url}" is not a valid http(s) URL after substitution`);
            continue;
          }
          if (items.length >= LAYOUT_LIMITS.MAX_GALLERY_ITEMS) break;
          items.push({
            url,
            description: cutDescription(sub(item.description)),
            spoiler: item.spoiler === true,
          });
        }
        return items.length > 0 ? [{ kind: "gallery", items }] : [];
      }

      case "section": {
        const texts: string[] = [];
        for (const raw of Array.isArray(child.texts) ? child.texts : []) {
          const text = resolveText(raw);
          if (text !== null && texts.length < LAYOUT_LIMITS.MAX_SECTION_TEXTS) texts.push(text);
        }
        if (texts.length === 0) return [];

        const asPlainText = (): RChild[] => texts.map((content) => ({ kind: "text", content }));
        const accessory = child.accessory;

        if (accessory?.kind === "thumbnail") {
          const url = sub(accessory.url).trim();
          if (!isHttpUrl(url)) {
            warn(
              `section thumbnail "${url}" is not a valid http(s) URL after substitution, rendered as plain text`,
            );
            return asPlainText();
          }
          return [
            {
              kind: "section",
              texts,
              accessory: {
                kind: "thumbnail",
                url,
                description: cutDescription(sub(accessory.description)),
                spoiler: accessory.spoiler === true,
              },
            },
          ];
        }

        if (accessory?.kind === "button") {
          const button = resolveButton(accessory.buttonId);
          if (!button) return asPlainText();
          return [{ kind: "section", texts, accessory: { kind: "button", button } }];
        }

        warn("section without a usable accessory, rendered as plain text");
        return asPlainText();
      }

      case "actions": {
        const rowButtons: RButton[] = [];
        for (const id of Array.isArray(child.buttons) ? child.buttons : []) {
          if (rowButtons.length >= LAYOUT_LIMITS.MAX_BUTTONS_PER_ROW) {
            warn("row has more than 5 buttons, the rest was dropped");
            break;
          }
          const button = resolveButton(id);
          if (button) rowButtons.push(button);
        }

        const select = child.selectMenuId ? resolveSelect(child.selectMenuId) : null;
        const rows: RChild[] = [];
        // A select menu must be alone in its row: a mixed row becomes two rows.
        if (rowButtons.length > 0) rows.push({ kind: "actions", buttons: rowButtons });
        if (select) rows.push({ kind: "actions", buttons: [], select });
        return rows;
      }

      default:
        warn(`unknown component type "${(child as { type?: string }).type}", skipped`);
        return [];
    }
  };

  const resolveTop = (component: LayoutComponent | undefined): RTop[] => {
    if (!component || typeof component !== "object") return [];

    if (component.type !== "container") return resolveChild(component);

    const children: RChild[] = [];
    for (const child of Array.isArray(component.children) ? component.children : []) {
      if ((child as { type?: string })?.type === "container") {
        warn("nested container skipped");
        continue;
      }
      children.push(...resolveChild(child));
    }
    if (children.length === 0) return [];

    return [
      {
        kind: "container",
        accentColor: isLayoutAccentColor(component.accentColor)
          ? layoutAccentToInt(component.accentColor)
          : undefined,
        spoiler: component.spoiler === true,
        children,
      },
    ];
  };

  const resolved: RTop[] = [];
  for (const component of Array.isArray(layout?.components) ? layout.components : []) {
    resolved.push(...resolveTop(component));
  }

  // ---------- fit: keep the longest prefix within the component cap ----------

  const fitted: RTop[] = [];
  let usedComponents = 0;
  let full = false;

  for (const node of resolved) {
    if (full) break;

    if (node.kind === "container") {
      const children: RChild[] = [];
      let inner = usedComponents + 1;
      for (const child of node.children) {
        const size = countNode(child);
        if (inner + size > LAYOUT_LIMITS.MAX_COMPONENTS) {
          full = true;
          break;
        }
        inner += size;
        children.push(child);
      }
      if (children.length > 0) {
        fitted.push({ ...node, children });
        usedComponents = inner;
      }
    } else {
      const size = countNode(node);
      if (usedComponents + size > LAYOUT_LIMITS.MAX_COMPONENTS) {
        full = true;
        break;
      }
      usedComponents += size;
      fitted.push(node);
    }
  }

  if (full)
    warn(`more than ${LAYOUT_LIMITS.MAX_COMPONENTS} components, the last ones were dropped`);

  // ---------- finalize: text budget, unique custom ids, no empty leftovers ----------
  // Only ever removes things, so the component cap keeps holding.

  const usedIds = new Set<string>();
  let usedText = 0;
  let textCut = false;

  const takeText = (text: string): string => {
    const remaining = LAYOUT_LIMITS.MAX_TEXT_LENGTH - usedText;
    if (remaining <= 0) {
      textCut = true;
      return "";
    }

    let out = text;
    if (text.length > remaining) {
      textCut = true;
      out = text.slice(0, remaining);
      // Do not leave half of a surrogate pair (emoji) behind.
      const last = out.charCodeAt(out.length - 1);
      if (last >= 0xd800 && last <= 0xdbff) out = out.slice(0, -1);
    }
    usedText += out.length;
    return out.trim() === "" ? "" : out;
  };

  const claim = (id: string): boolean => {
    if (usedIds.has(id)) {
      warn(`"${id}" is used twice in the message, the second one was skipped`);
      return false;
    }
    usedIds.add(id);
    return true;
  };

  const finalizeChild = (child: RChild): RChild[] => {
    switch (child.kind) {
      case "text": {
        const content = takeText(child.content);
        return content ? [{ kind: "text", content }] : [];
      }

      case "section": {
        const texts = child.texts.map(takeText).filter((text) => text !== "");
        if (texts.length === 0) return [];
        const accessory = child.accessory;
        if (accessory.kind === "button" && !claim(accessory.button.id)) {
          return texts.map((content) => ({ kind: "text", content }));
        }
        return [{ ...child, texts }];
      }

      case "actions": {
        const rowButtons = child.buttons.filter((button) => claim(button.id));
        const select = child.select && claim(child.select.id) ? child.select : undefined;
        if (rowButtons.length === 0 && !select) return [];
        return [{ kind: "actions", buttons: rowButtons, select }];
      }

      default:
        return [child];
    }
  };

  const finalized: RTop[] = [];
  for (const node of fitted) {
    if (node.kind === "container") {
      const children = node.children.flatMap(finalizeChild);
      if (children.length > 0) finalized.push({ ...node, children });
    } else {
      finalized.push(...finalizeChild(node));
    }
  }

  if (textCut)
    warn(
      `text is longer than ${LAYOUT_LIMITS.MAX_TEXT_LENGTH} characters, the last blocks were cut`,
    );

  // ---------- build ----------

  const buildChild = (child: RChild) => {
    switch (child.kind) {
      case "text":
        return new TextDisplayBuilder().setContent(child.content);

      case "separator":
        return new SeparatorBuilder().setDivider(child.divider).setSpacing(child.spacing);

      case "gallery":
        return new MediaGalleryBuilder().addItems(
          child.items.map((item) => {
            const built = new MediaGalleryItemBuilder().setURL(item.url).setSpoiler(item.spoiler);
            return item.description ? built.setDescription(item.description) : built;
          }),
        );

      case "section": {
        const section = new SectionBuilder().addTextDisplayComponents(
          child.texts.map((content) => new TextDisplayBuilder().setContent(content)),
        );
        if (child.accessory.kind === "button") {
          return section.setButtonAccessory(child.accessory.button.builder);
        }
        const thumbnail = new ThumbnailBuilder()
          .setURL(child.accessory.url)
          .setSpoiler(child.accessory.spoiler);
        if (child.accessory.description) thumbnail.setDescription(child.accessory.description);
        return section.setThumbnailAccessory(thumbnail);
      }

      case "actions": {
        const row = new ActionRowBuilder<MessageActionRowComponentBuilder>();
        if (child.select) row.addComponents(child.select.builder);
        else row.addComponents(child.buttons.map((button) => button.builder));
        return row;
      }
    }
  };

  const buildTop = (node: RTop): LayoutTopLevelBuilder => {
    if (node.kind !== "container") return buildChild(node);

    const container = new ContainerBuilder().setSpoiler(node.spoiler);
    if (node.accentColor !== undefined) container.setAccentColor(node.accentColor);

    for (const child of node.children) {
      const built = buildChild(child);
      if (built instanceof TextDisplayBuilder) container.addTextDisplayComponents(built);
      else if (built instanceof SeparatorBuilder) container.addSeparatorComponents(built);
      else if (built instanceof MediaGalleryBuilder) container.addMediaGalleryComponents(built);
      else if (built instanceof SectionBuilder) container.addSectionComponents(built);
      else container.addActionRowComponents(built);
    }
    return container;
  };

  const components: LayoutTopLevelBuilder[] = [];
  for (const node of finalized) {
    try {
      const built = buildTop(node);
      built.toJSON(); // last line of defence: the builders validate like the API does
      components.push(built);
    } catch (error) {
      warn(`a ${node.kind} could not be built and was skipped (${(error as Error).message})`);
    }
  }

  if (components.length === 0) return null;

  return { components, flags: MessageFlags.IsComponentsV2 };
}
