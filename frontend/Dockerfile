# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
# Copy the entrypoint script for dynamic env injection
COPY docker-entrypoint.sh /usr/share/nginx/html/
COPY env.template.js /usr/share/nginx/html/

# Set execute permissions on the entrypoint script
RUN chmod +x /usr/share/nginx/html/docker-entrypoint.sh

# Run the entrypoint script on container start
ENTRYPOINT ["/usr/share/nginx/html/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"] 