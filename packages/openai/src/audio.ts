import { AudioPlugin, TextToAudioParams, Logger, PluginTag, AudioToTextParams } from '@stella/core';
import OpenAI, { ClientOptions, toFile } from 'openai';

export interface OpenAIAudioPluginOptions extends ClientOptions {
  readonly name?: string;
  readonly model: string;
}

export class OpenAIAudioPlugin implements AudioPlugin {
  readonly name: string;
  readonly tags: PluginTag[] = [];

  private readonly _openai: OpenAI;
  private readonly _log: Logger;

  constructor(readonly options: OpenAIAudioPluginOptions) {
    this.name = options.name || `openai:audio:${options.model}`;
    this._openai = new OpenAI(options);
    this._log = new Logger(`stella:${this.name}`);
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
