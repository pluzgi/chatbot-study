# Frontend Implementation (Lovable)

## Domain: ailights.org/ballot-chat

---

## 1. Project Structure

```
src/
├── components/
│   ├── Chat/
│   │   ├── ChatInterface.tsx
│   │   ├── MessageBubble.tsx
│   │   └── InputField.tsx
│   ├── Donation/
│   │   ├── DonationModal.tsx
│   │   ├── DataNutritionLabel.tsx
│   │   ├── GranularDashboard.tsx
│   │   └── InfoBridge.tsx
│   ├── Survey/
│   │   ├── PostTaskSurvey.tsx
│   │   └── Debriefing.tsx
│   └── LanguageSelector.tsx
├── hooks/
│   ├── useChat.ts
│   └── useExperiment.ts
├── i18n/
│   ├── config.ts
│   └── locales/
│       ├── de.json
│       ├── fr.json
│       ├── it.json
│       └── en.json
├── services/
│   └── api.ts
├── types/
│   └── index.ts
└── App.tsx
```

---

## 2. Configuration

### Environment Variables (Lovable Settings)
```
VITE_API_ENDPOINT=https://your-backend.jelastic.infomaniak.com/api
```

### Install Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-i18next": "^13.5.0",
    "i18next": "^23.7.0",
    "i18next-browser-languagedetector": "^7.2.0"
  }
}
```

---

## 3. Core Files

### src/types/index.ts
```typescript
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ExperimentConfig {
  transparency: 'low' | 'high';
  control: 'low' | 'high';
  showDNL: boolean;
  showDashboard: boolean;
}

export interface Session {
  sessionId: string;
  participantId: string;
  condition: 'A' | 'B' | 'C' | 'D';
  config: ExperimentConfig;
}

export interface DonationConfig {
  scope: 'full' | 'topics';
  purpose: 'academic' | 'commercial';
  retention: '1month' | '3months' | '6months' | '1year' | 'indefinite';
}
```

### src/services/api.ts
```typescript
const API_BASE = import.meta.env.VITE_API_ENDPOINT;

export const api = {
  async initializeExperiment(language: string) {
    const res = await fetch(`${API_BASE}/experiment/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language })
    });
    return res.json();
  },

  async sendMessage(participantId: string, message: string, history: Message[], language: string) {
    const res = await fetch(`${API_BASE}/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId,
        message,
        conversationHistory: history,
        language
      })
    });
    return res.json();
  },

  async recordDonation(participantId: string, decision: 'donate' | 'decline', config?: any) {
    const res = await fetch(`${API_BASE}/donation/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, decision, configuration: config })
    });
    return res.json();
  },

  async submitSurvey(participantId: string, measures: any) {
    const res = await fetch(`${API_BASE}/donation/post-measures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, measures })
    });
    return res.json();
  }
};
```

### src/i18n/config.ts
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import de from './locales/de.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import en from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      fr: { translation: fr },
      it: { translation: it },
      en: { translation: en }
    },
    fallbackLng: 'de',
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
```

### src/hooks/useChat.ts
```typescript
import { useState, useCallback } from 'react';
import { Message } from '../types';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';

export const useChat = (participantId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { i18n } = useTranslation();

  const sendMessage = useCallback(async (content: string) => {
    if (!participantId) return;

    const userMsg: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const { response } = await api.sendMessage(
        participantId,
        content,
        messages,
        i18n.language
      );
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  }, [participantId, messages, i18n.language]);

  return { messages, loading, sendMessage };
};
```

### src/components/LanguageSelector.tsx
```typescript
import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  return (
    <div className="flex gap-2">
      {languages.map(lang => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`px-3 py-1 rounded ${
            i18n.language === lang.code
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {lang.flag} {lang.name}
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;
```

### src/components/Chat/ChatInterface.tsx
```typescript
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChat } from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import InputField from './InputField';

interface Props {
  participantId: string;
  onMinimumReached: () => void;
}

