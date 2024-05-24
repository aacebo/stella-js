import { PluginBase } from './base';

export interface TextToAudioParams {
  readonly type: string;
  readonly text: string;
  readonly voice: string;
}

export interface AudioToTextParams {
  readonly type: string;
  readonly data: Buffer;
  readonly prompt?: string;
  readonly lang?: string;
}

export interface AudioPlugin extends PluginBase {
  text_to_audio?(params: TextToAudioParams): Promise<Buffer>;
  audio_to_text?(params: AudioToTextParams): Promise<string>;
}
