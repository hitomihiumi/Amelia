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
import {GetSchemaValueType, ProfileCardDisplayOptions} from "../../types/helpers";
import { assetsMap, fontMap, iconsMap } from "../assetsMap";
import { formatTime, getNextLevelXP } from "../../handlers/functions";
import { Path2D } from "@napi-rs/canvas";
import {TranslationSchema} from "../../types/i18n/TranslationSchema";

export class ProfileCard {
  data: ProfileCardOptions;
  units: GetSchemaValueType<TranslationSchema, "time_units">;

  constructor(data: ProfileCardOptions, units: GetSchemaValueType<TranslationSchema, "time_units">) {
    this.data = data;
    this.units = units;
  }

  async render() {
    const xpbar = Math.max(
      (415 * Number(this.data.data.xp)) / getNextLevelXP(this.data.data.level),
      30,
    );

    const gradient = new Gradient()
      .setType("linear")
      .setPoints({ x: 3, y: 182.5 }, { x: 418, y: 182.5 })
      .setStops(
        {
          offset: Number(((isNaN(xpbar) ? 30 : xpbar) / 415).toFixed(3)),
          color: "#ffffff",
        },
        {
          offset: Number(((isNaN(xpbar) ? 30 : xpbar) / 415).toFixed(3)) + 0.001,
          color: this.data.displayOptions.solid.second_component,
        },
      );

    const scene = new Scene(736, 736);

    scene.lazyCanvas.manager.fonts.add(fontMap.wdxllubrifont);

    scene.load(
      <MorphLayer
        layout={{
          width: 736,
          height: 736,
          padding: 0,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
        size={{ width: 736, height: 736, radius: { all: 30 } }}
        color={this.data.displayOptions.solid.bg_color}
      >
        <Div
          layout={{
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
        >
          <Path2DLayer
            path2D={
              new Path2D(
                "M-104 187.97C326.971 -47.0652 784.644 -58.3726 807 135.471V528H-104V187.97Z",
              )
            }
            color={this.data.displayOptions.solid.third_component}
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
            color={this.data.displayOptions.solid.second_component}
            globalComposite={"source-atop"}
          />
        </Div>

        <Div
          layout={{
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: 20,
            gap: 20,
          }}
        >
          <Div
            layout={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              height: 250,
              padding: 20,
              gap: 20,
            }}
          >
            <Div
              layout={{
                position: "relative",
                width: 220,
                height: 220,
              }}
            >
              <ImageLayer
                size={{ width: 220, height: 220, radius: { all: 110 } }}
                src={this.data.avatar}
              />
              <MorphLayer
                layout={{
                  position: "absolute",
                }}
                size={{ width: 220, height: 220, radius: { all: 110 } }}
                stroke={{ width: 3 }}
                color={this.data.displayOptions.solid.second_component}
              />
            </Div>
            <Div
              layout={{
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "center",
                flexGrow: 1,
                gap: 10,
              }}
            >
              <TextLayer
                text={this.data.globalName}
                font={{ family: "WDXL Lubrifont", size: 64, weight: FontWeight.Regular }}
                align={"left"}
                color={"#ffffff"}
                shadow={{ color: "#000000", blur: 4, offsetX: 0, offsetY: 0 }}
              />
              <TextLayer
                text={this.data.username}
                font={{ family: "WDXL Lubrifont", size: 32, weight: FontWeight.Regular }}
                align={"left"}
                color={"#ffffff"}
                shadow={{ color: "#000000", blur: 4, offsetX: 0, offsetY: 0 }}
              />
              <MorphLayer
                layout={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  position: "relative",
                  width: 421,
                  height: 36,
                }}
                size={{ width: 421, height: 36, radius: { all: 17.5 } }}
                color={"#ffffff"}
              >
                <MorphLayer
                  layout={{
                    position: "absolute",
                    left: 3,
                    top: 3,
                  }}
                  size={{ width: isNaN(xpbar) ? 30 : xpbar, height: 30, radius: { all: 15 } }}
                  color={this.data.displayOptions.solid.second_component}
                  centring={"start"}
                />
                <TextLayer
                  layout={{
                    margin: [0, 0, 0, 20],
                  }}
                  text={`LEVEL ${this.data.data.level}`}
                  font={{ family: "WDXL Lubrifont", size: 16, weight: FontWeight.Regular }}
                  color={gradient}
                  baseline={"middle"}
                  align={"left"}
                />
                <TextLayer
                  layout={{
                    margin: [0, 20, 0, 0],
                  }}
                  text={`${this.data.data.xp}/${getNextLevelXP(this.data.data.level)}`}
                  font={{ family: "WDXL Lubrifont", size: 16, weight: FontWeight.Regular }}
                  color={gradient}
                  baseline={"middle"}
                  align={"right"}
                />
              </MorphLayer>
              <MorphLayer
                layout={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  width: 180,
                  height: 35,
                  margin: [0, 20, 0, 0],
                }}
                size={{ width: 180, height: 35, radius: { all: 17.5 } }}
                color={"#ffffff"}
              >
                <TextLayer
                  layout={{
                    position: "absolute",
                  }}
                  text={`${formatTime(this.data.data.voice_time, "en", this.units, { short: true })}`}
                  font={{
                    family: "WDXL Lubrifont",
                    size: 24,
                    weight: FontWeight.Regular,
                  }}
                  align={"center"}
                  baseline={"middle"}
                  color={"#000000"}
                />
                <ImageLayer
                  layout={{
                    position: "absolute",
                    left: 140,
                  }}
                  size={{ width: 25, height: 25 }}
                  src={assetsMap.microphone}
                />
              </MorphLayer>
            </Div>
          </Div>
          <Div
            layout={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: 476,
              gap: 10,
            }}
          >
            <Div
              layout={{
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 20,
                width: 430,
                height: 476,
              }}
            >
              <MorphLayer
                layout={{
                  width: 180,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                size={{ width: 180, height: 40, radius: { all: 20 } }}
                color={"#ffffff"}
              >
                <TextLayer
                  text={"Biography"}
                  font={{ family: "WDXL Lubrifont", size: 32, weight: FontWeight.Regular }}
                  color={"#000000"}
                  baseline={"middle"}
                  align={"center"}
                />
              </MorphLayer>
              <TextLayer
                size={{ width: 310, height: 0 }}
                text={this.data.displayOptions.bio || "This user has not set a biography yet."}
                font={{ family: "WDXL Lubrifont", size: 28, weight: FontWeight.Regular }}
                color={"#ffffff"}
                align={"center"}
                shadow={{ color: "#000000", blur: 4, offsetX: 0, offsetY: 0 }}
              />
            </Div>
            <Div
              layout={{
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 20,
                width: 200,
                height: 476,
              }}
            >
              <MorphLayer
                layout={{
                  position: "relative",
                  width: 180,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                size={{ width: 180, height: 40, radius: { all: 20 } }}
                color={"#ffffff"}
              >
                <TextLayer
                  text={"Icons"}
                  font={{ family: "WDXL Lubrifont", size: 32, weight: FontWeight.Regular }}
                  color={"#000000"}
                  baseline={"middle"}
                  align={"center"}
                />
              </MorphLayer>
              <Div
                layout={{
                  flexDirection: "row",
                  width: 200,
                  height: 350,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: this.data.displayOptions.icons_padding,
                }}
              >
                <Div
                  layout={{
                    flexDirection: "column",
                    position: "relative",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 60,
                    height: 270,
                    gap: this.data.displayOptions.icons_padding,
                  }}
                >
                  {...iconsPerRow(
                    [
                      [0, 0],
                      [0, 1],
                      [0, 2],
                      [0, 3],
                    ],
                    this.data.displayOptions,
                  )}
                </Div>
                <Div
                  layout={{
                    flexDirection: "column",
                    position: "relative",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 60,
                    height: 270,
                    gap: this.data.displayOptions.icons_padding,
                  }}
                >
                  {...iconsPerRow(
                    [
                      [1, 0],
                      [1, 1],
                      [1, 2],
                      [1, 3],
                    ],
                    this.data.displayOptions,
                  )}
                </Div>
                <Div
                  layout={{
                    flexDirection: "column",
                    position: "relative",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 60,
                    height: 270,
                    gap: this.data.displayOptions.icons_padding,
                  }}
                >
                  {...iconsPerRow(
                    [
                      [2, 0],
                      [2, 1],
                      [2, 2],
                      [2, 3],
                    ],
                    this.data.displayOptions,
                  )}
                </Div>
              </Div>
            </Div>
          </Div>
        </Div>

        <MorphLayer
          layout={{
            position: "absolute",
            width: 733,
            height: 733,
            top: 1,
            left: 1,
          }}
          size={{ width: 733, height: 733, radius: { all: 28 } }}
          stroke={{ width: 3 }}
          color={this.data.displayOptions.solid.second_component}
        />
      </MorphLayer>,
    );

    return (await new Exporter(scene).export("buffer")) as Buffer;
  }
}

const iconsPerRow = (pos: Array<[number, number]>, displayOptions: ProfileCardDisplayOptions) => {
  return pos.map((pos) => {
    const icon = displayOptions.icons.find((i) => i.pos[0] === pos[0] && i.pos[1] === pos[1]);
    if (!icon || icon.name === "empty")
      return (
        <Div
          layout={{
            position: "relative",
            width: 60,
            height: 60,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MorphLayer
            layout={{
              position: "relative",
            }}
            size={{ width: 20, height: 20, radius: { all: 10 } }}
            color={"#ffffff"}
            opacity={0.5}
          />
        </Div>
      );
    return (
      <ImageLayer
        layout={{
          position: "relative",
          width: 60,
          height: 60,
        }}
        size={{ width: 60, height: 60 }}
        src={iconsMap[icon.name]}
      />
    );
  });
};

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
