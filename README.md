# Prophecy Esports Bot

Discord bot for Prophecy Esports — scrim announcements, tournament updates, event reminders, and membership role sync, all driven by the WordPress site.

## Prerequisites

- Node.js 18 or later
- A Discord application with a bot token ([discord.com/developers](https://discord.com/developers/applications))
- The Prophecy Esports WordPress site with the `pcy/v1` REST API endpoints active

---

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill in environment variables
cp .env.example .env

# 3. Start the bot
npm start

# Development (auto-restarts on file changes — Node 18+)
npm run dev
```

---

## Environment Variables

| Variable         | Description |
|-----------------|-------------|
| `BOT_TOKEN`      | Your bot token from the Discord Developer Portal |
| `BOT_API_SECRET` | Shared secret used to authenticate WordPress webhook calls |
| `WP_API_URL`     | WordPress REST API base URL (default: `https://prophecyesports.com/wp-json/pcy/v1`) |
| `GUILD_ID`       | Your Discord server ID |
| `CLIENT_ID`      | Your Discord application (bot) client ID |
| `PORT`           | Express webhook server port (default: `3000`) |

---

## How to Get Each Value

### BOT_TOKEN
1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Select your application → **Bot** tab
3. Click **Reset Token** (or view existing) → copy the token

### GUILD_ID
1. Open Discord → **User Settings → Advanced → Enable Developer Mode**
2. Right-click your server name → **Copy Server ID**

### CLIENT_ID
1. Go to your application in the Discord Developer Portal
2. **OAuth2** tab → copy **Client ID** from the top

---

## Invite the Bot

1. In the Developer Portal → **OAuth2 → URL Generator**
2. Select scopes: `bot`, `applications.commands`
3. Select permissions:
   - Manage Roles
   - Send Messages
   - Embed Links
   - Read Message History
   - View Channels
4. Copy and open the generated URL to invite the bot

---

## First-Time Discord Setup

After the bot joins your server, run these slash commands to configure notification channels:

```
/setup channel type:scrims      channel:#scrims
/setup channel type:events      channel:#events
/setup channel type:tournaments channel:#tournaments
/setup channel type:default     channel:#prophecy-announcements

/setup remind type:scrims      timing:1hour
/setup remind type:events      timing:30min
/setup remind type:tournaments timing:1day
```

---

## Slash Commands

| Command              | Description |
|----------------------|-------------|
| `/ping`              | Check bot status |
| `/scrim list`        | Show upcoming accepted scrims |
| `/tournament list`   | Show active and upcoming tournaments |
| `/setup channel`     | Set the Discord channel for a notification type |
| `/setup remind`      | Set the reminder window for a notification type |
| `/setup toggle`      | Enable or disable a notification type |

> `/setup` is restricted to members with **Manage Server** permission or a Discord role listed in the WordPress bot manager roles setting.

---

## WordPress Webhook Endpoints

The bot's Express server receives POST requests from WordPress at:

| Endpoint               | Triggered by |
|------------------------|--------------|
| `POST /webhook/scrim`       | Scrim status changes (requested / accepted / completed) |
| `POST /webhook/tournament`  | Tournament events (open / bracket / result / champion) |
| `POST /webhook/membership`  | Membership tier changes (add / remove roles) |
| `POST /webhook/config`      | WordPress sync button — reloads bot config |

All webhook requests must include:
```
Authorization: Bearer <BOT_API_SECRET>
```

### WordPress Bot Config Sync Button

In the Prophecy admin panel under **Site Controls**, clicking **Sync Bot Config** sends a POST to `/webhook/config`. The bot immediately re-fetches its config from `/wp-json/pcy/v1/bot-config` so channel/timing changes apply without restarting.

---

## Deploy to Railway

1. Push this folder to a GitHub repository
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub Repo**
3. Select the repo
4. In **Variables**, add all values from your `.env`
5. Click **Deploy** — Railway runs `npm start` automatically
6. Copy your Railway public URL → use it as the WordPress webhook base URL

> Railway gives each deploy a public HTTPS URL. Set that as the webhook base in the WordPress admin panel so `/webhook/scrim`, `/webhook/tournament` etc. are reachable.

---

## Scheduled Tasks

| Task                 | Schedule      | What it does |
|----------------------|---------------|--------------|
| Scrim reminders      | Every 5 min   | Checks accepted scrims; fires reminder based on config timing |
| Event reminders      | Every 5 min   | Checks upcoming events; fires reminder based on config timing |
| Tournament reminders | Every 30 min  | Checks registration-open tournaments; fires window reminder |

Duplicate reminders are suppressed in-memory using a `Set` keyed on `{id}-{timing}`.

---

## Multi-Server Support

The current build targets a single guild (set via `GUILD_ID`). For managing multiple Discord servers from the Prophecy admin panel, see the per-server config feature described in the site admin — each server's GUILD_ID and channel preferences are stored separately in WordPress and the admin panel only shows bot controls when a connected server exists.
