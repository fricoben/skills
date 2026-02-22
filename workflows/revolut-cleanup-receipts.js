/**
 * Revolut Business — Bulk Process Receipts
 *
 * Paste this script into Chrome DevTools (Cmd+Option+J) while on
 * https://business.revolut.com/expenses/my-documents/all
 *
 * It processes all visible receipts:
 *   - "Correspondance trouvée" → opens the receipt, clicks
 *     "Confirmer la correspondance", then navigates back to the list
 *   - "Sans correspondance"    → clicks delete + confirms the modal
 *
 * The script re-queries the DOM each iteration so it handles Revolut
 * removing/updating rows after each action.
 *
 * Adjust delays below if the page is slow.
 */
(async () => {
  const DELAY_AFTER_CLICK   = 800;  // ms – wait for modal / page transition
  const DELAY_AFTER_CONFIRM = 1500; // ms – wait for action to complete
  const DELAY_AFTER_NAV     = 2500; // ms – wait for list to re-render after back()

  const LIST_URL = 'https://business.revolut.com/expenses/my-documents/all';

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  let deleted   = 0;
  let confirmed = 0;

  while (true) {
    // Re-query every iteration — the DOM changes after each action
    const items = document.querySelectorAll(
      'button[aria-label="Élément de la liste des reçus"]'
    );
    if (!items.length) break;

    let acted = false;

    for (const item of items) {
      const text = item.textContent;

      // ── Matched receipt → confirm the correspondence ──────────
      if (text.includes('Correspondance trouvée')) {
        item.click();                       // navigate to detail page
        await delay(DELAY_AFTER_CLICK);

        const confirmBtn = Array.from(document.querySelectorAll('button'))
          .find((b) => b.textContent.includes('Confirmer la correspondance'));

        if (confirmBtn) {
          confirmBtn.click();
          confirmed++;
          console.log(`✓ Confirmed ${confirmed}`);
          await delay(DELAY_AFTER_CONFIRM);
        } else {
          console.warn('No "Confirmer la correspondance" button found, going back');
        }

        // Return to the list (SPA client-side navigation)
        window.history.back();
        await delay(DELAY_AFTER_NAV);

        acted = true;
        break; // re-query the list from scratch

      // ── Unmatched receipt → delete ────────────────────────────
      } else if (text.includes('Sans correspondance')) {
        const deleteBtn = item.querySelector('button[aria-label="Supprimer"]');
        if (!deleteBtn) continue;

        deleteBtn.click();
        await delay(DELAY_AFTER_CLICK);

        const modalConfirmBtn = Array.from(
          document.querySelectorAll('[role="toolbar"] button')
        ).find((b) => b.textContent.trim() === 'Supprimer');

        if (modalConfirmBtn) {
          modalConfirmBtn.click();
          deleted++;
          console.log(`✗ Deleted ${deleted}`);
          await delay(DELAY_AFTER_CONFIRM);
        } else {
          console.warn('No delete confirm button found, stopping.');
          break;
        }

        acted = true;
        break; // re-query the list from scratch
      }
    }

    if (!acted) {
      console.log('No more actionable receipts found.');
      break;
    }
  }

  console.log(`Done! Confirmed: ${confirmed}, Deleted: ${deleted}`);
})();
