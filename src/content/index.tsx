import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import * as InboxSDK from '@inboxsdk/core';
import App from './App';
import cssText from './styles.css?inline';

// ─── Diagnostic: confirm script injection ───────────────────────────────────
console.log('🚀 Gmail AI Reply extension is injected and running!');

// ─── Modal Mount / Unmount ──────────────────────────────────────────────────

let modalRoot: Root | null = null;
let modalHost: HTMLDivElement | null = null;

function mountModal(emailContext: string, composeView: any) {
  // Prevent duplicate modals
  if (modalHost) {
    unmountModal();
  }

  // Create host element
  modalHost = document.createElement('div');
  modalHost.id = 'gmail-ai-reply-root';
  document.body.appendChild(modalHost);

  // Attach Shadow DOM for style isolation
  const shadowRoot = modalHost.attachShadow({ mode: 'open' });

  // Inject compiled Tailwind CSS into Shadow DOM
  const styleEl = document.createElement('style');
  styleEl.textContent = cssText;
  shadowRoot.appendChild(styleEl);

  // Add Google Fonts link
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href =
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
  shadowRoot.appendChild(fontLink);

  // Create mount point
  const mountPoint = document.createElement('div');
  shadowRoot.appendChild(mountPoint);

  // Mount React
  modalRoot = createRoot(mountPoint);
  modalRoot.render(
    <React.StrictMode>
      <App
        emailContext={emailContext}
        onInsertDraft={(draft: string) => {
          // Insert the generated draft into the compose body
          try {
            composeView.insertTextIntoBodyAtCursor(draft);
          } catch {
            // Fallback: set the full body content
            composeView.setBodyHTML(
              composeView.getHTMLContent() +
                '<br/><br/>' +
                draft.replace(/\n/g, '<br/>')
            );
          }
        }}
        onClose={unmountModal}
      />
    </React.StrictMode>
  );
}

function unmountModal() {
  if (modalRoot) {
    modalRoot.unmount();
    modalRoot = null;
  }
  if (modalHost) {
    modalHost.remove();
    modalHost = null;
  }
}

// ─── Extract Email Thread Context ───────────────────────────────────────────

function extractEmailContext(composeView: any): string {
  // Try to get the initial message content (the thread being replied to)
  try {
    // InboxSDK method to get the text of the initial email
    const initialContent = composeView.getInitialMessageText?.();
    if (initialContent && initialContent.trim()) {
      return initialContent.trim();
    }
  } catch {
    // fallback below
  }

  // Try getting quoted text from the compose body
  try {
    const bodyHTML = composeView.getHTMLContent();
    // Gmail wraps quoted content in a div with class 'gmail_quote'
    const parser = new DOMParser();
    const doc = parser.parseFromString(bodyHTML, 'text/html');
    const quoteEl = doc.querySelector('.gmail_quote');
    if (quoteEl?.textContent?.trim()) {
      return quoteEl.textContent.trim();
    }
  } catch {
    // fallback below
  }

  // Fallback: try to grab thread content from the Gmail DOM
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
    // final fallback
  }

  // Last resort: use whatever is in the compose body
  try {
    const text = composeView.getTextContent?.() || composeView.getHTMLContent?.() || '';
    return text.trim() || '[No email context found — please paste the email you want to reply to]';
  } catch {
    return '[No email context found — please paste the email you want to reply to]';
  }
}

// ─── Initialize InboxSDK ───────────────────────────────────────────────────

InboxSDK.load(2, 'dummy_app_id_123').then((sdk) => {
  console.log('✅ InboxSDK loaded successfully!');

  sdk.Compose.registerComposeViewHandler((composeView) => {
    console.log('📝 ComposeView detected — injecting AI Reply button');

    // Add AI Reply button to the compose toolbar
    composeView.addButton({
      title: "Generate AI Reply",
      iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23444444"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>',
      onClick: function(event) {
        console.log("🖱️ AI Button Clicked!");
        const emailContext = extractEmailContext(composeView);
        mountModal(emailContext, composeView);
      }
    });
  });
}).catch((err) => {
  console.error('❌ InboxSDK failed to load:', err);
});
