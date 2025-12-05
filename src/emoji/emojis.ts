export const emojis = {
  ids: {
    on: "1226456262862962789",
    none: "1226456330898903100",
    off: "1226456281355649035",
    gems: "1046509960172937296",
  },
  discord: {
    on: "<:on:1226456262862962789>",
    none: "<:none:1226456330898903100>",
    off: "<:off:1226456281355649035>",
    gems: "<a:gems:1046509960172937296>",
  },
};

export type EmojisKey = keyof typeof emojis.discord;
