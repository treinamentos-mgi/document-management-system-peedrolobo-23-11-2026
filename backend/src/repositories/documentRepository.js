const fs = require('node:fs');
const path = require('node:path');

class DocumentRepository {
  constructor(storageDirectory) {
    this.storageDirectory = storageDirectory;
    this.documents = new Map();
    fs.mkdirSync(storageDirectory, { recursive: true });
  }

  add(document) {
    this.documents.set(document.id, document);
  }

  findById(id) {
    return this.documents.get(id) ?? null;
  }

  findAllByOwner(owner) {
    return [...this.documents.values()].filter((document) => document.owner === owner);
  }

  getStoredFilePath(storedName) {
    if (!storedName || path.basename(storedName) !== storedName) {
      throw new Error('Nome de arquivo interno inválido.');
    }

    return path.join(this.storageDirectory, storedName);
  }

  async assertStoredFileExists(storedName) {
    const filePath = this.getStoredFilePath(storedName);
    await fs.promises.access(filePath, fs.constants.R_OK);
    return filePath;
  }

  async removeStoredFile(storedName) {
    await fs.promises.rm(this.getStoredFilePath(storedName), { force: true });
  }
}

module.exports = DocumentRepository;