# Stage 1: Build the Vue application
FROM node:20-alpine AS build-stage

# Set working directory
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies (ignoring optional/dev-only postinstall scripts if any)
RUN npm install

# Copy project files and folders to the current working directory (i.e. 'app' folder)
COPY . .

# Build the app for production to the 'dist' folder
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine AS production-stage

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy from the build stage the compiled 'dist' artifacts to nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Overwrite default nginx config with our custom one to resolve Vue Router history mode
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to the outside world
EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
