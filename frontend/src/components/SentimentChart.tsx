import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ChartProps {
    stats: {
        positive: number;
        negative: number;
        neutral: number;
    };
}

const SentimentChart: React.FC<ChartProps> = ({ stats }) => {
    const data = {
        labels: ['Positive', 'Negative', 'Neutral'],
        datasets: [
            {
                data: [stats.positive, stats.negative, stats.neutral],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(201, 203, 207, 0.6)',
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(201, 203, 207, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    return (
        <div className="sentiment-chart-container">
            <Pie data={data} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
    );
};

export default SentimentChart;
