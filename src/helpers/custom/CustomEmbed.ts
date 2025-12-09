import { EmbedCustom, VARIABLE_PLACEHOLDERS } from "../../types/helpers";
import { EmbedBuilder, ColorResolvable } from "discord.js";

export interface VariableContext {
  user?: {
    id: string;
    name: string;
    displayName: string;
    mention: string;
    avatar: string;
  };
  channel?: {
    id: string;
    name: string;
    mention: string;
  };
  guild?: {
    id: string;
    name: string;
    icon: string | null;
  };
  input?: Record<string, string>;
  selected?: {
    value: string;
    label: string;
  };
  variables?: Record<string, string>;
}

export class CustomEmbed {
  public data: EmbedCustom;

  constructor(data: EmbedCustom) {
    this.data = data;
  }

  /**
   * Substitute variables in text with actual values
   */
  private substituteVariables(text: string, context?: VariableContext): string {
    if (!context) return text;

    let result = text;

    // User variables
    if (context.user) {
      result = result
        .replace(/{user\.id}/g, context.user.id)
        .replace(/{user\.name}/g, context.user.name)
        .replace(/{user\.displayName}/g, context.user.displayName)
        .replace(/{user\.mention}/g, context.user.mention)
        .replace(/{user\.avatar}/g, context.user.avatar);
    }

    // Channel variables
    if (context.channel) {
      result = result
        .replace(/{channel\.id}/g, context.channel.id)
        .replace(/{channel\.name}/g, context.channel.name)
        .replace(/{channel\.mention}/g, context.channel.mention);
    }

    // Guild variables
    if (context.guild) {
      result = result
        .replace(/{guild\.id}/g, context.guild.id)
        .replace(/{guild\.name}/g, context.guild.name)
        .replace(/{guild\.icon}/g, context.guild.icon || "");
    }

    // Input variables (from modal)
    if (context.input) {
      for (const [key, value] of Object.entries(context.input)) {
        result = result.replace(new RegExp(`{input\\.${key}}`, "g"), value);
      }
    }

    // Selected value (from select menu)
    if (context.selected) {
      result = result
        .replace(/{selected\.value}/g, context.selected.value)
        .replace(/{selected\.label}/g, context.selected.label);
    }

    // Custom variables
    if (context.variables) {
      for (const [key, value] of Object.entries(context.variables)) {
        result = result.replace(new RegExp(`{var\\.${key}}`, "g"), value);
      }
    }

    // Date/time variables
    const now = new Date();
    result = result
      .replace(/{date}/g, now.toLocaleDateString())
      .replace(/{time}/g, now.toLocaleTimeString())
      .replace(/{timestamp}/g, Math.floor(now.getTime() / 1000).toString());

    return result;
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
