document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('exportBtn');
  const limitSpan = document.getElementById('limit');
  limitSpan.textContent = '200';
    
  btn.addEventListener('click', () => {
    btn.disabled = true;
    btn.textContent = 'Exporting...';
    chrome.runtime.sendMessage({ action: 'export_history' }, (resp) => {
      
      setTimeout(() => {
        window.close();
      }, 800);
    });
  });
});

