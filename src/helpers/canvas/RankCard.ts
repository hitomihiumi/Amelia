import {
  Exporter,
  Filters,
  FontWeight,
  Gradient,
  ImageLayer,
  LazyCanvas,
  MorphLayer,
  Path2DLayer,
  TextLayer,
  Utils,
} from "@nmmty/lazycanvas";
import { RankCardDisplayOptions } from "../../types/helpers";
import { assetsMap, fontMap } from "../assetsMap";
import { formatTime, getNextLevelXP } from "../../handlers/functions";

export class RankCard {
  data: RankCardOptions;

  constructor(data: RankCardOptions) {
    this.data = data;
  }

  async render() {
    const xpbar = Math.max((475 * Number(this.data.data.xp)) / Number(this.data.data.total_xp), 30);

    const gradient = new Gradient()
      .setType("linear")
      .setPoints({ x: 225, y: 202.5 }, { x: 705, y: 202.5 })
      .setStops(
        {
          offset: Number(((isNaN(xpbar) ? 30 : xpbar) / 475).toFixed(2)) + 0.01,
          color: "#ffffff",
        },
        {
          offset: Number(((isNaN(xpbar) ? 30 : xpbar) / 475).toFixed(2)) + 0.02,
          color: this.data.displayOptions.solid.second_component,
        },
      );

    const canvas = new LazyCanvas({ debug: true }).create(736, 260);

    canvas.manager.fonts.add(fontMap.wdxllubrifont);

    canvas.manager.layers.add(
      new MorphLayer()
        .setPosition("50%", "50%")
        .setSize(736, 260, { all: 30 })
        .setColor(this.data.displayOptions.solid.bg_color),
      new Path2DLayer()
        .ellipse(368, 200 * 1.5, 400, 200, 0, 0, Math.PI * 2)
        .setColor(this.data.displayOptions.solid.first_component)
        .setFilters(Filters.blur(50))
        .setGlobalCompositeOperation("source-atop"),
      new Path2DLayer()
        .ellipse(368, 200 * 1.75, 400, 200, 0, 0, Math.PI * 2)
        .setColor(this.data.displayOptions.solid.second_component)
        .setFilters(Filters.blur(40))
        .setGlobalCompositeOperation("source-atop"),
      new Path2DLayer()
        .ellipse(368, 200 * 2, 400, 200, 0, 0, Math.PI * 2)
        .setColor(this.data.displayOptions.solid.third_component)
        .setFilters(Filters.blur(80)),
      new MorphLayer()
        .setPosition("50%", "50%")
        .setSize(733, 257, { all: 28 })
        .setColor(this.data.displayOptions.solid.second_component)
        .setStroke(3),
      new ImageLayer()
        .setPosition(114, 130)
        .setSize(180, 180, { all: 90 })
        .setSrc(this.data.avatar),
      new MorphLayer()
        .setPosition(114, 130)
        .setSize(180, 180, { all: 90 })
        .setStroke(3)
        .setColor(this.data.displayOptions.solid.second_component),
      new TextLayer()
        .setPosition(225, 120)
        .setText(this.data.globalName)
        .setFont("WDXL Lubrifont", 64, FontWeight.Regular)
        .setColor("#ffffff")
        .setShadow("#000000", 4, 0, 0),
      new TextLayer()
        .setPosition(225, 160)
        .setText(this.data.username)
        .setFont("WDXL Lubrifont", 32, FontWeight.Regular)
        .setColor("#ffffff")
        .setShadow("#000000", 4, 0, 0),
      new MorphLayer().setPosition(465, 202.5).setSize(480, 35, { all: 17.5 }).setColor("#ffffff"),
      new MorphLayer()
        .setPosition(230, 202.5)
        .setSize(isNaN(xpbar) ? 30 : xpbar, 30, { all: 15 })
        .setColor(this.data.displayOptions.solid.second_component)
        .setCentring("start"),
      new TextLayer()
        .setPosition(245, 202.5)
        .setText(`LEVEL ${this.data.data.level}`)
        .setFont("WDXL Lubrifont", 16, FontWeight.Regular)
        .setColor(gradient)
        .setBaseline("middle")
        .setAlign("left"),
      new TextLayer()
        .setPosition(685, 202.5)
        .setText(`${this.data.data.xp}/${getNextLevelXP(this.data.data.level)}`)
        .setFont("WDXL Lubrifont", 16, FontWeight.Regular)
        .setColor(gradient)
        .setBaseline("middle")
        .setAlign("right"),
      new MorphLayer().setPosition(615, 160).setSize(180, 35, { all: 17.5 }).setColor("#ffffff"),
      new TextLayer()
        .setPosition(615, 160)
        .setText(`${formatTime(this.data.data.voice_time, { locale: "en", short: true })}`)
        .setFont("WDXL Lubrifont", 24, FontWeight.Regular)
        .setColor("#000000")
        .setBaseline("middle")
        .setAlign("center"),
      new ImageLayer().setPosition(685, 160).setSize(25, 25).setSrc(assetsMap.microphone),
    );

    return (await new Exporter(canvas).export("buffer")) as Buffer;
  }
}

type RankCardOptions = {
  avatar: string;
  username: string;
  globalName: string;
  data: {
    level: number;
    xp: number;
    total_xp: number;
    voice_time: number;
    message_count: number;
    rank: number;
  };
  displayOptions: RankCardDisplayOptions;
};
