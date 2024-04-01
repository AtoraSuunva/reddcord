# Reddcord

Reddit on discord? Surely you jest!

r/Undertale 2024 April Fool's

The way the DB is designed you can only have 1 (and only 1) "account" per discord user so you can't have per-guild "reddcord accounts" but this is a feature rather than a bug ;)

## Support & Selfhosting

This was only meant to be run once for a few days, good luck! Though the instructions on how to selfhost my other bots is likely valid (or somewhat valid) in getting this to run.

### .env

```ini
NODE_ENV=development
TOKEN=<token>
APPLICATION_ID=<app id>
USE_PINO_PRETTY=true
DATABASE_URL="file:./db/dev.sqlite"
```

### Terminal

```sh
# development
pnpm i
pnpx prisma db push
pnpx prisma db seed
pnpm start:dev
```
