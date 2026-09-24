import { useEffect } from 'react';

const MIN_VISIBLE_RATIO = 0.5;

/** Pause when less than half the player is visible; never resume implicitly. */
export function usePauseOffscreenVideo(video: HTMLVideoElement | null) {
  useEffect(() => {
    if (!video) return;

    const checkVisibility = () => {
      const rect = video.getBoundingClientRect();
      let left = Math.max(rect.left, 0);
      let right = Math.min(rect.right, window.innerWidth);
      let top = Math.max(rect.top, 0);
      let bottom = Math.min(rect.bottom, window.innerHeight);

      for (
        let ancestor = video.parentElement;
        ancestor && right > left && bottom > top;
        ancestor = ancestor.parentElement
      ) {
        const style = window.getComputedStyle(ancestor);
        const clipsX = /auto|scroll|hidden|clip/.test(style.overflowX);
        const clipsY = /auto|scroll|hidden|clip/.test(style.overflowY);
        if (!clipsX && !clipsY) continue;

        const bounds = ancestor.getBoundingClientRect();
        const clipLeft = bounds.left + ancestor.clientLeft;
        const clipTop = bounds.top + ancestor.clientTop;
        if (clipsX) {
          left = Math.max(left, clipLeft);
          right = Math.min(right, clipLeft + ancestor.clientWidth);
        }
        if (clipsY) {
          top = Math.max(top, clipTop);
          bottom = Math.min(bottom, clipTop + ancestor.clientHeight);
        }
      }

      const visibleArea = Math.max(0, right - left) * Math.max(0, bottom - top);
      const totalArea = Math.max(rect.width * rect.height, 1);
      if (visibleArea / totalArea < MIN_VISIBLE_RATIO) video.pause();
    };
    const scrollTargets: EventTarget[] = [window];
    for (
      let ancestor = video.parentElement;
      ancestor;
      ancestor = ancestor.parentElement
    ) {
      const style = window.getComputedStyle(ancestor);
      if (/auto|scroll|hidden|clip/.test(style.overflowX + style.overflowY)) {
        scrollTargets.push(ancestor);
      }
    }
    const pauseWhenHidden = () => {
      if (document.visibilityState !== 'visible') video.pause();
    };

    scrollTargets.forEach((target) =>
      target.addEventListener('scroll', checkVisibility, { passive: true }),
    );
    window.addEventListener('resize', checkVisibility, { passive: true });
    document.addEventListener('visibilitychange', pauseWhenHidden);

    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting || entry.intersectionRatio < MIN_VISIBLE_RATIO) {
              video.pause();
            }
          }, { threshold: [0, MIN_VISIBLE_RATIO] });

    observer?.observe(video);
    checkVisibility();

    return () => {
      observer?.disconnect();
      scrollTargets.forEach((target) =>
        target.removeEventListener('scroll', checkVisibility),
      );
      window.removeEventListener('resize', checkVisibility);
      document.removeEventListener('visibilitychange', pauseWhenHidden);
      video.pause();
    };
  }, [video]);
}
