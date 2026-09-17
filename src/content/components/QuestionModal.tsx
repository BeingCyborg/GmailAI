import React, { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { sendMessage } from '../../shared/messaging';
import type {
  QAPair,
  QuestionsResponse,
  DraftResponse,
} from '../../shared/messaging';

// ─── Types ──────────────────────────────────────────────────────────────────

type ModalState =
  | { phase: 'loading-questions' }
  | { phase: 'questions'; questions: string[] }
  | { phase: 'generating-draft' }
  | { phase: 'error'; message: string; retryPhase: 'questions' | 'draft' };

interface QuestionModalProps {
  emailContext: string;
  onDraftReady: (draft: string) => void;
  onClose: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const QuestionModal: React.FC<QuestionModalProps> = ({
  emailContext,
  onDraftReady,
  onClose,
}) => {
  const [state, setState] = useState<ModalState>({ phase: 'loading-questions' });
  const [answers, setAnswers] = useState<string[]>([]);

  // ── Fetch Questions ─────────────────────────────────────────────────────
  const fetchQuestions = useCallback(async () => {
    setState({ phase: 'loading-questions' });
    try {
      const response = await sendMessage<QuestionsResponse>({
        action: 'GENERATE_QUESTIONS',
        emailContext,
      });

      if (response.success) {
        setState({ phase: 'questions', questions: response.questions });
        setAnswers(new Array(response.questions.length).fill(''));
      } else {
        setState({
          phase: 'error',
          message: response.error,
          retryPhase: 'questions',
        });
      }
    } catch (err) {
      setState({
        phase: 'error',
        message: String(err),
        retryPhase: 'questions',
      });
    }
  }, [emailContext]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // ── Submit Answers ──────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (state.phase !== 'questions') return;

    const qaPairs: QAPair[] = state.questions.map((q, i) => ({
      question: q,
      answer: answers[i] || '',
    }));

    setState({ phase: 'generating-draft' });

    try {
      const response = await sendMessage<DraftResponse>({
        action: 'GENERATE_DRAFT',
        emailContext,
        answers: qaPairs,
      });

      if (response.success) {
        onDraftReady(response.draft);
      } else {
        setState({
          phase: 'error',
          message: response.error,
          retryPhase: 'draft',
        });
      }
    } catch (err) {
      setState({
        phase: 'error',
        message: String(err),
        retryPhase: 'draft',
      });
    }
  };

  // ── Retry ───────────────────────────────────────────────────────────────
  const handleRetry = () => {
    if (state.phase === 'error' && state.retryPhase === 'questions') {
      fetchQuestions();
    }
    // For draft retries, go back to questions phase
    if (state.phase === 'error' && state.retryPhase === 'draft') {
      fetchQuestions();
    }
  };

  // ── Answer Update ───────────────────────────────────────────────────────
  const updateAnswer = (index: number, value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 animate-fade-in"
      style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-modal overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-semibold text-base">
                AI Reply Assistant
              </h2>
              <p className="text-white/70 text-xs">
                Powered by Gemini
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {/* Loading Questions */}
          {state.phase === 'loading-questions' && (
            <div className="py-12 flex flex-col items-center">
              <LoadingSpinner size="lg" label="Analyzing email thread..." />
              <p className="text-xs text-surface-400 mt-4">
                Generating clarifying questions
              </p>
            </div>
          )}

          {/* Questions Form */}
          {state.phase === 'questions' && (
            <form onSubmit={handleSubmit} id="qa-form">
              <p className="text-sm text-surface-500 mb-5">
                Please answer these questions to help craft the perfect reply:
              </p>

              <div className="space-y-5">
                {state.questions.map((question, index) => (
                  <div key={index} className="group">
                    <label className="block text-sm font-medium text-surface-800 mb-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-primary-50 text-primary-600 rounded-full text-xs font-bold mr-2">
                        {index + 1}
                      </span>
                      {question}
                    </label>
                    <textarea
                      value={answers[index] || ''}
                      onChange={(e) => updateAnswer(index, e.target.value)}
                      placeholder="Type your answer..."
                      rows={2}
                      className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm text-surface-800 placeholder:text-surface-400 
                        focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:bg-white
                        transition-all duration-200 resize-none"
                      required
                    />
                  </div>
                ))}
              </div>
            </form>
          )}

          {/* Generating Draft */}
          {state.phase === 'generating-draft' && (
            <div className="py-12 flex flex-col items-center">
              <LoadingSpinner size="lg" label="Composing your reply..." />
              <p className="text-xs text-surface-400 mt-4">
                Crafting a professional response
              </p>
            </div>
          )}

          {/* Error */}
          {state.phase === 'error' && (
            <div className="py-8 text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-surface-800 mb-2">
                Something went wrong
              </p>
              <p className="text-xs text-surface-500 mb-5 max-w-sm mx-auto break-words">
                {state.message}
              </p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                </svg>
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {state.phase === 'questions' && (
          <div className="px-6 py-4 bg-surface-50 border-t border-surface-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-surface-600 hover:text-surface-800 hover:bg-surface-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="qa-form"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold rounded-lg 
                hover:from-primary-700 hover:to-primary-600 
                active:scale-[0.98] shadow-sm hover:shadow-md
                transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
              Generate Reply
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
