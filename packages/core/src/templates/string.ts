import { Template, TemplateRenderParams, TemplateTag } from '../types';

export class StringTemplate implements Template {
  readonly tags: TemplateTag[] = [];

  constructor(readonly src?: string) { }

  render(params: TemplateRenderParams = { }) {
    return params.src || this.src || '';
  }
}
