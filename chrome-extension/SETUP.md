# GoodJob Chrome Extension Setup

This extension allows you to quickly save job postings from any website to your GoodJob CRM.

## Installation

1. **Update Configuration**
   - Open `popup.js`
   - Replace `YOUR_SUPABASE_URL` with your actual Supabase project URL
   - Replace `YOUR_SUPABASE_ANON_KEY` with your Supabase anon key

2. **Create Extension Icons**
   - Create an `icons` folder in the `chrome-extension` directory
   - Add three icon files:
     - `icon16.png` (16x16 pixels)
     - `icon48.png` (48x48 pixels)
     - `icon128.png` (128x128 pixels)
   - You can use any logo or icon for GoodJob

3. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `chrome-extension` folder from your GoodJob project

4. **Test the Extension**
   - Navigate to any job posting (LinkedIn, Indeed, etc.)
   - Click the GoodJob extension icon
   - The extension should auto-fill job details
   - Click "Add to GoodJob" to save

## Features

- **Auto-detection** for popular job boards:
  - LinkedIn Jobs
  - Indeed
  - Greenhouse ATS
  - Lever ATS
  - Generic websites (best-effort extraction)

- **Manual editing**: You can edit any auto-filled fields before saving

- **Requires authentication**: You must be signed in to GoodJob in your browser

## Troubleshooting

### "Please sign in to GoodJob first"
- Make sure you're signed in to the GoodJob web app
- The extension reads your session from local storage

### Fields not auto-filling
- The extension uses best-effort extraction
- Some websites may not be supported
- You can manually enter the information

### Save fails
- Check that your Supabase URL and API key are correct
- Verify you're connected to the internet
- Check browser console for errors (F12 → Console)

## Privacy

This extension:
- Only reads visible page content when you click the extension
- Does NOT scrape or crawl websites automatically
- Does NOT run in the background
- Only sends data to your own Supabase instance
- Requires your explicit action to save jobs
