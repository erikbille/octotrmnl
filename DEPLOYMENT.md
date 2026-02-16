# OctoTRMNL - Plugin Deployment Guide

This guide explains how to deploy the OctoTRMNL plugin to your TRMNL device.

## Prerequisites

✅ Cloudflare Worker deployed and working at: `https://octotrmnl.YOUR-SUBDOMAIN.workers.dev`
✅ TRMNL account with device

> **Note:** Replace `YOUR-SUBDOMAIN` with your Cloudflare Workers subdomain from your deployment (e.g., if you chose "myname" during `wrangler deploy`, your URL would be `https://octotrmnl.myname.workers.dev`)

## Quick Deployment

### 1. Download the Plugin ZIP

The plugin ZIP file has already been created: `octotrmnl-plugin.zip`

### 2. Import to TRMNL

1. Go to https://trmnl.com/plugins/my
2. Click **"Import new"** button
3. Upload `octotrmnl-plugin.zip`
4. The plugin will be automatically created and added to your playlist

### 3. Add to Your Device

1. In your TRMNL dashboard, find the "Octopus Energy Monitor" plugin
2. Add it to your device's playlist
3. Select **Full Screen** viewport
4. Save and trigger a manual refresh

That's it! Your TRMNL device will now show your energy data.

## What's Included in the Plugin

The ZIP file contains:

- **settings.yml** - Plugin configuration
  - Name: "Octopus Energy Monitor"
  - Strategy: Polling
  - URL: `https://octotrmnl.YOUR-SUBDOMAIN.workers.dev`
  - Refresh interval: 180 minutes (3 hours)

- **full.liquid** - Full-screen layout template
  - Monthly electricity and gas usage (kWh + £)
  - Daily average and peak usage time
  - Carbon intensity forecast (24-hour bar chart)
  - Green energy summary (% green, best time window)

## Local Testing (Optional)

If you want to preview the plugin locally before deploying:

```bash
# Install TRMNLP (requires Ruby)
gem install trmnlp

# Navigate to plugin directory
cd octotrmnl/trmnl-plugin

# Start local development server
trmnlp serve

# Open http://localhost:1234 in your browser
```

This will show you what the plugin looks like with the test data from `.trmnlp.yml`.

## Updating the Plugin

If you make changes to the plugin:

1. **Rebuild the ZIP file:**
   ```bash
   cd octotrmnl/trmnl-plugin
   zip octotrmnl-plugin.zip settings.yml full.liquid
   ```

2. **Re-import to TRMNL:**
   - Go to https://trmnl.com/plugins/my
   - Find your existing plugin
   - Click "Export" to save a backup (optional)
   - Delete the old plugin
   - Import the new ZIP file

## Troubleshooting

**Plugin not showing data:**
- Verify the Worker URL is accessible: `https://octotrmnl.YOUR-SUBDOMAIN.workers.dev`
- Check the Worker returns valid JSON
- Trigger a manual refresh on your TRMNL device
- Check TRMNL logs for errors

**Display looks wrong:**
- Ensure you selected "Full Screen" viewport
- Try refreshing the device
- Check for Liquid template errors in TRMNL logs

**Data is outdated:**
- Plugin refreshes every 3 hours by default
- You can trigger a manual refresh from the TRMNL dashboard
- Check Cloudflare Worker logs for errors

## Worker URL

The plugin is configured to poll:
```
https://octotrmnl.YOUR-SUBDOMAIN.workers.dev
```

This URL is hardcoded in `settings.yml`. If you deploy the worker to a different URL, you'll need to update `settings.yml` and recreate the ZIP file.

## Display Layout

The full-screen layout (800x480px) shows:

- **Top Section (3 cards)**:
  - Electricity: kWh, cost, daily average, peak time
  - Gas: kWh, cost
  - Green Energy: % green, best time window

- **Middle Section**:
  - 24-hour carbon intensity forecast (bar chart)
  - Green/moderate/high intensity levels

- **Bottom Section**:
  - Current month
  - Recommendation for running appliances

## Support

For issues with:
- **Cloudflare Worker**: See README.md
- **TRMNL**: https://help.trmnl.com/
- **Plugin structure**: Check that ZIP contains only `settings.yml` and `full.liquid` in flat structure (no subdirectories)
