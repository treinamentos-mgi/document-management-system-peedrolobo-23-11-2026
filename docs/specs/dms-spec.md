# Especificação - Document Management System

## 1. Objetivo

Entregar uma aplicação web simples para enviar, listar e baixar documentos armazenados no filesystem local, associando os metadados de cada documento a um proprietário configurado para a instância.

## 2. Escopo

### Dentro do escopo

- Envio de um arquivo por requisição HTTP.
- Listagem dos documentos pertencentes ao proprietário configurado.
- Download de um documento por identificador.
- Interface React para enviar, consultar e baixar documentos.
- Armazenamento dos arquivos em `backend/storage` com Multer `diskStorage`.
- Metadados mantidos em memória durante a vida do processo.
- Configuração operacional por variáveis de ambiente.

### Fora do escopo

- Autenticação, cadastro de usuários ou identificação segura de usuários finais.
- Compartilhamento de documentos entre proprietários.
- Armazenamento em nuvem, banco de dados ou provedores externos.
- Versionamento, exclusão, edição, busca avançada ou pré-visualização de documentos.
- Reconstrução automática de metadados a partir dos arquivos após reinício.
- Garantia de persistência ou alta disponibilidade dos metadados.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | A aplicação deve permitir o envio de exatamente um arquivo por requisição, usando o campo multipart `file`. |
| RF-02 | O envio deve rejeitar requisições sem arquivo, com mais de um arquivo ou que excedam o limite configurado, sem deixar arquivo parcial disponível. |
| RF-03 | A aplicação deve gerar um identificador único para cada documento e um nome de armazenamento não derivado do caminho informado pelo cliente. Deve preservar o nome original apenas como metadado. |
| RF-04 | Cada documento deve ser associado ao proprietário definido pela configuração da instância. O cliente não pode escolher ou sobrescrever esse proprietário no payload. |
| RF-05 | A aplicação deve listar metadados apenas para o proprietário configurado, ordenados do mais recente para o mais antigo. Empates devem ter ordenação determinística pelo identificador. |
| RF-06 | A aplicação deve permitir o download pelo identificador somente quando o documento estiver registrado e pertencer ao proprietário configurado. Identificadores inexistentes ou de outro proprietário devem produzir a mesma resposta para não revelar a existência do recurso. |
| RF-07 | O download deve entregar o conteúdo como anexo com o nome original seguro para apresentação no cabeçalho HTTP. |
| RF-08 | A interface deve permitir selecionar e enviar um arquivo, apresentar sucesso ou erro, exibir a lista de documentos e iniciar o download de um documento listado. |
| RF-09 | A interface deve apresentar estados vazios e de carregamento para a lista, além de mensagens compreensíveis em português para falhas de envio, listagem e download. |
| RF-10 | O endpoint existente `GET /health` deve continuar disponível para verificação básica da aplicação; não substitui os contratos de documentos descritos nesta especificação. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados somente no filesystem local da aplicação em `backend/storage`, usando Multer com `diskStorage`. Não usar armazenamento externo. |
| RNF-02 | Os metadados devem permanecer em memória. Ao reiniciar o processo, os registros são perdidos; arquivos existentes sem registro ficam órfãos, não são listados nem servidos pela API e não são removidos automaticamente. |
| RNF-03 | As configurações operacionais devem vir de variáveis de ambiente, com valores padrão documentados quando aplicável. A aplicação deve falhar com mensagem clara se faltar configuração obrigatória. |
| RNF-04 | O backend deve seguir o fluxo de dependências `routes -> controllers -> services -> repositories`; regras de negócio não devem depender de Express ou Multer. |
| RNF-05 | O backend deve usar Node.js, Express e CommonJS; o frontend deve usar React, Vite e `fetch`, respeitando as dependências já presentes no projeto. |
| RNF-06 | Nomes de arquivo fornecidos pelo cliente nunca devem ser usados como caminho de gravação. Respostas de download devem ser anexos e incluir `X-Content-Type-Options: nosniff`. |
| RNF-07 | Erros de entrada, filesystem e documento inexistente devem ser convertidos em respostas HTTP previsíveis, sem expor caminhos locais, stack traces ou detalhes internos. |
| RNF-08 | O comportamento de rotas, regras de negócio e integração com filesystem deve ser coberto por testes automatizados usando o runner nativo `node:test` no backend. |

