/** @jsx createElement */
import {
  Exporter,
  Filters,
  FontWeight,
  Gradient,
  ImageLayer,
  MorphLayer,
  Path2DLayer,
  TextLayer,
  Div,
  Scene,
  createElement,
} from "@nmmty/lazycanvas";
import { RankCardDisplayOptions } from "../../types/helpers";
import { assetsMap, fontMap } from "../assetsMap";
import { formatTime, getNextLevelXP } from "../../handlers/functions";
import { Path2D } from "@napi-rs/canvas";

export class RankCard {
  data: RankCardOptions;

  constructor(data: RankCardOptions) {
    this.data = data;
  }

  async render() {
    const xpbar = Math.max(
      (475 * Number(this.data.data.xp)) / getNextLevelXP(this.data.data.level),
      30,
    );

    const gradient = new Gradient()
      .setType("linear")
      .setPoints({ x: 225, y: 202.5 }, { x: 705, y: 202.5 })
      .setStops(
        {
          offset: Number(((isNaN(xpbar) ? 30 : xpbar) / 475).toFixed(2)) - 0.01,
          color: "#ffffff",
        },
        {
          offset: Number(((isNaN(xpbar) ? 30 : xpbar) / 475).toFixed(2)),
          color: this.data.displayOptions.solid.second_component,
        },
      );

    const path = (multiplier: number) => {
      const path = new Path2D();
      path.ellipse(368, 200 * multiplier, 400, 200, 0, 0, Math.PI * 2);
      return path;
    };

    const scene = new Scene(736, 260);

    scene.lazyCanvas.manager.fonts.add(fontMap.wdxllubrifont);

    scene.load(
      <Div>
        <MorphLayer
          position={{ x: "50%", y: "50%" }}
          size={{ width: 736, height: 260, radius: { all: 30 } }}
          fillStyle={this.data.displayOptions.solid.bg_color}
        />
        <Path2DLayer
          path2D={path(1.5)}
          fillStyle={this.data.displayOptions.solid.first_component}
          filter={Filters.blur(50)}
          globalComposite={"source-atop"}
        />
        <Path2DLayer
          path2D={path(1.75)}
          fillStyle={this.data.displayOptions.solid.second_component}
          filter={Filters.blur(40)}
          globalComposite={"source-atop"}
        />
        <Path2DLayer
          path2D={path(2)}
          fillStyle={this.data.displayOptions.solid.third_component}
          filter={Filters.blur(80)}
        />
        <MorphLayer
          position={{ x: "50%", y: "50%" }}
          size={{ width: 733, height: 257, radius: { all: 28 } }}
          fillStyle={this.data.displayOptions.solid.second_component}
          stroke={{
            width: 3,
          }}
        />
        <ImageLayer
          position={{ x: 114, y: 130 }}
          size={{ width: 180, height: 180, radius: { all: 90 } }}
          src={this.data.avatar}
        />
        <MorphLayer
          position={{ x: 114, y: 130 }}
          size={{ width: 180, height: 180, radius: { all: 90 } }}
          fillStyle={this.data.displayOptions.solid.second_component}
          stroke={{
            width: 3,
          }}
        />
        <TextLayer
          position={{ x: 225, y: 120 }}
          text={this.data.globalName}
          font={{
            family: "WDXL Lubrifont",
            size: 64,
            weight: FontWeight.Regular,
          }}
          align={"start"}
          fillStyle={"#ffffff"}
          shadow={{
            color: "#000000",
            blur: 4,
          }}
        />
        <TextLayer
          position={{ x: 225, y: 160 }}
          text={this.data.username}
          font={{
            family: "WDXL Lubrifont",
            size: 32,
            weight: FontWeight.Regular,
          }}
          align={"start"}
          fillStyle={"#ffffff"}
          shadow={{
            color: "#000000",
            blur: 4,
          }}
        />
        <MorphLayer
          position={{ x: 465, y: 202.5 }}
          size={{ width: 480, height: 35, radius: { all: 17.5 } }}
          fillStyle={"#ffffff"}
        />
        <MorphLayer
          position={{ x: 227.5, y: 202.5 }}
          size={{ width: isNaN(xpbar) ? 30 : xpbar, height: 30, radius: { all: 15 } }}
          fillStyle={this.data.displayOptions.solid.second_component}
          centring={"start"}
        />
        <TextLayer
          position={{ x: 245, y: 202.5 }}
          text={`LEVEL ${this.data.data.level}`}
          font={{
            family: "WDXL Lubrifont",
            size: 16,
            weight: FontWeight.Regular,
          }}
          align={"left"}
          baseline={"middle"}
          fillStyle={gradient}
        />
        <TextLayer
          position={{ x: 685, y: 202.5 }}
          text={`${this.data.data.xp}/${getNextLevelXP(this.data.data.level)}`}
          font={{
            family: "WDXL Lubrifont",
            size: 16,
            weight: FontWeight.Regular,
          }}
          align={"right"}
          baseline={"middle"}
          fillStyle={gradient}
        />
        <MorphLayer
          position={{ x: 615, y: 160 }}
          size={{ width: 180, height: 35, radius: { all: 17.5 } }}
          fillStyle={"#ffffff"}
        />
        <TextLayer
          position={{ x: 615, y: 160 }}
          text={`${formatTime(this.data.data.voice_time, { locale: "en", short: true })}`}
          font={{
            family: "WDXL Lubrifont",
            size: 24,
            weight: FontWeight.Regular,
          }}
          align={"center"}
          baseline={"middle"}
          fillStyle={"#000000"}
        />
        <ImageLayer
          position={{ x: 685, y: 160 }}
          size={{ width: 25, height: 25 }}
          src={assetsMap.microphone}
        />
      </Div>,
    );

    return (await new Exporter(scene).export("buffer")) as Buffer;
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
