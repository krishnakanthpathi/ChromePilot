const bfsSnippet = `def bfs(root):
    if not root:
        return []

    queue = collections.deque([root])
    result = []

    while queue:
        level_size = len(queue)
        current_level = []

        for _ in range(level_size):
            node = queue.popleft()
            current_level.append(node.val)

            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)

        result.append(current_level)

    return result
`;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'insert_bfs') {
    console.log('[LeetCode BFS Injector] Received insert_bfs action');
    const activeElement = document.activeElement;

    if (activeElement && activeElement.tagName === 'TEXTAREA') {
      console.log('[LeetCode BFS Injector] TEXTAREA is focused. Simulating deep paste event...');
      try {
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', bfsSnippet);

        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true,
          cancelable: true
        });

        activeElement.dispatchEvent(pasteEvent);
        console.log('[LeetCode BFS Injector] Deep paste event dispatched successfully.');
      } catch (error) {
        console.error('[LeetCode BFS Injector] Deep paste simulation failed. Trying fallback...', error);
        fallbackInsert();
      }
    } else {
      console.log('[LeetCode BFS Injector] Target element is not a TEXTAREA. Current active element is:', activeElement ? activeElement.tagName : 'null');
      fallbackInsert();
    }
  }
});

function fallbackInsert() {
  console.log('[LeetCode BFS Injector] Using document.execCommand fallback.');
  const success = document.execCommand('insertText', false, bfsSnippet);
  if (success) {
    console.log('[LeetCode BFS Injector] document.execCommand fallback succeeded.');
  } else {
    console.error('[LeetCode BFS Injector] document.execCommand fallback failed.');
  }
}
