FROM node:18-alpine AS builder-stage
WORKDIR /app

COPY ./package.json ./
RUN yarn install

COPY . .

RUN yarn build


FROM node:18-alpine AS runtime-stage
WORKDIR /app

COPY --from=builder-stage /app ./
CMD [ "yarn", "start:prod" ]


