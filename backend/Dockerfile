# Start with Node.js 20 already installed
FROM node:20-alpine

# Set /app as the main working folder
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend application
COPY . .

# The backend listens on port 3000
EXPOSE 3000

# Start the TypeScript server
CMD ["npx", "tsx", "src/server.ts"]