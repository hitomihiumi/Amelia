/**
 * Components V2 "layouts": a whole Discord message built from containers, sections, text,
 * separators, media galleries and rows of buttons or a select menu.
 *
 * Shared, byte for byte, between the bot (`src/types/helpers/Layout.ts`) and the dashboard
 * (`src/lib/db/types/Layout.ts`). It is deliberately free of imports so both can use it.
 * Interactive parts never carry their own definition: rows and section accessories point at
 * the stored buttons and select menus by id, which keeps `CI_*` custom ids and the scenario
 * triggers working exactly as they do for classic messages.
 */

export type LayoutSeparatorSpacing = "small" | "large";

/** Markdown text (Discord "Text Display"). */
export interface LayoutText {
  type: "text";
  id: string;
  content: string;
}

export interface LayoutSeparator {
  type: "separator";
  id: string;
  /** Draw a thin line. */
  divider: boolean;
  spacing: LayoutSeparatorSpacing;
}

export interface LayoutGalleryItem {
  url: string;
  description?: string;
  spoiler?: boolean;
}

/** Up to 10 images or videos shown as a mosaic. */
export interface LayoutGallery {
  type: "gallery";
  id: string;
  items: LayoutGalleryItem[];
}

export type LayoutSectionAccessory =
  | { kind: "thumbnail"; url: string; description?: string; spoiler?: boolean }
  | { kind: "button"; buttonId: string };

/** One to three text blocks next to a thumbnail or a button. */
export interface LayoutSection {
  type: "section";
  id: string;
  texts: string[];
  accessory: LayoutSectionAccessory;
}

/** A row holding up to five stored buttons, or exactly one stored select menu. */
export interface LayoutActions {
  type: "actions";
  id: string;
  buttons: string[];
  selectMenuId?: string | null;
}

export type LayoutContainerChild =
  | LayoutText
  | LayoutSeparator
  | LayoutGallery
  | LayoutSection
  | LayoutActions;

/** A framed card with an optional accent colour bar. Cannot be nested. */
export interface LayoutContainer {
  type: "container";
  id: string;
  /** `#rrggbb` or a 0..16777215 number. */
  accentColor?: string | number | null;
  spoiler?: boolean;
  children: LayoutContainerChild[];
}

export type LayoutComponent = LayoutContainerChild | LayoutContainer;

export interface LayoutCustom {
  id: string;
  /** Display name used in the dashboard. */
  name: string;
  components: LayoutComponent[];
}

// ==================== LIMITS ====================

/** Discord's documented Components V2 limits, plus our own sanity caps. */
export const LAYOUT_LIMITS = {
  MAX_LAYOUTS_PER_GUILD: 25,
  /** Every component counts, nested ones and buttons/selects included. */
  MAX_COMPONENTS: 40,
  /** Characters across all text displays of one message. */
  MAX_TEXT_LENGTH: 4000,
  MAX_GALLERY_ITEMS: 10,
  MAX_SECTION_TEXTS: 3,
  MAX_BUTTONS_PER_ROW: 5,
  MAX_MEDIA_DESCRIPTION: 1024,
  MAX_NAME_LENGTH: 80,
  MAX_URL_LENGTH: 2000,
} as const;

// ==================== HELPERS ====================

/** `{user.avatar}`, `{var.x}` ... — resolved by the bot when the message is sent. */
export const LAYOUT_PLACEHOLDER = /\{[a-zA-Z][\w.]*\}/;

export function hasPlaceholder(value: string): boolean {
  return LAYOUT_PLACEHOLDER.test(value);
}

/** An http(s) link, or something that will become one once placeholders are filled in. */
export function isLayoutMediaUrl(value: string): boolean {
  if (!value || value.length > LAYOUT_LIMITS.MAX_URL_LENGTH) return false;
  if (hasPlaceholder(value)) return true;
  return /^https?:\/\/\S+$/i.test(value);
}

export function isLayoutAccentColor(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return true;
  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 0 && value <= 0xffffff;
  }
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

/** Accent colour as the integer Discord wants, or `undefined` when none is set. */
export function layoutAccentToInt(value: string | number | null | undefined): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") return value;
  return Number.parseInt(value.trim().slice(1), 16);
}

