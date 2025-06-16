import { RuntimeContext } from '@mastra/core/di';
import { createTool } from '@mastra/core/tools';
import { MastraRuntimeConntext } from 'src/documents/ai/mastra';
import { z } from 'zod';

interface SearchDocumentsToolResult {
  results: {
    documentId: string;
    pointId: string;
    text: string;
  }[];
}

const inputSchema = z.object({
  query: z.string(),
});

type SearchDocumentsToolContext = z.infer<typeof inputSchema>;

const outputSchema = z.object({
  results: z.array(
    z.object({
      documentId: z.string(),
      pointId: z.string(),
      text: z.string(),
    }),
  ),
});

export const documentsSearchTool = createTool({
  id: 'documents_search',
  description:
    'Search documents in the vector store based on a query. It returns most relevant documents base on query.',
  inputSchema,
  outputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: SearchDocumentsToolContext;
    runtimeContext: RuntimeContext<MastraRuntimeConntext>;
  }): Promise<SearchDocumentsToolResult> => {
    const { query } = context;

    const vectorStoreService = runtimeContext.get('vectorStoreService');

    const results = await vectorStoreService.search(
      query,
      runtimeContext.get('userId'),
    );

    return {
      results: results.map((result) => ({
        documentId: result.documentId,
        pointId: result.pointId,
        text: result.text,
      })),
    };
  },
});
