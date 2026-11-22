const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
const root = document.documentElement;
const siteHeader = document.querySelector(".top");
if ("ResizeObserver" in window) {
  new ResizeObserver(([entry]) => {
    root.style.setProperty("--nav-height", entry.target.offsetHeight + "px");
  }).observe(siteHeader);
}

const player = document.querySelector("#ost-player");
const gameTrailer = document.querySelector("#game-trailer-player");
const library = document.querySelector(".album-library");
const playlist = [...library.querySelectorAll("[data-track]")];
const playerPanel = document.querySelector(".album-player");
const playerSteps = document.querySelector(".player-steps");
const trackBack = document.querySelector("#track-back");
const trackForward = document.querySelector("#track-forward");
const playerMessage = document.querySelector("#player-message");
const nowPlaying = document.querySelector("#now-playing");
const trackVersion = document.querySelector("#track-version");
let trackIndex = 0;
let mode = "chiptune";
let playerNotice = "";

function setPlayerNotice(message) {
  playerNotice = message;
  playerMessage.textContent = translateText(message);
}

function showTrack() {
  const button = playlist[trackIndex];
  for (const item of playlist) item.removeAttribute("aria-current");
  button.setAttribute("aria-current", "true");
  const label = mode === "epic" ? "Epic" : "Chiptune";
  nowPlaying.textContent = button.textContent;
  trackVersion.textContent = label;
  player.setAttribute("aria-label", button.textContent + " · " + label);
  trackBack.disabled = trackIndex === 0;
  trackForward.disabled = trackIndex === playlist.length - 1;
  return "media/ost/" + button.dataset.track + "-" + mode + ".mp3";
}

function selectTrack(index, autoplay) {
  trackIndex = index;
  setPlayerNotice("");
  const source = showTrack();
  if (player.getAttribute("src") !== source) player.src = source;
  if (autoplay) {
    player.play().catch((error) => {
      if (error.name !== "AbortError") setPlayerNotice("Pulsa reproducir para escuchar esta pista.");
    });
  }
}

playlist.forEach((button, index) => {
  button.addEventListener("click", () => selectTrack(index, true));
});
for (const input of library.querySelectorAll("[name=music-mode]")) {
  input.addEventListener("change", () => {
    const wasPlaying = !player.paused && !player.ended;
    mode = input.value;
    selectTrack(trackIndex, wasPlaying);
  });
}

const imageViewer = document.querySelector(".image-viewer");
const viewerImage = imageViewer.querySelector("img");
const viewerTitle = imageViewer.querySelector("#image-title");
const viewerIndex = imageViewer.querySelector(".image-viewer-index");
const viewerFooter = imageViewer.querySelector(".image-viewer-footer");
let imageOpener;
let galleryItems;
let imageIndex;

function showImage() {
  const link = galleryItems[imageIndex];
  const thumbnail = link.querySelector("img");
  const caption = link.closest("figure, .world")?.querySelector("figcaption strong, h3");
  viewerTitle.textContent = caption?.innerText.replace(/\s+/g, " ") || thumbnail.alt;
  viewerImage.alt = thumbnail.alt;
  viewerImage.src = link.href;
  viewerIndex.textContent = (imageIndex + 1) + " / " + galleryItems.length;
}

function moveImage(step) {
  imageIndex = (imageIndex + step + galleryItems.length) % galleryItems.length;
  showImage();
}

if (typeof imageViewer.showModal === "function") {
  for (const link of document.querySelectorAll(".image-zoom")) {
    link.setAttribute("aria-haspopup", "dialog");
    link.addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const group = link.closest("[data-gallery]");
      galleryItems = group ? [...group.querySelectorAll(".image-zoom")] : [link];
      imageOpener = link;
      imageIndex = galleryItems.indexOf(link);
      viewerFooter.hidden = galleryItems.length < 2;
      showImage();
      imageViewer.showModal();
    });
  }
  imageViewer.querySelector("[data-image-back]").addEventListener("click", () => moveImage(-1));
  imageViewer.querySelector("[data-image-next]").addEventListener("click", () => moveImage(1));
  imageViewer.addEventListener("keydown", (event) => {
    if (galleryItems.length < 2 || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    moveImage(event.key === "ArrowLeft" ? -1 : 1);
  });
  imageViewer.addEventListener("click", (event) => {
    if (event.target === imageViewer) imageViewer.close();
  });
  imageViewer.addEventListener("close", () => {
    viewerImage.removeAttribute("src");
    imageOpener.focus();
  });
}
trackBack.addEventListener("click", () => selectTrack(trackIndex - 1, true));
trackForward.addEventListener("click", () => selectTrack(trackIndex + 1, true));
player.addEventListener("ended", () => {
  playerPanel.classList.remove("is-playing");
  if (trackIndex < playlist.length - 1) selectTrack(trackIndex + 1, true);
});
player.addEventListener("playing", () => {
  playerPanel.classList.add("is-playing");
  setPlayerNotice("");
});
player.addEventListener("play", () => gameTrailer.pause());
gameTrailer.addEventListener("play", () => player.pause());
player.addEventListener("pause", () => playerPanel.classList.remove("is-playing"));
player.addEventListener("error", () => {
  playerPanel.classList.remove("is-playing");
  setPlayerNotice("Esta pista no se ha podido cargar.");
});
library.hidden = false;
playerSteps.hidden = false;
showTrack();
document.addEventListener("xilotron-language-change", () => {
  showTrack();
  setPlayerNotice(playerNotice);
});

