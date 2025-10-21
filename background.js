const MAX_PAGES = 20;

function escapeHtml(text) {
  if (!text) return "";
  return text.replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[m]
  );
}

function uniqueHistoryEntries(historyItems, maxItems) {
  const seen = new Map();
  for (const item of historyItems) {
    if (!item.url) continue;
    const existing = seen.get(item.url);
    if (!existing || (item.lastVisitTime || 0) > (existing.lastVisitTime || 0)) {
      seen.set(item.url, {
        title: item.title || item.url,
        lastVisitTime: item.lastVisitTime || 0,
      });
    }
  }
  const arr = Array.from(seen.entries()).map(([url, v]) => ({
    url,
    title: v.title,
    lastVisitTime: v.lastVisitTime,
  }));
  arr.sort((a, b) => (b.lastVisitTime || 0) - (a.lastVisitTime || 0));
  return arr.slice(0, maxItems);
}

// Wait for tab load
function waitForTabLoaded(tabId, timeoutMs = 20000) {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }, timeoutMs);
    function listener(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        if (!done) {
          done = true;
          clearTimeout(timer);
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function captureThumbnail(tab) {
  try {
    await chrome.windows.update(tab.windowId, { focused: true });
    await new Promise((r) => setTimeout(r, 300));
    const dataUrl = await chrome.tabs.captureVisibleTab();
    return dataUrl;
  } catch (e) {
    console.warn("captureVisibleTab failed:", e);
    return null;
  }
}

async function downloadHtmlFile(filename, htmlContent) {
  const base64 = btoa(unescape(encodeURIComponent(htmlContent)));
  const dataUrl = "data:text/html;base64," + base64;
  await new Promise((resolve, reject) => {
    chrome.downloads.download({ url: dataUrl, filename }, (downloadId) => {
      const err = chrome.runtime.lastError;
      if (err) reject(err.message || err);
      else resolve(downloadId);
    });
  });
  console.log("✅ File downloaded:", filename);
}

async function exportHistory() {
  try {
    console.log("Fetching history...");
    const historyItems = await new Promise((resolve) =>
      chrome.history.search({ text: "", maxResults: 10000 }, (results) =>
        resolve(results || [])
      )
    );

    const entries = uniqueHistoryEntries(historyItems, MAX_PAGES);
    if (!entries.length) {
      await downloadHtmlFile("history_backup_empty.html", "<h1>No history found</h1>");
      return;
    }

    let html = `
<!doctype html>
<html><head>
<meta charset="utf-8">
<title>History Backup</title>
<style>
  body { font-family: Arial, sans-serif; padding: 12px; background: #fafafa; }
  h1 { font-size: 1.2rem; margin-bottom: 12px; }
  .list { display: flex; flex-wrap: wrap; gap: 12px; }
  .entry { width: 240px; border: 1px solid #ddd; padding: 8px; border-radius: 6px;
           background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .preview { width: 100%; height: 150px; background: #f6f6f6;
             display:flex; align-items:center; justify-content:center; overflow:hidden; }
  .preview img { width:100%; height:auto; display:block; }
  .title-link { color:#0366d6; text-decoration:underline; font-weight:600; display:block; margin-top:8px; }
  .title-link:hover { text-decoration:none; }
  .meta { font-size:0.8rem; color:#555; word-break:break-word; }
  .url-small { font-size:0.75rem; color:#333; word-break:break-all; }
</style>
</head><body>
<h1>Browser History Backup (${entries.length} items)</h1>
<div class="list">
`;

    for (let i = 0; i < entries.length; i++) {
      const item = entries[i];
      try {
        console.log(`Processing ${i + 1}/${entries.length}: ${item.url}`);
        const tab = await new Promise((resolve) =>
          chrome.tabs.create({ url: item.url, active: true }, (t) => resolve(t))
        );

        await waitForTabLoaded(tab.id, 15000);
        await new Promise((r) => setTimeout(r, 800));
        const thumb = await captureThumbnail(tab);
        try { await chrome.tabs.remove(tab.id); } catch {}

        const safeTitle = escapeHtml(item.title || item.url);
        const safeUrl = escapeHtml(item.url);
        const imgHtml = thumb
          ? `<img src="${thumb}" alt="Preview">`
          : `<div>No preview</div>`;

        html += `
  <div class="entry">
    <div class="preview">${imgHtml}</div>
    <a class="title-link" href="${safeUrl}" target="_blank">${safeTitle}</a>
    <div class="meta">${new Date(item.lastVisitTime || Date.now()).toLocaleString()}</div>
    <div class="url-small">${safeUrl}</div>
  </div>
`;
      } catch (err) {
        console.error("Error processing:", item.url, err);
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    html += "</div></body></html>";

    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `history_backup_${ts}.html`;
    await downloadHtmlFile(filename, html);
    console.log("✅ Export complete!");
  } catch (e) {
    console.error("exportHistory failed:", e);
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.action === "export_history") {
    exportHistory()
      .then(() => sendResponse({ result: "started" }))
      .catch((err) => {
        console.error("export_history error:", err);
        sendResponse({ result: "error", message: String(err) });
      });
    return true;
  }
});
