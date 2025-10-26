import { ActivityType, Client } from "discord.js";
import { resolve } from "node:path";

module.exports = async (client: Client) => {
  try {
    try {
      const stringlength = 69;
      console.log("\n");
      console.log(
        `     ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓`.brightGreen
          .bold,
      );
      console.log(
        `     ┃ `.brightGreen.bold +
          " ".repeat(-1 + stringlength - ` ┃ `.length) +
          "┃".brightGreen.bold,
      );
      console.log(
        `     ┃ Discord Bot is online!`.brightGreen.bold +
          " ".repeat(-1 + stringlength - ` ┃ `.length - `Discord Bot is online!`.length) +
          "┃".brightGreen.bold,
      );
      console.log(
        `     ┃  /--/ ${client.user?.tag} /--/ `.brightGreen.bold +
          " ".repeat(-1 + stringlength - ` ┃ `.length - ` /--/ ${client.user?.tag} /--/ `.length) +
          "┃".brightGreen.bold,
      );
      console.log(
        `     ┃ `.brightGreen.bold +
          " ".repeat(-1 + stringlength - ` ┃ `.length) +
          "┃".brightGreen.bold,
      );
      console.log(
        `     ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`.brightGreen
          .bold,
      );
    } catch (e: any) {
      console.log(String(e.stack).bgRed);
    }

    let index = 0;
    setInterval(() => {
      const activities_list = [
        `I Love You!`,
        `Bot By hitomihiumi`,
        `I'm watching you`,
        `Do it faster, makes us stronger`,
        `Work it harder, make it better.`,
        `Open Beta Test | v${require(resolve("./package.json")).version}`,
      ];
      index = (index + 1) % activities_list.length;
      client.user?.setActivity(activities_list[index], {
        type: ActivityType.Streaming,
        url: "https://www.twitch.tv/darkleroy_ua",
      });
    }, 20000);
  } catch (e: any) {
    console.log(String(e.stack).bgRed);
  }
};
