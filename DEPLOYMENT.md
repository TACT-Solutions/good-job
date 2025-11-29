# GoodJob Deployment Guide

## 🌐 Production Domain

**Live URL**: https://good-job.app

This is the production deployment connected to the `main` branch.

---

## 🔄 Branch Deployment Strategy

We use Vercel's branch deployment feature for safe feature development:

### **Branches:**

- **`main`** → Production (https://good-job.app)
- **`dev`** → Development preview (https://good-job-dev.vercel.app)
- **Feature branches** → Automatic preview URLs

---

## 📋 Deployment Workflow

### **1. Development Workflow**

```bash
# Create a new feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... code, test, commit ...

# Push to GitHub
git push origin feature/your-feature-name
```

**Vercel will automatically**:
- Build your branch
- Deploy to a preview URL: `https://good-job-git-feature-your-feature-name.vercel.app`
- Add a comment to your PR with the preview URL

### **2. Testing in Dev Branch**

```bash
# Switch to dev branch
git checkout dev

# Merge your feature
git merge feature/your-feature-name

# Push to trigger dev deployment
git push origin dev
```

**Vercel deploys to**: `https://good-job-dev.vercel.app`

Test everything here before merging to production!

### **3. Deploy to Production**

```bash
# Switch to main
git checkout main

# Merge from dev
git merge dev

# Push to deploy to production
git push origin main
```

**Vercel deploys to**: https://good-job.app

---

## 🔧 Vercel Configuration

### **Domain Settings**

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain:
   - **Production**: `good-job.app` (assigned to `main` branch)
   - **Dev Preview**: `dev.good-job.app` (optional, assigned to `dev` branch)

### **Branch Protection**

Configure in Vercel → Settings → Git:
- ✅ `main` - Production deployment
- ✅ `dev` - Preview deployment
- ✅ All other branches - Automatic preview deployments

### **Environment Variables**

All branches use the same environment variables by default.

**To use different variables per branch** (optional):
1. Go to Settings → Environment Variables
2. Select which environments to apply to:
   - Production (main branch)
   - Preview (dev + feature branches)
   - Development (local)

---

## 🚀 Quick Commands

```bash
# Create and push dev branch (first time only)
git checkout -b dev
git push -u origin dev

# Normal feature workflow
git checkout -b feature/new-feature
# ... make changes ...
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# Merge to dev for testing
git checkout dev
git merge feature/new-feature
git push origin dev

# Deploy to production
git checkout main
git merge dev
git push origin main
```

---

## 🔍 Monitoring Deployments

### **Vercel Dashboard**
- View all deployments: https://vercel.com/tact-solutions/good-job
- Check build logs
- See preview URLs
- Monitor performance

### **GitHub Integration**
- Deployment status shown in PR checks
- Preview URLs automatically commented on PRs
- Build success/failure notifications

---

## 🌍 Domain Configuration

### **DNS Settings (Your Domain Provider)**

Point your domain to Vercel:

**For root domain (good-job.app):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**For dev subdomain (optional):**
```
Type: CNAME
Name: dev
Value: cname.vercel-dns.com
```

### **Vercel Domain Setup**

1. Go to Vercel → Settings → Domains
2. Add domain: `good-job.app`
3. Vercel will verify DNS
4. Assign to `main` branch
5. Enable automatic HTTPS

---

## 📦 Build Settings

**Framework**: Next.js
**Build Command**: `next build`
**Output Directory**: `.next`
**Install Command**: `npm install`
**Node Version**: 20.x (auto-detected)

---

## ⚠️ Important Notes

### **Never Push Directly to Main**
Always test in `dev` first, then merge to `main`.

### **Chrome Extension Updates**
After deploying to production:
1. Update `chrome-extension/popup.js` if needed
2. Test the extension with production URL
3. Reload extension in `chrome://extensions/`

### **Database Migrations**
If you update the database schema:
1. Test in dev first
2. Update `supabase-schema.sql`
3. Apply to production Supabase carefully
4. Consider using Supabase migrations for version control

### **Environment Variables**
- Never commit `.env.local` to git
- Update Vercel environment variables when needed
- Restart deployments after env var changes

---

## 🐛 Troubleshooting

### **Build Fails on Vercel**
1. Check build logs in Vercel dashboard
2. Ensure all environment variables are set
3. Try building locally: `npm run build`
4. Check for TypeScript errors: `npm run lint`

### **Domain Not Working**
1. Verify DNS propagation (can take up to 48 hours)
2. Check Vercel domain settings
3. Ensure SSL certificate is issued (automatic)

### **Preview Deployment Not Working**
1. Check Vercel Git settings
2. Ensure branch is pushed to GitHub
3. Verify GitHub integration is connected

---

## 📊 Deployment Checklist

Before merging to production:

- [ ] Feature tested locally
- [ ] Pushed to feature branch
- [ ] Preview deployment successful
- [ ] Merged to `dev` branch
- [ ] Tested on dev preview URL
- [ ] Code reviewed
- [ ] No console errors
- [ ] Environment variables verified
- [ ] Database changes applied (if any)
- [ ] Chrome extension updated (if needed)
- [ ] Merge to `main`
- [ ] Verify production deployment
- [ ] Test on https://good-job.app

---

## 🎯 Summary

**Development**: Feature branches → Auto preview URLs
**Testing**: `dev` branch → https://good-job-dev.vercel.app
**Production**: `main` branch → https://good-job.app

**Safe, tested, deployed!** 🚀
