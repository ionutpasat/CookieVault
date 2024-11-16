// Obține și afișează lista de cookie-uri
function loadCookies() {
  const cookieList = document.getElementById('cookie-list');
  cookieList.innerHTML = "<ul>Loading cookies...</ul>";
  
  // Obține toate cookie-urile pentru domeniul curent
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const url = tabs[0].url;
    chrome.cookies.getAll({url: url}, (cookies) => {
      cookieList.innerHTML = '';  // Golește lista înainte de afișare
      const ul = document.createElement('ul');

      cookies.forEach(cookie => {
        const li = document.createElement('li');
        li.textContent = `${cookie.name} (${cookie.domain})`;

        // Buton pentru ștergerea cookie-ului
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Șterge';
        deleteButton.onclick = () => removeCookie(cookie);

        li.appendChild(deleteButton);
        ul.appendChild(li);
      });

      cookieList.appendChild(ul);
    });
  });
}

// Funcție pentru a șterge un cookie specific
function removeCookie(cookie) {
  const url = `https://${cookie.domain}${cookie.path}`;
  chrome.cookies.remove({
    url: url,
    name: cookie.name
  }, () => {
    if (chrome.runtime.lastError) {
      console.error("Eroare la ștergerea cookie-ului:", chrome.runtime.lastError);
    } else {
      loadCookies();  // Reîncarcă lista după ștergere
    }
  });
}

// Încarcă lista de cookie-uri când se deschide popup-ul
document.addEventListener('DOMContentLoaded', loadCookies);
