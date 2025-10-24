import { REST, Routes, Guild as DJSGUILD, Client } from "discord.js";
import { Guild } from "../helpers";
import { commandLoader } from "./cmdLoaders";
module.exports = async (client: Client) => {
    try {
        let commands = new Array();
        const loader = commandLoader(client);

        commands = loader.load(commands);

        client.on("ready", async () => {
            if (!client.token) return;
            const rest = new REST({ version: '10' }).setToken(client.token);
            try {
                console.log('Started refreshing application (/) commands.'.yellow);
                client.guilds.cache.forEach( (guild) => {
                    let copyCMDS = changeDefaultPermission(commands, guild, client);;
                    if (!client.user) return;
                    rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: [] }).then(() => {
                        if (!client.user) return;
                        rest.put(Routes.applicationCommands(client.user.id), { body: copyCMDS });
                    })
                });

                console.log('Successfully reloaded application (/) commands.'.green);
            } catch (error: any) {
                console.log(String(error.stack).bgRed);
            }
        });
        client.on("guildCreate", async (guild) => {
            if (!client.token) return;
            const rest = new REST({ version: '10' }).setToken(client.token);
            try {
                console.log('Started refreshing application (/) commands.'.yellow);
                if (!client.user) return;
                await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: commands });

                console.log('Successfully reloaded application (/) commands.'.green);
            } catch (error: any) {
                console.log(String(error.stack).bgRed);
            }
        });
    } catch (e: any) {
        console.log(String(e.stack).bgRed);
    }
}

function changeDefaultPermission(cmds: any[], djsguild: DJSGUILD, client: Client) {
    const guild = new Guild(client, djsguild);
    const permissions = guild.get('permissions.commands');
    let copyCMDS = cmds;
    copyCMDS.forEach(async (cmd) => {
        if (permissions[cmd.name]) {
            if (permissions[cmd.name].permission) {
                cmd.default_member_permissions = String(permissions[cmd.name].permission);
            }
        }
    });
    return copyCMDS;
}