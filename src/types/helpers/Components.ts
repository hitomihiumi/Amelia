import {
  Client,
  ButtonInteraction,
  ModalSubmitInteraction,
  AutocompleteInteraction,
  AnySelectMenuInteraction,
} from "discord.js";

export interface Component {
  customId: string;
  options?: {
    public: boolean;
  };
  permissions?: {
    user?: bigint;
    bot: bigint[];
  };
  run: (client: Client, interaction: any) => void;
}

export interface Button extends Component {
  run: (client: Client, interaction: ButtonInteraction) => void;
}

export interface Modal extends Component {
  run: (client: Client, interaction: ModalSubmitInteraction) => void;
}

export interface SelectMenu extends Component {
  run: (client: Client, interaction: AnySelectMenuInteraction) => void;
}

export interface Autocomplete extends Component {
  run: (client: Client, interaction: AutocompleteInteraction) => void;
}
