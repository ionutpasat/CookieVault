chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
  processAllCookies();
});

chrome.runtime.onStartup.addListener(() => {
  console.log("Extension started");
  processAllCookies();
});

chrome.webNavigation.onCompleted.addListener((details) => {
  processAllCookies();
}, { url: [{ urlMatches: 'http://*/*' }, { urlMatches: 'https://*/*' }] });

// Function to get the domain of the current site
function getCurrentTabDomain(callback) {
  // Query the active tab in the current window
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError) {
      console.error("Runtime error:", chrome.runtime.lastError.message);
      callback(null);
      return;
    }

    if (!tabs || tabs.length === 0) {
      console.error("No active tabs found.");
      callback(null);
      return;
    }

    const tab = tabs[0];
    if (!tab.url) {
      console.error("Tab URL is undefined");
      callback(null);
      return;
    }

    try {
      const url = new URL(tab.url);
      callback(url.hostname);
    } catch (error) {
      console.error("Invalid URL:", tab.url);
      console.error(error);
      callback(null);
    }
  });
}

function isCurrentDomainOrGoogleCookie(cookie, currentDomain) {
  const googleDomains = ["google.com"];
  const cookieDomain = cookie.domain.toLowerCase();

  return googleDomains.some(domain => cookieDomain.includes(domain)) || cookieDomain.includes(currentDomain);
}

chrome.cookies.onChanged.addListener((changeInfo) => {
  if (!changeInfo.removed) {
    const cookie = changeInfo.cookie;
    getCurrentTabDomain((currentDomain) => {
      if (currentDomain && !isCurrentDomainOrGoogleCookie(cookie, currentDomain)) {
        chrome.cookies.remove({
          url: `https://${cookie.domain}${cookie.path}`,
          name: cookie.name
        }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error removing cookie:", chrome.runtime.lastError);
          } else {
            console.log(`Different domain cookie removed: ${cookie.name}`);
          }
        });
      }
    });

    if (isAdvertisingCookie(cookie)) {
      // Remove the cookie if it is an advertising cookie
      chrome.cookies.remove({
        url: `https://${cookie.domain}${cookie.path}`,
        name: cookie.name
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error removing cookie:", chrome.runtime.lastError);
        } else {
          console.log(`Advertising cookie removed: ${cookie.name}`);
        }
      });
    }
  }
});

function processAllCookies() {
  chrome.cookies.getAll({}, (cookies) => {
    cookies.forEach((cookie) => {
      if (isAdvertisingCookie(cookie)) {
        // Remove the cookie if it is an advertising cookie
        chrome.cookies.remove({
          url: `https://${cookie.domain}${cookie.path}`,
          name: cookie.name
        }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error removing cookie:", chrome.runtime.lastError);
          } else {
            console.log(`Advertising cookie removed: ${cookie.name}`);
          }
        });
      }
    });
  });
}


// Funcție care verifică dacă un cookie este de advertising
function isAdvertisingCookie(cookie) {
  // Aici definești criteriile pentru cookie-urile de advertising.
  const advertisingKeywords = ["ad", "tracker", "marketing", "ga", "gid", "gpi", "gcl", "gckp", "gs", "debug", "gads", "fbp", "fr", " fbc",
    "cto_bundle", "ide", "uetsid", "uetvid", "track", "tr", "cm360", "drt", "anj", "sess", "uuid", "uid", "apmplitude",
    "rtn1-z", "analytics", "doubleclick", "pixel", "utm", "retarget", "facebook", "criteo", "bing", "google",
    "cb", "eoi", "bts", "cb"
  ];
  const domainKeywords = [".doubleclick.net", ".googleadservices.com", "facebook.com", "criteo.com", "bing.com",
    "adnxs.com", "adsrvr.org", "adform.net", "adnxs.com", "advertising.com", "advertising.com",
    "adsymptotic.com", "adtech.com", "adtechus.com", "advertising.com", "advertising.com", "adsrvr.org"
  ];

  console.log(cookie.domain);

  const cookieName = cookie.name.toLowerCase();
  const cookieValue = cookie.value.toLowerCase();
  const cookieDomain = cookie.domain.toLowerCase();

  return advertisingKeywords.some(keyword => cookieName.includes(keyword) || cookieValue.includes(keyword))
  || domainKeywords.some(domainKeyword => cookieDomain.includes(domainKeyword));
}
