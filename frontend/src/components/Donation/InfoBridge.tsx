import React from 'react';

interface Props {
  onContinue: () => void;
}

const InfoBridge: React.FC<Props> = ({ onContinue }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-xl w-full p-6 md:p-8">
        <p className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-black leading-tight">
          Hoi and welcome,
        </p>

        <div className="space-y-4 md:space-y-5 mb-6 md:mb-8 text-black text-base md:text-lg leading-relaxed">
          <p>
            This chatbot is powered by <strong>Apertus</strong>, the first Swiss open-source large language artificial intelligence model.
          </p>
          <p>
            To improve such models, questions from chatbot users are needed for training the data.
          </p>
          <p className="font-semibold text-lg md:text-xl">
            Would you donate your anonymized questions?
          </p>
        </div>

        <button
          onClick={onContinue}
          className="w-full bg-[#FF0000] text-white py-4 md:py-3 rounded-lg font-semibold text-base min-h-[48px] hover:bg-[#CC0000] transition"
        >
          Learn More
        </button>
      </div>
    </div>
  );
};

export default InfoBridge;
