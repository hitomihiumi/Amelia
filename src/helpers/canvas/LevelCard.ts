import {
  Exporter,
  Filters,
  FontWeight,
  ImageLayer,
  LazyCanvas,
  MorphLayer,
  Path2DLayer,
  PolygonLayer,
  TextLayer
} from "@nmmty/lazycanvas";
import { LevelCardDisplayOptions } from "../../types/helpers";
import { fontMap } from "../assetsMap";

export class LevelCard {
  data: LevelCardOptions;

  constructor(data: LevelCardOptions) {
    this.data = data;
  }

  async render() {
    const canvas = new LazyCanvas({ debug: true }).create(400, 120);

    canvas.manager.fonts.add(fontMap.wdxllubrifont);

    /*


     */

    canvas.manager.layers.add(
      new MorphLayer()
        .setPosition("50%", "50%")
        .setSize(400, 120, { all: 25 })
        .setColor(this.data.displayOptions.solid.bg_color),
      new Path2DLayer()
        .setPath(
          "M12.5202 28.7737C88.5196 132.274 106.021 61.2737 147.52 56.2737C189.02 51.2737 206.021 59.273 248.52 64.2737C291.02 69.2744 318.021 73.7737 345.02 51.2737C372.02 28.7737 417.021 43.773 420.02 48.7737C423.02 53.7744 420.02 132.274 420.02 132.274L13.5202 134.274C13.5202 134.274 -63.4792 -74.7269 12.5202 28.7737Z",
        )
        .setColor(this.data.displayOptions.solid.first_component)
        .setTranslate(0, 25)
        .setFilters(Filters.blur(100))
        .setGlobalCompositeOperation("source-atop"),
      new Path2DLayer()
        .setPath(
          "M204.637 69.5732C157.137 65.0732 75.1366 62.073 141.637 29.5729C208.137 -2.92716 96.1367 -7.92672 45.6366 11.073C7.65736 25.3619 1.06894 27.2082 0.136608 27.2453V29.5731V102.573H398.137V27.0731C398.137 27.0731 349.637 24.0732 326.637 42.5732C303.636 61.0731 252.137 74.0732 204.637 69.5732Z",
        )
        .setColor(this.data.displayOptions.solid.second_component)
        .setTranslate(0, 35)
        .setFilters(Filters.blur(50))
        .setGlobalCompositeOperation("source-atop"),
      new Path2DLayer()
        .setPath(
          "M7.06006 79.8735C70.5602 88.8734 43.0608 51.8735 99.5606 41.3736C156.06 30.8738 135.061 6.87362 201.561 0.873619C268.061 -5.12638 187.561 20.8733 242.061 45.3735C296.561 69.8736 294.823 30.2734 299.561 47.3735C330.116 157.667 -56.4401 70.8737 7.06006 79.8735Z",
        )
        .setColor(this.data.displayOptions.solid.third_component)
        .setFilters(Filters.blur(80))
        .setTranslate(30, 50),
      new Path2DLayer()
        .setPath(
          "M42.7071 8.07088C43.0976 7.68035 43.0976 7.04719 42.7071 6.65666L36.3431 0.292702C35.9526 -0.0978226 35.3195 -0.0978226 34.9289 0.292702C34.5384 0.683226 34.5384 1.31639 34.9289 1.70692L40.5858 7.36377L34.9289 13.0206C34.5384 13.4111 34.5384 14.0443 34.9289 14.4348C35.3195 14.8254 35.9526 14.8254 36.3431 14.4348L42.7071 8.07088ZM0 7.36377L8.85328e-10 8.36377L42 8.36377L42 7.36377L42 6.36377L-8.85328e-10 6.36377L0 7.36377Z",
        )
        .setColor(this.data.displayOptions.solid.third_component)
        .setTranslate(107, 52.5),
      new Path2DLayer()
        .setPath(
          "M42.7071 8.07088C43.0976 7.68035 43.0976 7.04719 42.7071 6.65666L36.3431 0.292702C35.9526 -0.0978226 35.3195 -0.0978226 34.9289 0.292702C34.5384 0.683226 34.5384 1.31639 34.9289 1.70692L40.5858 7.36377L34.9289 13.0206C34.5384 13.4111 34.5384 14.0443 34.9289 14.4348C35.3195 14.8254 35.9526 14.8254 36.3431 14.4348L42.7071 8.07088ZM0 7.36377L8.85328e-10 8.36377L42 8.36377L42 7.36377L42 6.36377L-8.85328e-10 6.36377L0 7.36377Z",
        )
        .setColor(this.data.displayOptions.solid.third_component)
        .setTranslate(100, 38),
      new Path2DLayer()
        .setPath(
          "M42.7071 8.07088C43.0976 7.68035 43.0976 7.04719 42.7071 6.65666L36.3431 0.292702C35.9526 -0.0978226 35.3195 -0.0978226 34.9289 0.292702C34.5384 0.683226 34.5384 1.31639 34.9289 1.70692L40.5858 7.36377L34.9289 13.0206C34.5384 13.4111 34.5384 14.0443 34.9289 14.4348C35.3195 14.8254 35.9526 14.8254 36.3431 14.4348L42.7071 8.07088ZM0 7.36377L8.85328e-10 8.36377L42 8.36377L42 7.36377L42 6.36377L-8.85328e-10 6.36377L0 7.36377Z",
        )
        .setColor(this.data.displayOptions.solid.third_component)
        .setTranslate(100, 68),
      new MorphLayer()
        .setPosition("50%", "50%")
        .setSize(398, 118, { all: 23 })
        .setColor(this.data.displayOptions.solid.third_component)
        .setStroke(2),
      new ImageLayer().setPosition(340, 60).setSize(80, 80, { all: 40 }).setSrc(this.data.avatar),
      new MorphLayer()
        .setPosition(340, 60)
        .setSize(82, 82, { all: 41 })
        .setStroke(2)
        .setColor(this.data.displayOptions.solid.third_component),
      new PolygonLayer()
        .setPosition(60, 60)
        .setSize(80, 80, 6, 10)
        .setColor(this.data.displayOptions.solid.third_component)
        .setStroke(2),
      new TextLayer()
        .setPosition(60, 60)
        .setText(`${this.data.data.level - 1}`)
        .setFont("WDXL Lubrifont", 36, FontWeight.Regular)
        .setColor("#ffffff")
        .setAlign("center")
        .setBaseline("middle")
        .setShadow("#000000", 2, 0, 0),
      new PolygonLayer()
        .setPosition(190, 60)
        .setSize(80, 80, 6, 10)
        .setColor(this.data.displayOptions.solid.third_component)
        .setStroke(2),
      new TextLayer()
        .setPosition(190, 60)
        .setText(`${this.data.data.level}`)
        .setFont("WDXL Lubrifont", 36, FontWeight.Regular)
        .setColor("#ffffff")
        .setAlign("center")
        .setBaseline("middle")
        .setShadow("#000000", 2, 0, 0),
      new TextLayer()
        .setPosition(265, 60)
        .setText(`UP!`)
        .setFont("WDXL Lubrifont", 36, FontWeight.Regular)
        .setColor("#ffffff")
        .setAlign("center")
        .setBaseline("middle")
        .setShadow("#000000", 2, 0, 0),
    );

    return (await new Exporter(canvas).export("buffer")) as Buffer;
  }
}

type LevelCardOptions = {
  avatar: string;
  data: {
    level: number;
  };
  displayOptions: LevelCardDisplayOptions;
};
