import { createTool } from '@mastra/core';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

export interface MindmapLeaf {
  name: string;
  children?: MindmapLeaf[];
}

export interface MindmapGeneratorToolResult {
  mindmap: MindmapLeaf;
}

const inputSchema = z.object({
  text: z.string(),
});

const MindmapLeaf: z.ZodType<MindmapLeaf> = z.lazy(() =>
  z.object({
    name: z.string(),
    children: z.array(MindmapLeaf),
  }),
);

export const MindmapGeneratorToolResult = z.object({
  mindmap: MindmapLeaf,
});

export const mindmapGeneratoreTool = createTool({
  id: 'mindmap_generator',
  description:
    'Generates a mindmap based on the provided input. The mindmap is structured as a tree of nodes, where each node can have children. Use this whenever user asks for a mindmap.',
  inputSchema: inputSchema,
  outputSchema: MindmapGeneratorToolResult,
  execute: async ({
    context,
  }: {
    context: z.infer<typeof inputSchema>;
  }): Promise<MindmapGeneratorToolResult> => {
    const openAi = new OpenAI();

    const { text } = context;

    const response = await openAi.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI that generates mind maps from documents.
            The mind map should be structured as a tree of nodes, where each node can have children.
            Example structure:
            {
            "name": "Main topic",
            "children": [
                {
                "name": "Subtopic 1",
                "children": [
                    {
                    "name": "Subtopic 1.1"
                    },
                    {
                    "name": "Subtopic 1.2",
                    "children": [
                        {
                        "name": "Subtopic 1.1"
                        }
                    ]
                    }
                ]
                }
            ]
            }
          `,
        },
        {
          role: 'user',
          content: `Please generate a mind map for the following text:\n\n${text}`,
        },
      ],
      response_format: zodResponseFormat(MindmapLeaf, 'mindmap'),
    });

    const mindmap = response.choices[0].message;

    if (mindmap.refusal) {
      throw new Error(
        `Mindmap generation failed: ${mindmap.refusal || 'Unknown reason'}`,
      );
    }

    return {
      mindmap: mindmap.parsed as MindmapLeaf,
    };
  },
});
