function toPublicDocument(document) {
  const { id, originalName, size, uploadedAt, owner } = document;
  return { id, originalName, size, uploadedAt, owner };
}

function createDocumentController(service) {
  return {
    upload: async (request, response, next) => {
      try {
        const uploadedFile = request.file && {
          storedName: request.file.filename,
          originalName: request.file.originalname,
          size: request.file.size,
        };
        const document = await service.upload(uploadedFile);
        response.status(201).json({ document: toPublicDocument(document) });
      } catch (error) {
        next(error);
      }
    },

    list: (_request, response, next) => {
      try {
        response.json({ documents: service.list().map(toPublicDocument) });
      } catch (error) {
        next(error);
      }
    },

    download: async (request, response, next) => {
      try {
        const document = await service.getDownload(request.params.id);
        response.download(
          document.filePath,
          document.originalName,
          {
            headers: {
              'Content-Type': 'application/octet-stream',
              'X-Content-Type-Options': 'nosniff',
            },
          },
          (error) => {
            if (error) next(error);
          }
        );
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = createDocumentController;