FROM node:18.6.0-buster-slim

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci && mkdir /angular && mv ./node_modules ./angular

WORKDIR /angular
RUN npm install -g @angular/cli

COPY . .
ADD okteto-stack.yaml okteto-stack.yaml
COPY . .

EXPOSE 32333

CMD ["bash", "run.sh"] 