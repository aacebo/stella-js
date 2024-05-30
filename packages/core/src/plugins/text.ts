import { Function, Message } from '../types';

import { PluginBase } from './base';

export interface TextParams {
  readonly text?: string;
  readonly history?: Message[];
  readonly functions?: { [key: string]: Function };
}

export interface TextPlugin extends PluginBase {
  text(
    params: TextParams,
    on_chunk?: (chunk: Message) => void
  ): Promise<Message>;
}
