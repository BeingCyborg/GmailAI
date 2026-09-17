import React, { useCallback } from 'react';
import { QuestionModal } from './components/QuestionModal';

interface AppProps {
  emailContext: string;
  onInsertDraft: (draft: string) => void;
  onClose: () => void;
}

const App: React.FC<AppProps> = ({ emailContext, onInsertDraft, onClose }) => {
  const handleDraftReady = useCallback(
    (draft: string) => {
      onInsertDraft(draft);
      onClose();
    },
    [onInsertDraft, onClose]
  );

  return (
    <QuestionModal
      emailContext={emailContext}
      onDraftReady={handleDraftReady}
      onClose={onClose}
    />
  );
};

export default App;
