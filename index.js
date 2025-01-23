function fetchAllProjects() {
  let allProjects = [];
  chrome.storage.sync.get(null, (data) => {
    for (let key in data) {
      if (data.hasOwnProperty(key)) {
        allProjects.push({ projectId: key, details: data[key] });
      }
    }

    allProjects.sort((a, b) => {
      if (a.details.status === "ACTIVE" && b.details.status !== "ACTIVE") {
        return -1;
      }
      if (a.details.status !== "ACTIVE" && b.details.status === "ACTIVE") {
        return 1;
      }
      return 0;
    });
    let cardsContainer = document.getElementById("cards-container");
    cardsContainer.innerHTML = "";
    allProjects.forEach((ele) => {
      let card = document.createElement("div");
      const cardClasses = ["project-card"];
      if (ele.details.status === "HOLD") {
        cardClasses.push("unactive-project-card");
      } else if (ele.details.status === "DONE") {
        cardClasses.push("completed-project-card");
      } else {
        cardClasses.push("active-project-card");
      }
      card.classList.add(...cardClasses);

      const createdAt = new Date(ele.details.createdAt).toLocaleString();
      const initialTime = ele.details.initialTime || "Not Set";
      const status = ele.details.status || "ACTIVE";
      let remainingTime = ele.details.remainingTime;
      remainingTime = formatTime(
        Math.floor(remainingTime / 3600),
        Math.floor((remainingTime % 3600) / 60),
        remainingTime % 60,
      );

      const id = ele.projectId;

      card.innerHTML = `
        <div class="project-heading">
          <h3>${ele.details.name}</h3>
          <div class="spinner">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
        <div class="card-subheading">
          <p class="card-desc">Created at: <span>${createdAt}</span></p>
          <p class="card-status">${status}</p>
        </div>
        <p class="card-desc">
          Initial Estimated Time is: <span>${initialTime}</span>
        </p>
        <p class="card-desc">
          Remaining Time is: <span id=${id}>${remainingTime}</span>
        </p>
${
  status !== "DONE"
    ? `
      <div class="controllers">
        <button class="controller complete " id="complete-${id}" data-command="complete" data-project=${id} >
          <img src="./public/complete.svg" alt="complete the timer" />
        </button>
        <button class="controller pause" data-project=${id} data-command="pause">
          <img src="./public/pause.svg" alt="pause the timer" />
        </button>
        <button class="controller play" data-project=${id} data-command="play">
          <img src="./public/play.svg" alt="play the timer" />
        </button>
        <button class="controller delete" data-project=${id} data-command="delete">
          <img src="./public/trash.svg" alt="delete the timer" />
        </button>
      </div>
    `
    : `
      <div class="controllers">
        <button class="controller delete" data-project=${id} data-command="delete">
          <img src="./public/trash.svg" alt="delete the timer" />
        </button>
      </div>
    `
}
      `;

      cardsContainer.appendChild(card);
    });
  });
}

fetchAllProjects();

function sendCommand(command, projectId) {
  chrome.runtime.sendMessage({ command, projectId }, (response) => {
    if (response && response.success) {
      fetchAllProjects();
    } else {
      console.error("Unexpected response:", response);
    }
  });
}

document.getElementById("cards-container").addEventListener("click", (e) => {
  const button = e.target.closest("button");
  if (button) {
    const command = button.getAttribute("data-command");
    const projectId = button.getAttribute("data-project");
    if (command === "complete") {
      chrome.storage.sync.get(null, (data) => {
        if (data[projectId]) {
          chrome.storage.sync.set({
            [projectId]: {
              ...data[projectId],
              status: "DONE",
            },
          });
        }
        fetchAllProjects();
      });
    } else if (command === "delete") {
      chrome.storage.sync.remove([projectId], () => {
        fetchAllProjects();
      });
    }
    sendCommand(command, projectId);
  }
});

chrome.storage.local.get(null, (data) => {
  if (data["navigationView"] === "addNew") {
    navigateToAdd();
  } else if (data["navigationView"] === "projects") {
    navigateToProjects();
  } else {
    navigateToAdd();
  }
});
document.getElementById("add-new-nav").addEventListener("click", navigateToAdd);

document
  .getElementById("projects-nav")
  .addEventListener("click", navigateToProjects);

document
  .getElementById("add-project-btn")
  .addEventListener("click", addProject);

document
  .getElementById("project-time-hours")
  .addEventListener("input", removeMsgs);

document
  .getElementById("project-time-minutes")
  .addEventListener("input", removeMsgs);
document
  .getElementById("project-time-seconds")
  .addEventListener("input", removeMsgs);

document
  .getElementById("project-name-input")
  .addEventListener("input", removeMsgs);

document.getElementById("project-name-input").addEventListener("focus", () =>
  focusInput({
    id: "project-name-input",
    labelId: "project-name-input-label",
  }),
);

document.getElementById("project-name-input").addEventListener("focusout", () =>
  unfocusInput({
    id: "project-name-input",
    labelId: "project-name-input-label",
  }),
);

document.getElementById("project-time-hours").addEventListener("focus", () =>
  focusInput({
    id: "project-time-hours",
    labelId: "project-time-hours-label",
  }),
);

document.getElementById("project-time-minutes").addEventListener("focus", () =>
  focusInput({
    id: "project-time-minutes",
    labelId: "project-time-minutes-label",
  }),
);

document.getElementById("project-time-seconds").addEventListener("focus", () =>
  focusInput({
    id: "project-time-seconds",
    labelId: "project-time-seconds-label",
  }),
);

document
  .getElementById("project-time-seconds")
  .addEventListener("focusout", () =>
    unfocusInput({
      id: "project-time-seconds",
      labelId: "project-time-seconds-label",
    }),
  );

