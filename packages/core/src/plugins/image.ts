import { Plugin } from '../types';

export interface TextToImageParams {
  readonly prompt?: string;
  readonly size?: string;
}

export interface ImagePlugin extends Plugin {
  text_to_image?(params?: TextToImageParams): Promise<string>;
}
