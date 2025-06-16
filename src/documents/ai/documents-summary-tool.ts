import { createTool } from '@mastra/core';
import OpenAI from 'openai';
import { z } from 'zod';

interface DocumentSummaryToolResult {
  summary: string;
}

const inputSchema = z.object({
  documentId: z.string(),
  text: z.string(),
});

type DocumentSummaryToolContext = z.infer<typeof inputSchema>;

const outputSchema = z.object({
  summary: z.string(),
});

export const documentsSummaryTool = createTool({
  id: 'documents_summary',
  description:
    'Summarize a document based on its text content. It returns a concise summary of the document.',
  inputSchema,
  outputSchema,
  execute: async ({
    context,
  }: {
    context: DocumentSummaryToolContext;
  }): Promise<DocumentSummaryToolResult> => {
    const openAi = new OpenAI();

    const { documentId, text } = context;
    const response = await openAi.chat.completions.create({
      model: 'gpt-4o-mini',

      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI that summarizes documents.',
        },
        {
          role: 'user',
          content: `Please summarize the following document (ID: ${documentId}):\n\n${text}`,
        },
      ],
    });

    const summary = response.choices[0].message.content!;

    return {
      summary,
    };
  },
});
