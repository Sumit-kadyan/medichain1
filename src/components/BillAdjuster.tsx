// src/components/BillAdjuster.tsx
"use client";

import { useEffect } from "react";

function isOverflowing(el: HTMLElement) {
  return el.scrollHeight > el.clientHeight + 1; // +1 tolerance
}

export default function BillAdjuster({ itemsCount }: { itemsCount: number }) {
  useEffect(() => {
    // Elements we need
    const page1 = document.getElementById("page1");
    const page2 = document.getElementById("page2");
    const summary = document.getElementById("bill-summary");
    const page2Summary = document.getElementById("page2-summary");
    const footer = document.getElementById("page2-footer");

    if (!page1 || !page2 || !page2Summary || !footer) return;

    // run after fonts/images load (one repaint)
    const checkAndMove = () => {
      try {
        // If items >= 8, server already put summary on page2. Ensure it exists there:
        if (itemsCount >= 8) {
          if (summary && page2Summary && summary.parentElement !== page2Summary) {
            page2Summary.appendChild(summary);
            // console.log("Moved summary -> page2 (>=8 items)");
          }
          return;
        }

        // If items <= 6 we want summary on page1 (do nothing unless overflow)
        if (itemsCount <= 6) {
          // if somehow summary ended up on page2, move it back
          if (summary && page1 && summary.parentElement !== page1 && page1.querySelector("#bill-summary") == null) {
            // find insertion position (at end of page1 content)
            page1.appendChild(summary);
          }
          // if overflow despite <=6, move to page2 as safety
          if (isOverflowing(page1) && summary) {
            page2Summary.appendChild(summary);
            // console.warn("Page1 overflow with <=6 items — moved summary to page2 as fallback.");
          }
          return;
        }

        // itemsCount === 7: we tried compression server-side. If still overflowing, move summary.
        if (itemsCount === 7) {
          // allow rendering frame
          if (!summary) return;
          if (!isOverflowing(page1)) return; // fits, nothing to do

          // try compressed: if not already compressed, attempt to compress (server should have applied 'summary-compressed' class,
          // but in case not, apply here)
          if (!summary.classList.contains("summary-compressed")) {
            summary.classList.add("summary-compressed");
          }

          // allow a tick for reflow, then check again
          requestAnimationFrame(() => {
            if (isOverflowing(page1)) {
              // still overflowing: move summary to page2
              try {
                page2Summary.appendChild(summary);
                // console.warn("7 items and compressed still overflow: moved summary to page2");
              } catch (e) {
                console.error("Could not move summary to page2", e);
              }
            } else {
              // fits after compression
              // console.log("Summary fits after compression for 7 items.");
            }
          });
          return;
        }
      } catch (e) {
        console.error("BillAdjuster error:", e);
      }
    };

    // Run after small delay to allow fonts/images
    const t = setTimeout(checkAndMove, 200);
    // Also run when window resizes (user can resize preview)
    window.addEventListener("resize", checkAndMove);

    // If images/fonts cause later layout shifts, observe
    const mo = new MutationObserver(checkAndMove);
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", checkAndMove);
      mo.disconnect();
    };
  }, [itemsCount]);

  return null;
}
