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

  /** 音声書き起こしテキストを自然な口コミ文に整形（にゃん変換なし） */
  async formatReview(rawSpeech: string, storeName: string): Promise<string> {
    if (!rawSpeech?.trim()) return rawSpeech;
    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `以下の音声書き起こしを、「${storeName}」への自然な口コミ文に整形してください。
話し言葉のまま・冗長な表現は整理し、1〜3文で完結させてください。
語尾変換（にゃん等）は不要です。整形後のテキストのみ返してください。

書き起こし: 「${rawSpeech}」`,
        }],
      });
      const content = message.content[0];
      return content.type === 'text' ? content.text.trim() : rawSpeech;
    } catch {
      return rawSpeech;
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
