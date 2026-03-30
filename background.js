chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'inject-snippet') {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, { action: 'insert_bfs' });
      }
    } catch (error) {
      console.error('Error sending message to content script:', error);
    }
  }
});
