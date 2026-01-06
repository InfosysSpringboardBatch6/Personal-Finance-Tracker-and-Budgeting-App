import React from 'react';
import { NeedsWantsAnalyzer } from '../components/NeedsWantsAnalyzer';
import { SmartAdvisor } from '../components/SmartAdvisor';

const AiFeatures = () => {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-white mb-1">AI Features</h2>
        <p className="text-gray-400 text-sm md:text-base">Explore AI tools to analyze expenses and get personalized financial advice.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2">
          <SmartAdvisor />
        </div>

        <div className="lg:col-span-1">
          <NeedsWantsAnalyzer />
        </div>
      </div>
    </div>
  );
};

export default AiFeatures;
