import React from 'react';
import { Users, TrendingUp, AlertTriangle, MessageCircle } from 'lucide-react';

interface StatsProps {
    stats: {
        total: number;
        positive: number;
        negative: number;
        neutral: number;
        avg_toxicity: number;
    };
}

const StatsGrid: React.FC<StatsProps> = ({ stats }) => {
    return (
        <div className="stats-grid">
            <div className="stat-box">
                <div className="stat-icon blue"><MessageCircle size={24} /></div>
                <div className="stat-info">
                    <span>Total Tweets</span>
                    <h2>{stats.total}</h2>
                </div>
            </div>

            <div className="stat-box">
                <div className="stat-icon green"><TrendingUp size={24} /></div>
                <div className="stat-info">
                    <span>Positive Vibes</span>
                    <h2>{stats.positive}</h2>
                </div>
            </div>

            <div className="stat-box">
                <div className="stat-icon red"><Users size={24} /></div>
                <div className="stat-info">
                    <span>Negative Vibes</span>
                    <h2>{stats.negative}</h2>
                </div>
            </div>

            <div className="stat-box">
                <div className="stat-icon orange"><AlertTriangle size={24} /></div>
                <div className="stat-info">
                    <span>Avg. Toxicity</span>
                    <h2>{(stats.avg_toxicity * 100).toFixed(1)}%</h2>
                </div>
            </div>
        </div>
    );
};

export default StatsGrid;
