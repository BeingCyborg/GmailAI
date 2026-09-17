# Gmail AI Reply Assistant

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white) ![Manifest V3](https://img.shields.io/badge/Manifest_V3-333333?style=for-the-badge) ![Gemini](https://img.shields.io/badge/Gemini-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)

<br />
<div align="center">
  <video src="https://raw.githubusercontent.com/BeingCyborg/GmailAI/main/public/Intro.mp4" width="800" autoplay loop muted playsinline></video>
</div>
<br />

## Overview
Gmail AI Reply Assistant is a powerful Manifest V3 Chrome Extension that seamlessly integrates into Gmail to help you craft professional, context-aware email replies. Powered by the Google Gemini API, it analyzes the context of your email thread, asks you 2-3 clarifying questions to determine your intent, and generates a personalized, high-quality reply drafted directly into your compose window.

## Key Features
- **Context-Aware Question Generation**: Automatically extracts the email thread context and generates highly relevant clarifying questions to guide the tone and content of the reply.
- **Custom Material Design 3 Modal**: A fully custom, sleek React-based UI that matches Google's own MD3 design system for a native look and feel inside Gmail.
- **Secure API Key Storage**: Your Gemini API key is stored securely using local storage, keeping you in full control of your credentials.
- **Intelligent Draft Injection**: Seamlessly inserts the AI-generated reply back into the Gmail compose body using `gmail-js`.

## Architecture

The extension uses a multi-world architecture to comply with Manifest V3 restrictions and Gmail's strict Content Security Policy.

```mermaid
sequenceDiagram
    participant MW as Main World (gmailjs-loader.ts)
    participant IW as Isolated World (React Modal)
    participant BG as Background Service Worker
    participant API as Gemini REST API

    MW->>MW: Inject AI Reply Button into Gmail
    Note over MW: User clicks "AI Reply"
    MW->>IW: window.postMessage (Open Modal & Send Context)
    IW->>BG: chrome.runtime.sendMessage (GENERATE_QUESTIONS)
    BG->>API: Fetch Questions via Gemini API
    API-->>BG: Return Questions JSON
    BG-->>IW: Return Questions
    Note over IW: User answers questions
    IW->>BG: chrome.runtime.sendMessage (GENERATE_DRAFT)
    BG->>API: Generate Draft based on Answers
    API-->>BG: Return Draft Text
    BG-->>IW: Return Draft
    IW->>MW: window.postMessage (INSERT_DRAFT)
    MW->>MW: Inject Draft into Compose Body
```



## Tech Stack
- **Framework**: React 18
- **Build Tool**: Vite + CRXJS Vite Plugin
- **Styling**: Tailwind CSS
- **DOM Interoperability**: `gmail-js`, jQuery
- **Manifest Version**: MV3
- **AI Integration**: Google Gemini API via REST

## Security Note
> [!IMPORTANT]
> Your API keys are stored **entirely locally** using `chrome.storage.local`. They are never sent to third-party servers, databases, or analytics services. The only external requests made with your API key are to Google's official generative AI endpoints (`https://generativelanguage.googleapis.com`).
