import React from 'react';
import './TopicsDisplay.css';

interface TopicsDisplayProps {
    topics: string[];
}

const TopicsDisplay: React.FC<TopicsDisplayProps> = ({ topics }) => {
    if (!topics || topics.length === 0) {
        return null;
    }

    return (
        <div className="topics-display">
            <h4>🔍 Trending Topics</h4>
            <div className="topics-cloud">
                {topics.map((topic, index) => (
                    <span
                        key={index}
                        className="topic-badge"
                        style={{
                            fontSize: `${1 + (topics.length - index) * 0.1}rem`,
                            opacity: 1 - (index * 0.05)
                        }}
                    >
                        {topic}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default TopicsDisplay;
