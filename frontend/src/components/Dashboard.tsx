import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import SentimentChart from './SentimentChart';
import TopicsDisplay from './TopicsDisplay';
import './Dashboard.css';

interface DashboardProps {
  user: any;
}

interface TweetData {
  id: string;
  text: string;
  created_at: string;
  author: {
    name: string;
    username: string;
    verified: boolean;
  };
  sentiment: {
    sentiment: string;
    confidence: number;
  };
  toxicity: {
    toxicity: number;
    is_toxic: boolean;
  };
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
  };
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [showAllTweets, setShowAllTweets] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  // Connect to Socket.IO
  useEffect(() => {
    const newSocket = io('http://localhost:5003');

    newSocket.on('connect', () => {
      console.log('✅ Connected to Socket.IO');
    });

    newSocket.on('analysis_update', (data: any) => {
      console.log('📊 Analysis update:', data);
      setStatusMessage(data.message || '');
      setProgress(data.progress || 0);
    });

    newSocket.on('analysis_complete', (data: any) => {
      console.log('✅ Analysis complete:', data);
      setResult(data);
      setLoading(false);
      setProgress(100);
      setStatusMessage('Analysis complete!');
    });

    newSocket.on('analysis_error', (data: any) => {
      console.error('❌ Analysis error:', data);
      setError(data.error || 'Analysis failed');
      setLoading(false);
      setProgress(0);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from Socket.IO');
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('convosense_user');
      console.log('✅ Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);
    setProgress(0);
    setStatusMessage('Starting analysis...');
    setShowAllTweets(false);

    try {
      const response = await fetch('http://localhost:5003/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          max_tweets: 100,  // Fetch 100 tweets for better analysis
          uid: user?.uid
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      console.log('✅ Analysis started:', data);

    } catch (err: any) {
      console.error('❌ Analysis error:', err);
      setError(err.message || 'Failed to analyze tweets');
      setLoading(false);
      setProgress(0);
    }
  };

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment.toUpperCase()) {
      case 'POSITIVE': return '😊';
      case 'NEGATIVE': return '😞';
      default: return '😐';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toUpperCase()) {
      case 'POSITIVE': return '#10b981';
      case 'NEGATIVE': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Filter tweets based on selected filter
  const filteredTweets = result?.tweets?.filter((tweet: TweetData) => {
    if (filter === 'all') return true;
    if (filter === 'toxic') return tweet.toxicity?.is_toxic;
    return tweet.sentiment?.sentiment?.toLowerCase() === filter;
  }) || [];

  const displayedTweets = showAllTweets
    ? filteredTweets
    : filteredTweets.slice(0, 20);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🧠 ConvoSense</h1>
          <div className="user-info">
            <span className="welcome-text">
              Welcome, <strong>{user?.displayName || user?.email}</strong>!
            </span>
            <button onClick={handleLogout} className="btn-logout">
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="hero-section">
          <h2>Social Media Intelligence Dashboard</h2>
          <p>Analyze sentiment, detect toxicity, and discover trends in real-time</p>
        </div>

        {/* Search Form */}
        <div className="search-section">
          <form onSubmit={handleAnalyze} className="search-form">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a hashtag, keyword, or topic (e.g., #AI, climate change)"
              className="search-input"
              disabled={loading}
            />
            <button type="submit" disabled={loading} className="search-button">
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Analyzing...
                </>
              ) : (
                '🔍 Analyze'
              )}
            </button>
          </form>

          {loading && (
            <div className="progress-section">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="progress-text">{statusMessage}</p>
            </div>
          )}

          {error && (
            <div className="error-box">
              ⚠️ {error}
            </div>
          )}

          {result && (
            <div className="results-section">
              <h3>📊 Analysis Results for "{result.query}"</h3>

              <div className="results-grid">
                <div className="result-card positive">
                  <h4>😊 Positive</h4>
                  <p className="stat-number">{result.sentiment?.positive || 0}</p>
                  <p className="stat-percentage">{result.sentiment?.positive_percentage || 0}%</p>
                </div>
                <div className="result-card neutral">
                  <h4>😐 Neutral</h4>
                  <p className="stat-number">{result.sentiment?.neutral || 0}</p>
                  <p className="stat-percentage">{result.sentiment?.neutral_percentage || 0}%</p>
                </div>
                <div className="result-card negative">
                  <h4>😞 Negative</h4>
                  <p className="stat-number">{result.sentiment?.negative || 0}</p>
                  <p className="stat-percentage">{result.sentiment?.negative_percentage || 0}%</p>
                </div>
                <div className="result-card toxic">
                  <h4>⚠️ Toxic</h4>
                  <p className="stat-number">{result.toxicity?.toxic_count || 0}</p>
                  <p className="stat-percentage">{result.toxicity?.toxicity_rate || 0}%</p>
                </div>
              </div>

              {/* Topics Display */}
              {result.topics && result.topics.length > 0 && (
                <TopicsDisplay topics={result.topics} />
              )}

              {/* Sentiment Chart */}
              {result.sentiment && (
                <SentimentChart
                  positive={result.sentiment.positive || 0}
                  negative={result.sentiment.negative || 0}
                  neutral={result.sentiment.neutral || 0}
                />
              )}

              {/* Filter Controls */}
              <div className="filter-section" style={{ margin: '1.5rem 0' }}>
                <h4>🔍 Filter Tweets:</h4>
                <div className="filter-buttons" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <button
                    onClick={() => setFilter('all')}
                    className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: filter === 'all' ? '#3b82f6' : '#e5e7eb',
                      color: filter === 'all' ? 'white' : '#374151',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    All ({result.tweets?.length || 0})
                  </button>
                  <button
                    onClick={() => setFilter('positive')}
                    className={filter === 'positive' ? 'filter-btn active' : 'filter-btn'}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: filter === 'positive' ? '#10b981' : '#e5e7eb',
                      color: filter === 'positive' ? 'white' : '#374151',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    😊 Positive ({result.sentiment?.positive || 0})
                  </button>
                  <button
                    onClick={() => setFilter('negative')}
                    className={filter === 'negative' ? 'filter-btn active' : 'filter-btn'}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: filter === 'negative' ? '#ef4444' : '#e5e7eb',
                      color: filter === 'negative' ? 'white' : '#374151',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    😞 Negative ({result.sentiment?.negative || 0})
                  </button>
                  <button
                    onClick={() => setFilter('neutral')}
                    className={filter === 'neutral' ? 'filter-btn active' : 'filter-btn'}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: filter === 'neutral' ? '#6b7280' : '#e5e7eb',
                      color: filter === 'neutral' ? 'white' : '#374151',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    😐 Neutral ({result.sentiment?.neutral || 0})
                  </button>
                  <button
                    onClick={() => setFilter('toxic')}
                    className={filter === 'toxic' ? 'filter-btn active' : 'filter-btn'}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: filter === 'toxic' ? '#f59e0b' : '#e5e7eb',
                      color: filter === 'toxic' ? 'white' : '#374151',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    ⚠️ Toxic ({result.toxicity?.toxic_count || 0})
                  </button>
                </div>
              </div>

              <div className="tweets-list">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4>📝 Filtered Tweets ({filteredTweets.length})</h4>
                  {filteredTweets.length > 20 && (
                    <button
                      onClick={() => setShowAllTweets(!showAllTweets)}
                      className="search-button"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                      {showAllTweets ? '📋 Show Less' : `📋 Show All ${filteredTweets.length} Tweets`}
                    </button>
                  )}
                </div>
                {displayedTweets.map((tweet: TweetData) => (
                  <div key={tweet.id} className="tweet-card">
                    <div className="tweet-header">
                      <div className="tweet-author">
                        <strong>{tweet.author.name}</strong>
                        {tweet.author.verified && <span className="verified-badge">✓</span>}
                        <span className="tweet-username">@{tweet.author.username}</span>
                      </div>
                      <div className="tweet-badges">
                        <span
                          className="sentiment-badge"
                          style={{
                            backgroundColor: getSentimentColor(tweet.sentiment?.sentiment || 'NEUTRAL'),
                            color: 'white'
                          }}
                        >
                          {getSentimentEmoji(tweet.sentiment?.sentiment || 'NEUTRAL')}
                          {tweet.sentiment?.sentiment}
                        </span>
                        {tweet.toxicity?.is_toxic && (
                          <span className="toxic-badge">⚠️ Toxic</span>
                        )}
                      </div>
                    </div>
                    <p className="tweet-text">{tweet.text}</p>
                    <div className="tweet-metrics">
                      <span>❤️ {tweet.metrics?.likes || 0}</span>
                      <span>🔄 {tweet.metrics?.retweets || 0}</span>
                      <span>💬 {tweet.metrics?.replies || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <h3>Sentiment Analysis</h3>
            <p>Real-time emotion detection using BERT AI</p>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔍</div>
            <h3>Topic Modeling</h3>
            <p>Discover trending topics with LDA</p>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <h3>Toxicity Detection</h3>
            <p>Identify harmful content using Perspective API</p>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <h3>Real-time Updates</h3>
            <p>Live data streaming via Socket.IO</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
