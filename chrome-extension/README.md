# GoodJob Chrome Extension

## Setup Instructions

### 1. Configure Supabase Credentials

Edit `popup.js` and replace the placeholders:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### 2. Create Extension Icons

Create placeholder icons in the `icons/` folder:
- `icon16.png` (16x16px)
- `icon48.png` (48x48px)
- `icon128.png` (128x128px)

Or use any simple blue square/circle icons for testing.

### 3. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder
5. The extension should now appear in your toolbar

### 4. Usage

1. Navigate to any job posting (LinkedIn, Indeed, Greenhouse, Lever, etc.)
2. Click the GoodJob extension icon
3. The extension will auto-extract job details
4. Review and click "Add to GoodJob"
5. Job will be saved to your GoodJob dashboard

### Supported Sites

- LinkedIn Jobs
- Indeed
- Greenhouse
- Lever
- Generic job posting pages (best effort extraction)

### Notes

- You must be signed in to GoodJob web app first
- Extension reads only visible page content
- No automation or background scraping
- Fully compliant with ToS
