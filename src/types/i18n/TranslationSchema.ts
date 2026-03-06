import {LiteralSchemaKey, SchemaKey} from "../helpers";

/**
 * Base structure of a language package
 * All languages should implement this structure
 */
export interface TranslationSchema {
  // General translations
  common: {
    error: {
      title: string;
      unknown: string;
      permission_denied: string;
      cooldown: string;
    };
    success: {
      title: string;
    };
    info: {
      title: string;
    };
  };

  // Commands
  commands: {
    permissions: {
      embeds: {
        base: {
          title: string;
          description: string;
        };
        command: {
          title: string;
          description: string;
        };
        role: {
          title: string;
          description: string;
        };
      };
      buttons: {
        back: string;
        submit: string;
        delete: string;
        allow: string;
        deny: string;
      };
      select_menus: {
        commands: {
          placeholder: string;
          description: string;
        };
        permissions: {
          placeholder: string;
        };
        roles: {
          placeholder: string;
          allow: string;
          deny: string;
          add: string;
        };
        role: {
          placeholder: string;
        };
      };
      modals: {
        jump: {
          title: string;
          label: string;
        };
      };
      messages: {
        role: {
          error: string;
        };
      };
    };

    jtc: {
      embeds: {
        title: string;
        description: string;
        fields: {
          status: {
            status: string;
            enabled: string;
            disabled: string;
          };
          empty: string;
          category: string;
          channel: string;
          default_name: string;
        };
      };
      buttons: {
        enable: string;
        disable: string;
        setup: string;
        set_channel: string;
        change_name: string;
      };
      select_menus: {
        channel: {
          placeholder: string;
        };
      };
      modals: {
        change_name: {
          title: string;
          label: string;
          placeholder: string;
        };
      };
      messages: {
        channel: {
          set: string;
          error: string;
          success: string;
        };
        setup: {
          error: string;
          success: string;
        };
      };
    };

    modal: {
      embeds: {
        base: {
          title: string;
          description: string;
        };
        edit: {
          title: string;
          description: string;
          field: {
            name: string;
            value: string;
          };
        };
        edit_field: {
          title: string;
          description: string;
          fields: {
            name: {
              name: string;
              value: string;
            };
            placeholder: {
              name: string;
              value: string;
            };
            style: {
              name: string;
              value: string;
            };
            sizes: {
              name: string;
              value: string;
            };
            required: {
              name: string;
              value: string;
            };
          };
        };
        search: {
          title: string;
          description: string;
          field: {
            name: string;
            value: string;
          };
        };
      };
      buttons: {
        edit_modal: {
          title: string;
          preview: string;
          back: string;
          delete: string;
          save: string;
        };
        edit_field: {
          label: string;
          placeholder: string;
          style: string;
          sizes: string;
          required: string;
          delete: string;
        };
      };
      select_menus: {
        base: {
          placeholder: string;
          options: {
            create: {
              label: string;
              description: string;
            };
            edit: {
              label: string;
              description: string;
            };
          };
        };
        select: {
          placeholder: string;
        };
        select_field: {
          placeholder: string;
          options: {
            main: {
              label: string;
              description: string;
            };
            add: {
              label: string;
              description: string;
            };
          };
        };
      };
      modals: {
        jump: {
          title: string;
          label: string;
        };
        search: {
          title: string;
          label: string;
        };
        edit: {
          title: string;
          label: string;
        };
        edit_field: {
          label: {
            title: string;
            label: string;
          };
          placeholder: {
            title: string;
            label: string;
          };
          sizes: {
            title: string;
            min: string;
            max: string;
          };
        };
      };
      messages: {
        no_fields: string;
      };
    };

    rank: {
      error: string;
      success: string;
    };

    profile: {
      error: string;
      success: string;
    };

    balance: {
      error: string;
      success: string;
    };

    work: {
      messages: {
        disabled: string;
        cooldown: string;
        success: string;
      };
    };

    timely: {
      messages: {
        disabled: string;
        cooldown: string;
        success: string;
      };
    };

    daily: {
      messages: {
        disabled: string;
        cooldown: string;
        success: string;
      };
    };

    weekly: {
      messages: {
        disabled: string;
        cooldown: string;
        success: string;
      };
    };

    rob: {
      messages: {
        disabled: string;
        cooldown: string;
        self: string;
        bot: string;
        no_money: string;
        success: string;
        fail: string;
      };
    };

    bank: {
      messages: {
        invalid_amount: string;
        insufficient_wallet: string;
        insufficient_bank: string;
        no_money_wallet: string;
        no_money_bank: string;
        deposit_success: string;
        withdraw_success: string;
      };
      fields: {
        wallet: string;
        bank: string;
      };
    };

    shop: {
      embeds: {
        main: {
          title: string;
          description: string;
          fields: {
            roles: string;
          };
          footer: string;
        };
        purchase: {
          title: string;
          fields: {
            new_balance: string;
          };
        };
      };
      messages: {
        empty: string;
        role_not_found: string;
        already_owned: string;
        insufficient_funds: string;
        purchase_success: string;
        purchase_error: string;
      };
      select_menus: {
        buy: {
          placeholder: string;
        };
      };
    };

    appearance: {
      embeds: {
        base: {
          title: string;
          description: string;
        };
        rank: {
          title: string;
          description: string;
        };
        level_up: {
          title: string;
          description: string;
        };
        profile: {
          title: string;
          description: string;
        };
        fields: {
          bg_color: {
            name: string;
            value: string;
          };
          first_component: {
            name: string;
            value: string;
          };
          second_component: {
            name: string;
            value: string;
          };
          third_component: {
            name: string;
            value: string;
          };
        };
      };
      select_menus: {
        base: {
          placeholder: string;
          options: {
            rank: string;
            profile: string;
            level_up: string;
          };
        };
        color: {
          placeholder: string;
          options: {
            bg_color: string;
            first_component: string;
            second_component: string;
            third_component: string;
          };
        };
        icons: {
          placeholder: string;
          options: {
            empty: {
              label: string;
            };
            remove: {
              description: string;
            };
            add: {
              description: string;
            };
          };
        };
      };
      buttons: {
        mode: string;
        url: string;
        reset: string;
        icons_padding: string;
        bio: string;
      };
      modals: {
        color: {
          title: string;
          label: string;
        };
        url: {
          title: string;
          label: string;
        };
        bio: {
          title: string;
          label: string;
        };
        icons_padding: {
          title: string;
          label: string;
        };
      };
      messages: {
        error: {
          invalid_color: string;
          invalid_url: string;
          invalid_padding: string;
          no_available_icons: string;
        };
      };
    };

    language: {
      embeds: {
        base: {
          title: string;
          description: string;
        };
      };
      select_menus: {
        placeholder: string;
        options: {
          en: {
            label: string;
            description: string;
          };
          ru: {
            label: string;
            description: string;
          };
          uk: {
            label: string;
            description: string;
          };
        };
      };
      messages: {
        success: string;
      };
    };

    levels: {
      embeds: {
        base: {
          title: string;
          description: string;
          fields: {
            status: {
              name: string;
              enabled: string;
              disabled: string;
            };
            ignored_channels: {
              name: string;
              none: string;
            };
            ignored_roles: {
              name: string;
              none: string;
            };
            level_roles: {
              name: string;
              none: string;
              level_format: string;
            };
          };
        };
        ignore: {
          title: string;
          description: string;
          fields: {
            ignored_channels: {
              name: string;
              none: string;
            };
            ignored_roles: {
              name: string;
              none: string;
            };
          };
        };
        level_roles: {
          title: string;
          description: string;
          fields: {
            current_roles: {
              name: string;
              none: string;
              level_format: string;
            };
          };
        };
      };
      buttons: {
        enable: string;
        disable: string;
        back: string;
        add_level_role: string;
        remove_level_role: string;
        cancel: string;
      };
      select_menus: {
        main: {
          placeholder: string;
          options: {
            ignore: {
              label: string;
              description: string;
            };
            level_roles: {
              label: string;
              description: string;
            };
          };
        };
        ignore_channel: {
          placeholder: string;
        };
        ignore_role: {
          placeholder: string;
        };
        level_role: {
          placeholder: string;
        };
        select_role: {
          placeholder: string;
        };
      };
      modals: {
        add_level_role: {
          title: string;
          level: {
            label: string;
            placeholder: string;
          };
        };
        remove_level_role: {
          title: string;
          level: {
            label: string;
            placeholder: string;
          };
        };
      };
      messages: {
        max_channels: string;
        max_roles: string;
        invalid_level: string;
        role_not_found: string;
        level_role_not_found: string;
        select_role_for_level: string;
        role_added: string;
        cancelled: string;
      };
    };

    economy: {
      embeds: {
        base: {
          title: string;
          description: string;
          fields: {
            currency: {
              name: string;
              value: string;
              default: string;
            };
            shop_roles: {
              name: string;
              none: string;
              format: string;
            };
          };
        };
        currency: {
          title: string;
          description: string;
          fields: {
            current: {
              name: string;
              default: string;
            };
          };
        };
        currency_emoji: {
          title: string;
          description: string;
          footer: string;
        };
        shop: {
          title: string;
          description: string;
          fields: {
            roles: {
              name: string;
              none: string;
              format: string;
              discount_format: string;
              discount_active: string;
              discount_scheduled: string;
              discount_expired: string;
            };
          };
        };
        income: {
          title: string;
          description: string;
        };
        work: {
          title: string;
          description: string;
          fields: {
            status: {
              name: string;
              enabled: string;
              disabled: string;
            };
            cooldown: {
              name: string;
              value: string;
            };
            reward: {
              name: string;
              value: string;
            };
          };
        };
        timely: {
          title: string;
          description: string;
          fields: {
            status: {
              name: string;
              enabled: string;
              disabled: string;
            };
            amount: {
              name: string;
              value: string;
            };
          };
        };
        daily: {
          title: string;
          description: string;
          fields: {
            status: {
              name: string;
              enabled: string;
              disabled: string;
            };
            amount: {
              name: string;
              value: string;
            };
          };
        };
        weekly: {
          title: string;
          description: string;
          fields: {
            status: {
              name: string;
              enabled: string;
              disabled: string;
            };
            amount: {
              name: string;
              value: string;
            };
          };
        };
        level_up: {
          title: string;
          description: string;
          fields: {
            status: {
              name: string;
              enabled: string;
              disabled: string;
            };
            amount: {
              name: string;
              value: string;
            };
          };
        };
        bump: {
          title: string;
          description: string;
          fields: {
            status: {
              name: string;
              enabled: string;
              disabled: string;
            };
            amount: {
              name: string;
              value: string;
            };
          };
        };
        rob: {
          title: string;
          description: string;
          fields: {
            status: {
              name: string;
              enabled: string;
              disabled: string;
            };
            cooldown: {
              name: string;
              value: string;
            };
            income: {
              name: string;
              value: string;
            };
            punishment: {
              name: string;
              value: string;
            };
            fail_chance: {
              name: string;
              value: string;
            };
          };
        };
      };
      buttons: {
        back: string;
        toggle: string;
        enable: string;
        disable: string;
        edit: string;
        add_role: string;
        remove_role: string;
        set_emoji: string;
        reset_emoji: string;
        set_discount: string;
        remove_discount: string;
      };
      select_menus: {
        main: {
          placeholder: string;
          options: {
            currency: {
              label: string;
              description: string;
            };
            shop: {
              label: string;
              description: string;
            };
            income: {
              label: string;
              description: string;
            };
          };
        };
        income: {
          placeholder: string;
          options: {
            work: {
              label: string;
              description: string;
            };
            timely: {
              label: string;
              description: string;
            };
            daily: {
              label: string;
              description: string;
            };
            weekly: {
              label: string;
              description: string;
            };
            level_up: {
              label: string;
              description: string;
            };
            bump: {
              label: string;
              description: string;
            };
            rob: {
              label: string;
              description: string;
            };
          };
        };
        shop_role: {
          placeholder: string;
        };
        manage_role: {
          placeholder: string;
        };
        emoji: {
          placeholder: string;
        };
      };
      modals: {
        currency: {
          title: string;
          emoji: {
            label: string;
            placeholder: string;
          };
        };
        shop_role: {
          title: string;
          price: {
            label: string;
            placeholder: string;
          };
        };
        discount: {
          title: string;
          amount: {
            label: string;
            placeholder: string;
          };
          starts_at: {
            label: string;
            placeholder: string;
          };
          expires_at: {
            label: string;
            placeholder: string;
          };
        };
        remove_role: {
          title: string;
          role: {
            label: string;
            placeholder: string;
          };
        };
        work: {
          title: string;
          cooldown: {
            label: string;
            placeholder: string;
          };
          min: {
            label: string;
            placeholder: string;
          };
          max: {
            label: string;
            placeholder: string;
          };
        };
        simple_amount: {
          title: string;
          amount: {
            label: string;
            placeholder: string;
          };
        };
        rob: {
          title: string;
          cooldown: {
            label: string;
            placeholder: string;
          };
        };
        rob_income: {
          title: string;
          min: {
            label: string;
            placeholder: string;
          };
          max: {
            label: string;
            placeholder: string;
          };
          type: {
            label: string;
            placeholder: string;
          };
        };
        rob_punishment: {
          title: string;
          min: {
            label: string;
            placeholder: string;
          };
          max: {
            label: string;
            placeholder: string;
          };
          type: {
            label: string;
            placeholder: string;
          };
          fail_chance: {
            label: string;
            placeholder: string;
          };
        };
      };
      messages: {
        invalid_emoji: string;
        invalid_number: string;
        invalid_type: string;
        invalid_date: string;
        role_added: string;
        role_removed: string;
        role_not_found: string;
        currency_set: string;
        currency_reset: string;
        settings_updated: string;
        discount_set: string;
        discount_removed: string;
        select_role_to_manage: string;
      };
    };

    games: {
      embeds: {
        base: {
          title: string;
          description: string;
          fields: {
            status: {
              name: string;
              enabled: string;
              disabled: string;
            };
            channel: {
              name: string;
              value: string;
              none: string;
            };
            send_channel: {
              name: string;
              value: string;
              none: string;
            };
            games_count: {
              name: string;
              value: string;
            };
          };
        };
        embed_settings: {
          title: string;
          description: string;
          fields: {
            title: {
              name: string;
              value: string;
              none: string;
            };
            description: {
              name: string;
              value: string;
              none: string;
            };
            color: {
              name: string;
              value: string;
              none: string;
            };
            thumbnail: {
              name: string;
              value: string;
              none: string;
            };
            image: {
              name: string;
              value: string;
              none: string;
            };
            footer: {
              name: string;
              value: string;
              none: string;
            };
          };
        };
        games_list: {
          title: string;
          description: string;
          fields: {
            games: {
              name: string;
              none: string;
              format: string;
            };
          };
        };
        game_edit: {
          title: string;
          description: string;
          fields: {
            name: {
              name: string;
              value: string;
            };
            emoji: {
              name: string;
              value: string;
              none: string;
            };
            role: {
              name: string;
              value: string;
              none: string;
            };
            modal_title: {
              name: string;
              value: string;
            };
            fields_count: {
              name: string;
              value: string;
            };
          };
        };
        game_field_edit: {
          title: string;
          description: string;
          fields: {
            name: {
              name: string;
              value: string;
            };
            placeholder: {
              name: string;
              value: string;
            };
            style: {
              name: string;
              value: string;
            };
            sizes: {
              name: string;
              value: string;
            };
            required: {
              name: string;
              value: string;
            };
          };
        };
        preview: {
          title: string;
          description: string;
          footer: string;
        };
        game_emoji: {
          title: string;
          description: string;
          fields: {
            current: {
              name: string;
            };
            game: {
              name: string;
            };
          };
        };
        find_team_result: {
          default_title: string;
          fields: {
            organizer: string;
            voice_channel: string;
          };
        };
      };
      buttons: {
        enable: string;
        disable: string;
        back: string;
        setup: string;
        send_embed: string;
        add_game: string;
        delete_game: string;
        edit_name: string;
        edit_emoji: string;
        edit_role: string;
        edit_modal_title: string;
        add_field: string;
        delete_field: string;
        edit_label: string;
        edit_placeholder: string;
        toggle_style: string;
        edit_sizes: string;
        toggle_required: string;
        preview: string;
        join: string;
        reset_emoji: string;
      };
      select_menus: {
        main: {
          placeholder: string;
          options: {
            channels: {
              label: string;
              description: string;
            };
            embed: {
              label: string;
              description: string;
            };
            games: {
              label: string;
              description: string;
            };
          };
        };
        embed: {
          placeholder: string;
          options: {
            title: {
              label: string;
              description: string;
            };
            description: {
              label: string;
              description: string;
            };
            color: {
              label: string;
              description: string;
            };
            thumbnail: {
              label: string;
              description: string;
            };
            image: {
              label: string;
              description: string;
            };
            footer: {
              label: string;
              description: string;
            };
            placeholder: {
              label: string;
              description: string;
            };
          };
        };
        games: {
          placeholder: string;
          options: {
            add: {
              label: string;
              description: string;
            };
          };
        };
        game_fields: {
          placeholder: string;
          options: {
            main: {
              label: string;
              description: string;
            };
            add: {
              label: string;
              description: string;
            };
          };
        };
        select_channel: {
          placeholder: string;
        };
        send_channel: {
          placeholder: string;
        };
        find_team: {
          placeholder: string;
          default_placeholder: string;
        };
        emoji: {
          placeholder: string;
        };
      };
      modals: {
        embed_title: {
          title: string;
          label: string;
          placeholder: string;
        };
        embed_description: {
          title: string;
          label: string;
          placeholder: string;
        };
        embed_color: {
          title: string;
          label: string;
          placeholder: string;
        };
        embed_thumbnail: {
          title: string;
          label: string;
          placeholder: string;
        };
        embed_image: {
          title: string;
          label: string;
          placeholder: string;
        };
        embed_footer: {
          title: string;
          label: string;
          placeholder: string;
        };
        select_placeholder: {
          title: string;
          label: string;
          placeholder: string;
        };
        game_name: {
          title: string;
          label: string;
          placeholder: string;
        };
        game_emoji: {
          title: string;
          label: string;
          placeholder: string;
        };
        game_modal_title: {
          title: string;
          label: string;
          placeholder: string;
        };
        field_label: {
          title: string;
          label: string;
          placeholder: string;
        };
        field_placeholder: {
          title: string;
          label: string;
          placeholder: string;
        };
        field_sizes: {
          title: string;
          min_label: string;
          max_label: string;
          placeholder: string;
        };
      };
      messages: {
        channel_set: string;
        send_channel_set: string;
        embed_sent: string;
        embed_updated: string;
        game_added: string;
        game_deleted: string;
        game_updated: string;
        field_added: string;
        field_deleted: string;
        field_updated: string;
        invalid_color: string;
        invalid_url: string;
        invalid_emoji: string;
        max_games: string;
        max_fields: string;
        setup_success: string;
        setup_error: string;
        not_in_voice: string;
        emoji_set: string;
        no_fields: string;
      };
    };

    backup: {
      embeds: {
        main: {
          title: string;
          description: string;
          fields: {
            backups_count: {
              name: string;
              value: string;
            };
            warning: {
              name: string;
              value: string;
            };
          };
        };
        create: {
          title: string;
          description: string;
          fields: {
            roles: {
              name: string;
              value: string;
            };
            channels: {
              name: string;
              value: string;
            };
            info: {
              name: string;
              value: string;
            };
          };
        };
        list: {
          title: string;
          description: string;
          roles: string;
          channels: string;
          fields: {
            backups: {
              name: string;
            };
            empty: {
              name: string;
              value: string;
            };
          };
        };
        view: {
          title: string;
          no_description: string;
          fields: {
            created: {
              name: string;
            };
            created_by: {
              name: string;
            };
            roles: {
              name: string;
            };
            channels: {
              name: string;
            };
          };
        };
        restore_confirm: {
          title: string;
          description: string;
          fields: {
            warning: {
              name: string;
              value: string;
            };
            actions: {
              name: string;
              value: string;
            };
          };
        };
        brutal_confirm: {
          title: string;
          description: string;
          fields: {
            warning: {
              name: string;
              value: string;
            };
            deletion: {
              name: string;
              value: string;
            };
            actions: {
              name: string;
              value: string;
            };
          };
        };
      };
      buttons: {
        create: string;
        back: string;
        restore: string;
        brutal_restore: string;
        delete: string;
        confirm_restore: string;
        confirm_brutal: string;
        cancel: string;
      };
      select_menus: {
        main: {
          placeholder: string;
          options: {
            create: {
              label: string;
              description: string;
            };
            list: {
              label: string;
              description: string;
            };
          };
        };
        list: {
          placeholder: string;
        };
      };
      modals: {
        create: {
          title: string;
          name: {
            label: string;
            placeholder: string;
          };
          description: {
            label: string;
            placeholder: string;
          };
        };
      };
      messages: {
        created: string;
        deleted: string;
        restored: string;
        restore_failed: string;
        brutal_restored: string;
        brutal_restore_failed: string;
        not_found: string;
      };
    };

    embed: {
      embeds: {
        base: { title: string; description: string };
        list: { title: string; description: string };
        edit: {
          title: string;
          description: string;
          fields: {
            name: string;
            title: string;
            color: string;
            fields_count: string;
            timestamp: string;
          };
        };
        fields: { title: string; description: string };
        field_edit: {
          title: string;
          description: string;
          fields: { name: string; value: string; inline: string };
        };
        author: {
          title: string;
          description: string;
          fields: { name: string; icon: string; url: string };
        };
        footer: {
          title: string;
          description: string;
          fields: { text: string; icon: string };
        };
      };
      select_menus: {
        base: { placeholder: string; options: { create: string; edit: string } };
        list: { placeholder: string; no_embeds: string };
        edit: {
          placeholder: string;
          options: {
            name: string;
            title: string;
            description: string;
            color: string;
            thumbnail: string;
            image: string;
            author: string;
            footer: string;
            fields: string;
            timestamp: string;
          };
        };
        fields: { placeholder: string; add: string };
      };
      buttons: {
        preview: string;
        save: string;
        delete: string;
        back: string;
        clear: string;
        field_name: string;
        field_value: string;
        field_inline: string;
        author_name: string;
        author_icon: string;
        author_url: string;
        footer_text: string;
        footer_icon: string;
      };
      modals: {
        title: { label: string };
        description: { label: string };
        color: { label: string };
        name: { label: string };
        thumbnail: { label: string };
        image: { label: string };
        author_name: { label: string };
        author_icon: { label: string };
        author_url: { label: string };
        footer_text: { label: string };
        footer_icon: { label: string };
        field_name: { label: string };
        field_value: { label: string };
        search: { title: string; label: string };
      };
      messages: { max_fields: string };
    };
    button: {
      embeds: {
        base: { title: string; description: string };
        list: { title: string; description: string };
        edit: {
          title: string;
          description: string;
          fields: {
            name: string;
            label: string;
            style: string;
            emoji: string;
            url: string;
            disabled: string;
          };
        };
        emoji: { title: string; description: string };
      };
      select_menus: {
        base: { placeholder: string; options: { create: string; edit: string } };
        list: { placeholder: string; no_buttons: string };
        style: { placeholder: string };
        emoji: { placeholder: string };
      };
      buttons: {
        name: string;
        label: string;
        emoji: string;
        url: string;
        disabled: string;
        preview: string;
        save: string;
        delete: string;
        back: string;
        clear_emoji: string;
      };
      modals: {
        label: { label: string };
        url: { label: string };
        name: { label: string };
        search: { title: string; label: string };
      };
      messages: { preview: string };
    };
    selectmenu: {
      embeds: {
        base: { title: string; description: string };
        list: { title: string; description: string };
        edit: {
          title: string;
          description: string;
          fields: {
            name: string;
            placeholder: string;
            options_count: string;
            min_values: string;
            max_values: string;
            disabled: string;
          };
        };
        options: { title: string; description: string };
        option_edit: {
          title: string;
          description: string;
          fields: {
            label: string;
            value: string;
            description: string;
            emoji: string;
            default: string;
          };
        };
        emoji: { title: string; description: string };
      };
      select_menus: {
        base: { placeholder: string; options: { create: string; edit: string } };
        list: { placeholder: string; no_menus: string };
        options: { placeholder: string; add: string };
        emoji: { placeholder: string };
      };
      buttons: {
        name: string;
        placeholder: string;
        minmax: string;
        disabled: string;
        options: string;
        preview: string;
        save: string;
        delete: string;
        back: string;
        opt_label: string;
        opt_value: string;
        opt_description: string;
        opt_emoji: string;
        clear_emoji: string;
        opt_default: string;
      };
      modals: {
        name: { label: string };
        placeholder: { label: string };
        opt_label: { label: string };
        opt_value: { label: string };
        opt_description: { label: string };
        minmax: { title: string; min_label: string; max_label: string };
        search: { title: string; label: string };
      };
      messages: { max_options: string; no_options: string; preview: string };
    };
    send: {
      embeds: {
        main: { title: string; description: string };
        select_embeds: { title: string; description: string };
        select_buttons: { title: string; description: string };
        select_selectmenus: { title: string; description: string };
        select_channel: { title: string; description: string };
        preview: { title: string; description: string };
      };
      fields: {
        content: string;
        embeds: string;
        buttons: string;
        selectmenus: string;
        channel: string;
        not_set: string;
        none: string;
        selected: string;
      };
      buttons: {
        edit_content: string;
        select_embeds: string;
        select_buttons: string;
        select_menus: string;
        select_channel: string;
        clear_content: string;
        clear_embeds: string;
        clear_buttons: string;
        clear_menus: string;
        preview: string;
        send: string;
        back: string;
      };
      messages: {
        sent: string;
        no_channel: string;
        no_content: string;
        channel_not_found: string;
        send_failed: string;
      };
    };
    scenario: {
      embeds: {
        main: { title: string; description: string };
        list: { title: string; description: string };
        edit: {
          title: string;
          fields: { status: string; steps: string; trigger: string; cooldown: string; id: string };
        };
        trigger: {
          title: string;
          description: string;
          fields: { type: string; component_id: string };
        };
        steps: {
          title: string;
          description: string;
          fields: { no_steps: string; add_step: string };
        };
        step_edit: {
          title: string;
          description: string;
          fields: {
            action_type: string;
            conditions: string;
            stop_on_failure: string;
            on_success: string;
            on_failure: string;
          };
        };
        action: {
          title: string;
          description: string;
          fields: {
            content: string;
            ephemeral: string;
            channel: string;
            embed_id: string;
            modal_id: string;
            role: string;
            thread_name: string;
            auto_archive: string;
            dm_content: string;
            dm_embed: string;
            variable_name: string;
            variable_value: string;
            delete_original: string;
            current_channel: string;
          };
        };
        conditions: {
          title: string;
          description_and: string;
          description_or: string;
          fields: { no_conditions: string };
        };
        condition_edit: {
          title: string;
          fields: { type: string; field: string; operator: string; value: string };
        };
        restrictions: {
          title: string;
          description: string;
          fields: {
            cooldown: string;
            max_executions: string;
            execution_period: string;
            allowed_roles: string;
            denied_roles: string;
            everyone: string;
            unlimited: string;
            na: string;
          };
        };
        select_component: { title: string; description: string };
        select_role: { title: string; description: string };
        select_channel: { title: string; description: string };
      };
      select_menus: {
        base: { placeholder: string; options: { create: string; edit: string } };
        list: { placeholder: string; no_scenarios: string };
        edit: {
          placeholder: string;
          options: {
            name: string;
            description: string;
            trigger: string;
            steps: string;
            restrictions: string;
            enable: string;
            disable: string;
          };
        };
        trigger_type: { placeholder: string };
        trigger_component: { placeholder: string };
        steps: { placeholder: string; add: string };
        action_type: { placeholder: string };
        action_component: { placeholder: string };
        conditions: { placeholder: string; add: string };
        condition_type: { placeholder: string };
        condition_operator: { placeholder: string };
        condition_logic: { placeholder: string; and: string; or: string };
        next_step: { placeholder: string; continue: string };
        fail_step: { placeholder: string };
      };
      buttons: {
        save: string;
        delete: string;
        back: string;
        step_name: string;
        step_action: string;
        step_conditions: string;
        stop_on_fail: string;
        action_content: string;
        action_ephemeral: string;
        action_channel: string;
        action_select_modal: string;
        action_select_embed: string;
        action_select_role: string;
        action_thread_name: string;
        action_dm_content: string;
        action_dm_embed: string;
        action_var_name: string;
        action_var_value: string;
        action_delete_original: string;
        condition_field: string;
        condition_value: string;
        cooldown: string;
        max_uses: string;
        period: string;
      };
      modals: {
        name: { title: string; label: string };
        description: { title: string; label: string };
        search: { title: string; label: string };
        step_name: { title: string; label: string };
        action_content: { title: string; label: string };
        thread_name: { title: string; label: string };
        dm_content: { title: string; label: string };
        var_name: { title: string; label: string };
        var_value: { title: string; label: string };
        condition_value: { title: string; label: string };
        condition_field: { title: string; label: string };
        cooldown: { title: string; label: string };
        max_executions: { title: string; label: string };
        execution_period: { title: string; label: string };
      };
      messages: {
        max_scenarios: string;
        max_steps: string;
        no_trigger: string;
        no_steps: string;
      };
      action_types: {
        reply: string;
        send_message: string;
        send_embed: string;
        show_modal: string;
        add_role: string;
        remove_role: string;
        create_thread: string;
        send_dm: string;
        set_variable: string;
        edit_message: string;
        delete_message: string;
      };
      trigger_types: {
        button: string;
        select_menu: string;
        modal_submit: string;
      };
      condition_operators: {
        equals: string;
        not_equals: string;
        contains: string;
        not_contains: string;
        starts_with: string;
        ends_with: string;
        greater_than: string;
        less_than: string;
        has_role: string;
        not_has_role: string;
        in_channel: string;
        not_in_channel: string;
        is_empty: string;
        is_not_empty: string;
      };
      hints: {
        title: string;
        description: string;
        categories: {
          user: string;
          channel: string;
          guild: string;
          input: string;
          selected: string;
          variables: string;
        };
        variables: {
          user_id: string;
          user_name: string;
          user_displayName: string;
          user_mention: string;
          user_avatar: string;
          channel_id: string;
          channel_name: string;
          channel_mention: string;
          guild_id: string;
          guild_name: string;
          guild_icon: string;
          input_field: string;
          input_label: string;
          selected_value: string;
          selected_label: string;
          var_custom: string;
        };
        button: string;
      };
    };

    leaderboard: {
      embeds: {
        footer: string;
        level: {
          title: string;
          description: string;
          field: {
            name: string;
            value: string;
          };
        };
        voice: {
          title: string;
          description: string;
          field: {
            name: string;
            value: string;
          };
        };
        coins: {
          title: string;
          description: string;
          field: {
            name: string;
            value: string;
          };
        };
      };
      buttons: {
        level: string;
        voice: string;
        coins: string;
      };
    };
    rp: {
      embeds: {
        hug: {
          title: string;
          description: string;
        };
        kiss: {
          title: string;
          description: string;
        };
        slap: {
          title: string;
          description: string;
        };
        pat: {
          title: string;
          description: string;
        };
        poke: {
          title: string;
          description: string;
        };
        tickle: {
          title: string;
          description: string;
        };
      };
      messages: {
        cannot_target_yourself: string;
        no_target: string;
      };
    };
  };

