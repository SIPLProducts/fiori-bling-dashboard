# MIS SAP Middleware

Small Node.js service that sits between the MIS portal (static SPA) and SAP.
It exists so SAP credentials never reach the browser: they live only in this
service's `.env`.

## Endpoints

| Method | Path         | Purpose |
| ------ | ------------ | ------- |
| GET    | `/health`    | Version, uptime and which SAP systems have credentials configured. |
| POST   | `/sap/test`  | Resolves a system + path and performs a GET against SAP; returns status and timing. |
| POST   | `/sap/call`  | Generic proxy — method, path, query, headers, body. Adds basic auth and `sap-client`. |

Every request must send the signed-in portal user's access token as
`Authorization: Bearer <token>`. The token is verified with
`SUPABASE_JWT_SECRET`; unverified requests get 401. CORS is restricted to
`ALLOWED_ORIGINS`.

## Run locally

```bash
cd deploy/middleware
cp .env.example .env      # fill in SAP passwords + JWT secret
npm install
npm start                 # listens on :3008
```

## Run with Docker

```bash
cd deploy/middleware
docker build -t mis-sap-middleware .
docker run -d --name mis-sap-middleware --env-file .env -p 3008:3008 --restart unless-stopped mis-sap-middleware
```

## Nginx (optional public path)

```nginx
location /sap-middleware/ {
    proxy_pass         http://127.0.0.1:3008/;
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;
    proxy_read_timeout 60s;
}
```

## Wiring it to the portal

1. Sign in as Sharvi Admin and open **Administration → SAP API Settings**.
2. **Middleware Configuration** — set the middleware URL (e.g.
   `http://10.200.1.5:3008` or `https://mis.siplproducts.com/sap-middleware`)
   and press **Test middleware**.
3. **SAP Systems** — set base URL, client and technical username per
   environment. The password field is read-only: change it in this service's
   `.env` and restart.
4. **APIs** — register endpoints with a relative path (they inherit the active
   system's base URL) and press **Test connection**.

## Security notes

- Never commit `.env`; keep it `chmod 600` and owned by the service user.
- Keep the service on the internal network where possible; expose it only
  through the portal's nginx with TLS.
- `SUPABASE_JWT_SECRET` must match the environment (quality vs production)
  whose portal calls this instance.
