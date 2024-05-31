import { Function, Message, Plugin } from '../types';

export interface TextParams {
  readonly text?: string;
  readonly history?: Message[];
  readonly functions?: { [key: string]: Function };
}

export interface TextPlugin extends Plugin {
  text(
    params: TextParams,
    on_chunk?: (chunk: Message) => void
  ): Promise<Message>;
}
