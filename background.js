chrome.cookies.onChanged.addListener((changeInfo) => {
  if (changeInfo.cause === "explicit" && changeInfo.removed === false) {
    const cookie = changeInfo.cookie;
    if (isAdvertisingCookie(cookie)) {
      // Șterge cookie-ul dacă este de advertising
      chrome.cookies.remove({
        url: `https://${cookie.domain}${cookie.path}`,
        name: cookie.name
      });
    }
    if (isConsentCookie(cookie)) {
      // adauga cookie-ul de consent
      chrome.cookies.set({
        url: `https://${cookie.domain}${cookie.path}`,
        name: cookie.name,
        value: cookie.value
      });
    }
  }
});

// Funcție care verifică dacă un cookie este de advertising
function isAdvertisingCookie(cookie) {
  // Aici definești criteriile pentru cookie-urile de advertising.
  const advertisingKeywords = ["ad", "tracker", "marketing"];
  return advertisingKeywords.some(keyword => cookie.name.includes(keyword));
}

// Funcție care verifică dacă un cookie este de consent
function isConsentCookie(cookie) {
  // Aici definești criteriile pentru cookie-urile de consent.
  const consentKeywords = ["cookie", "consent"];
  return consentKeywords.some(keyword => cookie.name.includes(keyword));
}
