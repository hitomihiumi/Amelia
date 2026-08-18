import { Client, Guild as DiscordGuild } from "discord.js";
import { AuditLogger } from "../../helpers/audit";

module.exports = async (client: Client, oldGuild: DiscordGuild, newGuild: DiscordGuild) => {
  if (oldGuild.name === newGuild.name && oldGuild.iconURL() === newGuild.iconURL()) return;

  const audit = new AuditLogger(client, newGuild);
  const lines = [];

  if (oldGuild.name !== newGuild.name) {
    lines.push(
      { label: await audit.t("audit.fields.old_name"), value: oldGuild.name },
      { label: await audit.t("audit.fields.new_name"), value: newGuild.name },
    );
  }

  await audit.log("guild_update", {
    header: await audit.t("audit.events.guild_update"),
    lines,
    thumbnail: newGuild.iconURL({ size: 256 }),
    footer: await audit.t("audit.footer.guild", newGuild.id),
  });
};
