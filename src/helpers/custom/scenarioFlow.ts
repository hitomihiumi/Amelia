import {
  ButtonCustom,
  LayoutComponent,
  LayoutCustom,
  ScenarioAction,
  ScenarioCustom,
  ScenarioStep,
  SelectMenuCustom,
} from "../../types/helpers";

/** The stored components a step may put in front of the user. */
export interface FlowLibrary {
  buttons?: ButtonCustom[];
  selectMenus?: SelectMenuCustom[];
  layouts?: LayoutCustom[];
}

/** Message actions that can carry buttons / select menus (a DM cannot: its clicks never reach a guild). */
const MESSAGE_ACTIONS = new Set<ScenarioAction["type"]>([
  "send_message",
  "send_embed",
  "reply",
  "edit_message",
]);

function layoutComponentIds(components: LayoutComponent[], out: string[]): void {
  for (const component of components) {
    switch (component.type) {
      case "container":
        layoutComponentIds(component.children, out);
        break;
      case "section":
        if (component.accessory?.kind === "button") out.push(component.accessory.buttonId);
        break;
      case "actions":
        out.push(...component.buttons);
        if (component.selectMenuId) out.push(component.selectMenuId);
        break;
    }
  }
}

/**
 * Ids of the components an action presents and whose answer a scenario can continue from: the
 * modal of `show_modal`, the buttons / select menus of a message (or of its layout).
 * Link buttons are left out, nothing is ever sent back for them.
 */
export function awaitedComponentIds(action: ScenarioAction, library: FlowLibrary): string[] {
  if (action.type === "show_modal") return action.modalId ? [action.modalId] : [];
  if (!MESSAGE_ACTIONS.has(action.type)) return [];

  const ids: string[] = [];
  if (action.layoutId) {
    const layout = library.layouts?.find((l) => l.id === action.layoutId);
    if (layout) layoutComponentIds(layout.components ?? [], ids);
  } else {
    ids.push(...(action.buttons ?? []), ...(action.selectMenus ?? []));
  }

  const linkButtons = new Set(
    (library.buttons ?? []).filter((b) => b.style === "LINK").map((b) => b.id),
  );
  return [...new Set(ids)].filter((id) => !linkButtons.has(id));
}

/** Steps that only run as the answer to another step: nothing may fall through into them. */
export function continuationTargets(scenario: Pick<ScenarioCustom, "steps">): Set<string> {
  const targets = new Set<string>();
  for (const step of scenario.steps) {
    for (const target of Object.values(step.onInteraction ?? {})) targets.add(target);
  }
  return targets;
}

export interface FoundContinuation {
  scenario: ScenarioCustom;
  /** The step that showed the component. */
  step: ScenarioStep;
  /** The step to continue with. */
  targetStepId: string;
}

/**
 * The scenario step an interaction on `componentId` continues, if any: the first enabled scenario
 * with a step that presents the component and links it to a step that still exists.
 */
export function findContinuation(
  scenarios: ScenarioCustom[] | undefined,
  componentId: string,
  library: FlowLibrary,
): FoundContinuation | undefined {
  for (const scenario of scenarios ?? []) {
    if (!scenario.enabled) continue;
    for (const step of scenario.steps ?? []) {
      const targetStepId = step.onInteraction?.[componentId];
      if (!targetStepId) continue;
      if (!awaitedComponentIds(step.action, library).includes(componentId)) continue;
      if (!scenario.steps.some((s) => s.id === targetStepId)) continue;
      return { scenario, step, targetStepId };
    }
  }
  return undefined;
}
