# ==============================================================================
# 1. ETAPA DE BUILD (Aqui chamamos de "builder")
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Instala ferramentas pro Alpine conseguir compilar dependências do Node
RUN apk add --no-cache python3 make g++

# Copia os arquivos de pacotes primeiro (Melhora o cache)
COPY package.json yarn.lock ./

# Instala todas as dependências (incluindo as de desenvolvimento)
RUN yarn install --frozen-lockfile

# Copia todo o resto do seu código
COPY . .

# Faz o build (Isso deve gerar a pasta /app/dist)
RUN yarn build

# Limpa o lixo e deixa apenas as dependências de produção para economizar espaço
RUN rm -rf node_modules && \
    yarn install && \
    yarn cache clean

# ==============================================================================
# 2. ETAPA DE PRODUÇÃO (Aqui montamos a imagem final leve e segura)
# ==============================================================================
FROM node:22-alpine AS production

WORKDIR /app

# Dependências nativas e fuso horário
RUN apk add --no-cache ffmpeg tzdata
ENV TZ=America/Cuiaba \
    NODE_ENV=production \
    FFMPEG_PATH=/usr/bin/ffmpeg

# IMPORTANTE: Aqui ele vai buscar os arquivos da etapa "builder" lá de cima!
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./package.json

# Se o erro do /dist persistir, é porque o 'yarn build' não está criando a pasta dist
COPY --from=builder --chown=node:node /app/dist ./dist

# Se você não usa essas pastas (statics, views, html), PODE APAGAR essas 3 linhas abaixo!
COPY --from=builder --chown=node:node /app/statics ./statics 
COPY --from=builder --chown=node:node /app/views ./views
COPY --from=builder --chown=node:node /app/html ./html

# Copia o script de inicialização
COPY --chown=node:node start.sh ./

# Dá permissão para executar
RUN chmod +x start.sh

# Troca para o usuário seguro (não-root)
USER node

EXPOSE 3000

# Executa o seu script start.sh
CMD ["./start.sh"]