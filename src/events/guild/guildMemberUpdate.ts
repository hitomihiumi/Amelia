import { AuditLogEvent, Client, GuildMember, PartialGuildMember } from "discord.js";
import { AuditLogger, absoluteDate, describeUser, roleMentions } from "../../helpers/audit";

module.exports = async (
  client: Client,
  oldMember: GuildMember | PartialGuildMember,
  newMember: GuildMember,
) => {
  if (!newMember.guild) return;

  const audit = new AuditLogger(client, newMember.guild);
  const subject = { bot: newMember.user.bot, roleIds: [...newMember.roles.cache.keys()] };
  const footer = await audit.t("audit.footer.member", newMember.id);

  const added = newMember.roles.cache.filter((role) => !oldMember.roles.cache.has(role.id));
  const removed = oldMember.roles.cache.filter((role) => !newMember.roles.cache.has(role.id));

  if (added.size > 0 || removed.size > 0) {
    const entry = await audit.fetchExecutor(AuditLogEvent.MemberRoleUpdate, newMember.id);
    const none = await audit.t("audit.none");
    const lines = [];

    if (added.size > 0) {
      lines.push({
        label: await audit.t("audit.fields.roles_added"),
        value: roleMentions([...added.values()], none),
      });
    }
    if (removed.size > 0) {
      lines.push({
        label: await audit.t("audit.fields.roles_removed"),
        value: roleMentions([...removed.values()], none),
      });
    }
    if (entry?.executor) {
      lines.push({
        label: await audit.t("audit.fields.changed_by"),
        value: describeUser(entry.executor),
      });
    }

    await audit.log("member_roles", {
      header: await audit.t(
        "audit.events.member_roles",
        `<@${newMember.id}>`,
        newMember.user.username,
      ),
      lines,
      footer,
      subject,
    });
  }

  if (oldMember.nickname !== newMember.nickname) {
    const none = await audit.t("audit.none");

    await audit.log("member_nickname", {
      header: await audit.t(
        "audit.events.member_nickname",
        `<@${newMember.id}>`,
        newMember.user.username,
      ),
      lines: [
        { label: await audit.t("audit.fields.old_nickname"), value: oldMember.nickname || none },
        { label: await audit.t("audit.fields.new_nickname"), value: newMember.nickname || none },
      ],
      footer,
      subject,
    });
  }

  const timeoutStarted =
    newMember.communicationDisabledUntilTimestamp &&
    newMember.communicationDisabledUntilTimestamp !==
      oldMember.communicationDisabledUntilTimestamp &&
    newMember.communicationDisabledUntilTimestamp > Date.now();

  if (timeoutStarted) {
    const entry = await audit.fetchExecutor(AuditLogEvent.MemberUpdate, newMember.id);

    await audit.log("member_timeout", {
      header: await audit.t(
        "audit.events.member_timeout",
        `<@${newMember.id}>`,
        newMember.user.username,
      ),
      lines: [
        {
          label: await audit.t("audit.fields.until"),
          value: absoluteDate(newMember.communicationDisabledUntilTimestamp),
        },
        {
          label: await audit.t("audit.fields.moderator"),
          value: describeUser(entry?.executor ?? null),
        },
        {
          label: await audit.t("audit.fields.reason"),
          value: entry?.reason || (await audit.t("audit.none")),
        },
      ],
      footer,
      subject,
    });
  }
};
