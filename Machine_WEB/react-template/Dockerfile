# Use the official Node.js 22.11 image
FROM node:22.11-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./

# Copy the project files
COPY . .

RUN npm install


# Expose the port used by Vite/React (default 5173)
EXPOSE 5174

# Start the development server
CMD ["npm", "run", "dev" , "--host",]
