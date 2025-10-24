import { HistorySchema } from "../types/helpers";
import { Client, Guild } from "discord.js";

export class History {
    public client: Client;
    public guild: Guild;

    constructor(client: Client, guild: Guild) {
        this.client = client;
        this.guild = guild;

        if (this.guild) {
            this.client.holder.dbs.history.ensure(this.guild.id, {
                guild_id: this.guild.id,
                guild: {
                    transactions: [],
                    warns: [],
                    reports: [],
                },
            } as HistorySchema);
        }
    }

    public get(path: string): any {
        let data = this.client.holder.dbs.history.get(this.guild.id) as HistorySchema;

        return path.split(".").reduce((o, i) => {
            // @ts-ignore
            return o[i];
        }, data);
    }

    public set(path: string, value: any) {
        return this.client.holder.dbs.history.set(this.guild.id, value, `${path}`);
    }

    public add(path: string, value: any) {
        return this.client.holder.dbs.history.math(this.guild.id, "add", value, `${path}`);
    }

    public sub(path: string, value: any) {
        return this.client.holder.dbs.history.math(this.guild.id, "sub", value, `${path}`);
    }

    public push(path: string, value: any) {
        return this.client.holder.dbs.history.push(this.guild.id, value, `${path}`);
    }

    public delete(path: string) {
        return this.client.holder.dbs.history.delete(this.guild.id, `${path}`);
    }

    public has(path: string) {
        return this.client.holder.dbs.history.has(this.guild.id, `${path}`);
    }

    public all(): HistorySchema {
        return this.client.holder.dbs.history.get(this.guild.id);
    }
}
