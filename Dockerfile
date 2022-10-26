# Dockerfile
FROM node:18.7.0 AS build

WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "yarn.lock", "./"]
RUN yarn
COPY . .

RUN yarn build

EXPOSE 3000
CMD ["node", "build"]
