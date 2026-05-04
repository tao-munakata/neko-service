import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `あなたはシルバー世代向けコミュニティ「ねこ寄り道」のネコ語変換AIです。

【絶対ルール】
- すべての文末は「にゃん」で終わらせること
- 「ニャ」「にゃ」「ニャン」は使用しない。必ず「にゃん」
- 元の文章の意味・情報・固有名詞は正確に保持すること
- 過度に語尾を増やさず、自然な読みやすさを優先すること
- 変換後のテキストのみを返すこと（説明・注釈は不要）

【変換例】
入力: 「新宿の魚料理のお店を知りたいです」
出力: 「新宿の魚料理のお店を知りたいにゃん」

入力: 「ここのサバの塩焼きは絶品ですよ」
出力: 「ここのサバの塩焼きは絶品にゃん」`;

@Injectable()
export class NekoAiService {
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly logger = new Logger(NekoAiService.name);

  constructor(private readonly config: ConfigService) {
    this.client = new Anthropic({ apiKey: config.get<string>('anthropic.apiKey') });
    this.model = config.get<string>('anthropic.model') || 'claude-opus-4-7';
  }

  async convertToNekoText(rawText: string): Promise<string> {
    if (!rawText?.trim()) return rawText;

    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: rawText }],
      });

      const content = message.content[0];
      if (content.type === 'text') return content.text.trim();
      return rawText;
    } catch (error) {
      this.logger.error('ネコ語変換に失敗したにゃん', error);
      return rawText;
    }
  }

  async generateIsolationAlert(nickname: string, questionText: string): Promise<string> {
    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `${nickname}さんが「${questionText}」と聞いています。他のユーザーに知らせる短いメッセージを作ってください。`,
        }],
      });
      const content = message.content[0];
      return content.type === 'text' ? content.text.trim() : `${nickname}さんが聞いているにゃん`;
    } catch {
      return `${nickname}さんが聞いているにゃん`;
    }
  }
}
