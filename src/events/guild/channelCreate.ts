import { Client, GuildChannel } from "discord.js";
import { AuditLogger, channelMention } from "../../helpers/audit";

module.exports = async (client: Client, channel: GuildChannel) => {
  if (!channel.guild) return;

  const audit = new AuditLogger(client, channel.guild);

  await audit.log("channel_create", {
    header: await audit.t("audit.events.channel_create", channelMention(channel.id)),
    lines: [{ label: await audit.t("audit.fields.type"), value: String(channel.type) }],
    footer: await audit.t("audit.footer.channel", channel.id),
  });
};
