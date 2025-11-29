# GoodJob - AI-Powered Job Search CRM

**Live App**: https://good-job.app

**GoodJob** is a lightweight, cost-effective job search CRM built for job seekers. Track applications, manage contacts, get AI insights, and stay organized—all for under $5/month.

## Features

### Core Features
- **Job Application Tracker**: Manage jobs through a Kanban-style pipeline (Saved → Applied → Interviewing → Offer → Rejected)
- **AI Job Enrichment**: Automatically extract skills, responsibilities, and seniority from job descriptions
- **Contact Management**: Track recruiters, hiring managers, and connections
- **Task & Reminders**: Never miss a follow-up with built-in reminders
- **Chrome Extension**: Save jobs from any website with one click
- **Contact Discovery**: Smart email pattern matching to find hiring managers

### Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Row Level Security)
- **AI**: Groq Llama 3.3 (cost-effective LLM inference)
- **Deployment**: Vercel
- **Extension**: Chrome Manifest v3

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier works great)
- Groq API key (free tier: 14,400 requests/day)

### Installation

1. **Clone the repository**
```bash
cd GoodJob
npm install
```

2. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to SQL Editor and run the schema from `supabase-schema.sql`
   - Get your project URL and anon key from Settings → API

3. **Configure environment variables**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=your-groq-api-key
```

4. **Get a Groq API Key**
   - Sign up at [console.groq.com](https://console.groq.com)
   - Create an API key (free tier gives you 14,400 requests/day)
   - Add it to your `.env.local`

5. **Run the development server**
```bash
npm run dev
```

6. **Open [http://localhost:3000](http://localhost:3000)**

### Chrome Extension Setup

See [chrome-extension/SETUP.md](chrome-extension/SETUP.md) for detailed instructions.

Quick steps:
1. Update `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `chrome-extension/popup.js`
2. Add icon files to `chrome-extension/icons/`
3. Load unpacked extension in Chrome from `chrome://extensions/`

## Database Schema

```sql
- profiles: User profiles (extends Supabase auth.users)
- jobs: Job applications with status tracking
- contacts: Professional contacts and connections
- reminders: Tasks and follow-up reminders
- linkedin_connections: Imported LinkedIn connections (optional)
```

See `supabase-schema.sql` for the complete schema with RLS policies.

## Cost Breakdown

**Target**: < $0.20/user/month for infrastructure

| Service | Cost | Notes |
|---------|------|-------|
| Vercel | Free | Hobby plan for personal projects |
| Supabase | Free | Up to 500MB database, 2GB bandwidth |
| Groq | Free | 14,400 requests/day on free tier |
| **Total** | **$0** | Free for MVP! |

For production at scale:
- Vercel Pro: $20/month (unlimited)
- Supabase Pro: $25/month (8GB database, 250GB bandwidth)
- Groq remains free or ~$0.10 per 1M tokens

**Pricing Model**: $4.99/month per user → High margin!

## AI Features

### Job Enrichment
- Automatic summary generation
- Skills extraction
- Responsibility breakdown
- Seniority level detection
- Remote/hybrid/onsite classification

### Contact Discovery
- Email pattern generation (firstname.lastname@company.com)
- Domain validation via DNS MX records
- Hiring manager role suggestions based on department
- LinkedIn connection matching

### Email Templates
- AI-generated cold outreach emails
- Personalized follow-up messages
- Professional tone and brevity

## Development

### Project Structure
```
/app                # Next.js App Router pages
  /dashboard       # Main dashboard
  /jobs            # Job tracking
  /contacts        # Contact management
  /tasks           # Reminders and tasks
  /auth            # Authentication pages
  /api             # API routes
/components        # React components
/lib               # Utilities
  /supabase        # Supabase clients
  ai.ts            # Groq AI functions
  contactFinder.ts # Contact discovery logic
/chrome-extension  # Browser extension
```

### Running locally
```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

## Deployment

**Production URL**: https://good-job.app

We use a branch-based deployment strategy:
- **`main` branch** → Production (https://good-job.app)
- **`dev` branch** → Development preview (https://good-job-dev.vercel.app)
- **Feature branches** → Automatic preview URLs

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment workflow and branch strategy.

### Quick Deploy to Vercel
1. Push your code to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Configure custom domain: `good-job.app`
5. Deploy!

### Environment Variables on Vercel
Make sure to add all variables from `.env.local` to your Vercel project settings.

## Roadmap

### MVP (Complete)
- ✅ Job tracking with status pipeline
- ✅ AI job enrichment
- ✅ Contact management
- ✅ Reminders/tasks
- ✅ Chrome extension
- ✅ Email pattern matching

### Future Enhancements
- [ ] Email integration (Gmail/Outlook OAuth)
- [ ] Analytics dashboard (time-to-response, success rates)
- [ ] Resume management and version control
- [ ] Interview prep mode with AI Q&A
- [ ] Mobile app (React Native)
- [ ] Company research automation
- [ ] Job board integrations (Indeed API, etc.)
- [ ] Referral tracking from LinkedIn connections

## Contributing

This is currently a solo project, but contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please open an issue on GitHub.

## Acknowledgments

- Built with Next.js, Supabase, and Groq
- Inspired by job seekers who need better tools
- Designed to be affordable and effective

---

**Built with ❤️ for job seekers everywhere**
