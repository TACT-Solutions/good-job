chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractJobData') {
    const jobData = extractJobInfo();
    sendResponse(jobData);
  }
  return true;
});

function extractJobInfo() {
  const url = window.location.href;
  let title = '';
  let company = '';
  let description = '';
  let location = '';
  let salary = '';
  let jobType = 'unknown';
  let postedDate = null;
  let source = '';

  // LinkedIn Jobs
  if (url.includes('linkedin.com/jobs')) {
    source = 'LinkedIn';
    title = document.querySelector('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title')?.textContent?.trim() || '';
    company = document.querySelector('.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name a')?.textContent?.trim() || '';
    location = document.querySelector('.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet')?.textContent?.trim() || '';

    // LinkedIn salary
    const salaryElement = document.querySelector('.job-details-jobs-unified-top-card__job-insight, .jobs-unified-top-card__job-insight');
    if (salaryElement && salaryElement.textContent.includes('$')) {
      salary = salaryElement.textContent.trim();
    }

    // Description
    description = document.querySelector('.jobs-description__content, .jobs-box__html-content')?.textContent?.trim() || '';

    // Job type detection from description or badges
    const fullText = (title + ' ' + description + ' ' + location).toLowerCase();
    jobType = detectJobType(fullText);
  }

  // Indeed
  else if (url.includes('indeed.com')) {
    source = 'Indeed';
    title = document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"], .jobsearch-JobInfoHeader-title')?.textContent?.trim() || '';
    company = document.querySelector('[data-testid="inlineHeader-companyName"], .jobsearch-InlineCompanyRating-companyHeader')?.textContent?.trim() || '';
    location = document.querySelector('[data-testid="job-location"], .jobsearch-JobInfoHeader-subtitle [data-testid="text-location"]')?.textContent?.trim() || '';
    salary = document.querySelector('[data-testid="jobsearch-JobMetadataHeader-item"], .jobsearch-JobMetadataHeader-item')?.textContent?.trim() || '';
    description = document.querySelector('#jobDescriptionText, .jobsearch-JobComponent-description')?.textContent?.trim() || '';

    // Posted date
    const footerItems = document.querySelectorAll('.jobsearch-JobMetadataFooter, [data-testid="job-metadata"]');
    for (const item of footerItems) {
      const text = item.textContent;
      if (text.includes('Posted') || text.includes('day') || text.includes('hour')) {
        postedDate = parseRelativeDate(text);
      }
    }

    const fullText = (title + ' ' + description + ' ' + location).toLowerCase();
    jobType = detectJobType(fullText);
  }

  // Glassdoor
  else if (url.includes('glassdoor.com')) {
    source = 'Glassdoor';
    title = document.querySelector('[data-test="job-title"], .JobDetails_jobTitle__Rw_gn')?.textContent?.trim() || '';
    company = document.querySelector('[data-test="employer-name"], .EmployerProfile_employerName__Xemli')?.textContent?.trim() || '';
    location = document.querySelector('[data-test="location"], .JobDetails_location__mSg5h')?.textContent?.trim() || '';
    salary = document.querySelector('[data-test="detailSalary"], .JobDetails_salary__6y4Sn')?.textContent?.trim() || '';
    description = document.querySelector('[data-test="jobDescriptionText"], .JobDetails_jobDescription__uW_fK')?.textContent?.trim() || '';

    const fullText = (title + ' ' + description + ' ' + location).toLowerCase();
    jobType = detectJobType(fullText);
  }

  // ZipRecruiter
  else if (url.includes('ziprecruiter.com')) {
    source = 'ZipRecruiter';
    title = document.querySelector('h1.job_title, [data-testid="jobTitle"]')?.textContent?.trim() || '';
    company = document.querySelector('.hiring_company_text, [data-testid="companyName"]')?.textContent?.trim() || '';
    location = document.querySelector('.location, [data-testid="jobLocation"]')?.textContent?.trim() || '';
    salary = document.querySelector('.compensation, [data-testid="compensation"]')?.textContent?.trim() || '';
    description = document.querySelector('.job_description, [data-testid="jobDescription"]')?.textContent?.trim() || '';

    const fullText = (title + ' ' + description + ' ' + location).toLowerCase();
    jobType = detectJobType(fullText);
  }

  // Monster
  else if (url.includes('monster.com')) {
    source = 'Monster';
    title = document.querySelector('h1[data-test-id="svx-job-title"]')?.textContent?.trim() || '';
    company = document.querySelector('[data-test-id="svx-job-header-company-name"]')?.textContent?.trim() || '';
    location = document.querySelector('[data-test-id="svx-job-header-location"]')?.textContent?.trim() || '';
    salary = document.querySelector('[data-test-id="svx-job-header-salary"]')?.textContent?.trim() || '';
    description = document.querySelector('[data-test-id="svx-job-description-text"]')?.textContent?.trim() || '';

    const fullText = (title + ' ' + description + ' ' + location).toLowerCase();
    jobType = detectJobType(fullText);
  }

  // Greenhouse
  else if (url.includes('greenhouse.io') || url.includes('boards.greenhouse.io')) {
    source = 'Greenhouse';
    title = document.querySelector('.app-title, h1.app-title')?.textContent?.trim() || '';
    company = document.querySelector('.company-name')?.textContent?.trim() || '';
    location = document.querySelector('.location')?.textContent?.trim() || '';
    description = document.querySelector('#content, .body')?.textContent?.trim() || '';

    const fullText = (title + ' ' + description + ' ' + location).toLowerCase();
    jobType = detectJobType(fullText);
  }

  // Lever
  else if (url.includes('lever.co') || url.includes('jobs.lever.co')) {
    source = 'Lever';
    title = document.querySelector('.posting-headline h2')?.textContent?.trim() || '';
    company = document.querySelector('.main-header-text a')?.textContent?.trim() || '';
    location = document.querySelector('.posting-categories .location, .sort-by-time.posting-category')?.textContent?.trim() || '';
    description = document.querySelector('.posting-description, .content-wrapper')?.textContent?.trim() || '';

    // Lever commitment (full-time, part-time, etc.)
    const commitment = document.querySelector('.posting-categories .commitment')?.textContent?.trim() || '';

    const fullText = (title + ' ' + description + ' ' + location + ' ' + commitment).toLowerCase();
    jobType = detectJobType(fullText);
  }

  // Remote.co
  else if (url.includes('remote.co')) {
    source = 'Remote.co';
    title = document.querySelector('.job_title, h2')?.textContent?.trim() || '';
    company = document.querySelector('.company_name, .company')?.textContent?.trim() || '';
    location = document.querySelector('.location')?.textContent?.trim() || 'Remote';
    description = document.querySelector('.job_description, .description')?.textContent?.trim() || '';
    jobType = 'remote';
  }

  // We Work Remotely
  else if (url.includes('weworkremotely.com')) {
    source = 'We Work Remotely';
    title = document.querySelector('h1.listing-header-container__title')?.textContent?.trim() || '';
    company = document.querySelector('.listing-header-container__company')?.textContent?.trim() || '';
    location = document.querySelector('.listing-header-container__location')?.textContent?.trim() || 'Remote';
    description = document.querySelector('.listing-container__description')?.textContent?.trim() || '';
    jobType = 'remote';
  }

  // AngelList / Wellfound
  else if (url.includes('angel.co') || url.includes('wellfound.com')) {
    source = 'Wellfound';
    title = document.querySelector('h1[data-test="JobTitle"]')?.textContent?.trim() || '';
    company = document.querySelector('[data-test="StartupNameLink"]')?.textContent?.trim() || '';
    location = document.querySelector('[data-test="JobLocation"]')?.textContent?.trim() || '';
    salary = document.querySelector('[data-test="SalaryRange"]')?.textContent?.trim() || '';
    description = document.querySelector('[data-test="JobDescription"]')?.textContent?.trim() || '';

    const fullText = (title + ' ' + description + ' ' + location).toLowerCase();
    jobType = detectJobType(fullText);
  }

  // Dice (tech jobs)
  else if (url.includes('dice.com')) {
    source = 'Dice';
    title = document.querySelector('h1.jobTitle, [data-cy="jobTitle"]')?.textContent?.trim() || '';
    company = document.querySelector('.employer, [data-cy="companyName"]')?.textContent?.trim() || '';
    location = document.querySelector('.location, [data-cy="location"]')?.textContent?.trim() || '';
    salary = document.querySelector('.compensation, [data-cy="compensation"]')?.textContent?.trim() || '';
    description = document.querySelector('.description, [data-cy="jobDescription"]')?.textContent?.trim() || '';

    const fullText = (title + ' ' + description + ' ' + location).toLowerCase();
    jobType = detectJobType(fullText);
  }

  // Generic fallback for unknown sites
  else {
    source = extractDomainName(url);

    // Try to find title
    const headings = document.querySelectorAll('h1, h2, [class*="title"], [class*="job"], [class*="position"]');
    for (const heading of headings) {
      const text = heading.textContent?.trim();
      if (text && text.length > 5 && text.length < 150) {
        title = text;
        break;
      }
    }

    // Try to find company
    const companyElements = document.querySelectorAll('[class*="company"], [class*="employer"], [class*="organization"]');
    for (const el of companyElements) {
      const text = el.textContent?.trim();
      if (text && text.length > 2 && text.length < 100) {
        company = text;
        break;
      }
    }

    // Try to find location
    const locationElements = document.querySelectorAll('[class*="location"], [class*="city"], [class*="remote"]');
    for (const el of locationElements) {
      const text = el.textContent?.trim();
      if (text && text.length > 2 && text.length < 100) {
        location = text;
        break;
      }
    }

    // Try to find salary
    const salaryElements = document.querySelectorAll('[class*="salary"], [class*="compensation"], [class*="pay"]');
    for (const el of salaryElements) {
      const text = el.textContent?.trim();
      if (text && (text.includes('$') || text.includes('k') || text.includes('year'))) {
        salary = text;
        break;
      }
    }

    // Get description (limited to avoid too much text)
    const descriptionElements = document.querySelectorAll('[class*="description"], [class*="detail"], [id*="description"]');
    if (descriptionElements.length > 0) {
      description = descriptionElements[0].textContent?.trim().substring(0, 2000) || '';
    } else {
      const bodyText = document.body.textContent?.trim();
      description = bodyText ? bodyText.substring(0, 1000) : '';
    }

    const fullText = (title + ' ' + description + ' ' + location).toLowerCase();
    jobType = detectJobType(fullText);
  }

  // Clean up extracted data
  title = cleanText(title) || document.title;
  company = cleanText(company) || extractDomainName(url);
  location = cleanText(location);
  salary = cleanText(salary);
  description = cleanText(description);

  return {
    title,
    company,
    description,
    location,
    salary,
    jobType,
    postedDate,
    source
  };
}

