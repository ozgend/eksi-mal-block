// malBlock content.js

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
      console.log(`fuckoff ${authorName} (${entryId})`);
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
  [ACTION_KEYS.BLOCK]: { type: ACTION_TYPES.XHR, target: 'addrelation', param: 'm' },
  [ACTION_KEYS.UNBLOCK]: { type: ACTION_TYPES.XHR, target: 'removerelation', param: 'm' },
  [ACTION_KEYS.MUTE]: { type: ACTION_TYPES.XHR, target: 'addrelation', param: 'u' },
  [ACTION_KEYS.UNMUTE]: { type: ACTION_TYPES.XHR, target: 'removerelation', param: 'u' }
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

const createActionLinkWithListItem = (authorId, authorName, entryId, actionKeyNames) => {
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

      const response = await makeRequest(authorId, action);
      if (response.ok) {
        if (actionKeyNames.length === 1) {
          return;
        }

        console.log(`${nextActionKey} (${authorName}) action successful`);
        nextActionIx = nextActionIx === 1 ? 0 : 1;
        nextActionKey = actionKeys[nextActionIx];
        e.target.textContent = ACTION_NAMES[nextActionKey];
        e.target.setAttribute('title', `(malBlock) ${ACTION_NAMES[nextActionKey]} (${authorName})`);
        e.target.setAttribute('next-action-ix', nextActionIx);
      }
    } catch (error) {
      console.error(`${nextActionKey} (${authorName}) action failed:`, error);
    }
  }
  li.appendChild(a);
  return li;
}

const processEntries = () => {
  const entries = document.querySelectorAll('ul#entry-item-list > li');
  const entryDomList = Array.from(entries);
  entryDomList.forEach(entry => {
    const entryId = entry.getAttribute('data-id');
    const authorId = entry.getAttribute('data-author-id');
    const authorName = entry.getAttribute('data-author');
    const dropdownMenu = entry.querySelector('div.other.dropdown > ul.dropdown-menu');
    const actionLinks = [
      createActionLinkWithListItem(authorId, authorName, entryId),
      createActionLinkWithListItem(authorId, authorName, entryId, [ACTION_KEYS.FUCKOFF]),
      createActionLinkWithListItem(authorId, authorName, entryId, [ACTION_KEYS.BLOCK, ACTION_KEYS.UNBLOCK]),
      createActionLinkWithListItem(authorId, authorName, entryId, [ACTION_KEYS.MUTE, ACTION_KEYS.UNMUTE])
    ];
    actionLinks.forEach(actionLink => dropdownMenu.appendChild(actionLink));
  });
}

processEntries();

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      const hasNewEntries = Array.from(mutation.addedNodes).some(node =>
        node.nodeType === Node.ELEMENT_NODE &&
        (node.matches('li[data-id]') || node.querySelector('li[data-id]'))
      );

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
