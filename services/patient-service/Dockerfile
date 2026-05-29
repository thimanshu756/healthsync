# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy application source code
COPY src ./src

# Stage 2: Production Runtime
FROM node:20-alpine

# Set node environment to production
ENV NODE_ENV production

WORKDIR /usr/src/app

# Copy compiled node_modules and src from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/package.json ./package.json

# Change ownership to the non-root 'node' user built into the node image
RUN chown -R node:node /usr/src/app

# Switch to the non-root user for security
USER node

# Expose the standard port
EXPOSE 8080

# Run the application
CMD ["npm", "start"]
