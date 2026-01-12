/** @jsx createElement */
import {
  FontsList,
  Div,
  LazyCanvas,
  Link,
  MorphLayer,
  TextLayer,
  Exporter,
  Scene,
  createElement,
} from "@nmmty/lazycanvas";
import { IModalField } from "../../types/helpers";

export class ModalField {
  public id: string;
  public name: string;
  public placeholder?: string;
  public type: "short" | "long";
  public min?: number;
  public max?: number;
  public required: boolean;

  constructor(data: IModalField) {
    this.id = data.id;
    this.name = data.name;
    this.placeholder = data.placeholder;
    this.type = data.type;
    this.min = data.min;
    this.max = data.max;
    this.required = data.required;
  }

  multiline() {
    const scene = new Scene(400, 150);

    scene.load(
      <MorphLayer
        layout={{
          flexDirection: "column",
          width: "100%",
          height: "100%",
          gap: 10,
          justifyContent: "center",
          padding: 10,
        }}
        size={{ width: "100%", height: "100%" }}
        color="#36393f"
      >
        <Div
          layout={{
            flexDirection: "row",
            alignItems: "flex-start",
            padding: [0, 10, 0, 10],
            gap: 5,
          }}
        >
          <TextLayer
            text={String(this.name)
              .split(" ")
              .map((word, i) => word[0].toUpperCase() + word.slice(1))
              .join(" ")}
            font={FontsList.Geist_SemiBold(18)}
            align="start"
            baseline="bottom"
            color="#b9bbbe"
          />
          <TextLayer
            visible={this.required}
            text="*"
            font={FontsList.Geist_SemiBold(18)}
            align="start"
            baseline="bottom"
            color="#db4649"
          />
        </Div>
        <MorphLayer
          layout={{
            flexDirection: "column",
            justifyContent: "space-between",
            height: 100,
            width: 380,
          }}
          size={{
            width: 380,
            height: 100,
            radius: { all: 5 },
          }}
          color="#313339"
        >
          <TextLayer
            visible={this.placeholder !== undefined}
            text={
              String(this.placeholder).slice(0, 30) +
              (this.placeholder && this.placeholder.length > 30 ? "..." : "")
            }
            font={FontsList.GeistMono_Medium(17)}
            align="left"
            baseline="middle"
            color="#72767d"
            layout={{
              position: "absolute",
              left: 10,
              top: 10,
            }}
          />
          <TextLayer
            visible={this.max !== undefined}
            text={`${this.min ?? 0}/${this.max}`}
            font={FontsList.GeistMono_Medium(17)}
            align="right"
            baseline="middle"
            color="#72767d"
            layout={{
              position: "absolute",
              right: 10,
              bottom: 10,
            }}
          />
        </MorphLayer>
        <MorphLayer
          layout={{
            position: "absolute",
            width: 380,
            height: 100,
            top: 40,
            left: 10,
          }}
          size={{
            width: 380,
            height: 100,
            radius: { all: 5 },
          }}
          color="#141517"
          stroke={{
            width: 2,
          }}
        />
      </MorphLayer>,
    );

    return scene;
  }

  singleline() {
    const scene = new Scene(400, 100);

    scene.load(
      <MorphLayer
        layout={{
          flexDirection: "column",
          width: "100%",
          height: "100%",
          gap: 10,
          justifyContent: "center",
          padding: 10,
        }}
        size={{ width: "100%", height: "100%" }}
        color="#36393f"
      >
        <Div
          layout={{
            flexDirection: "row",
            alignItems: "flex-start",
            padding: [0, 10, 0, 10],
            gap: 5,
            height: 18,
          }}
        >
          <TextLayer
            text={String(this.name)
              .split(" ")
              .map((word, i) => word[0].toUpperCase() + word.slice(1))
              .join(" ")}
            font={FontsList.Geist_SemiBold(18)}
            align="start"
            baseline="bottom"
            color="#b9bbbe"
          />
          <TextLayer
            visible={this.required}
            text="*"
            font={FontsList.Geist_SemiBold(18)}
            align="start"
            baseline="bottom"
            color="#db4649"
          />
        </Div>
        <MorphLayer
          layout={{
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: 50,
            width: 380,
          }}
          size={{
            width: 380,
            height: 50,
            radius: { all: 5 },
          }}
          color="#313339"
        >
          <TextLayer
            visible={this.placeholder !== undefined}
            text={
              String(this.placeholder).slice(0, 30) +
              (this.placeholder && this.placeholder.length > 30 ? "..." : "")
            }
            font={FontsList.GeistMono_Medium(17)}
            align="left"
            baseline="middle"
            color="#72767d"
            layout={{
              position: "absolute",
              top: 17,
              left: 10,
            }}
          />
        </MorphLayer>
        <MorphLayer
          layout={{
            position: "absolute",
            width: 380,
            height: 50,
            top: 40,
            left: 10,
          }}
          size={{
            width: 380,
            height: 50,
            radius: { all: 5 },
          }}
          stroke={{
            width: 2,
          }}
          color="#141517"
        />
      </MorphLayer>,
    );

    return scene;
  }

  async render() {
    const scene = this.type === "long" ? this.multiline() : this.singleline();

    return (await new Exporter(scene).export("buffer")) as Buffer;
  }
}
