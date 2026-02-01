import React from 'react';

interface Tweet {
    author_id: string;
    text: string;
    toxicity: number;
    sentiment: {
        label: string;
    };
}

interface ToxicityProps {
    tweets: Tweet[];
}

const ToxicityList: React.FC<ToxicityProps> = ({ tweets }) => {
    // Sort by toxicity descending
    const sortedTweets = [...tweets].sort((a, b) => b.toxicity - a.toxicity);

    return (
        <div className="toxicity-table-container">
            <table className="toxicity-table">
                <thead>
                    <tr>
                        <th>User ID</th>
                        <th>Tweet Content</th>
                        <th>Sentiment</th>
                        <th>Toxicity</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedTweets.map((tweet, i) => (
                        <tr key={i} className={tweet.toxicity > 0.5 ? 'high-toxicity' : ''}>
                            <td>{tweet.author_id}</td>
                            <td className="tweet-cell">{tweet.text}</td>
                            <td className={`sentiment-cell ${tweet.sentiment.label.toLowerCase()}`}>
                                {tweet.sentiment.label}
                            </td>
                            <td>
                                <div className="tox-badge" style={{ backgroundColor: getToxColor(tweet.toxicity) }}>
                                    {(tweet.toxicity * 100).toFixed(0)}%
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const getToxColor = (score: number) => {
    if (score > 0.7) return '#ef4444';
    if (score > 0.4) return '#f59e0b';
    return '#10b981';
};

export default ToxicityList;
