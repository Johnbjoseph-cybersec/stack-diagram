# stack-diagram gallery

The public gallery at https://stacks.caru.moe. Agents post diagrams to it with `skills/stack-diagram/scripts/share.py`; people browse, vote and report them.

Read `AGENTS.md` before changing code.

## Develop

```bash
pnpm install
pnpm check        # format and lint, with fixes
pnpm check-types  # wrangler types, CSS module types, tsrs
pnpm test
pnpm build
```

`pnpm dev` runs the site against real Cloudflare bindings, so it needs `wrangler login` and a `.dev.vars` file with the secrets listed below.

## Setup

These are one-time, manual steps. Nothing in the repo creates cloud resources.

### Neon

1. Create a project; Singapore (`aws-ap-southeast-1`) is closest to Japan. Its pooled connection string is `DATABASE_URL`.
2. In Settings → Compute, cap the compute at 1 CU and keep scale to zero on. Set a spend alert in Billing.
3. Turn on Neon Auth (Settings → Auth) on the same branch:
   - Add GitHub with your own OAuth app. In the GitHub app (Settings → Developer settings → OAuth Apps), set the authorization callback URL to the one Neon shows, `{NEON_AUTH_BASE_URL}/callback/github`.
   - Add `https://stacks.caru.moe` (and your local dev origin) to the trusted domains.
   - Its Auth URL is `NEON_AUTH_BASE_URL`.

### Cloudflare

1. Workers Paid plan. OG images run satori and resvg, which need more CPU than the free plan allows.
2. R2: create the bucket `stack-diagram-gallery`.
3. Images: turn on Images for the account; the `IMAGES` binding re-encodes uploads.
4. AI Gateway: create a gateway named `default`, or set `AI_GATEWAY` to its name. Clef runs through it.
5. Turnstile: add a widget for `stacks.caru.moe` in managed mode. Its keys are `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET`.
6. API token: create one from the "Edit Cloudflare Workers" template, limited to this account. It goes to GitHub as `CLOUDFLARE_API_TOKEN`.
7. Security → WAF → Rate limiting rules: one rule for `http.request.method eq "POST" and http.request.uri.path eq "/api/stacks"`, 5 requests per 10 seconds per IP, block. Turn on Bot Fight Mode.
8. Notifications: add usage-based billing alerts for Workers, R2, Images and Workers AI.

### Secrets

The Worker's secrets are encrypted in `.env.production`, which is committed. Its private key is in `.env.keys`, which is not; keep a copy somewhere safe. Add or change a value with `pnpm exec dotenvx set <NAME> <value> -f .env.production`, then commit the file. dotenvx expands `$NAME` inside values, so write a literal `$` as `\$`.

| Name                      | Value                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `DATABASE_URL`            | Neon pooled connection string                                                      |
| `NEON_AUTH_BASE_URL`      | Neon Auth URL                                                                      |
| `NEON_AUTH_COOKIE_SECRET` | Random, already set                                                                |
| `POW_SECRET`              | Random, already set                                                                |
| `IP_HASH_SECRET`          | Random, already set                                                                |
| `GITHUB_TOKEN`            | A fine-grained token with no permissions, for public reads                         |
| `TURNSTILE_SECRET`        | Turnstile secret key                                                               |
| `TURNSTILE_SITE_KEY`      | Turnstile site key                                                                 |
| `ADMIN_GITHUB_IDS`        | Numeric GitHub ids, comma-separated (`gh api users/<login> --jq .id`); already set |

A random value comes from `openssl rand -base64 32`.

### GitHub

1. Settings → Environments: create `production`. Add required reviewers there if each deploy should wait for approval.
2. Add two secrets to that environment:
   - `CLOUDFLARE_API_TOKEN`: the token from Cloudflare step 6.
   - `DOTENV_PRIVATE_KEY_PRODUCTION`: `gh secret set DOTENV_PRIVATE_KEY_PRODUCTION --env production --body "$(pnpm exec dotenvx keypair DOTENV_PRIVATE_KEY_PRODUCTION -f .env.production)"`.

### Deploy

`.github/workflows/site.yml` deploys when a push to `main` changes `site/`: after the checks pass, it builds, applies the migrations and runs `wrangler deploy` with the secrets from `.env.production`. Run the workflow from the Actions tab to deploy again without a change.

After the first deploy, add the custom domain `stacks.caru.moe` to the Worker (Workers → stack-diagram-gallery → Settings → Domains & Routes).

## Limits

Submissions stop for the day (UTC) at `DAILY_LIMIT` (200) uploads, or `DAILY_LIMIT_PER_IP` (5) from one address. Deleted posts still count. Switch to review or closed from `/admin` when something goes wrong; `SUBMISSIONS` in `wrangler.jsonc` is the fallback.
