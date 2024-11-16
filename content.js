// Function to remove elements related to cookie consent and restore scrolling
function removeConsentAndCookieElements() {
    console.log("Running removeConsentAndCookieElements function");
  
    // Select elements by common attributes used in cookie consent popups
    const consentElements = document.querySelectorAll(
      'div[id*="consent"], div[id*="cookie"], div[id*="termsfeed"], [role="dialog"], .cookie-consent, .cookie-banner, .cookie-popup, .consent-banner, .consent-popup'
    );
  
    console.log(`Found ${consentElements.length} elements related to consent or cookies`);
    consentElements.forEach(element => {
      element.remove();
      console.log(`Removed element with id: ${element.id} and class: ${element.className}`);
    });
  
  // Remove overflow: hidden and visibility: hidden from the body element
  if (document.body.style.overflow === 'hidden') {
    document.body.style.overflow = '';
    console.log('Removed overflow: hidden from body');
  }
  if (document.body.style.visibility === 'hidden') {
    document.body.style.visibility = '';
    console.log('Removed visibility: hidden from body');
  }

  // Check and remove overflow: hidden and visibility: hidden from any parent elements
  let parent = document.body.parentElement;
  while (parent) {
    if (parent.style.overflow === 'hidden') {
      parent.style.overflow = '';
      console.log('Removed overflow: hidden from parent element');
    }
    if (parent.style.visibility === 'hidden') {
      parent.style.visibility = '';
      console.log('Removed visibility: hidden from parent element');
    }
    parent = parent.parentElement;
  }
  }

  document.body.style.overflow = 'auto';
  document.documentElement.style.overflow = 'auto';
  
  // Log to verify that the content script is loaded
  console.log("Content script loaded");
  
  // Run the function when the content script is loaded
  removeConsentAndCookieElements();
  
  // Also run the function when the page is fully loaded
  window.addEventListener('load', () => {
    console.log("Page fully loaded");
    removeConsentAndCookieElements();
  });
  
  // Set up a MutationObserver to watch for changes in the DOM
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        removeConsentAndCookieElements();
      }
    });
  });
  
  // Start observing the document for changes
  observer.observe(document.body, { childList: true, subtree: true });