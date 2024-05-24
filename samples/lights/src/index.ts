import readline from 'node:readline';

import { Prompt } from '@stella/core';
import { OpenAITextPlugin, OpenAIAudioPlugin } from '@stella/openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('`OPENAI_API_KEY` is required');
}

const stream = true;
let status = false;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let prompt = new Prompt(
  'root',
  'you are an expert on turning the lights on or off and telling me the status.'
).use(new OpenAITextPlugin({
  model: 'gpt-4o',
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  stream: stream
})).use(new OpenAIAudioPlugin({
  model: 'tts-1',
  apiKey: process.env.OPENAI_API_KEY
})).use(new OpenAIAudioPlugin({
  model: 'whisper-1',
  apiKey: process.env.OPENAI_API_KEY
})).function(
  'lights_on',
  'turns the lights on',
  () => status = true
).function(
  'lights_off',
  'turns the lights off',
  () => status = false
).function(
  'get_light_status',
  'returns true if the lights are on, otherwise false',
  () => status
);

prompt = prompt.function(
  'get_audio_text',
  'returns transcribed audio text',
  async () => {
    const data = await prompt.text_to_audio('openai:audio:tts-1', {
      text: status === false ? 'turn the lights on' : 'turn the lights off',
      type: 'mp3',
      voice: 'alloy'
    });

    return prompt.audio_to_text('openai:audio:whisper-1', {
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

    const res = await prompt.text(line, chunk => {
      process.stdout.write(chunk);
    });

    if (!stream) {
      process.stdout.write(res);
    }

    process.stdout.write('\n$: ');
  }
})();