function childComponentCount(child: LayoutContainerChild): number {
  switch (child.type) {
    case "section":
      // The section itself, its text displays and its accessory.
      return 1 + child.texts.length + 1;
    case "actions":
      return 1 + child.buttons.length + (child.selectMenuId ? 1 : 0);
    default:
      return 1;
  }
}

/** Total components as Discord counts them against the 40 component cap. */
export function countLayoutComponents(layout: Pick<LayoutCustom, "components">): number {
  let total = 0;

  for (const component of layout.components) {
    if (component.type === "container") {
      total += 1 + component.children.reduce((sum, child) => sum + childComponentCount(child), 0);
    } else {
      total += childComponentCount(component);
    }
  }

  return total;
}

function eachChild(
  layout: Pick<LayoutCustom, "components">,
  visit: (child: LayoutContainerChild, path: string) => void,
) {
  layout.components.forEach((component, index) => {
    if (component.type === "container") {
      component.children.forEach((child, childIndex) =>
        visit(child, `components[${index}].children[${childIndex}]`),
      );
    } else {
      visit(component, `components[${index}]`);
    }
  });
}

/** Characters across every text display (section texts included). */
export function countLayoutText(layout: Pick<LayoutCustom, "components">): number {
  let total = 0;

  eachChild(layout, (child) => {
    if (child.type === "text") total += child.content.length;
    if (child.type === "section") total += child.texts.reduce((sum, text) => sum + text.length, 0);
  });

  return total;
}

// ==================== VALIDATION ====================

export type LayoutIssueCode =
  | "nameLength"
  | "empty"
  | "tooManyComponents"
  | "textTooLong"
  | "textEmpty"
  | "galleryEmpty"
  | "galleryTooMany"
  | "mediaUrlInvalid"
  | "descriptionTooLong"
  | "sectionTexts"
  | "sectionAccessoryMissing"
  | "buttonMissing"
  | "selectMenuMissing"
  | "duplicateInteractive"
  | "rowEmpty"
  | "rowMixed"
  | "rowTooManyButtons"
  | "accentColorInvalid"
  | "duplicateId"
  | "unknownType";

export interface LayoutIssue {
  code: LayoutIssueCode;
  /** Where the problem is, e.g. `components[1].children[0]`. */
  path: string;
  params?: Record<string, string | number>;
}

/** What a layout may point at. Only ids matter. */
export interface LayoutLibrary {
  buttons: Array<{ id: string }>;
  selectMenus: Array<{ id: string }>;
}

/**
 * Collects every problem of a layout. Returns codes instead of messages so the dashboard can
 * translate them and the bot can log them; an empty list means the layout can be sent.
 * `knownLater` lets the dashboard accept references to items that are being created in the same save.
 */
