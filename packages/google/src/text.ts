import { TextPlugin, TextParams, Message, Logger, PluginTag } from '@stella/core';
import { GoogleGenerativeAI, GenerativeModel, ModelParams, TextPart, GenerateContentRequest } from '@google/generative-ai';

export interface GoogleTextPluginOptions extends ModelParams {
  readonly name?: string;
  readonly api_key: string;
  readonly stream?: boolean;
}

export class GoogleTextPlugin implements TextPlugin {
  readonly name: string;
  readonly tags: PluginTag[] = ['text'];

  private readonly _client: GenerativeModel;
  private readonly _log: Logger;

  constructor(readonly options: GoogleTextPluginOptions) {
    this.name = options.name || `google:text:${options.model}`;
    this._log = new Logger(`stella:${this.name}`);
    this._client = new GoogleGenerativeAI(options.api_key).getGenerativeModel(options);
  }

  async text(params: TextParams, on_chunk?: (chunk: Message) => void): Promise<Message> {
    const messages = params.history || [];

    if (params.text) {
      messages.push({
        role: 'user',
        content: params.text
      });
    }

    try {
      const message: Message = {
        role: 'model',
        content: ''
      };

      const req: GenerateContentRequest = {
        systemInstruction: messages.find(m => m.role === 'system')?.content,
        contents: messages.filter(m => m.role !== 'system').map(m => {
          return {
            role: m.role,
            parts: [{ text: m.content } as TextPart]
          };
        })
      };

      if (!this.options.stream) {
        const res = await this._client.generateContent(req);
        message.content = res.response.text();
      } else {
        const res = await this._client.generateContentStream(req);

        for await (const chunk of res.stream) {
          const text = chunk.text();
          message.content += text;

          if (on_chunk) {
            on_chunk({
              role: 'model',
              content: text
            });
          }
        }
      }

      messages.push(message);
      return message;
    } catch (err) {
      this._log.error(err);
      throw err;
    }
  }
}
