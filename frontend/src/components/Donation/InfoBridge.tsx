import React from 'react';

interface Props {
  onContinue: () => void;
}

const InfoBridge: React.FC<Props> = ({ onContinue }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-xl w-full p-8">
        <div className="space-y-4 mb-8 text-gray-700 text-base">
          <p>
            This chatbot is powered by <strong>Apertus</strong>, a Swiss open-source AI model.
          </p>
          <p>
            To improve such models, user queries are needed for training.
          </p>
          <p className="font-medium">
            Would you donate your anonymized questions in a real scenario?
          </p>
        </div>

        <button
          onClick={onContinue}
          className="w-full bg-[#DC143C] text-white py-3 rounded-lg font-semibold hover:bg-[#B01030] transition"
        >
          Learn More
        </button>
      </div>
    </div>
  );
};

export default InfoBridge;
