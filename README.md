# stella-js

A prompt engine used to interact with LLM's.

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

## Concepts

By keeping the code simple and minimizing the number of concepts as much as possible, we deminish the learning curve
significantly. This implementation has three high level concepts:

### Prompts

An object used to interact with an LLM. Different types of prompts can do different things, for example a `text` prompt can use `functions`.

### Plugins

A client used to interface with the LLM. Clients implement different interfaces and are tagged with features they support. A plugin can support multiple media types and features, or just one.