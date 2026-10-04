import { Client, GuildMember } from "discord.js";
import { AuditLogger, absoluteDate } from "../../helpers/audit";

module.exports = async (client: Client, member: GuildMember) => {
  if (!member.guild) return;

  const audit = new AuditLogger(client, member.guild);

  await audit.log("member_join", {
    header: await audit.t("audit.events.member_join", `<@${member.id}>`, member.user.username),
    lines: [
      {
        label: await audit.t("audit.fields.registered"),
        value: absoluteDate(member.user.createdTimestamp),
      },
    ],
    thumbnail: member.user.displayAvatarURL({ size: 256 }),
    footer: await audit.t("audit.footer.member", member.id),
    subject: { bot: member.user.bot },
  });
};
