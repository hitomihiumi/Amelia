import { Client, Collection, GuildTextBasedChannel, Message, PartialMessage } from "discord.js";
import { AuditLogger, channelMention } from "../../helpers/audit";

module.exports = async (
  client: Client,
  messages: Collection<string, Message | PartialMessage>,
  channel: GuildTextBasedChannel,
) => {
  if (!channel?.guild) return;

  const audit = new AuditLogger(client, channel.guild);

  await audit.log("message_bulk_delete", {
    header: await audit.t("audit.events.message_bulk_delete"),
    lines: [
      { label: await audit.t("audit.fields.channel"), value: channelMention(channel.id) },
      { label: await audit.t("audit.fields.count"), value: String(messages.size) },
    ],
    footer: await audit.t("audit.footer.channel", channel.id),
    sourceChannelId: channel.id,
  });
};
