import { ThrottleConfig, InitializeResponse, ChatMessage, DonationConfig, PostTaskMeasures } from './types.js';

// Rate Limiter using token bucket algorithm
class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number;
  private lastRefill: number;

  constructor(requestsPerSecond: number) {
    this.maxTokens = requestsPerSecond;
    this.tokens = requestsPerSecond;
    this.refillRate = requestsPerSecond / 1000;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens < 1) {
      const waitTime = (1 - this.tokens) / this.refillRate;
      await this.delay(waitTime);
      this.refill();
    }

    this.tokens -= 1;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Circuit Breaker for handling failures
class CircuitBreaker {
  private failures: number = 0;
  private lastFailure: number = 0;
  private isOpen: boolean = false;

  constructor(
    private threshold: number = 5,
    private cooldownMs: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should close
    if (this.isOpen && Date.now() - this.lastFailure > this.cooldownMs) {
      this.isOpen = false;
      this.failures = 0;
      console.log('Circuit breaker closed, resuming operations');
    }

    if (this.isOpen) {
      const waitTime = this.cooldownMs - (Date.now() - this.lastFailure);
      console.log(`Circuit open, waiting ${Math.round(waitTime / 1000)}s...`);
      await this.delay(waitTime);
      this.isOpen = false;
      this.failures = 0;
    }

    try {
      const result = await fn();
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailure = Date.now();

      if (this.failures >= this.threshold) {
        this.isOpen = true;
        console.error(`Circuit breaker OPEN after ${this.failures} consecutive failures`);
      }

      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class ApiClient {
  private baseUrl: string;
  private rateLimiter: RateLimiter;
  private circuitBreaker: CircuitBreaker;
  private config: ThrottleConfig;

  constructor(config: ThrottleConfig) {
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3001/api';
    this.config = config;
    this.rateLimiter = new RateLimiter(config.requestsPerSecond);
    this.circuitBreaker = new CircuitBreaker(
      config.circuitBreakerThreshold,
      config.circuitBreakerCooldown
    );
  }

  /**
   * Make a rate-limited request with retries
   */
  async request<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    await this.rateLimiter.acquire();

    return this.circuitBreaker.execute(async () => {
      let lastError: Error = new Error('Unknown error');

      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          return await fn();
        } catch (error: any) {
          lastError = error;

          // Don't retry client errors (4xx except 429)
          if (error.status >= 400 && error.status < 500 && error.status !== 429) {
            throw error;
          }

          // Exponential backoff
          const backoffMs = Math.min(
            this.config.backoffBaseMs * Math.pow(2, attempt),
            this.config.backoffMaxMs
          );

          console.log(`Request failed (attempt ${attempt + 1}/${retries}), retrying in ${backoffMs}ms...`);
          await this.delay(backoffMs);
        }
      }

      throw lastError;
    });
  }

  /**
   * Initialize a new participant
   */
  async initialize(data: {
    language: string;
    isAiParticipant: boolean;
    aiPersonaId: string;
    aiRunId: string;
  }): Promise<InitializeResponse> {
    const response = await fetch(`${this.baseUrl}/experiment/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error: any = new Error(`Initialize failed: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return response.json();
  }

  /**
   * Submit baseline survey responses
   */
  async submitBaseline(participantId: string, data: {
    techComfort: number;
    privacyConcern: number;
    ballotFamiliarity: number;
  }): Promise<void> {
    const response = await fetch(`${this.baseUrl}/experiment/baseline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId,
        ...data
      })
    });

    if (!response.ok) {
      const error: any = new Error(`Baseline failed: ${response.status}`);
      error.status = response.status;
      throw error;
    }
  }

  /**
   * Send a chat message to the chatbot
   */
  async sendChatMessage(
    participantId: string,
    message: string,
    history: ChatMessage[],
    language: string
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId,
        message,
        conversationHistory: history,
        language
      })
    });

    if (!response.ok) {
      const error: any = new Error(`Chat failed: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data.response || data.message || '';
  }

  /**
   * Submit donation decision
   */
  async submitDonation(
    participantId: string,
    donates: boolean,
    config: DonationConfig | null
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/donation/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId,
        decision: donates ? 'donate' : 'decline',
        configuration: config
      })
    });

    if (!response.ok) {
      const error: any = new Error(`Donation failed: ${response.status}`);
      error.status = response.status;
      throw error;
    }
  }

  /**
   * Submit post-task survey measures
   */
  async submitPostMeasures(participantId: string, measures: PostTaskMeasures): Promise<void> {
    const response = await fetch(`${this.baseUrl}/donation/post-measures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId,
        measures
      })
    });

    if (!response.ok) {
      const error: any = new Error(`Post-measures failed: ${response.status}`);
      error.status = response.status;
      throw error;
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
