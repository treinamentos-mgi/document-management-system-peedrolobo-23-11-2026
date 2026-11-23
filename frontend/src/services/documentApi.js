const API_BASE = '/api';

async function request(path, options) {
  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, options);
  } catch (_error) {
    throw new Error('Não foi possível conectar ao servidor. Tente novamente.');
  }

  if (!response.ok) {
    let message = 'Não foi possível concluir a solicitação.';
    try {
      const payload = await response.json();
      message = payload.error?.message || message;
    } catch (_error) {
      // Respostas sem JSON usam a mensagem genérica acima.
    }
    throw new Error(message);
  }

  return response;
}

export async function listDocuments() {
  const response = await request('/documents');
  const payload = await response.json();
  return payload.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', {
    method: 'POST',
    body: formData,
  });
  const payload = await response.json();
  return payload.document;
}

export async function downloadDocument(id, originalName) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`);
  const fileBlob = await response.blob();
  const downloadUrl = URL.createObjectURL(fileBlob);
  const link = window.document.createElement('a');

  link.href = downloadUrl;
  link.download = originalName || 'documento';
  link.hidden = true;
  window.document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}