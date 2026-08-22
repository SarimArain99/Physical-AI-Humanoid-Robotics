import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from '../../utils/authClient';
import { Globe, X, Loader2, BookOpen, ChevronRight, Layers } from 'lucide-react';
import { marked } from 'marked';
import { useLocation } from '@docusaurus/router';
import './ChapterTools.css';
import { getApiUrl } from '@site/src/utils/apiConfig';

export default function ChapterTools() {
  const { data: session } = useSession();
  const location = useLocation();
  
  // Translation State
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationText, setTranslationText] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [translationError, setTranslationError] = useState('');

  // Personalization State
  const [isPersonalizeOpen, setIsPersonalizeOpen] = useState(false);
  const [activeLevel, setActiveLevel] = useState('advanced'); // 'advanced' is the original content
  const [isPersonalizing, setIsPersonalizing] = useState(false);
  const [personalizeError, setPersonalizeError] = useState('');
  
  // DOM References
  const originalMarkdownCache = useRef(null);
  
  // Lock body scroll when panel is open
  useEffect(() => {
    if (isPanelOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isPanelOpen]);

  const handleTranslate = async () => {
    setIsPanelOpen(true);
    setTranslationError('');
    
    const pageId = window.location.pathname;
    const cacheKey = `urdu_translation_${pageId}`;
    
    try {
      const cacheRes = await fetch(`${getApiUrl()}/api/cache/${cacheKey}`);
      if (cacheRes.ok) {
        const cacheData = await cacheRes.json();
        if (cacheData.content) {
          setTranslationText(cacheData.content);
          return;
        }
      }
    } catch(e) {}

    setIsTranslating(true);
    setTranslationText('');
    
    try {
      const article = document.querySelector('article');
      const textToTranslate = article ? article.innerText.slice(0, 4000) : "No content found.";
      
      const response = await fetch(`${getApiUrl()}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToTranslate, target_language: "Urdu" })
      });
      
      if (!response.ok) throw new Error("Translation API failed");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullTranslation = "";
      let buffer = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              fullTranslation += data.content;
              setTranslationText(fullTranslation);
            } catch (e) {}
          }
        }
        buffer = lines[lines.length - 1];
      }
      
      if (fullTranslation) {
         await fetch(`${getApiUrl()}/api/cache`, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ key: cacheKey, content: fullTranslation })
         }).catch(e => console.error(e));
      }
    } catch (err) {
      console.error(err);
      setTranslationError("Failed to translate the page. Please ensure the backend is running.");
    } finally {
      setIsTranslating(false);
    }
  };

  // Use a ref to always have the latest handleTranslate available to event listeners
  const handleTranslateRef = useRef(handleTranslate);
  useEffect(() => {
    handleTranslateRef.current = handleTranslate;
  });

  // Setup event delegation and path-based visibility for navbar buttons
  useEffect(() => {
    const isDocPage = location.pathname.startsWith('/docs/');
    
    const updateVisibility = () => {
      const translateBtns = document.querySelectorAll('.nav-translate-btn');
      const personalizeBtns = document.querySelectorAll('.nav-personalize-btn');
      
      const targetDisplay = isDocPage ? 'flex' : 'none';

      translateBtns.forEach(btn => {
        if (btn.style.display !== targetDisplay) {
          btn.style.setProperty('display', targetDisplay, 'important');
        }
      });
      personalizeBtns.forEach(btn => {
        if (btn.style.display !== targetDisplay) {
          btn.style.setProperty('display', targetDisplay, 'important');
        }
      });
    };

    updateVisibility();

    // Debounced MutationObserver to prevent cascading DOM mutation lag
    let debounceTimer = null;
    const observer = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updateVisibility, 150);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const handleGlobalClick = (e) => {
      const translateBtn = e.target.closest('.nav-translate-btn') || e.target.closest('#nav-translate-btn');
      const personalizeBtn = e.target.closest('.nav-personalize-btn') || e.target.closest('#nav-personalize-btn');
      
      if (translateBtn) {
        e.preventDefault();
        
        // Close Docusaurus mobile sidebar if open
        const closeBtn = document.querySelector('.navbar-sidebar__close');
        if (closeBtn) closeBtn.click();

        if (!session) {
          const loginBtn = document.querySelector('.nav-login-btn');
          if (loginBtn) loginBtn.click();
          return;
        }
        handleTranslateRef.current();
      }
      
      if (personalizeBtn) {
        e.preventDefault();
        
        // Close Docusaurus mobile sidebar if open
        const closeBtn = document.querySelector('.navbar-sidebar__close');
        if (closeBtn) closeBtn.click();

        if (!session) {
          const loginBtn = document.querySelector('.nav-login-btn');
          if (loginBtn) loginBtn.click();
          return;
        }
        setIsPersonalizeOpen(prev => !prev);
      }
    };
    
    document.addEventListener('click', handleGlobalClick);
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      observer.disconnect();
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [session, location.pathname]);

  const handleLevelChange = async (level) => {
    if (activeLevel === level) return;
    setActiveLevel(level);
    setPersonalizeError('');
    
    const articleContainer = document.querySelector('article .theme-doc-markdown');
    if (!articleContainer) return;
    
    // Setup references
    let customDiv = document.getElementById('ai-personalized-content');
    
    // Original Content Restoration (Advanced)
    if (level === 'advanced') {
      if (customDiv) customDiv.style.display = 'none';
      Array.from(articleContainer.children).forEach(child => {
        if (child.id !== 'ai-personalized-content') {
          child.style.display = '';
        }
      });
      return;
    }
    
    // Hide original children
    Array.from(articleContainer.children).forEach(child => {
      if (child.id !== 'ai-personalized-content') {
        if (!originalMarkdownCache.current) {
           originalMarkdownCache.current = articleContainer.innerText;
        }
        child.style.display = 'none';
      }
    });
    
    // Create custom div if not exists
    if (!customDiv) {
      customDiv = document.createElement('div');
      customDiv.id = 'ai-personalized-content';
      customDiv.className = 'markdown';
      articleContainer.appendChild(customDiv);
    }
    customDiv.style.display = 'block';
    
    const pageId = window.location.pathname;
    const cacheKey = `personalize_${pageId}_${level}`;
    try {
      const cacheRes = await fetch(`${getApiUrl()}/api/cache/${cacheKey}`);
      if (cacheRes.ok) {
        const cacheData = await cacheRes.json();
        if (cacheData.content) {
          customDiv.innerHTML = marked.parse(cacheData.content);
          return;
        }
      }
    } catch (e) {}
    
    setIsPersonalizing(true);
    customDiv.innerHTML = '<div class="personalize-loading" style="padding:40px; text-align:center; color:var(--ifm-color-emphasis-700);"><div class="spinner" style="margin-bottom:12px;"></div><div>Generating personalized content...</div></div>';
    
    try {
      const textToProcess = originalMarkdownCache.current ? originalMarkdownCache.current.slice(0, 5000) : "No content";
      const apiUrl = level === 'flashcards' ? `${getApiUrl()}/api/flashcards` : `${getApiUrl()}/api/personalize`;
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToProcess, level })
      });
      
      if (!response.ok) throw new Error("API failed");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              fullContent += data.content;
              customDiv.innerHTML = marked.parse(fullContent);
            } catch (e) {}
          }
        }
        buffer = lines[lines.length - 1];
      }
      
      if (fullContent) {
         await fetch(`${getApiUrl()}/api/cache`, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ key: cacheKey, content: fullContent })
         }).catch(e => console.error(e));
      }
    } catch (err) {
      console.error(err);
      setPersonalizeError("Failed to personalize the page.");
      customDiv.innerHTML = `<div class="alert alert--danger" style="margin:20px;">Failed to personalize content. Please try again.</div>`;
    } finally {
      setIsPersonalizing(false);
    }
  };

  return (
    <>
      {/* Personalize Sticky Bar */}
      {isPersonalizeOpen && (
        <div className="personalize-bar">
          <div className="personalize-bar-inner">
            <div className="personalize-bar-title">
              <Layers size={18} />
              <span>Learning Level:</span>
            </div>
            
            <div className="segmented-control">
              <button 
                className={`segment-btn ${activeLevel === 'beginner' ? 'active' : ''}`}
                onClick={() => handleLevelChange('beginner')}
                disabled={isPersonalizing}
              >
                Beginner
              </button>
              <button 
                className={`segment-btn ${activeLevel === 'intermediate' ? 'active' : ''}`}
                onClick={() => handleLevelChange('intermediate')}
                disabled={isPersonalizing}
              >
                Intermediate
              </button>
              <button 
                className={`segment-btn ${activeLevel === 'flashcards' ? 'active' : ''}`}
                onClick={() => handleLevelChange('flashcards')}
                disabled={isPersonalizing}
              >
                Flashcards ⚡
              </button>
              <button 
                className={`segment-btn ${activeLevel === 'advanced' ? 'active' : ''}`}
                onClick={() => handleLevelChange('advanced')}
                disabled={isPersonalizing}
              >
                Original
              </button>
            </div>
            
            <button className="personalize-close" onClick={() => setIsPersonalizeOpen(false)}>
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Translation Slide-in Panel */}
      <div className={`translation-panel-overlay ${isPanelOpen ? 'open' : ''}`} onClick={() => setIsPanelOpen(false)}></div>
      <div className={`translation-panel ${isPanelOpen ? 'open' : ''}`}>
        <div className="translation-panel-header">
          <h3>Urdu Translation</h3>
          <button className="translation-panel-close" onClick={() => setIsPanelOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <div className="translation-panel-content">
          {translationError && (
            <div className="alert alert--danger">{translationError}</div>
          )}
          
          <div className="translation-text urdu-text">
            {translationText}
          </div>
          
          {isTranslating && (
            <div className="translation-loading">
              <Loader2 className="spinner" size={24} />
              <span>Translating content via AI...</span>
            </div>
          )}
          
          {!isTranslating && !translationText && !translationError && (
            <div className="translation-empty">
              No translation available.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
