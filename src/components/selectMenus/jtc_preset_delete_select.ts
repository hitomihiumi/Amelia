import { SelectMenu } from "../../types/helpers";
import { Guild, User } from "../../helpers";
import { Client, StringSelectMenuInteraction } from "discord.js";
import { t } from "../../i18n/helpers";
import {
  isTempChannelOwner,
  removePreset,
  sanitizePresets,
  withPresetLock,
} from "../../helpers/jtcPresets";
import { JTC_PRESET_DELETE_SELECT_ID, refreshControlMessage } from "../../helpers/jtcPresetsUi";

/**
 * Removes the chosen preset from the caller's stored presets and updates the ephemeral reply.
 * The custom id may carry the control message id (`I_jtc:preset_delete_select|<messageId>`).
 */
module.exports = {
  customId: JTC_PRESET_DELETE_SELECT_ID,
  run: async (client: Client, interaction: StringSelectMenuInteraction) => {
    try {
      if (!interaction.guild) return;
      const guild = new Guild(client, interaction.guild);
      const lang = await guild.get("settings.language");
      const presetId = interaction.values[0];

      const user = new User(client, interaction.user, interaction.guild);
      const result = await withPresetLock(
        `${interaction.guild.id}:${interaction.user.id}`,
        async () => {
          const current = sanitizePresets(await user.get("presets.jtc"));
          const next = removePreset(current, presetId);
          if (next.removed) await user.set("presets.jtc", next.presets);
          return next;
        },
      );

      await interaction.update({
        content: result.removed
          ? t(client, lang, "functions.join_to_create.preset.delete.success", result.removed.name)
          : t(client, lang, "functions.join_to_create.preset.delete.not_found"),
        components: [],
      });

      // Best effort: refresh the control message's preset select / delete button.
      const messageId = interaction.customId.split("|")[1];
      if (result.removed && messageId && interaction.channel) {
        try {
          const map = await guild.cache.get("temp.join_to_create.map");
          if (isTempChannelOwner(map, interaction.channelId, interaction.user.id)) {
            const message = await interaction.channel.messages.fetch(messageId);
            await refreshControlMessage(client, lang, message, result.presets);
          }
        } catch (error) {
          console.error("[JTC] Failed to refresh control message after delete:", error);
        }
      }
    } catch (error) {
      console.error("[JTC] Preset delete select error:", error);
    }
  },
} as SelectMenu;
