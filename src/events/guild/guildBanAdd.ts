import { AuditLogEvent, Client, GuildBan } from "discord.js";
import { AuditLogger, describeUser } from "../../helpers/audit";

module.exports = async (client: Client, ban: GuildBan) => {
  const audit = new AuditLogger(client, ban.guild);
  const entry = await audit.fetchExecutor(AuditLogEvent.MemberBanAdd, ban.user.id);

  const reason = ban.reason || entry?.reason || (await audit.t("audit.none"));

  await audit.log("member_ban", {
    header: await audit.t("audit.events.member_ban", `<@${ban.user.id}>`, ban.user.username),
    lines: [
      {
        label: await audit.t("audit.fields.moderator"),
        value: describeUser(entry?.executor ?? null),
      },
      { label: await audit.t("audit.fields.reason"), value: reason },
    ],
    thumbnail: ban.user.displayAvatarURL({ size: 256 }),
    footer: await audit.t("audit.footer.member", ban.user.id),
    subject: { bot: ban.user.bot },
  });
};
