import {ModifiedClient} from "../types/helpers";

module.exports = async (client: ModifiedClient) => {
    let emojis = require('../../emojis.json');

    for (const emoji in emojis) {
        client.holder.emojis[emoji] = emojis[emoji];
    }
}
