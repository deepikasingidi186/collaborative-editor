# Use official Node image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy app package files
COPY app/package*.json ./ 

# Install dependencies
RUN npm install

# Copy application source
COPY app .

# Expose port
EXPOSE 8080

# Start server
CMD ["npm", "start"]