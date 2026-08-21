import React from 'react';
import Footer from '@theme-original/DocItem/Footer';
import QuizWidget from '@site/src/components/QuizWidget';

export default function FooterWrapper(props) {
  return (
    <>
      <Footer {...props} />
      <QuizWidget />
    </>
  );
}
