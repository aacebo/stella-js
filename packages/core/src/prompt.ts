import Handlebars from 'handlebars';

import { Function, FunctionHandler, Message, Schema } from './types';
import { Logger } from './logger';
import { AudioToTextParams, Plugin, TextToAudioParams } from './plugins';

export class Prompt {
  readonly name: string;

  get path(): string[] {
    return [...(this._parent?.path || []), this.name];
  }

  private readonly _history: Message[];
  private readonly _prompts: { [key: string]: Prompt } = { };
  private readonly _plugins: { [name: string]: Plugin } = { };
  private readonly _functions: { [key: string]: Function } = { };
  private readonly _log: Logger;
  private readonly _handlebars: typeof Handlebars;
  private readonly _template: Handlebars.TemplateDelegate;
  private _parent?: Prompt;

  constructor(name: string, src?: string) {
    this.name = name;
    this._handlebars = Handlebars.create();
    this._template = this._handlebars.compile(src, { strict: true });
    this._log = new Logger(`stella:prompt:${this.path.join(':')}`);
    this._history = [];
  }

  use(plugin: Plugin): Prompt {
    this._plugins[plugin.name] = plugin;
    return this;
  }

  prompt(prompt: Prompt): Prompt {
    prompt._parent = this;
    this._prompts[prompt.name] = prompt;
    return this;
  }

  function(name: string, description: string, handler: FunctionHandler): Prompt;
  function(name: string, description: string, parameters: Schema, handler: FunctionHandler): Prompt;
  function(...args: any[]) {
    const name: string = args[0];
    const description: string = args[1];
    const parameters: Schema | null = args.length === 3 ? null : args[2];
    const handler: FunctionHandler = args[args.length - 1];
    this._functions[name] = {
      name,
      description,
      parameters: parameters || { },
      handler: async (args: { [key: string]: any }) => {
        try {
          return await handler(args);
        } catch (err) {
          this._log.error(err);
          return null;
        }
      }
    };

    this._handlebars.registerHelper(name, handler);
    return this;
  }

  async call<A extends { [key: string]: any }, R = any>(name: string, args?: A) {
    const fn = this._functions[name];

    if (!fn) {
      throw new Error(`function ${name} not found`);
    }

    return await fn.handler(args || { }) as R;
  }

  async text(text: string, on_chunk?: (chunk: string) => void): Promise<string>;
  async text(name: string, text: string, on_chunk?: (chunk: string) => void): Promise<string>;
  async text(...args: any[]) {
    let plugin = Object.values(this._plugins).find(p => p.tags.includes('text'));
    const name: string | undefined = args.length === 2 ? undefined : args[0];
    const text: string = args.length === 2 ? args[0] : args[1];
    const on_chunk: ((chunk: string) => void | undefined) = args.length === 2 ? args[1] : args[2];

    if (name) {
      plugin = this._get_plugin(name);
    }

    if (!plugin) throw new Error('no plugin found');
    if (!('text' in plugin)) {
      throw new Error(`${name} is not a text plugin`);
    }

    if (this._history.length === 0) {
      let fns = '';

      for (const fn of Object.values(this._functions)) {
        fns += `- ${fn.name}:\n\t- description: ${fn.description}\n\t- parameters: ${JSON.stringify(fn.parameters)}\n\n`;
      }

      this._history.push({
        role: 'system',
        content: plugin.tags.includes('functions') ? this._template({ }) : `
        Do not respond using markdown.
        Respond only with the handlebars template language:
        - https://handlebarsjs.com/guide/expressions.html#basic-usage

        You can call the following functions:
        ${fns}
        ${this._template({ })}
        `
      });
    }

    let buffer = '';
    const message = await plugin.text({
      text,
      history: this._history,
      functions: this._functions
    }, chunk => {
      if (!chunk.content || !on_chunk) return;
      buffer += chunk.content;
      let content = buffer;

      try {
        const template = this._handlebars.compile(content, { strict: true });
        buffer = '';

        on_chunk(template({ }));
      } catch (err) {
        return;
      }
    });

    return this._handlebars.compile(message.content || '')({ });
  }

  async audio_to_text(params: AudioToTextParams): Promise<string>;
  async audio_to_text(name: string, params: AudioToTextParams): Promise<string>;
  async audio_to_text(...args: any[]) {
    let plugin = Object.values(this._plugins).find(p => p.tags.includes('audio'));
    const name: string | undefined = args.length === 1 ? undefined : args[0];
    const params: AudioToTextParams = args.length === 1 ? args[0] : args[1];

    if (name) {
      plugin = this._get_plugin(name);
    }

    if (!plugin) throw new Error('no plugin found');
    if (!('audio_to_text' in plugin) || !plugin.audio_to_text) {
      throw new Error(`${name} cannot transcript audio to text`);
    }

    let fns = '';

    for (const fn of Object.values(this._functions)) {
      fns += `- ${fn.name}:\n\t- description: ${fn.description}\n\t- parameters: ${JSON.stringify(fn.parameters)}\n\n`;
    }

    const res = await plugin.audio_to_text({
      ...params,
      prompt: params.prompt || `
      Do not respond using markdown.
      Respond only with the handlebars template language:
      - https://handlebarsjs.com/guide/expressions.html#basic-usage

      You can call the following functions:
      ${fns}
      ${this._template({ })}
      `
    });

    return this._handlebars.compile(res, { strict: true })({ });
  }

  async text_to_audio(params: TextToAudioParams): Promise<Buffer>;
  async text_to_audio(name: string, params: TextToAudioParams): Promise<Buffer>;
  async text_to_audio(...args: any[]) {
    let plugin = Object.values(this._plugins).find(p => p.tags.includes('audio'));
    const name: string | undefined = args.length === 1 ? undefined : args[0];
    const params: TextToAudioParams = args.length === 1 ? args[0] : args[1];

    if (name) {
      plugin = this._get_plugin(name);
    }

    if (!plugin) throw new Error('no plugin found');
    if (!('text_to_audio' in plugin) || !plugin.text_to_audio) {
      throw new Error(`${name} cannot translate text to audio`);
    }

    return await plugin.text_to_audio(params);
  }

  private _get_plugin(name: string): Plugin | undefined {
    if (this._plugins[name]) {
      return this._plugins[name];
    }

    return this._parent?._get_plugin(name);
  }
}
