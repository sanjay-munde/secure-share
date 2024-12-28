import React from 'react';
import ShareCard from '@/components/ShareCard';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
              Secure Device Connection
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Connect your devices and share text securely in real-time with end-to-end encryption
            </p>
          </div>
          <ShareCard />
        </div>
      </div>
    </div>
  );
};

export default Index;