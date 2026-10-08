import type { ComponentType } from 'react';

export interface SceneProps {
  /** A scene can be opened in a particular state, e.g. `recipe:parallel` opens the recipe scene on "parallel". */
  variant?: string;
}

const SCENES: Record<string, ComponentType<SceneProps>> = {};

export function register(scenes: Record<string, ComponentType<SceneProps>>) {
  Object.assign(SCENES, scenes);
}

/** Look up `name` or `name:variant`. */
export function getScene(key: string): { Component: ComponentType<SceneProps>; variant?: string } | null {
  const [name, variant] = key.split(':');
  const Component = SCENES[name];
  return Component ? { Component, variant } : null;
}

export const sceneNames = () => Object.keys(SCENES);
