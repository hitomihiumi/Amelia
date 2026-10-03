import { EmbedCustom } from "../../types/helpers";
import { substituteVariables, VariableContext } from "./substitute";
import { EmbedBuilder, ColorResolvable } from "discord.js";

export type { VariableContext };

export class CustomEmbed {
  public data: EmbedCustom;

  constructor(data: EmbedCustom) {
    this.data = data;
  }

  /**
   * Substitute variables in text with actual values
   */
  private substituteVariables(text: string, context?: VariableContext): string {
    return substituteVariables(text, context);
  }

  /**
   * Build an EmbedBuilder from the stored data with optional variable substitution
   */
  getEmbed(context?: VariableContext): EmbedBuilder {
    const embed = new EmbedBuilder();

    if (this.data.title) {
      embed.setTitle(this.substituteVariables(this.data.title, context));
    }

    if (this.data.description) {
      embed.setDescription(this.substituteVariables(this.data.description, context));
    }

    if (this.data.color) {
      embed.setColor(this.data.color as ColorResolvable);
    }

    if (this.data.author) {
      embed.setAuthor({
        name: this.substituteVariables(this.data.author.name, context),
        iconURL: this.data.author.icon_url
          ? this.substituteVariables(this.data.author.icon_url, context)
          : undefined,
        url: this.data.author.url
          ? this.substituteVariables(this.data.author.url, context)
          : undefined,
      });
    }

    if (this.data.thumbnail) {
      embed.setThumbnail(this.substituteVariables(this.data.thumbnail, context));
    }

    if (this.data.image) {
      embed.setImage(this.substituteVariables(this.data.image, context));
    }

    if (this.data.footer) {
      embed.setFooter({
        text: this.substituteVariables(this.data.footer.text, context),
        iconURL: this.data.footer.icon_url
          ? this.substituteVariables(this.data.footer.icon_url, context)
          : undefined,
      });
    }

    if (this.data.fields && this.data.fields.length > 0) {
      this.data.fields.forEach((field) => {
        embed.addFields({
          name: this.substituteVariables(field.name, context),
          value: this.substituteVariables(field.value, context),
          inline: field.inline,
        });
      });
    }

    if (this.data.timestamp) {
      embed.setTimestamp();
    }

    return embed;
  }

  /**
   * Static method to create default embed data
   */
  static createDefault(id: string, name: string): EmbedCustom {
    return {
      id,
      name,
      title: "New Embed",
      description: "Embed description",
      color: "#5865F2",
      fields: [],
      timestamp: false,
    };
  }
}
