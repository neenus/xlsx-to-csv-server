FROM node:lts-alpine

# Set node environment to production
ENV NODE_ENV=production

ADD --chown=node:node . /server
WORKDIR /server

COPY package*.json ./
RUN npm ci omit=development && npm cache clean --force
RUN npm install pm2 -g

EXPOSE 8000
COPY --chown=node:node ./ ./

USER node
CMD ["npm", "start"]