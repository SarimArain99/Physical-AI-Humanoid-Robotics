import React, { useState, useEffect } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import './AudioPlayer.css';

export default function AudioPlayer() {
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

  const getTextToRead = () => {
    // Try to find the AI personalized content first
    const customDiv = document.getElementById('ai-personalized-content');
    if (customDiv && customDiv.style.display !== 'none') {
      return customDiv.innerText;
    }
    // Otherwise fallback to original markdown
    const article = document.querySelector('article .theme-doc-markdown');
    return article ? article.innerText : '';
  };

  const handlePlay = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    const text = getTextToRead();
    if (!text) return;

    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    
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

  if (!isSupported) return null;

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
