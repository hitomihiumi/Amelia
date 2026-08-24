import { AuditLogEvent, Client, GuildBan } from "discord.js";
import { AuditLogger, describeUser } from "../../helpers/audit";

module.exports = async (client: Client, ban: GuildBan) => {
  const audit = new AuditLogger(client, ban.guild);
  const entry = await audit.fetchExecutor(AuditLogEvent.MemberBanRemove, ban.user.id);

  await audit.log("member_unban", {
    header: await audit.t("audit.events.member_unban", `<@${ban.user.id}>`, ban.user.username),
    lines: [
      {
        label: await audit.t("audit.fields.moderator"),
        value: describeUser(entry?.executor ?? null),
      },
      {
        label: await audit.t("audit.fields.reason"),
        value: entry?.reason || (await audit.t("audit.none")),
      },
    ],
    thumbnail: ban.user.displayAvatarURL({ size: 256 }),
    footer: await audit.t("audit.footer.member", ban.user.id),
    subject: { bot: ban.user.bot },
  });
};
