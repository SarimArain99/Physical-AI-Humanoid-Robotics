import React from 'react';
import ChatWidget from '@site/src/components/ChatWidget';
import AuthModal from '@site/src/components/AuthModal';
import ChapterTools from '@site/src/components/ChapterTools';
import AudioPlayer from '@site/src/components/AudioPlayer';

// Root component wraps the entire Docusaurus app
// This makes the ChatWidget appear on every page
export default function Root({ children }) {
  return (
    <>
      {children}
      <ChatWidget />
      <AuthModal />
      <ChapterTools />
      <AudioPlayer />
    </>
  );
}
