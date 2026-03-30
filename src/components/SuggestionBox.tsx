import React, { useState, useEffect } from 'react';
import { generateAutoSuggestion, extractMonacoCode, AIProvider } from '../utils/ai';

export const SuggestionBox: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [cursorState, setCursorState] = useState<{ top: number; left: number; lineContentLeft: number; fontFamily: string; fontSize: string; height: number } | null>(null);

  const [provider, setProvider] = useState<AIProvider>('openai');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
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
    }
  }, []);

  useEffect(() => {
    let idleTimeout: NodeJS.Timeout;

    const startIdleTimer = () => {
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        setIsVisible((prevIsVisible) => {
          if (prevIsVisible) return prevIsVisible;
          document.dispatchEvent(new CustomEvent('monaco-idle-5s'));
          return prevIsVisible;
        });
      }, 5000);
    };

    const handleInteraction = () => {
      startIdleTimer();
    };

    document.addEventListener('keydown', handleInteraction, { capture: true });
    document.addEventListener('mousedown', handleInteraction, { capture: true });
    startIdleTimer();

    return () => {
      clearTimeout(idleTimeout);
      document.removeEventListener('keydown', handleInteraction, { capture: true });
      document.removeEventListener('mousedown', handleInteraction, { capture: true });
    };
  }, []);

  useEffect(() => {
    const handleIdle = async () => {
      if (isVisible || isLoading) return;
      if (!apiKey) return;
      
      const activeEl = document.activeElement;
      const isMonacoEditor = activeEl && activeEl.tagName === 'TEXTAREA' && activeEl.closest('.monaco-editor');
      if (!isMonacoEditor) return;

      const code = extractMonacoCode();
      if (!code.trim()) return;

      setIsVisible(true);
      setIsLoading(true);
      setSuggestion('');

      try {
        const res = await generateAutoSuggestion(provider, apiKey, model, code, '');
        if (res) {
          setSuggestion(res);
          setIsLoading(false);
        } else {
          setIsVisible(false);
          setIsLoading(false);
          setSuggestion('');
        }
      } catch (err) {
        console.error('Failed to generate idle auto suggestion', err);
        setIsVisible(false);
        setIsLoading(false);
        setSuggestion('');
      }
    };
    
    document.addEventListener('monaco-idle-5s', handleIdle as EventListener);
    return () => document.removeEventListener('monaco-idle-5s', handleIdle as EventListener);
  }, [isVisible, isLoading, provider, apiKey, model]);

  useEffect(() => {
    if (isVisible) {
      const cursor = document.querySelector('.monaco-editor .cursor') as HTMLElement;
      const linesContent = document.querySelector('.monaco-editor .lines-content') as HTMLElement;
      if (cursor && linesContent) {
        const cursorRect = cursor.getBoundingClientRect();
        const contentRect = linesContent.getBoundingClientRect();
        
        let fontFamily = 'monospace';
        let fontSize = '14px';
        const viewLine = document.querySelector('.monaco-editor .view-line');
        if (viewLine) {
          const styles = window.getComputedStyle(viewLine);
          fontFamily = styles.fontFamily;
          fontSize = styles.fontSize;
        }

        setCursorState({
          top: cursorRect.top,
          left: cursorRect.left,
          lineContentLeft: contentRect.left,
          fontFamily,
          fontSize,
          height: cursorRect.height || parseInt(fontSize, 10) * 1.5
        });
      }
    } else {
      setCursorState(null);
    }
  }, [isVisible, suggestion]);

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

  useEffect(() => {
    const handleDismiss = () => {
      if (isVisible) {
        setIsVisible(false);
        setSuggestion('');
        setIsLoading(false);
      }
    };
    document.addEventListener('mousedown', handleDismiss);
    document.addEventListener('wheel', handleDismiss);
    return () => {
      document.removeEventListener('mousedown', handleDismiss);
      document.removeEventListener('wheel', handleDismiss);
    };
  }, [isVisible]);

  if (!isVisible) return null;
  if (!cursorState) return null;

  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: `${cursorState.top}px`,
        left: `${cursorState.left}px`,
        color: '#6e738d',
        fontFamily: cursorState.fontFamily,
        fontSize: cursorState.fontSize,
        lineHeight: `${cursorState.height}px`,
        pointerEvents: 'none',
        zIndex: 999999,
        opacity: 0.5
      }}>
        ...
      </div>
    );
  }

  if (!suggestion) return null;

  const lines = suggestion.split('\n');

  return (
    <div style={{
      position: 'fixed',
      top: `${cursorState.top}px`,
      left: `${cursorState.lineContentLeft}px`,
      color: '#6e738d',
      fontFamily: cursorState.fontFamily,
      fontSize: cursorState.fontSize,
      lineHeight: `${cursorState.height}px`,
      pointerEvents: 'none',
      zIndex: 999999,
      opacity: 0.6
    }}>
      {lines.map((line, i) => {
        if (i === 0) {
          return (
            <div key={i} style={{ 
              whiteSpace: 'pre', 
              position: 'absolute', 
              left: `${cursorState.left - cursorState.lineContentLeft}px`,
              top: 0
            }}>
              {line}
            </div>
          );
        } else {
          return (
            <div key={i} style={{ 
              whiteSpace: 'pre',
              position: 'absolute',
              left: 0,
              top: `${i * cursorState.height}px`
            }}>
              {line}
            </div>
          );
        }
      })}
    </div>
  );
};
