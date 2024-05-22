import { Function, Message } from '../types';

export interface CreateChatParams {
  readonly text?: string;
  readonly history?: Message[];
  readonly functions?: { [key: string]: Function | undefined };
}

export interface ChatPlugin {
  native_functions: boolean;

  create_chat(
    params: CreateChatParams,
    on_chunk?: (chunk: Message) => void
  ): Promise<Message>;
}