  // Events
  events: {
    message_create: {
      prefix: string;
      cooldown: string;
      level_up: string;
    };
    interaction_create: {
      cooldown: string;
      component_permission: string;
      component_not_active: string;
      scenario_not_found: string;
    };
  };

  // Functions/utilities
  functions: {
    permission_check: {
      commands: {
        bot_permission: string;
        user_permission: string;
        extended_permission: {
          role: {
            denied: string;
            any_role: string;
          };
        };
      };
      components: {
        bot_permission: string;
      };
      component: {
        user_permission: string;
      };
    };
    join_to_create: {
      preset: {
        placeholder: string;
        default_description: string;
        add: string;
        add_description: string;
      };
      embed: {
        title: string;
        description: string;
      };
      up_select: {
        placeholder: string;
        options: {
          rename: {
            label: string;
            description: string;
          };
          bitrate: {
            label: string;
            description: string;
          };
          limit: {
            label: string;
            description: string;
          };
          owner: {
            label: string;
            description: string;
          };
        };
      };
      down_select: {
        placeholder: string;
        options: {
          open: {
            label: string;
            description: string;
          };
          close: {
            label: string;
            description: string;
          };
          add: {
            label: string;
            description: string;
          };
          remove: {
            label: string;
            description: string;
          };
          show: {
            label: string;
            description: string;
          };
          hide: {
            label: string;
            description: string;
          };
        };
      };
      modals: {
        rename: {
          title: string;
          label: string;
          success: string;
        };
        bitrate: {
          title: string;
          label: string;
          placeholder: string;
          success: string;
          isnan: string;
          less: string;
        };
        limit: {
          title: string;
          label: string;
          placeholder: string;
          success: string;
          isnan: string;
          less: string;
        };
      };
      select_menus: {
        owner: {
          msg: string;
          placeholder: string;
        };
        add: {
          msg: string;
          placeholder: {
            user: string;
            role: string;
          };
        };
        remove: {
          msg: string;
          placeholder: {
            user: string;
            role: string;
          };
        };
      };
      errors: {
        not_owner: string;
        yourself: string;
      };
      msg: {
        owner: string;
        open: string;
        close: string;
        show: string;
        hide: string;
        add: {
          role: string;
          user: string;
        };
        remove: {
          role: string;
          user: string;
        };
      };
    };
  };

