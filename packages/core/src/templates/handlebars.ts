import Handlebars from 'handlebars';

import { Template, TemplateRenderParams, TemplateTag } from '../types';
import { Logger } from '../logger';

const PREFIX = `
Respond only with the handlebars template language, for example:

# Handlebars Examples

## Expressions
https://handlebarsjs.com/guide/expressions.html

## Function/Helper Calling
https://handlebarsjs.com/guide/block-helpers.html#basic-blocks

Do not respond using comments.
`;

export interface HandlebarsTemplateOptions {
  readonly strict?: boolean;
}

export class HandlebarsTemplate implements Template {
  readonly tags: TemplateTag[] = ['functions'];

  private readonly _handlebars: typeof Handlebars;
  private readonly _template: Handlebars.TemplateDelegate;
  private readonly _log = new Logger('stella:template:handlebars');

  constructor(
    readonly src?: string,
    readonly options?: HandlebarsTemplateOptions
  ) {
    this._handlebars = Handlebars.create();
    this._handlebars.registerHelper('eq', (a, b) => a === b);
    this._handlebars.registerHelper('not', v => !!v);
    this._template = this._handlebars.compile(src || '', {
      ...options,
      noEscape: true
    });
  }

  render(params: TemplateRenderParams = { }) {
    try {
      if (!params.src) {
        return this._template({ }, {
          helpers: params.functions
        }) + PREFIX;
      }

      return this._handlebars.compile(params.src, this.options)({ }, {
        helpers: params.functions
      });
    } catch (err) {
      this._log.error(err);
      throw err;
    }
  }
}
