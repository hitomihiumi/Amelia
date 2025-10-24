import { Client } from "discord.js";
import { Component, SlashCommand, Manifest } from "../../types/helpers";
import {
  extendedPermissionCommand,
  onCoolDown,
  permissionCommand,
  permissionComponent,
} from "../../handlers/functions";
import { Guild } from "../../helpers";
import { t } from "../../i18n/helpers";

module.exports = async (client: Client, interaction: any) => {
  let guild = interaction.guild ? new Guild(client, interaction.guild) : undefined;
  let lang = guild ? await guild.get(`settings.language`) : "en";
  if (interaction.isCommand()) {
    guild = guild as Guild;
    if (interaction.acknowledged) {
      return;
    }
    const CategoryName = interaction.commandName;
    let command = undefined;
    try {
      if (client.holder.cmds.slashCommands.has(`${CategoryName}`)) {
        if (interaction.options.getSubcommand()) {
          command = (client.holder.cmds.slashCommands.get(`${CategoryName}`) as unknown as Manifest)
            .commands[`${interaction.options.getSubcommand()}`] as unknown as SlashCommand;
        } else {
          command = client.holder.cmds.slashCommands.get(
            `${CategoryName}`,
          ) as unknown as SlashCommand;
        }
      }
    } catch {
      if (client.holder.cmds.slashCommands.has(`${CategoryName}`)) {
        command = client.holder.cmds.slashCommands.get(
          `${CategoryName}`,
        ) as unknown as SlashCommand;
      }
    }
    if (command) {
      if (command.permissions) {
        if (!permissionCommand(client, interaction, lang, command)) return;
        if (!extendedPermissionCommand(guild, interaction, lang, command.name)) return;
      } else if (onCoolDown(interaction, command, client)) {
        return interaction.reply({
          ephemeral: true,
          embeds: [
            client.holder.embed.info(
              lang,
              t(
                client,
                lang,
                "events.interaction_create.cooldown",
                onCoolDown(interaction, command, client),
                command.name,
              ),
            ),
          ],
        });
      }
      await command.run(client, interaction);
    }
  } else if (interaction.customId.startsWith("I_")) {
    if (interaction.acknowledged) {
      return;
    }
    const componentPermission = async (component: Component) => {
      if (
        component.options?.public === false &&
        interaction.user.id !== interaction.message.interaction.user.id
      ) {
        await interaction.reply({
          embeds: [
            client.holder.embed.info(
              lang,
              t(client, lang, "events.interaction_create.component_permission"),
            ),
          ],
          ephemeral: true,
        });
        return false;
      } else if (component.permissions) {
        return permissionComponent(client, interaction, lang, component);
      }

      return true;
    };

    if (interaction.isButton()) {
      const component = client.holder.components.buttons.get(interaction.customId);

      if (!component)
        return interaction.reply({
          embeds: [
            client.holder.embed.info(
              lang,
              t(client, lang, "events.interaction_create.component_not_active"),
            ),
          ],
          ephemeral: true,
        });

      if (!(await componentPermission(component))) return;

      try {
        component.run(client, interaction);
      } catch (error: any) {
        console.log(String(error.stack).bgRed);
      }

      return;
    }

    if (interaction.isAnySelectMenu()) {
      const component = client.holder.components.selectMenus.get(interaction.customId);

      if (!component)
        return interaction.reply({
          embeds: [
            client.holder.embed.info(
              lang,
              t(client, lang, "events.interaction_create.component_not_active"),
            ),
          ],
          ephemeral: true,
        });

      if (!(await componentPermission(component))) return;

      try {
        component.run(client, interaction);
      } catch (error: any) {
        console.log(String(error.stack).bgRed);
      }

      return;
    }

    if (interaction.isModalSubmit()) {
      const component = client.holder.components.modals.get(interaction.customId);

      if (!component)
        return interaction.reply({
          embeds: [
            client.holder.embed.info(
              lang,
              t(client, lang, "events.interaction_create.component_not_active"),
            ),
          ],
          ephemeral: true,
        });

      try {
        component.run(client, interaction);
      } catch (error: any) {
        console.log(String(error.stack).bgRed);
      }

      return;
    }

    if (interaction.isAutocomplete()) {
      const component = client.holder.components.autocompletes.get(interaction.commandName);

      if (!component)
        return interaction.reply({
          embeds: [
            client.holder.embed.info(
              lang,
              t(client, lang, "events.interaction_create.component_not_active"),
            ),
          ],
          ephemeral: true,
        });

      try {
        component.run(client, interaction);
      } catch (error: any) {
        console.log(String(error.stack).bgRed);
      }

      return;
    }
  } else if (interaction.customId.startsWith(`CI_${interaction.guild.id}_`)) {
  }
};