### Configuração proposta

| Variável | Obrigatória | Padrão | Descrição |
| --- | --- | --- | --- |
| `PORT` | Não | `3000` | Porta HTTP do backend. |
| `DMS_OWNER_ID` | Sim | Sem padrão | Identificador fixo do proprietário associado aos documentos desta instância. Deve ser uma string não vazia após remoção de espaços nas extremidades. |
| `DMS_MAX_FILE_SIZE_BYTES` | Não | `10485760` (10 MiB) | Limite máximo de tamanho por arquivo; deve ser um inteiro positivo. |

O caminho de armazenamento é fixo em `backend/storage`, resolvido em relação à localização da aplicação, e não deve depender do diretório corrente do processo. O MVP aceita qualquer tipo de arquivo; o tipo MIME informado pelo cliente não é considerado confiável. Downloads devem usar `application/octet-stream`.

## 5. Modelo de dados (metadados do documento)

O repositório em memória deve manter um registro por documento, indexado pelo `id`. A resposta pública de API não deve expor o nome interno nem o caminho físico do arquivo.

| Campo | Tipo | Exposição | Descrição |
| --- | --- | --- | --- |
| `id` | string (UUID) | Público | Identificador único, gerado pelo servidor. Também identifica o nome aleatório usado no armazenamento local. |
| `originalName` | string | Público | Nome original fornecido no upload, tratado como texto e nunca usado como caminho. |
| `size` | number (inteiro) | Público | Tamanho do arquivo em bytes. |
| `uploadedAt` | string (ISO 8601 UTC) | Público | Data e hora em que o upload foi concluído e o registro criado. |
| `owner` | string | Público | Valor de `DMS_OWNER_ID` associado ao documento. |
| `storedName` | string | Interno | Nome gerado pelo servidor no diretório de armazenamento, sem componentes de caminho fornecidos pelo cliente. No MVP, corresponde ao UUID sem extensão. |

### Regras de consistência

- O arquivo deve ser gravado antes de publicar o registro na lista em memória. Se a criação do registro falhar, o arquivo recém-gravado deve ser removido.
- `size` deve refletir os bytes efetivamente gravados; `uploadedAt` deve ser definido pelo servidor em UTC.
- A consulta de um registro só pode resultar em download se o arquivo correspondente ainda existir e puder ser lido. Falha de leitura deve ser tratada como erro interno, sem retornar caminho local.
- Reinício do processo limpa os registros em memória. Não há procedimento automático para reconstruir registros, apagar órfãos ou recuperar associação entre arquivo e proprietário.

## 6. Contratos de API

As rotas abaixo são caminhos do backend. O frontend usa o prefixo `/api` configurado no proxy do Vite, que é removido pelo proxy antes da requisição chegar ao backend. Portanto, as rotas Express não incluem `/api`.

### Formato comum de erro

Respostas de erro JSON devem usar o formato:

```json
{
  "error": {
    "code": "FILE_REQUIRED",
    "message": "Selecione um arquivo para enviar."
  }
}
```

`code` é estável para uso pelo cliente; `message` é uma mensagem segura em português. Respostas de download com erro usam o mesmo formato JSON.

### POST /upload

- **Content-Type:** `multipart/form-data`.
- **Campo obrigatório:** `file`, exatamente um arquivo. Outros campos de formulário são ignorados ou rejeitados consistentemente; não podem definir `owner`.
- **Limite:** `DMS_MAX_FILE_SIZE_BYTES` (padrão 10 MiB).
- **Sucesso:** `201 Created`, JSON no formato abaixo.

