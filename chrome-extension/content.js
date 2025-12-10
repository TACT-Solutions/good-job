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
    console.log('[GoodJob] Extracting LinkedIn job data from:', url);

    // Title - multiple selectors
    title = trySelectors([
      '.job-details-jobs-unified-top-card__job-title',
      '.jobs-unified-top-card__job-title',
      '.t-24.t-bold',
      '.job-details-jobs-unified-top-card__job-title h1',
      '.jobs-unified-top-card__job-title h1',
      'h1.jobs-unified-top-card__job-title',
      '[data-anonymize="job-title"]'
    ]);

    // Company - multiple selectors
    company = trySelectors([
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name',
      '.app-aware-link',
      '.job-details-jobs-unified-top-card__primary-description a',
      '.jobs-unified-top-card__subtitle-primary-grouping a',
      '.jobs-company__name',
      '[data-anonymize="company-name"]'
    ]);

    // Location - multiple selectors
    location = trySelectors([
      '.job-details-jobs-unified-top-card__bullet',
      '.jobs-unified-top-card__bullet',
      '.jobs-unified-top-card__workplace-type'
    ]);

    // Description - multiple selectors
    description = trySelectors([
      '.jobs-description__content',
      '.jobs-box__html-content',
      '.jobs-description',
      '.jobs-description-content__text',
      '.show-more-less-html__markup',
      '#job-details',
      '[data-job-details]'
    ]);

    // Salary - multiple approaches
    // Try direct selectors first
    const salarySelectors = [
      '.job-details-jobs-unified-top-card__job-insight',
      '.jobs-unified-top-card__job-insight',
      '.job-details-jobs-unified-top-card__job-insight--highlight',
      '.salary-main-rail__salary-info'
    ];

    for (const selector of salarySelectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        const text = el.textContent?.trim() || '';
        if (text.includes('$') || text.includes('€') || text.includes('£') || text.toLowerCase().includes('salary')) {
          salary = text;
          break;
        }
      }
      if (salary) break;
    }

    // If no salary found, parse from description
    if (!salary && description) {
      salary = extractSalaryFromText(description);
    }

    // Job type detection
    const fullText = (title + ' ' + description + ' ' + location).toLowerCase();
    jobType = detectJobType(fullText);
  }

  // Indeed
  else if (url.includes('indeed.com')) {
    source = 'Indeed';

    title = trySelectors([
      '[data-testid="jobsearch-JobInfoHeader-title"]',
      '.jobsearch-JobInfoHeader-title',
      'h1.icl-u-xs-mb--xs'
    ]);

    company = trySelectors([
      '[data-testid="inlineHeader-companyName"]',
      '.jobsearch-InlineCompanyRating-companyHeader',
      '[data-company-name="true"]'
    ]);

    location = trySelectors([
      '[data-testid="job-location"]',
      '.jobsearch-JobInfoHeader-subtitle [data-testid="text-location"]',
      '.jobsearch-JobInfoHeader-subtitle'
    ]);

    description = trySelectors([
      '#jobDescriptionText',
      '.jobsearch-JobComponent-description',
      '.jobsearch-jobDescriptionText'
    ]);

    // Salary - multiple selectors
    salary = trySelectors([
      '[data-testid="jobsearch-JobMetadataHeader-item"]',
      '.jobsearch-JobMetadataHeader-item',
      '.metadata.salary-snippet-container',
      '.salaryInfoAndJobContainer'
    ]);

    // Fallback to description parsing
    if (!salary && description) {
      salary = extractSalaryFromText(description);
    }

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

    title = trySelectors([
      '[data-test="job-title"]',
      '.JobDetails_jobTitle__Rw_gn',
      'h1[class*="jobTitle"]'
    ]);

    company = trySelectors([
      '[data-test="employer-name"]',
      '.EmployerProfile_employerName__Xemli',
      '[data-test="employerName"]'
    ]);

    location = trySelectors([
      '[data-test="location"]',
      '.JobDetails_location__mSg5h',
      '[data-test="emp-location"]'
    ]);

    description = trySelectors([
      '[data-test="jobDescriptionText"]',
      '.JobDetails_jobDescription__uW_fK',
      '[class*="jobDescription"]'
    ]);

    salary = trySelectors([
      '[data-test="detailSalary"]',
      '.JobDetails_salary__6y4Sn',
      '[data-test="payPeriod"]'
    ]);

    if (!salary && description) {
      salary = extractSalaryFromText(description);
    }

    const fullText = (title + ' ' + description + ' ' + location).toLowerCase();
    jobType = detectJobType(fullText);
  }

  // ZipRecruiter
  else if (url.includes('ziprecruiter.com')) {
    source = 'ZipRecruiter';

    title = trySelectors([
      'h1.job_title',
      '[data-testid="jobTitle"]',
      'h1[class*="title"]'
    ]);

    company = trySelectors([
      '.hiring_company_text',
      '[data-testid="companyName"]',
      'a[class*="company"]'
    ]);

    location = trySelectors([
      '.location',
      '[data-testid="jobLocation"]',
      '[class*="location"]'
    ]);

    description = trySelectors([
      '.job_description',
      '[data-testid="jobDescription"]',
      '[class*="description"]'
    ]);

    salary = trySelectors([
      '.compensation',
      '[data-testid="compensation"]',
      '[class*="salary"]'
    ]);

    if (!salary && description) {
      salary = extractSalaryFromText(description);
    }

    const fullText = (title + ' ' + description + ' ' + location).toLowerCase();
    jobType = detectJobType(fullText);
  }

  // Monster
  else if (url.includes('monster.com')) {
    source = 'Monster';

    title = trySelectors([
      'h1[data-test-id="svx-job-title"]',
      'h1[class*="title"]'
    ]);

    company = trySelectors([
      '[data-test-id="svx-job-header-company-name"]',
      '[class*="company"]'
    ]);

    location = trySelectors([
      '[data-test-id="svx-job-header-location"]',
      '[class*="location"]'
    ]);

    description = trySelectors([
      '[data-test-id="svx-job-description-text"]',
      '[class*="description"]'
    ]);

    salary = trySelectors([
      '[data-test-id="svx-job-header-salary"]',
      '[class*="salary"]'
    ]);

    if (!salary && description) {
      salary = extractSalaryFromText(description);
    }

    const fullText = (title + ' ' + description + ' ' + location).toLowerCase();
    jobType = detectJobType(fullText);
  }

  // Greenhouse
  else if (url.includes('greenhouse.io') || url.includes('boards.greenhouse.io')) {
    source = 'Greenhouse';

    title = trySelectors([
      '.app-title',
      'h1.app-title',
      'h1[class*="title"]'
    ]);

    company = trySelectors([
      '.company-name',
      '[class*="company"]'
    ]);

    location = trySelectors([
      '.location',
      '[class*="location"]'
    ]);

    description = trySelectors([
      '#content',
      '.body',
      '[class*="description"]'
    ]);

    // Greenhouse rarely shows salary upfront, parse from description
    if (description) {
      salary = extractSalaryFromText(description);
      location = location || extractLocationFromText(description);
    }

    const fullText = (title + ' ' + description + ' ' + location).toLowerCase();
    jobType = detectJobType(fullText);
  }

  // Lever
  else if (url.includes('lever.co') || url.includes('jobs.lever.co')) {
    source = 'Lever';

    title = trySelectors([
      '.posting-headline h2',
      'h2[class*="title"]'
    ]);

    company = trySelectors([
      '.main-header-text a',
      '[class*="company"]'
    ]);

    location = trySelectors([
      '.posting-categories .location',
      '.sort-by-time.posting-category',
      '[class*="location"]'
    ]);

    description = trySelectors([
      '.posting-description',
      '.content-wrapper',
      '[class*="description"]'
    ]);

    const commitment = document.querySelector('.posting-categories .commitment')?.textContent?.trim() || '';

    // Lever rarely shows salary, parse from description
    if (description) {
      salary = extractSalaryFromText(description);
    }

    const fullText = (title + ' ' + description + ' ' + location + ' ' + commitment).toLowerCase();
    jobType = detectJobType(fullText);
  }

  // Remote.co
  else if (url.includes('remote.co')) {
    source = 'Remote.co';

    title = trySelectors([
      '.job_title',
      'h2',
      '[class*="title"]'
    ]);

    company = trySelectors([
      '.company_name',
      '.company',
      '[class*="company"]'
    ]);

    location = trySelectors([
      '.location',
      '[class*="location"]'
    ]) || 'Remote';

    description = trySelectors([
      '.job_description',
      '.description',
      '[class*="description"]'
    ]);

    if (description) {
      salary = extractSalaryFromText(description);
    }

    jobType = 'remote';
  }

  // We Work Remotely
  else if (url.includes('weworkremotely.com')) {
    source = 'We Work Remotely';

    title = trySelectors([
      'h1.listing-header-container__title',
      'h1[class*="title"]'
    ]);

    company = trySelectors([
      '.listing-header-container__company',
      '[class*="company"]'
    ]);

    location = trySelectors([
      '.listing-header-container__location',
      '[class*="location"]'
    ]) || 'Remote';

    description = trySelectors([
      '.listing-container__description',
      '[class*="description"]'
    ]);

    if (description) {
      salary = extractSalaryFromText(description);
    }

    jobType = 'remote';
  }

  // AngelList / Wellfound
  else if (url.includes('angel.co') || url.includes('wellfound.com')) {
    source = 'Wellfound';

    title = trySelectors([
      'h1[data-test="JobTitle"]',
      'h1[class*="title"]'
    ]);

    company = trySelectors([
      '[data-test="StartupNameLink"]',
      '[class*="company"]'
    ]);

    location = trySelectors([
      '[data-test="JobLocation"]',
      '[class*="location"]'
    ]);

    description = trySelectors([
      '[data-test="JobDescription"]',
      '[class*="description"]'
    ]);

    salary = trySelectors([
      '[data-test="SalaryRange"]',
      '[class*="salary"]',
      '[class*="compensation"]'
    ]);

    if (!salary && description) {
      salary = extractSalaryFromText(description);
    }

    const fullText = (title + ' ' + description + ' ' + location).toLowerCase();
    jobType = detectJobType(fullText);
  }

  // Dice (tech jobs)
  else if (url.includes('dice.com')) {
    source = 'Dice';

    title = trySelectors([
      'h1.jobTitle',
      '[data-cy="jobTitle"]',
      'h1[class*="title"]'
    ]);

    company = trySelectors([
      '.employer',
      '[data-cy="companyName"]',
      '[class*="company"]'
    ]);

    location = trySelectors([
      '.location',
      '[data-cy="location"]',
      '[class*="location"]'
    ]);

    description = trySelectors([
      '.description',
      '[data-cy="jobDescription"]',
      '[class*="description"]'
    ]);

    salary = trySelectors([
      '.compensation',
      '[data-cy="compensation"]',
      '[class*="salary"]'
    ]);

    if (!salary && description) {
      salary = extractSalaryFromText(description);
    }

    const fullText = (title + ' ' + description + ' ' + location).toLowerCase();
    jobType = detectJobType(fullText);
  }

  // Generic fallback for unknown sites
  else {
    source = extractDomainName(url);

    // Try to find title
    title = trySelectors([
      'h1',
      'h2',
      '[class*="title"]',
      '[class*="job"]',
      '[class*="position"]'
    ], 5, 150);

    // Try to find company
    company = trySelectors([
      '[class*="company"]',
      '[class*="employer"]',
      '[class*="organization"]'
    ], 2, 100);

    // Try to find location
    location = trySelectors([
      '[class*="location"]',
      '[class*="city"]',
      '[class*="remote"]'
    ], 2, 100);

    // Try to find salary
    salary = trySelectors([
      '[class*="salary"]',
      '[class*="compensation"]',
      '[class*="pay"]'
    ], 0, 200);

    // Get description - allow up to 10k chars for full content
    const descriptionElements = document.querySelectorAll('[class*="description"], [class*="detail"], [id*="description"]');
    if (descriptionElements.length > 0) {
      description = descriptionElements[0].textContent?.trim().substring(0, 10000) || '';
    } else {
      const bodyText = document.body.textContent?.trim();
      description = bodyText ? bodyText.substring(0, 5000) : '';
    }

    // Parse missing fields from description
    if (!salary && description) {
      salary = extractSalaryFromText(description);
    }
    if (!location && description) {
      location = extractLocationFromText(description);
    }

    const fullText = (title + ' ' + description + ' ' + location).toLowerCase();
    jobType = detectJobType(fullText);
  }

  // Log raw extracted data before cleanup (for debugging)
  console.log('[GoodJob] Raw extracted data:', {
    title: title,
    company: company,
    description: description ? description.substring(0, 100) + '...' : '(empty)',
    location: location,
    salary: salary,
    source: source
  });

  // Clean up extracted data
  title = cleanText(title) || document.title;
  company = cleanText(company) || extractDomainName(url);
  location = cleanText(location);
  salary = cleanText(salary);
  description = cleanText(description);

  console.log('[GoodJob] Final cleaned data:', {
    title: title,
    company: company,
    description: description ? description.substring(0, 100) + '...' : '(empty)',
    location: location,
    salary: salary,
    source: source
  });

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

