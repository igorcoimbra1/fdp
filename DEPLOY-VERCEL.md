# ⚡ Deploy no Vercel - Configuração

## 1. Instalar Vercel CLI
```bash
npm i -g vercel
```

## 2. Fazer login
```bash
vercel login
```

## 3. Deploy
```bash
vercel
```

## 4. Configurar vercel.json
Criar arquivo `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

Nota: Socket.IO pode ter limitações no Vercel.
