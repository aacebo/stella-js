export type PluginTag =
  'functions';

export interface PluginBase {
  readonly name: string;
  readonly tags: PluginTag[];
}