// Detect job type from text content
function detectJobType(text) {
  const remotePhrases = ['remote', 'work from home', 'wfh', 'telecommute', 'anywhere', 'distributed'];
  const hybridPhrases = ['hybrid', 'flexible location', 'remote/office', 'office/remote'];
  const onsitePhrases = ['on-site', 'onsite', 'in-office', 'office-based'];

  // Check hybrid first (more specific)
  if (hybridPhrases.some(phrase => text.includes(phrase))) {
    return 'hybrid';
  }

  // Then remote
  if (remotePhrases.some(phrase => text.includes(phrase))) {
    return 'remote';
  }

  // Then onsite
  if (onsitePhrases.some(phrase => text.includes(phrase))) {
    return 'onsite';
  }

  return 'unknown';
}

// Parse relative date strings like "Posted 2 days ago"
function parseRelativeDate(text) {
  const now = new Date();

  if (text.includes('today') || text.includes('just posted')) {
    return now.toISOString();
  }

  const hoursMatch = text.match(/(\d+)\s*hour/i);
  if (hoursMatch) {
    now.setHours(now.getHours() - parseInt(hoursMatch[1]));
    return now.toISOString();
  }

  const daysMatch = text.match(/(\d+)\s*day/i);
  if (daysMatch) {
    now.setDate(now.getDate() - parseInt(daysMatch[1]));
    return now.toISOString();
  }

  const weeksMatch = text.match(/(\d+)\s*week/i);
  if (weeksMatch) {
    now.setDate(now.getDate() - (parseInt(weeksMatch[1]) * 7));
    return now.toISOString();
  }

  return null;
}

// Clean text by removing extra whitespace and unwanted characters
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\n\r\t]+/g, ' ')
    .trim();
}

// Extract domain name from URL
function extractDomainName(url) {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts[parts.length - 2].charAt(0).toUpperCase() + parts[parts.length - 2].slice(1);
    }
    return hostname;
  } catch {
    return '';
  }
}
