import { Client, Role } from "discord.js";
import { AuditLogger } from "../../helpers/audit";

module.exports = async (client: Client, oldRole: Role, newRole: Role) => {
  const renamed = oldRole.name !== newRole.name;
  const recolored = oldRole.hexColor !== newRole.hexColor;
  const repermissioned = oldRole.permissions.bitfield !== newRole.permissions.bitfield;

  if (!renamed && !recolored && !repermissioned) return;

  const audit = new AuditLogger(client, newRole.guild);
  const lines = [];

  if (renamed) {
    lines.push(
      { label: await audit.t("audit.fields.old_name"), value: oldRole.name },
      { label: await audit.t("audit.fields.new_name"), value: newRole.name },
    );
  }
  if (recolored) {
    lines.push({
      label: await audit.t("audit.fields.type"),
      value: `${oldRole.hexColor} → ${newRole.hexColor}`,
    });
  }

  await audit.log("role_update", {
    header: await audit.t("audit.events.role_update", `<@&${newRole.id}>`),
    lines,
    footer: await audit.t("audit.footer.role", newRole.id),
  });
};
