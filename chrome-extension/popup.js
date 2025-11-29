const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

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
      const result = await chrome.storage.local.get(['supabase_session']);
      const session = result.supabase_session;

      if (!session) {
        showError('Please sign in to GoodJob first');
        document.getElementById('loginPrompt').style.display = 'block';
        document.getElementById('mainForm').style.display = 'none';
        return;
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

      if (!response.ok) throw new Error('Failed to save job');

      showSuccess('Job saved successfully!');
      setTimeout(() => window.close(), 1500);
    } catch (error) {
      console.error('Error:', error);
      showError('Failed to save job. Please try again.');
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
    chrome.tabs.create({ url: 'http://localhost:3000' });
  });
});
