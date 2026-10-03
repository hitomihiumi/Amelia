import { Button } from "../../types/helpers";
import { Guild, User } from "../../helpers";
import {
  ButtonInteraction,
  Client,
  GuildMember,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
  VoiceBasedChannel,
} from "discord.js";
import { t } from "../../i18n/helpers";
import {
  JTC_PRESET_DESCRIPTION_MAX,
  JTC_PRESET_LIMIT,
  JTC_PRESET_NAME_MAX,
  isTempChannelOwner,
  sanitizePresets,
  snapshotChannel,
  upsertPreset,
  withPresetLock,
} from "../../helpers/jtcPresets";
import { JTC_PRESET_SAVE_ID, refreshControlMessage } from "../../helpers/jtcPresetsUi";

const NAME_FIELD = "name";
const DESCRIPTION_FIELD = "description";

/**
 * "Save current settings" button of the Join To Create control message.
 * Owner only. Snapshots the temporary channel into one of the user's (max 5) presets;
 * saving under an existing name (case-insensitive) overwrites that preset in place.
 */
module.exports = {
  customId: JTC_PRESET_SAVE_ID,
  run: async (client: Client, interaction: ButtonInteraction) => {
    try {
      if (!interaction.guild) return;
      if (!(interaction.member instanceof GuildMember)) return;
      const voiceChannel = interaction.member.voice?.channel;
      if (!voiceChannel) return;

      const guild = new Guild(client, interaction.guild);
      const lang = await guild.get("settings.language");

      const map = await guild.cache.get("temp.join_to_create.map");
      if (!isTempChannelOwner(map, voiceChannel.id, interaction.user.id)) {
        return interaction.reply({
          content: t(client, lang, "functions.join_to_create.errors.not_owner"),
          flags: MessageFlags.Ephemeral,
        });
      }

      // Unique id per click so several open modals never answer each other.
      const modalId = `NI_jtc:preset_save:${interaction.id}`;
      await interaction.showModal(
        new ModalBuilder()
          .setCustomId(modalId)
          .setTitle(t(client, lang, "functions.join_to_create.preset.modal.title"))
          .setLabelComponents(
            new LabelBuilder()
              .setLabel(t(client, lang, "functions.join_to_create.preset.modal.name_label"))
              .setTextInputComponent(
                new TextInputBuilder()
                  .setCustomId(NAME_FIELD)
                  .setStyle(TextInputStyle.Short)
                  .setRequired(true)
                  .setMaxLength(JTC_PRESET_NAME_MAX)
                  .setPlaceholder(
                    t(client, lang, "functions.join_to_create.preset.modal.name_placeholder").slice(
                      0,
                      100,
                    ),
                  ),
              ),
            new LabelBuilder()
              .setLabel(t(client, lang, "functions.join_to_create.preset.modal.description_label"))
              .setTextInputComponent(
                new TextInputBuilder()
                  .setCustomId(DESCRIPTION_FIELD)
                  .setStyle(TextInputStyle.Short)
                  .setRequired(false)
                  .setMaxLength(JTC_PRESET_DESCRIPTION_MAX),
              ),
          ),
      );

      let submit: ModalSubmitInteraction;
      try {
        submit = await interaction.awaitModalSubmit({
          time: 5 * 60 * 1000,
          filter: (i) => i.user.id === interaction.user.id && i.customId === modalId,
        });
      } catch {
        return; // modal dismissed / timed out
      }

      try {
        await handleSubmit(client, lang, guild, interaction, submit, voiceChannel.id);
      } catch (error) {
        console.error("[JTC] Failed to save preset:", error);
        await reply(submit, t(client, lang, "functions.join_to_create.preset.save.failed"));
      }
    } catch (error) {
      console.error("[JTC] Preset save button error:", error);
    }
  },
} as Button;

async function reply(submit: ModalSubmitInteraction, content: string) {
  try {
    if (submit.replied || submit.deferred) await submit.editReply({ content });
    else await submit.reply({ content, flags: MessageFlags.Ephemeral });
  } catch (error) {
    console.error("[JTC] Failed to reply to preset modal:", error);
  }
}

async function handleSubmit(
  client: Client,
  lang: string,
  guild: Guild,
  interaction: ButtonInteraction,
  submit: ModalSubmitInteraction,
  channelId: string,
) {
  const discordGuild = interaction.guild!;
  const name = submit.fields.getTextInputValue(NAME_FIELD);
  const description = submit.fields.getTextInputValue(DESCRIPTION_FIELD);

  // The state may have changed while the modal was open: re-check ownership and the channel.
  const map = await guild.cache.get("temp.join_to_create.map");
  const channel = discordGuild.channels.cache.get(channelId) as VoiceBasedChannel | undefined;
  if (!channel || !channel.isVoiceBased() || !isTempChannelOwner(map, channelId, submit.user.id)) {
    return submit.reply({
      content: !channel
        ? t(client, lang, "functions.join_to_create.preset.save.channel_gone")
        : t(client, lang, "functions.join_to_create.errors.not_owner"),
      flags: MessageFlags.Ephemeral,
    });
  }

  const draft = snapshotChannel(
    {
      name: channel.name,
      userLimit: channel.userLimit,
      bitrate: channel.bitrate,
      rtcRegion: channel.rtcRegion,
      overwrites: channel.permissionOverwrites.cache.values(),
    },
    { name, description },
    {
      guildId: discordGuild.id,
      ownerId: submit.user.id,
      botId: client.user?.id,
      managedRoleIds: discordGuild.roles.cache.filter((r) => r.managed).keys(),
    },
  );
  if (!draft) {
    return submit.reply({
      content: t(client, lang, "functions.join_to_create.preset.save.failed"),
      flags: MessageFlags.Ephemeral,
    });
  }

  const user = new User(client, submit.user, discordGuild);

  // Read-modify-write under a per-user lock; presets are always re-read from the database.
  const result = await withPresetLock(`${discordGuild.id}:${submit.user.id}`, async () => {
    const current = sanitizePresets(await user.get("presets.jtc"));
    const upsert = upsertPreset(current, draft);
    if (upsert.ok) await user.set("presets.jtc", upsert.presets);
    return upsert;
  });

  if (!result.ok) {
    return submit.reply({
      content: t(
        client,
        lang,
        "functions.join_to_create.preset.save.limit_reached",
        JTC_PRESET_LIMIT,
      ),
      flags: MessageFlags.Ephemeral,
    });
  }

  await submit.reply({
    content: t(
      client,
      lang,
      result.updated
        ? "functions.join_to_create.preset.save.updated"
        : "functions.join_to_create.preset.save.saved",
      result.preset.name,
    ),
    flags: MessageFlags.Ephemeral,
  });

  // Best effort: show the new preset on the control message the button was on.
  await refreshControlMessage(client, lang, interaction.message, result.presets);
}
