import { ModifiedClient, ILanguage } from "../types/helpers";
import { Language } from "../helpers";
import fs from "fs";
import path from "path";

module.exports = async (client: ModifiedClient) => {
    let langs = fs.readdirSync(path.resolve(__dirname, `./../../locale/`)).filter((file) => file.endsWith(".json"));

    for (const file of langs) {
        const pull = require(path.resolve(__dirname, `./../../locale/${file}`)) as ILanguage;
        if (pull.code) {
            client.holder.languages[`${pull.code}`] = new Language(pull);
        } else {
            console.log(`Error loading ${file}`.bgRed);
            continue;
        }
    }
}
