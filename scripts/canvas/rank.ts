import { RankCard } from "../../src/helpers/canvas/RankCard";
import { defaultDisplayOptions } from "../../src/types/helpers";

const rankCard = new RankCard({
  avatar: "https://i.pinimg.com/736x/2d/d4/46/2dd446aad6d78e6f549a8d6572f0aa1d.jpg",
  username: "hitomihiumi",
  globalName: "Dispersion",
  data: {
    level: 15,
    xp: 350,
    total_xp: 1250,
    voice_time: 3600000,
    rank: 5,
    message_count: 250,
  },
  displayOptions: {
    ...defaultDisplayOptions.rank,
    color: "#fff",
  },
});

rankCard.render().then((buffer) => {
  require("fs").writeFileSync("rankCard.png", buffer);
});
