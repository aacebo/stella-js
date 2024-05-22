import Handlebars from 'handlebars';

import { Function, FunctionHandler, Message, Schema } from './types';
import { Logger } from './logger';
import { ChatPlugin, Plugins } from './plugins';

export class Prompt {
  readonly name: string;
  get path(): string[] {
    return [...(this._parent?.path || []), this.name];
  }

  private readonly _template: Handlebars.TemplateDelegate;
  private readonly _history: Message[];
  private readonly _prompts: { [key: string]: Prompt } = { };
  private readonly _plugins: Plugins = { };
  private readonly _functions: { [key: string]: Function } = { };
  private readonly _log: Logger;
  private _parent?: Prompt;

  private get _context() {
    const v: { [key: string]: any } = this._parent?._context || { };

    for (const [key, fn] of Object.entries(this._functions)) {
      v[key] = fn;
    }

    return v;
  }

  private get _chat(): ChatPlugin | undefined {
    return this._plugins.chat || this._parent?._chat;
  }

  constructor(name: string, src: string) {
    this.name = name;
    this._template = Handlebars.compile(src);
    this._log = new Logger(`stella:prompt:${this.path.join(':')}`);
    this._history = [];
  }

  plugin<T extends keyof Plugins>(type: T, plugin: Plugins[T]): Prompt {
    this._plugins[type] = plugin;
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

    return this;
  }

  async create_chat(text: string, on_chunk?: (chunk: string) => void) {
    const plugin = this._chat;

    if (!plugin) throw new Error('no chat plugin found');
    if (this._history.length === 0) {
      let fns = '';

      for (const fn of Object.values(this._functions)) {
        fns += `- ${fn.name}:\n\t- description: ${fn.description}\n\t- parameters: ${JSON.stringify(fn.parameters)}\n\n`;
      }

      this._history.push({
        role: 'system',
        content: plugin.native_functions ? this._template(this._context) : `
        Do not respond using markdown.
        Respond only with the handlebars template language:
        - https://handlebarsjs.com/guide/expressions.html#basic-usage

        You can call the following functions:
        ${fns}
        ${this._template(this._context)}
        `
      });
    }

    let buffer = '';
    const message = await plugin.create_chat({
      text,
      history: this._history,
      functions: this._functions
    }, chunk => {
      if (!chunk.content || !on_chunk) return;
      buffer += chunk.content;
      let content = buffer;

      try {
        const template = Handlebars.compile(content);
        buffer = '';

        on_chunk(template(this._context));
      } catch (err) {
        return;
      }
    });

    return message.content || '';
  }
}
