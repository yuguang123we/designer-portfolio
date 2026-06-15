const body = document.body;
const themeToggle = document.querySelector(".theme-toggle");
const previewImage = document.querySelector(".project-preview img");
const previewTitle = document.querySelector(".project-preview strong");
const projectItems = document.querySelectorAll(".project-item");
const frameStage = document.querySelector(".video-background");
const scrollFrame = document.querySelector(".scroll-frame");
const frameCount = Number(frameStage?.dataset.frameCount || 0);
const loadedFrames = new Map();

let currentFrame = 1;
let desiredFrame = 1;
let rafId = null;
let loadedFrameTotal = 0;

function pageProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return 0;
  return Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
}

function framePath(index) {
  return `frames/scroll/frame_${String(index).padStart(3, "0")}.webp`;
}

function frameFromScroll() {
  if (!frameCount) return 1;
  return Math.round(pageProgress() * (frameCount - 1)) + 1;
}

function preloadFrame(index) {
  if (index < 1 || index > frameCount) return null;
  if (loadedFrames.has(index)) return loadedFrames.get(index);

  const image = new Image();
  image.decoding = "async";
  image.addEventListener(
    "load",
    () => {
      loadedFrameTotal += 1;
      const decode = typeof image.decode === "function" ? image.decode().catch(() => {}) : Promise.resolve();
      decode.then(() => {
        if (index === desiredFrame) {
          showFrame(index);
        }

        if (loadedFrameTotal >= frameCount) {
          frameStage?.classList.add("is-sequence-ready");
        }
      });
    },
    { once: true }
  );
  image.src = framePath(index);
  loadedFrames.set(index, image);
  return image;
}

function preloadAllFrames() {
  if (!frameCount) return;

  for (let index = 1; index <= frameCount; index += 1) {
    preloadFrame(index);
  }
}

function showFrame(index) {
  const image = loadedFrames.get(index);
  if (!scrollFrame || !image?.complete || !image.naturalWidth) return;

  currentFrame = index;
  scrollFrame.src = image.src;
}

function setFrame(index) {
  if (!scrollFrame || index < 1 || index > frameCount) return;

  desiredFrame = index;
  const image = preloadFrame(index);

  if (index !== currentFrame && image?.complete && image.naturalWidth) {
    showFrame(index);
  }
}

function updateScrollFrame() {
  rafId = null;
  setFrame(frameFromScroll());
}

function requestFrameUpdate() {
  if (rafId === null) {
    rafId = requestAnimationFrame(updateScrollFrame);
  }
}

function initFrameSequence() {
  if (!scrollFrame || !frameCount) return;

  desiredFrame = frameFromScroll();
  currentFrame = desiredFrame;
  scrollFrame.src = framePath(currentFrame);
  preloadFrame(currentFrame);
  preloadFrame(1);
  preloadFrame(frameCount);
  preloadAllFrames();
}

themeToggle.addEventListener("click", () => {
  body.classList.toggle("is-paper");
});

window.addEventListener("scroll", requestFrameUpdate, { passive: true });
window.addEventListener("resize", requestFrameUpdate);
window.addEventListener("load", requestFrameUpdate);

projectItems.forEach((item) => {
  const activate = () => {
    projectItems.forEach((project) => project.classList.remove("is-active"));
    item.classList.add("is-active");
    previewImage.src = item.dataset.image;
    previewImage.alt = `${item.dataset.title}预览`;
    previewTitle.textContent = item.dataset.title;
  };

  item.addEventListener("mouseenter", activate);
  item.addEventListener("focus", activate);
  item.addEventListener("click", activate);
});

initFrameSequence();
