import React, { useEffect, useState } from 'react';
import Layout from '@theme/Layout';
import { useSession } from '@site/src/utils/authClient';
import { getApiUrl } from '@site/src/utils/apiConfig';
import './dashboard.css';

export default function Dashboard() {
  const { data: session, isPending } = useSession();
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`${getApiUrl()}/api/progress/${session.user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.progress) {
            setProgress(data.progress);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [session]);

  if (!session) {
    return (
      <Layout title="Dashboard" description="Your Learning Dashboard">
        <div className="dashboard-container" style={{textAlign: 'center', marginTop: 100}}>
          <h2>Please log in to view your dashboard</h2>
          <p>You can log in using the button in the top right corner.</p>
        </div>
      </Layout>
    );
  }

  const completedCount = progress.filter(p => p.completed).length;
  const avgScore = progress.length > 0 
    ? Math.round(progress.reduce((acc, curr) => acc + curr.quiz_score, 0) / progress.length)
    : 0;

  return (
    <Layout title="Dashboard" description="Your Learning Dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Welcome back, {session.user.name.split(' ')[0]}!</h1>
          <p>Here is an overview of your AI Learning Progress</p>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-value">{completedCount}</div>
            <div className="stat-label">Chapters Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{avgScore}%</div>
            <div className="stat-label">Average Quiz Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{progress.length}</div>
            <div className="stat-label">Quizzes Taken</div>
          </div>
        </div>

        <div className="dashboard-list-container">
          <h3>Recent Activity</h3>
          
          {loading ? (
            <div style={{textAlign: 'center', padding: 40}}>Loading your progress...</div>
          ) : progress.length === 0 ? (
            <div style={{textAlign: 'center', padding: 40, color: 'var(--foreground)'}}>
              You haven't completed any chapters or quizzes yet. Go read a chapter and take a quiz!
            </div>
          ) : (
            <div>
              {progress.map((item, idx) => (
                <div className="progress-item" key={idx}>
                  <div className="progress-item-left">
                    <div className="progress-item-title">
                      {item.page_id.replace('/docs/', '').replace(/-/g, ' ').replace(/\//g, ' > ')}
                    </div>
                    <div className="progress-item-date">
                      {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                  <div className="progress-item-score">
                    {item.quiz_score}% Score
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
