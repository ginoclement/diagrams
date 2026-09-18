# Tiny image — no dependencies to install, just the runtime + one source file.
FROM node:22-alpine

WORKDIR /app
COPY package.json server.mjs ./

# Persist scores here; mount a volume at /app/data in production.
ENV DATA_FILE=/app/data/leaderboard.json \
    PORT=8080 \
    ALLOW_ORIGIN=*
RUN mkdir -p /app/data && chown -R node:node /app
USER node

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/health || exit 1
CMD ["node", "server.mjs"]
