---
description: "Implementa um requisito funcional específico da especificação do DMS."
name: implementar-requisito-dms
argument-hint: "ID do requisito e área afetada (backend, frontend ou ambos)"
agent: agent
---

# Implementar requisito do DMS

Implemente o requisito `${input:requisito:ID do requisito, por exemplo RF-01}` na área `${input:area:backend, frontend ou ambos}`.

1. Leia `.github/copilot-instructions.md` e a seção relevante de `docs/specs/dms-spec.md`; trate a especificação como contrato e confirme o estado atual do código antes de editar.
2. Siga a arquitetura e as convenções existentes. No backend, preserve `routes -> controllers -> services -> repositories`, armazenamento exclusivamente local com Multer `diskStorage` e metadados em memória. No frontend, reutilize o cliente `fetch` e componentes existentes.
3. Faça a menor alteração que satisfaça o requisito, sem implementar outros RFs nem refatorar áreas não relacionadas.
4. Acrescente ou atualize testes para o comportamento principal e os casos de erro relevantes. Execute a validação mais focada disponível e, quando aplicável, os testes do backend (`cd backend && npm test`) ou build do frontend (`cd frontend && npm run build`), a partir da raiz do repositório.
5. Não faça stage, commit ou push. Se houver ambiguidade que afete o contrato, exponha-a antes de assumir comportamento novo.

Responda em português com o requisito atendido, arquivos alterados, verificações executadas e qualquer pendência.
