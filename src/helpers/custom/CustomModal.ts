import { ModalCustom } from "../../types/helpers";
import {
  ActionRowBuilder,
  ModalBuilder,
  ModalActionRowComponentBuilder,
  TextInputStyle,
  TextInputBuilder,
} from "discord.js";
import { substituteFitted, VariableContext } from "./substitute";

export class CustomModal {
  public data: ModalCustom;

  constructor(data: ModalCustom) {
    this.data = data;
  }

  /** Build the modal; placeholders in the title, labels and hints are resolved with `context`. */
  getModal(context?: VariableContext) {
    return new ModalBuilder()
      .setTitle(substituteFitted(this.data.title, 45, context))
      .setCustomId(this.data.id)
      .setComponents(
        this.data.fields.map((field) => {
          let fl = new TextInputBuilder()
            .setCustomId(field.id)
            .setLabel(substituteFitted(field.name, 45, context))
            .setRequired(field.required)
            .setStyle(field.type === "short" ? TextInputStyle.Short : TextInputStyle.Paragraph);

          if (field.placeholder) fl.setPlaceholder(substituteFitted(field.placeholder, 100, context));
          if (field.min) fl.setMinLength(field.min);
          if (field.max) fl.setMaxLength(field.max);

          return new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(fl);
        }),
      );
  }
}
