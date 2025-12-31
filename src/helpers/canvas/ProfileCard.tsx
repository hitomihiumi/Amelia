/** @jsx createElement */
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
  Div,
  Scene,
  createElement,
} from "@nmmty/lazycanvas";
import { ProfileCardDisplayOptions } from "../../types/helpers";
import { assetsMap, fontMap, iconsMap } from "../assetsMap";
import { formatTime, getNextLevelXP } from "../../handlers/functions";
import { Path2D } from "@napi-rs/canvas";

export class ProfileCard {
  data: ProfileCardOptions;

  constructor(data: ProfileCardOptions) {
    this.data = data;
  }

  async render() {
    const xpbar = Math.max(
      (415 * Number(this.data.data.xp)) / getNextLevelXP(this.data.data.level),
      30,
    );

    const gradient = new Gradient()
      .setType("linear")
      .setPoints({ x: 289, y: 182.5 }, { x: 685, y: 182.5 })
      .setStops(
        {
          offset: Number(((isNaN(xpbar) ? 30 : xpbar) / 415).toFixed(2)) - 0.01,
          color: "#ffffff",
        },
        {
          offset: Number(((isNaN(xpbar) ? 30 : xpbar) / 415).toFixed(2)),
          color: this.data.displayOptions.solid.second_component,
        },
      );

    const scene = new Scene(736, 736);

    scene.lazyCanvas.manager.fonts.add(fontMap.wdxllubrifont);

    scene.load(
      <Div>
        <MorphLayer
          position={{ x: "50%", y: "50%" }}
          size={{ width: 736, height: 736, radius: { all: 30 } }}
          fillStyle={this.data.displayOptions.solid.bg_color}
        />
        <Path2DLayer
          path2D={
            new Path2D(
              "M-104 187.97C326.971 -47.0652 784.644 -58.3726 807 135.471V528H-104V187.97Z",
            )
          }
          fillStyle={this.data.displayOptions.solid.first_component}
          transform={{
            translate: { x: 0, y: 208 },
          }}
          filter={Filters.blur(100)}
          globalComposite={"source-atop"}
        />
        <Path2DLayer
          path2D={
            new Path2D(
              "M-69 32.1547C-69 32.1547 53.121 -40.1934 213.235 32.1547C373.349 104.503 868.618 313.505 929 186.23V347H-69V32.1547Z",
            )
          }
          transform={{
            translate: { x: 0, y: 440 },
          }}
          filter={Filters.blur(80)}
          fillStyle={this.data.displayOptions.solid.second_component}
          globalComposite={"source-atop"}
        />
        <MorphLayer
          position={{ x: "50%", y: "50%" }}
          size={{ width: 733, height: 733, radius: { all: 28 } }}
          stroke={{ width: 3 }}
          fillStyle={this.data.displayOptions.solid.second_component}
        />
        <ImageLayer
          position={{ x: 145, y: 145 }}
          size={{ width: 220, height: 220, radius: { all: 110 } }}
          src={this.data.avatar}
        />
        <MorphLayer
          position={{ x: 145, y: 145 }}
          size={{ width: 220, height: 220, radius: { all: 110 } }}
          stroke={{ width: 3 }}
          fillStyle={this.data.displayOptions.solid.second_component}
        />
        <TextLayer
          position={{ x: 286, y: 100 }}
          text={this.data.globalName}
          font={{ family: "WDXL Lubrifont", size: 64, weight: FontWeight.Regular }}
          align={"left"}
          fillStyle={"#ffffff"}
          shadow={{ color: "#000000", blur: 4, offsetX: 0, offsetY: 0 }}
        />
        <TextLayer
          position={{ x: 286, y: 145 }}
          text={this.data.username}
          font={{ family: "WDXL Lubrifont", size: 32, weight: FontWeight.Regular }}
          align={"left"}
          fillStyle={"#ffffff"}
          shadow={{ color: "#000000", blur: 4, offsetX: 0, offsetY: 0 }}
        />
        <MorphLayer
          position={{ x: 496, y: 182.5 }}
          size={{ width: 420, height: 35, radius: { all: 17.5 } }}
          fillStyle={"#ffffff"}
        />
        <MorphLayer
          position={{ x: 289, y: 182.5 }}
          size={{ width: isNaN(xpbar) ? 30 : xpbar, height: 30, radius: { all: 15 } }}
          fillStyle={this.data.displayOptions.solid.second_component}
          centring={"start"}
        />
        <TextLayer
          position={{ x: 304, y: 182.5 }}
          text={`LEVEL ${this.data.data.level}`}
          font={{ family: "WDXL Lubrifont", size: 16, weight: FontWeight.Regular }}
          fillStyle={gradient}
          baseline={"middle"}
          align={"left"}
        />
        <TextLayer
          position={{ x: 694, y: 182.5 }}
          text={`${this.data.data.xp}/${getNextLevelXP(this.data.data.level)}`}
          font={{ family: "WDXL Lubrifont", size: 16, weight: FontWeight.Regular }}
          fillStyle={gradient}
          baseline={"middle"}
          align={"right"}
        />
        <MorphLayer
          position={{ x: 379, y: 230 }}
          size={{ width: 180, height: 35, radius: { all: 17.5 } }}
          fillStyle={"#ffffff"}
        />
        <TextLayer
          position={{ x: 379, y: 230 }}
          text={`${formatTime(this.data.data.voice_time, { locale: "en", short: true })}`}
          font={{ family: "WDXL Lubrifont", size: 24, weight: FontWeight.Regular }}
          fillStyle={"#000000"}
          baseline={"middle"}
          align={"center"}
        />
        <ImageLayer
          position={{ x: 449, y: 230 }}
          size={{ width: 25, height: 25 }}
          src={assetsMap.microphone}
        />
        <MorphLayer
          position={{ x: 235, y: 334 }}
          size={{ width: 180, height: 40, radius: { all: 20 } }}
          fillStyle={"#ffffff"}
        />
        <TextLayer
          position={{ x: 235, y: 334 }}
          text={"Biography"}
          font={{ family: "WDXL Lubrifont", size: 32, weight: FontWeight.Regular }}
          fillStyle={"#000000"}
          baseline={"middle"}
          align={"center"}
        />
        <TextLayer
          position={{ x: 235, y: 404 }}
          size={{ width: 310, height: 0 }}
          text={this.data.displayOptions.bio || "This user has not set a biography yet."}
          font={{ family: "WDXL Lubrifont", size: 28, weight: FontWeight.Regular }}
          fillStyle={"#ffffff"}
          align={"center"}
          shadow={{ color: "#000000", blur: 4, offsetX: 0, offsetY: 0 }}
        />
        <MorphLayer
          position={{ x: 586, y: 334 }}
          size={{ width: 180, height: 40, radius: { all: 20 } }}
          fillStyle={"#ffffff"}
        />
        <TextLayer
          position={{ x: 586, y: 334 }}
          text={"Icons"}
          font={{ family: "WDXL Lubrifont", size: 32, weight: FontWeight.Regular }}
          fillStyle={"#000000"}
          baseline={"middle"}
          align={"center"}
        />
        {...[
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
          if (!icon || icon.name === "empty")
            return (
              <MorphLayer
                position={{
                  x:
                    516 -
                    (this.data.displayOptions.icons_padding.x - 10) +
                    pos[0] * (60 + this.data.displayOptions.icons_padding.x),
                  y:
                    434 -
                    (this.data.displayOptions.icons_padding.y - 10) +
                    pos[1] * (60 + this.data.displayOptions.icons_padding.y),
                }}
                size={{ width: 20, height: 20, radius: { all: 10 } }}
                fillStyle={"#ffffff"}
                opacity={0.5}
              />
            );
          return (
            <ImageLayer
              position={{
                x:
                  516 -
                  (this.data.displayOptions.icons_padding.x - 10) +
                  pos[0] * (60 + this.data.displayOptions.icons_padding.x),
                y:
                  434 -
                  (this.data.displayOptions.icons_padding.y - 10) +
                  pos[1] * (60 + this.data.displayOptions.icons_padding.y),
              }}
              size={{ width: 60, height: 60 }}
              src={iconsMap[icon.name]}
            />
          );
        })}
      </Div>,
    );

    return (await new Exporter(scene).export("buffer")) as Buffer;
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
