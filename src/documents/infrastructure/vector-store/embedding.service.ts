import { Injectable, Logger } from '@nestjs/common';
import { OpenAI } from 'openai';

export interface IEmbeddingService {
  embedText(
    text: string,
  ): Promise<{ embedding: number[]; vectorLength: number }>;

  embedTexts(texts: string[]): Promise<
    {
      embedding: number[];
      vectorLength: number;
      index: number;
      originalText: string;
    }[]
  >;
}

export const IEmbeddingServiceToken = Symbol('IEmbeddingService');

@Injectable()
export class EmbeddingService implements IEmbeddingService {
  private readonly openAiClient = new OpenAI();
  private readonly logger = new Logger(EmbeddingService.name);

  async embedText(
    text: string,
  ): Promise<{ embedding: number[]; vectorLength: number }> {
    if (text.length === 0) {
      throw new Error('Text for embedding cannot be empty');
    }

    const embedding = await this.openAiClient.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    const test = embedding.data.flatMap((e) => e.embedding);
    return {
      embedding: test,
      //https://platform.openai.com/docs/guides/embeddings - text-embedding-3-small
      vectorLength: 1536,
    };
  }

  async embedTexts(texts: string[]): Promise<
    {
      embedding: number[];
      vectorLength: number;
      index: number;
      originalText: string;
    }[]
  > {
    if (texts.length === 0) {
      throw new Error('Texts for embedding cannot be empty');
    }

    const emptyTextPartIndex = texts.findIndex((text) => text.length === 0);
    if (emptyTextPartIndex !== -1) {
      throw new Error(
        `Text part at index ${emptyTextPartIndex} is empty and cannot be embedded`,
      );
    }

    this.logger.debug(
      `Embedding ${texts.length} text parts with OpenAI embeddings service`,
    );

    const embeddings = await this.openAiClient.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      encoding_format: 'float',
    });

    return embeddings.data.map((e) => ({
      index: e.index,
      embedding: e.embedding,
      vectorLength: 1536, // https://platform.openai.com/docs/guides/embeddings - text-embedding-3-small
      originalText: texts[e.index],
    }));
  }
}
