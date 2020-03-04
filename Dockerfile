# Use the official Node.js 10 image.
FROM node:10.19.0-alpine

# Setting working directory. All the path will be relative to WORKDIR
WORKDIR /usr/src/app

# Installing dependencies
COPY package.json package*.json ./
RUN npm install --only=production

# Copy local code to the container image.
COPY . .

# Building app
RUN npm run build

# Run the web service on container startup.
CMD [ "npm", "start" ]
