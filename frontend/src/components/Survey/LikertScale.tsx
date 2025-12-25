import React from 'react';

interface LikertScaleProps {
  name: string;
  value: number | null;
  onChange: (value: number) => void;
  leftLabel: string;
  rightLabel: string;
  points?: number;
}

const LikertScale: React.FC<LikertScaleProps> = ({
  name,
  value,
  onChange,
  leftLabel,
  rightLabel,
  points = 7
}) => {
  const options = Array.from({ length: points }, (_, i) => i + 1);

  return (
    <div className="w-full">
      {/* Scale */}
      <div className="flex items-center justify-between gap-1 md:gap-2 mb-4">
        {options.map((point) => (
          <label
            key={point}
            className="flex flex-col items-center cursor-pointer group"
          >
            <input
              type="radio"
              name={name}
              value={point}
              checked={value === point}
              onChange={() => onChange(point)}
              className="sr-only"
            />
            <div
              className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all ${
                value === point
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'bg-gray-100 border-gray-300 hover:bg-green-600 hover:border-green-600 hover:text-white text-black'
              }`}
            >
              <span className="text-base font-medium">{point}</span>
            </div>
          </label>
        ))}
      </div>

      {/* Labels */}
      <div className="flex items-start justify-between text-sm md:text-base text-black mt-2">
        <span className="text-left max-w-[45%] leading-relaxed">{leftLabel}</span>
        <span className="text-right max-w-[45%] leading-relaxed">{rightLabel}</span>
      </div>
    </div>
  );
};

export default LikertScale;
