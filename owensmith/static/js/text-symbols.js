function convertText(node) {
  // Code already uses ligatures; leave source and editable content intact.
  if (node.parentElement?.closest('.operator-symbol, pre, code, script, style, textarea, [contenteditable], .katex')) return;
  const parts = node.data.split(/(->|!=|=>|<=)/g);
  if (parts.length === 1) return;
  const fragment = document.createDocumentFragment();
  parts.forEach((part, index) => {
    if (index % 2 === 0) fragment.append(document.createTextNode(part));
    else {
      const symbol = document.createElement('span');
      symbol.className = 'operator-symbol';
      symbol.textContent = part;
      fragment.append(symbol);
    }
  });
  node.replaceWith(fragment);
}

function convert(root) {
  if (root.nodeType === Node.TEXT_NODE) {
    convertText(root);
    return;
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  // Collect first: replacing a node would interrupt the walk.
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(convertText);
}

convert(document.body);

// Also cover previews and other text inserted after initial rendering.
new MutationObserver(records => {
  for (const record of records) {
    if (record.type === 'characterData') convertText(record.target);
    else for (const node of record.addedNodes) convert(node);
  }
}).observe(document.body, { childList: true, characterData: true, subtree: true });
