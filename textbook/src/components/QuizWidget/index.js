import React, { useState, useEffect } from 'react';
import './QuizWidget.css';
import { useSession } from '@site/src/utils/authClient';
import { getApiUrl } from '@site/src/utils/apiConfig';

export default function QuizWidget() {
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const { data: session } = useSession();

  const handleStartQuiz = async () => {
    setLoading(true);
    setError('');
    
    try {
      const pageId = window.location.pathname;
      const cacheKey = `quiz_${pageId}`;
      
      // Try DB Cache first
      const cacheRes = await fetch(`${getApiUrl()}/api/cache/${cacheKey}`);
      if (cacheRes.ok) {
        const cacheData = await cacheRes.json();
        if (cacheData.content) {
          try {
            const parsed = JSON.parse(cacheData.content);
            if (parsed.questions) {
              setQuestions(parsed.questions);
              setLoading(false);
              return;
            }
          } catch(e) {}
        }
      }

      // If not cached, generate via API
      const article = document.querySelector('article .theme-doc-markdown');
      const textToProcess = article ? article.innerText.slice(0, 5000) : "No content";
      
      const response = await fetch(`${getApiUrl()}/api/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToProcess })
      });
      
      if (!response.ok) throw new Error("API failed");
      const data = await response.json();
      const parsed = JSON.parse(data.content);
      
      if (parsed.questions) {
        setQuestions(parsed.questions);
        
        // Save to cache
        await fetch(`${getApiUrl()}/api/cache`, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ key: cacheKey, content: data.content })
        }).catch(e => console.error(e));
      } else {
        throw new Error("Invalid format");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (index) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    
    if (index === questions[currentIndex].answerIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      
      // Save progress to database
      if (session?.user?.id) {
        const finalScore = selectedOption === questions[currentIndex].answerIndex ? score + 1 : score;
        const total = questions.length;
        const percentage = Math.round((finalScore / total) * 100);
        
        try {
          await fetch(`${getApiUrl()}/api/progress`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              user_id: session.user.id,
              page_id: window.location.pathname,
              quiz_score: percentage,
              completed: true
            })
          });
        } catch(e) {
          console.error("Failed to save progress", e);
        }
      }
    }
  };

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="quiz-widget-container">
        <div className="quiz-results">
          <h3>Quiz Completed!</h3>
          <p>You have finished testing your knowledge on this chapter.</p>
          <div className="quiz-score-circle">
            {percentage}%
            <span className="quiz-score-sub">{score} / {questions.length} Correct</span>
          </div>
          {session ? (
            <p style={{color: 'var(--primary)', fontWeight: 600}}>Score saved to your Dashboard!</p>
          ) : (
            <p>Log in to save your progress!</p>
          )}
        </div>
      </div>
    );
  }

  if (questions && questions.length > 0) {
    const currentQ = questions[currentIndex];
    
    return (
      <div className="quiz-widget-container">
        <div className="quiz-question-container">
          <p className="quiz-score-sub" style={{marginBottom: 12}}>Question {currentIndex + 1} of {questions.length}</p>
          <div className="quiz-question">{currentQ.question}</div>
          
          <div className="quiz-options">
            {currentQ.options.map((opt, idx) => {
              let btnClass = 'quiz-option-btn';
              if (isAnswered) {
                if (idx === currentQ.answerIndex) btnClass += ' correct';
                else if (idx === selectedOption) btnClass += ' wrong';
              } else if (idx === selectedOption) {
                btnClass += ' selected';
              }
              
              return (
                <button 
                  key={idx} 
                  className={btnClass}
                  onClick={() => handleOptionClick(idx)}
                  disabled={isAnswered}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          
          {isAnswered && (
            <div className="quiz-footer">
              <div className={`quiz-feedback ${selectedOption === currentQ.answerIndex ? 'success' : 'error'}`}>
                {selectedOption === currentQ.answerIndex ? 'Correct! Well done.' : 'Incorrect.'}
              </div>
              <button className="quiz-next-btn" onClick={handleNext}>
                {currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-widget-container">
      <div className="quiz-header">
        <h3>Test Your Knowledge 🧠</h3>
        <p>Take a quick AI-generated quiz to solidify your understanding of this chapter.</p>
      </div>
      
      {error && <div className="alert alert--danger" style={{marginBottom: 20}}>{error}</div>}
      
      <button 
        className="start-quiz-btn" 
        onClick={handleStartQuiz}
        disabled={loading}
      >
        {loading ? 'Generating Quiz...' : 'Start Quiz'}
      </button>
    </div>
  );
}
