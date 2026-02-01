import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import StatsGrid from './StatsGrid';
import SentimentChart from './SentimentChart';
import ToxicityList from './ToxicityList';
import TopicCloud from './TopicCloud';
import '../styles/Dashboard.css';

const API_BASE = "http://localhost:5003";

const Dashboard: React.FC = () => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Ready");
  const [results, setResults] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(API_BASE);
    setSocket(newSocket);

    newSocket.on('status_update', (data: any) => {
      setStatus(data.message);
    });

    newSocket.on('analysis_result', (data: any) => {
      setResults(data);
      setStatus("Analysis Complete");
    });

    newSocket.on('error', (data: any) => {
      setStatus(`Error: ${data.message}`);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleAnalyze = async () => {
    if (!query) return;
    setResults(null);
    setStatus("Starting...");
    try {
      await axios.post(`${API_BASE}/api/analyze`, { 
        query, 
        sid: socket?.id 
      });
    } catch (err) {
      setStatus("Error: Could not start analysis");
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="hero">
          <h1>ConvoSense AI</h1>
          <p>Real-time Social Media Intelligence</p>
        </div>
        <div className="search-section">
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Enter hashtag or keyword (e.g. #AI, Musk...)" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            <button onClick={handleAnalyze} disabled={status !== "Ready" && status !== "Analysis Complete" && !status.startsWith("Error")}>
              {status === "Ready" || status === "Analysis Complete" ? "Analyze" : "Processing..."}
            </button>
          </div>
          <p className="status-text">{status}</p>
        </div>
      </header>

      {results ? (
        <main className="dashboard-main animate-fade-in">
          <StatsGrid stats={results.stats} />
          
          <div className="charts-grid">
            <div className="chart-card">
              <h3>Sentiment Breakdown</h3>
              <SentimentChart stats={results.stats} />
            </div>
            <div className="chart-card">
              <h3>Emerging Topics (LDA)</h3>
              <TopicCloud topics={results.topics} />
            </div>
          </div>

          <div className="table-card">
            <h3>Negative Influencer Detection</h3>
            <ToxicityList tweets={results.tweets} />
          </div>
        </main>
      ) : (
        <div className="empty-state">
          <p>Enter a query above to start the intelligence pipeline.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
