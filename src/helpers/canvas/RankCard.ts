import { FontsList, Group, LazyCanvas, Link, MorphLayer, TextLayer, Exporter, Filters, ImageLayer, Utils } from "@nmmty/lazycanvas";
import { RankCardDisplayOptions } from "../../types/helpers";
import { formatTime } from "../../handlers/functions";
import {assetsMap} from "../assetsMap";

export class RankCard {
    data: RankCardOptions;

    constructor(data: RankCardOptions) {
        this.data = data;
    }

    async render() {

        const canvas = new LazyCanvas({ debug: true })
            .create(800, 350);

        canvas.manager.layers.add(
            new ImageLayer()
                .setPosition('50%', '50%')
                .setSize(800, 350, { all: 30 })
                .setSrc('https://i.pinimg.com/1200x/48/1f/db/481fdbecbdf0a888aaf179cf5819dcb8.jpg'),
            new MorphLayer()
                .setPosition(155, 175)
                .setSize(210, 350)
                .setColor('#2f3136')
                .setOpacity(0.5)
                .setFilters(Filters.blur(5)),
            new MorphLayer()
                .setPosition(155, 265)
                .setSize(180, 40, { all: 5 })
                .setColor('#f1f1f1'),
            new TextLayer()
                .setPosition(155, 265)
                .setFont(FontsList.Geist_SemiBold(30))
                .setAlign('center')
                .setBaseline('middle')
                .setColor('#232323')
                .setText(formatTime(this.data.data.voice_time, { short: true })),
            new ImageLayer()
                .setPosition(85, 265)
                .setSize(27, 35)
                .setSrc(assetsMap.microphone),
            new ImageLayer()
                .setPosition(155, 135)
                .setSize(170, 170, { all: 20 })
                .setSrc(this.data.avatar),
            new MorphLayer()
                .setPosition(595, 210)
                .setSize(400, 40, { all: 10 })
                .setColor(this.data.displayOptions.color || '#fff'),
            Utils.grid({ x: 800, y: 350 }, { cellWith: 35, cellHeight: 35 })
        )

        return await (new Exporter(canvas)).export('buffer') as Buffer;
    }
}

type RankCardOptions = {
    avatar: string;
    username: string;
    data: {
        level: number;
        xp: number;
        total_xp: number;
        voice_time: number;
        message_count: number;
        rank: number;
    }
    displayOptions: RankCardDisplayOptions;
}