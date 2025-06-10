import { DocumentSplittingService } from './document-splitting.service';

describe('DocumentSplittingService', () => {
  let documentSplittingService: DocumentSplittingService;

  beforeEach(() => {
    documentSplittingService = new DocumentSplittingService();
  });

  it('should split document text into chunks', async () => {
    const documentText =
      'This is a sample document text that needs to be split into smaller chunks for processing.';

    const result = await documentSplittingService.splitDocument(documentText);

    expect(result).toBeDefined();
  });
});
