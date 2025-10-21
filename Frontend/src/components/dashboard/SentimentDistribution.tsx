
'use client';

export const SentimentDistribution = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Sentiment Distribution</h3>
      <div className="flex items-center justify-center h-48">
        <div className="relative w-40 h-40">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="20" />
            <circle
              cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="20"
              strokeDasharray="251.2"
              strokeDashoffset={251.2 * (1 - 0.68)}
            />
            <circle
              cx="50" cy="50" r="40" fill="none" stroke="#6b7280" strokeWidth="20"
              strokeDasharray="251.2"
              strokeDashoffset={251.2 * (1 - 0.68 - 0.22)}
              style={{ transform: 'rotate(245deg)', transformOrigin: '50% 50%' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-3xl font-bold text-gray-900">68%</p>
            <p className="text-xs text-gray-500">Positive</p>
          </div>
        </div>
      </div>
      <div className="flex justify-around mt-4">
        <div className="text-center">
          <div className="w-3 h-3 bg-emerald-500 rounded-full mx-auto mb-1" />
          <p className="text-sm font-medium">68%</p>
          <p className="text-xs text-gray-500">Positive</p>
        </div>
        <div className="text-center">
          <div className="w-3 h-3 bg-gray-500 rounded-full mx-auto mb-1" />
          <p className="text-sm font-medium">22%</p>
          <p className="text-xs text-gray-500">Neutral</p>
        </div>
        <div className="text-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1" />
          <p className="text-sm font-medium">10%</p>
          <p className="text-xs text-gray-500">Negative</p>
        </div>
      </div>
    </div>
  );
};
