import { TextPlugin, TextParams, Message, Logger, PluginTag } from '@stella/core';
import axios, { AxiosInstance } from 'axios';

export interface LlamaPluginOptions {
  readonly name?: string;
  readonly model: string;
  readonly endpoint: string;
  readonly api_key: string;
  readonly stream?: boolean;
  readonly temperature?: number;
}

export class LlamaPlugin implements TextPlugin {
  readonly name: string;
  readonly tags: PluginTag[] = ['text'];

  private readonly _axios: AxiosInstance;
  private readonly _log: Logger;

  constructor(readonly options: LlamaPluginOptions) {
    this.name = options.name || `meta:text:${options.model}`;
    this._log = new Logger(`stella:${this.name}`);
    this._axios = axios.create({
      baseURL: options.endpoint,
      headers: {
        Authorization: `Bearer ${options.api_key}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async text(params: TextParams): Promise<Message> {
    const messages = params.history || [];

    if (params.text) {
      messages.push({
        role: 'user',
        content: params.text
      });
    }

    try {
      const res = await this._axios.post<{
        readonly choices: Array<{
          readonly index: number;
          readonly message: {
            readonly role: 'assistant';
            readonly content: string;
          };
        }>;
      }>('', {
        model: this.options.model,
        temperature: this.options.temperature,
        messages: messages.map(m => ({
          role: m.role === 'model' ? 'assistant' : m.role,
          content: m.content
        }))
      });

      const message: Message = {
        role: 'model',
        content: res.data.choices[0].message.content
      };

      messages.push(message);
      return message;
    } catch (err) {
      this._log.error(err);
      throw err;
    }
  }
}
