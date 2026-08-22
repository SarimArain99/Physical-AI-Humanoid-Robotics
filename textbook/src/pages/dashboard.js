import React, { useEffect, useState } from 'react';
import Layout from '@theme/Layout';
import { useSession } from '@site/src/utils/authClient';
import { getApiUrl } from '@site/src/utils/apiConfig';
import Link from '@docusaurus/Link';
import { BookOpen, Award, CheckCircle, RefreshCw, ChevronRight, Play } from 'lucide-react';
import './dashboard.css';

const COURSE_MODULES = [
  { id: '/docs/intro', title: 'Introduction to Physical AI', module: 'Fundamentals' },
  { id: '/docs/module-1-ros2/intro-physical-ai', title: 'Module 1: ROS 2 & Middleware', module: 'ROS 2 Framework' },
  { id: '/docs/module-2-simulation/gazebo-setup', title: 'Module 2: Simulation & Gazebo', module: 'Robotic Simulation' },
  { id: '/docs/module-3-nvidia-isaac/isaac-sdk-sim', title: 'Module 3: NVIDIA Isaac SDK', module: 'Isaac & Hardware' },
  { id: '/docs/module-4-vla/humanoid-kinematics', title: 'Module 4: VLA & Humanoid Kinematics', module: 'VLA & Capstone' }
];

