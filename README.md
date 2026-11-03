# ConectaTI — Gestão de Suporte Escolar

Aplicação web mobile-first para levantamento e acompanhamento de necessidades de TI em ambientes escolares.

## Requisitos
- Node.js 18 ou superior
- npm

## Instalação e execução
```bash
npm install
npm run dev
```
Abra o endereço local exibido pelo Vite (normalmente http://localhost:5173).

## Build de produção
```bash
npm run build
npm run preview
```

## Funcionalidades
- Dashboard com indicadores, demandas recentes e visão por categoria.
- Cadastro, edição e exclusão de necessidades com protocolo automático.
- Sala/local, data, categoria, descrição, materiais, prioridade, status, solicitação à direção e observações.
- Status: Pendente, Em andamento, Aguardando aprovação, Concluído e Cancelado.
- Cadastro de ambientes com proteção contra exclusão quando existem registros vinculados.
- Busca e filtros por ambiente, status, categoria e data.
- Relatórios gerais ou por sala, impressão e opção de salvar como PDF pelo diálogo do navegador.
- Exportação XLSX e CSV com cabeçalhos em português.
- Persistência local via localStorage.
- Rotas com React Router, ícones Lucide e notificações com React Hot Toast.

## Estrutura
```text
src/
  components/   # Sidebar, Header, cards, modal e status
  context/      # Estado global e persistência local
  pages/        # Dashboard, Checklist, Salas e Relatórios
  styles/       # CSS global e responsivo
  utils/        # Exportação e impressão
```

## Sobre PDF
O pacote `react-render-pdf` encontrado no npm está publicado como versão `0.0.0`, sem README e sem suporte ESM documentado. Para evitar depender de uma biblioteca sem documentação adequada, este projeto usa `@react-pdf/renderer` para gerar PDFs paginados diretamente no navegador e também oferece impressão HTML (com opção “Salvar como PDF” do navegador). A exportação XLSX/CSV é feita com SheetJS.

## Persistência e próximos passos
Os dados ficam no navegador/dispositivo atual. Para uso simultâneo por vários computadores/celulares, autenticação, backup centralizado e histórico auditável, será necessário conectar um backend e banco de dados (por exemplo, Supabase ou API própria).
