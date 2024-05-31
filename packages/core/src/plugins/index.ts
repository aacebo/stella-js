import { AudioPlugin } from './audio';
import { ImagePlugin } from './image';
import { TextPlugin } from './text';

export interface PluginTypes {
  readonly audio: AudioPlugin;
  readonly image: ImagePlugin;
  readonly text: TextPlugin;
}

export * from './audio';
export * from './image';
export * from './text';
