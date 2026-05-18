FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install

COPY prisma ./prisma
COPY prisma.config.ts .

RUN bunx prisma generate

COPY tsconfig.json .
COPY tsconfig.build.json .
COPY nest-cli.json .

COPY src ./src

RUN bun run build


FROM oven/bun:1

WORKDIR /app

COPY russian_trusted_root_ca_pem.crt ./russian_trusted_root_ca_pem.crt

ENV NODE_EXTRA_CA_CERTS=/app/russian_trusted_root_ca_pem.crt

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

CMD ["bun", "run", "start:prod"]