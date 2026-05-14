chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "fetchJson" || !message.url) return false;

  fetch(message.url, {
    credentials: "include",
    headers: { Accept: "application/json" }
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Request returned ${response.status}`);
      }
      return response.json();
    })
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));

  return true;
});
