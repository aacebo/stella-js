import { AudioToTextParams, TextToAudioParams } from '../plugins';
import { Prompt } from './prompt';

export class AudioPrompt extends Prompt<'audio'> {
  async audio_to_text(params: AudioToTextParams) {
    if (!this.plugin.audio_to_text) {
      throw new Error(`${this.name} cannot transcribe audio to text`);
    }

    const res = await this.plugin.audio_to_text({
      ...params,
      prompt: params.prompt || this.render()
    });

    return this._handlebars.compile(res, { strict: true })({ });
  }

  async text_to_audio(params: TextToAudioParams) {
    if (!this.plugin.text_to_audio) {
      throw new Error(`${this.name} cannot translate text to audio`);
    }

    return await this.plugin.text_to_audio(params);
  }
}
