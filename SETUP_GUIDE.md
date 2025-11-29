# GoodJob Complete Setup Guide

**Live App**: https://good-job.app
**GitHub**: https://github.com/TACT-Solutions/good-job

This guide will walk you through setting up GoodJob from scratch.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Environment Variables](#environment-variables)
4. [Running Locally](#running-locally)
5. [Chrome Extension Setup](#chrome-extension-setup)
6. [Deploying to Vercel](#deploying-to-vercel)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts (All Free Tier)
- [GitHub](https://github.com) - For version control
- [Supabase](https://supabase.com) - Database and authentication
- [Groq](https://console.groq.com) - AI inference (14,400 free requests/day)
- [Vercel](https://vercel.com) - Deployment (optional)

### Required Software
- Node.js 18+ ([download here](https://nodejs.org/))
- npm (comes with Node.js)
- Git
- Chrome browser (for extension)

---

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Choose an organization (create one if needed)
4. Fill in project details:
   - **Name**: goodjob (or your choice)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free
5. Click "Create new project" (takes ~2 minutes)

### 2. Run the Database Schema

1. Once your project is ready, go to **SQL Editor** in the left sidebar
2. Click "+ New Query"
3. Open the file `supabase-schema.sql` from your GoodJob project
4. Copy ALL the SQL code
5. Paste it into the Supabase SQL Editor
6. Click "Run" (bottom right)
7. You should see "Success. No rows returned"

This creates all your tables:
- ✅ profiles
- ✅ jobs
- ✅ contacts
- ✅ reminders
- ✅ linkedin_connections

### 3. Get Your API Keys

1. Go to **Settings** → **API** in your Supabase project
2. Copy these values (you'll need them soon):
   - **Project URL** (looks like `https://abc123.supabase.co`)
   - **anon public** key (under "Project API keys")
   - **service_role** key (under "Project API keys" - keep this secret!)

---

## Environment Variables

### 1. Get Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up (free)
3. Go to **API Keys**
4. Click "Create API Key"
5. Name it "GoodJob"
6. Copy the key (you can't see it again!)

### 2. Create `.env.local` File

In your GoodJob project folder:

```bash
# Copy the example file
cp .env.local.example .env.local
```

### 3. Fill in Your Keys

Open `.env.local` and replace the placeholder values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# AI - Groq (Free/Low-Cost Llama)
GROQ_API_KEY=your-groq-api-key-here
```

**Important**:
- Never commit `.env.local` to Git (it's already in `.gitignore`)
- Keep your `service_role` key secret!

---

## Running Locally

### 1. Install Dependencies

```bash
cd GoodJob
npm install
```

This installs all required packages (~2-3 minutes).

### 2. Start Development Server

```bash
npm run dev
```

You should see:
```
✓ Ready in Xms
○ Local: http://localhost:3000
```

### 3. Test the Application

1. Open http://localhost:3000 in your browser
2. You should see the GoodJob homepage
3. Click **Sign Up** to create an account
4. Fill in:
   - Full name
   - Email address
   - Password (at least 6 characters)
5. Click "Sign up"

### 4. Check Your Email

Supabase sends a confirmation email. **For local development**:
- You can skip email confirmation
- Go to Supabase Dashboard → **Authentication** → **Users**
- Find your user and click the **...** menu
- Select "Confirm user"

### 5. Sign In

1. Go back to http://localhost:3000
2. Click **Sign In**
3. Enter your credentials
4. You should land on the Dashboard!

### 6. Add Your First Job

1. Go to **Jobs** in the sidebar
2. Click **+ Add Job**
3. Fill in:
   - Job Title: "Software Engineer"
   - Company: "Google"
   - Job URL: https://careers.google.com (optional)
   - Description: Paste any job description
4. Click "Add Job"
5. It appears in your jobs list!

---

## Chrome Extension Setup

### 1. Update Extension Configuration

1. Open `chrome-extension/popup.js`
2. Find lines 1-2:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```
3. Replace with your actual Supabase values:
```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### 2. Create Extension Icons

You need 3 icon files. Two options:

**Option A: Use a simple placeholder**
- Create a simple 128x128 PNG with text "GJ"
- Resize it to 16x16 and 48x48
- Save as `icon16.png`, `icon48.png`, `icon128.png`
- Put them in `chrome-extension/icons/`

**Option B: Generate with AI**
- Use [favicon.io](https://favicon.io/favicon-generator/)
- Download the pack
- Rename files to match the sizes above

### 3. Load Extension in Chrome

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the `GoodJob/chrome-extension` folder
6. The extension should appear!

### 4. Test the Extension

1. Go to any job posting (try LinkedIn or Indeed)
2. Click the GoodJob extension icon in your toolbar
3. Job details should auto-fill
4. Edit if needed
5. Click "Add to GoodJob"
6. Check your GoodJob app - the job should appear!

---

## Deploying to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/goodjob.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **Add New** → **Project**
4. Import your `goodjob` repository
5. **Configure Project**:
   - Framework Preset: Next.js (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: `.next`
6. Click **Environment Variables**
7. Add all variables from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GROQ_API_KEY`
8. Click **Deploy**

### 3. Update Chrome Extension

After deployment:
1. Copy your Vercel URL (e.g., `https://goodjob.vercel.app`)
2. Update `chrome-extension/popup.js` line 84:
```javascript
chrome.tabs.create({ url: 'https://goodjob.vercel.app' });
```
3. Reload the extension in `chrome://extensions/`

---

## Troubleshooting

### Database Issues

**Error: "relation 'jobs' does not exist"**
- You didn't run the SQL schema
- Go to Supabase → SQL Editor → Run `supabase-schema.sql`

**Error: "permission denied for table jobs"**
- Row Level Security is blocking you
- Make sure you're signed in
- Check your Supabase auth session

### Environment Variable Issues

**Error: "Cannot read property 'auth' of undefined"**
- Your Supabase URL or key is wrong
- Check `.env.local` for typos
- Restart dev server after changing env vars: `npm run dev`

**Groq API Errors**
- Check your `GROQ_API_KEY` is correct
- Verify you haven't exceeded rate limits (14,400/day free)
- Check [console.groq.com](https://console.groq.com) for API status

### Chrome Extension Issues

**Extension not loading**
- Check `chrome://extensions/` for errors
- Make sure `manifest.json` is valid
- Verify icon files exist in `icons/` folder

**"Please sign in" message**
- Sign in to your GoodJob app first (http://localhost:3000 or your Vercel URL)
- The extension reads your session from the web app

**Jobs not saving**
- Open browser console (F12)
- Look for errors
- Verify Supabase URL/key in `popup.js`
- Make sure you're connected to internet

### General Issues

**Port 3000 already in use**
```bash
# Find process using port 3000
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill it or use a different port
npm run dev -- -p 3001
```

**Build errors**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

**TypeScript errors**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## Next Steps

✅ You now have:
- A working GoodJob web app
- Supabase backend with auth
- AI-powered job enrichment
- Chrome extension for saving jobs

### Optional Enhancements
- Connect Gmail for email tracking
- Import LinkedIn connections CSV
- Customize AI prompts in `lib/ai.ts`
- Add your own color scheme in `tailwind.config.ts`

### Need Help?
- Check the [README.md](README.md) for more info
- Open an issue on GitHub
- Review Supabase docs: [supabase.com/docs](https://supabase.com/docs)

---

**Happy job hunting! 🎯**
