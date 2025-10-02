// src/components/BillAdjuster.tsx
"use client";

import { useEffect } from "react";

/**
 * BillAdjuster: client-side logic to ensure:
 * - summary obeys your 6/7/8 rules (compress if 7, move if needed),
 * - moves item rows from page1 -> page2 until page1 fits,
 * - preserves order and moves only DOM nodes (no data duplication).
 *
 * Add debug=true to see console logs while testing.
 */

function isOverflowing(el: HTMLElement) {
  // small tolerance because browser rounding differs
  return el.scrollHeight > el.clientHeight + 2;
}

export default function BillAdjuster({
  itemsCount,
  debug = false,
}: {
  itemsCount: number;
  debug?: boolean;
}) {
  useEffect(() => {
    const page1 = document.getElementById("page1");
    const page2 = document.getElementById("page2");
    const page1Items = document.getElementById("page1-items");
    const page2Items = document.getElementById("page2-items");
    const summary = document.getElementById("bill-summary");
    const page2SummaryPlaceholder = document.getElementById("page2-summary");
    const footer = document.getElementById("page2-footer");

    if (!page1 || !page2 || !page1Items || !page2Items || !page2SummaryPlaceholder || !footer) {
      if (debug) console.warn("BillAdjuster: required element missing");
      return;
    }

    const log = (...args: any[]) => debug && console.log("[BillAdjuster]", ...args);

    // Helper to move last row from page1 to page2 (keeps order)
    function moveLastRowToPage2(): boolean {
      const rows = page1Items.querySelectorAll("tr");
      if (!rows || rows.length === 0) return false;
      const last = rows[rows.length - 1] as HTMLElement;
      page2Items.appendChild(last);
      return true;
    }

    // Move first row from page2 back to page1 (used when necessary)
    function moveFirstRowToPage1(): boolean {
      const rows = page2Items.querySelectorAll("tr");
      if (!rows || rows.length === 0) return false;
      const first = rows[0] as HTMLElement;
      page1Items.appendChild(first);
      return true;
    }

    // Move the summary element to page2 placeholder
    function moveSummaryToPage2() {
      if (!summary) return;
      if (page2SummaryPlaceholder && summary.parentElement !== page2SummaryPlaceholder) {
        page2SummaryPlaceholder.appendChild(summary);
        log("Moved summary -> page2");
      }
    }

    // Move summary back to page1 right after the items table (append to page1)
    function moveSummaryToPage1() {
      if (!summary) return;
      const page1Body = page1.querySelector(".page-body") as HTMLElement | null;
      if (page1Body && summary.parentElement !== page1Body) {
        page1Body.appendChild(summary);
        log("Moved summary -> page1");
      }
    }

    // Core: ensure page1 fits by moving rows
    function normalizePagesAccordingToRules() {
      try {
        log("normalize start", { itemsCount });

        // 1) initial placement rules
        if (itemsCount >= 8) {
          // summary should be on page2 server-side ideally; ensure it is
          if (summary) moveSummaryToPage2();
        } else if (itemsCount <= 6) {
          if (summary) moveSummaryToPage1();
        } else if (itemsCount === 7) {
          // try compressed summary on page1 first
          if (summary && !summary.classList.contains("summary-compressed")) {
            summary.classList.add("summary-compressed");
            log("Applied summary-compressed class");
          }
          if (summary) moveSummaryToPage1();
        }

        // Allow the browser to paint compressed styles then check overflow
        requestAnimationFrame(() => {
          // If page1 overflows, move rows until it fits
          let safety = 1000; // fail-safe
          let moved = 0;
          while (isOverflowing(page1) && safety-- > 0) {
            const did = moveLastRowToPage2();
            moved++;
            if (!did) break;
          }
          if (moved) log(`Moved ${moved} rows to page2 to avoid overflow`);

          // If page1 has too few rows (edge case), try moving one back (keeps balanced)
          // but only if itemsCount <=6 rule requests summary on page1
          if (itemsCount <= 6) {
            // try to move rows back from page2 if space and rows exist
            let returnSafety = 100;
            while (!isOverflowing(page1) && page2Items.children.length > 0 && returnSafety-- > 0) {
              // attempt to move first row back and test overflow
              const movedBack = moveFirstRowToPage1();
              if (!movedBack) break;
              // After moving back, if now overflowing, move it back to page2
              if (isOverflowing(page1)) {
                // move it back to page2
                moveLastRowToPage2();
                break;
              }
            }
          }

          // For 7 items: if compression did not help and page1 still overflows, move summary to page2
          if (itemsCount === 7 && isOverflowing(page1) && summary) {
            log("7 items: compression insufficient, moving summary to page2");
            // ensure summary is on page2
            moveSummaryToPage2();
            // re-check and move rows as needed
            let s = 1000;
            while (isOverflowing(page1) && s-- > 0) {
              if (!moveLastRowToPage2()) break;
            }
          }

          // final safety & logging
          log("normalize done", {
            page1_scroll: page1.scrollHeight,
            page1_client: page1.clientHeight,
            page1_rows: page1Items.querySelectorAll("tr").length,
            page2_rows: page2Items.querySelectorAll("tr").length,
            summary_parent: summary?.parentElement?.id,
          });
        });
      } catch (err) {
        console.error("BillAdjuster normalize error", err);
      }
    }

    // Run after small timeout to allow fonts/images to load
    const t = setTimeout(normalizePagesAccordingToRules, 220);

    // Also run on resize (preview resizing) and on mutation (fonts/images)
    window.addEventListener("resize", normalizePagesAccordingToRules);

    const mo = new MutationObserver(normalizePagesAccordingToRules);
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", normalizePagesAccordingToRules);
      mo.disconnect();
    };
  }, [itemsCount, debug]);

  return null;
}
