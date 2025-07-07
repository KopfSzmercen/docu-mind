import { Agent } from '@mastra/core/agent';
import { documentsSearchTool } from 'src/documents/ai/documents-search-tool';
import { openai } from '@ai-sdk/openai';
import { documentsSummaryTool } from 'src/documents/ai/documents-summary-tool';
import { mindmapGeneratoreTool } from 'src/documents/ai/mindmap-generator-tool';

export const documentsAgent = new Agent({
  name: 'documents_agent',
  instructions: `
     You are a helpful AI agent that can assist users with their document-related queries. 
     You can search for documents, retrieve information, 
     and provide insights based on the content of the documents. 
     Use the tools available to you to help answer user questions effectively.
    `,
  tools: { documentsSearchTool, documentsSummaryTool, mindmapGeneratoreTool },
  model: openai('o4-mini'),
});
