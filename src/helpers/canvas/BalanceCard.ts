import {
  Exporter,
  Filters,
  FontWeight,
  ImageLayer,
  LazyCanvas,
  MorphLayer,
  Path2DLayer,
  TextLayer,
} from "@nmmty/lazycanvas";
import { BalanceCardDisplayOptions } from "../../types/helpers";
import { fontMap } from "../assetsMap";
import { StrokeCap, StrokeJoin } from "@napi-rs/canvas";

export class BalanceCard {
  data: BalanceCardOptions;

  constructor(data: BalanceCardOptions) {
    this.data = data;
  }

  async render() {
    const canvas = new LazyCanvas().create(430, 270);

    canvas.manager.fonts.add(fontMap.wdxllubrifont);

    const text = [
      new TextLayer()
        .setPosition(30, 102)
        .setText(`Wallet: ${this.data.data.wallet}`)
        .setFont("WDXL Lubrifont", 20, FontWeight.Regular)
        .setColor("#ffffff")
        .setShadow("#000000", 4, 0, 0)
        .setBaseline("top"),
      new TextLayer()
        .setPosition(30, 70)
        .setText(`Bank: ${this.data.data.bank}`)
        .setFont("WDXL Lubrifont", 20, FontWeight.Regular)
        .setColor("#ffffff")
        .setShadow("#000000", 4, 0, 0)
        .setBaseline("top"),
    ];

    const measure = [
      text[0].measureText(canvas.ctx, canvas.canvas),
      text[1].measureText(canvas.ctx, canvas.canvas),
    ];

    canvas.manager.layers.add(
      new MorphLayer()
        .setPosition("50%", "50%")
        .setSize(430, 270, { all: 30 })
        .setColor(this.data.displayOptions.solid.bg_color),
      new MorphLayer()
        .setPosition(-31, 143)
        .setSize(153, 153, { all: 76 })
        .setColor(this.data.displayOptions.solid.third_component)
        .setCentring("start-top")
        .setGlobalCompositeOperation("source-atop")
        .setFilters(Filters.blur(50)),
      new MorphLayer()
        .setPosition(-27, 42)
        .setSize(153, 153, { all: 76 })
        .setColor(this.data.displayOptions.solid.third_component)
        .setCentring("start-top")
        .setGlobalCompositeOperation("source-atop")
        .setFilters(Filters.blur(50)),
      new MorphLayer()
        .setPosition(-12, -39)
        .setSize(153, 153, { all: 76 })
        .setColor(this.data.displayOptions.solid.first_component)
        .setCentring("start-top")
        .setGlobalCompositeOperation("source-atop")
        .setFilters(Filters.blur(50)),
      new MorphLayer()
        .setPosition(98, -34)
        .setSize(153, 153, { all: 76 })
        .setColor(this.data.displayOptions.solid.first_component)
        .setCentring("start-top")
        .setGlobalCompositeOperation("source-atop")
        .setFilters(Filters.blur(50)),
      new MorphLayer()
        .setPosition(167, -45)
        .setSize(381, 381, { all: 190 })
        .setColor(this.data.displayOptions.solid.third_component)
        .setCentring("start-top")
        .setGlobalCompositeOperation("source-atop")
        .setFilters(Filters.blur(50)),
      new MorphLayer()
        .setPosition(56, 190)
        .setSize(290, 290, { all: 145 })
        .setColor(this.data.displayOptions.solid.second_component)
        .setCentring("start-top")
        .setGlobalCompositeOperation("source-atop")
        .setFilters(Filters.blur(50)),
      new MorphLayer()
        .setPosition(330, 200)
        .setSize(40, 40, { all: 20 })
        .setColor("#ffffff")
        .setOpacity(0.6)
        .setCentring("start-top"),
      new MorphLayer()
        .setPosition(354, 200)
        .setSize(40, 40, { all: 20 })
        .setColor("#ffffff")
        .setOpacity(0.6)
        .setCentring("start-top"),
      new Path2DLayer()
        .setPath(
          "M16.3 19.5002C17.4 17.2002 18 14.7002 18 12.0002C18 9.30024 17.4 6.70024 16.3 4.50024M12.7 17.8003C13.5 16.0003 14 14.0003 14 12.0003C14 10.0003 13.5 7.90034 12.7 6.10034M9.1001 16.1001C9.7001 14.8001 10.0001 13.4001 10.0001 12.0001C10.0001 10.6001 9.7001 9.10015 9.1001 7.90015M5.5 14.3003C5.8 13.6003 6 12.8003 6 12.0003C6 11.2003 5.8 10.3003 5.5 9.60034",
        )
        .setScale(2, 2)
        .setTranslate(355, 20)
        .stroke({
          width: 2,
          join: StrokeJoin.Round,
          cap: StrokeCap.Round,
        })
        .setColor("#ffffff"),
      new MorphLayer()
        .setPosition("50%", "50%")
        .setSize(428, 268, { all: 28 })
        .setColor(this.data.displayOptions.solid.second_component)
        .setStroke(2),
      new TextLayer()
        .setPosition(30, 205)
        .setText(this.data.username.toUpperCase())
        .setFont("WDXL Lubrifont", 32, FontWeight.Regular)
        .setColor("#ffffff")
        .setShadow("#000000", 4, 0, 0)
        .setBaseline("top"),
      new TextLayer()
        .setPosition(30, 142)
        .setText(this.data.displayOptions.number)
        .setFont("WDXL Lubrifont", 36, FontWeight.Regular)
        .setColor("#ffffff")
        .setShadow("#000000", 4, 0, 0)
        .setBaseline("top"),
      ...text,
      new ImageLayer()
        .setPosition(50 + measure[0].width, 110)
        .setSize(20, 20)
        .setSrc(this.data.emojiURL)
        .setShadow("#000000", 1, 0, 0),
      new ImageLayer()
        .setPosition(50 + measure[1].width, 78)
        .setSize(20, 20)
        .setSrc(this.data.emojiURL)
        .setShadow("#000000", 1, 0, 0),
    );

    return (await new Exporter(canvas).export("buffer")) as Buffer;
  }
}

type BalanceCardOptions = {
  username: string;
  data: {
    wallet: number;
    bank: number;
  };
  displayOptions: BalanceCardDisplayOptions;
  emojiURL: string;
};
