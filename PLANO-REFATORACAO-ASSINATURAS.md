# 📋 PLANO DE REFATORAÇÃO - SISTEMA DE ASSINATURAS

## PLANO A - REFATORAÇÃO COMPLETA (4 SEMANAS)

### Semana 1: Preparação e Centralização
- Criar sistema centralizado de configuração (`lib/subscription-config.ts`)
- Implementar TokenManager com reset automático
- Criar testes unitários completos
- Desenvolver sistema de logs e auditoria

### Semana 2: Migração de Dados
- Backup completo do Firestore
- Script de migração (private → partner, 15 → 6 tokens)
- Adicionar campos: lastTokenReset, history
- Validar integridade dos dados

### Semana 3: Deploy dos Componentes
- Novo hook useSubscriptionV2
- Refatorar SubscriptionGuard
- Atualizar todas as páginas gradualmente
- Testes de regressão

### Semana 4: Segurança e Automação
- Firebase Functions para validação server-side
- Firestore Rules mais restritivas
- Reset automático via Cloud Scheduler
- Dashboard de métricas

### Arquitetura Final
```
lib/
├── subscription-config.ts    # Configuração central
├── token-manager.ts          # Gestão de tokens
├── subscription-logger.ts    # Sistema de logs
└── subscription-utils-v2.ts  # Utilitários

hooks/
└── use-subscription-v2.ts    # Hook unificado

components/
└── subscription-guard-v2.tsx # Guarda simplificado

functions/
├── consumeToken.js           # Consumo seguro
└── resetMonthlyTokens.js     # Reset automático
```

### Benefícios
- ✅ Totalmente centralizado
- ✅ Segurança no backend
- ✅ Reset automático
- ✅ Auditoria completa
- ✅ Fácil manutenção

### Riscos
- ⚠️ Mudança muito grande
- ⚠️ Risco de quebrar produção
- ⚠️ Migração complexa
- ⚠️ 4 semanas de desenvolvimento

---

## PLANO B - CORREÇÃO RÁPIDA (1 SEMANA)

### Tarefas Imediatas
1. **Corrigir tokens 15 → 6** em todos os arquivos
2. **Implementar reset manual** no dashboard
3. **Adicionar botão** para professor resetar tokens
4. **Corrigir regras do AVULSO** para ter acesso com token

### Arquivos a Modificar
- `/app/dashboard/plano/page.tsx` - Mostrar 6 correções
- `/components/plan-change-modal.tsx` - Atualizar descrições
- `/app/dashboard/page.tsx` - Dashboard mostrando 6
- `/hooks/use-subscription.ts` - Adicionar lógica de reset

### Benefícios
- ✅ Rápido de implementar
- ✅ Baixo risco
- ✅ Resolve problema imediato

### Riscos
- ⚠️ Não resolve problemas estruturais
- ⚠️ Reset ainda manual
- ⚠️ Segurança continua frágil
- ⚠️ Dívida técnica aumenta

---

## PLANO C - MIGRAÇÃO PROGRESSIVA (RECOMENDADO) 🎯

### Fase 1: Correções Urgentes + Preparação (1 semana)
**Objetivo**: Corrigir bugs sem quebrar nada

1. **Correção Simples dos Tokens**
   - Mudar 15 → 6 em todos os displays
   - NÃO mudar lógica ainda

2. **Criar Camada de Abstração**
   ```typescript
   // lib/subscription-config.ts (NOVO)
   export const PLANS_CONFIG = {
     MESTRE_TOKENS: 6,  // Único lugar para mudar
     // Adicionar outras configs gradualmente
   }
   ```

3. **Reset Manual Inteligente**
   - Adicionar botão no dashboard do aluno
   - "Renovar Tokens Mensais" (aparece só no dia 1º)
   - Log de quando foi resetado

### Fase 2: Centralização Gradual (1 semana)
**Objetivo**: Unificar regras sem quebrar existente

1. **Criar subscription-utils-v2.ts** (paralelo ao atual)
   ```typescript
   // Novo sistema rodando em paralelo
   export function canAccessFeatureV2(subscription, feature) {
     // Nova lógica centralizada
   }
   ```

2. **Migrar uma página por vez**
   - Começar com páginas menos críticas
   - Testar em staging primeiro
   - Rollback fácil se quebrar

3. **Feature Flag para teste**
   ```typescript
   const USE_NEW_SUBSCRIPTION = process.env.NEXT_PUBLIC_USE_NEW_SUB === 'true'
   ```

### Fase 3: Validação Backend (2 semanas)
**Objetivo**: Adicionar segurança gradualmente

1. **Soft Validation**
   - Criar Functions mas não bloquear ainda
   - Apenas logar discrepâncias
   - Monitorar por 1 semana

2. **Hard Validation**
   - Ativar bloqueio após validação
   - Manter fallback para frontend

### Fase 4: Automação (1 semana)
**Objetivo**: Reset automático confiável

1. **Cloud Function agendada**
   - Rodar todo dia 1º
   - Resetar tokens do MESTRE
   - Notificar usuários

2. **Monitoramento**
   - Dashboard de tokens
   - Alertas de falha

### Cronograma Total: 5 semanas (flexível)

| Semana | Fase | Risco | Reversível |
|--------|------|-------|------------|
| 1 | Correções Urgentes | Baixo | ✅ Sim |
| 2 | Centralização | Médio | ✅ Sim |
| 3-4 | Backend | Médio | ✅ Sim |
| 5 | Automação | Baixo | ✅ Sim |

### Vantagens do Plano C
- ✅ **Progressivo**: Implementa aos poucos
- ✅ **Reversível**: Cada fase pode ser revertida
- ✅ **Testável**: Valida em produção gradualmente
- ✅ **Seguro**: Não quebra o que está funcionando
- ✅ **Flexível**: Pode pausar entre fases

### Como Começar

1. **Backup do Firestore** (SEMPRE!)
2. **Branch separada** para cada fase
3. **Deploy em staging** primeiro
4. **Feature flags** para controlar
5. **Monitoramento** constante

### Comandos Úteis
```bash
# Backup antes de começar
firebase firestore:export gs://backup-mestre-redacao/$(date +%Y%m%d)

# Feature flag no .env.local
NEXT_PUBLIC_USE_NEW_SUB=false  # Ativar gradualmente

# Deploy só da correção de tokens
git checkout -b fix/tokens-6-corrections
```

---

## DECISÃO RECOMENDADA

**Seguir Plano C** - Migração Progressiva

Razões:
1. Menor risco para produção
2. Pode parar a qualquer momento
3. Valida cada mudança
4. Aprende com o sistema em produção
5. Reversível se algo quebrar

Começar com Fase 1 (Correções Urgentes) que é essencialmente o Plano B, mas já preparando para evolução futura.