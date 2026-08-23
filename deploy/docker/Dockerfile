# MIS Portal — TanStack Start runtime image
# This image expects the built app to be mounted at /app/dist at runtime.
# Build locally first: npm run build (creates .output/), then copy .output/* to
# Quality/frontend/dist/ or Production/frontend/dist/ on the server.

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nodejs -G nodejs

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server/index.mjs"]
