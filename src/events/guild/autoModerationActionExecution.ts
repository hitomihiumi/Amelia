import { AutoModerationActionExecution, Client } from "discord.js";
import { handleAutoModerationExecution } from "../../handlers/autoModeration";

module.exports = async (client: Client, execution: AutoModerationActionExecution) => {
  try {
    await handleAutoModerationExecution(client, execution);
  } catch (error) {
    console.warn("[automod] could not handle a rule execution", error);
  }
};
