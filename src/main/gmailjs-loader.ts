/**
 * gmailjs-loader.ts — MAIN world content script
 *
 * This script runs in the page context (world: "MAIN") so it can access
 * Gmail's internal JavaScript objects via gmail-js. It CANNOT use any
 * chrome.* extension APIs.
 *
 * Communication with the ISOLATED world content script (index.tsx) happens
 * via window.postMessage.
 */


// Gmail enforces a strict Trusted Types CSP. jQuery (used by gmail-js) relies
// on innerHTML which is blocked without a default policy. This must run BEFORE
// any gmail-js or jQuery code executes.
if (typeof window.trustedTypes !== 'undefined' && window.trustedTypes.createPolicy) {
  if (!window.trustedTypes.defaultPolicy) {
    try {
      window.trustedTypes.createPolicy('default', {
        createHTML: (string: string) => string,
        createScript: (string: string) => string,
        createScriptURL: (string: string) => string,
      });
    } catch (e) {
      console.warn('TrustedTypes default policy already created or failed:', e);
    }
  }
}

import jQuery from 'jquery';
import { Gmail } from 'gmail-js';


// These constants define the message types exchanged between MAIN ↔ ISOLATED worlds.

const MSG_OPEN_MODAL = 'GMAIL_AI_REPLY_OPEN';
const MSG_INSERT_DRAFT = 'GMAIL_AI_REPLY_INSERT_DRAFT';


console.log('🔧 [MAIN world] gmailjs-loader.ts injected');


const gmail = new Gmail(jQuery);

// Keep a reference to the most recent compose window so we can insert drafts
let activeComposeRef: GmailDomCompose | null = null;


gmail.observe.on('load', () => {
  console.log('✅ [MAIN world] Gmail.js loaded — observing compose events');


  gmail.observe.on('compose', (compose: GmailDomCompose, composeType: GmailComposeType) => {
    console.log(`📝 [MAIN world] Compose window detected (type: ${composeType})`);

    // Inject the AI Reply button using gmail-js's built-in method
    const buttonHtml = `
      <span style="display:inline-flex;align-items:center;gap:6px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"/>
          <path d="M18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"/>
        </svg>
        AI Reply
      </span>
    `;

    const $btn = gmail.tools.add_compose_button(compose, buttonHtml, () => {
      console.log('🖱️ [MAIN world] AI Reply button clicked');

      // Store reference so we can insert the draft later
      activeComposeRef = compose;

      // Extract email context from the compose window
      const emailContext = extractEmailContext(compose);

      // Send the context to the ISOLATED world via postMessage
      window.postMessage(
        {
          type: MSG_OPEN_MODAL,
          emailContext,
        },
        '*'
      );
    });

    // Style the button to match Gmail's native pill-shaped Send button
    $btn.css({
      'border-radius': '18px',
      'padding': '0 16px',
    });
  });
});


window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data?.type !== MSG_INSERT_DRAFT) return;

  const draft: string = event.data.draft;
  if (!draft || !activeComposeRef) {
    console.warn('⚠️ [MAIN world] Cannot insert draft — no active compose reference');
    return;
  }

  console.log('📥 [MAIN world] Inserting draft into compose body');

  try {
    // Get current body and prepend the draft
    const currentBody = activeComposeRef.body() || '';
    const formattedDraft = draft.replace(/\n/g, '<br/>');
    activeComposeRef.body(formattedDraft + '<br/><br/>' + currentBody);
  } catch (err) {
    console.error('❌ [MAIN world] Failed to insert draft:', err);
  }
});



function extractEmailContext(compose: GmailDomCompose): string {
  // 1. Try to get quoted reply content from the compose body
  try {
    const bodyHtml = compose.body();
    if (bodyHtml) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(bodyHtml, 'text/html');
      const quoteEl = doc.querySelector('.gmail_quote');
      if (quoteEl?.textContent?.trim()) {
        return quoteEl.textContent.trim();
      }
    }
  } catch {
    // fallback below
  }

  // 2. Try to grab thread content from the Gmail DOM (visible email messages)
  try {
    const threadMessages = document.querySelectorAll(
      '[data-message-id] .a3s.aiL, .ii.gt .a3s'
    );
    if (threadMessages.length > 0) {
      return Array.from(threadMessages)
        .map((el) => el.textContent?.trim())
        .filter(Boolean)
        .join('\n\n---\n\n');
    }
  } catch {
    // fallback below
  }

  // 3. Try using gmail-js to get email data from the current thread
  try {
    const threadId = compose.thread_id();
    if (threadId) {
      // Try to find email elements in the thread
      const emailElements = document.querySelectorAll('div.adn');
      if (emailElements.length > 0) {
        return Array.from(emailElements)
          .map((el) => {
            const bodyEl = el.querySelector('.a3s');
            return bodyEl?.textContent?.trim();
          })
          .filter(Boolean)
          .join('\n\n---\n\n');
      }
    }
  } catch {
    // fallback below
  }

  // 4. Last resort: use whatever is in the compose body itself
  try {
    const bodyHtml = compose.body();
    if (bodyHtml) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(bodyHtml, 'text/html');
      const text = doc.body.textContent?.trim();
      if (text) return text;
    }
  } catch {
    // final fallback
  }

  return '[No email context found — please paste the email you want to reply to]';
}
