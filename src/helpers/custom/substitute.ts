/**
 * Placeholder substitution shared by embeds, scenario messages and Components V2 layouts.
 *
 * Placeholders: `{user.id|name|displayName|mention|avatar}`, `{channel.id|name|mention}`,
 * `{guild.id|name|icon}`, `{input.N}` / `{input.N.label}` / `{input.N.value}`,
 * `{selected.value|label}`, `{var.<name>}`, `{date}`, `{time}`, `{timestamp}`.
 * Unknown or unresolved placeholders are left untouched.
 */

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
  input?: Array<{ value: string; label: string }>;
  selected?: {
    value: string;
    label: string;
  };
  variables?: Record<string, string>;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Replaces every `{token}` with `value`. A function replacer keeps `$&`, `$1` ... in values literal. */
function replaceToken(text: string, token: string, value: string): string {
  return text.replace(new RegExp(`\\{${escapeRegExp(token)}\\}`, "g"), () => value);
}

/**
 * Substitute placeholders in `text` with the values of `context`.
 * Returns `text` untouched when it is empty or there is no context.
 */
export function substituteVariables(text: string, context?: VariableContext): string {
  if (!text || !context) return text;

  let result = text;

  if (context.user) {
    result = replaceToken(result, "user.id", context.user.id);
    result = replaceToken(result, "user.name", context.user.name);
    result = replaceToken(result, "user.displayName", context.user.displayName);
    result = replaceToken(result, "user.mention", context.user.mention);
    result = replaceToken(result, "user.avatar", context.user.avatar);
  }

  if (context.channel) {
    result = replaceToken(result, "channel.id", context.channel.id);
    result = replaceToken(result, "channel.name", context.channel.name);
    result = replaceToken(result, "channel.mention", context.channel.mention);
  }

  if (context.guild) {
    result = replaceToken(result, "guild.id", context.guild.id);
    result = replaceToken(result, "guild.name", context.guild.name);
    result = replaceToken(result, "guild.icon", context.guild.icon || "");
  }

  // Input variables by index: {input.0}, {input.0.label}, {input.0.value}
  if (context.input) {
    context.input.forEach((field, index) => {
      result = replaceToken(result, `input.${index}`, field.value);
      result = replaceToken(result, `input.${index}.label`, field.label);
      result = replaceToken(result, `input.${index}.value`, field.value);
    });
  }

  if (context.selected) {
    result = replaceToken(result, "selected.value", context.selected.value);
    result = replaceToken(result, "selected.label", context.selected.label);
  }

  if (context.variables) {
    for (const [key, value] of Object.entries(context.variables)) {
      result = replaceToken(result, `var.${key}`, value);
    }
  }

  const now = new Date();
  result = replaceToken(result, "date", now.toLocaleDateString());
  result = replaceToken(result, "time", now.toLocaleTimeString());
  result = replaceToken(result, "timestamp", Math.floor(now.getTime() / 1000).toString());

  return result;
}
