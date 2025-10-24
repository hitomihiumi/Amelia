import { Client, ThreadChannel } from "discord.js";

module.exports = async (client: Client, thread: ThreadChannel) => {
    if(thread.joinable){
        try{
            await thread.join();
        }catch (e){
            console.log(e)
        }
    }
}
