# 🌐 Deploy no Render - Passo a Passo

## 1. Criar conta no Render
- Acesse: https://render.com
- Faça login com GitHub

## 2. Criar Web Service
- Clique em "New +"
- Selecione "Web Service"
- Conecte seu repositório GitHub

## 3. Configurações
- Build Command: `npm install`
- Start Command: `node server.js`
- Environment: Node

## 4. Deploy
- O Render fará deploy automaticamente
- Receberá uma URL como: https://seu-projeto.onrender.com

Nota: Na versão gratuita, o servidor hiberna após 15min sem uso.
