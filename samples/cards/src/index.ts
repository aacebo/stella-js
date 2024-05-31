import readline from 'node:readline';

import { TextPrompt } from '@stella/core';
import { OpenAITextPlugin } from '@stella/openai';

const stream = true;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const text = new TextPrompt({
  instructions: 'you are an expert converting images to adaptive cards using the JSON schema: https://adaptivecards.io/schemas/1.6.0/adaptive-card.json',
  plugin: new OpenAITextPlugin({
    model: process.env.MODEL || 'gpt-4-turbo',
    api_key: process.env.MODEL_KEY,
    base_url: process.env.MODEL_URL,
    stream
  })
});

(async () => {
  const res = await text.text([
    {
      type: 'text',
      text: 'generate an adaptive card from this image'
    },
    {
      type: 'image_url',
      image_url: 'https://media.githubusercontent.com/media/microsoft/teams-ai/main/js/samples/04.ai-apps/c.vision-cardGazer/assets/card.png'
    }
  ], chunk => {
    process.stdout.write(chunk);
  });

  if (!stream) {
    process.stdout.write(res);
  }

  process.stdout.write('\n$: ');

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
