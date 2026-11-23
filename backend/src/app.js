const express = require('express');
const multer = require('multer');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const DocumentRepository = require('./repositories/documentRepository');
const DocumentService = require('./services/documentService');
const createDocumentController = require('./controllers/documentController');
const createErrorHandler = require('./controllers/errorHandler');
const createDocumentRouter = require('./routes/documentRoutes');

function readConfiguration(options = {}) {
  const ownerId = (options.ownerId ?? process.env.DMS_OWNER_ID ?? '').trim();
  const configuredLimit = options.maxFileSizeBytes ??
    process.env.DMS_MAX_FILE_SIZE_BYTES ??
    10 * 1024 * 1024;
  const maxFileSizeBytes = Number(configuredLimit);

  if (!ownerId) {
    throw new Error('A variável de ambiente DMS_OWNER_ID é obrigatória.');
  }

  if (!Number.isSafeInteger(maxFileSizeBytes) || maxFileSizeBytes <= 0) {
    throw new Error('DMS_MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
  }

  return {
    ownerId,
    maxFileSizeBytes,
    storageDirectory: options.storageDirectory ?? path.resolve(__dirname, '../storage'),
  };
}

function createApp(options = {}) {
  const config = readConfiguration(options);
  const repository = new DocumentRepository(config.storageDirectory);
  const service = new DocumentService(repository, config.ownerId);
  const controller = createDocumentController(service);
  const upload = multer({
    storage: multer.diskStorage({
      destination: config.storageDirectory,
      filename: (_request, _file, callback) => callback(null, randomUUID()),
    }),
    limits: {
      fileSize: config.maxFileSizeBytes,
      files: 1,
    },
  });

  const app = express();
  app.use(express.json());
  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });
  app.use(createDocumentRouter(controller, upload));
  app.use(createErrorHandler());

  return app;
}

const app = createApp();

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
module.exports.createApp = createApp;
