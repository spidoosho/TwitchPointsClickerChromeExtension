async function clickBtn() {
  let tabs = await chrome.tabs.query({active: true})
  for (let i = 0; i < tabs.length; i++) {
    if (!tabs[i].url.startsWith('https://www.twitch.tv/')) {
      continue;
    }
    await chrome.scripting.executeScript({
      target: {tabId: tabs[i].id},
      func: () => {
        const a = document.getElementsByClassName("community-points-summary")[0].children[1]
        const b = a.getElementsByTagName("button")
        if (b.length > 0) {
          b[0].click()
        }
      }
    })
  }
}


(async () => {
  document.getElementById("claimBtn").addEventListener("click", clickBtn);
})();
