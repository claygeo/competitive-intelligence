# Competitive Intelligence Dashboard

Real-time competitor inventory tracking and intelligence for the pricing team.

## Features

- **Live Inventory Monitor** - Track MUV and Trulieve inventory levels by category
- **Stock-Out Detection** - Identify when competitors run out of products
- **Depletion Tracking** - Monitor inventory burn rates over time
- **Opportunity Alerts** - See when competitors are low on stock that Curaleaf has

## Setup

### 1. Database Setup

Run the SQL setup script in Supabase SQL Editor:

```bash
# Copy contents of sql/setup.sql and run in Supabase SQL Editor
```

### 2. Environment Variables

Create `.env.local` with your Supabase credentials:

```bash
cp .env.local.example .env.local
# Edit .env.local with your actual values
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

## Integration with Scrapers

After each scraper run, trigger a snapshot by calling:

```bash
curl -X POST https://your-domain/api/snapshot \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-snapshot-api-key" \
  -d '{"dispensary": "muv"}'
```

Or from your scraper code:

```typescript
await fetch('https://your-domain/api/snapshot', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.SNAPSHOT_API_KEY,
  },
  body: JSON.stringify({ dispensary: 'muv' }),
});
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/snapshot` | POST | Trigger inventory snapshot after scrape |
| `/api/inventory` | GET | Get current inventory by dispensary |
| `/api/stock-outs` | GET | Get out-of-stock and low-stock items |
| `/api/depletion` | GET | Get depletion rates from historical data |

## Deployment

### Netlify

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables in Netlify dashboard

### Render

1. Create new Web Service
2. Connect repository
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  Scrapers       │────▶│  /api/snapshot  │
│  (MUV, TRU)     │     │  Creates daily  │
└─────────────────┘     │  snapshots      │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │    Supabase     │
                        │  - snapshots    │
                        │  - products     │
                        │  - alerts       │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   Dashboard     │
                        │  - Inventory    │
                        │  - Stock-outs   │
                        │  - Depletion    │
                        └─────────────────┘
```
