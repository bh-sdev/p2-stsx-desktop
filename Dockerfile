# Stage 1: Build the React application
FROM node:20-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./
# COPY package.docker.json ./package.json
# COPY package-lock.json ./package-lock.json

# Install dependencies
ENV CI=true
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN npm cache clear --force
RUN npm config set strict-ssl false && npm install  --no-audit
# RUN npm audit fix --force
# RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React application
RUN npm run build

# Stage 2: Serve the React application using Nginx
FROM nginx:alpine

# Copy the built React application from the previous stage
COPY --from=build /app/build /usr/share/nginx/html/desktop

# Expose port 80
# EXPOSE 3000

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
