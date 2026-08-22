import React, { useState, useRef, useEffect } from 'react';
import { useSession } from '../../utils/authClient';
import { MessageSquare, X, Send, Bot, User, FileText } from 'lucide-react';
import { getApiUrl } from '@site/src/utils/apiConfig';
import './ChatWidget.css';

const API_BASE = getApiUrl();

function ChatMessage({ message }) {
  return (
    <div className={`chat-message chat-message--${message.role}`}>
      <div className="chat-message__avatar">
        {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className="chat-message__content">
        <div className="chat-message__text">{message.content}</div>
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I am your Physical AI textbook assistant. Ask me anything about the course content, or select text on any page and click "Ask about selection" to learn more.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [localSessionId] = useState(() => 'session_' + Math.random().toString(36).slice(2, 10));
  
  const sessionId = session?.user?.email || localSessionId;
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Track text selection on the page
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (text && text.length > 10 && text.length < 2000) {
        setSelectedText(text);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const sendMessage = async (text, withSelectedText = false) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const endpoint = withSelectedText ? '/api/chat/selected' : '/api/chat';
      const body = withSelectedText
        ? { message: text, selected_text: selectedText, session_id: sessionId }
        : { message: text, session_id: sessionId };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              assistantContent += parsed.content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: assistantContent,
                };
                return updated;
              });
            } catch (e) {
              // Skip malformed chunks
            }
          }
        }
      }
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Unable to connect to the chatbot API. Please ensure the backend is running at ' + API_BASE,
        };
        return updated;
      });
    }

    setIsLoading(false);
    if (withSelectedText) setSelectedText('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input, false);
  };

  const handleAskAboutSelection = () => {
    const question = `Please explain this text from the textbook:\n\n"${selectedText}"`;
    sendMessage(question, true);
  };

  return (
    <>
      <button
        className={`chat-fab ${isOpen ? 'chat-fab--open' : ''}`}
        onClick={() => {
          if (!session && !isOpen) {
            const loginBtn = document.querySelector('.nav-login-btn');
            if (loginBtn) loginBtn.click();
            return;
          }
          setIsOpen(!isOpen);
        }}
        aria-label={isOpen ? 'Close chat' : 'Open chat assistant'}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      <div className={`chat-panel ${isOpen ? 'chat-panel--open' : ''}`}>
        <div className="chat-panel__header">
          <div className="chat-panel__header-info">
            <div className="chat-panel__header-icon">
              <Bot size={20} />
            </div>
            <div>
              <div className="chat-panel__header-title">AI Teaching Assistant</div>
              <div className="chat-panel__header-subtitle">Physical AI Textbook</div>
            </div>
          </div>
          <button
            className="chat-panel__close"
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        </div>

        {selectedText && (
          <div className="chat-panel__selection">
            <div className="chat-panel__selection-header">
              <FileText size={14} /> Selected Text
            </div>
            <div className="chat-panel__selection-text">
              "{selectedText}"
            </div>
            <button
              className="chat-panel__selection-btn"
              onClick={handleAskAboutSelection}
            >
              Ask about selection
            </button>
          </div>
        )}

        <div className="chat-panel__messages">
          {messages.map((msg, idx) => (
            <ChatMessage key={idx} message={msg} />
          ))}
          {isLoading && messages[messages.length - 1]?.content === '' && (
            <div className="chat-typing">
              <span></span><span></span><span></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-panel__input-container" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="chat-panel__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={isLoading}
          />
          <button
            type="submit"
            className="chat-panel__submit"
            disabled={isLoading || !input.trim()}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  );
}
