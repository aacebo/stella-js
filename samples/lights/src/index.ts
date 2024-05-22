import readline from 'node:readline';
import { Prompt } from '@stella/core';
import { OpenAIChatPlugin } from '@stella/openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('`OPENAI_API_KEY` is required');
}

const STREAM = true;
let status = false;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const prompt = new Prompt({
  name: 'root',
  src: 'you are an expert on turning the lights on or off and telling me the status.'
}).plugin('chat', new OpenAIChatPlugin({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4-turbo',
  temperature: 0,
  stream: STREAM
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

(async () => {
  process.stdout.write('$: ');

  for await (const line of rl) {
    if (line === 'exit') return process.exit(0);

    const res = await prompt.create_chat(line, chunk => {
      process.stdout.write(chunk);
    });

    if (!STREAM) {
      process.stdout.write(res);
    }

    process.stdout.write('\n$: ');
  }
})();
