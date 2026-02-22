/**
 * Revolut Business — Bulk Delete Unmatched Receipts
 *
 * Paste this script into Chrome DevTools (Cmd+Option+J) while on the
 * Revolut Business receipts page to delete all visible "Sans correspondance"
 * receipts one by one, confirming each deletion modal automatically.
 *
 * How it works:
 *   1. Finds the first delete button (aria-label="Supprimer") in the list
 *   2. Clicks it — a confirmation modal appears
 *   3. Clicks the "Supprimer" button inside the modal toolbar
 *   4. Waits for the DOM to settle, then repeats
 *
 * The script re-queries the DOM each iteration so it handles Revolut
 * removing rows from the list after each deletion.
 *
 * Adjust DELAY_AFTER_CLICK and DELAY_AFTER_CONFIRM if the page is slow.
 */
(async () => {
  const DELAY_AFTER_CLICK = 800;   // ms to wait for modal to appear
  const DELAY_AFTER_CONFIRM = 1200; // ms to wait for deletion + DOM update

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  let deleted = 0;

  while (true) {
    // Re-query each time: Revolut removes rows after deletion
    const btn = document.querySelector('button[aria-label="Supprimer"]');
    if (!btn) break;

    btn.click();
    await delay(DELAY_AFTER_CLICK);

    // The confirm button is inside a [role="toolbar"] and has text "Supprimer"
    const confirmBtn = Array.from(
      document.querySelectorAll('[role="toolbar"] button')
    ).find((b) => b.textContent.trim() === 'Supprimer');

    if (confirmBtn) {
      confirmBtn.click();
      deleted++;
      console.log(`Deleted ${deleted}`);
      await delay(DELAY_AFTER_CONFIRM);
    } else {
      console.warn('No confirm button found, stopping.');
      break;
    }
  }

  console.log(`Done! Deleted ${deleted} receipts.`);
})();
