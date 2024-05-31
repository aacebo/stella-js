# stella-js

A prompt engine used to interact with LLM's.

## Concepts

- [Prompts](./docs/00.PROMPTS.md)
- [Plugins](./docs/01.PLUGINS.md)
- [Functions](./docs/02.FUNCTIONS.md)

## Performance

By using handlebars as a format for communication with the LLM, function responses don't need
to be sent back to the model after execution, cutting api calls in half.

## Flexibility

By using handlebars we give the model the flexibility to execute logical statements instead of just
functions.

## Accuracy

By instructing the LLM to respond using a template language, we avoid the need for a feedback loop.
The models are also more accurate as template languages are closer to human language than structured
data like JSON, and many models are particularly good at code generation.
 
## Streaming

Because we use said template language we can easily parse in chunks to enable streaming and still get
native or template based function calling.

## Multi Model

The package was built with multi-model and multi-modal in mind. You can either orchestrate many single purpose
models together or use one or more multi-modal models like gpt-4o.

## To Do

- add `User-Agent`
- better error handling
