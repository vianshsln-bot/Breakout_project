
'use client';
import { useState, useEffect } from 'react';

export const Header = () => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Command Center</h1>
        <p className="text-gray-500 mt-1">Real-time operational overview</p>
      </div>
      <div className="flex gap-3">
        <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg font-medium">
          System Online
        </div>
        <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg">
          {time}
        </div>
      </div>
    </div>
  );
};
