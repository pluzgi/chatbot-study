import React from 'react';

interface LikertScaleProps {
  name: string;
  value: number | null;
  onChange: (value: number) => void;
  leftLabel: string;
  rightLabel: string;
  points?: number;
  compact?: boolean;
}

const LikertScale: React.FC<LikertScaleProps> = ({
  name,
  value,
  onChange,
  leftLabel,
  rightLabel,
  points = 7,
  compact = false
}) => {
  const options = Array.from({ length: points }, (_, i) => i + 1);

  // Compact mode for Likert items within question blocks
  // Improved: better touch targets, readable numbers, consistent button styling
  if (compact) {
    return (
      <div className="w-full">
        {/* Endpoint labels - readable, aligned */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <span className="leading-snug">{leftLabel}</span>
          <span className="text-right leading-snug">{rightLabel}</span>
        </div>

        {/* Scale buttons - consistent with app button styling */}
        <div className="flex items-center justify-between gap-1.5 md:gap-2">
          {options.map((point) => (
            <label
              key={point}
              className="flex-1 cursor-pointer"
            >
              <input
                type="radio"
                name={name}
                value={point}
                checked={value === point}
                onChange={() => onChange(point)}
                className="sr-only peer"
              />
              {/* Button: min 44px touch target, neutral gray style matching app buttons */}
              <div
                className={`
                  w-full min-h-[44px] md:min-h-[48px] rounded-md border
                  flex items-center justify-center transition-all
                  focus-within:ring-2 focus-within:ring-offset-1 focus-within:ring-gray-400
                  ${value === point
                    ? 'bg-gray-800 border-gray-800 text-white'
                    : 'bg-white border-gray-300 hover:bg-gray-100 hover:border-gray-400 text-gray-700'
                  }
                `}
              >
                <span className="text-base font-medium">{point}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    );
  }

  // Original mode: larger buttons (for standalone questions)
  return (
    <div className="w-full">
      {/* Scale */}
      <div className="flex items-center justify-between gap-1.5 md:gap-2 mb-3">
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
              className="sr-only peer"
            />
            <div
              className={`
                w-11 h-11 md:w-12 md:h-12 rounded-md border
                flex items-center justify-center transition-all
                focus-within:ring-2 focus-within:ring-offset-1 focus-within:ring-gray-400
                ${value === point
                  ? 'bg-gray-800 border-gray-800 text-white'
                  : 'bg-white border-gray-300 hover:bg-gray-100 hover:border-gray-400 text-gray-700'
                }
              `}
            >
              <span className="text-base font-medium">{point}</span>
            </div>
          </label>
        ))}
      </div>

      {/* Labels */}
      <div className="flex items-start justify-between text-sm text-gray-500">
        <span className="text-left max-w-[45%] leading-snug">{leftLabel}</span>
        <span className="text-right max-w-[45%] leading-snug">{rightLabel}</span>
      </div>
    </div>
  );
};

export default LikertScale;
