import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import {
  IEmbeddingService,
  IEmbeddingServiceToken,
} from 'src/documents/infrastructure/vector-store/embedding.service';
import { v4 } from 'uuid';

export interface IVectorStoreService {
  addDocument(
    documentId: string,
    userId: string,
    documentParts: string[],
  ): Promise<void>;

  search(
    query: string,
    userId: string,
  ): Promise<
    {
      documentId: string;
      pointId: string;
      text: string;
    }[]
  >;
}

export const IVectorStoreServiceToken = Symbol('IVectorStoreService');

@Injectable()
export class VectorStoreService implements IVectorStoreService {
  private readonly client: QdrantClient;
  private readonly collectionName: string;

  constructor(
    private readonly configService: ConfigService,

    @Inject(IEmbeddingServiceToken)
    private readonly emeddingService: IEmbeddingService,
  ) {
    const host = this.configService.get<string>('QDRANT_HOST');
    const port = this.configService.get<number>('QDRANT_PORT');
    const collectionName = this.configService.get<string>('QDRANT_COLLECTION')!;

    this.client = new QdrantClient({ host, port });
    this.collectionName = collectionName;
  }

  private async ensureCollectionExists(): Promise<void> {
    const collectionExists = await this.client.collectionExists(
      this.collectionName,
    );

    if (collectionExists.exists) {
      return;
    }

    await this.client.createCollection(this.collectionName, {
      vectors: {
        distance: 'Cosine',
        size: 1536,
      },
      timeout: 20,
    });
  }

  async addDocument(
    documentId: string,
    userId: string,
    documentParts: string[],
  ): Promise<void> {
    await this.ensureCollectionExists();

    const embeddings = await this.emeddingService.embedTexts(documentParts);

    const points = embeddings.map((embedding) => ({
      id: v4(),
      vector: Array.from(embedding.embedding),
      payload: {
        documentId,
        userId,
        partIndex: embedding.index,
        text: embedding.originalText,
      },
    }));

    await this.client.upsert(this.collectionName, {
      wait: true,
      batch: {
        ids: points.map((point) => point.id),
        vectors: points.map((point) => point.vector),
        payloads: points.map((point) => point.payload),
      },
    });
  }

  async search(
    query: string,
    userId: string,
  ): Promise<
    {
      documentId: string;
      pointId: string;
      text: string;
    }[]
  > {
    await this.ensureCollectionExists();

    const queryEmbedding = await this.emeddingService.embedText(query);

    const matchingPoints = await this.client.query(this.collectionName, {
      query: Array.from(queryEmbedding.embedding),
      with_payload: {
        include: ['userId', 'documentId', 'text'],
      },
      filter: {
        must: [
          {
            key: 'userId',
            match: {
              value: userId,
            },
          },
        ],
      },
      limit: 1,
    });

    return matchingPoints.points.map((point) => ({
      documentId: point.payload!.documentId as string,
      pointId: point.id.toString(),
      text: point.payload!.text as string,
    }));
  }
}
