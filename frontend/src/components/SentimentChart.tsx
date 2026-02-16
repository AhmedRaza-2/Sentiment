import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface SentimentChartProps {
    positive: number;
    negative: number;
    neutral: number;
}

const SentimentChart: React.FC<SentimentChartProps> = ({ positive, negative, neutral }) => {
    const data = [
        { name: 'Positive', value: positive, color: '#10b981' },
        { name: 'Negative', value: negative, color: '#ef4444' },
        { name: 'Neutral', value: neutral, color: '#6b7280' }
    ].filter(item => item.value > 0); // Only show non-zero values

    const COLORS = data.map(item => item.color);

    return (
        <div className="chart-container">
            <h4>📊 Sentiment Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => percent !== undefined ? `${name}: ${(percent * 100).toFixed(0)}%` : name}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SentimentChart;
