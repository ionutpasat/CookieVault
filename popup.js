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


// Select the elements
const slider = document.querySelector('.slider');
const leftSelector = document.querySelector('.left-selector');
const rightSelector = document.querySelector('.right-selector');

// Set default position for the slider
slider.style.transform = 'translateX(0)'; // Initially under the left selector

// Add click event listener for the left selector
// Select the block-all-cookies container
// Select the block-all-cookies container
const switchGridContainer = document.querySelector('.switch-grid');
const blockAllCookiesContainer = document.querySelector('.block-all-cookies');

// Add click event listener for the left selector
leftSelector.addEventListener('click', function () {
  // Move slider to the left
  slider.style.transform = 'translateX(0)';
  // Update selected states
  leftSelector.classList.add('selected');
  rightSelector.classList.remove('selected');
  
  // Show the "block all cookies" button when 'this site' is selected
  blockAllCookiesContainer.classList.remove('hide');
  
  // Hide the 2x2 grid of switches when 'this site' is selected
  switchGridContainer.classList.add('hide');
});

// Add click event listener for the right selector (all sites selected)
rightSelector.addEventListener('click', function () {
  // Move slider to the right
  slider.style.transform = 'translateX(100%)'; // 100% matches the width of one button
  // Update selected states
  rightSelector.classList.add('selected');
  leftSelector.classList.remove('selected');
  
  // Hide the "block all cookies" button when 'all sites' is selected
  blockAllCookiesContainer.classList.add('hide');
  
  // Show the 2x2 grid of switches when 'all sites' is selected
  switchGridContainer.classList.remove('hide');
});



document.addEventListener('DOMContentLoaded', () => {
  const deleteAllButton = document.getElementById('delete-all-button');
  deleteAllButton.addEventListener('click', removeAllCookies);

  loadCookies();
});

// Function to toggle blocking cookies
function toggleBlockCookies() {
  const isBlocked = document.getElementById('block-all-switch').checked;

  if (isBlocked) {
    // If checked, block all cookies (you can customize this logic further)
    chrome.cookies.getAll({}, (cookies) => {
      cookies.forEach((cookie) => {
        chrome.cookies.remove({
          url: `https://${cookie.domain}${cookie.path}`,
          name: cookie.name,
        });
      });
    });
  } else {
    // If unchecked, allow cookies (you can customize this logic further if needed)
    console.log('Allow cookies'); // This could be an extension feature to track cookie behavior
  }
}

// Event listener for the block cookies switch
document.getElementById('block-all-switch').addEventListener('change', toggleBlockCookies);