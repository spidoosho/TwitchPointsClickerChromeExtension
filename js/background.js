chrome.webNavigation.onCompleted.addListener(async (callback) => {
  await checkTab(callback.tabId);
});

async function checkAndClickTwitchCollectBtn(tabId) {
  const result = await chrome.scripting.executeScript({
    target: {tabId: tabId}, func: async () => {
      const summaryEls = document.getElementsByClassName("community-points-summary")
      const collectBtn = summaryEls[0].children[1].getElementsByTagName("button")
      if (collectBtn.length > 0) {
        collectBtn[0].click();
      }
      return collectBtn.length > 0;
    }
  })

  if (result === null || result.length === 0)
    return null;

  return result[0].result
}

function padNum(num) {
  return num.toString().padStart(2, "0");
}

function getPaddedTime(time) {
  return `${padNum(time.getHours())}:${padNum(time.getMinutes())}:${padNum(time.getSeconds())}`;
}

async function setTime(time) {
  await chrome.storage.session.set({"lastUpdate": JSON.stringify(time)});
}

async function getTime() {
  const time = await chrome.storage.session.get(["lastUpdate"]);
  if (!("lastUpdate" in time)) {
    return null;
  }

  const timeSplit = time.lastUpdate.split(/[^0-9]/);
  const lastTime = new Date(parseInt(timeSplit[1]), parseInt(timeSplit[2]) - 1, parseInt(timeSplit[3]), parseInt(timeSplit[4]), parseInt(timeSplit[5]), parseInt(timeSplit[6]));
  const dst = isDST(lastTime) ? 0 : 1;
  lastTime.setHours(lastTime.getHours() + dst);

  return lastTime;
}

function isDST(time) {
  Date.prototype.stdTimezoneOffset = function () {
    const jan = new Date(this.getFullYear(), 0, 1);
    const jul = new Date(this.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  }

  Date.prototype.isDstObserved = function () {
    return this.getTimezoneOffset() < this.stdTimezoneOffset();
  }

  return time.isDstObserved();
}

async function checkTab(tabId) {
  const CYCLE = 10000;

  const tab = await chrome.tabs.get(tabId)

  if (!tab.url.includes("https://www.twitch.tv/")) {
    return;
  }

  let hasTwitchTab = true;
  while (hasTwitchTab) {
    // get last update time
    const lastTime = await getTime();
    const currentTime = new Date();

    // if updated recently then it is another listener already checking
    if (lastTime !== null && Math.abs(lastTime - currentTime) < CYCLE) {
      return;
    }

    // check if run for the first time in this session
    if (lastTime !== null) {
      console.log(`Time diff: ${Math.abs(lastTime - currentTime)}`);
    } else {
      console.log(`First time: ${currentTime}`)
    }
    await setTime(currentTime);

    // check for twitch tab
    hasTwitchTab = false;
    const tabs = (await chrome.tabs.query({}))
    for (let i = 0; i < tabs.length; i++) {
      // skip non-twitch tabs
      if (!tabs[i].url?.includes("https://www.twitch.tv/")) continue;
      hasTwitchTab = true;

      // skip non active tabs
      if (!tabs[i].active) continue;

      // check and click collect button
      let isReady = await checkAndClickTwitchCollectBtn(tabs[i].id)
      while (null === isReady && tabs[i].active) {
        console.log("waiting for page to load")
        await new Promise(r => setTimeout(r, CYCLE));
        isReady = await checkAndClickTwitchCollectBtn(tabs[i].id)
      }

      if(!tabs[i].active) continue;

      // send message to update twitch page with update times
      const message = {action: "updateTime", time: getPaddedTime(currentTime)}
      if (isReady) {
        message.clicked = true;
      }
      await chrome.tabs.sendMessage(tabs[i].id, message);
      console.log(`${getPaddedTime(currentTime)}| ${tabs[i].title} -> ${isReady}`);
    }

    // wait for the next check cycle
    await new Promise(r => setTimeout(r, CYCLE));
  }
}

