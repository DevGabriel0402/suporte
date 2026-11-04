# Segurança e publicação

## Validações locais

Use Node.js 22 e Java 21 (necessário apenas para o emulador).

```sh
npm ci
npm test
npm run test:security
npm run build
npm audit --omit=dev --audit-level=high
```

Os testes usam exclusivamente `demo-conectati-security` e um Firestore local. Não informe credenciais de produção. Mensagens PERMISSION_DENIED são esperadas nos testes de operações proibidas.

## Controles implementados

- Isolamento por escola e bloqueio de perfis desativados, inclusive master.
- Técnicos podem criar/atualizar chamados, mas não excluir chamados nem alterar ambientes.
- Validação do chamado alterado: campos permitidos, tipos, status, categoria, prioridade, tamanho dos textos, responsável e formato das datas.
- Cada gravação altera no máximo um chamado, identificado por `mutationTaskId`. A regra confere a diferença efetiva dos dados; o identificador sozinho não concede acesso.
- Ambientes limitados a 200, sem duplicatas; até 2.000 chamados por workspace. O limite físico do documento do Firestore ainda se aplica.
- Registros antigos permanecem legíveis. Chamados antigos são validados quando editados. Espaços individuais com arrays antigos são convertidos preservando exatamente os registros antes da edição.
- Cabeçalhos contra enquadramento da página, interpretação indevida de conteúdo e uso de câmera/microfone/localização. A CSP adicionada restringe objetos, URL base e enquadramento; ainda não restringe todas as fontes de scripts.
- SheetJS atualizado para 0.20.3 pelo endereço oficial, com integridade registrada no lockfile.

## Ativar a barreira de publicação

O workflow `.github/workflows/validate.yml` executa testes, emulador, compilação e auditoria de dependências de produção em pull requests e alterações em main/master. Não possui credenciais de produção e usa permissão de leitura do repositório.

Depois de enviar os arquivos ao GitHub:

1. Execute o workflow e confirme o resultado.
2. Em Settings > Rules > Rulesets, proteja a branch de produção: exija pull request, revisão e a verificação `Validate security and build`; bloqueie exclusão e force push. Restrinja os usuários que podem ignorar essa regra.
3. Na Vercel, confirme a branch de produção protegida. Para garantir que a publicação só aconteça após os checks, use publicação controlada após sucesso do workflow ou configure o recurso de verificações obrigatórias da integração disponível na conta. Apenas criar este workflow não bloqueia deploys automáticos da Vercel.
4. Separe os projetos Firebase e as variáveis de Preview e Production. Nunca use o banco real nas prévias. Ative proteção de acesso às prévias na Vercel.
5. Configure proteção contra segredos e alertas de dependências no GitHub, conforme os recursos da conta. Variáveis VITE_* ficam públicas no navegador: nunca coloque chaves administrativas nelas.

## Publicar regras e aplicação

As novas regras e o cliente usam `mutationTaskId`. Faça uma publicação coordenada, inicialmente em homologação, pois clientes antigos abertos podem receber recusa ao salvar com as regras novas.

- Faça backup/exportação do banco antes da atualização e confirme os limites e os campos dos registros existentes.
- Execute a suíte completa contra o emulador e teste os fluxos de cadastro/aprovação e chamados na homologação.
- Em janela de manutenção, publique a aplicação e as regras do mesmo conjunto de alterações. Solicite recarregar as sessões antigas.
- As regras são publicadas explicitamente no projeto correto, usando uma conta autorizada:

```sh
npx firebase deploy --only firestore:rules --project ID_REAL_DO_PROJETO
```

Nenhuma regra foi enviada ao Firebase por esta tarefa. Nenhuma configuração de GitHub/Vercel foi alterada remotamente.

## Limitações e próximas etapas

O histórico atual continua sendo produzido no navegador; não é uma auditoria inviolável. Transferir autor, horário e eventos para uma função no servidor com gravação imutável é a próxima etapa. Os nomes dos ambientes são uma lista legada: há controle de quantidade e duplicidade, mas a validação individual de cada entrada deve acompanhar uma futura estrutura por documento. As datas são validadas pelo formato, não por calendário completo.

O gate bloqueia vulnerabilidades altas/críticas em dependências de produção. Ainda há avisos moderados no React Router 6 e avisos nas ferramentas de desenvolvimento; migre e valide essas dependências em uma atualização própria. Não execute `npm audit fix --force` sem revisar as mudanças.

Backups agendados, restauração testada, App Check, alertas e MFA administrativo exigem configuração adicional nos serviços e não foram ativados nesta entrega.
