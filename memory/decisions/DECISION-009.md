Status: ACTIVE
Date: 2026-06-11
Context: PLAN-0010 — uploads de arquivos (imagens de galeria, avatars) eram salvos em disco efêmero do container Railway. Em Docker, o container é substituído a cada rebuild, apagando os arquivos. S3 ou CDN externo não fazem parte do escopo imediato.
Decision: Persistir uploads em volume Docker nomeado montado no host VPS (`uploads_data:/app/uploads`). O nginx faz proxy de `/uploads/` para a API, que serve os arquivos do volume. Sem S3, Cloudflare R2 ou CDN externo nesta fase.
Consequences: Arquivos persistem entre rebuilds e restarts; backup manual do volume é responsabilidade do operador; sem replicação entre múltiplas instâncias (aceitável para implantação single-server); migração para S3/CDN é possível no futuro sem mudança de contrato de API — apenas alterar o service de upload.
