const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Secure Device Connection
          </h1>
          <p className="text-xl text-gray-600">
            Connect your devices and share text securely in real-time
          </p>
        </div>
        <ShareCard />
      </div>
    </div>
  );
};

export default Index;