FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY src/package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY src/ ./

# Expose the API port
EXPOSE 3000

# Run the application
CMD ["node", "index.js"]
