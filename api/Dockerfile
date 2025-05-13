FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Install nodemon globally for development
RUN npm install -g nodemon

# Copy all other files
COPY . .

# Expose port
EXPOSE 3000

# Start command using nodemon
CMD ["nodemon", "index.js"]