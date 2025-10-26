import * as fs from "node:fs";
import { Client } from "discord.js";
import { Command } from "../types/helpers";
import path from "node:path";

module.exports = (client: Client) => {
  try {
    let amount = 0;
    fs.readdirSync(path.resolve(__dirname, "./../commands")).forEach((dir) => {
      const commands = fs
        .readdirSync(path.resolve(__dirname, `./../commands/${dir}`))
        .filter((file) => file.endsWith(".js"));
      for (const file of commands) {
        const pull = require(path.resolve(__dirname, `./../commands/${dir}/${file}`)) as Command;
        if (pull.name) {
          client.holder.cmds.commands.set(pull.name, pull);
          amount++;
        } else {
          console.log(`Error loading ${file} in ${dir}`.bgRed);
          continue;
        }
        if (pull.aliases && Array.isArray(pull.aliases))
          pull.aliases.forEach((alias) => client.holder.cmds.aliases.set(alias, pull.name));
      }
    });
    console.log(`Loaded `.green + `${amount}`.yellow + ` commands`.green);
  } catch (err: any) {
    console.error(String(err.stack).bgRed);
  }
};
