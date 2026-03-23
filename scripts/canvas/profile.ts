import { ProfileCard } from "../../src/helpers/canvas/ProfileCard";
import { defaultDisplayOptions } from "../../src/types/helpers";
import { en } from "../../src/i18n/locales";

async function main(nums: number[]) {
  for (const num of nums) {
    const profileCard = new ProfileCard({
      avatar: "https://i.pinimg.com/736x/2d/d4/46/2dd446aad6d78e6f549a8d6572f0aa1d.jpg",
      username: "hitomihiumi",
      globalName: "Dispersion",
      data: {
        level: 15,
        xp: num,
        total_xp: 1250,
        voice_time: 3600000,
        rank: 5,
        message_count: 250,
      },
      displayOptions: {
        ...defaultDisplayOptions.profile,
        icons: [],
        bio: "",
        color: "#fff",
      },
    }, en.time_units);

    profileCard.render().then((buffer) => {
      require("fs").writeFileSync(`profileCard-${num}.png`, buffer);
    });
  }
}

main([100, 200, 300, 500, 750, 1000, 1750, 1850, 1975]);
