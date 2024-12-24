// malBlock background.js

console.log('malBlock background script');

chrome.runtime.onInstalled.addListener(() => {
  console.log('malBlock extension installed');
});

chrome.runtime.onStartup.addListener(() => {
  console.log('malBlock extension started');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', JSON.stringify(message));

  if (message.action === 'SHOW_MESSAGE_FORM') {
    chrome.scripting.executeScript({
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