// ─── Message Types ──────────────────────────────────────────────────────────

export interface GenerateQuestionsRequest {
  action: 'GENERATE_QUESTIONS';
  emailContext: string;
}

export interface GenerateDraftRequest {
  action: 'GENERATE_DRAFT';
  emailContext: string;
  answers: QAPair[];
}

export type MessageRequest = GenerateQuestionsRequest | GenerateDraftRequest;

// ─── Response Types ─────────────────────────────────────────────────────────

export interface SuccessQuestionsResponse {
  success: true;
  questions: string[];
}

export interface SuccessDraftResponse {
  success: true;
  draft: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export type QuestionsResponse = SuccessQuestionsResponse | ErrorResponse;
export type DraftResponse = SuccessDraftResponse | ErrorResponse;

// ─── Shared Types ───────────────────────────────────────────────────────────

export interface QAPair {
  question: string;
  answer: string;
}

// ─── Helper Functions ───────────────────────────────────────────────────────

export function sendMessage<T>(message: MessageRequest): Promise<T> {
  return chrome.runtime.sendMessage(message);
}
