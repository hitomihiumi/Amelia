import { Button, Autocomplete, Modal, SelectMenu } from "../types/helpers";
import { Client } from "discord.js";
import { readdirSync } from "node:fs";
import path from "path";

module.exports = (client: Client) => {
  try {
    readdirSync(path.resolve(__dirname, "./../components/")).forEach((dir) => {
      const components = readdirSync(path.resolve(__dirname, `./../components/${dir}/`)).filter(
        (file) => file.endsWith(".js"),
      );
      for (const file of components) {
        const pull = require(path.resolve(__dirname, `./../components/${dir}/${file}`)) as
          | Button
          | Modal
          | SelectMenu
          | Autocomplete;
        if (pull.customId) {
          switch (dir) {
            case "buttons":
              client.holder.components.buttons.set(pull.customId, pull as Button);
              break;
            case "modals":
              client.holder.components.modals.set(pull.customId, pull as Modal);
              break;
            case "selectMenus":
              client.holder.components.selectMenus.set(pull.customId, pull as SelectMenu);
              break;
            case "autocompletes":
              client.holder.components.autocompletes.set(pull.customId, pull as Autocomplete);
              break;
          }
        } else {
          console.log(`Error loading ${file} in ${dir}`.bgRed);
          continue;
        }
      }
    });
    console.log(
      `Loaded `.green + `${client.holder.components.buttons.size}`.yellow + ` Buttons`.cyan,
    );
    console.log(
      `Loaded `.green + `${client.holder.components.modals.size}`.yellow + ` Modals`.cyan,
    );
    console.log(
      `Loaded `.green + `${client.holder.components.selectMenus.size}`.yellow + ` SelectMenus`.cyan,
    );
    console.log(
      `Loaded `.green +
        `${client.holder.components.autocompletes.size}`.yellow +
        ` Autocompletes`.cyan,
    );
  } catch (err: any) {
    console.error(String(err.stack).bgRed);
  }
};
