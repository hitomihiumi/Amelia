import {ModifiedClient} from "../../types/helpers";

module.exports = (client: ModifiedClient, event: any, id: number) => {
    console.log(` || <==> || [${String(new Date).split(" ", 5).join(" ")}] || <==> || Shard #${id} Disconnected || <==> ||`)
}
