
'use client';

export const CallVolume = ({ callVolume }: { callVolume: number[] }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        Call Volume (24h)
      </h3>
      <div className="h-48 flex items-end justify-between gap-1">
        {callVolume.map((count, i) => {
          const maxCount = Math.max(...callVolume);
          const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const current = new Date().getHours() === i;
          return (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full ${current ? 'bg-blue-600' : 'bg-blue-300'} rounded-t transition-all hover:bg-blue-500`}
                style={{ height: `${height}%` }}
              />
              {i % 4 === 0 && (
                <p className="text-xs text-gray-500 mt-1">{i}h</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
