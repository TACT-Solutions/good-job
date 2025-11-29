const SUPABASE_URL = 'https://qtylybvgoyaawvoexaxt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eWx5YnZnb3lhYXd2b2V4YXh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODU5NTIsImV4cCI6MjA3OTk2MTk1Mn0.HrrYAIMGl5Zf763hyBBi6ZS4yY-T78bxnoqyjV5t2TUEY';

document.addEventListener('DOMContentLoaded', async () => {
  const urlInput = document.getElementById('url');
  const titleInput = document.getElementById('title');
  const companyInput = document.getElementById('company');
  const descriptionInput = document.getElementById('description');
  const form = document.getElementById('jobForm');
  const messageDiv = document.getElementById('message');
  const submitBtn = document.getElementById('submitBtn');

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    urlInput.value = currentTab.url;

    chrome.tabs.sendMessage(currentTab.id, { action: 'extractJobData' }, (response) => {
      if (response) {
        if (response.title) titleInput.value = response.title;
        if (response.company) companyInput.value = response.company;
        if (response.description) descriptionInput.value = response.description;
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    messageDiv.innerHTML = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';

    try {
      // Try to get cookies from multiple possible domains
      const domains = [
        'https://good-job.app',
        'https://goodjob-git-dev-jacob-mcdaniels-projects.vercel.app',
        SUPABASE_URL
      ];

      let authCookie = null;
      let allCookies = [];

      // Try each domain
      for (const domain of domains) {
        try {
          const cookies = await chrome.cookies.getAll({ url: domain });
          allCookies = [...allCookies, ...cookies];
          console.log(`Cookies from ${domain}:`, cookies.map(c => c.name));

          // Look for Supabase auth token cookie
          // Pattern: sb-{project-ref}-auth-token
          const cookie = cookies.find(c =>
            c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
          );

          if (cookie) {
            authCookie = cookie;
            console.log(`Found auth cookie from ${domain}:`, cookie.name);
            break;
          }
        } catch (e) {
          console.log(`Failed to get cookies from ${domain}:`, e);
        }
      }

      // Debug: log all cookies
      console.log('All cookies found:', allCookies.map(c => c.name));
      console.log('Auth cookie found:', authCookie);

      if (!authCookie) {
        showError('Please sign in to GoodJob first. Check the console (F12) for debugging info.');
        document.getElementById('loginPrompt').style.display = 'block';
        document.getElementById('mainForm').style.display = 'none';
        console.error('No auth cookie found. Check the logs above to see which cookies were detected.');
        return;
      }

      // Parse the auth cookie to get the session
      let session;
      try {
        const cookieData = JSON.parse(decodeURIComponent(authCookie.value));
        session = cookieData;
        console.log('Session parsed successfully');
      } catch (e) {
        console.error('Failed to parse session:', e);
        throw new Error('Invalid session data');
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          user_id: session.user.id,
          title: titleInput.value,
          company: companyInput.value,
          url: urlInput.value,
          raw_description: descriptionInput.value,
          status: 'saved'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save job: ${errorText}`);
      }

      showSuccess('Job saved successfully!');
      setTimeout(() => window.close(), 1500);
    } catch (error) {
      console.error('Error saving job:', error);
      showError(`Failed to save job: ${error.message}`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add to GoodJob';
    }
  });

  function showSuccess(message) {
    messageDiv.innerHTML = `<div class="success">${message}</div>`;
  }

  function showError(message) {
    messageDiv.innerHTML = `<div class="error">${message}</div>`;
  }

  document.getElementById('openApp')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://good-job.app' });
  });
});
