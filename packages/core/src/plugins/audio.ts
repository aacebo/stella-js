import { Function, Message } from '../types';

import { PluginBase } from './base';

export interface AudioParams {
  readonly text?: string;
  readonly history?: Message[];
  readonly functions?: { [key: string]: Function | undefined };
}

export interface AudioPlugin extends PluginBase {
  audio(
    params: AudioParams,
    on_chunk?: (chunk: Message) => void
  ): Promise<Message>;
}
