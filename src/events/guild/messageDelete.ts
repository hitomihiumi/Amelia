import { Client, Message, PartialMessage } from "discord.js";
import { AuditLogger, channelMention, contentBlock, describeUser } from "../../helpers/audit";

module.exports = async (client: Client, message: Message | PartialMessage) => {
  if (!message.guild) return;

  const audit = new AuditLogger(client, message.guild);

  // Deletions the bot performed itself carry their reason (auto moderation, purge).
  const reason = AuditLogger.takeDeletionReason(message.id);

  const lines = [
    { label: await audit.t("audit.fields.author"), value: describeUser(message.author) },
    { label: await audit.t("audit.fields.channel"), value: channelMention(message.channelId) },
  ];

  if (reason) {
    lines.push({ label: await audit.t("audit.fields.reason"), value: reason });
  }

  const fields = [
    {
      name: await audit.t("audit.fields.message"),
      // The content is only known when the message was still in the cache.
      value: message.content ? contentBlock(message.content) : await audit.t("audit.unavailable"),
    },
  ];

  const attachments = [...(message.attachments?.values() ?? [])];
  if (attachments.length > 0) {
    fields.push({
      name: await audit.t("audit.fields.attachments"),
      value: attachments
        .map((attachment) => `[${attachment.name}](${attachment.url})`)
        .join("\n")
        .slice(0, 1024),
    });
  }

  await audit.log("message_delete", {
    header: await audit.t("audit.events.message_delete"),
    lines,
    fields,
    footer: await audit.t("audit.footer.message", message.id),
    sourceChannelId: message.channelId,
    subject: { bot: message.author?.bot ?? false },
  });
};
