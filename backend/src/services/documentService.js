function createServiceError(code, statusCode, message) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

class DocumentService {
  constructor(repository, ownerId, now = () => new Date()) {
    this.repository = repository;
    this.ownerId = ownerId;
    this.now = now;
  }

  async upload(file) {
    if (!file) {
      throw createServiceError('FILE_REQUIRED', 400, 'Selecione um arquivo para enviar.');
    }

    const document = {
      id: file.storedName,
      originalName: file.originalName,
      size: file.size,
      uploadedAt: this.now().toISOString(),
      owner: this.ownerId,
      storedName: file.storedName,
    };

    try {
      this.repository.add(document);
    } catch (error) {
      await this.repository.removeStoredFile(file.storedName).catch(() => {});
      throw createServiceError('STORAGE_ERROR', 500, 'Não foi possível salvar o documento.');
    }

    return this.toPublicDocument(document);
  }

  list() {
    return this.repository
      .findAllByOwner(this.ownerId)
      .sort((left, right) => {
        const dateDifference = Date.parse(right.uploadedAt) - Date.parse(left.uploadedAt);
        return dateDifference || left.id.localeCompare(right.id);
      })
      .map((document) => this.toPublicDocument(document));
  }

  async getDownload(id) {
    const document = this.repository.findById(id);
    if (!document || document.owner !== this.ownerId) {
      throw createServiceError(
        'DOCUMENT_NOT_FOUND',
        404,
        'Documento não encontrado.'
      );
    }

    try {
      const filePath = await this.repository.assertStoredFileExists(document.storedName);
      return { filePath, originalName: document.originalName };
    } catch (_error) {
      throw createServiceError('STORAGE_ERROR', 500, 'Não foi possível ler o documento.');
    }
  }

  toPublicDocument(document) {
    const { id, originalName, size, uploadedAt, owner } = document;
    return { id, originalName, size, uploadedAt, owner };
  }
}

module.exports = DocumentService;