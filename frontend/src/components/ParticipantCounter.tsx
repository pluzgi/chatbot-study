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

  return (
    <span className="inline-block px-2 py-0.5 text-xs text-gray-500 bg-gray-100 rounded-full whitespace-nowrap">
      {count}/{target} {t('landing.participantCounter.joined')}
    </span>
  );
}
