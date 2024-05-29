import readline from 'node:readline';

import { AudioPrompt, TextPrompt } from '@stella/core';
import { OpenAIAudioPlugin } from '@stella/openai';
import { GoogleTextPlugin } from '@stella/google';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('`OPENAI_API_KEY` is required');
}

const stream = true;
let status = false;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const tts = new AudioPrompt(
  'tts-1',
  {
    plugin: new OpenAIAudioPlugin({
      model: 'tts-1',
      apiKey: process.env.OPENAI_API_KEY
    })
  }
);

const whisper = new AudioPrompt(
  'whisper-1',
  {
    src: 'convert this audio to text',
    plugin: new OpenAIAudioPlugin({
      model: 'whisper-1',
      apiKey: process.env.OPENAI_API_KEY
    })
  }
);

const gpt4 = new TextPrompt(
  'gemini-1.5-flash-latest',
  {
    src: 'you are an expert on turning the lights on or off and telling me the status.',
    plugin: new GoogleTextPlugin({
      model: 'gemini-1.5-flash-latest',
      api_key: process.env.GEMINI_API_KEY!,
      stream
    })
  }
).function(
  'lights_on',
  'turns the lights on',
  () => {
    status = true;
  }
).function(
  'lights_off',
  'turns the lights off',
  () => {
    status = false;
  }
).function(
  'get_light_status',
  'returns true if the lights are on, otherwise false',
  () => status
).function(
  'get_audio_text',
  'returns transcribed audio text',
  async () => {
    const data = await tts.text_to_audio({
      text: status === false ? 'turn the lights on' : 'turn the lights off',
      type: 'mp3',
      voice: 'alloy'
    });

    return whisper.audio_to_text({
      type: 'mp3',
      data: data,
      prompt: 'convert this audio to text'
    });
  }
);

(async () => {
  process.stdout.write('$: ');

  for await (const line of rl) {
    if (line === 'exit') return process.exit(0);

    const res = await gpt4.text(line, chunk => {
      process.stdout.write(chunk);
    });

    if (!stream) {
      process.stdout.write(res);
    }

    process.stdout.write('\n$: ');
  }
})();
