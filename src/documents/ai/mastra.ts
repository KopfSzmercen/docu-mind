import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { documentsAgent } from 'src/documents/ai/agent';
import { IVectorStoreService } from 'src/documents/infrastructure/vector-store/vector-store.service';

export type MastraRuntimeConntext = {
  userId: string;
  vectorStoreService: IVectorStoreService;
};

export const mastra = new Mastra({
  agents: { documentsAgent },
  storage: new LibSQLStore({
    url: ':memory:',
  }),
});
