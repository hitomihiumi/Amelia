import { AuditLogEvent, Client, GuildMember, PartialGuildMember } from "discord.js";
import { AuditLogger, describeUser } from "../../helpers/audit";
import { clearUserMemories } from "../../helpers/ai";

module.exports = async (client: Client, member: GuildMember | PartialGuildMember) => {
  if (!member.guild) return;

  // What the AI chat kept about a member goes with them.
  clearUserMemories(member.guild.id, member.id).catch((error) =>
    console.error("[AI] Could not clear the memories of a member who left:".red, error),
  );

  const audit = new AuditLogger(client, member.guild);

  // A kick looks exactly like a leave on the gateway; the audit log tells them apart.
  const kick = await audit.fetchExecutor(AuditLogEvent.MemberKick, member.id);

  if (kick) {
    return await audit.log("member_kick", {
      header: await audit.t("audit.events.member_kick", `<@${member.id}>`, member.user.username),
      lines: [
        { label: await audit.t("audit.fields.moderator"), value: describeUser(kick.executor) },
        {
          label: await audit.t("audit.fields.reason"),
          value: kick.reason || (await audit.t("audit.none")),
        },
      ],
      thumbnail: member.user.displayAvatarURL({ size: 256 }),
      footer: await audit.t("audit.footer.member", member.id),
      subject: { bot: member.user.bot },
    });
  }

  await audit.log("member_leave", {
    header: await audit.t("audit.events.member_leave", `<@${member.id}>`, member.user.username),
    thumbnail: member.user.displayAvatarURL({ size: 256 }),
    footer: await audit.t("audit.footer.member", member.id),
    subject: { bot: member.user.bot, roleIds: [...member.roles.cache.keys()] },
  });
};
