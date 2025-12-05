import { LevelCard } from "../../src/helpers/canvas/LevelCard";
import { defaultDisplayOptions } from "../../src/types/helpers";

const levelCard = new LevelCard({
  avatar: "https://i.pinimg.com/736x/2d/d4/46/2dd446aad6d78e6f549a8d6572f0aa1d.jpg",
  data: {
    level: 15,
  },
  displayOptions: {
    ...defaultDisplayOptions.level_up,
  },
});

levelCard.render().then((buffer) => {
  require("fs").writeFileSync("levelCard.png", buffer);
});
