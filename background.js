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
  getCurrentTabDomain((currentDomain) => {
    checkDataBreach(currentDomain);
  });
}, { url: [{ urlMatches: 'http://*/*' }, { urlMatches: 'https://*/*' }] });

// Function to send a message to the content script to remove consent and cookie elements
function sendMessageToRemoveConsentAndCookieElements(tabId) {
  chrome.tabs.sendMessage(tabId, {action: "removeConsentAndCookieElements"}, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Error sending message to content script:", chrome.runtime.lastError);
    } else if (response && response.status === "success") {
      console.log("Successfully called removeConsentAndCookieElements in content script");
    }
  });
}

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

function getAdvertisingSwitchState(callback) {
  chrome.storage.sync.get('advertising-switch', (result) => {
    if (chrome.runtime.lastError) {
      console.error('Error retrieving advertising-switch state:', chrome.runtime.lastError);
      callback(null);
    } else {
      callback(result['advertising-switch']);
    }
  });
}

function getAnalyticsSwitchState(callback) {
  chrome.storage.sync.get('analytics-switch', (result) => {
    if (chrome.runtime.lastError) {
      console.error('Error retrieving analytics-switch state:', chrome.runtime.lastError);
      callback(null);
    } else {
      callback(result['analytics-switch']);
    }
  });
}

function getTrackingSwitchState(callback) {
  chrome.storage.sync.get('tracking-switch', (result) => {
    if (chrome.runtime.lastError) {
      console.error('Error retrieving tracking-switch state:', chrome.runtime.lastError);
      callback(null);
    } else {
      callback(result['tracking-switch']);
    }
  });
}

function getLocationSwitchState(callback) {
  chrome.storage.sync.get('location-switch', (result) => {
    if (chrome.runtime.lastError) {
      console.error('Error retrieving location-switch state:', chrome.runtime.lastError);
      callback(null);
    } else {
      callback(result['location-switch']);
    }
  });
}

