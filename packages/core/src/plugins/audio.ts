import { PluginBase } from './base';

export interface TextToAudioParams {
}

export interface AudioToTextParams {
}

export interface AudioPlugin extends PluginBase {
  text_to_audio?(params: TextToAudioParams): Promise<ArrayBuffer>;
  audio_to_text?(params: AudioToTextParams): Promise<string>;
}
