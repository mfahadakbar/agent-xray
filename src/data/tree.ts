import type { Organ, OrganId, Tool, XNode } from './types';
import { brain } from './brain';
import { heart } from './heart';
import { senses } from './senses';
import { memory } from './memory';
import { hands } from './hands';
import { shield } from './shield';
import { steps } from './steps';
import { friends } from './friends';
import { checkup } from './checkup';
import { home } from './home';

export const ORGANS: Organ[] = [brain, heart, senses, memory, hands, shield, steps, friends, checkup, home];

export const ORGAN: Record<OrganId, Organ> = Object.fromEntries(ORGANS.map((o) => [o.id, o])) as Record<OrganId, Organ>;

/** The top of the map: Ray, the agent. */
export const ROOT: XNode = {
  id: 'ray',
  title: 'Ray',
  aka: 'An AI agent',
  icon: '🤖',
  tagline: 'Ray is an AI agent. Click a part to see inside.',
  simple: [
    'Ray is an AI agent. An agent is a helper that can think, remember and do things for you.',
    'You give Ray a job. Ray works out the steps and uses its tools until the job is done.',
  ],
  builder: [
    'An agent is a program that runs a language model in a loop with tools: it builds context, lets the model decide the next step, executes what it asks for, and repeats until the task is complete.',
  ],
  why: 'A chatbot answers. An agent gets things done.',
  mind: ['Every part on this map is optional. Start with a brain and one tool, and add parts when you need them.'],
  today: ['Agents that research, write code, answer customers and run business tasks.'],
  notYet: ['Agents you can leave fully alone on important work.'],
  children: ORGANS,
};

/** Walk a path of ids from Ray down. Returns the chain of nodes (without Ray), or null if the path is unknown. */
export function resolve(path: string[]): XNode[] | null {
  const chain: XNode[] = [];
  let level: XNode[] | undefined = ROOT.children;
  for (const id of path) {
    const next: XNode | undefined = level?.find((n) => n.id === id);
    if (!next) return null;
    chain.push(next);
    level = next.children;
  }
  return chain;
}

/** A node shows the closest scene above it when it has none of its own. */
export function sceneFor(chain: XNode[]): string | undefined {
  for (let i = chain.length - 1; i >= 0; i--) if (chain[i].scene) return chain[i].scene;
  return undefined;
}

export interface Flat {
  node: XNode;
  path: string[];
  organ: Organ;
  depth: number;
  key: string;
}

function flatten(): Flat[] {
  const out: Flat[] = [];
  const walk = (node: XNode, path: string[], organ: Organ) => {
    out.push({ node, path, organ, depth: path.length, key: path.join('/') });
    node.children?.forEach((c) => walk(c, [...path, c.id], organ));
  };
  ORGANS.forEach((o) => walk(o, [o.id], o));
  return out;
}

/** Every box on the map, in reading order. */
export const ALL: Flat[] = flatten();

export const TOOL_COUNT = new Set(ALL.flatMap((f) => f.node.tools?.map((t) => t.name) ?? [])).size;

export interface ToolPeek {
  tool: Tool;
  /** The box that holds it. */
  path: string[];
  where: string;
}

/** The popular tools found anywhere below a box, so that every level of the map can name real tools. */
export function popularInside(node: XNode, path: string[], limit = 12): ToolPeek[] {
  const out: ToolPeek[] = [];
  const seen = new Set<string>();
  const walk = (n: XNode, p: string[]) =>
    n.children?.forEach((c) => {
      const cp = [...p, c.id];
      c.tools?.forEach((tool) => {
        if (tool.popular && !seen.has(tool.name)) {
          seen.add(tool.name);
          out.push({ tool, path: cp, where: c.title });
        }
      });
      walk(c, cp);
    });
  walk(node, path);
  // Spread the picks across the boxes below instead of taking the first box's whole list.
  const byBox = new Map<string, ToolPeek[]>();
  out.forEach((t) => byBox.set(t.where, [...(byBox.get(t.where) ?? []), t]));
  const picks: ToolPeek[] = [];
  for (let round = 0; picks.length < limit && round < 6; round++) {
    for (const list of byBox.values()) {
      if (list[round] && picks.length < limit) picks.push(list[round]);
    }
  }
  return picks;
}

/** Count boxes and tools below a node, for the "what's inside" hint on cards. */
export function inside(node: XNode): { parts: number; tools: number } {
  let parts = 0;
  let tools = node.tools?.length ?? 0;
  const walk = (n: XNode) =>
    n.children?.forEach((c) => {
      parts++;
      tools += c.tools?.length ?? 0;
      walk(c);
    });
  walk(node);
  return { parts, tools };
}
