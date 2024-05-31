export type PluginTag =
  'functions' |
  'text' |
  'audio' |
  'image' |
  'video';

export interface Plugin {
  readonly name: string;
  readonly tags: PluginTag[];
}
