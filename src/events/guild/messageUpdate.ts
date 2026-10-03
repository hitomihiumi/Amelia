import { Client, Message, PartialMessage } from "discord.js";
import { AuditLogger, channelMention, describeUser, diffBlock } from "../../helpers/audit";

module.exports = async (
  client: Client,
  oldMessage: Message | PartialMessage,
  newMessage: Message,
) => {
  if (!newMessage.guild) return;

  // Embeds resolving after the fact also fire this event — only text edits matter.
  if (oldMessage.content === newMessage.content) return;

  const audit = new AuditLogger(client, newMessage.guild);

  await audit.log("message_edit", {
    header: await audit.t("audit.events.message_edit"),
    lines: [
      { label: await audit.t("audit.fields.author"), value: describeUser(newMessage.author) },
      { label: await audit.t("audit.fields.channel"), value: channelMention(newMessage.channelId) },
    ],
    fields: [
      {
        name: await audit.t("audit.fields.changes"),
        value:
          oldMessage.content === null
            ? await audit.t("audit.unavailable")
            : diffBlock(oldMessage.content, newMessage.content),
      },
    ],
    footer: await audit.t("audit.footer.message", newMessage.id),
    sourceChannelId: newMessage.channelId,
    subject: { bot: newMessage.author?.bot ?? false },
  });
};
