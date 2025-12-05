import { BalanceCard } from "../../src/helpers/canvas/BalanceCard";
import { defaultDisplayOptions } from "../../src/types/helpers";

const balanceCard = new BalanceCard({
  username: "Dispersion",
  data: {
    wallet: 12500,
    bank: 50000,
  },
  displayOptions: {
    ...defaultDisplayOptions.balance,
    number: "1259 2130 5844 7783",
  },
    emojiURL: `https://cdn.discordapp.com/emojis/1046509960172937296.png?size=44`,
});

balanceCard.render().then((buffer) => {
  require("fs").writeFileSync("balanceCard.png", buffer);
});
