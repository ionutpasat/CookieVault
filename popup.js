// Șterge toate cookie-urile
function removeAllCookies() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0].url;
    chrome.cookies.getAll({ url: url }, (cookies) => {
      cookies.forEach((cookie) => {
        chrome.cookies.remove({
          url: `https://${cookie.domain}${cookie.path}`,
          name: cookie.name,
        }, () => {
          if (chrome.runtime.lastError) {
            console.error("Eroare la ștergerea cookie-ului:", chrome.runtime.lastError);
          }
        });
      });

      loadCookies(); // Reîncarcă lista după ștergere
    });
  });
}

// Încarcă lista de cookie-uri
function loadCookies() {
  const cookieList = document.getElementById('cookie-list');
  cookieList.innerHTML = "<ul>Încărcăm lista de cookie-uri...</ul>";
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0].url;
    chrome.cookies.getAll({ url: url }, (cookies) => {
      cookieList.innerHTML = ''; // Golește lista înainte de afișare
      const ul = document.createElement('ul');

      if (cookies.length === 0) {
        cookieList.innerHTML = '<p>Nu există cookie-uri pentru acest domeniu.</p>';
        return;
      }

      cookies.forEach((cookie) => {
        const li = document.createElement('li');
        li.textContent = `${cookie.name} (${cookie.domain})`;

        // Buton pentru ștergerea cookie-ului
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Șterge';
        deleteButton.style.marginLeft = '10px';
        deleteButton.onclick = () => removeCookie(cookie);

        li.appendChild(deleteButton);
        ul.appendChild(li);
      });

      cookieList.appendChild(ul);
    });
  });
}

// Funcție pentru ștergerea unui cookie specific
function removeCookie(cookie) {
  const url = `https://${cookie.domain}${cookie.path}`;
  chrome.cookies.remove(
    {
      url: url,
      name: cookie.name,
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error('Eroare la ștergerea cookie-ului:', chrome.runtime.lastError);
      } else {
        loadCookies(); // Reîncarcă lista după ștergere
      }
    }
  );
}

// Adaugă eveniment pentru butonul „Șterge toate cookie-urile”
document.addEventListener('DOMContentLoaded', () => {
  const deleteAllButton = document.getElementById('delete-all-button');
  deleteAllButton.addEventListener('click', removeAllCookies);

  loadCookies();
});
