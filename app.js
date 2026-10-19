(() => {
  const button = document.querySelector('[data-copy="portfolio"]');
  const toast = document.querySelector('.toast');
  const hosted = location.protocol === 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  if (button && !hosted) button.innerHTML = '复制本地预览地址 <span>↗</span>';
  let timer;
  button?.addEventListener('click', async () => {
    const address = new URL('index.html', location.href).href;
    try {
      await navigator.clipboard.writeText(address);
      toast.textContent = hosted ? '作品集链接已复制' : '本地预览地址已复制，仅此电脑可用';
    } catch {
      toast.textContent = '复制不可用，请复制浏览器地址栏中的作品集网址。';
    }
    toast.classList.add('visible');
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove('visible'), 5000);
  });
})();

// Text can be replaced independently from links and layout.
(() => {
  if (!/\/(?:index\.html)?$/.test(location.pathname)) return;
  fetch(new URL('content.json', location.href)).then(r => { if (!r.ok) throw new Error('copy'); return r.json(); }).then(data => {
    for (const [selector, text] of Object.entries(data['index.html'] || {})) {
      const element = document.querySelector(selector);
      if (element && typeof text === 'string') element.textContent = text;
    }
  }).catch(() => { /* Static text remains available if content cannot load. */ });
})();