let pendingFrame = false;
function paintScroll() {
  const travel = root.scrollHeight - window.innerHeight;
  root.style.setProperty("--progress", Math.min(1, window.scrollY / Math.max(1, travel)));
  root.style.setProperty("--hero-shift", motion.matches ? "0px" : Math.min(window.scrollY * .13, 58) + "px");
  pendingFrame = false;
}

function queueScrollPaint() {
  if (!pendingFrame) {
    pendingFrame = true;
    requestAnimationFrame(paintScroll);
  }
}

window.addEventListener("scroll", queueScrollPaint, { passive: true });
window.addEventListener("resize", queueScrollPaint);
window.addEventListener("hashchange", markCurrentLink);
motion.addEventListener("change", queueScrollPaint);
queueScrollPaint();

function markCurrentLink() {
  for (const link of document.querySelectorAll(".nav a")) {
    if (link.hash && link.hash === location.hash) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  }
}
markCurrentLink();

if ("IntersectionObserver" in window && !motion.matches) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }, { threshold: .13 });

  for (const section of document.querySelectorAll(".intro, .worlds-header, .world, .gallery-heading, .localization-copy, .language-panel, .film-copy, .film-poster, .film-gallery, .sound-heading, .album-cover, .release")) {
    if (section.getBoundingClientRect().top < window.innerHeight) continue;
    section.classList.add("reveal-ready");
    observer.observe(section);
  }
}

const reel = document.querySelector(".film-reel");
const controls = document.querySelector(".film-controls");
const frames = [...reel.children];
const counter = document.querySelector("#film-counter");
const previous = controls.querySelector("[data-previous]");
const next = controls.querySelector("[data-next]");
let activeFrame = 0;

function framePosition(index) {
  return frames[index].offsetLeft - frames[0].offsetLeft;
}

function updateReel() {
  const atEnd = reel.scrollLeft >= reel.scrollWidth - reel.clientWidth - 4;
  previous.disabled = reel.scrollLeft < 4;
  next.disabled = atEnd;
  if (previous.disabled) activeFrame = 0;
  else if (atEnd) activeFrame = frames.length - 1;
  else {
    activeFrame = frames.findIndex((_, index) => framePosition(index) >= reel.scrollLeft - 5);
    if (activeFrame < 0) activeFrame = frames.length - 1;
  }
  const label = (activeFrame + 1) + " / " + frames.length;
  if (counter.textContent !== label) counter.textContent = label;
}

function moveReel(direction) {
  const atEnd = next.disabled;
  const from = atEnd
    ? frames.findIndex((_, index) => framePosition(index) >= reel.scrollLeft - 5)
    : activeFrame;
  const target = Math.min(frames.length - 1, Math.max(0, from + direction));
  reel.scrollTo({ left: framePosition(target), behavior: motion.matches ? "instant" : "smooth" });
}

previous.addEventListener("click", () => moveReel(-1));
next.addEventListener("click", () => moveReel(1));
reel.addEventListener("scroll", updateReel, { passive: true });
window.addEventListener("resize", updateReel);
controls.hidden = false;
updateReel();

const teaserLinks = document.querySelectorAll("[data-teaser]");
const dialog = document.querySelector(".teaser-dialog");
const teaserPlayer = dialog.querySelector(".teaser-player");
let teaserOpener;

const userAgent = navigator.userAgent;
const isAndroid = /Android/i.test(userAgent);
const isAppleMobile = /iPhone|iPad|iPod/i.test(userAgent) ||
  (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1);

if (isAndroid || isAppleMobile) {
  const supportsAndroidIntent = isAndroid && /Chrome\//i.test(userAgent) && !/; wv\)/i.test(userAgent);
  for (const link of teaserLinks) {
    // Let the browser handle a direct tap so mobile OS link routing can open the app.
    link.removeAttribute("target");
    if (supportsAndroidIntent) {
      const videoUrl = new URL(link.href);
      link.href = "intent://" + videoUrl.host + videoUrl.pathname + videoUrl.search +
        "#Intent;scheme=https;package=com.google.android.youtube;S.browser_fallback_url=" +
        encodeURIComponent(videoUrl.href) + ";end";
    }
  }
} else if (typeof dialog.showModal === "function") {
  for (const link of teaserLinks) {
    link.addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      teaserOpener = link;
      player.pause();
      gameTrailer.pause();
      const video = document.createElement("iframe");
      video.title = translateText("Teaser de Xilotrón: The Movie en YouTube");
      video.src = "https://www.youtube-nocookie.com/embed/yKz9unEsVpo?autoplay=1";
      video.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      video.referrerPolicy = "strict-origin-when-cross-origin";
      video.allowFullscreen = true;
      teaserPlayer.replaceChildren(video);
      dialog.showModal();
    });
  }

  dialog.addEventListener("close", () => {
    teaserPlayer.replaceChildren();
    teaserOpener.focus();
  });
}
