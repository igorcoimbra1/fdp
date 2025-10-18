# 🎮 FDP Server - Comandos Rápidos

## 🚀 **Iniciar o Servidor**

### Opção 1: Script automático (recomendado)
```bash
./start-server.sh
```

### Opção 2: NPM
```bash
npm run restart
```

### Opção 3: Manual
```bash
node server.js
```

## 🛑 **Parar o Servidor**

```bash
npm run stop
```

ou

```bash
pkill -f "node server.js"
```

## 🔄 **Reiniciar (se der erro de porta)**

```bash
# Matar processos na porta 3000
lsof -ti:3000 | xargs kill -9

# Iniciar novamente
node server.js
```

## 🌐 **Acessar o Jogo**

- **Multiplayer:** http://localhost:3000
- **Offline:** http://localhost:3000/offline

## ❗ **Problemas Comuns**

### Erro: "address already in use :::3000"
```bash
# Matar processo na porta 3000
lsof -ti:3000 | xargs kill -9

# Ou usar o script
./start-server.sh
```

### Verificar se a porta está livre
```bash
ss -tlnp | grep :3000
```

## 📦 **Scripts Disponíveis**

- `npm start` - Iniciar servidor simples
- `npm run dev` - Iniciar com nodemon (auto-restart)
- `npm run restart` - Parar processos antigos e iniciar
- `npm run stop` - Parar servidor

---
**O servidor estará disponível em http://localhost:3000** 🎯
