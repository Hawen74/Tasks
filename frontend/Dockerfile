# Stage 1: Build the React application
FROM node:20-alpine AS build

# Set /app as the main working folder
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend application
COPY . .

# Build the React application
RUN npm run build


# Stage 2: Serve the built React application
FROM nginx:alpine

# Copy the React build into Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx listens on port 80
EXPOSE 80