chrome.cookies.onChanged.addListener((changeInfo) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = new URL(tabs[0].url);
    const domain = url.hostname;
    chrome.storage.sync.get('blockedDomains', (result) => {
      const blockedDomains = result.blockedDomains || [];
      console.log('Blocked domains from background.js:', blockedDomains);
      if (blockedDomains.includes(domain)) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "removeConsentAndCookieElements"}, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error sending message to content script:", chrome.runtime.lastError);
          } else if (response && response.status === "success") {
            console.log("Successfully called removeConsentAndCookieElements in content script");
          }
        });
        // Perform actions when the "block all" switch +is enabled
        if (!changeInfo.removed) {
          const cookie = changeInfo.cookie;
          getCurrentTabDomain((currentDomain) => {
            if (currentDomain && !isCurrentDomainOrGoogleCookie(cookie, currentDomain) 
              && !cookie.name.toLowerCase().includes("auth")
              && !cookie.name.toLowerCase().includes("sess")
              && !cookie.name.toLowerCase().includes("sid")) {
              chrome.cookies.remove({
                url: `https://${cookie.domain}${cookie.path}`,
                name: cookie.name
              }, () => {
                if (chrome.runtime.lastError) {
                  console.error("Error removing cookie:", chrome.runtime.lastError);
                } else {
                  console.log(`Different domain cookie removed: ${cookie.name} from ${cookie.domain} with value: ${cookie.value}`);
                }
              });
            }
          });
      
          if (isUnwantedCookie(cookie)) {
            // Remove the cookie if it is an advertising cookie
            getCurrentTabDomain((currentDomain) => {
              if (currentDomain && !isCurrentDomainOrGoogleCookie(cookie, currentDomain)) {
                chrome.cookies.remove({
                  url: `https://${cookie.domain}${cookie.path}`,
                  name: cookie.name
                }, () => {
                  if (chrome.runtime.lastError) {
                    console.error("Error removing cookie:", chrome.runtime.lastError);
                  } else {
                    console.log(`Advertising cookie removed: ${cookie.name}  from ${cookie.domain} with value: ${cookie.value}`);
                  }
                });
              }
            });
          }
        }
        console.log('Block all switch is enabled');
      } else if (!changeInfo.removed) {
        getAdvertisingSwitchState((isAdvertising) => {
          if (isAdvertising) {
            if (isAdvertisingCookie(changeInfo.cookie)) {
              chrome.cookies.remove({
                url: `https://${changeInfo.cookie.domain}${changeInfo.cookie.path}`,
                name: changeInfo.cookie.name
              }, () => {
                if (chrome.runtime.lastError) {
                  console.error("Error removing advertising cookie:", chrome.runtime.lastError);
                } else {
                  console.log(`Advertising cookie removed: ${changeInfo.cookie.name} from ${changeInfo.cookie.domain} with value: ${changeInfo.cookie.value}`);
                }
              });
            }
            console.log('Advertising switch enabled');
          } else {
            console.log('Advertising switch disabled');
          }
        });
        getAnalyticsSwitchState((isAnalytics) => {
          if (isAnalytics) {
            if (isAnalyticsCookie(changeInfo.cookie)) {
              chrome.cookies.remove({
                url: `https://${changeInfo.cookie.domain}${changeInfo.cookie.path}`,
                name: changeInfo.cookie.name
              }, () => {
                if (chrome.runtime.lastError) {
                  console.error("Error removing analytics cookie:", chrome.runtime.lastError);
                } else {
                  console.log(`Analytics cookie removed: ${changeInfo.cookie.name} from ${changeInfo.cookie.domain} with value: ${changeInfo.cookie.value}`);
                }
              });
            }
            console.log('Analytics switch enabled');
          } else {
            console.log('Analytics switch disabled');
          }
        });
        getTrackingSwitchState((isTracking) => {
          if (isTracking) {
            if (isTrackingCookie(changeInfo.cookie)) {
              chrome.cookies.remove({
                url: `https://${changeInfo.cookie.domain}${changeInfo.cookie.path}`,
                name: changeInfo.cookie.name
              }, () => {
                if (chrome.runtime.lastError) {
                  console.error("Error removing tracking cookie:", chrome.runtime.lastError);
                } else {
                  console.log(`Tracking cookie removed: ${changeInfo.cookie.name} from ${changeInfo.cookie.domain} with value: ${changeInfo.cookie.value}`);
                }
              });
            }
            console.log('Tracking switch enabled');
          } else {
            console.log('Tracking switch disabled');
          }
        });
        getLocationSwitchState((isLocation) => {
          if (isLocation) {
            if (changeInfo.cookie.name.toLowerCase().includes("location")) {
              chrome.cookies.remove({
                url: `https://${changeInfo.cookie.domain}${changeInfo.cookie.path}`,
                name: changeInfo.cookie.name
              }, () => {
                if (chrome.runtime.lastError) {
                  console.error("Error removing location cookie:", chrome.runtime.lastError);
                } else {
                  console.log(`Location cookie removed: ${changeInfo.cookie.name} from ${changeInfo.cookie.domain} with value: ${changeInfo.cookie.value}`);
                }
              });
            }
            console.log('Location switch enabled');
          } else {
            console.log('Location switch disabled');
          }
        });
      }
    });
  });
});

function processAllCookies() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = new URL(tabs[0].url);
    const domain = url.hostname;

    // Handle blocking cookies for the current domain
    chrome.storage.sync.get('blockedDomains', (result) => {
      let blockedDomains = result.blockedDomains || [];
      // Add the domain to the blocked list
      chrome.storage.sync.get('visitedDomains', (alreadyVisited) => {
        let visitedDomains = alreadyVisited.visitedDomains || [];
        if (!blockedDomains.includes(domain)) {
          if (!visitedDomains.includes(domain)) {
            blockedDomains.push(domain);
            visitedDomains.push(domain);
            chrome.storage.sync.set({ visitedDomains: visitedDomains }, () => {});
            chrome.storage.sync.set({ blockedDomains: blockedDomains }, () => {});
          }
        }
      });
    });
  });
}


// Funcție care verifică dacă un cookie este de advertising
function isUnwantedCookie(cookie) {
  // Aici definești criteriile pentru cookie-urile de advertising.
  const advertisingKeywords = ["ad", "tracker", "marketing", "_ga", "gid", "gpi", "gcl", "gckp", "gs", "debug", "gads", "fbp", "fr", " fbc",
    "cto_bundle", "ide", "uetsid", "uetvid", "track", "tr", "cm360", "drt", "anj", "uid", "apmplitude",
    "rtn1-z", "analytics", "doubleclick", "pixel", "utm", "retarget", "facebook", "criteo", "bing",
    "cb", "eoi", "bts", "cb", "cookie", "bounce"
  ];
  const domainKeywords = [".doubleclick.net", ".googleadservices.com", "facebook.com", "criteo.com", "bing.com",
    "adnxs.com", "adsrvr.org", "adform.net", "adnxs.com", "advertising.com",
    "adsymptotic.com", "adtech.com", "adtechus.com", "advertising.com", "advertising.com", "adsrvr.org",
    "rubiconproject.com"
  ];
  
  // console.log(cookie.domain);

  const cookieName = cookie.name.toLowerCase();
  const cookieValue = cookie.value.toLowerCase();
  const cookieDomain = cookie.domain.toLowerCase();

  if (cookieName.includes("gaps")) {
    return false;
  }

  return advertisingKeywords.some(keyword => cookieName.includes(keyword))
  || domainKeywords.some(domainKeyword => cookieDomain.includes(domainKeyword));
}



