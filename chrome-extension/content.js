chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractJobData') {
    extractJobInfo().then(jobData => {
      sendResponse(jobData);
    });
    return true; // Keep channel open for async response
  }
  return true;
});

async function extractJobInfo() {
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

    // Check if this is a search/listing view (company page jobs, search results, etc.)
    const isSearchView = url.includes('/jobs/search/') || url.includes('currentJobId=');

    if (isSearchView) {
      console.log('[GoodJob] Detected LinkedIn search/listing view (company jobs or search results)');
      console.log('[GoodJob] Waiting 2 seconds for job details panel to load...');

      // For search view, we need to target the job details panel/modal on the right side
      // Wait longer for the dynamic panel to fully render
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('[GoodJob] Starting extraction from search view panel');
    }

    // IMPORTANT: Click "Show more" button to expand full description before extraction
    try {
      const showMoreButton = document.querySelector('.jobs-description__footer-button, .show-more-less-html__button, [aria-label*="more description"]');
      if (showMoreButton && showMoreButton.textContent.toLowerCase().includes('more')) {
        console.log('[GoodJob] Found "Show more" button, clicking to expand description...');
        showMoreButton.click();
        // Wait for content to expand
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('[GoodJob] Description expanded');
      }
    } catch (error) {
      console.log('[GoodJob] No "Show more" button found or already expanded');
    }

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

    // Company - multiple selectors with validation
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

    // VALIDATION: Ensure we didn't extract "LinkedIn" or job board name as company
    if (company && (company.toLowerCase() === 'linkedin' || company.toLowerCase().includes('jobs'))) {
      console.log('[GoodJob] WARNING: Extracted company appears to be platform name:', company);
      // Try alternative selector - look for actual company link
      const companyLink = document.querySelector('.job-details-jobs-unified-top-card__company-name a, .jobs-unified-top-card__company-name a');
      if (companyLink && companyLink.textContent) {
        company = companyLink.textContent.trim();
        console.log('[GoodJob] Corrected company name:', company);
      }
    }

    // Location - multiple selectors (LinkedIn changed structure)
    location = trySelectors([
      '.job-details-jobs-unified-top-card__bullet',
      '.jobs-unified-top-card__bullet',
      '.jobs-unified-top-card__workplace-type',
      '.job-details-jobs-unified-top-card__tertiary-description-container .tvm__text--low-emphasis'
    ]);

    // If we got multiple values (location + other metadata), extract just the location
    if (location && location.includes('·')) {
      // Split by · and take first part (usually the location)
      location = location.split('·')[0].trim();
    }

    // Description - use ID selector (more stable than dynamic classes)
    let descriptionContainer = document.getElementById('job-details');
    if (!descriptionContainer) {
      // Fallback to class selectors
      descriptionContainer = document.querySelector('.jobs-description__content, .jobs-box__html-content, .jobs-description');
    }

    if (descriptionContainer) {
      // Get all text, including hidden elements
      description = descriptionContainer.textContent?.trim() || '';
      console.log('[GoodJob] LinkedIn description extracted, length:', description.length);
    } else {
      // Last resort trySelectors
      description = trySelectors([
        '.jobs-description__content',
        '.jobs-box__html-content',
        '.jobs-description',
        '.jobs-description-content__text',
        '.show-more-less-html__markup',
        '#job-details',
        '[data-job-details]'
      ]);
      console.log('[GoodJob] LinkedIn description via trySelectors, length:', description.length);
    }

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

    // VALIDATION: Ensure we didn't extract platform name
    if (company && (company.toLowerCase() === 'indeed' || company.toLowerCase().includes('jobs'))) {
      console.log('[GoodJob] WARNING: Extracted company appears to be platform name:', company);
      const companyLink = document.querySelector('[data-testid="inlineHeader-companyName"]');
      if (companyLink && companyLink.textContent) {
        company = companyLink.textContent.trim();
        console.log('[GoodJob] Corrected company name:', company);
      }
    }

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

    // VALIDATION: Ensure we didn't extract platform name
    if (company && (company.toLowerCase() === 'glassdoor' || company.toLowerCase().includes('jobs'))) {
      console.log('[GoodJob] WARNING: Extracted company appears to be platform name:', company);
      const companyLink = document.querySelector('[data-test="employer-name"]');
      if (companyLink && companyLink.textContent) {
        company = companyLink.textContent.trim();
        console.log('[GoodJob] Corrected company name:', company);
      }
    }

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

  // VALIDATION: Check description quality
  if (description && !validateContentQuality(description)) {
    console.log('[GoodJob] WARNING: Description failed quality validation');
    description = ''; // Clear invalid description
  }

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

// Filter HTML artifacts and noise from descriptions
function filterHTMLArtifacts(text) {
  if (!text) return '';

  // Remove common button/UI text patterns
  const artifactPatterns = [
    /apply\s+now/gi,
    /share\s+this\s+job/gi,
    /share\s+job/gi,
    /save\s+job/gi,
    /save\s+this\s+job/gi,
    /job\s+alert/gi,
    /sign\s+in\s+to\s+apply/gi,
    /click\s+here\s+to\s+apply/gi,
    /view\s+all\s+jobs/gi,
    /similar\s+jobs/gi,
    /recommended\s+for\s+you/gi,
    /back\s+to\s+search/gi,
    /print\s+job/gi,
    /report\s+job/gi,
  ];

  let cleaned = text;
  for (const pattern of artifactPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  return cleaned;
}

// Validate content quality to prevent garbage data
function validateContentQuality(text) {
  if (!text || text.length < 50) {
    return false; // Too short to be meaningful
  }

  // Check for error messages
  const errorKeywords = [
    'page not found',
    '404 error',
    'sign in required',
    'login required',
    'access denied',
    'permission denied',
    'expired job',
    'job no longer available',
    'this position has been filled',
  ];

  const lowerText = text.toLowerCase();
  for (const keyword of errorKeywords) {
    if (lowerText.includes(keyword)) {
      console.log('[GoodJob] Content validation failed: Found error keyword:', keyword);
      return false;
    }
  }

  // Count words - job descriptions should have at least 20 words
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount < 20) {
    console.log('[GoodJob] Content validation failed: Too few words:', wordCount);
    return false;
  }

  return true;
}

// Deduplicate repeated paragraphs/sentences in descriptions
function deduplicateContent(text) {
  if (!text) return '';

  // Split into paragraphs (separated by double newlines)
  const paragraphs = text.split(/\n\n+/);
  const seen = new Set();
  const unique = [];

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    // Create a normalized version for comparison (lowercase, remove extra spaces)
    const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ');

    // Only add if we haven't seen this paragraph before
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(trimmed);
    }
  }

  return unique.join('\n\n');
}

