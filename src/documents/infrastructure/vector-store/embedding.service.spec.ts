import { Test, TestingModule } from '@nestjs/testing';
import { EmbeddingService } from './embedding.service';

// Mock OpenAI
const mockCreate = jest.fn();
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      embeddings: {
        create: mockCreate,
      },
    })),
  };
});

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmbeddingService],
    }).compile();

    service = module.get<EmbeddingService>(EmbeddingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('embedText', () => {
    it('should successfully embed text and return embedding with vector length', async () => {
      // Arrange
      const inputText = 'This is a test text for embedding';
      const mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];

      mockCreate.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
      });

      // Act
      const result = await service.embedText(inputText);

      // Assert
      expect(result).toEqual({
        embedding: mockEmbedding,
        vectorLength: 1536,
      });
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: inputText,
        encoding_format: 'float',
      });
    });

    it('should throw error when text is empty', async () => {
      // Arrange
      const emptyText = '';

      // Act & Assert
      await expect(service.embedText(emptyText)).rejects.toThrow(
        'Text for embedding cannot be empty',
      );
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe('embedTexts', () => {
    it('should successfully embed multiple texts and return embeddings with indices', async () => {
      // Arrange
      const inputTexts = ['First text', 'Second text', 'Third text'];
      const mockEmbeddings = [
        { index: 0, embedding: [0.1, 0.2, 0.3] },
        { index: 1, embedding: [0.4, 0.5, 0.6] },
        { index: 2, embedding: [0.7, 0.8, 0.9] },
      ];

      mockCreate.mockResolvedValue({
        data: mockEmbeddings,
      });

      // Act
      const result = await service.embedTexts(inputTexts);

      // Assert
      expect(result).toEqual([
        { index: 0, embedding: [0.1, 0.2, 0.3], vectorLength: 1536 },
        { index: 1, embedding: [0.4, 0.5, 0.6], vectorLength: 1536 },
        { index: 2, embedding: [0.7, 0.8, 0.9], vectorLength: 1536 },
      ]);
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: inputTexts,
        encoding_format: 'float',
      });
    });

    it('should throw error when texts array is empty', async () => {
      // Arrange
      const emptyTexts: string[] = [];

      // Act & Assert
      await expect(service.embedTexts(emptyTexts)).rejects.toThrow(
        'Texts for embedding cannot be empty',
      );
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should throw error when any text in array is empty', async () => {
      // Arrange
      const textsWithEmpty = ['First text', '', 'Third text'];

      // Act & Assert
      await expect(service.embedTexts(textsWithEmpty)).rejects.toThrow(
        'Text part at index 1 is empty and cannot be embedded',
      );
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });
});
