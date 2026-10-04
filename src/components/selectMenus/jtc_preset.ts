import { SelectMenu } from "../../types/helpers";
import { Guild, User } from "../../helpers";
import {
  Client,
  GuildMember,
  MessageFlags,
  OverwriteType,
  PermissionsBitField,
  StringSelectMenuInteraction,
  VoiceBasedChannel,
} from "discord.js";
import { t } from "../../i18n/helpers";
import {
  JTC_CHANNEL_NAME_MAX,
  JTC_PRESET_LIMIT,
  buildApplyOverwrites,
  clampBitrate,
  isTempChannelOwner,
  sanitizePresets,
} from "../../helpers/jtcPresets";
import { JTC_PRESET_NONE, JTC_PRESET_SELECT_ID } from "../../helpers/jtcPresetsUi";
import type { JTCPresetOverwrite } from "../../types/helpers/UserSchema";

/**
 * Applies a saved Join To Create preset (name, user limit, bitrate, region, permissions)
 * to the caller's temporary channel. Owner only. Presets are re-read from the database.
 */
module.exports = {
  customId: JTC_PRESET_SELECT_ID,
  permissions: {
    bot: [PermissionsBitField.Flags.ManageChannels],
  },
  run: async (client: Client, interaction: StringSelectMenuInteraction) => {
    try {
      if (!interaction.guild) return;
      if (!(interaction.member instanceof GuildMember)) return;
      const voiceChannel = interaction.member.voice?.channel;
      if (!voiceChannel) return;

      const guild = new Guild(client, interaction.guild);
      const lang = await guild.get("settings.language");
      const presetId = interaction.values[0];

      if (presetId === JTC_PRESET_NONE) {
        return interaction.reply({
          content: t(client, lang, "functions.join_to_create.preset.none_hint", JTC_PRESET_LIMIT),
          flags: MessageFlags.Ephemeral,
        });
      }

      const map = await guild.cache.get("temp.join_to_create.map");
      if (!isTempChannelOwner(map, voiceChannel.id, interaction.user.id)) {
        return interaction.reply({
          content: t(client, lang, "functions.join_to_create.errors.not_owner"),
          flags: MessageFlags.Ephemeral,
        });
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      try {
        const user = new User(client, interaction.user, interaction.guild);
        const preset = sanitizePresets(await user.get("presets.jtc")).find(
          (p) => p.id === presetId,
        );
        if (!preset) {
          return interaction.editReply({
            content: t(client, lang, "functions.join_to_create.preset.apply.not_found"),
          });
        }

        const channel = voiceChannel as VoiceBasedChannel;
        const failed: string[] = [];
        const part = (key: string) =>
          t(client, lang, `functions.join_to_create.preset.apply.parts.${key}` as any);
        const attempt = async (key: string, fn: () => Promise<unknown>) => {
          try {
            await fn();
          } catch (error) {
            console.error(`[JTC] Preset ${key} failed:`, error);
            failed.push(part(key));
          }
        };

        const { name, userLimit, bitrate, rtcRegion } = preset.channel;
        const newName = name.slice(0, JTC_CHANNEL_NAME_MAX);
        const newBitrate = clampBitrate(bitrate, interaction.guild.maximumBitrate);

        // Channel renames are rate limited (2 per 10 minutes); each part reports on its own.
        if (channel.name !== newName) await attempt("name", () => channel.setName(newName));
        if (channel.userLimit !== userLimit) {
          await attempt("user_limit", () => channel.setUserLimit(userLimit));
        }
        if (channel.bitrate !== newBitrate) {
          await attempt("bitrate", () => channel.setBitrate(newBitrate));
        }
        if ((channel.rtcRegion ?? null) !== rtcRegion) {
          await attempt("region", () => channel.setRTCRegion(rtcRegion));
        }

        let skipped = 0;
        await attempt("permissions", async () => {
          const discordGuild = interaction.guild!;
          const exists = await resolveExisting(discordGuild, preset.channel.overwrites);
          const botId = client.user?.id;
          const keepExisting = channel.permissionOverwrites.cache.filter(
            (ow) =>
              ow.id === botId ||
              (ow.type === OverwriteType.Role && discordGuild.roles.cache.get(ow.id)?.managed),
          );
          const built = buildApplyOverwrites(preset.channel.overwrites, {
            ownerId: interaction.user.id,
            botId,
            exists: (entry) => exists.has(entry.id),
            keepExisting: keepExisting.values(),
          });
          skipped = built.skipped;
          await channel.permissionOverwrites.set(built.overwrites);
        });

        let content =
          failed.length === 0
            ? t(client, lang, "functions.join_to_create.preset.apply.success", preset.name)
            : t(
                client,
                lang,
                "functions.join_to_create.preset.apply.partial",
                preset.name,
                failed.join(", "),
              );
        if (skipped > 0) {
          content += `\n${t(client, lang, "functions.join_to_create.preset.apply.skipped", skipped)}`;
        }

        await interaction.editReply({ content });
      } catch (error) {
        console.error("[JTC] Failed to apply preset:", error);
        await interaction
          .editReply({ content: t(client, lang, "functions.join_to_create.preset.apply.failed") })
          .catch(() => undefined);
      }
    } catch (error) {
      console.error("[JTC] Preset select error:", error);
    }
  },
} as SelectMenu;

/** Ids of stored overwrites whose role / member still exists in the guild. */
async function resolveExisting(
  guild: NonNullable<StringSelectMenuInteraction["guild"]>,
  entries: JTCPresetOverwrite[],
): Promise<Set<string>> {
  const found = new Set<string>();
  await Promise.all(
    entries.map(async (entry) => {
      try {
        if (entry.id === guild.id) {
          found.add(entry.id);
        } else if (entry.type === "role") {
          const role = guild.roles.cache.get(entry.id) ?? (await guild.roles.fetch(entry.id));
          if (role) found.add(entry.id);
        } else {
          const member = guild.members.cache.get(entry.id) ?? (await guild.members.fetch(entry.id));
          if (member) found.add(entry.id);
        }
      } catch {
        // unknown role/member: dropped silently (counted as skipped)
      }
    }),
  );
  return found;
}
