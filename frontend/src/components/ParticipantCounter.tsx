import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

export default function ParticipantCounter() {
  const { t } = useTranslation();
  const [count, setCount] = useState<number>(0);
  const [target, setTarget] = useState<number>(200);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await api.getParticipantCount();
        setCount(data.count);
        setTarget(data.target);
      } catch (error) {
        console.error('Failed to fetch participant count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, []);

  if (loading) {
    return null;
  }

  const percentage = Math.min((count / target) * 100, 100);

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{t('landing.participantCounter.label')}</span>
        <span className="text-sm font-medium text-gray-900">{count}/{target}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
