// malBlock background.js

console.log('malBlock background script');

if (typeof browser == "undefined") {
  // Chrome does not support the browser namespace yet.
  globalThis.browser = chrome;
}

browser.runtime.onInstalled.addListener(() => {
  console.log('malBlock extension installed');
});

browser.runtime.onStartup.addListener(() => {
  console.log('malBlock extension started');
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', JSON.stringify(message));

  if (message.action === 'SHOW_MESSAGE_FORM') {
    browser.scripting.executeScript({
      target: { tabId: sender.tab.id },
      world: "MAIN",
      func: (data) => {
        console.log('Showing message form:', data);
        ek$i.showMessageForm(data.authorName, data.message);
      },
      args: [message.data]
    });
  }

  sendResponse({ message: 'Message received' });
});