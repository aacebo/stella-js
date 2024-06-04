import { Function, Message, ModelMessage, Plugin } from '../types';

export interface TextParams {
  readonly message: Message;
  readonly history?: Message[];
  readonly functions?: { [key: string]: Function };
}

export interface TextPlugin extends Plugin {
  text(
    params: TextParams,
    on_chunk?: (chunk: ModelMessage) => void | Promise<void>
  ): Promise<ModelMessage>;
}
