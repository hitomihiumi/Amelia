import { SelectMenuCustom, SelectMenuOptionCustom, SCENARIO_LIMITS } from "../../types/helpers";
import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";

export class CustomSelectMenu {
  public data: SelectMenuCustom;

  constructor(data: SelectMenuCustom) {
    this.data = data;
  }

  /**
   * Build a StringSelectMenuBuilder from the stored data
   */
  getSelectMenu(): StringSelectMenuBuilder {
    const menu = new StringSelectMenuBuilder().setCustomId(this.data.id);

    if (this.data.placeholder) {
      menu.setPlaceholder(this.data.placeholder);
    }

    if (this.data.minValues !== undefined) {
      menu.setMinValues(this.data.minValues);
    }

    if (this.data.maxValues !== undefined) {
      menu.setMaxValues(this.data.maxValues);
    }

    if (this.data.disabled) {
      menu.setDisabled(true);
    }

    // Add options
    if (this.data.options.length > 0) {
      const options = this.data.options.map((opt) => {
        const option = new StringSelectMenuOptionBuilder()
          .setLabel(opt.label)
          .setValue(opt.value);

        if (opt.description) {
          option.setDescription(opt.description);
        }

        if (opt.emoji) {
          option.setEmoji(opt.emoji as any);
        }

        if (opt.default) {
          option.setDefault(true);
        }

        return option;
      });

      menu.setOptions(options);
    }

    return menu;
  }

  /**
   * Get a preview select menu (disabled to prevent accidental triggers)
   */
  getPreviewSelectMenu(): StringSelectMenuBuilder {
    const menu = this.getSelectMenu();
    menu.setDisabled(true);
    return menu;
  }

  /**
   * Static method to create default select menu data
   */
  static createDefault(id: string, name: string): SelectMenuCustom {
    return {
      id,
      name,
      placeholder: "Select an option",
      minValues: 1,
      maxValues: 1,
      disabled: false,
      options: [],
    };
  }

  /**
   * Create default option data
   */
  static createDefaultOption(value: string): SelectMenuOptionCustom {
    return {
      label: "Option",
      value,
      default: false,
    };
  }

  /**
   * Validate select menu data
   */
  static validate(data: SelectMenuCustom): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.options.length === 0) {
      errors.push("Select menu must have at least one option");
    }

    if (data.options.length > SCENARIO_LIMITS.MAX_SELECT_MENU_OPTIONS) {
      errors.push(`Select menu cannot have more than ${SCENARIO_LIMITS.MAX_SELECT_MENU_OPTIONS} options`);
    }

    if (data.minValues !== undefined && data.maxValues !== undefined) {
      if (data.minValues > data.maxValues) {
        errors.push("Minimum values cannot be greater than maximum values");
      }
    }

    if (data.minValues !== undefined && data.minValues < 0) {
      errors.push("Minimum values cannot be negative");
    }

    if (data.maxValues !== undefined && data.maxValues > data.options.length) {
      errors.push("Maximum values cannot exceed the number of options");
    }

    // Validate options
    const values = new Set<string>();
    data.options.forEach((opt, index) => {
      if (!opt.label || opt.label.length === 0) {
        errors.push(`Option ${index + 1}: Label is required`);
      }

      if (opt.label && opt.label.length > 100) {
        errors.push(`Option ${index + 1}: Label must be 100 characters or less`);
      }

      if (!opt.value || opt.value.length === 0) {
        errors.push(`Option ${index + 1}: Value is required`);
      }

      if (opt.value && opt.value.length > 100) {
        errors.push(`Option ${index + 1}: Value must be 100 characters or less`);
      }

      if (opt.description && opt.description.length > 100) {
        errors.push(`Option ${index + 1}: Description must be 100 characters or less`);
      }

      if (values.has(opt.value)) {
        errors.push(`Option ${index + 1}: Duplicate value "${opt.value}"`);
      }
      values.add(opt.value);
    });

    // Check for multiple defaults when maxValues is 1
    if (data.maxValues === 1) {
      const defaultCount = data.options.filter((opt) => opt.default).length;
      if (defaultCount > 1) {
        errors.push("Only one option can be default when max values is 1");
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

