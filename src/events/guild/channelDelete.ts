import { Client, GuildChannel } from "discord.js";
import { AuditLogger } from "../../helpers/audit";

module.exports = async (client: Client, channel: GuildChannel) => {
  if (!channel.guild) return;

  const audit = new AuditLogger(client, channel.guild);

  await audit.log("channel_delete", {
    // The channel no longer exists, so a mention would render as a dead link.
    header: await audit.t("audit.events.channel_delete", `**${channel.name}**`),
    lines: [{ label: await audit.t("audit.fields.type"), value: String(channel.type) }],
    footer: await audit.t("audit.footer.channel", channel.id),
  });
};
