import React, { useState, useEffect } from 'react';
import { generateAutoSuggestion, extractMonacoCode, AIProvider } from '../utils/ai';

const boxStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '40px',
  right: '40px',
  width: '400px',
  backgroundColor: '#1E1E2E',
  borderRadius: '8px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  border: '1px solid #45475A',
  padding: '16px',
  zIndex: 999999,
  fontFamily: 'monospace',
  color: '#Cdd6f4',
  fontSize: '13px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  opacity: 0.95,
  pointerEvents: 'none' // Don't block clicks
};

const titleStyle: React.CSSProperties = {
  fontWeight: 'bold',
  color: '#89b4fa',
  marginBottom: '4px',
  borderBottom: '1px solid #45475A',
  paddingBottom: '4px',
  display: 'flex',
  justifyContent: 'space-between'
};

const codeStyle: React.CSSProperties = {
  whiteSpace: 'pre-wrap',
  margin: 0,
  maxHeight: '300px',
  overflowY: 'auto'
};

const instructionStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#a6adc8',
  textAlign: 'right',
  marginTop: '8px'
};

export const SuggestionBox: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');

  const [provider, setProvider] = useState<AIProvider>('openai');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    chrome.storage.local.get(['aiProvider', 'aiApiKey', 'aiModel'], (res) => {
      if (res.aiProvider) setProvider(res.aiProvider as AIProvider);
      if (res.aiApiKey) setApiKey(res.aiApiKey);
      if (res.aiModel) setModel(res.aiModel);
    });

    const changedListener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.aiProvider) setProvider(changes.aiProvider.newValue);
      if (changes.aiApiKey) setApiKey(changes.aiApiKey.newValue);
      if (changes.aiModel) setModel(changes.aiModel.newValue);
    };
    chrome.storage.onChanged.addListener(changedListener);
    return () => chrome.storage.onChanged.removeListener(changedListener);
  }, []);

  const hideBox = () => {
    setIsVisible(false);
    setSuggestion('');
    setIsLoading(false);
  };

  const injectSuggestion = () => {
    if (!suggestion) return;
    hideBox();

    setTimeout(() => {
      let activeElement = document.activeElement;
      if (!activeElement || activeElement.tagName !== 'TEXTAREA') {
        const monacoTextarea = document.querySelector('.monaco-editor textarea');
        if (monacoTextarea) {
          (monacoTextarea as HTMLElement).focus();
          activeElement = monacoTextarea;
        }
      }

      if (activeElement && activeElement.tagName === 'TEXTAREA') {
        try {
          const dataTransfer = new DataTransfer();
          dataTransfer.setData('text/plain', suggestion + '\n');
          const pasteEvent = new ClipboardEvent('paste', { clipboardData: dataTransfer, bubbles: true, cancelable: true });
          activeElement.dispatchEvent(pasteEvent);
        } catch (error) {
          document.execCommand('insertText', false, suggestion + '\n');
        }
      } else {
        document.execCommand('insertText', false, suggestion + '\n');
      }
    }, 10);
  };

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isMonacoEditor = activeEl && activeEl.tagName === 'TEXTAREA' && activeEl.closest('.monaco-editor');

      // If we are showing a suggestion and they hit Tab, accept it.
      if (isVisible) {
        if (e.key === 'Tab' && suggestion) {
          e.preventDefault();
          e.stopPropagation();
          injectSuggestion();
          return;
        } else if (e.key === 'Escape') {
          hideBox();
          return;
        } else if (e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Meta') {
          // Any other typing dismisses the suggestion
          hideBox();
        }
      }

      // Detect trigger: Enter in Monaco Editor
      if (isMonacoEditor && e.key === 'Enter') {
        // Wait briefly for the DOM to update with the new line
        setTimeout(async () => {
          const code = extractMonacoCode();
          const lines = code.split('\n');
          let lastComment = '';
          
          // Find the last non-empty line
          for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.length === 0) continue;
            if (line.startsWith('//') || line.startsWith('#')) {
              lastComment = line;
              break;
            } else {
              // The last written code wasn't a comment
              break;
            }
          }

          if (lastComment) {
            if (!apiKey) {
              console.warn('[LeetCode Command Palette] API key not set for auto-suggestion.');
              return;
            }

            // Trigger suggestion
            setIsVisible(true);
            setIsLoading(true);
            setSuggestion('');

            try {
              const res = await generateAutoSuggestion(provider, apiKey, model, code, lastComment);
              if (res) {
                setSuggestion(res);
                setIsLoading(false);
              } else {
                hideBox(); // Nothing generated
              }
            } catch (err) {
              console.error('Failed to generate auto suggestion', err);
              hideBox();
            }
          }
        }, 100);
      }
    };

    // Use capture phase to intercept Tab before monaco does
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [isVisible, suggestion, provider, apiKey, model]);

  if (!isVisible) return null;

  return (
    <div style={boxStyle}>
      <div style={titleStyle}>
        <span>✨ AI Auto Suggestion</span>
        {isLoading && <span style={{ color: '#f9e2af' }}>Generating...</span>}
      </div>
      {!isLoading && suggestion && (
        <>
          <pre style={codeStyle}>{suggestion}</pre>
          <div style={instructionStyle}>Press <kbd style={{backgroundColor: '#313244', padding: '2px 4px', borderRadius: '4px'}}>Tab</kbd> to accept, <kbd style={{backgroundColor: '#313244', padding: '2px 4px', borderRadius: '4px'}}>Esc</kbd> to dismiss</div>
        </>
      )}
    </div>
  );
};
