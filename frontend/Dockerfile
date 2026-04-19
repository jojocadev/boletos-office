# Estágio 1: Build
FROM node:20-slim AS build
WORKDIR /app

# Adiciona argumentos de build para injetar variáveis no Vite
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio 2: Servir o site
FROM flashspys/nginx-static
COPY --from=build /app/dist /static
EXPOSE 80