export default function Dashboard() {
  const { data: session, isPending } = useSession();
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProgress = async (silent = false) => {
    if (!session?.user?.id) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      // Append a timestamp cache-buster to prevent any browser caching
      const res = await fetch(`${getApiUrl()}/api/progress/${session.user.id}?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.progress) {
          setProgress(data.progress);
        }
      }
    } catch (err) {
      console.error("Error fetching progress:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchProgress();
    } else if (!isPending) {
      setLoading(false);
    }
  }, [session, isPending]);

  if (isPending || (loading && progress.length === 0)) {
    return (
      <Layout title="Dashboard" description="Loading your profile...">
        <div className="dashboard-container loading-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <RefreshCw className="animate-spin" size={40} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
          <h3>Loading your progress...</h3>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return (
      <Layout title="Dashboard" description="Access Denied">
        <div className="dashboard-container access-denied" style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '600px', margin: '40px auto' }}>
          <Award size={64} style={{ color: 'var(--primary)', marginBottom: '24px', opacity: 0.6 }} />
          <h2>Unlock Your Learning Dashboard 🔓</h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--foreground)', marginBottom: '24px' }}>
            Registered students can track which chapters they have completed, review their AI quiz scores, and view personalized learning recommendations in real-time.
          </p>
          <button 
            className="button button--primary button--lg"
            onClick={() => {
              const loginBtn = document.querySelector('.nav-login-btn');
              if (loginBtn) loginBtn.click();
            }}
          >
            Log In / Register
          </button>
        </div>
      </Layout>
    );
  }

  // Calculate Stats
  const completedCount = progress.filter(p => p.completed).length;
  const courseCompletionPercent = Math.round((completedCount / COURSE_MODULES.length) * 100);
  const avgScore = progress.length > 0 
    ? Math.round(progress.reduce((acc, curr) => acc + (curr.quiz_score || 0), 0) / progress.length)
    : 0;

  return (
    <Layout title="Dashboard" description="Your Physical AI Progress Dashboard">
      <div className="dashboard-container">
        
        {/* Welcome Section */}
        <div className="dashboard-header-premium">
          <div className="header-info">
            <h1>Welcome back, {session.user.name.split(' ')[0]}! 👋</h1>
            <p>Track your textbook completion progress and review your AI test scores.</p>
          </div>
          <button 
            className={`refresh-btn ${refreshing ? 'loading' : ''}`} 
            onClick={() => fetchProgress(true)}
            disabled={refreshing}
            title="Refresh statistics"
          >
            <RefreshCw size={16} />
            {refreshing ? 'Refreshing...' : 'Refresh Stats'}
          </button>
        </div>

        {/* Analytics Grid */}
        <div className="dashboard-analytics-grid">
          <div className="analytic-card">
            <div className="card-icon-wrapper progress-icon">
              <BookOpen size={24} />
            </div>
            <div className="card-metrics">
              <div className="metric-val">{courseCompletionPercent}%</div>
              <div className="metric-lbl">Course Completed</div>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${courseCompletionPercent}%` }}></div>
            </div>
          </div>

          <div className="analytic-card">
            <div className="card-icon-wrapper score-icon">
              <Award size={24} />
            </div>
            <div className="card-metrics">
              <div className="metric-val">{avgScore}%</div>
              <div className="metric-lbl">Average Quiz Score</div>
            </div>
            <div className="score-status">
              {avgScore >= 80 ? '🏆 Elite Performer' : avgScore >= 50 ? '📈 Good Standing' : '📖 Keep Reading'}
            </div>
          </div>

          <div className="analytic-card">
            <div className="card-icon-wrapper completion-icon">
              <CheckCircle size={24} />
            </div>
            <div className="card-metrics">
              <div className="metric-val">{completedCount} / {COURSE_MODULES.length}</div>
              <div className="metric-lbl">Chapters Completed</div>
            </div>
            <div className="completed-fraction">
              {COURSE_MODULES.length - completedCount} pending chapters remaining
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="dashboard-main-layout">
          
          {/* Chapter Progress Map */}
          <div className="dashboard-section chapter-map">
            <h2>Course Syllabus & Completion Map</h2>
            <p className="section-description">Complete quizzes at the end of each chapter to mark them as completed.</p>
            
            <div className="chapter-list-grid">
              {COURSE_MODULES.map((mod, index) => {
                // Find matching progress in the DB
                const userModProgress = progress.find(p => p.page_id.includes(mod.id) || mod.id.includes(p.page_id));
                const isCompleted = !!userModProgress;

                return (
                  <div className={`chapter-card ${isCompleted ? 'completed' : 'pending'}`} key={index}>
                    <div className="chapter-card-left">
                      <div className={`status-indicator ${isCompleted ? 'checked' : 'empty'}`}>
                        {isCompleted ? <CheckCircle size={18} /> : <span>{index + 1}</span>}
                      </div>
                      <div className="chapter-meta">
                        <span className="module-tag">{mod.module}</span>
                        <h4>{mod.title}</h4>
                      </div>
                    </div>
                    
                    <div className="chapter-card-right">
                      {isCompleted ? (
                        <div className="score-badge">
                          <span className="badge-lbl">Score</span>
                          <span className="badge-val">{userModProgress.quiz_score}%</span>
                        </div>
                      ) : (
                        <span className="pending-badge">Pending</span>
                      )}
                      
                      <Link to={mod.id} className="study-link-btn">
                        {isCompleted ? 'Review' : 'Start'}
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="dashboard-section activity-log">
            <h2>Recent Activity Logs</h2>
            {progress.length === 0 ? (
              <div className="empty-activity-card">
                <p>No recent activity logs found. Start reading the textbook modules to track progress!</p>
                <Link to="/docs/intro" className="button button--secondary button--sm">
                  Open Introduction <Play size={12} style={{ marginLeft: 6, verticalAlign: -1 }} />
                </Link>
              </div>
            ) : (
              <div className="activity-timeline">
                {progress.slice(0, 4).map((item, idx) => {
                  const moduleName = item.page_id.replace('/docs/', '').replace(/-/g, ' ').replace(/\//g, ' > ');
                  return (
                    <div className="timeline-node" key={idx}>
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <div className="timeline-title">{moduleName}</div>
                        <div className="timeline-meta">
                          <span>Quiz Score: <strong>{item.quiz_score}%</strong></span>
                          <span className="timeline-time">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </Layout>
  );
}