// Extract structured sections from job description (optional enhancement)
function extractStructuredSections(text) {
  if (!text) return text;

  // Common section headers to identify
  const sectionPatterns = [
    /(?:^|\n)(about (?:us|the company|our company)[:\n])/im,
    /(?:^|\n)(company (?:overview|description)[:\n])/im,
    /(?:^|\n)((?:job )?(?:description|summary|overview)[:\n])/im,
    /(?:^|\n)((?:key )?responsibilities[:\n])/im,
    /(?:^|\n)((?:what you(?:'ll| will) do|your role)[:\n])/im,
    /(?:^|\n)((?:required |minimum )?(?:qualifications|requirements|skills)[:\n])/im,
    /(?:^|\n)((?:preferred |nice to have|bonus)[:\n])/im,
    /(?:^|\n)(benefits[:\n])/im,
    /(?:^|\n)((?:perks|what we offer)[:\n])/im,
    /(?:^|\n)(compensation[:\n])/im,
    /(?:^|\n)((?:how to|to) apply[:\n])/im,
  ];

  // Try to identify sections for better AI parsing
  // This just adds clear markers without restructuring
  let structured = text;

  // Add section markers for easier AI parsing (only if sections exist)
  for (const pattern of sectionPatterns) {
    if (pattern.test(structured)) {
      // Sections detected - AI can parse them
      console.log('[GoodJob] Detected structured sections in description');
      break;
    }
  }

  return structured;
}

// Clean text by normalizing whitespace while preserving structure
function cleanText(text) {
  if (!text) return '';

  // First filter HTML artifacts
  text = filterHTMLArtifacts(text);

  // Deduplicate repeated content
  text = deduplicateContent(text);

  // Extract/preserve structured sections (optional)
  text = extractStructuredSections(text);

  // Then clean whitespace
  return text
    // Normalize multiple spaces/tabs to single space
    .replace(/[ \t]+/g, ' ')
    // Normalize multiple line breaks to maximum 2 (preserve paragraph breaks)
    .replace(/\n{3,}/g, '\n\n')
    // Remove trailing spaces from each line
    .replace(/ +$/gm, '')
    // Remove leading spaces from each line
    .replace(/^ +/gm, '')
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