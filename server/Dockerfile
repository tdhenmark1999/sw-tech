FROM node:22-slim

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY . .

EXPOSE 1337

CMD ["npm", "start"]