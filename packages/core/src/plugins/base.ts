export type PluginTag =
  'functions' |
  'text' |
  'audio' |
  'image' |
  'video';

export interface PluginBase {
  readonly name: string;
  readonly tags: PluginTag[];
}