// Helper function to try multiple selectors
function trySelectors(selectors, minLength = 0, maxLength = 10000) {
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const el of elements) {
      const text = el.textContent?.trim();
      if (text && text.length > minLength && text.length < maxLength) {
        return text;
      }
    }
  }
  return '';
}

// Extract salary from text using regex patterns
function extractSalaryFromText(text) {
  if (!text) return '';

  // Patterns to match various salary formats
  const patterns = [
    // $120k - $180k, $120K-$180K
    /\$\s*(\d{1,3})\s*[kK]\s*[-–—]\s*\$?\s*(\d{1,3})\s*[kK]/,
    // $120,000 - $180,000
    /\$\s*(\d{1,3}),(\d{3})\s*[-–—]\s*\$?\s*(\d{1,3}),(\d{3})/,
    // $120000-$180000
    /\$\s*(\d{5,7})\s*[-–—]\s*\$?\s*(\d{5,7})/,
    // $120k/year, $120K per year
    /\$\s*(\d{1,3})\s*[kK]\s*(?:\/|\bper\b)?\s*(?:year|yr|annually)?/i,
    // €80k - €120k (European)
    /€\s*(\d{1,3})\s*[kK]\s*[-–—]\s*€?\s*(\d{1,3})\s*[kK]/,
    // £60k - £90k (UK)
    /£\s*(\d{1,3})\s*[kK]\s*[-–—]\s*£?\s*(\d{1,3})\s*[kK]/,
    // Salary: $120,000
    /(?:salary|compensation|pay)[\s:]+\$\s*(\d{1,3}),?(\d{3})/i,
    // Up to $180k
    /(?:up to|upto)\s+\$\s*(\d{1,3})\s*[kK]/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }

  return '';
}

// Extract location from text
function extractLocationFromText(text) {
  if (!text) return '';

  // Patterns to match location
  const patterns = [
    // "Location: New York, NY"
    /(?:location|based in|office)[\s:]+([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})/i,
    // City, State format
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})\b/,
    // Remote keywords
    /\b(remote|work from home|anywhere|distributed)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1]?.trim() || match[0].trim();
    }
  }

  return '';
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