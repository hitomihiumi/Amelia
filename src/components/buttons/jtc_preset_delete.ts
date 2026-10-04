import { Button } from "../../types/helpers";
import { Guild, User } from "../../helpers";
import { ButtonInteraction, Client, MessageFlags } from "discord.js";
import { t } from "../../i18n/helpers";
import { isTempChannelOwner, sanitizePresets } from "../../helpers/jtcPresets";
import {
  JTC_PRESET_DELETE_ID,
  buildPresetDeleteRow,
  isControlMessage,
} from "../../helpers/jtcPresetsUi";

/**
 * "Delete preset" button: replies with an ephemeral select of the caller's presets.
 * No ownership check is needed, since only the caller's own stored presets are touched.
 */
module.exports = {
  customId: JTC_PRESET_DELETE_ID,
  run: async (client: Client, interaction: ButtonInteraction) => {
    try {
      if (!interaction.guild) return;
      const guild = new Guild(client, interaction.guild);
      const lang = await guild.get("settings.language");

      const user = new User(client, interaction.user, interaction.guild);
      const presets = sanitizePresets(await user.get("presets.jtc"));

      if (presets.length === 0) {
        return interaction.reply({
          content: t(client, lang, "functions.join_to_create.preset.delete.none"),
          flags: MessageFlags.Ephemeral,
        });
      }

      // Only the channel owner's control message mirrors their presets, so only then
      // pass its id along to let the select refresh it afterwards.
      let controlMessageId: string | undefined;
      if (isControlMessage(client, interaction.message)) {
        const map = await guild.cache.get("temp.join_to_create.map");
        if (isTempChannelOwner(map, interaction.channelId, interaction.user.id)) {
          controlMessageId = interaction.message.id;
        }
      }

      await interaction.reply({
        content: t(client, lang, "functions.join_to_create.preset.delete.msg"),
        components: [buildPresetDeleteRow(client, lang, presets, controlMessageId)],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("[JTC] Preset delete button error:", error);
    }
  },
} as Button;
