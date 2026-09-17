import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import App from './App';
import cssText from './styles.css?inline';



const MSG_OPEN_MODAL = 'GMAIL_AI_REPLY_OPEN';
const MSG_INSERT_DRAFT = 'GMAIL_AI_REPLY_INSERT_DRAFT';

console.log('🚀 [ISOLATED world] Gmail AI Reply extension is injected and running!');


let modalRoot: Root | null = null;
let modalHost: HTMLDivElement | null = null;

function mountModal(emailContext: string) {
  if (modalHost) {
    unmountModal();
  }

  modalHost = document.createElement('div');
  modalHost.id = 'gmail-ai-reply-root';
  document.body.appendChild(modalHost);

  const shadowRoot = modalHost.attachShadow({ mode: 'open' });

  const styleEl = document.createElement('style');
  styleEl.textContent = cssText;
  shadowRoot.appendChild(styleEl);

  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href =
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
  shadowRoot.appendChild(fontLink);

  const mountPoint = document.createElement('div');
  shadowRoot.appendChild(mountPoint);

  modalRoot = createRoot(mountPoint);
  modalRoot.render(
    <React.StrictMode>
      <App
        emailContext={emailContext}
        onInsertDraft={(draft: string) => {
          // Send the draft back to the MAIN world for insertion via gmail-js
          window.postMessage(
            {
              type: MSG_INSERT_DRAFT,
              draft,
            },
            '*'
          );
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


window.addEventListener('message', (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;
  if (event.data?.type !== MSG_OPEN_MODAL) return;

  const emailContext: string = event.data.emailContext;
  console.log('📩 [ISOLATED world] Received email context, mounting modal');
  mountModal(emailContext);
});
