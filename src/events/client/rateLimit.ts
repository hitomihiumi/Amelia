import { Client } from "discord.js";

module.exports = (client: Client, rateLimitData: any) => {
    console.log(JSON.stringify(rateLimitData).grey.italic.dim);
}
