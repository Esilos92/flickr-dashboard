'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [status, setStatus] = useState('Loading...');
  const [apiData, setApiData] = useState(null);

  useEffect(() => {
    fetch('http://10.108.0.2:3001/api/health')
      .then(res => res.json())
      .then(data => {
        setStatus('Connected ✅');
        setApiData(data);
      })
      .catch(err => {
        setStatus('Offline ❌');
        console.error(err);
      });
  }, []);

  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          📸 Flickr Smart Uploader Dashboard
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">🔧 API Status</h2>
          <p className="text-xl">{status}</p>
          {apiData && (
            <pre className="mt-4 p-4 bg-gray-100 rounded text-sm">
              {JSON.stringify(apiData, null, 2)}
            </pre>
          )}
        </div>
