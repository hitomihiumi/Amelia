import { ModalCustom } from "../../types/helpers";
import { ActionRowBuilder, ModalBuilder, ModalActionRowComponentBuilder, TextInputStyle, TextInputBuilder } from "discord.js";

export class CustomModal {
    public data: ModalCustom;

    constructor(data: ModalCustom) {
        this.data = data;
    }

    getModal() {
        return new ModalBuilder()
            .setTitle(this.data.title)
            .setCustomId(this.data.id)
            .setComponents(
                this.data.fields.map((field) => {
                    let fl = new TextInputBuilder()
                        .setCustomId(field.id)
                        .setLabel(field.name)
                        .setRequired(field.required)
                        .setStyle(field.type === 'short' ? TextInputStyle.Short : TextInputStyle.Paragraph)

                    if (field.placeholder) fl.setPlaceholder(field.placeholder);
                    if (field.min) fl.setMinLength(field.min);
                    if (field.max) fl.setMaxLength(field.max);

                    return new ActionRowBuilder<ModalActionRowComponentBuilder>()
                        .setComponents(
                            fl
                        )
                })
            )
    }
}