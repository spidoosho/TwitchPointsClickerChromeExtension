chrome.runtime.onMessage.addListener(request => {
  if (request.action === "updateTime") {
    const headerEl = document.getElementById("live-channel-stream-information");
    if(headerEl.querySelector("#timeUpdated") === null) {
      headerEl.appendChild(createDiv("timeUpdated", "Last update time:"));
    }

    if(headerEl.querySelector("#timeClicked") === null) {
      headerEl.appendChild(createDiv("timeClicked", "Last click time:"));
    }

    if("clicked" in request && request.clicked) {
      document.getElementById("timeClicked").textContent = `Last click time: ${request.time}`;
    }

    document.getElementById("timeUpdated").textContent = `Last update time: ${request.time}`;
  }
});

function createDiv(id, text) {
  const newDiv = document.createElement('div');
  newDiv.id = id
  newDiv.style.display = "flex";
  newDiv.style.justifyContent = "flex-end";
  newDiv.style.marginRight = "50px";
  newDiv.textContent = text

  return newDiv;
}
