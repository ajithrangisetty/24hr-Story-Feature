const storyListEl = document.getElementById("story-list");
const uploadInput = document.getElementById("upload");

const modal = document.getElementById("story-modal");
const modalImg = document.getElementById("modal-img");
const modalClose = document.getElementById("modal-close");
const progressBar = document.getElementById("progress-bar");
const captionEl = document.getElementById("caption");

const captionInputModal = document.getElementById("caption-input-modal");
const captionInput = document.getElementById("caption-input");
const captionCancelBtn = document.getElementById("caption-cancel");
const captionSaveBtn = document.getElementById("caption-save");

const STORY_KEY = "stories_storage_key";
const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

let currentIndex = -1;
let progressInterval = null;

let tempImageData = null; // temporary image data before saving
let tempCaptionText = ""; // temporary caption text

// Load and clean stories
function loadStories() {
  let stories = JSON.parse(localStorage.getItem(STORY_KEY) || "[]");
  const now = Date.now();
  stories = stories.filter((story) => now - story.timestamp < EXPIRY_TIME);
  localStorage.setItem(STORY_KEY, JSON.stringify(stories));
  return stories;
}

// Save to localStorage
function saveStories(stories) {
  localStorage.setItem(STORY_KEY, JSON.stringify(stories));
}

// Show all stories
function displayStories() {
  storyListEl.innerHTML = "";

  const addButton = document.createElement("div");
  addButton.className = "story-circle add-button";
  addButton.textContent = "+";
  addButton.title = "Add New Story";
  addButton.addEventListener("click", () => uploadInput.click());
  storyListEl.appendChild(addButton);

  const stories = loadStories();
  stories.forEach((story, idx) => {
    const storyEl = document.createElement("div");
    storyEl.className = "story-circle " + (story.viewed ? "seen" : "unseen");

    const img = document.createElement("img");
    img.src = story.image;
    img.alt = `Story ${idx + 1}`;

    storyEl.appendChild(img);
    storyEl.addEventListener("click", () => openStory(idx));
    storyListEl.appendChild(storyEl);
  });
}

// Handle image upload and prompt caption input
uploadInput.addEventListener("change", (event) => {
  const file = event.target.files[0];

  if (!file || !file.type.startsWith("image/")) {
    alert("Please upload a valid image.");
    return;
  }

  const img = new Image();
  const objectURL = URL.createObjectURL(file);

  img.onload = () => {
    const MAX_WIDTH = 1080;
    const MAX_HEIGHT = 1920;
    let { width, height } = img;

    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
      width *= ratio;
      height *= ratio;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);
    tempImageData = canvas.toDataURL(file.type);

    // Show caption input modal
    captionInputModal.style.display = "flex";
    captionInput.value = "";
    tempCaptionText = "";
    uploadInput.value = "";
    URL.revokeObjectURL(objectURL);
  };

  img.onerror = () => {
    alert("Image failed to load.");
    URL.revokeObjectURL(objectURL);
  };

  img.src = objectURL;
});

// Caption input modal buttons
captionCancelBtn.addEventListener("click", () => {
  captionInputModal.style.display = "none";
  tempImageData = null;
  tempCaptionText = "";
});

captionSaveBtn.addEventListener("click", () => {
  tempCaptionText = captionInput.value.trim();

  if (!tempImageData) {
    captionInputModal.style.display = "none";
    return;
  }

  let stories = loadStories();
  stories.push({
    image: tempImageData,
    caption: tempCaptionText, // saves manual caption here
    timestamp: Date.now(),
    viewed: false,
  });

  saveStories(stories);
  displayStories();

  captionInputModal.style.display = "none";
  tempImageData = null;
  tempCaptionText = "";
});

// Open story modal
function openStory(index) {
  const stories = loadStories();
  if (index < 0 || index >= stories.length) return;

  currentIndex = index;
  const story = stories[index];

  modal.style.display = "flex";
  modalImg.src = story.image;

  // Show manual caption if any
  captionEl.textContent = story.caption || "";

  if (!story.viewed) {
    story.viewed = true;
    saveStories(stories);
    displayStories();
  }

  startProgress();
}

// 3-second progress animation
function startProgress() {
  clearInterval(progressInterval);
  progressBar.style.width = "0%";

  let width = 0;
  progressInterval = setInterval(() => {
    width += 1;
    progressBar.style.width = `${width}%`;

    if (width >= 100) {
      clearInterval(progressInterval);
      nextStory();
    }
  }, 30); // 3 seconds for full bar (100 * 30ms)
}

// Navigate to next or previous story
function nextStory() {
  const stories = loadStories();
  if (currentIndex < stories.length - 1) {
    openStory(currentIndex + 1);
  } else {
    closeModal();
  }
}

function prevStory() {
  if (currentIndex > 0) {
    openStory(currentIndex - 1);
  } else {
    closeModal();
  }
}

// Close modal
function closeModal() {
  modal.style.display = "none";
  clearInterval(progressInterval);
  progressBar.style.width = "0%";
  currentIndex = -1;
}

// Modal controls
modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

modalImg.addEventListener("click", (e) => {
  const clickX = e.clientX;
  const middle = window.innerWidth / 2;
  if (clickX < middle - 40) {
    prevStory();
  } else if (clickX > middle + 40) {
    nextStory();
  } else {
    closeModal();
  }
});

window.addEventListener("load", displayStories);
