import { Client } from "discord.js";

module.exports = async (client: Client) => {
  let emojis = require("../../emojis.json");

  for (const emoji in emojis) {
    client.holder.emojis[emoji] = emojis[emoji];
  }
};