function isAdvertisingCookie(cookie) {
  const advertisingKeywords = [
    "ad", "marketing", "gads", "fbp", "fr", "fbc", "cto_bundle", "ide", "anj", 
    "uid", "rtn1-z", "doubleclick", "facebook", "criteo", "bing", "cm360", 
    "drt", "pixel", "retarget", "advertising", "eoi", "adtracker"
  ];
  
  const advertisingDomainKeywords = [
    ".doubleclick.net", ".googleadservices.com", "facebook.com", "criteo.com", 
    "bing.com", "advertising.com", "adtech.com", "adform.net", 
    "rubiconproject.com"
  ];

  const cookieName = cookie.name.toLowerCase();
  const cookieDomain = cookie.domain.toLowerCase();

  return advertisingKeywords.some(keyword => cookieName.includes(keyword))
    || advertisingDomainKeywords.some(domainKeyword => cookieDomain.includes(domainKeyword));
}

function isTrackingCookie(cookie) {
  // Tracking Keywords and Domain Keywords
  const trackingKeywords = [
    "tracker", "track", "tr", "uid", "cm360", "debug", "criteo", "anj"
  ];

  const trackingDomainKeywords = [
    ".adnxs.com", ".adsrvr.org", ".adsymptotic.com"
  ];

  const cookieName = cookie.name.toLowerCase();
  const cookieDomain = cookie.domain.toLowerCase();

  return trackingKeywords.some(keyword => cookieName.includes(keyword))
    || trackingDomainKeywords.some(domainKeyword => cookieDomain.includes(domainKeyword));
}

function isAnalyticsCookie(cookie) {
  // Analytics Keywords and Domain Keywords
  const analyticsKeywords = [
    "_ga", "gid", "gpi", "gcl", "gckp", "debug", "analytics", "amplitude", 
    "utm", "cookie", "bounce"
  ];
  
  const analyticsDomainKeywords = [
    ".analytics.google.com", ".mixpanel.com", ".amplitude.com"
  ];

  const cookieName = cookie.name.toLowerCase();
  const cookieDomain = cookie.domain.toLowerCase();

  return analyticsKeywords.some(keyword => cookieName.includes(keyword))
    || analyticsDomainKeywords.some(domainKeyword => cookieDomain.includes(domainKeyword));
}

async function checkDataBreach(domain) {
  const apiKey = "ab62cea28a114653909fa9ef1547d590";
  const url = `https://haveibeenpwned.com/api/v3/breaches?domain=${domain}`;

  try {
    const response = await fetch(url, {
      headers: {
        "hibp-api-key": apiKey,
        "Accept": "application/json"
      }
    });

    if (response.status === 200) {
      const data = await response.json();
      if (data.length > 0) {
        const breaches = data.map(breach => `${breach.Name} (Data: ${breach.BreachDate})`).join("\n");
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon16.png", // Replace with the path to your extension's icon
          title: `Site-ul ${domain} a fost compromis`,
          message: `Site-ul ${domain} a fost compromis în următoarele breșe de securitate:\n${breaches}`
        });
      } else {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon16.png", // Replace with the path to your extension's icon
          title: `Site-ul ${domain}`,
          message: `Site-ul ${domain} NU apare în breșele de securitate cunoscute.`
        });
      }
    } else if (response.status === 404) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon16.png", // Replace with the path to your extension's icon
        title: `Site-ul ${domain}`,
        message: `Site-ul ${domain} NU apare în breșele de securitate cunoscute.`
      });
    } else {
      console.error("Eroare la verificare:", response.status);
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon16.png", // Replace with the path to your extension's icon
        title: "Eroare la verificare",
        message: "A apărut o eroare la verificarea breșelor de securitate."
      });
    }
  } catch (error) {
    console.error("Eroare:", error);
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon16.png", // Replace with the path to your extension's icon
      title: "Eroare",
      message: "Nu s-a putut verifica starea site-ului."
    });
  }
}