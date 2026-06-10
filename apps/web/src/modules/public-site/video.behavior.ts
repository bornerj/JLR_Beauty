import type { Cleanup } from "../../shared/dom";
import { on, onAll } from "../../shared/dom";

export function initVideoModal(): Cleanup {
  const cleanups: Cleanup[] = [];
  const add = (cleanup: Cleanup) => cleanups.push(cleanup);

  const videoModal = document.getElementById("video-modal");
  const videoBackdrop = document.getElementById("video-backdrop");
  const videoClose = document.getElementById("close-video");
  const videoPlayer = document.getElementById("video-player") as HTMLVideoElement | null;
  const lympTriggers = document.querySelectorAll("[data-open-lymp-video]");
  const freepeeTriggers = document.querySelectorAll("[data-open-freepee-video]");
  const nutriTriggers = document.querySelectorAll("[data-open-nutri-video]");

  const openVideoModal = (src: string) => {
    if (!videoModal || !videoPlayer) return;
    videoPlayer.src = src;
    videoModal.classList.remove("hidden");
    videoModal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
    videoPlayer.play().catch(() => {});
  };

  const closeVideoModal = () => {
    if (!videoModal || !videoPlayer) return;
    videoModal.classList.add("hidden");
    videoModal.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
    videoPlayer.removeAttribute("src");
    videoPlayer.load();
  };

  add(
    onAll(lympTriggers, "click", (event) => {
      event.preventDefault();
      openVideoModal("/images/videos/lymp.mp4");
    })
  );
  add(
    onAll(freepeeTriggers, "click", (event) => {
      event.preventDefault();
      openVideoModal("/images/videos/freepee.mp4");
    })
  );
  add(
    onAll(nutriTriggers, "click", (event) => {
      event.preventDefault();
      openVideoModal("/images/videos/nutri.mp4");
    })
  );
  add(on(videoBackdrop, "click", closeVideoModal));
  add(on(videoClose, "click", closeVideoModal));
  add(
    on(document, "keydown", (event) => {
      if (
        event instanceof KeyboardEvent &&
        event.key === "Escape" &&
        videoModal &&
        !videoModal.classList.contains("hidden")
      ) {
        closeVideoModal();
      }
    })
  );

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}
