import React from 'react';

interface Topic {
    id: number;
    words: string;
}

interface TopicProps {
    topics: Topic[];
}

const TopicCloud: React.FC<TopicProps> = ({ topics }) => {
    // Convert "0.081*"software" + 0.043*"code"..." to tags
    const parseWords = (wordStr: string) => {
        return wordStr
            .split('+')
            .map(part => part.split('*')[1].replace(/"/g, '').trim())
            .slice(0, 5);
    };

    return (
        <div className="topic-cloud">
            {topics.length > 0 ? (
                topics.map((topic) => (
                    <div key={topic.id} className="topic-group">
                        <h4>Group {topic.id + 1}</h4>
                        <div className="tags">
                            {parseWords(topic.words).map((word, i) => (
                                <span key={i} className="tag">{word}</span>
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                <p>No topics detected.</p>
            )}
        </div>
    );
};

export default TopicCloud;