document
  .getElementById("project-time-minutes")
  .addEventListener("focusout", () =>
    unfocusInput({
      id: "project-time-minutes",
      labelId: "project-time-minutes-label",
    }),
  );

document.getElementById("project-time-hours").addEventListener("focusout", () =>
  unfocusInput({
    id: "project-time-hours",
    labelId: "project-time-hours-label",
  }),
);

function navigateToAdd() {
  document.getElementById("projects-nav").classList.remove("active-list");
  document.getElementById("add-new-nav").classList.add("active-list");
  chrome.storage.local.set({ navigationView: "addNew" });
  document.getElementById("add-new-container").style.display = "";
  document.getElementById("projects-container").style.display = "none";
  removeMsgs();
}
function navigateToProjects() {
  document.getElementById("add-new-nav").classList.remove("active-list");
  document.getElementById("projects-nav").classList.add("active-list");
  chrome.storage.local.set({ navigationView: "projects" });
  document.getElementById("add-new-container").style.display = "none";
  document.getElementById("projects-container").style.display = "";
  fetchAllProjects();
  removeMsgs();
}

//* This focus and unfocus functions //
function unfocusInput({ id, labelId }) {
  if (!document.getElementById(id).value) {
    document.getElementById(id).classList.remove("focus-input");
    document.getElementById(labelId).classList.remove("active-label");
  }
  return;
}
function focusInput({ id, labelId }) {
  document.getElementById(id).classList.add("focus-input");
  document.getElementById(labelId).classList.add("active-label");
}
// End //

const TIME_CONSTANTS = {
  SECONDS_IN_HOUR: 3600,
  SECONDS_IN_MINUTE: 60,
  MAX_MINUTES: 60,
  MAX_SECONDS: 60,
};

function validateTimeInputs(hours, minutes, seconds) {
  if (
    minutes >= TIME_CONSTANTS.MAX_MINUTES ||
    seconds >= TIME_CONSTANTS.MAX_SECONDS
  ) {
    return {
      isValid: false,
      error: "Please add valid time (minutes and seconds must be less than 60)",
    };
  }

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds)
  ) {
    return {
      isValid: false,
      error: "Time must be an integer. Please check it and try again.",
    };
  }

  return { isValid: true };
}

function clearFormInputs() {
  const inputs = [
    { id: "project-time-hours", labelId: "project-time-hours-label" },
    { id: "project-time-minutes", labelId: "project-time-minutes-label" },
    { id: "project-time-seconds", labelId: "project-time-seconds-label" },
    { id: "project-name-input", labelId: "project-name-input-label" },
  ];

  inputs.forEach(({ id, labelId }) => {
    document.getElementById(id).value = "";
    unfocusInput({ id, labelId });
  });
}

function calculateTotalSeconds(hours, minutes, seconds) {
  return (
    hours * TIME_CONSTANTS.SECONDS_IN_HOUR +
    minutes * TIME_CONSTANTS.SECONDS_IN_MINUTE +
    seconds
  );
}

async function addProject() {
  try {
    const projectName = document
      .getElementById("project-name-input")
      .value.trim();
    const hours =
      parseInt(document.getElementById("project-time-hours").value) || 0;
    const minutes =
      parseInt(document.getElementById("project-time-minutes").value) || 0;
    const seconds =
      parseInt(document.getElementById("project-time-seconds").value) || 0;

    const existingError = document.getElementById("error-msg");
    if (existingError) {
      existingError.remove();
    }

    const timeValidation = validateTimeInputs(hours, minutes, seconds);
    if (!timeValidation.isValid) {
      displayError(timeValidation.error);
      return;
    }

    if (!projectName || (hours === 0 && minutes === 0 && seconds === 0)) {
      displayError(
        "Please check the project name and estimated time for this project.",
      );
      return;
    }

    const formattedTime = formatTime(hours, minutes, seconds);
    const totalSeconds = calculateTotalSeconds(hours, minutes, seconds);

    const data = await chrome.storage.sync.get(null);
    const projectExists = Object.values(data).some(
      (project) => project.name.toLowerCase() === projectName.toLowerCase(),
    );

    if (projectExists) {
      displayError("The project already exists.");
      clearFormInputs();
      return;
    }

    const projectId = Date.now();
    const newProject = {
      name: projectName,
      createdAt: projectId,
      initialTime: formattedTime,
      status: "ACTIVE",
      remainingTime: totalSeconds,
    };

    await chrome.storage.sync.set({ [projectId]: newProject });
    displaySuccess("Your project added successfully.");
    clearFormInputs();
  } catch (error) {
    console.error("Error adding project:", error);
    displayError(
      "An error occurred while adding the project. Please try again.",
    );
  }
}

function displayError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.id = "error-msg";
  errorDiv.innerHTML = `<p class="error-msg">${message}</p>`;
  document.querySelector("body").appendChild(errorDiv);
}

function displaySuccess(message) {
  const successDiv = document.createElement("div");
  successDiv.id = "success-msg";
  successDiv.innerHTML = `<p class="success-msg">${message}</p>`;
  document.querySelector("body").appendChild(successDiv);
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const pad = (num) => String(num).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
}

function removeMsgs() {
  let ele = document.querySelector("#error-msg");
  if (ele) {
    ele.parentNode.removeChild(ele);
  }
  let success = document.querySelector("#success-msg");
  if (success) {
    success.parentNode.removeChild(success);
  }
}
function updateTimers() {
  chrome.storage.sync.get(null, (data) => {
    for (const [projectId, details] of Object.entries(data)) {
      const timerElement = document.getElementById(projectId);
      if (timerElement && details.status === "ACTIVE") {
        timerElement.textContent = formatTime(details.remainingTime);
      }
    }
  });
}

setInterval(updateTimers, 1000);
