# LifeSort Capacitor iOS Notes

LifeSort is currently configured as an iOS-only Capacitor shell with:

- App name: `LifeSort`
- Bundle ID: `com.kreativvantage.lifesort`
- Native platform: `ios`
- Hosted web app: `https://lifesort.vercel.app`
- Fallback web assets: `capacitor-www`

The hosted URL is intentional for this first iOS milestone because the Next.js app depends on API routes, server cookies, Neon, Resend, Google OAuth, cron routes, and AI streaming. The app is not currently safe to ship as a pure `output: "export"` static bundle.

Useful commands:

```bash
npx -y pnpm@10 run build
npx -y pnpm@10 run ios:add
npx -y pnpm@10 run ios:sync
npx -y pnpm@10 run ios:open
```

Before App Store submission, revisit whether the app should keep loading the hosted Vercel URL or move toward a static exported frontend that calls absolute remote APIs.
