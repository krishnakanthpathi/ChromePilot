import React, { useState, useEffect, useRef } from 'react';
import { snippets, Snippet } from '../data/snippets';
import { generateSuggestion, extractMonacoCode, AIProvider } from '../utils/ai';

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  paddingTop: '15vh',
  zIndex: 999999,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
};

const paletteStyle: React.CSSProperties = {
  width: '600px',
  backgroundColor: '#1e1e1e',
  borderRadius: '8px',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '16px 20px',
  fontSize: '18px',
  backgroundColor: 'transparent',
  border: 'none',
  borderBottom: '1px solid #333',
  color: '#e0e0e0',
  outline: 'none',
  boxSizing: 'border-box'
};

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  maxHeight: '400px',
  overflowY: 'auto'
};

const itemStyle = (isSelected: boolean): React.CSSProperties => ({
  padding: '12px 20px',
  cursor: 'pointer',
  backgroundColor: isSelected ? '#2d2d2d' : 'transparent',
  color: '#e0e0e0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
});

const settingsContainerStyle: React.CSSProperties = {
  padding: '16px 20px',
  backgroundColor: '#252525',
  borderTop: '1px solid #333',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
};

const settingsRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: '#e0e0e0',
  fontSize: '14px'
};

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const [provider, setProvider] = useState<AIProvider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['aiProvider', 'aiApiKey'], (res) => {
      if (res.aiProvider) setProvider(res.aiProvider as AIProvider);
      if (res.aiApiKey) setApiKey(res.aiApiKey);
    });
  }, []);

  const saveSettings = () => {
    chrome.storage.local.set({ aiProvider: provider, aiApiKey: apiKey });
    setShowSettings(false);
  };

  const isAIQuery = query.toLowerCase().startsWith('ai ');
  const aiQueryText = isAIQuery ? query.slice(3) : '';

  const filteredSnippets = isAIQuery 
    ? [{ id: 'ai-gen', title: isGenerating ? 'Generating...' : `Generate AI Suggestion for: "${aiQueryText}"`, tags: ['AI'], code: '' }] 
    : snippets.filter(snippet => 
        snippet.title.toLowerCase().includes(query.toLowerCase()) || 
        snippet.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(prev => !prev);
        setQuery('');
        setSelectedIndex(0);
        setShowSettings(false);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        e.stopPropagation();
      }
    };
    
    document.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const insertSnippet = (snippet: Snippet) => {
    setIsOpen(false);
    
    setTimeout(() => {
      let activeElement = document.activeElement;
      console.log('[LeetCode Command Palette] Injecting snippet:', snippet.title);
      
      if (!activeElement || activeElement.tagName !== 'TEXTAREA') {
        const monacoTextarea = document.querySelector('.monaco-editor textarea'); 
        const fallbackTextarea = document.querySelector('textarea'); 
        const target = monacoTextarea || fallbackTextarea;
        if (target) {
          (target as HTMLElement).focus();
          activeElement = target;
        }
      }

      if (activeElement && activeElement.tagName === 'TEXTAREA') {
        try {
          const dataTransfer = new DataTransfer();
          dataTransfer.setData('text/plain', snippet.code);
          const pasteEvent = new ClipboardEvent('paste', { clipboardData: dataTransfer, bubbles: true, cancelable: true });
          activeElement.dispatchEvent(pasteEvent);
        } catch (error) {
          document.execCommand('insertText', false, snippet.code);
        }
      } else {
        document.execCommand('insertText', false, snippet.code);
      }
    }, 100);
  };

  const handleAISelect = async () => {
    if (!aiQueryText.trim() || isGenerating) return;
    if (!apiKey) {
      alert('Please configure your API key in Settings first.');
      setShowSettings(true);
      return;
    }
    
    setIsGenerating(true);
    try {
      const codeContext = extractMonacoCode();
      const suggestion = await generateSuggestion(provider, apiKey, codeContext, aiQueryText);
      insertSnippet({ id: 'ai-generated', title: 'AI Snippet', tags: [], code: suggestion });
    } catch (e: any) {
      alert("AI Generation failed: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation(); 
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredSnippets.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSnippets.length > 0) {
        if (isAIQuery) {
          handleAISelect();
        } else {
          insertSnippet(filteredSnippets[selectedIndex]);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(0);
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle} onClick={() => setIsOpen(false)}>
      <div style={paletteStyle} onClick={e => e.stopPropagation()}>
        <input 
          ref={inputRef}
          style={inputStyle}
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          placeholder="Search snippets or type 'ai <prompt>' to generate..."
        />
        <ul style={listStyle}>
          {filteredSnippets.length === 0 ? (
            <li style={{ padding: '12px 20px', color: '#888' }}>No snippets found</li>
          ) : (
            filteredSnippets.map((snippet, index) => {
              const selected = index === selectedIndex;
              return (
                <li 
                  key={snippet.id} 
                  style={itemStyle(selected)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => {
                    if (isAIQuery) handleAISelect();
                    else insertSnippet(snippet);
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{snippet.title}</span>
                  <span style={{ fontSize: '13px', color: '#888', background: '#333', padding: '2px 6px', borderRadius: '4px' }}>
                    {snippet.tags.join(', ')}
                  </span>
                </li>
              );
            })
          )}
        </ul>
        
        {/* Settings Footer */}
        <div 
          style={{ padding: '8px 20px', fontSize: '12px', color: '#888', cursor: 'pointer', textAlign: 'right', borderTop: '1px solid #333' }}
          onClick={() => setShowSettings(!showSettings)}
        >
          ⚙️ AI Settings
        </div>

        {showSettings && (
          <div style={settingsContainerStyle}>
            <div style={settingsRowStyle}>
              <label>AI Provider</label>
              <select 
                value={provider} 
                onChange={e => setProvider(e.target.value as AIProvider)}
                style={{ padding: '4px', backgroundColor: '#333', color: '#e0e0e0', border: '1px solid #444', borderRadius: '4px' }}
              >
                <option value="openai">OpenAI</option>
                <option value="gemini">Google Gemini</option>
              </select>
            </div>
            <div style={settingsRowStyle}>
              <label>API Key</label>
              <input 
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Enter API Key"
                style={{ padding: '4px', backgroundColor: '#1e1e1e', color: '#e0e0e0', border: '1px solid #444', borderRadius: '4px', width: '200px' }}
              />
            </div>
            <button 
              onClick={saveSettings}
              style={{ padding: '6px', backgroundColor: '#007acc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '4px' }}
            >
              Save Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
