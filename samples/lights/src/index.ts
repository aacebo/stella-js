import readline from 'node:readline';

import { AudioPrompt, TextPrompt } from '@promptx/core';
import { OpenAIAudioPlugin, OpenAITextPlugin } from '@promptx/openai';

const stream = true;
let status = false;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const tts = new AudioPrompt({
  plugin: new OpenAIAudioPlugin({
    model: 'tts-1',
    api_key: process.env.OPENAI_API_KEY
  })
});

const whisper = new AudioPrompt({
  instructions: 'convert this audio to text',
  plugin: new OpenAIAudioPlugin({
    model: 'whisper-1',
    api_key: process.env.OPENAI_API_KEY
  })
});

const text = new TextPrompt({
  instructions: 'you are an expert on turning the lights on or off and telling me the status.',
  plugin: new OpenAITextPlugin({
    model: process.env.MODEL || 'gpt-4-turbo',
    api_key: process.env.MODEL_KEY,
    base_url: process.env.MODEL_URL,
    stream
  })
}).function(
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
    if (line === '/history') {
      console.log(text.history);
      process.stdout.write('$: ');
      continue;
    }

    try {
      const res = await text.text(line, chunk => {
        process.stdout.write(chunk);
      });

      if (!stream) {
        process.stdout.write(res);
      }
    } catch (err) {
      text.log.error(err);
      console.log(text.history);
      process.exit(1);
    }

    process.stdout.write('\n$: ');
  }
})();
