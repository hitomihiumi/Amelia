import { Client } from "discord.js";

module.exports = (client: Client, error: any) => {
  console.log(String(error).yellow.dim);
};
