const SUPABASE_URL = 'https://qtylybvgoyaawvoexaxt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eWx5YnZnb3lhYXd2b2V4YXh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODU5NTIsImV4cCI6MjA3OTk2MTk1Mn0.HrrYAIMGl5Zf763hyBBi6ZS4yY-T78bxnoqyjV5t2TUEY';

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is already logged in
  const session = await getStoredSession();

  if (session) {
    // Verify session is still valid
    const isValid = await verifySession(session);
    if (isValid) {
      showJobForm();
      loadCurrentPageData();
    } else {
      // Session expired, clear it
      await chrome.storage.local.remove('supabase_session');
      showLoginForm();
    }
  } else {
    showLoginForm();
  }

  // Setup event listeners
  setupAuthForm();
  setupJobForm();
  setupLogout();
});

// Get stored session from chrome.storage
async function getStoredSession() {
  const result = await chrome.storage.local.get('supabase_session');
  return result.supabase_session || null;
}

// Store session in chrome.storage
async function storeSession(session) {
  await chrome.storage.local.set({ supabase_session: session });
}

// Verify session is still valid
async function verifySession(session) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    return response.ok;
  } catch (e) {
    return false;
  }
}

// Show login form
function showLoginForm() {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('mainForm').style.display = 'none';
}

// Show job form
function showJobForm() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('mainForm').style.display = 'block';
}

// Setup authentication form
function setupAuthForm() {
  const form = document.getElementById('authForm');
  const messageDiv = document.getElementById('message');
  const authBtn = document.getElementById('authBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    messageDiv.innerHTML = '';
    authBtn.disabled = true;
    authBtn.textContent = 'Signing in...';

    try {
      // Sign in with Supabase
      console.log('Attempting login with email:', email);
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();
      console.log('Auth response:', response.status, data);

      if (!response.ok) {
        const errorMsg = data.error_description || data.error || data.msg || 'Invalid credentials';
        console.error('Auth failed:', errorMsg);
        throw new Error(errorMsg);
      }

      // Store session
      await storeSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
        expires_at: data.expires_at
      });

      // Show success and switch to job form
      showMessage(messageDiv, 'Signed in successfully!', 'success');
      setTimeout(() => {
        showJobForm();
        loadCurrentPageData();
      }, 500);

    } catch (error) {
      console.error('Auth error:', error);
      showMessage(messageDiv, error.message, 'error');
    } finally {
      authBtn.disabled = false;
      authBtn.textContent = 'Sign In';
    }
  });
}

// Setup job form
function setupJobForm() {
  const form = document.getElementById('jobForm');
  const messageDiv = document.getElementById('jobMessage');
  const submitBtn = document.getElementById('submitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const session = await getStoredSession();
    if (!session) {
      showLoginForm();
      return;
    }

    messageDiv.innerHTML = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';

    try {
      const title = document.getElementById('title').value;
      const company = document.getElementById('company').value;
      const url = document.getElementById('url').value;
      const description = document.getElementById('description').value;

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
          title,
          company,
          url,
          raw_description: description,
          status: 'saved'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save job: ${errorText}`);
      }

      showMessage(messageDiv, 'Job saved successfully!', 'success');
      setTimeout(() => window.close(), 1500);

    } catch (error) {
      console.error('Error saving job:', error);
      showMessage(messageDiv, error.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add to GoodJob';
    }
  });
}

// Setup logout button
function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn.addEventListener('click', async () => {
    await chrome.storage.local.remove('supabase_session');
    showLoginForm();
    // Clear form fields
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
  });
}

// Load current page data
function loadCurrentPageData() {
  const urlInput = document.getElementById('url');
  const titleInput = document.getElementById('title');
  const companyInput = document.getElementById('company');
  const descriptionInput = document.getElementById('description');

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    urlInput.value = currentTab.url;

    // Try to extract job data from the page
    chrome.tabs.sendMessage(currentTab.id, { action: 'extractJobData' }, (response) => {
      if (chrome.runtime.lastError) {
        // Content script not loaded, that's okay
        console.log('Content script not available');
        return;
      }

      if (response) {
        if (response.title) titleInput.value = response.title;
        if (response.company) companyInput.value = response.company;
        if (response.description) descriptionInput.value = response.description;
      }
    });
  });
}

// Show message helper
function showMessage(element, message, type) {
  element.innerHTML = `<div class="${type}">${message}</div>`;
}
