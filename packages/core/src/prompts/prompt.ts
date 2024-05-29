import Handlebars from 'handlebars';

import { Logger } from '../logger';
import { PluginTypes } from '../plugins';
import { Function, FunctionHandler, Schema } from '../types';

export interface PromptOptions<T extends keyof PluginTypes> {
  readonly plugin: PluginTypes[T];
  readonly src?: string;
}

export class Prompt<T extends keyof PluginTypes> {
  readonly name: string;
  readonly log: Logger;
  readonly plugin: PluginTypes[T];

  protected readonly _functions: { [key: string]: Function } = { };
  protected readonly _handlebars: typeof Handlebars;
  protected readonly _template: Handlebars.TemplateDelegate;

  constructor(name: string, options: PromptOptions<T>) {
    this.name = name;
    this.plugin = options.plugin;
    this.log = new Logger(`stella:prompt:${name}`);
    this._handlebars = Handlebars.create();
    this._handlebars.registerHelper('eq', (a, b) => a === b);
    this._handlebars.registerHelper('not', v => !!v);
    this._template = this._handlebars.compile(options.src || '');
  }

  function(name: string, description: string, handler: FunctionHandler): this;
  function(name: string, description: string, parameters: Schema, handler: FunctionHandler): this;
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
          this.log.error(err);
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

  render() {
    const parts = [this._template({ })];

    // add handlebars to prompt when native functions not available
    if (!this.plugin.tags.includes('functions')) {
      parts.push(`Do not respond using markdown.
      Respond only with the handlebars template language, for example:
      - Variables: "the sheep is {{color}}"
        - https://handlebarsjs.com/guide/expressions.html#basic-usage
      - Functions: "hello {{get_username}}"
        - https://handlebarsjs.com/guide/expressions.html#helpers

      You can call the following functions, do not call functions/helpers outside this list:
      `);

      parts.push(Object.values(this._functions).map(fn =>
        `- ${fn.name}:\n\t- description: ${fn.description}\n\t- parameters: ${JSON.stringify(fn.parameters)}\n`
      ).join('\n'));
    }

    return parts.join('\n\n');
  }
}
