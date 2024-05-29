import { TextPlugin, TextParams, Message, Logger, PluginTag } from '@stella/core';
import axios, { AxiosInstance } from 'axios';

export interface LlamaPluginOptions {
  readonly name?: string;
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
    this.name = options.name || 'meta:llama';
    this._log = new Logger(`stella:${this.name}`);
    this._axios = axios.create({
      baseURL: options.endpoint,
      headers: { Authorization: `Bearer ${options.api_key}` }
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
      const res = await this._axios.post<Array<{ generated_text: string }>>('/', {
        inputs: messages.map(m =>
          m.role === 'user'
            ? `[INST]${m.content}[/INST]`
            : m.content
        ).join('\n')
      });

      return {
        role: 'model',
        content: res.data.map(v => v.generated_text).join('\n')
      };
    } catch (err) {
      this._log.error(err);
      throw err;
    }
  }
}
