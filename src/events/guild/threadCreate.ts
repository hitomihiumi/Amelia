import { ModifiedClient } from "../../types/helpers";
import { ThreadChannel } from "discord.js";

module.exports = async (client: ModifiedClient, thread: ThreadChannel) => {
    if(thread.joinable){
        try{
            await thread.join();
        }catch (e){
            console.log(e)
        }
    }
}
