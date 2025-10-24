import { LocalizationMap } from 'discord-api-types/v10';

export interface BaseOption {
    name: string;
    description: string;
    required: boolean;
    type: string;
    local: LocalizationMap | null;
}

export interface StringOption extends BaseOption {
    type: 'STRING';
}

export interface IntegerOption extends BaseOption {
    type: 'INTEGER';
    min: number;
    max: number;
}

export interface BooleanOption extends BaseOption {
    type: 'BOOLEAN';
}

export interface UserOption extends BaseOption {
    type: 'USER';
}

export interface MemberOption extends BaseOption {
    type: 'MEMBER';
}

export interface ChannelOption extends BaseOption {
    type: 'CHANNEL';
}

export interface RoleOption extends BaseOption {
    type: 'ROLE';
}

export interface NumberOption extends BaseOption {
    type: 'NUMBER';
    min: number;
    max: number;
}

export interface StringChoiceOption extends BaseOption {
    type: 'STRING_CHOICE';
    choices: { name: string, value: string }[];
}
