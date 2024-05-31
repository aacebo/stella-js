import { AudioPlugin } from './audio';
import { TextPlugin } from './text';

export interface PluginTypes {
  readonly text: TextPlugin;
  readonly audio: AudioPlugin;
}

export * from './text';
export * from './audio';
