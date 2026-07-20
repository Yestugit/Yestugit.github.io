# Site metrics Worker

This Worker stores the site's likes and homepage view sessions in Cloudflare D1.

## First deployment

1. Authenticate without sharing account credentials:

   ```powershell
   pnpm wrangler login
   ```

2. Create the production database and let Wrangler add the `DB` binding to `wrangler.jsonc`:

   ```powershell
   pnpm wrangler d1 create yestugit-site-metrics --binding DB --update-config --location apac --config counter-worker/wrangler.jsonc
   ```

3. Apply the schema and deploy:

   ```powershell
   pnpm counter:migrate
   pnpm counter:deploy
   ```

4. Copy the deployed `workers.dev` URL into `siteMetricsConfig.apiBaseUrl` in `src/config.ts`, then rebuild and publish the Astro site.

## Local development

After the `DB` binding exists in `wrangler.jsonc`:

```powershell
pnpm counter:migrate:local
pnpm counter:dev
```
