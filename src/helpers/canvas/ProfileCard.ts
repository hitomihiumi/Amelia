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
import { ProfileCardDisplayOptions } from "../../types/helpers";
import { assetsMap, fontMap, iconsMap } from "../assetsMap";
import { formatTime, getNextLevelXP } from "../../handlers/functions";

export class ProfileCard {
  data: ProfileCardOptions;

  constructor(data: ProfileCardOptions) {
    this.data = data;
  }

  async render() {
    const xpbar = Math.max((415 * Number(this.data.data.xp)) / getNextLevelXP(this.data.data.level), 30);

    const gradient = new Gradient()
      .setType("linear")
      .setPoints({ x: 289, y: 182.5 }, { x: 685, y: 182.5 })
      .setStops(
        {
          offset: Number(((isNaN(xpbar) ? 30 : xpbar) / 415).toFixed(2)),
          color: "#ffffff",
        },
        {
          offset: Number(((isNaN(xpbar) ? 30 : xpbar) / 415).toFixed(2)) + 0.01,
          color: this.data.displayOptions.solid.second_component,
        },
      );

    const canvas = new LazyCanvas().create(736, 736);

    canvas.manager.fonts.add(fontMap.wdxllubrifont);

    canvas.manager.layers.add(
      new MorphLayer()
        .setPosition("50%", "50%")
        .setSize(736, 736, { all: 30 })
        .setColor(this.data.displayOptions.solid.bg_color),
      new Path2DLayer()
        .setPath("M-104 187.97C326.971 -47.0652 784.644 -58.3726 807 135.471V528H-104V187.97Z")
        .setColor(this.data.displayOptions.solid.first_component)
        .setTranslate(0, 208)
        .setFilters(Filters.blur(100))
        .setGlobalCompositeOperation("source-atop"),
      new Path2DLayer()
        .setPath(
          "M-69 32.1547C-69 32.1547 53.121 -40.1934 213.235 32.1547C373.349 104.503 868.618 313.505 929 186.23V347H-69V32.1547Z",
        )
        .setTranslate(0, 440)
        .setFilters(Filters.blur(80))
        .setColor(this.data.displayOptions.solid.second_component)
        .setGlobalCompositeOperation("source-atop"),
      new MorphLayer()
        .setPosition("50%", "50%")
        .setSize(733, 733, { all: 28 })
        .setColor(this.data.displayOptions.solid.second_component)
        .setStroke(3),
      new ImageLayer()
        .setPosition(145, 145)
        .setSize(220, 220, { all: 110 })
        .setSrc(this.data.avatar),
      new MorphLayer()
        .setPosition(145, 145)
        .setSize(220, 220, { all: 110 })
        .setStroke(3)
        .setColor(this.data.displayOptions.solid.second_component),
      new TextLayer()
        .setPosition(286, 100)
        .setText(this.data.globalName)
        .setFont("WDXL Lubrifont", 64, FontWeight.Regular)
        .setColor("#ffffff")
        .setShadow("#000000", 4, 0, 0),
      new TextLayer()
        .setPosition(286, 145)
        .setText(this.data.username)
        .setFont("WDXL Lubrifont", 32, FontWeight.Regular)
        .setColor("#ffffff")
        .setShadow("#000000", 4, 0, 0),
      new MorphLayer().setPosition(496, 182.5).setSize(420, 35, { all: 17.5 }).setColor("#ffffff"),
      new MorphLayer()
        .setPosition(289, 182.5)
        .setSize(isNaN(xpbar) ? 30 : xpbar, 30, { all: 15 })
        .setColor(this.data.displayOptions.solid.second_component)
        .setCentring("start"),
      new TextLayer()
        .setPosition(304, 182.5)
        .setText(`LEVEL ${this.data.data.level}`)
        .setFont("WDXL Lubrifont", 16, FontWeight.Regular)
        .setColor(gradient)
        .setBaseline("middle")
        .setAlign("left"),
      new TextLayer()
        .setPosition(694, 182.5)
        .setText(`${this.data.data.xp}/${getNextLevelXP(this.data.data.level)}`)
        .setFont("WDXL Lubrifont", 16, FontWeight.Regular)
        .setColor(gradient)
        .setBaseline("middle")
        .setAlign("right"),
      new MorphLayer().setPosition(379, 230).setSize(180, 35, { all: 17.5 }).setColor("#ffffff"),
      new TextLayer()
        .setPosition(379, 230)
        .setText(`${formatTime(this.data.data.voice_time, { locale: "en", short: true })}`)
        .setFont("WDXL Lubrifont", 24, FontWeight.Regular)
        .setColor("#000000")
        .setBaseline("middle")
        .setAlign("center"),
      new ImageLayer().setPosition(449, 230).setSize(25, 25).setSrc(assetsMap.microphone),
      new MorphLayer().setPosition(235, 334).setSize(180, 40, { all: 20 }).setColor("#ffffff"),
      new TextLayer()
        .setPosition(235, 334)
        .setText("Biography")
        .setFont("WDXL Lubrifont", 32, FontWeight.Regular)
        .setColor("#000000")
        .setBaseline("middle")
        .setAlign("center"),
      new TextLayer()
        .setPosition(235, 404)
        .setMultiline(404, 310)
        .setText(
          this.data.displayOptions.bio ||
            "This user has not set a biography yet."
        )
        .setFont("WDXL Lubrifont", 28, FontWeight.Regular)
        .setColor("#ffffff")
        .setAlign("center")
        .setShadow("#000000", 4, 0, 0),
      new MorphLayer().setPosition(586, 334).setSize(180, 40, { all: 20 }).setColor("#ffffff"),
      new TextLayer()
        .setPosition(586, 334)
        .setText("Icons")
        .setFont("WDXL Lubrifont", 32, FontWeight.Regular)
        .setColor("#000000")
        .setBaseline("middle")
        .setAlign("center"),
      ...[
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
        [1, 0],
        [1, 1],
        [1, 2],
        [1, 3],
        [2, 0],
        [2, 1],
        [2, 2],
        [2, 3],
      ].map((pos) => {
        const icon = this.data.displayOptions.icons.find(
          (i) => i.pos[0] === pos[0] && i.pos[1] === pos[1],
        );
        if (!icon)
          return new MorphLayer()
            .setPosition(516 + pos[0] * (60 + this.data.displayOptions.icons_padding.x), 434 + pos[1] * (60 + this.data.displayOptions.icons_padding.y))
            .setSize(20, 20, { all: 10 })
            .setColor("#ffffff")
            .setOpacity(0.5);
        return new ImageLayer()
          .setPosition(516 + pos[0] * (60 + this.data.displayOptions.icons_padding.x), 434 + pos[1] * (60 + this.data.displayOptions.icons_padding.y))
          .setSize(60, 60)
          .setSrc(iconsMap[icon.name]);
      }),
    );

    return (await new Exporter(canvas).export("buffer")) as Buffer;
  }
}

type ProfileCardOptions = {
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
  displayOptions: ProfileCardDisplayOptions;
};
