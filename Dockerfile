FROM --platform=linux/amd64 node:slim

ARG NPM_TOKEN

# Set node environment to production
ENV NODE_ENV=production

WORKDIR /server

COPY package*.json .npmrc ./
RUN npm ci --omit=dev && npm cache clean --force && rm -f .npmrc
RUN npm install pm2 -g

EXPOSE 1337
COPY --chown=node:node ./ ./

USER node
CMD ["npm", "start"]
