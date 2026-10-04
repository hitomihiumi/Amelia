import { Client, Role } from "discord.js";
import { AuditLogger } from "../../helpers/audit";

module.exports = async (client: Client, role: Role) => {
  const audit = new AuditLogger(client, role.guild);

  await audit.log("role_delete", {
    header: await audit.t("audit.events.role_delete", `**${role.name}**`),
    footer: await audit.t("audit.footer.role", role.id),
  });
};
