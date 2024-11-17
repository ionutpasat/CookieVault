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
  // cookieList.innerHTML = "<ul>Încărcăm lista de cookie-uri...</ul>";
  
  // chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  //   const url = tabs[0].url;
  //   chrome.cookies.getAll({ url: url }, (cookies) => {
  //     cookieList.innerHTML = ''; // Golește lista înainte de afișare
  //     const ul = document.createElement('ul');

  //     if (cookies.length === 0) {
  //       cookieList.innerHTML = '<p>Nu există cookie-uri pentru acest domeniu.</p>';
  //       return;
  //     }

  //     cookies.forEach((cookie) => {
  //       const li = document.createElement('li');
  //       li.textContent = `${cookie.name} (${cookie.domain})`;

  //       // Buton pentru ștergerea cookie-ului
  //       const deleteButton = document.createElement('button');
  //       deleteButton.textContent = 'Șterge';
  //       deleteButton.style.marginLeft = '10px';
  //       deleteButton.onclick = () => removeCookie(cookie);

  //       li.appendChild(deleteButton);
  //       ul.appendChild(li);
  //     });

  //     cookieList.appendChild(ul);
  //   });
  // });
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
  if (deleteAllButton) {
    deleteAllButton.addEventListener('click', removeAllCookies);
  }

  loadCookies();
  loadSwitchStates();
});

// Save switch state to chrome.storage
function saveSwitchState(switchId, state) {
  const switchState = {};
  switchState[switchId] = state;
  chrome.storage.sync.set(switchState, () => {
    if (chrome.runtime.lastError) {
      console.error('Eroare la salvarea stării switch-ului:', chrome.runtime.lastError);
    }
  });
}

// Load switch states from chrome.storage
function loadSwitchStates() {
  const switches = document.querySelectorAll('.switch, .grid-switch');
  const blockSwitch = document.querySelectorAll('.block-switch');
  switches.forEach((switchElement) => {
    const switchId = switchElement.id;
    chrome.storage.sync.get(switchId, (result) => {
      if (result[switchId] !== undefined) {
        switchElement.checked = result[switchId];
      }
    });
    switchElement.addEventListener('change', () => {
      saveSwitchState(switchId, switchElement.checked);
      refreshCurrentTab();
    });
  });
  blockSwitch.forEach((blockSwitchElement) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = new URL(tabs[0].url);
      const domain = url.hostname;
      chrome.storage.sync.get('blockedDomains', (result) => {
        const blockedDomains = result.blockedDomains || [];
        console.log('Blocked domains:', blockedDomains);
        if (blockedDomains.includes(domain)) {
          blockSwitchElement.checked = true;
        } else {
          blockSwitchElement.checked = false;
        }
      });
    });
    saveSwitchState(blockSwitchElement.id, blockSwitchElement.checked);
  });
}

// Select the elements
const slider = document.querySelector('.slider');
const leftSelector = document.querySelector('.left-selector');
const rightSelector = document.querySelector('.right-selector');

// Set default position for the slider
slider.style.transform = 'translateX(0)'; // Initially under the left selector

// Add click event listener for the left selector
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

function refreshCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      chrome.tabs.reload(tabs[0].id);
    }
  });
}

// Function to toggle blocking cookies
function toggleBlockCookies() {
  const isBlocked = document.getElementById('block-all-switch').checked;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = new URL(tabs[0].url);
    const domain = url.hostname;

    // Handle blocking cookies for the current domain
    chrome.storage.sync.get('blockedDomains', (result) => {
      let blockedDomains = result.blockedDomains || [];
      if (isBlocked) {
        // Add the domain to the blocked list
        if (!blockedDomains.includes(domain)) {
          blockedDomains.push(domain);
          console.log('Added domain to blocked list:', domain);
          console.log('Blocked domains now are:', blockedDomains);
        }
      } else {
        // Remove the domain from the blocked list
        blockedDomains = blockedDomains.filter(d => d !== domain);
      }
      chrome.storage.sync.set({ blockedDomains: blockedDomains }, () => {
        refreshCurrentTab();
      });
    });
  });
}


// // Event listener for the block cookies switch
document.getElementById('block-all-switch').addEventListener('change', () => {
  toggleBlockCookies();
});