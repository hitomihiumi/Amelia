import {JTCPreset, ModifiedClient, UserSchema} from '../types/helpers';
import { Guild, User as DiscordUser } from "discord.js";
import { History } from "./History";

export class User {
    public user: DiscordUser;
    public guild: Guild;
    public client: ModifiedClient;
    public history: History;

    constructor(client: ModifiedClient, user: DiscordUser, guild: Guild) {
        this.client = client;
        this.user = user;
        this.guild = guild;
        this.history = new History(client, guild);

        if (this.user) {
            this.client.holder.dbs.users.ensure(this.user.id, {
                user_id: this.user.id,
                guild_id: this.guild.id,
                level: {
                    xp: 0,
                    total_xp: 0,
                    level: 1,
                    voice_time: 0,
                    message_count: 0,
                },
                economy: {
                    balance: {
                        wallet: 0,
                        bank: 0,
                    },
                    inventory: {
                        custom: {
                            roles: [],
                            items: [],
                        }
                    },
                    timeout: {
                        work: 0,
                        timely: 0,
                        daily: 0,
                        weekly: 0,
                        rob: 0,
                    }
                },
                custom: {
                    balance: {
                        number: `${this.guild.id.slice(0, 5)} ${this.user.id.slice(0, 5)} ${Math.floor(Math.random() * 1000)} ${Math.floor(Math.random() * 1000)}`,
                        mode: false,
                        solid: {
                            bg_color: "#000000",
                            text_color: "#ffffff",
                            text: "Kyoko",
                        },
                        url: null,
                    },
                    profile: {
                        bio: "",
                        mode: false,
                        solid: {
                            bg_color: "#000000",
                            text_color: "#ffffff",
                            text: "Kyoko",
                        },
                        url: null,
                        color: null
                    },
                    rank: {
                        mode: false,
                        solid: {
                            bg_color: "#000000",
                            text_color: "#ffffff",
                            text: "Kyoko",
                        },
                        url: null,
                        color: null
                    },
                    badges: []
                },
                temp: {
                    games: {
                        tiles: null
                    }
                },
                presets: {
                    jtc: []
                }
            } as UserSchema);
        }
    }

    public get(path: string): any {
        let data = this.client.holder.dbs.users.get(this.user.id) as UserSchema;

        return path.split(".").reduce((o, i) => {
            // @ts-ignore
            return o[i];
        }, data);
    }

    public set(path: string, value: any) {
        return this.client.holder.dbs.users.set(this.user.id, value, `${path}`);
    }

    public add(path: string, value: any) {
        return this.client.holder.dbs.users.math(this.user.id, "add", value, `${path}`);
    }

    public sub(path: string, value: any) {
        return this.client.holder.dbs.users.math(this.user.id, "sub", value, `${path}`);
    }

    public push(path: string, value: any) {
        return this.client.holder.dbs.users.push(this.user.id, value, `${path}`);
    }

    public delete(path: string) {
        return this.client.holder.dbs.users.delete(this.user.id, `${path}`);
    }

    public has(path: string) {
        return this.client.holder.dbs.users.has(this.user.id, `${path}`);
    }

    public all(): UserSchema {
        return this.client.holder.dbs.users.get(this.user.id);
    }
}
