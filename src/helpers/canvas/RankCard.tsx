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
      .setPoints({ x: 3, y: 202.5 }, { x: 478, y: 202.5 })
      .setStops(
        {
          offset: Number(((isNaN(xpbar) ? 30 : xpbar) / 475).toFixed(3)),
          color: "#ffffff",
        },
        {
          offset: Number(((isNaN(xpbar) ? 30 : xpbar) / 475).toFixed(3)) + 0.001,
          color: this.data.displayOptions.solid.second_component,
        },
      );

    const path = (multiplier: number) => {
      const path = new Path2D();
      path.ellipse(368, 200 * multiplier, 400, 200, 0, 0, Math.PI * 2);
      return path;
    };

    const scene = new Scene(736, 260, { debug: true });

    scene.lazyCanvas.manager.fonts.add(fontMap.wdxllubrifont);

    scene.load(
      <MorphLayer
          layout={{
              width: 736,
              height: 260,
              padding: 0,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start"
          }}
          size={{
            width: 736,
            height: 260,
            radius: { all: 30 },
          }}
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
                path2D={path(1.5)}
                color={this.data.displayOptions.solid.first_component}
                filter={Filters.blur(50)}
                globalComposite={"source-atop"}
            />
            <Path2DLayer
                path2D={path(1.75)}
                color={this.data.displayOptions.solid.second_component}
                filter={Filters.blur(40)}
                globalComposite={"source-atop"}
            />
            <Path2DLayer
                path2D={path(2)}
                color={this.data.displayOptions.solid.third_component}
                filter={Filters.blur(80)}
            />
        </Div>

        <Div
            layout={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                height: "100%",
                padding: 20,
                gap: 20
            }}
        >
            <Div
                layout={{
                    position: "relative",
                    width: 180,
                    height: 180,
                }}
            >
                <ImageLayer
                    size={{ width: 180, height: 180, radius: { all: 90 } }}
                    src={this.data.avatar}
                />
                <MorphLayer
                    layout={{
                        position: "absolute",
                    }}
                    size={{ width: 180, height: 180, radius: { all: 90 } }}
                    color={this.data.displayOptions.solid.second_component}
                    stroke={{
                        width: 3,
                    }}
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
                    font={{
                        family: "WDXL Lubrifont",
                        size: 64,
                        weight: FontWeight.Regular,
                    }}
                    align={"start"}
                    color={"#ffffff"}
                    shadow={{
                        color: "#000000",
                        blur: 4,
                    }}
                />
                <Div
                    layout={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%"
                    }}
                >
                    <TextLayer
                        text={this.data.username}
                        font={{
                            family: "WDXL Lubrifont",
                            size: 32,
                            weight: FontWeight.Regular,
                        }}
                        align={"start"}
                        color={"#ffffff"}
                        shadow={{
                            color: "#000000",
                            blur: 4,
                        }}
                    />
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
                                position: "absolute"
                            }}
                            text={`${formatTime(this.data.data.voice_time, { locale: "en", short: true })}`}
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
                                left: 140
                            }}
                            size={{ width: 25, height: 25 }}
                            src={assetsMap.microphone}
                        />
                    </MorphLayer>
                </Div>
                <MorphLayer
                    layout={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        position: "relative",
                        width: 481,
                        height: 36,
                    }}
                    size={{ width: 481, height: 36, radius: { all: 18 } }}
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
                    />
                    <TextLayer
                        layout={{
                            margin: [0, 0, 0, 20],
                        }}
                        text={`LEVEL ${this.data.data.level}`}
                        font={{
                            family: "WDXL Lubrifont",
                            size: 16,
                            weight: FontWeight.Regular,
                        }}
                        align={"left"}
                        baseline={"middle"}
                        color={gradient}
                    />
                    <TextLayer
                        layout={{
                            margin: [0, 20, 0, 0],
                        }}
                        text={`${this.data.data.xp}/${getNextLevelXP(this.data.data.level)}`}
                        font={{
                            family: "WDXL Lubrifont",
                            size: 16,
                            weight: FontWeight.Regular,
                        }}
                        align={"right"}
                        baseline={"middle"}
                        color={gradient}
                    />
                </MorphLayer>
            </Div>
        </Div>

        <MorphLayer
            layout={{
                position: "absolute",
                width: 733,
                height: 257,
                top: 1,
                left: 1,
            }}
            size={{ width: 733, height: 257, radius: { all: 28 } }}
            color={this.data.displayOptions.solid.second_component}
            stroke={{
                width: 3,
            }}
        />
      </MorphLayer>,
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
