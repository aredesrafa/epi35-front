# 🚨 CONFIGURAÇÃO CORS OBRIGATÓRIA NO BACKEND

## Problema Identificado

O backend em `https://epi-backend-s14g.onrender.com` **NÃO** está retornando o header `Access-Control-Allow-Origin`, que é obrigatório para o CORS funcionar.

## Teste Realizado

```bash
curl -I -X OPTIONS https://epi-backend-s14g.onrender.com/api/fichas-epi \
  -H "Origin: http://localhost:5175" \
  -H "Access-Control-Request-Method: GET"
```

**Headers retornados:**
- ✅ `access-control-allow-credentials: true`
- ✅ `access-control-allow-headers: Content-Type,Authorization,Accept,X-Requested-With`
- ✅ `access-control-allow-methods: GET,POST,PUT,DELETE,PATCH,OPTIONS`
- ❌ **FALTANDO**: `Access-Control-Allow-Origin`

## ⚠️ Configuração Obrigatória no Backend (NestJS)

### 1. main.ts - Configuração Global

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ✅ CONFIGURAÇÃO CORS OBRIGATÓRIA
  app.enableCors({
    origin: [
      'http://localhost:5175',
      'http://localhost:5176', 
      'http://localhost:5177',
      'http://localhost:3000',
      // Adicionar domínio de produção quando houver
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  });

  // Global prefix
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();
```

### 2. Alternativa - Middleware CORS

Se a configuração acima não funcionar, adicionar middleware:

```typescript
// app.module.ts ou main.ts
import * as cors from 'cors';

// No main.ts, antes de app.listen():
app.use(cors({
  origin: [
    'http://localhost:5175',
    'http://localhost:5176', 
    'http://localhost:5177'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
}));
```

### 3. Verificação Após Deploy

Após fazer a configuração e dar deploy, testar:

```bash
curl -I -X OPTIONS https://epi-backend-s14g.onrender.com/api/fichas-epi \
  -H "Origin: http://localhost:5175"
```

**Deve retornar:**
```
Access-Control-Allow-Origin: http://localhost:5175
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization,Accept,X-Requested-With
```

### 4. Variáveis de Ambiente (Opcional)

Para flexibilidade, usar variáveis de ambiente:

```typescript
// main.ts
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5175', 'http://localhost:5176'];

app.enableCors({
  origin: allowedOrigins,
  credentials: true,
  // ... resto da configuração
});
```

## 🚨 CRÍTICO

**SEM o header `Access-Control-Allow-Origin`, o frontend NUNCA vai conseguir se comunicar com o backend.**

Esse é um bloqueio total - todos os endpoints retornarão erro CORS até essa configuração ser feita.

## Status Atual

- ❌ **CORS não configurado** no backend
- ❌ **Frontend não consegue** fazer chamadas de API
- ❌ **Todas as funcionalidades** estão bloqueadas

## Próximo Passo

1. **Aplicar a configuração CORS** no backend NestJS
2. **Fazer deploy** da mudança
3. **Testar** com curl para verificar se o header está presente
4. **Testar** o frontend novamente