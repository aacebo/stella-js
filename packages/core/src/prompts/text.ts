import { Logger } from '../logger';
import { ContentPart, Message, UserMessage } from '../types';
import { Prompt } from './prompt';

export interface TextPromptContext {
  readonly log: Logger;
  readonly name: string;
  readonly message: Message;
  readonly history: Message[];
}

export type TextPromptMiddleware = (ctx: TextPromptContext) => void | Promise<void>;

export class TextPrompt extends Prompt<'text'> {
  readonly history: Message[] = [ ];

  protected readonly _middleware: {
    input?: TextPromptMiddleware[];
    output?: TextPromptMiddleware[];
  } = { };

  use(type: 'input' | 'output', middleware: TextPromptMiddleware): this {
    this._middleware[type] = [
      ...(this._middleware[type] || [ ]),
      middleware
    ];

    return this;
  }

  async text(input: string | ContentPart[], on_chunk?: (chunk: string) => void) {
    if (typeof input === 'string') {
      input = input.trim();
    }

    if (this.history.length === 0) {
      this.history.push({
        role: 'system',
        content: this.render()
      });
    }

    const message: UserMessage = {
      role: 'user',
      content: input
    };

    for (const middleware of this._middleware.input || []) {
      await middleware({
        log: this.log,
        name: this.name,
        message,
        history: this.history
      });
    }

    let buffer = '';
    const res = await this.plugin.text({
      message,
      history: this.history,
      functions: this._functions
    }, chunk => {
      if (!chunk.content || !on_chunk) return;
      buffer += chunk.content;

      try {
        on_chunk(this.template.render({
          src: buffer,
          functions: this.function_handlers
        }));

        buffer = '';
      } catch (err) {
        return;
      }
    });

    for (const middleware of this._middleware.output || []) {
      await middleware({
        log: this.log,
        name: this.name,
        message: res,
        history: this.history
      });
    }

    return this.template.render({
      src: res.content || '',
      functions: this.function_handlers
    });
  }
}
