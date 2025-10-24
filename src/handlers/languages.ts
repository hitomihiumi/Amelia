import { Client } from "discord.js";

// This handler is deprecated and no longer used
// Language system has been replaced with i18n (see src/i18n/)
// Languages are now initialized in bot.ts using initializeI18n()

module.exports = async (client: Client) => {
    // No-op: i18n is initialized in bot.ts
    console.log("Legacy language handler called (deprecated)".gray);
};
