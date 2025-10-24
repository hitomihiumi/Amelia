import { FontsList, Group, LazyCanvas, Link, MorphLayer, TextLayer, Exporter } from "@nmmty/lazycanvas";
import { IModalField } from "../../types/helpers";

export class ModalField {
    public id: string;
    public name: string;
    public placeholder?: string;
    public type: 'short' | 'long';
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

    async render() {
        const canvas = new LazyCanvas()
            .create(400, this.type === 'short' ? 100 : 150);

        canvas.manager.layers.add(
            new Group()
                .setID('short')
                .setVisible(this.type === 'short')
                .add(
                    new MorphLayer()
                        .setPosition(200, 65)
                        .setSize(400, 250)
                        .setColor('#36393f'),
                    new MorphLayer()
                        .setPosition(200, 65)
                        .setSize(380, 50, { all: 5 })
                        .setColor('#313339'),
                    new MorphLayer()
                        .setPosition(200, 65)
                        .setSize(380, 50, { all: 5 })
                        .setColor('#141517')
                        .setStroke(1),
                    new TextLayer()
                        .setID('label')
                        .setPosition(10, 30)
                        .setText(String(this.name).split(' ').map((word, i) => word[0].toUpperCase() + word.slice(1)).join(' '))
                        .setFont(FontsList.Geist_SemiBold(18))
                        .setAlign('start')
                        .setBaseline('bottom')
                        .setColor('#b9bbbe'),
                    new TextLayer()
                        .setPosition(new Link()
                                .setSource('label')
                                .setType('width')
                                .setSpacing(15)
                            , 30)
                        .setText('*')
                        .setFont(FontsList.Geist_SemiBold(18))
                        .setAlign('start')
                        .setBaseline('bottom')
                        .setColor('#db4649')
                        .setVisible(this.required),
                    new TextLayer()
                        .setPosition(20, 64)
                        .setText(String(this.placeholder).slice(0, 30) + (this.placeholder && this.placeholder.length > 30 ? '...' : ''))
                        .setFont(FontsList.GeistMono_Medium(17))
                        .setAlign('left')
                        .setBaseline('middle')
                        .setColor('#72767d')
                        .setVisible(this.placeholder !== undefined),
                ),
            new Group()
                .setID('long')
                .setVisible(this.type === 'long')
                .add(
                    new MorphLayer()
                        .setPosition(200, 90)
                        .setSize(400, 250)
                        .setColor('#36393f'),
                    new MorphLayer()
                        .setPosition(200, 90)
                        .setSize(380, 100, { all: 5 })
                        .setColor('#313339'),
                    new MorphLayer()
                        .setPosition(200, 90)
                        .setSize(380, 100, { all: 5 })
                        .setColor('#141517')
                        .setStroke(1),
                    new TextLayer()
                        .setID('label')
                        .setPosition(10, 30)
                        .setText(String(this.name).split(' ').map((word, i) => word[0].toUpperCase() + word.slice(1)).join(' '))
                        .setFont(FontsList.Geist_SemiBold(18))
                        .setAlign('start')
                        .setBaseline('bottom')
                        .setColor('#b9bbbe'),
                    new TextLayer()
                        .setPosition(new Link()
                                .setSource('label')
                                .setType('width')
                                .setSpacing(15)
                            , 30)
                        .setText('*')
                        .setFont(FontsList.Geist_SemiBold(18))
                        .setAlign('start')
                        .setBaseline('bottom')
                        .setColor('#db4649')
                        .setVisible(this.required),
                    new TextLayer()
                        .setPosition(375, 130)
                        .setText(String(this.max))
                        .setFont(FontsList.GeistMono_Medium(14))
                        .setAlign('end')
                        .setBaseline('bottom')
                        .setColor('#72767d')
                        .setVisible(this.max !== undefined),
                    new TextLayer()
                        .setPosition(20, 60)
                        .setText(String(this.placeholder).slice(0, 30) + (this.placeholder && this.placeholder.length > 30 ? '...' : ''))
                        .setFont(FontsList.GeistMono_Medium(17))
                        .setAlign('left')
                        .setBaseline('middle')
                        .setColor('#72767d')
                        .setVisible(this.placeholder !== undefined),
                )
        )

        return await (new Exporter(canvas)).export('buffer') as Buffer;
    }
}