// malBlock content.js

const AUTHOR_NAME = Array.from(document.querySelectorAll('a[title]')).find(a => a.querySelector('svg.eksico use[*|href="#eksico-me"]') && a.textContent.trim() === 'ben')?.getAttribute('title') || '';

const ACTION_KEYS = {
  FUCKOFF: 'FUCKOFF',
  BLOCK: 'BLOCK',
  UNBLOCK: 'UNBLOCK',
  MUTE: 'MUTE',
  UNMUTE: 'UNMUTE'
}

const ACTION_TYPES = {
  INLINE: 'inline',
  XHR: 'xhr'
}

const ACTION_NAMES = {
  [ACTION_KEYS.FUCKOFF]: '🖕🏻 kes la',
  [ACTION_KEYS.BLOCK]: '🚫 engelle',
  [ACTION_KEYS.UNBLOCK]: '✔️ engellendi',
  [ACTION_KEYS.MUTE]: '🚯 sustur',
  [ACTION_KEYS.UNMUTE]: '✔️ susturuldu'
}

const ACTIONS = {
  [ACTION_KEYS.FUCKOFF]: {
    type: ACTION_TYPES.INLINE,
    target: (authorName, entryId) => {
      // console.log(`fuckoff ${authorName} (${entryId})`);
      chrome.runtime.sendMessage({
        action: 'SHOW_MESSAGE_FORM',
        data: {
          authorName,
          entryId,
          message: `(${entryId}) kes la`
        }
      });
    }
  },
  [ACTION_KEYS.BLOCK]: { type: ACTION_TYPES.XHR, target: 'addrelation', param: 'm', applyStyle: 'text-decoration: line-through; opacity: 0.5;' },
  [ACTION_KEYS.UNBLOCK]: { type: ACTION_TYPES.XHR, target: 'removerelation', param: 'm', applyStyle: 'text-decoration: none; opacity: 1;' },
  [ACTION_KEYS.MUTE]: { type: ACTION_TYPES.XHR, target: 'addrelation', param: 'u', applyStyle: 'text-decoration: line-through; opacity: 0.5;' },
  [ACTION_KEYS.UNMUTE]: { type: ACTION_TYPES.XHR, target: 'removerelation', param: 'u', applyStyle: 'text-decoration: none; opacity: 1;' }
}

const shortenName = (name) => {
  return name.slice(0, 20) + (name.length > 20 ? '...' : '');
}

const makeRequest = (authorId, action) => {
  return fetch(`https://eksisozluk.com/userrelation/${action.target}/${authorId}?r=${action.param}`, {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9,tr;q=0.8,el;q=0.7",
      "priority": "u=1, i",
      "x-requested-with": "XMLHttpRequest"
    },
    "method": "POST",
    "credentials": "include"
  });
}

const createActionLinkWithListItem = (entryElm, actionKeyNames) => {
  const entryId = entryElm.getAttribute('data-id');
  const authorId = entryElm.getAttribute('data-author-id');
  const authorName = entryElm.getAttribute('data-author');

  if (authorName === AUTHOR_NAME) {
    return;
  }

  const li = document.createElement('li');
  li.className = 'malblock-actions';

  if (!actionKeyNames || actionKeyNames.length === 0) {
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = `----- malBlock -----`;
    a.setAttribute('title', `(malBlock) ${authorName}`);
    a.onclick = (e) => {
      e.preventDefault();
      console.log('malBlock');
    };
    li.appendChild(a);
    return li;
  }

  const a = document.createElement('a');
  a.href = '#';
  a.textContent = ACTION_NAMES[actionKeyNames[0]];
  a.setAttribute('title', `(malBlock) ${ACTION_NAMES[actionKeyNames[0]]} (${authorName})`);
  a.setAttribute('action-keys', JSON.stringify(actionKeyNames));
  a.setAttribute('next-action-ix', 0);
  a.onclick = async (e) => {
    e.preventDefault();

    try {
      const actionKeys = JSON.parse(e.target.getAttribute('action-keys'));
      let nextActionIx = parseInt(e.target.getAttribute('next-action-ix'));
      let nextActionKey = actionKeys[nextActionIx];
      const action = ACTIONS[nextActionKey];

      if (!action) {
        return;
      }

      if (action.type === ACTION_TYPES.INLINE) {
        action.target(authorName, entryId);
        return;
      }

      e.target.disabled = true;
      const response = await makeRequest(authorId, action);

      if (response.ok) {
        if (actionKeyNames.length === 1) {
          return;
        }
        console.log(`${nextActionKey} (${authorName}) action successful`);
        entryElm.querySelector('div.content').style.cssText = ACTIONS[nextActionKey].applyStyle;
        nextActionIx = nextActionIx === 1 ? 0 : 1;
        nextActionKey = actionKeys[nextActionIx];
        e.target.textContent = ACTION_NAMES[nextActionKey];
        e.target.setAttribute('title', `(malBlock) ${ACTION_NAMES[nextActionKey]} (${authorName})`);
        e.target.setAttribute('next-action-ix', nextActionIx);
      }
    } catch (error) {
      console.error(`${nextActionKey} (${authorName}) action failed:`, error);
    }
    e.target.disabled = false;
  }
  li.appendChild(a);
  return li;
}

const processEntries = () => {
  const entries = document.querySelectorAll('ul#entry-item-list > li');
  const entryDomList = Array.from(entries);
  entryDomList.forEach(entryElm => {
    const dropdownMenu = entryElm.querySelector('div.other.dropdown > ul.dropdown-menu');
    const actionLinks = [
      createActionLinkWithListItem(entryElm, []),
      createActionLinkWithListItem(entryElm, [ACTION_KEYS.FUCKOFF]),
      createActionLinkWithListItem(entryElm, [ACTION_KEYS.BLOCK, ACTION_KEYS.UNBLOCK]),
      createActionLinkWithListItem(entryElm, [ACTION_KEYS.MUTE, ACTION_KEYS.UNMUTE])
    ].filter(Boolean);
    actionLinks.forEach(actionLink => dropdownMenu.appendChild(actionLink));
  });
}

// delay for gecko
setTimeout(processEntries, 2000);

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      const hasNewEntries = Array.from(mutation.addedNodes).some(node => node.nodeType === Node.ELEMENT_NODE && (node.matches('li[data-id]') || node.querySelector('li[data-id]')));
      if (hasNewEntries) {
        processEntries();
        break;
      }
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
