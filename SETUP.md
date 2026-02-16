# OctoTRMNL - Quick Setup Guide

Follow these steps to get OctoTRMNL up and running.

## Prerequisites Checklist

- [ ] Octopus Energy account with smart meters
- [ ] Octopus Energy API key
- [ ] Cloudflare account (free)
- [ ] TRMNL device or Developer Add-on
- [ ] Node.js installed (v18+)
- [ ] Wrangler CLI installed: `npm install -g wrangler`

## Step-by-Step Setup

### 1. Get Octopus Energy API Credentials

```bash
# Get your account details via API
curl -u "YOUR_API_KEY:" https://api.octopus.energy/v1/accounts/YOUR_ACCOUNT_NUMBER/
```

Save these values:
- API Key: `sk_live_...`
- MPAN: `1234567890123` (electricity)
- MPRN: `1234567890` (gas)
- Electricity Serial: `AB12C34567`
- Gas Serial: `CD34E56789`
- Electricity Product: `AGILE-FLEX-22-11-25`
- Electricity Tariff: `E-1R-AGILE-FLEX-22-11-25-M`
- Gas Product: `VAR-22-11-01`
- Gas Tariff: `G-1R-VAR-22-11-01-M`

### 2. Install Dependencies

```bash
cd octotrmnl
npm install
```

### 3. Deploy to Cloudflare

```bash
# Login to Cloudflare
wrangler login

# Create KV namespace with project-specific name
wrangler kv namespace create OCTOPUS_CACHE

# Update wrangler.toml with KV namespace ID
# (Copy the ID from the command output)
```

Edit `wrangler.toml` and:
1. Replace `YOUR_KV_NAMESPACE_ID` with the actual namespace ID
2. Update tariff codes under `[vars]`

### 4. Configure Secrets

```bash
wrangler secret put OCTOPUS_API_KEY
wrangler secret put MPAN
wrangler secret put MPRN
wrangler secret put ELECTRICITY_SERIAL
wrangler secret put GAS_SERIAL
wrangler secret put ACCOUNT_NUMBER
```

### 5. Deploy Worker

```bash
wrangler deploy
```

Save your Worker URL: `https://octotrmnl.YOUR-SUBDOMAIN.workers.dev`

### 6. Test Worker

```bash
curl https://octotrmnl.YOUR-SUBDOMAIN.workers.dev
```

Expected response:
```json
{
  "electricity": {
    "kwh": 245.3,
    "cost_gbp": 61.22,
    ...
  },
  "gas": { ... },
  "carbon_forecast": [ ... ],
  "carbon_summary": { ... }
}
```

### 7. Set Up TRMNL Plugin

1. Go to https://trmnl.com/plugins/my/new
2. Create a new Private Plugin:
   - **Name**: Octopus Energy Monitor
   - **Strategy**: Polling
   - **URL**: Your Worker URL
   - **Interval**: 180 minutes
3. Upload `trmnl-plugin/plugin.liquid`
4. Save plugin

### 8. Add to TRMNL Device

1. Go to your TRMNL dashboard
2. Add the plugin to your device
3. Select **Full Screen** viewport
4. Set refresh interval: 3-4 hours
5. Trigger manual refresh

Done! 🎉

## Verify Everything Works

- [ ] Worker returns valid JSON when accessed directly
- [ ] Electricity kWh and cost are displayed
- [ ] Gas kWh and cost are displayed
- [ ] Carbon forecast shows 48 periods
- [ ] Green percentage is calculated
- [ ] TRMNL device displays the data correctly

## Common Issues

**"Unauthorized" error from Octopus API**:
- Check API key is correct
- Verify account number matches

**"Not Found" error**:
- Verify MPAN/MPRN numbers are correct
- Check meter serial numbers

**No data on TRMNL**:
- Verify Worker URL in TRMNL settings
- Check Worker is accessible from browser
- Review TRMNL plugin logs

**Costs seem wrong**:
- Verify tariff codes in `wrangler.toml`
- Check standing charges for your region

## Next Steps

- Customize the layout in `plugin.liquid`
- Adjust refresh interval in TRMNL settings
- Add more features (see README.md)
- Monitor Cloudflare analytics for usage

## Need Help?

See full documentation in README.md or contact support.
