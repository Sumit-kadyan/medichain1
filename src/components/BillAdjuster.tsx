// src/components/BillAdjuster.tsx
"use client";

import { useEffect } from "react";

export default function BillAdjuster({ itemsCount }: { itemsCount: number }) {
  useEffect(() => {
    const page1 = document.getElementById("page1");
    const page2 = document.getElementById("page2");
    const summary = document.getElementById("bill-summary");
    const page2Summary = document.getElementById("page2-summary");
    const footer = document.getElementById("page2-footer");

    if (!page1 || !page2 || !page2Summary || !footer) return;

    function isOverflowing(el: HTMLElement) {
      // use scrollHeight vs clientHeight to detect overflow
      return el.scrollHeight > el.clientHeight + 1;
    }

    // If there are exactly 7 items, we attempted to compress server-side.
    // If the page1 still overflows, move summary to page2.
    if (itemsCount === 7 && summary) {
      // give the browser one rendering frame to layout compressed styles
      requestAnimationFrame(() => {
        if (isOverflowing(page1)) {
          // move summary to page2-summary
          try {
            page2Summary.appendChild(summary);
            // ensure page2 content updates before printing
            page2.scrollTop = 0;
          } catch (e) {
            // ignore
            console.warn("Could not move summary to page2:", e);
          }
        }
      });
    }

    // Ensure footer is visually pinned at bottom on all browsers:
    // we enforce a small tweak: set footer position absolute (CSS handles this)
    // but double-check if page2 has enough height; if not, nothing to do here.

    // cleanup: none needed
  }, [itemsCount]);

  return null;
}
