import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Message,
  MessageActionRowComponentBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { t } from "../i18n/helpers";
import type { JTCPreset } from "../types/helpers/UserSchema";
import { JTC_PRESET_LIMIT, presetSummary } from "./jtcPresets";

export const JTC_PRESET_SELECT_ID = "I_jtc:preset";
export const JTC_PRESET_SAVE_ID = "I_jtc:preset_save";
export const JTC_PRESET_DELETE_ID = "I_jtc:preset_delete";
export const JTC_PRESET_DELETE_SELECT_ID = "I_jtc:preset_delete_select";
/** Value of the placeholder option shown when the user has no presets. */
export const JTC_PRESET_NONE = "none";

function summaryOf(client: Client, lang: string, preset: JTCPreset): string {
  return presetSummary(preset, {
    limit: (n) => t(client, lang, "functions.join_to_create.preset.summary.limit", n),
    unlimited: t(client, lang, "functions.join_to_create.preset.summary.unlimited"),
    bitrate: (kbps) => t(client, lang, "functions.join_to_create.preset.summary.bitrate", kbps),
  });
}

function presetOptions(client: Client, lang: string, presets: JTCPreset[]) {
  return presets.map((preset) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(preset.name.slice(0, 100))
      .setValue(preset.id)
      .setDescription((preset.description || summaryOf(client, lang, preset)).slice(0, 100)),
  );
}

/** Row 3 of the control message: the "apply preset" select. */
export function buildPresetSelectRow(
  client: Client,
  lang: string,
  presets: JTCPreset[],
): ActionRowBuilder<MessageActionRowComponentBuilder> {
  const select = new StringSelectMenuBuilder()
    .setCustomId(JTC_PRESET_SELECT_ID)
    .setPlaceholder(t(client, lang, "functions.join_to_create.preset.placeholder"))
    .setMaxValues(1);

  if (presets.length > 0) {
    select.addOptions(presetOptions(client, lang, presets));
  } else {
    // A select needs at least one option; its handler explains how to save a preset.
    select.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(t(client, lang, "functions.join_to_create.preset.none"))
        .setValue(JTC_PRESET_NONE)
        .setDescription(t(client, lang, "functions.join_to_create.preset.none_description")),
    );
  }

  return new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(select);
}

/** Row 4 of the control message: save / delete buttons. */
export function buildPresetButtonsRow(
  client: Client,
  lang: string,
  presets: JTCPreset[],
): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
    new ButtonBuilder()
      .setCustomId(JTC_PRESET_SAVE_ID)
      .setStyle(ButtonStyle.Success)
      .setLabel(t(client, lang, "functions.join_to_create.preset.buttons.save")),
    new ButtonBuilder()
      .setCustomId(JTC_PRESET_DELETE_ID)
      .setStyle(ButtonStyle.Danger)
      .setLabel(t(client, lang, "functions.join_to_create.preset.buttons.delete"))
      .setDisabled(presets.length === 0),
  );
}

/** Ephemeral select listing the presets that can be deleted. */
export function buildPresetDeleteRow(
  client: Client,
  lang: string,
  presets: JTCPreset[],
  controlMessageId?: string,
): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
    new StringSelectMenuBuilder()
      .setCustomId(
        controlMessageId
          ? `${JTC_PRESET_DELETE_SELECT_ID}|${controlMessageId}`
          : JTC_PRESET_DELETE_SELECT_ID,
      )
      .setPlaceholder(t(client, lang, "functions.join_to_create.preset.delete.placeholder"))
      .setMaxValues(1)
      .setOptions(presetOptions(client, lang, presets.slice(0, JTC_PRESET_LIMIT))),
  );
}

/** True if `message` is a Join To Create control message posted by this bot. */
export function isControlMessage(client: Client, message: Message | null | undefined): boolean {
  if (!message || message.author?.id !== client.user?.id) return false;
  return message.components.some((row) =>
    "components" in row
      ? (row.components as { customId?: string | null }[]).some(
          (c) => c.customId === JTC_PRESET_SAVE_ID,
        )
      : false,
  );
}

/**
 * Re-renders the preset select + delete button on a control message (rows 3 and 4) and keeps
 * rows 1-2 untouched. Best effort: never throws, so a failure cannot break the main reply.
 */
export async function refreshControlMessage(
  client: Client,
  lang: string,
  message: Message | null | undefined,
  presets: JTCPreset[],
): Promise<void> {
  try {
    if (!message || !isControlMessage(client, message)) return;
    const keep = message.components
      .slice(0, 2)
      .map((row) => ActionRowBuilder.from(row as any) as ActionRowBuilder<any>);
    await message.edit({
      components: [
        ...keep,
        buildPresetSelectRow(client, lang, presets),
        buildPresetButtonsRow(client, lang, presets),
      ],
    });
  } catch (error) {
    console.error("[JTC] Failed to refresh preset controls:", error);
  }
}
