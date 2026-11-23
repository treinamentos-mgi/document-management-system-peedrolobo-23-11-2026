const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
process.env.DMS_OWNER_ID ||= 'test-owner';
const appModule = require('../src/app');

async function createTestServer(t, options = {}) {
  const storageDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  const app = appModule.createApp({
    ownerId: 'test-owner',
    maxFileSizeBytes: options.maxFileSizeBytes ?? 1024,
    storageDirectory,
  });
  const server = await new Promise((resolve) => {
    const httpServer = app.listen(0, () => resolve(httpServer));
  });

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await fs.rm(storageDirectory, { recursive: true, force: true });
  });

  return `http://127.0.0.1:${server.address().port}`;
}

function createUploadForm(name, contents) {
  const form = new FormData();
  form.append('file', new Blob([contents], { type: 'text/plain' }), name);
  return form;
}

test('upload, listagem e download usam o armazenamento local e os metadados', async (t) => {
  const baseUrl = await createTestServer(t);
  const uploadForm = createUploadForm('relatorio.txt', 'conteudo do documento');
  uploadForm.append('owner', 'owner-controlado-pelo-cliente');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: uploadForm,
  });
  assert.equal(uploadResponse.status, 201);
  const { document } = await uploadResponse.json();
  assert.match(document.id, /^[0-9a-f-]{36}$/i);
  assert.equal(document.originalName, 'relatorio.txt');
  assert.equal(document.size, Buffer.byteLength('conteudo do documento'));
  assert.equal(document.owner, 'test-owner');
  assert.ok(document.uploadedAt);
  assert.equal('storedName' in document, false);

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.equal(listResponse.status, 200);
  assert.deepEqual((await listResponse.json()).documents, [document]);

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);
  assert.equal(downloadResponse.status, 200);
  assert.equal(downloadResponse.headers.get('content-type'), 'application/octet-stream');
  assert.equal(downloadResponse.headers.get('x-content-type-options'), 'nosniff');
  assert.match(downloadResponse.headers.get('content-disposition'), /attachment/);
  assert.equal(await downloadResponse.text(), 'conteudo do documento');
});

test('upload rejeita arquivo ausente e arquivos acima do limite', async (t) => {
  const baseUrl = await createTestServer(t, { maxFileSizeBytes: 4 });

  const missingFileResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: new FormData(),
  });
  assert.equal(missingFileResponse.status, 400);
  assert.equal((await missingFileResponse.json()).error.code, 'FILE_REQUIRED');

  const oversizedResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: createUploadForm('grande.txt', '12345'),
  });
  assert.equal(oversizedResponse.status, 413);
  assert.equal((await oversizedResponse.json()).error.code, 'FILE_TOO_LARGE');
});

test('download de um identificador sem registro retorna 404 uniforme', async (t) => {
  const baseUrl = await createTestServer(t);
  const response = await fetch(`${baseUrl}/documents/nao-existe/download`);

  assert.equal(response.status, 404);
  assert.deepEqual((await response.json()).error, {
    code: 'DOCUMENT_NOT_FOUND',
    message: 'Documento não encontrado.',
  });
});