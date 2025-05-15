#!/bin/bash

# Usa Node 20
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20

# Limpa builds anteriores
rm -rf .next
rm -rf out
rm -rf .firebase

# Instala dependências
pnpm install

# Faz build do Next.js
NODE_ENV=production pnpm run build

# Verifica se o build foi bem sucedido
if [ $? -eq 0 ]; then
    echo "Build concluído com sucesso!"
    
    # Deploy no Firebase
    firebase deploy --only hosting
    
    # Verifica se o deploy foi bem sucedido
    if [ $? -eq 0 ]; then
        echo "Deploy concluído com sucesso!"
    else
        echo "Erro no deploy!"
        exit 1
    fi
else
    echo "Erro no build!"
    exit 1
fi 