import { Client } from "discord.js";

module.exports = (client: Client, error: any, id: number) => {
  console.log(
    ` || <==> || [${String(new Date()).split(" ", 5).join(" ")}] || <==> || Shard #${id} Errored || <==> ||`,
  );
};
