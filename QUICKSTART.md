# GoodJob - Quick Start

## You're Almost Ready! 🎉

Your GoodJob application is fully built and ready to run. You just need to connect it to Supabase and add API keys.

---

## ✅ What's Already Done

- ✅ Next.js application structure
- ✅ All components and pages
- ✅ Database schema SQL file
- ✅ Authentication system
- ✅ Chrome extension
- ✅ AI integration (Groq)
- ✅ Contact discovery
- ✅ All dependencies installed

---

## 📋 Before You Start

You need **3 things** (all free):

1. **Supabase Project** → [Create one here](https://supabase.com)
2. **Groq API Key** → [Get one here](https://console.groq.com)
3. **5 minutes** to set everything up

---

## 🚀 Setup Steps

### 1. Create Supabase Project (2 minutes)

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **New Project**
3. Fill in:
   - Name: `goodjob`
   - Database Password: (choose a strong password)
   - Region: (closest to you)
4. Click **Create Project** (wait ~2 mins for it to be ready)

### 2. Set Up Database (1 minute)

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **+ New Query**
3. Open the file `supabase-schema.sql` in this project
4. **Copy all the SQL** from that file
5. **Paste** it into the Supabase SQL Editor
6. Click **Run** (bottom right)
7. ✅ You should see "Success. No rows returned"

### 3. Get API Keys (1 minute)

**Supabase Keys:**
1. In Supabase, go to **Settings** → **API**
2. Copy these 3 values:
   - **Project URL** (looks like `https://abc123.supabase.co`)
   - **anon public** key (long string under "Project API keys")
   - **service_role** key (long string - keep this secret!)

**Groq Key:**
1. Go to [console.groq.com](https://console.groq.com) and sign up (free)
2. Go to **API Keys**
3. Click **Create API Key**
4. Name it "GoodJob"
5. Copy the key (you won't see it again!)

### 4. Create Environment File (1 minute)

1. In your GoodJob project folder, create a file named `.env.local`
2. Add this content (replace with YOUR keys):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Groq AI
GROQ_API_KEY=your-groq-key-here
```

3. **Save the file**

### 5. Start the App! (30 seconds)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🎯 First Steps After Starting

### 1. Create Your Account
- Click **Sign Up**
- Enter your email and password
- Check your email for confirmation (or skip for local dev)

### 2. Add Your First Job
- Go to **Jobs** in sidebar
- Click **+ Add Job**
- Fill in job details
- Click "Add Job"

### 3. Test AI Enrichment
- Add a job with a real job description
- The AI will analyze it automatically
- Check the extracted skills and summary

### 4. Set Up Chrome Extension
See [chrome-extension/SETUP.md](chrome-extension/SETUP.md) for details.

---

## 🔍 Troubleshooting

### "Cannot find module" errors
```bash
npm install
```

### "Invalid API credentials"
- Double-check your `.env.local` file
- Make sure there are no extra spaces
- Restart dev server: `npm run dev`

### Database errors
- Make sure you ran the SQL schema in Supabase
- Go to Supabase → SQL Editor → Tables → Should see `jobs`, `contacts`, etc.

### Auth not working
- Check Supabase → **Authentication** → **Providers**
- Make sure **Email** is enabled

---

## 📖 Full Documentation

- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Complete detailed setup
- [README.md](README.md) - Project overview and features
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Technical details

---

## 🆘 Need Help?

1. Check the troubleshooting sections in [SETUP_GUIDE.md](SETUP_GUIDE.md)
2. Review Supabase docs: [supabase.com/docs](https://supabase.com/docs)
3. Check Groq docs: [console.groq.com](https://console.groq.com)
4. Look for error messages in the browser console (F12)

---

## ✨ You're Ready!

That's it! You now have:
- ✅ A working job search CRM
- ✅ AI-powered job analysis
- ✅ Contact management
- ✅ Task tracking
- ✅ Chrome extension ready to install

**Happy job hunting! 🎯**