const ChatInterface: React.FC<Props> = ({ participantId, onMinimumReached }) => {
  const { t } = useTranslation();
  const { messages, loading, sendMessage } = useChat(participantId);
  const [count, setCount] = useState(0);

  const handleSend = async (content: string) => {
    await sendMessage(content);
    setCount(prev => prev + 1);
    if (count + 1 >= 2) onMinimumReached();
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="bg-blue-600 text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-bold">{t('chat.title')}</h2>
        <p className="text-sm">{t('chat.subtitle')}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {loading && <div className="text-gray-500">{t('chat.thinking')}</div>}
      </div>

      <InputField onSend={handleSend} disabled={loading} />

      {count < 2 && (
        <div className="p-2 text-center text-sm text-gray-500">
          {t('chat.minQuestions', { count })}
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
```

### src/components/Donation/DataNutritionLabel.tsx
```typescript
import React from 'react';
import { useTranslation } from 'react-i18next';

const DataNutritionLabel: React.FC = () => {
  const { t } = useTranslation();

  const items = [
    { icon: '🇨🇭', key: 'provenance' },
    { icon: '📖', key: 'ingredients' },
    { icon: '🛡️', key: 'protection' },
    { icon: '✅', key: 'compliance' },
    { icon: '📅', key: 'freshness' }
  ];

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
      <h3 className="text-2xl font-bold mb-4 text-center">
        {t('dnl.title')}
      </h3>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.key} className="flex items-start gap-4 p-4 border-2 rounded-lg bg-green-50 border-green-400">
            <div className="text-3xl">{item.icon}</div>
            <div className="flex-1">
              <div className="font-semibold">{t(`dnl.${item.key}`)}</div>
              <div className="text-sm text-gray-600">{t(`dnl.${item.key}Value`)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataNutritionLabel;
```

### src/components/Donation/GranularDashboard.tsx
```typescript
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DonationConfig } from '../../types';

interface Props {
  onChange: (config: DonationConfig) => void;
}

const GranularDashboard: React.FC<Props> = ({ onChange }) => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<DonationConfig>({
    scope: 'topics',
    purpose: 'academic',
    retention: '1year'
  });

  const update = (key: keyof DonationConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onChange(newConfig);
  };

  return (
    <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
      <h3 className="text-xl font-bold">{t('dashboard.title')}</h3>

      {/* Scope */}
      <div>
        <label className="block font-semibold mb-2">{t('dashboard.scope.label')}</label>
        <label className="flex items-center mb-2">
          <input
            type="radio"
            checked={config.scope === 'topics'}
            onChange={() => update('scope', 'topics')}
            className="mr-2"
          />
          {t('dashboard.scope.topics')}
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            checked={config.scope === 'full'}
            onChange={() => update('scope', 'full')}
            className="mr-2"
          />
          {t('dashboard.scope.full')}
        </label>
      </div>

      {/* Purpose */}
      <div>
        <label className="block font-semibold mb-2">{t('dashboard.purpose.label')}</label>
        <label className="flex items-center mb-2">
          <input
            type="radio"
            checked={config.purpose === 'academic'}
            onChange={() => update('purpose', 'academic')}
            className="mr-2"
          />
          {t('dashboard.purpose.academic')}
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            checked={config.purpose === 'commercial'}
            onChange={() => update('purpose', 'commercial')}
            className="mr-2"
          />
          {t('dashboard.purpose.commercial')}
        </label>
      </div>

      {/* Retention */}
      <div>
        <label className="block font-semibold mb-2">{t('dashboard.retention.label')}</label>
        <select
          value={config.retention}
          onChange={e => update('retention', e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="1month">{t('dashboard.retention.1month')}</option>
          <option value="3months">{t('dashboard.retention.3months')}</option>
          <option value="6months">{t('dashboard.retention.6months')}</option>
          <option value="1year">{t('dashboard.retention.1year')}</option>
          <option value="indefinite">{t('dashboard.retention.indefinite')}</option>
        </select>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded text-sm">
        {t('dashboard.revocability')}
      </div>
    </div>
  );
};

export default GranularDashboard;
```

### src/components/Donation/DonationModal.tsx
```typescript
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExperimentConfig, DonationConfig } from '../../types';
import DataNutritionLabel from './DataNutritionLabel';
import GranularDashboard from './GranularDashboard';

interface Props {
  config: ExperimentConfig;
  onDecision: (decision: 'donate' | 'decline', config?: DonationConfig) => void;
}

const DonationModal: React.FC<Props> = ({ config, onDecision }) => {
  const { t } = useTranslation();
  const [dashboardConfig, setDashboardConfig] = useState<DonationConfig | null>(null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold mb-4">{t('donation.title')}</h2>
        <p className="mb-6">{t('donation.description')}</p>

        {/* Show DNL if high transparency */}
        {config.showDNL && (
          <div className="mb-6">
            <DataNutritionLabel />
          </div>
        )}

        {/* Show Dashboard if high control */}
        {config.showDashboard && (
          <div className="mb-6">
            <GranularDashboard onChange={setDashboardConfig} />
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => onDecision('donate', dashboardConfig || undefined)}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            {t('donation.accept')}
          </button>
          <button
            onClick={() => onDecision('decline')}
            className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-400"
          >
            {t('donation.decline')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DonationModal;
```

### src/components/Survey/Debriefing.tsx
```typescript
import React from 'react';
import { useTranslation } from 'react-i18next';

const Debriefing: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg">
      <h2 className="text-2xl font-bold mb-4">{t('debrief.title')}</h2>

      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
        <p className="font-bold mb-2">⚠️ {t('debrief.important')}</p>
        <p className="text-sm">{t('debrief.simulationNote')}</p>
      </div>

      <div className="space-y-4">
        <p>{t('debrief.purpose')}</p>
        <p className="text-sm text-gray-600">{t('debrief.contact')}: sabine.wildemann@example.com</p>
      </div>

      <button
        onClick={() => window.location.href = 'https://ailights.org'}
        className="mt-6 w-full bg-blue-600 text-white py-2 rounded"
      >
        {t('debrief.close')}
      </button>
    </div>
  );
};

export default Debriefing;
```

### src/App.tsx
```typescript
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from './services/api';
import { Session } from './types';
import LanguageSelector from './components/LanguageSelector';
import ChatInterface from './components/Chat/ChatInterface';
import DonationModal from './components/Donation/DonationModal';
import PostTaskSurvey from './components/Survey/PostTaskSurvey';
import Debriefing from './components/Survey/Debriefing';

type Phase = 'landing' | 'chat' | 'donation' | 'survey' | 'debrief';

function App() {
  const { t, i18n } = useTranslation();
  const [phase, setPhase] = useState<Phase>('landing');
  const [session, setSession] = useState<Session | null>(null);
  const [showDonationModal, setShowDonationModal] = useState(false);

  const startExperiment = async () => {
    const data = await api.initializeExperiment(i18n.language);
    setSession(data);
    setPhase('chat');
  };

  const handleMinimumReached = () => {
    setShowDonationModal(true);
  };

  const handleDonationDecision = async (decision: 'donate' | 'decline', config?: any) => {
    if (session) {
      await api.recordDonation(session.participantId, decision, config);
      setShowDonationModal(false);
      setPhase('survey');
    }
  };

  if (phase === 'landing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <LanguageSelector />
        <h1 className="text-3xl font-bold mt-8 mb-4">{t('landing.title')}</h1>
        <p className="mb-8 max-w-2xl text-center">{t('landing.description')}</p>
        <button
          onClick={startExperiment}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold"
        >
          {t('landing.start')}
        </button>
      </div>
    );
  }

  if (phase === 'chat') {
    return (
      <div className="min-h-screen p-4">
        {session && (
          <>
            <ChatInterface
              participantId={session.participantId}
              onMinimumReached={handleMinimumReached}
            />
            {showDonationModal && (
              <DonationModal
                config={session.config}
                onDecision={handleDonationDecision}
              />
            )}
          </>
        )}
      </div>
    );
  }

  if (phase === 'survey') {
    return (
      <PostTaskSurvey
        participantId={session?.participantId || ''}
        onComplete={() => setPhase('debrief')}
      />
    );
  }

  if (phase === 'debrief') {
    return <Debriefing />;
  }

  return null;
}

export default App;
```

---

## 4. Translation Files (Sample: German)

### src/i18n/locales/de.json
```json
{
  "landing": {
    "title": "Swiss Voting Assistant",
    "description": "Helfen Sie uns zu verstehen, wie Bürger mit KI-Systemen interagieren.",
    "start": "Studie starten"
  },
  "chat": {
    "title": "Swiss Voting Assistant",
    "subtitle": "Unterstützt durch Apertus - Swiss AI",
    "placeholder": "Stellen Sie eine Frage...",
    "send": "Senden",
    "thinking": "Denke nach...",
    "minQuestions": "Bitte stellen Sie mindestens 2 Fragen ({count}/2)"
  },
  "donation": {
    "title": "Datenspende-Entscheidung",
    "description": "Ihre Entscheidung hilft uns, vertrauenswürdige KI zu bauen.",
    "accept": "Daten spenden",
    "decline": "Nicht spenden"
  },
  "dnl": {
    "title": "Model Nutrition Label",
    "provenance": "Herkunft",
    "provenanceValue": "CSCS Supercomputer (Lugano)",
    "ingredients": "Zutaten",
    "ingredientsValue": "Öffentliche Abstimmungsdaten, Wikipedia",
    "protection": "Schutz",
    "protectionValue": "Anti-Memorisierung, keine PII",
    "compliance": "Compliance",
    "complianceValue": "FADP & EU AI Act konform",
    "freshness": "Aktualität",
    "freshnessValue": "Daten bis September 2025"
  },
  "dashboard": {
    "title": "Ihre Datenschutz-Einstellungen",
    "scope": {
      "label": "Umfang",
      "topics": "Nur Themen",
      "full": "Vollständige Anfragen"
    },
    "purpose": {
      "label": "Verwendungszweck",
      "academic": "Nur akademische Forschung",
      "commercial": "Auch kommerzielle Nutzung"
    },
    "retention": {
      "label": "Aufbewahrung",
      "1month": "1 Monat",
      "3months": "3 Monate",
      "6months": "6 Monate",
      "1year": "1 Jahr",
      "indefinite": "Unbegrenzt"
    },
    "revocability": "Sie können diese Einstellungen jederzeit ändern."
  },
  "debrief": {
    "title": "Vielen Dank!",
    "important": "Wichtig",
    "simulationNote": "Ihre Datenspende war simuliert. Es wurden keine Daten gespeichert.",
    "purpose": "Diese Studie untersucht Vertrauen in KI-Systeme.",
    "contact": "Kontakt",
    "close": "Schliessen"
  }
}
```

**Create similar files for fr.json, it.json, en.json**

---

## 5. Deployment to ailights.org

### In Lovable:
1. Create new route: `/ballot-chat`
2. Upload all components
3. Set environment variable: `VITE_API_ENDPOINT`
4. Deploy

### Domain configuration:
- Main site: https://ailights.org (existing)
- Chat app: https://ailights.org/ballot-chat (new route)
