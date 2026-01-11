/** @jsx createElement */
import {
  Exporter,
  Filters,
  FontWeight,
  ImageLayer,
  MorphLayer,
  Path2DLayer,
  TextLayer,
    Scene,
    Div,
  createElement,
} from "@nmmty/lazycanvas";
import { BalanceCardDisplayOptions } from "../../types/helpers";
import { fontMap } from "../assetsMap";
import { Path2D } from "@napi-rs/canvas";

export class BalanceCard {
  data: BalanceCardOptions;

  constructor(data: BalanceCardOptions) {
    this.data = data;
  }

  async render() {
    const scene = new Scene(430, 270);

    scene.lazyCanvas.manager.fonts.add(fontMap.wdxllubrifont);

    scene.load(
        <MorphLayer
            layout={{
              width: 430,
              height: 270,
              padding: 0,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start"
            }}
            size={{
              width: 430,
              height: 270,
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
            <MorphLayer
              position={{
                x: -31,
                y: 143,
              }}
                size={{
                    width: 153,
                    height: 153,
                    radius: { all: 76 },
                }}
                color={this.data.displayOptions.solid.third_component}
                centring={"start-top"}
              globalComposite={"source-atop"}
                filter={Filters.blur(50)}
                />
            <MorphLayer
                position={{
                    x: -27,
                    y: 42,
                }}
                size={{
                    width: 153,
                    height: 153,
                    radius: { all: 76 },
                }}
                color={this.data.displayOptions.solid.third_component}
                centring={"start-top"}
                globalComposite={"source-atop"}
                filter={Filters.blur(50)}
            />
            <MorphLayer
                position={{
                    x: -12,
                    y: -39,
                }}
                size={{
                    width: 153,
                    height: 153,
                    radius: { all: 76 },
                }}
                color={this.data.displayOptions.solid.first_component}
                centring={"start-top"}
                globalComposite={"source-atop"}
                filter={Filters.blur(50)}
            />
            <MorphLayer
                position={{
                    x: 98,
                    y: -34,
                }}
                size={{
                    width: 153,
                    height: 153,
                    radius: { all: 76 },
                }}
                color={this.data.displayOptions.solid.first_component}
                centring={"start-top"}
                globalComposite={"source-atop"}
                filter={Filters.blur(50)}
            />
            <MorphLayer
                position={{
                    x: 167,
                    y: -45,
                }}
                size={{
                    width: 381,
                    height: 381,
                    radius: { all: 190 },
                }}
                color={this.data.displayOptions.solid.third_component}
                centring={"start-top"}
                globalComposite={"source-atop"}
                filter={Filters.blur(50)}
            />
            <MorphLayer
                position={{
                    x: 56,
                    y: 190,
                }}
                size={{
                    width: 290,
                    height: 290,
                    radius: { all: 145 },
                }}
                color={this.data.displayOptions.solid.second_component}
                centring={"start-top"}
                globalComposite={"source-atop"}
                filter={Filters.blur(50)}
            />
            <MorphLayer
                position={{
                    x: 330,
                    y: 200,
                }}
                size={{
                    width: 40,
                    height: 40,
                    radius: { all: 20 },
                }}
                color={"#ffffff"}
                opacity={0.6}
                centring={"start-top"}
            />
            <MorphLayer
                position={{
                    x: 354,
                    y: 200,
                }}
                size={{
                    width: 40,
                    height: 40,
                    radius: { all: 20 },
                }}
                color={"#ffffff"}
                opacity={0.6}
                centring={"start-top"}
            />
            <Path2DLayer
                path2D={new Path2D("M16.3 19.5002C17.4 17.2002 18 14.7002 18 12.0002C18 9.30024 17.4 6.70024 16.3 4.50024M12.7 17.8003C13.5 16.0003 14 14.0003 14 12.0003C14 10.0003 13.5 7.90034 12.7 6.10034M9.1001 16.1001C9.7001 14.8001 10.0001 13.4001 10.0001 12.0001C10.0001 10.6001 9.7001 9.10015 9.1001 7.90015M5.5 14.3003C5.8 13.6003 6 12.8003 6 12.0003C6 11.2003 5.8 10.3003 5.5 9.60034")}
                transform={{
                  scale: {
                    x: 2,
                    y: 2,
                  },
                    translate: {
                      x: 355,
                      y: 20,
                    }
                }}
                stroke={{
                    width: 2,
                    join: "round",
                    cap: "round",
                }}
                color={"#ffffff"}
            />
          </Div>

          <Div
              layout={{
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                width: "100%",
                height: "100%",
                padding: [0, 0, 30, 20],
                gap: 30
              }}
          >
              <Div
                    layout={{
                        flexDirection: "column",
                        position: "relative",
                        width: "100%",
                        justifyContent: "space-between",
                        gap: 20,
                    }}
              >
                  <Div
                      layout={{
                          flexDirection: "column",
                          position: "relative",
                          width: 300,
                          justifyContent: "flex-start",
                          gap: 10
                      }}
                  >
                      <Div
                          layout={{
                              flexDirection: "row",
                              position: "relative",
                              width: 300,
                              justifyContent: "flex-start",
                              gap: 5
                          }}>
                          <TextLayer
                              text={`Wallet: ${this.data.data.wallet}`}
                              font={{
                                  family: "WDXL Lubrifont",
                                  size: 20,
                                  weight: FontWeight.Regular,
                              }}
                              align={"start"}
                              color={"#ffffff"}
                              shadow={{
                                  color: "#000000",
                                  blur: 4,
                              }}
                          />
                          <ImageLayer
                              size={{
                                  width: 20,
                                  height: 20,
                              }}
                              src={this.data.emojiURL}
                              shadow={{
                                  color: "#000000",
                                  blur: 1,
                              }}/>
                      </Div>
                      <Div
                          layout={{
                              flexDirection: "row",
                              position: "relative",
                              width: 300,
                              justifyContent: "flex-start",
                              gap: 5
                          }}>
                          <TextLayer
                              text={`Bank: ${this.data.data.bank}`}
                              font={{
                                  family: "WDXL Lubrifont",
                                  size: 20,
                                  weight: FontWeight.Regular,
                              }}
                              align={"start"}
                              color={"#ffffff"}
                              shadow={{
                                  color: "#000000",
                                  blur: 4,
                              }}
                          />
                          <ImageLayer
                              size={{
                                  width: 20,
                                  height: 20,
                              }}
                              src={this.data.emojiURL}
                              shadow={{
                                  color: "#000000",
                                  blur: 1,
                              }}/>
                      </Div>
                  </Div>
                  <TextLayer
                      text={this.data.displayOptions.number}
                      font={{
                          family: "WDXL Lubrifont",
                          size: 36,
                          weight: FontWeight.Regular,
                      }}
                      align={"start"}
                      color={"#ffffff"}
                      shadow={{
                          color: "#000000",
                          blur: 4,
                      }}
                  />
              </Div>
            <TextLayer
                text={this.data.username.toUpperCase()}
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
          </Div>

          {/* Border Overlay */}
          <MorphLayer
              layout={{ position: "absolute", width: 428, height: 268, left: 1, top: 1 }}
              size={{ width: 428, height: 268, radius: { all: 28 } }}
              color={this.data.displayOptions.solid.second_component}
              stroke={{
                width: 2,
              }}
          />
        </MorphLayer>
    );

    return (await new Exporter(scene).export("buffer")) as Buffer;
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
