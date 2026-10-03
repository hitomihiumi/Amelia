# Components V2 layouts

A **layout** is a whole Discord message built from Components V2: containers, sections, text, separators, media galleries and rows of buttons or a select menu. Layouts are created in the dashboard and sent by scenarios.

## Data model

Stored in `Guild.componentsLayouts` (JSON), read with `guild.get("utils.components.layouts")` as `Array<LayoutCustom>`. Types, limits and the pure validator `collectLayoutIssues` live in `src/types/helpers/Layout.ts` (identical copy in the dashboard, do not edit one without the other).

- `LayoutCustom`: `{ id, name, components: LayoutComponent[] }`
- Top level: `container | text | separator | gallery | section | actions`. A container holds the same kinds except another container.
- `text`: Markdown. `separator`: `divider` + `spacing` (`small` | `large`). `gallery`: up to 10 `{ url, description?, spoiler? }`.
- `section`: 1-3 `texts` plus an accessory: `thumbnail { url, description?, spoiler? }` or `button { buttonId }`.
- `actions`: up to 5 `buttons` (ids) **or** one `selectMenuId`.
- `container`: `accentColor` (`#rrggbb` or number), `spoiler`.

Buttons and select menus are never embedded in a layout. Rows and button accessories reference the stored ones (`utils.components.buttons` / `.selectMenus`, `CI_*` custom ids) by id.

## How layouts are sent

`ScenarioAction.layoutId` selects a layout. When it is set, `content`, `embeds`, `buttons` and `selectMenus` of the action are ignored. `ScenarioRunner` builds the message with `buildLayoutPayload(layout, { buttons, selectMenus }, variableContext, { onWarn })` (`src/helpers/custom/CustomLayout.ts`) for `send_message`, `send_embed`, `reply`, `edit_message` and `send_dm`.

The payload is `{ components, flags: MessageFlags.IsComponentsV2 }` and **never** contains `content`, `embeds`, `stickers` or `poll` (Discord rejects them on V2 messages). `buildLayoutPayload` returns `null` when nothing renderable is left; the runner then logs a warning and fails the step (`Layout has nothing to show`). A `layoutId` that no longer exists fails the step the same way (`Layout not found`). As with other failed steps, the scenario continues unless the step has `stopOnFailure`.

## Limits

Enforced by the dashboard validator and, defensively, again by the bot:

| Limit | Value |
| --- | --- |
| Components per message (nested, buttons and selects included) | 40 |
| Text characters across all text displays | 4000 |
| Gallery items | 10 |
| Section texts | 3 |
| Buttons per row | 5 |
| Media description | 1024 |
| URL length | 2000 |
| Layouts per guild | 25 |

A section counts as 1 + its texts + 1 (accessory); a row as 1 + its buttons or menu; a container as 1 + its children.

## Placeholders

Text blocks, section texts, gallery URLs and descriptions, and thumbnail URLs and descriptions are substituted at send time with the same variables as embeds and scenario messages (`src/helpers/custom/substitute.ts`, the single implementation used by `CustomEmbed`, `ScenarioRunner` and `CustomLayout`): `{user.id|name|displayName|mention|avatar}`, `{channel.id|name|mention}`, `{guild.id|name|icon}`, `{input.N}`, `{input.N.label}`, `{input.N.value}`, `{selected.value|label}`, `{var.<name>}`, `{date}`, `{time}`, `{timestamp}`. Unknown placeholders stay as they are. Button labels are not substituted.

## Graceful degradation

Substitution can make a valid stored layout invalid (e.g. `{guild.icon}` is empty for a guild without icon), so the result is validated again and the bot never throws:

- Empty (or whitespace-only) text display: skipped. Section without any text: dropped.
- Section whose thumbnail URL is not a valid http(s) URL after substitution: rendered as plain text displays (no accessory).
- Gallery items with invalid URLs: dropped; empty gallery: dropped. More than 10 items: first 10. Descriptions are cut to 1024.
- Button or select menu that no longer exists (or that Discord would reject: link button without URL, menu without options): skipped. A row left empty is dropped; a section whose button accessory is missing renders as text only.
- Row with both buttons and a select menu: split into two rows. More than 5 buttons: first 5.
- Custom ids must be unique in one message: the second occurrence is skipped (a section with such a button renders as text only).
- Container left empty: dropped. Nested containers and unknown types: skipped. Invalid accent colour: ignored.
- Over 40 components: the later components are dropped (a container keeps its first children that fit). Over 4000 characters of text: the later text blocks are cut (a partially fitting block is truncated, later ones are removed).

Every degradation is logged with `console.warn` (`[ScenarioRunner] Scenario "<id>": Layout "<id>": ...`).

## Flags and editing messages

- Flags are combined with `|`, never overwritten: `reply` with `ephemeral` sends `Ephemeral | IsComponentsV2`.
- `ephemeral` only applies to `reply`; other sends go to a channel or DM.
- `edit_message` with a layout on a **classic** message sends `content: null`, `embeds: []` and the V2 flag together with the new components. On a message that is already V2 it sends components and the flag.
- `edit_message` **without** a layout on a message that has `IsComponentsV2` is impossible (the flag cannot be removed and Discord rejects content/embeds). The bot does not call the API: it logs a warning, fails the step and, if the interaction is still unanswered, replies ephemerally with `events.interaction_create.scenario_layout_edit_conflict`.

## Buttons and selects inside layouts

Layouts use the stored buttons and menus, so their `CI_*` custom ids are the same as in classic messages. A click goes through `interactionCreate` to `handleScenarioInteraction` (`src/handlers/scenarios.ts`), which runs the enabled scenario whose `trigger` matches the component id and type. A component without scenario answers with `scenario_not_found`. Scenarios without a trigger (`trigger: null`, created in the dashboard) are skipped safely.

## Sending from the dashboard

The dashboard has a **Send message** page (`/dashboard/{guildId}/send`) that posts a classic message or a layout to a channel as the bot, through the REST API and the bot token. It builds the request with its own port of the builders (`src/lib/discord/message-payload.ts` in the dashboard repository) and substitutes the same placeholders, with `{user.*}` describing the person who clicked Send. Keep the two implementations in step when the layout rules change. The `/send` slash command stays classic-only.
