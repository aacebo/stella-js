export interface TemplateRenderParams {
  readonly src?: string;
  readonly functions?: { [key: string]: Function };
}

export type TemplateTag = 'functions';

export interface Template {
  readonly tags: TemplateTag[];

  render(params?: TemplateRenderParams): string;
}
