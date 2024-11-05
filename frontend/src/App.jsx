import React from 'react';
import NatureTranslator from './components/NatureTranslator';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm p-4">
        <h1 className="text-xl font-bold text-center">Nature Translator</h1>
      </nav>
      <main className="container mx-auto px-4 py-8">
        <NatureTranslator />
      </main>
    </div>
  );
}

export default App;
