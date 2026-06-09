FROM node:20-slim
WORKDIR /app
# Prisma needs OpenSSL at runtime; Debian slim images don't include it by default
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate && npm run build
EXPOSE 4000
CMD ["sh","-c","npx prisma migrate deploy && node dist/main"]