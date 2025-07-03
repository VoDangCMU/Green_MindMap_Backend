FROM node:18-alpine AS builder

WORKDIR /home/node/app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build


FROM node:18-alpine AS runtime

WORKDIR /home/node/app

RUN apk add --no-cache \
    bash \
    ca-certificates \
    curl \
    && curl -L https://github.com/golang-migrate/migrate/releases/download/v4.18.3/migrate.linux-amd64.tar.gz \
    | tar xvz -C /tmp \
    && mv /tmp/migrate /usr/local/bin/migrate \
    && chmod +x /usr/local/bin/migrate

COPY --from=builder /home/node/app/dist ./dist
COPY --from=builder /home/node/app/package.json ./
COPY --from=builder /home/node/app/yarn.lock ./
COPY migrations ./migrations
COPY entrypoint.sh .

RUN chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
