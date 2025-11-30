const SUPABASE_URL = 'https://qtylybvgoyaawvoexaxt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eWx5YnZnb3lhYXd2b2V4YXh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODU5NTIsImV4cCI6MjA3OTk2MTk1Mn0.HrrYAIMGl5Zf763hyBBi6ZS4yY-T78bxnoqyjV5t2TU';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentJobData = null;
let currentSession = null;

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is already logged in
  const session = await getStoredSession();

  if (session) {
    // Verify session is still valid
    const isValid = await verifySession(session);
    if (isValid) {
      currentSession = session;
      showJobForm();
      loadCurrentPageData();
      loadStats();
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
  setupStatusSelector();
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
    const { data, error } = await supabase.auth.getUser(session.access_token);
    return !error && data.user;
  } catch (e) {
    return false;
  }
}

// Show login form
function showLoginForm() {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('mainForm').style.display = 'none';
  document.getElementById('logoutBtn').style.display = 'none';
}

// Show job form
function showJobForm() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('mainForm').style.display = 'block';
  document.getElementById('logoutBtn').style.display = 'block';
}

// Setup authentication form
function setupAuthForm() {
  const form = document.getElementById('authForm');
  const messageDiv = document.getElementById('message');
  const authBtnText = document.getElementById('authBtnText');
  const authBtn = document.getElementById('authBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    messageDiv.innerHTML = '';
    authBtn.disabled = true;
    authBtnText.innerHTML = '<span class="spinner"></span> Signing in...';

    try {
      // Sign in with Supabase client
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw new Error(error.message);
      }

      // Store session
      await storeSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: data.user,
        expires_at: data.session.expires_at
      });

      currentSession = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: data.user,
        expires_at: data.session.expires_at
      };

      // Show success and switch to job form
      showMessage(messageDiv, '✓ Signed in successfully!', 'success');
      setTimeout(() => {
        showJobForm();
        loadCurrentPageData();
        loadStats();
      }, 500);

    } catch (error) {
      console.error('Auth error:', error);
      showMessage(messageDiv, `✗ ${error.message}`, 'error');
    } finally {
      authBtn.disabled = false;
      authBtnText.textContent = 'Sign In';
    }
  });
}

// Setup job form
function setupJobForm() {
  const form = document.getElementById('jobForm');
  const messageDiv = document.getElementById('jobMessage');
  const submitBtnText = document.getElementById('submitBtnText');
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
    submitBtnText.innerHTML = '<span class="spinner"></span> Adding...';

    try {
      const title = document.getElementById('title').value;
      const company = document.getElementById('company').value;
      const url = document.getElementById('url').value;
      const description = document.getElementById('description').value;
      const location = document.getElementById('location').value;
      const salary = document.getElementById('salary').value;
      const jobType = document.getElementById('jobType').value;
      const status = document.querySelector('input[name="status"]:checked').value;

      // Use Supabase client to insert job
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          user_id: session.user.id,
          title,
          company,
          url,
          location,
          salary_range: salary,
          job_type: jobType,
          raw_description: description,
          status,
          source: currentJobData?.source || 'Manual',
          posted_date: currentJobData?.postedDate || null
        })
        .select();

      if (error) {
        throw new Error(error.message);
      }

      showMessage(messageDiv, '✓ Job saved successfully!', 'success');
      loadStats(); // Refresh stats

      setTimeout(() => window.close(), 1500);

    } catch (error) {
      console.error('Error saving job:', error);
      showMessage(messageDiv, `✗ ${error.message}`, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtnText.innerHTML = '💼 Add to GoodJob';
    }
  });
}

// Setup logout button
function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn.addEventListener('click', async () => {
    await chrome.storage.local.remove('supabase_session');
    await supabase.auth.signOut();
    currentSession = null;
    showLoginForm();
    // Clear form fields
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
  });
}

// Setup status selector interactivity
function setupStatusSelector() {
  const statusOptions = document.querySelectorAll('.status-option');
  statusOptions.forEach(option => {
    option.addEventListener('click', () => {
      statusOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      option.querySelector('input[type="radio"]').checked = true;
    });
  });
}

// Load current page data
function loadCurrentPageData() {
  const urlInput = document.getElementById('url');
  const titleInput = document.getElementById('title');
  const companyInput = document.getElementById('company');
  const descriptionInput = document.getElementById('description');
  const locationInput = document.getElementById('location');
  const salaryInput = document.getElementById('salary');
  const jobTypeSelect = document.getElementById('jobType');
  const sourceInfo = document.getElementById('sourceInfo');

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
        currentJobData = response;

        if (response.title) titleInput.value = response.title;
        if (response.company) companyInput.value = response.company;
        if (response.description) descriptionInput.value = response.description;
        if (response.location) locationInput.value = response.location;
        if (response.salary) salaryInput.value = response.salary;
        if (response.jobType && response.jobType !== 'unknown') {
          jobTypeSelect.value = response.jobType;
        }

        // Show source badge
        if (response.source) {
          sourceInfo.innerHTML = `<span class="source-badge">📍 ${response.source}</span>`;
        }

        // Check for duplicates
        checkDuplicate(response.title, response.company);
      }
    });
  });
}

// Check for duplicate jobs
async function checkDuplicate(title, company) {
  const session = await getStoredSession();
  if (!session) return;

  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, company, status, created_at')
      .eq('user_id', session.user.id)
      .ilike('title', `%${title}%`)
      .ilike('company', `%${company}%`)
      .limit(5);

    if (error) throw error;

    if (data && data.length > 0) {
      const warningDiv = document.getElementById('duplicateWarning');
      const matchCount = data.length;
      const firstMatch = data[0];

      warningDiv.innerHTML = `
        <div class="duplicate-warning">
          <div class="duplicate-warning-title">⚠️ Possible Duplicate</div>
          <div class="duplicate-warning-text">
            Found ${matchCount} similar job${matchCount > 1 ? 's' : ''} already saved.
            ${matchCount === 1 ? `"${firstMatch.title}" at ${firstMatch.company} (${firstMatch.status})` : ''}
          </div>
        </div>
      `;
      warningDiv.style.display = 'block';
    }
  } catch (error) {
    console.error('Error checking duplicates:', error);
  }
}

// Load user stats
async function loadStats() {
  const session = await getStoredSession();
  if (!session) return;

  try {
    // Get total jobs
    const { count: totalCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id);

    // Get jobs from last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { count: weekCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .gte('created_at', oneWeekAgo.toISOString());

    // Update stats display
    document.getElementById('statTotal').textContent = totalCount || 0;
    document.getElementById('statWeek').textContent = weekCount || 0;
    document.getElementById('stats').style.display = 'flex';

  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Show message helper
function showMessage(element, message, type) {
  element.innerHTML = `<div class="message ${type}">${message}</div>`;
}
