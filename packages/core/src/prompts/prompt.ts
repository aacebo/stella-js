import { Logger } from '../logger';
import { PluginTypes } from '../plugins';
import { StringTemplate } from '../templates';
import { Function, FunctionHandler, Schema, Template } from '../types';

export interface PromptOptions<T extends keyof PluginTypes> {
  readonly name?: string;
  readonly plugin: PluginTypes[T];
  readonly instructions?: string | Template
}

export class Prompt<T extends keyof PluginTypes> {
  readonly name: string;
  readonly log: Logger;
  readonly plugin: PluginTypes[T];
  readonly template: Template;

  protected readonly _functions: { [key: string]: Function } = { };

  protected get function_handlers() {
    return Object.keys(this._functions).reduce((prev, key) => {
      prev[key] = this._functions[key].handler;
      return prev;
    }, { } as { [key: string]: FunctionHandler });
  }

  constructor(options: PromptOptions<T>) {
    this.name = options.name || options.plugin.name;
    this.plugin = options.plugin;
    this.log = new Logger(`promptx:prompt:${this.name}`);
    this.template = new StringTemplate();

    if (options.instructions) {
      if (typeof options.instructions === 'string') {
        this.template = new StringTemplate(options.instructions);
      } else {
        this.template = options.instructions;
      }
    }
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
      handler
    };

    return this;
  }

  async call<A extends { [key: string]: any }, R = any>(name: string, args?: A) {
    const fn = this._functions[name];

    if (!fn) {
      throw new Error(`function "${name}" not found`);
    }

    return await fn.handler(args || { }) as R;
  }

  render() {
    const parts: string[] = [];

    parts.push(this.template.render({
      functions: this.function_handlers
    }));

    // add handlebars to prompt when native functions not available
    if (!this.plugin.tags.includes('functions') && this.template.tags.includes('functions')) {
      parts.push('You can call the following functions, do not call functions/helpers outside this list:');
      parts.push(Object.values(this._functions).map(fn =>
        `- ${fn.name}:\n\t- description: ${fn.description}\n\t- parameters: ${JSON.stringify(fn.parameters)}\n`
      ).join('\n'));
    }

    return parts.join('\n\n');
  }
}