  // Permissions
  permissions: {
    add_reactions: string;
    administrator: string;
    attach_files: string;
    ban_members: string;
    change_nickname: string;
    connect: string;
    create_instant_invite: string;
    deafen_members: string;
    embed_links: string;
    kick_members: string;
    manage_channels: string;
    manage_emojis_and_stickers: string;
    manage_events: string;
    manage_guild: string;
    manage_messages: string;
    manage_nicknames: string;
    manage_roles: string;
    manage_threads: string;
    manage_webhooks: string;
    mention_everyone: string;
    moderate_members: string;
    move_members: string;
    mute_members: string;
    priority_speaker: string;
    read_message_history: string;
    request_to_speak: string;
    send_messages: string;
    send_messages_in_threads: string;
    send_tts_messages: string;
    speak: string;
    stream: string;
    use_application_commands: string;
    use_embedded_activities: string;
    use_external_emojis: string;
    use_external_stickers: string;
    use_vad: string;
    view_audit_log: string;
    view_channel: string;
    view_guild_insights: string;
  };

  icons: {
    empty: string;
  };

  time_units: {
    day: {
      short: string;
      forms: {
        more_than_10_less_then_15: string;
        more_than_1_less_then_5: string;
        more_than_5_less_then_10: string;
        singular: string;
        plural: string;
      }
    },
    hour: {
      short: string;
      forms: {
        more_than_10_less_then_15: string;
        more_than_1_less_then_5: string;
        more_than_5_less_then_10: string;
        singular: string;
        plural: string;
      }
    },
    minute: {
      short: string;
      forms: {
        more_than_10_less_then_15: string;
        more_than_1_less_then_5: string;
        more_than_5_less_then_10: string;
        singular: string;
        plural: string;
      }
    },
    second: {
      short: string;
      forms: {
        more_than_10_less_then_15: string;
        more_than_1_less_then_5: string;
        more_than_5_less_then_10: string;
        singular: string;
        plural: string;
      }
    },
  }
}

/**
 * Type-safe path to a translation
 */
export type TranslationKey = SchemaKey<TranslationSchema>;
export type LiteralTranslationKey = LiteralSchemaKey<TranslationSchema>;
