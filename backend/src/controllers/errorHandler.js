const multer = require('multer');

const filesystemErrorCodes = new Set(['EACCES', 'EBUSY', 'EIO', 'ENOENT', 'ENOSPC']);

function createErrorHandler() {
  return (error, request, response, next) => {
    if (response.headersSent) {
      return next(error);
    }

    let statusCode = error.statusCode || 500;
    let code = error.code || 'INTERNAL_ERROR';
    let message = error.message || 'Ocorreu um erro interno.';

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        statusCode = 413;
        code = 'FILE_TOO_LARGE';
        message = 'O arquivo excede o tamanho máximo permitido.';
      } else {
        statusCode = 400;
        code = 'MULTIPART_INVALID';
        message = 'A requisição de envio é inválida.';
      }
    } else if (filesystemErrorCodes.has(error.code)) {
      statusCode = 500;
      code = 'STORAGE_ERROR';
      message = 'Não foi possível acessar o armazenamento local.';
    } else if (request.is('multipart/form-data') && !error.statusCode) {
      statusCode = 400;
      code = 'MULTIPART_INVALID';
      message = 'A requisição de envio é inválida.';
    } else if (!error.statusCode) {
      statusCode = 500;
      code = 'INTERNAL_ERROR';
      message = 'Ocorreu um erro interno.';
    }

    response.status(statusCode).json({
      error: { code, message },
    });
  };
}

module.exports = createErrorHandler;