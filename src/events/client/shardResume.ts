import { Client } from "discord.js";

module.exports = (client: Client, id: number, replayedEvents: any) => {
  console.log(
    ` || <==> || [${String(new Date()).split(" ", 5).join(" ")}] || <==> || Shard #${id} Resumed || <==> ||`,
  );
};
