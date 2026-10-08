/** How you pay for a tool. Kept deliberately coarse: plans change, the shape rarely does. */
export type Cost =
  | 'open' // open source: free to run yourself
  | 'free' // free to use, not open source
  | 'freemium' // free tier, then paid plans
  | 'paid'; // paid or pay-per-use

export interface Tool {
  name: string;
  /** One short line: what it is good for. */
  what: string;
  cost: Cost;
  popular?: boolean;
  url?: string;
}

export type OrganId =
  | 'brain'
  | 'heart'
  | 'senses'
  | 'memory'
  | 'hands'
  | 'shield'
  | 'steps'
  | 'friends'
  | 'checkup'
  | 'home';

/** One box on the map. Every level answers the same questions, simple at the top, detailed at the bottom. */
export interface XNode {
  id: string;
  title: string;
  /** The words builders use for this part. */
  aka?: string;
  icon: string;
  /** One line a five-year-old could repeat. */
  tagline: string;
  /** What this part is, in plain words. */
  simple: string[];
  /** What this part is, in builder words. */
  builder: string[];
  why: string;
  /** What to keep in mind when you build it. */
  mind: string[];
  today: string[];
  notYet: string[];
  tools?: Tool[];
  /** Key into the scene registry. Nodes without one inherit the closest ancestor's scene. */
  scene?: string;
  /** Optional sketch of the idea in code (shown in Builder mode). */
  code?: string;
  children?: XNode[];
}

export interface Organ extends XNode {
  id: OrganId;
  color: string;
  /** The body-part nickname shown on the X-ray. */
  part: string;
}
