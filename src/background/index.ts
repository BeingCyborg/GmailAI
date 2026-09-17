
import { generateQuestions, generateDraft } from './gemini';
import { getApiKey, getModel } from '../shared/storage';
import type {
  MessageRequest,
  QuestionsResponse,
  DraftResponse,
} from '../shared/messaging';



chrome.runtime.onMessage.addListener(
  (
    message: MessageRequest,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: QuestionsResponse | DraftResponse) => void
  ) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((err) =>
        sendResponse({ success: false, error: String(err?.message || err) })
      );

    // Return true to indicate async response
    return true;
  }
);

async function handleMessage(
  message: MessageRequest
): Promise<QuestionsResponse | DraftResponse> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    return {
      success: false,
      error:
        'Gemini API key not configured. Please set it in the extension Options page.',
    };
  }

  const model = await getModel();

  switch (message.action) {
    case 'GENERATE_QUESTIONS': {
      const questions = await generateQuestions(
        apiKey,
        model,
        message.emailContext
      );
      return { success: true, questions };
    }

    case 'GENERATE_DRAFT': {
      const draft = await generateDraft(
        apiKey,
        model,
        message.emailContext,
        message.answers
      );
      return { success: true, draft };
    }

    default:
      return { success: false, error: 'Unknown action' };
  }
}



chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Show badge to indicate setup is required
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
  }
});
