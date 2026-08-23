# Supabase Studio (dashboard) — username and password

Self-hosted Supabase Studio does **not** have its own login system. There is no built-in Studio username or password.

## How Studio connects

Studio reaches the database through the `meta` container, which connects as the `supabase_admin` Postgres user. The only password it needs is already in your `.env`:

```
POSTGRES_PASSWORD=37452b25853097e95ac863ec892ad82fa07dea1367e65b85
```

So when you open `http://10.10.4.165/studio/`, you go straight into the dashboard — no login screen.

## What you actually need to protect

Because there is no login, you must protect the `/studio/` path in Nginx. The recommended way is HTTP basic auth:

```bash
# Install htpasswd if not already installed
sudo apt update && sudo apt install -y apache2-utils

# Create a password file (change misadmin / choose a strong password)
sudo htpasswd -c /etc/nginx/.mis-studio misadmin

# Add more users later without -c
sudo htpasswd /etc/nginx/.mis-studio anotheruser
```

Then add this inside the `/studio/` location block in `deploy/nginx/mis-quality.conf` and `mis-production.conf`:

```nginx
location /studio/ {
    proxy_pass http://mis_q_studio/;

    # Optional: restrict to office network
    # allow 10.0.0.0/8;
    # deny all;

    auth_basic "MIS Studio";
    auth_basic_user_file /etc/nginx/.mis-studio;
}
```

Reload Nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## Summary

- Studio URL: `http://10.10.4.165/studio/` (Quality)
- There is **no Supabase Studio username/password**.
- The database password is `POSTGRES_PASSWORD` in `.env`.
- Protect Studio at the Nginx level with basic auth, because anyone who can reach `/studio/` can access it.
