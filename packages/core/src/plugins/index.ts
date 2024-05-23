import { AudioPlugin } from './audio';
import { TextPlugin } from './text';

export type Plugin =
  TextPlugin |
  AudioPlugin;

export * from './base';
export * from './text';
