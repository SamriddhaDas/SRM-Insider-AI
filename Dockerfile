FROM node:20-alpine

WORKDIR /app

# Copy root package.json (has all backend deps)
COPY package.json ./

# Copy frontend package files
COPY frontend/package.json ./frontend/

# Install backend deps (from root package.json)
RUN npm install

# Install frontend deps
RUN npm install --prefix frontend

# Copy all source files
COPY . .

# Build React frontend
RUN npm run build

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "backend/server.js"]
