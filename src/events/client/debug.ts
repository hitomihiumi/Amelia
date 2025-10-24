import { Client } from "discord.js";

module.exports = (client: Client, info: any) => {
  console.log(String(info).grey);
};
