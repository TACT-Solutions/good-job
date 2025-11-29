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

  if (url.includes('linkedin.com/jobs')) {
    title = document.querySelector('.job-details-jobs-unified-top-card__job-title')?.textContent?.trim() || '';
    company = document.querySelector('.job-details-jobs-unified-top-card__company-name')?.textContent?.trim() || '';
    description = document.querySelector('.jobs-description__content')?.textContent?.trim() || '';
  }
  else if (url.includes('indeed.com')) {
    title = document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]')?.textContent?.trim() ||
            document.querySelector('.jobsearch-JobInfoHeader-title')?.textContent?.trim() || '';
    company = document.querySelector('[data-testid="inlineHeader-companyName"]')?.textContent?.trim() ||
              document.querySelector('.jobsearch-InlineCompanyRating-companyHeader')?.textContent?.trim() || '';
    description = document.querySelector('#jobDescriptionText')?.textContent?.trim() || '';
  }
  else if (url.includes('greenhouse.io')) {
    title = document.querySelector('.app-title')?.textContent?.trim() || '';
    company = document.querySelector('.company-name')?.textContent?.trim() || '';
    description = document.querySelector('#content')?.textContent?.trim() || '';
  }
  else if (url.includes('lever.co')) {
    title = document.querySelector('.posting-headline h2')?.textContent?.trim() || '';
    company = document.querySelector('.main-header-text a')?.textContent?.trim() || '';
    description = document.querySelector('.posting-description')?.textContent?.trim() || '';
  }
  else {
    const headings = document.querySelectorAll('h1, h2, [class*="title"], [class*="job"]');
    for (const heading of headings) {
      const text = heading.textContent?.trim();
      if (text && text.length > 5 && text.length < 100) {
        title = text;
        break;
      }
    }

    const companyElements = document.querySelectorAll('[class*="company"], [class*="employer"]');
    for (const el of companyElements) {
      const text = el.textContent?.trim();
      if (text && text.length > 2 && text.length < 50) {
        company = text;
        break;
      }
    }

    const bodyText = document.body.textContent?.trim();
    description = bodyText ? bodyText.substring(0, 1000) : '';
  }

  return {
    title: title || document.title,
    company: company || extractDomainName(url),
    description: description
  };
}

function extractDomainName(url) {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }
    return hostname;
  } catch {
    return '';
  }
}
