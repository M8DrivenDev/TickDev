// background.js

const TIME_CONSTANTS = {
  SECONDS_IN_HOUR: 3600,
  SECONDS_IN_MINUTE: 60,
};

function startPersistentProjectCounter() {
  setInterval(async () => {
    try {
      const data = await chrome.storage.sync.get(null);
      for (const [id, projectData] of Object.entries(data)) {
        if (projectData.status !== "ACTIVE") continue;

        let remainingTime = projectData.remainingTime;

        remainingTime--;

        if (remainingTime <= 0) {
          await chrome.storage.sync.set({
            [id]: {
              ...projectData,
              status: "DONE",
              remainingTime: 0,
            },
          });

          chrome.notifications.create({
            type: "basic",
            iconUrl: "./public/TickDev.png",
            title: "Project Completed",
            message: `Project "${projectData.name}" has finished its countdown.`,
          });
        } else {
          await chrome.storage.sync.set({
            [id]: {
              ...projectData,
              remainingTime,
            },
          });
        }
      }
    } catch (err) {
      console.error("Error in persistent project counter:", err);
    }
  }, 1000);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { command, projectId } = message;

  if (command === "pause") {
    chrome.storage.sync.get(projectId, (data) => {
      if (data[projectId]) {
        chrome.storage.sync.set({
          [projectId]: {
            ...data[projectId],
            status: "HOLD",
          },
        });
      }
    });
  } else if (command === "play") {
    chrome.storage.sync.get(projectId, (data) => {
      if (data[projectId]) {
        chrome.storage.sync.set({
          [projectId]: {
            ...data[projectId],
            status: "ACTIVE",
          },
        });
      }
    });
  }
  sendResponse({ success: true });
});

chrome.runtime.onInstalled.addListener(startPersistentProjectCounter);
chrome.runtime.onStartup.addListener(startPersistentProjectCounter);
