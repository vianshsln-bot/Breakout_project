
'use client';
import { useState, useEffect } from 'react';
import { Theme } from '@/lib/types';
import { API_BASE_URL } from '@/lib/config';

export default function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThemes = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/themes/`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data: Theme[] = await response.json();
        setThemes(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchThemes();
  }, []);

  const renderThemes = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm h-64 animate-pulse" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="col-span-full bg-red-50 text-red-700 p-4 rounded-lg text-center">
          <p>Failed to load theme data.</p>
          <p className="text-sm">{error}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {themes.map((theme) => (
          <div key={theme.Theme_ID} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600"></div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-gray-900">{theme.Name}</h3>
              </div>

              <p className="text-sm text-gray-600 mb-4 h-20 overflow-hidden">{theme.Description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price per Person</span>
                  <span className="font-bold text-gray-900">₹{theme.Price_per_person.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-bold text-gray-900">{theme.Duration} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Min. Players</span>
                  <span className="font-bold text-gray-900">{theme.Minimum_players}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Themes & Packages</h1>
          <p className="text-gray-500 mt-1">Manage event packages and pricing</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Create Theme
        </button>
      </div>
      {renderThemes()}
    </div>
  );
}
