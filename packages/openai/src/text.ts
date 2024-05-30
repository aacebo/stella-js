import { TextPlugin, TextParams, Message, Logger, PluginTag } from '@stella/core';
import OpenAI from 'openai';
import { Stream } from 'openai/streaming';

export interface OpenAITextPluginOptions {
  readonly name?: string;
  readonly model: string;
  readonly api_key?: string;
  readonly base_url?: string;
  readonly organization?: string;
  readonly project?: string;
  readonly headers?: { [key: string]: string; };
  readonly fetch?: (url: RequestInfo, init?: globalThis.RequestInit) => Promise<Response>;
  readonly timeout?: number;
  readonly stream?: boolean;
  readonly temperature?: number;
}

export class OpenAITextPlugin implements TextPlugin {
  readonly name: string;
  readonly tags: PluginTag[] = ['functions', 'text'];

  private readonly _openai: OpenAI;
  private readonly _log: Logger;

  constructor(readonly options: OpenAITextPluginOptions) {
    this.name = options.name || `openai:text:${options.model}`;
    this._log = new Logger(`stella:${this.name}`);
    this._openai = new OpenAI({
      apiKey: options.api_key,
      baseURL: options.base_url,
      organization: options.organization,
      project: options.project,
      defaultHeaders: options.headers,
      fetch: options.fetch,
      timeout: options.timeout
    });
  }

  async text(params: TextParams, on_chunk?: (chunk: Message) => void): Promise<Message> {
    const messages = params.history || [];

    if (params.text) {
      messages.push({
        role: 'user',
        content: params.text
      });
    }

    try {
      const completion = await this._openai.chat.completions.create({
        model: this.options.model,
        temperature: this.options.temperature,
        stream: this.options.stream,
        tools: Object.values(params.functions || { }).map(fn => ({
          type: 'function',
          function: {
            name: fn.name,
            description: fn.description,
            parameters: fn.parameters
          }
        })),
        messages: messages.map(message => {
          if (message.role === 'model') {
            return {
              role: 'assistant',
              content: message.content,
              tool_calls: message.function_calls?.map(fn => ({
                id: fn.id,
                type: 'function',
                function: {
                  name: fn.name,
                  arguments: JSON.stringify(fn.arguments)
                }
              }))
            };
          }

          if (message.role === 'function') {
            return {
              role: 'tool',
              content: message.content || 'null',
              tool_call_id: message.function_id
            };
          }

          return message;
        })
      });

      if (!(completion instanceof Stream)) {
        const message = completion.choices[0].message;

        if (message.tool_calls) {
          return this._on_tool(params, messages, message, on_chunk);
        }

        const res: Message = {
          role: 'model',
          content: message.content || undefined
        };

        messages.push(res);
        return res;
      }

      const message: Message = {
        role: 'model',
        content: ''
      };

      for await (const chunk of completion) {
        const delta = chunk.choices[0].delta;

        if (delta.tool_calls && delta.tool_calls.length > 0) {
          return this._on_tool(params, messages, delta, on_chunk);
        }

        if (delta.content) {
          if (message.content) {
            message.content += delta.content;
          } else {
            message.content = delta.content;
          }
        }

        if (on_chunk) {
          on_chunk({
            role: 'model',
            content: delta.content || undefined
          });
        }
      }

      messages.push(message);
      return message;
    } catch (err) {
      this._log.error(err);
      throw err;
    }
  }

  private async _on_tool(
    params: TextParams,
    messages: Message[],
    message: OpenAI.ChatCompletionMessage | OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta,
    on_chunk?: (chunk: Message) => void
  ) {
    const calls: OpenAI.ChatCompletionMessageToolCall[] = [];

    for (const call of message.tool_calls || []) {
      if ('index' in call) {
        if (call.index === calls.length) {
          calls.push({
            id: '',
            type: 'function',
            function: {
              name: '',
              arguments: '{}'
            }
          });
        }

        if (call.id) {
          calls[call.index].id = call.id;
        }

        if (call.function?.name) {
          calls[call.index].function.name = call.function.name;
        }

        if (call.function?.arguments) {
          calls[call.index].function.arguments = call.function.arguments;
        }
      } else {
        calls.push(call);
      }
    }

    messages.push({
      role: 'model',
      content: message.content || undefined,
      function_calls: calls.map(call => ({
        id: call.id,
        name: call.function.name,
        arguments: JSON.parse(call.function.arguments)
      }))
    });

    for (const call of calls) {
      const fn = (params.functions || { })[call.function.name];

      if (!fn) {
        throw new Error(`function ${call.function.name} not found`);
      }

      const output = await fn.handler(JSON.parse(call.function.arguments));

      messages.push({
        role: 'function',
        content: JSON.stringify(output),
        function_id: call.id
      });

      return this.text({
        functions: params.functions,
        history: messages
      }, on_chunk);
    }

    throw new Error('no message returned');
  }
}