export function collectLayoutIssues(
  layout: LayoutCustom,
  library: LayoutLibrary,
  options: { knownLater?: (id: string) => boolean } = {},
): LayoutIssue[] {
  const issues: LayoutIssue[] = [];
  const add = (code: LayoutIssueCode, path: string, params?: LayoutIssue["params"]) =>
    issues.push({ code, path, params });

  const name = typeof layout.name === "string" ? layout.name.trim() : "";
  if (name.length < 1 || name.length > LAYOUT_LIMITS.MAX_NAME_LENGTH) {
    add("nameLength", "name", { max: LAYOUT_LIMITS.MAX_NAME_LENGTH });
  }

  if (!Array.isArray(layout.components) || layout.components.length === 0) {
    add("empty", "components");
    return issues;
  }

  const buttonIds = new Set(library.buttons.map((button) => button.id));
  const selectIds = new Set(library.selectMenus.map((menu) => menu.id));
  const knownLater = options.knownLater ?? (() => false);

  const components = countLayoutComponents(layout);
  if (components > LAYOUT_LIMITS.MAX_COMPONENTS) {
    add("tooManyComponents", "components", {
      count: components,
      max: LAYOUT_LIMITS.MAX_COMPONENTS,
    });
  }

  const textLength = countLayoutText(layout);
  if (textLength > LAYOUT_LIMITS.MAX_TEXT_LENGTH) {
    add("textTooLong", "components", { length: textLength, max: LAYOUT_LIMITS.MAX_TEXT_LENGTH });
  }

  const blockIds = new Set<string>();
  const used = new Set<string>(); // custom ids already placed: Discord rejects duplicates

  const place = (id: string, path: string) => {
    if (used.has(id)) add("duplicateInteractive", path, { id });
    used.add(id);
  };
  const checkButton = (id: string, path: string) => {
    if (!buttonIds.has(id) && !knownLater(id)) add("buttonMissing", path, { id });
    place(id, path);
  };
  const checkMedia = (url: unknown, description: unknown, path: string) => {
    if (typeof url !== "string" || !isLayoutMediaUrl(url)) add("mediaUrlInvalid", path);
    if (typeof description === "string" && description.length > LAYOUT_LIMITS.MAX_MEDIA_DESCRIPTION) {
      add("descriptionTooLong", path, { max: LAYOUT_LIMITS.MAX_MEDIA_DESCRIPTION });
    }
  };

  const checkChild = (child: LayoutContainerChild, path: string) => {
    switch (child.type) {
      case "text":
        if (typeof child.content !== "string" || child.content.trim() === "") add("textEmpty", path);
        break;

      case "separator":
        break;

      case "gallery":
        if (!Array.isArray(child.items) || child.items.length === 0) add("galleryEmpty", path);
        else {
          if (child.items.length > LAYOUT_LIMITS.MAX_GALLERY_ITEMS) {
            add("galleryTooMany", path, { max: LAYOUT_LIMITS.MAX_GALLERY_ITEMS });
          }
          child.items.forEach((item, i) => checkMedia(item.url, item.description, `${path}.items[${i}]`));
        }
        break;

      case "section": {
        const texts = Array.isArray(child.texts) ? child.texts : [];
        if (texts.length < 1 || texts.length > LAYOUT_LIMITS.MAX_SECTION_TEXTS) {
          add("sectionTexts", path, { max: LAYOUT_LIMITS.MAX_SECTION_TEXTS });
        }
        texts.forEach((text, i) => {
          if (typeof text !== "string" || text.trim() === "") add("textEmpty", `${path}.texts[${i}]`);
        });

        if (!child.accessory) add("sectionAccessoryMissing", path);
        else if (child.accessory.kind === "thumbnail") {
          checkMedia(child.accessory.url, child.accessory.description, `${path}.accessory`);
        } else if (child.accessory.kind === "button") {
          checkButton(child.accessory.buttonId, `${path}.accessory`);
        } else add("sectionAccessoryMissing", path);
        break;
      }

      case "actions": {
        const buttons = Array.isArray(child.buttons) ? child.buttons : [];
        if (child.selectMenuId && buttons.length > 0) add("rowMixed", path);
        else if (!child.selectMenuId && buttons.length === 0) add("rowEmpty", path);
        if (buttons.length > LAYOUT_LIMITS.MAX_BUTTONS_PER_ROW) {
          add("rowTooManyButtons", path, { max: LAYOUT_LIMITS.MAX_BUTTONS_PER_ROW });
        }
        buttons.forEach((id, i) => checkButton(id, `${path}.buttons[${i}]`));
        if (child.selectMenuId) {
          if (!selectIds.has(child.selectMenuId) && !knownLater(child.selectMenuId)) {
            add("selectMenuMissing", path, { id: child.selectMenuId });
          }
          place(child.selectMenuId, path);
        }
        break;
      }

      default:
        add("unknownType", path);
    }
  };

  layout.components.forEach((component, index) => {
    const path = `components[${index}]`;

    if (typeof component.id !== "string" || blockIds.has(component.id)) add("duplicateId", path);
    else blockIds.add(component.id);

    if (component.type === "container") {
      if (!isLayoutAccentColor(component.accentColor)) add("accentColorInvalid", path);
      if (!Array.isArray(component.children) || component.children.length === 0) add("empty", path);
      else {
        component.children.forEach((child, i) => {
          if (typeof child.id !== "string" || blockIds.has(child.id)) {
            add("duplicateId", `${path}.children[${i}]`);
          } else blockIds.add(child.id);

          if ((child as { type: string }).type === "container") {
            add("unknownType", `${path}.children[${i}]`);
          } else checkChild(child, `${path}.children[${i}]`);
        });
      }
    } else checkChild(component, path);
  });

  return issues;
}
