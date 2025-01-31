const TIME_CONSTANTS = {
  SECONDS_IN_HOUR: 3600,
  SECONDS_IN_MINUTE: 60,
};

function startPersistentProjectCounter() {
  setInterval(async () => {
    try {
      const data = await chrome.storage.local.get(null);
      for (const [id, projectData] of Object.entries(data)) {
        if (projectData.status !== "ACTIVE") continue;

        let remainingTime = projectData.remainingTime;

        remainingTime--;

        if (remainingTime <= 0) {
          await chrome.storage.local.set({
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
          await chrome.storage.local.set({
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

chrome.runtime.onInstalled.addListener(startPersistentProjectCounter);
chrome.runtime.onStartup.addListener(startPersistentProjectCounter);
