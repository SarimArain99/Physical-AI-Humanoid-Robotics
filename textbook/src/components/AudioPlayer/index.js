import React, { useState, useEffect } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { useLocation } from '@docusaurus/router';
import './AudioPlayer.css';

export default function AudioPlayer() {
  const location = useLocation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [utterance, setUtterance] = useState(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
    }
    
    // Clean up on unmount
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const getActiveContent = () => {
    // 1. Try to find Urdu translation content first if the translation panel is open
    const translatePanel = document.querySelector('.translation-panel.open');
    if (translatePanel) {
      const urduDiv = translatePanel.querySelector('.urdu-text');
      if (urduDiv && urduDiv.innerText.trim()) {
        return { text: urduDiv.innerText, lang: 'ur' };
      }
    }

    // 2. Try to find the AI personalized content
    const customDiv = document.getElementById('ai-personalized-content');
    if (customDiv && customDiv.style.display !== 'none' && customDiv.innerText.trim()) {
      return { text: customDiv.innerText, lang: 'en' };
    }

    // 3. Otherwise fallback to original markdown
    const article = document.querySelector('article .theme-doc-markdown');
    return { text: article ? article.innerText : '', lang: 'en' };
  };

  const handlePlay = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    const { text, lang } = getActiveContent();
    if (!text) return;

    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'ur' ? 'ur-PK' : 'en-US';
    
    // Attempt to set matching voice
    if (window.speechSynthesis.getVoices) {
      const voices = window.speechSynthesis.getVoices();
      const targetLang = lang === 'ur' ? 'ur' : 'en';
      const matchingVoice = voices.find(v => v.lang.toLowerCase().startsWith(targetLang));
      if (matchingVoice) {
        u.voice = matchingVoice;
      }
    }
    
    u.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    
    u.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    setUtterance(u);
    window.speechSynthesis.speak(u);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsPlaying(false);
    setIsPaused(true);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const isDocPage = location.pathname.startsWith('/docs/');
  if (!isSupported || !isDocPage) return null;

  return (
    <div className="audio-player-container">
      <div className="audio-status">
        {isPlaying ? 'Playing...' : isPaused ? 'Paused' : 'Listen'}
      </div>
      
      {!isPlaying ? (
        <button className="audio-btn" onClick={handlePlay} title="Play Audio">
          <Play size={20} fill="currentColor" />
        </button>
      ) : (
        <button className="audio-btn" onClick={handlePause} title="Pause Audio">
          <Pause size={20} fill="currentColor" />
        </button>
      )}
      
      {(isPlaying || isPaused) && (
        <button className="audio-btn" onClick={handleStop} title="Stop Audio">
          <Square size={20} fill="currentColor" />
        </button>
      )}
    </div>
  );
}
