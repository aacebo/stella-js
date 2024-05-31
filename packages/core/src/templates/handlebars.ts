import Handlebars from 'handlebars';

import { Template, TemplateRenderParams, TemplateTag } from '../types';

const PREFIX = `
Respond only with the handlebars template language, for example:
- Variables:
  - https://handlebarsjs.com/guide/expressions.html#basic-usage
- Functions:
  - https://handlebarsjs.com/guide/expressions.html#helpers

Do not respond using comments.
`;

export interface HandlebarsTemplateOptions {
  readonly strict?: boolean;
}

export class HandlebarsTemplate implements Template {
  readonly tags: TemplateTag[] = ['functions'];

  private readonly _handlebars: typeof Handlebars;
  private readonly _template: Handlebars.TemplateDelegate;

  constructor(
    readonly src?: string,
    readonly options?: HandlebarsTemplateOptions
  ) {
    this._handlebars = Handlebars.create();
    this._handlebars.registerHelper('eq', (a, b) => a === b);
    this._handlebars.registerHelper('not', v => !!v);
    this._template = this._handlebars.compile(src || '', options);
  }

  render(params: TemplateRenderParams = { }) {
    if (!params.src) {
      return this._template({ }, {
        helpers: params.functions
      }) + PREFIX;
    }

    return this._handlebars.compile(params.src, this.options)({ }, {
      helpers: params.functions
    });
  }
}
