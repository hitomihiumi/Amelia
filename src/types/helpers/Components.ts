import { ModifiedClient } from "./ModifiedClient";
import { ButtonInteraction, ModalSubmitInteraction, AutocompleteInteraction, AnySelectMenuInteraction } from "discord.js";

export interface Component {
    customId: string;
    options?: {
        public: boolean;
    },
    permissions?: {
        user?: bigint;
        bot: bigint[];
    }
    run: (client: ModifiedClient, interaction: any) => void;
}

export interface Button extends Component {
    run: (client: ModifiedClient, interaction: ButtonInteraction) => void;
}

export interface Modal extends Component {
    run: (client: ModifiedClient, interaction: ModalSubmitInteraction) => void;
}

export interface SelectMenu extends Component {
    run: (client: ModifiedClient, interaction: AnySelectMenuInteraction) => void;
}

export interface Autocomplete extends Component {
    run: (client: ModifiedClient, interaction: AutocompleteInteraction) => void;
}
