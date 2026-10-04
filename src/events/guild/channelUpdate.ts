import { Client, GuildChannel } from "discord.js";
import { AuditLogger, channelMention } from "../../helpers/audit";

module.exports = async (client: Client, oldChannel: GuildChannel, newChannel: GuildChannel) => {
  if (!newChannel.guild) return;
  if (oldChannel.name === newChannel.name) return;

  const audit = new AuditLogger(client, newChannel.guild);

  await audit.log("channel_update", {
    header: await audit.t("audit.events.channel_update", channelMention(newChannel.id)),
    lines: [
      { label: await audit.t("audit.fields.old_name"), value: oldChannel.name },
      { label: await audit.t("audit.fields.new_name"), value: newChannel.name },
    ],
    footer: await audit.t("audit.footer.channel", newChannel.id),
    sourceChannelId: newChannel.id,
  });
};
