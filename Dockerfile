FROM node:20-slim

# Install git and openssl for dependencies
RUN apt-get update && apt-get install -y git openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files from chatbot-api-node
COPY chatbot-api-node/package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the backend files
COPY chatbot-api-node/ ./

# Copy textbook docs so the chatbot can read the book context
WORKDIR /
COPY textbook/docs /textbook/docs

# Return to backend working directory
WORKDIR /app

# Set port to 7860 (Hugging Face default)
EXPOSE 7860
ENV PORT=7860

CMD ["node", "index.js"]
