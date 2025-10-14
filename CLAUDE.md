# 🎯 MESTRE DA REDAÇÃO - Documentação para Claude

## 📌 Contexto Rápido

**O que é**: Plataforma educacional para correção de redações do ENEM com correção humana especializada
**Status**: Em produção com usuários ativos
**Stack**: Next.js 14 + Firebase + TypeScript + Tailwind CSS

## 🎓 Modelo de Negócio

### Planos Simplificados (4 tipos)
1. **GRATUITO** (R$ 0): Apenas propostas de redação
2. **AVULSO** (R$ 15): 1 token + acesso temporário quando tem token ativo
3. **MESTRE** (R$ 100/mês): 6 correções/mês + acesso completo
4. **PARCEIRO** (Customizado): 6 correções mensais para escolas/cursinhos

### Processo Comercial
- Vendas via WhatsApp: 5521981120169
- Pagamento manual (sem gateway)
- Cupons para instituições parceiras

## 🏗️ Arquitetura Técnica

### Stack Principal
- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Backend**: Firebase (Firestore + Storage + Auth)
- **UI**: shadcn/ui + Tailwind CSS + Radix UI
- **Deploy**: Firebase Hosting

### Arquivos Críticos
```
lib/
├── subscription-config.ts    # ⭐ CONFIG CENTRAL DOS PLANOS
├── firebase.ts              # Configuração Firebase
├── types.ts                 # TypeScript types
├── subscription-utils.ts    # Funções de verificação de acesso

hooks/
├── use-subscription.ts      # ⭐ Hook com reset automático
├── use-essays.ts           # Gerenciamento de redações
├── use-chats.ts            # Sistema de chat

components/
├── subscription-guard.tsx   # ⭐ Proteção de rotas por plano
```

## 💰 Sistema de Assinaturas ATUALIZADO

### Configuração Central
**Arquivo principal**: `lib/subscription-config.ts` ⭐
- Todos os planos definidos em um único lugar
- Constante `MESTRE_MONTHLY_TOKENS = 6`
- Funções auxiliares de verificação

### Regras de Acesso por Plano

| Recurso | GRATUITO | AVULSO | MESTRE | PARCEIRO |
|---------|----------|---------|---------|----------|
| Propostas | ✅ | ✅ | ✅ | ✅ |
| Videoaulas | ❌ | ✅ (c/ token) | ✅ | ✅ |
| Materiais | ❌ | ✅ (c/ token) | ✅ | ✅ |
| Chat | ❌ | ✅ (c/ token) | ✅ | ✅ |
| Envio Redação | ❌ | ✅ (c/ token) | ✅ | ✅ |
| Tokens/mês | 0 | 1 por compra | 6 | 6 |

### Sistema de Tokens
- **Reset Automático**: Plano MESTRE reseta para 6 tokens todo mês
- **Verificação**: Hook `useSubscription` faz reset transparente
- **AVULSO**: Acesso completo enquanto tiver token ativo
- **Logs**: Todo consumo e reset é registrado

## 📝 Fluxo de Correção de Redações

1. **Envio**: Aluno seleciona tema + upload PDF
2. **Token**: -1 token para todos os planos
3. **Fila**: Redação fica `pending` para correção
4. **Correção**: Professor avalia 5 competências (0-200 cada)
5. **Entrega**: Aluno recebe nota + feedback + PDF marcado

## 🗄️ Estrutura Firestore Simplificada

```
users/              # Perfis (role: student/professor)
subscriptions/      # Assinaturas com tokens e tipo
essays/            # Redações enviadas
essayThemes/       # Temas disponíveis
lessons/           # Videoaulas
materials/         # PDFs didáticos
chats/            # Conversas aluno-professor
```

## 👨‍🏫 Área do Professor

- **Correção**: Interface com PDF viewer + 5 competências
- **Gestão de Alunos**: Alterar planos, ver estatísticas
- **Conteúdo**: Upload de videoaulas e materiais
- **Chat**: Atendimento aos alunos


## ✅ Mudanças Recentes Implementadas

### Sistema de Assinaturas Refatorado (10/08/2025)
- **Configuração centralizada** em `lib/subscription-config.ts`
- **Tokens do MESTRE**: 15 → 6 correções/mês
- **Reset automático**: Tokens renovam transparentemente todo mês
- **AVULSO melhorado**: Acesso total quando tem token ativo
- **Logs implementados**: Todo consumo/reset é rastreado

## 🚧 Próximas Evoluções

### Prioridade Alta
- [ ] Gateway de pagamento (Stripe/Mercado Pago)
- [ ] Notificações push quando correção ficar pronta
- [ ] Cloud Function para reset às 00:00 do dia 1º

### Prioridade Média  
- [ ] Dashboard analytics para admin
- [ ] Sistema de cupons automatizado
- [ ] Validação de tokens no backend (segurança)


## 🚀 Comandos Essenciais

```bash
npm run dev        # Desenvolvimento local
npm run build      # Build de produção
npm run deploy     # Deploy para Firebase
```

## ⚠️ Regras Críticas

1. **NUNCA** alterar `subscription-config.ts` sem avisar
2. **SEMPRE** usar `SubscriptionGuard` para proteger rotas
3. **TESTAR** mudanças de planos em dev antes de deploy
4. **NÃO COMMITAR** .env.local ou serviceAccountKey.json


## 📞 Contatos

- **WhatsApp**: 5521981120169
- **Firebase**: mestre-da-redacao

---

*Atualizado em 10/08/2025 - Sistema de assinaturas refatorado*