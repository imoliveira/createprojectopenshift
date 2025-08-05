# Usa a imagem oficial do Node.js como base
FROM node:lts-jod

# Define o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copia os arquivos de dependência e instala
COPY package*.json ./
RUN npm install

# Copia o restante do código da sua aplicação
COPY . .

# Expõe a porta que a aplicação irá usar (ex: 3000)
EXPOSE 3000

# Define o comando padrão para iniciar a aplicação
CMD [ "node", "app.js" ]

