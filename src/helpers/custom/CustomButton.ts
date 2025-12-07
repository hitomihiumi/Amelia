import { ButtonCustom } from "../../types/helpers";
import { ButtonBuilder, ButtonStyle } from "discord.js";

const STYLE_MAP: Record<ButtonCustom["style"], ButtonStyle> = {
  PRIMARY: ButtonStyle.Primary,
  SECONDARY: ButtonStyle.Secondary,
  SUCCESS: ButtonStyle.Success,
  DANGER: ButtonStyle.Danger,
  LINK: ButtonStyle.Link,
};

export class CustomButton {
  public data: ButtonCustom;

  constructor(data: ButtonCustom) {
    this.data = data;
  }

  /**
   * Build a ButtonBuilder from the stored data
   */
  getButton(): ButtonBuilder {
    const button = new ButtonBuilder()
      .setLabel(this.data.label)
      .setStyle(STYLE_MAP[this.data.style]);

    // Custom ID only for non-LINK buttons
    if (this.data.style !== "LINK") {
      button.setCustomId(this.data.id);
    }

    // URL only for LINK buttons
    if (this.data.style === "LINK" && this.data.url) {
      button.setURL(this.data.url);
    }

    if (this.data.emoji) {
      button.setEmoji(this.data.emoji as any);
    }

    if (this.data.disabled) {
      button.setDisabled(true);
    }

    return button;
  }

  /**
   * Get a preview button (always disabled to prevent accidental triggers)
   */
  getPreviewButton(): ButtonBuilder {
    const button = this.getButton();

    // For link buttons, we can't disable them, but for preview we'll show them enabled
    if (this.data.style !== "LINK") {
      button.setDisabled(true);
    }

    return button;
  }

  /**
   * Static method to create default button data
   */
  static createDefault(id: string, name: string): ButtonCustom {
    return {
      id,
      name,
      label: "Button",
      style: "PRIMARY",
      disabled: false,
    };
  }

  /**
   * Validate button data
   */
  static validate(data: ButtonCustom): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.label || data.label.length === 0) {
      errors.push("Button label is required");
    }

    if (data.label && data.label.length > 80) {
      errors.push("Button label must be 80 characters or less");
    }

    if (data.style === "LINK" && !data.url) {
      errors.push("Link buttons require a URL");
    }

    if (data.style !== "LINK" && data.url) {
      errors.push("Only link buttons can have URLs");
    }

    if (data.url && !isValidUrl(data.url)) {
      errors.push("Invalid URL format");
    }

    return { valid: errors.length === 0, errors };
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return url.startsWith("http://") || url.startsWith("https://");
  } catch {
    return false;
  }
}

