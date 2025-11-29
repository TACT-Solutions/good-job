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
      // Get all cookies from the main app domain
      const cookies = await chrome.cookies.getAll({
        url: 'https://good-job.app'
      });

      // Find the Supabase auth token cookie
      const authCookie = cookies.find(cookie =>
        cookie.name.includes('sb-') && cookie.name.includes('-auth-token')
      );

      if (!authCookie) {
        showError('Please sign in to GoodJob first');
        document.getElementById('loginPrompt').style.display = 'block';
        document.getElementById('mainForm').style.display = 'none';
        return;
      }

      // Parse the auth cookie to get the session
      let session;
      try {
        const cookieData = JSON.parse(decodeURIComponent(authCookie.value));
        session = cookieData;
      } catch (e) {
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
      console.error('Error:', error);
      showError('Failed to save job. Make sure you\'re signed in at good-job.app');
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
