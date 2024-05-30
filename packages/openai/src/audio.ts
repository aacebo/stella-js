import { AudioPlugin, TextToAudioParams, Logger, PluginTag, AudioToTextParams } from '@stella/core';
import OpenAI, { toFile } from 'openai';

export interface OpenAIAudioPluginOptions {
  readonly name?: string;
  readonly model: string;
  readonly api_key?: string;
  readonly base_url?: string;
  readonly organization?: string;
  readonly project?: string;
  readonly headers?: { [key: string]: string; };
  readonly fetch?: (url: RequestInfo, init?: globalThis.RequestInit) => Promise<Response>;
  readonly timeout?: number;
}

export class OpenAIAudioPlugin implements AudioPlugin {
  readonly name: string;
  readonly tags: PluginTag[] = ['audio'];

  private readonly _openai: OpenAI;
  private readonly _log: Logger;

  constructor(readonly options: OpenAIAudioPluginOptions) {
    this.name = options.name || `openai:audio:${options.model}`;
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

  async audio_to_text(params: AudioToTextParams) {
    try {
      const res = await this._openai.audio.transcriptions.create({
        file: await toFile(params.data, `temp.${params.type}`, { type: params.type }),
        model: this.options.model,
        language: params.lang,
        prompt: params.prompt
      });

      return res.text;
    } catch (err) {
      this._log.error(err);
      throw err;
    }
  }

  async text_to_audio(params: TextToAudioParams) {
    try {
      const res = await this._openai.audio.speech.create({
        response_format: params.type as any,
        model: this.options.model,
        voice: params.voice as any,
        input: params.text
      });

      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      this._log.error(err);
      throw err;
    }
  }
}
