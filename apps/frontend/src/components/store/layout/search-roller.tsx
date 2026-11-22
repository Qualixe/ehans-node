'use client';

import { useEffect, useRef } from 'react';

const WORDS = ['smart phone', 'home decoration', 'gadgets'];

/** Rotating placeholder words in the header search button (template "search roller"). */
export function SearchRoller() {
  const trackRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const itemHeight = (track.firstElementChild as HTMLElement | null)?.offsetHeight ?? 0;
    let index = 0;
    const timer = window.setInterval(() => {
      index++;
      track.style.transition = 'transform .9s ease';
      track.style.transform = `translateY(-${index * itemHeight}px)`;
      if (index === WORDS.length) {
        track.addEventListener(
          'transitionend',
          () => {
            track.style.transition = 'none';
            track.style.transform = 'translateY(0)';
            index = 0;
            void track.offsetHeight; // force reflow
          },
          { once: true },
        );
      }
    }, 2000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <span className="search-roller">
      <span className="search-roller-track" ref={trackRef}>
        {WORDS.map((w) => (
          <span key={w}>{w}</span>
        ))}
        {/* duplicate of the first word for a seamless loop */}
        <span aria-hidden="true">{WORDS[0]}</span>
      </span>
    </span>
  );
}