```json
{
  "document": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "relatorio.pdf",
    "size": 24576,
    "uploadedAt": "2026-11-23T12:00:00.000Z",
    "owner": "local-user"
  }
}
```

- **Erros:** `400 FILE_REQUIRED` para arquivo ausente ou multipart inválido; `413 FILE_TOO_LARGE` quando o limite é excedido; `500 STORAGE_ERROR` para falha de gravação ou registro. A mensagem não deve revelar detalhes internos.

### GET /documents

- **Entrada:** sem parâmetros ou corpo.
- **Sucesso:** `200 OK`, documentos do proprietário configurado em ordem decrescente de `uploadedAt`, usando `id` crescente como desempate.

```json
{
  "documents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "originalName": "relatorio.pdf",
      "size": 24576,
      "uploadedAt": "2026-11-23T12:00:00.000Z",
      "owner": "local-user"
    }
  ]
}
```

- A lista vazia deve ser `200 OK` com `"documents": []`.
- **Erros:** `500 INTERNAL_ERROR` se não for possível concluir a consulta.

### GET /documents/:id/download

- **Entrada:** `id` UUID na URL; sem corpo.
- **Sucesso:** `200 OK`, bytes originais do arquivo, `Content-Type: application/octet-stream`, `Content-Disposition: attachment` com `originalName` codificado de forma segura, e `X-Content-Type-Options: nosniff`.
- **Erros:** `404 DOCUMENT_NOT_FOUND` se o ID não existir, pertencer a outro proprietário ou não houver registro em memória. `500 STORAGE_ERROR` em falha inesperada de leitura. O corpo de erro é JSON no formato comum.

### Endpoint operacional existente

`GET /health` permanece como endpoint de saúde existente. Sua resposta e seu uso não alteram os contratos de upload, listagem ou download definidos acima.

## 7. Decisões arquiteturais

- **Rotas:** declaram endpoints e middleware HTTP, incluindo Multer para receber o arquivo; encaminham o resultado ao controller.
- **Controllers:** validam o formato básico da requisição, chamam os serviços e traduzem resultados/erros para status e corpos HTTP.
- **Services:** aplicam as regras de upload, ownership, listagem e download sem depender de objetos Express ou de detalhes do Multer.
- **Repositories:** mantêm os metadados em memória e encapsulam o acesso ao diretório local. O filesystem não é substituído por serviço externo.
- **Upload local:** Multer `diskStorage` grava em `backend/storage` com nome gerado pelo servidor; o `originalName` só é mantido como metadado.
- **Proprietário:** `DMS_OWNER_ID` representa o único proprietário da instância no MVP. Sem autenticação, esse mecanismo não identifica usuários do navegador e não deve ser apresentado como isolamento seguro entre usuários finais. Autenticação e identidade por requisição ficam para uma evolução futura.
- **Frontend:** componentes React usam `fetch` em `/api/upload`, `/api/documents` e `/api/documents/:id/download`; o proxy Vite encaminha para as rotas sem prefixo do backend.
- **Falhas:** erros esperados devem ter códigos consistentes; detalhes técnicos e caminhos absolutos ficam somente nos logs do servidor.

## 8. Plano de execução

As etapas abaixo descrevem uma sequência futura de implementação. Esta entrega é somente a especificação; não inclui execução ou alteração dos arquivos de backend ou frontend.

1. Preparar configuração e fundação: validar variáveis de ambiente, resolver o caminho local de armazenamento e estabelecer a estrutura de rotas, controllers, services e repositories.
2. Implementar e testar o fluxo de upload local: limites, nome aleatório, metadados em memória, associação ao owner e limpeza do arquivo em falhas.
3. Implementar e testar listagem e download: ordenação, filtro por owner, respostas de erro e comportamento para arquivos ausentes ou órfãos.
4. Construir a interface React de envio e listagem, conectá-la por `fetch` ao proxy `/api` e implementar feedback de carregamento, vazio e erro.
5. Integrar download na interface e verificar o fluxo ponta a ponta, incluindo testes backend, execução frontend e preservação do endpoint `/health`.