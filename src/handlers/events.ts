import { ModifiedClient } from "../types/helpers";
import fs from "fs";
import path from "path";

module.exports = async (client: ModifiedClient) => {
    try {
        let amount = 0;
        const load_dir = (dir: any) => {
            const event_files = fs.readdirSync(path.resolve(__dirname, `./../events/${dir}`)).filter((file) => file.endsWith(".js"));
            for (const file of event_files) {
                try {
                    const event = require(path.resolve(__dirname, `./../events/${dir}/${file}`))
                    let eventName = file.split(".")[0];
                    client.client.on(eventName, event.bind(null, client));
                    amount++;
                    console.log(`Event Loaded: `.green + `${eventName}`.cyan);
                } catch (e) {
                    console.log(e)
                }
            }
        }
        await ["client", "guild"].forEach((e: any) => load_dir(e));
        console.log(`${amount}`.yellow + ` Events Loaded`.brightGreen);
        try {
            const stringlength2 = 69;
            console.log("\n")
            console.log(`     ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓`.yellow.bold)
            console.log(`     ┃ `.yellow.bold + " ".repeat(-1 + stringlength2 - ` ┃ `.length) + "┃".yellow.bold)
            console.log(`     ┃ Logging into the BOT...`.yellow.bold + " ".repeat(-1 + stringlength2 - ` ┃ `.length - `Logging into the BOT...`.length) + "┃".yellow.bold)
            console.log(`     ┃ `.yellow.bold + " ".repeat(-1 + stringlength2 - ` ┃ `.length) + "┃".yellow.bold)
            console.log(`     ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`.yellow.bold)
        } catch {
            /* */
        }
    } catch (err: any) {
        console.error(String(err.stack).bgRed);
    }
}
