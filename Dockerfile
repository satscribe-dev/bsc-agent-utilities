FROM node:24-alpine
WORKDIR /app
COPY api.mjs server.mjs openapi.json package.json ./
ENV PORT=8787
EXPOSE 8787
CMD ["node", "server.mjs"]
