import { Logger } from '../logger';
import { Message } from '../types';
import { Prompt } from './prompt';

export interface TextPromptContext {
  readonly log: Logger;
  readonly name: string;
  readonly history: Message[];
  readonly text: string;
}

export type TextPromptMiddleware = (ctx: TextPromptContext) => Promise<string> | string;

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

  async text(text: string, on_chunk?: (chunk: string) => void) {
    text = text.trim();

    if (this.history.length === 0) {
      this.history.push({
        role: 'system',
        content: this.render()
      });
    }

    for (const middleware of this._middleware.input || []) {
      text = await middleware({
        log: this.log,
        name: this.name,
        history: this.history,
        text
      });
    }

    let buffer = '';
    const message = await this.plugin.text({
      text,
      history: this.history,
      functions: this._functions
    }, chunk => {
      if (!chunk.content || !on_chunk) return;
      buffer += chunk.content;
      let content = buffer;

      try {
        on_chunk(this.template.render({
          src: content,
          functions: this.function_handlers
        }));

        buffer = '';
      } catch (err) {
        return;
      }
    });

    for (const middleware of this._middleware.output || []) {
      message.content = await middleware({
        log: this.log,
        name: this.name,
        history: this.history,
        text: message.content || ''
      });
    }

    return this.template.render({
      src: message.content || '',
      functions: this.function_handlers
    });
  }
}
