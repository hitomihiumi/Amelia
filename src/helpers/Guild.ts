import { ModifiedClient, GuildSchema } from "../types/helpers";
import { Guild as DiscordGuild, User as DiscordUser } from "discord.js";
import { History } from "./History";
import { User } from "./User";

export class Guild {
    public client: ModifiedClient;
    public guild: DiscordGuild;
    public history: History;

    constructor(client: ModifiedClient, guild: DiscordGuild) {
        this.client = client;
        this.guild = guild;
        this.history = new History(client, guild);

        if (this.guild) {
            this.client.holder.dbs.guilds.ensure(this.guild.id, {
                id: this.guild.id,
                settings: {
                    prefix: "k.",
                    language: "ru",
                },
                utils: {
                    join_to_create: {
                        enabled: false,
                        channel: null,
                        category: null,
                        default_name: "%{VAR}% channel",
                    },
                    counter: {
                        enabled: false,
                        category: null,
                        channel: {},
                    },
                    levels: {
                        enabled: false,
                        ignore_channels: [],
                        ignore_roles: [],
                        level_roles: {},
                        message: {
                            enabled: false,
                            channel: null,
                            content: {
                                text: null,
                                embed: {
                                    title: null,
                                    description: null,
                                    color: null,
                                    thumbnail: null,
                                    footer: null,
                                },
                            },
                            delete: 15,
                        },
                    },
                    find_team: {
                        enabled: false,
                        channel: null,
                        send_channel: null,
                        games: []
                    },
                    components: {
                        modals: [],
                        embed: [],
                        buttons: []
                    },
                    giveaways: [],
                },
                economy: {
                    currency: {
                        emoji: null,
                        id: null,
                    },
                    shop: {
                        roles: [],
                    },
                    income: {
                        work: {
                            enabled: false,
                            cooldown: 30 * 60,
                            min: 100,
                            max: 500,
                        },
                        timely: {
                            enabled: false,
                            amount: 400,
                        },
                        daily: {
                            enabled: false,
                            amount: 800,
                        },
                        weekly: {
                            enabled: false,
                            amount: 3000,
                        },
                        level_up: {
                            enabled: false,
                            amount: 250,
                        },
                        bump: {
                            enabled: false,
                            amount: 350,
                        },
                        rob: {
                            enabled: false,
                            cooldown: 60 * 60,
                            income: {
                                min: 100,
                                max: 500,
                                type: "fixed",
                            },
                            punishment: {
                                min: 10,
                                max: 50,
                                type: "fixed",
                                fail_chance: 0.5,
                            },
                        },
                    },
                },
                moderation: {
                    moderation_roles: [],
                    auto_moderation: {
                        invite: {
                            enabled: false,
                            ignore_channels: [],
                            ignore_roles: [],
                            delete_message: false,
                            moderation_immune: false,
                            punishment: {
                                type: "warn",
                                time: 0,
                                reason: "Auto moderation",
                            },
                        },
                        links: {
                            enabled: false,
                            ignore_channels: [],
                            ignore_roles: [],
                            ignore_links: [],
                            delete_message: false,
                            moderation_immune: false,
                            punishment: {
                                type: "warn",
                                time: 0,
                                reason: "Auto moderation",
                            },
                        },
                    },
                },
                permissions: {
                    commands: {},
                },
                temp: {
                    join_to_create: {
                        map: new Map(),
                    }
                }
            } as GuildSchema);
        }
    }

    public get(path: string): any {
        let data = this.client.holder.dbs.guilds.get(this.guild.id) as GuildSchema;

        if (path === '') return data;

        return path.split(".").reduce((o, i) => {
            // @ts-ignore
            return o[i];
        }, data);
    }

    public set(path: string, value: any) {

        if (path === '') {
            return this.client.holder.dbs.guilds.set(this.guild.id, value);
        }

        return this.client.holder.dbs.guilds.set(this.guild.id, value, `${path}`);
    }

    public add(path: string, value: any) {
        return this.client.holder.dbs.guilds.math(this.guild.id, "add", value, `${path}`);
    }

    public sub(path: string, value: any) {
        return this.client.holder.dbs.guilds.math(this.guild.id, "sub", value, `${path}`);
    }

    public push(path: string, value: any) {
        return this.client.holder.dbs.guilds.push(this.guild.id, value, `${path}`);
    }

    public delete(path: string) {
        return this.client.holder.dbs.guilds.delete(this.guild.id, `${path}`);
    }

    public has(path: string) {
        return this.client.holder.dbs.guilds.has(this.guild.id, `${path}`);
    }

    public all(): GuildSchema {
        return this.client.holder.dbs.guilds.get(this.guild.id);
    }

    public getUser(id: string) {
        if (!this.guild.members.cache.get(id)?.user) {
            throw Error(`Member with ID ${id} not found in guild ${this.guild.name}.`);
        }
        return new User(this.client, this.guild.members.cache.get(id)?.user as DiscordUser, this.guild);
    }

}
