---
description: "Valida uma entrega do DMS antes de commit ou push."
name: validar-entrega-dms
argument-hint: "escopo: backend, frontend ou ambos"
agent: agent
---

# Validar entrega do DMS

Valide as alterações relacionadas a `${input:escopo:backend, frontend ou ambos}` antes do commit ou push. Use as instruções do projeto em `.github/copilot-instructions.md` e a especificação em `docs/specs/dms-spec.md` como referência.

1. Inspecione `git status --short --branch` e `git diff --check`. Não inclua arquivos não relacionados na análise e não descarte alterações existentes.
2. Para `backend` ou `ambos`, execute `cd backend && npm test` a partir da raiz do repositório.
3. Para `frontend` ou `ambos`, execute `cd frontend && npm run build` a partir da raiz do repositório.
4. Compare o comportamento alterado com a especificação e as instruções: contratos da API, Clean Architecture, armazenamento exclusivamente local via Multer `diskStorage` e metadados em memória.
5. Não altere arquivos, não faça stage, commit ou push. Se uma verificação falhar, reporte a falha com o comando e a causa provável, sem tentar corrigir a implementação.

Responda em português com um resumo curto contendo o escopo validado, as verificações executadas, o resultado e eventuais riscos ou falhas. Diferencie falhas da alteração atual de problemas preexistentes ou arquivos não relacionados.
