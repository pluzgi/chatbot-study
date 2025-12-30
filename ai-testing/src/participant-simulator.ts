import { Persona, ThrottleConfig, ChatMessage } from './types.js';
import { ApiClient } from './api-client.js';
import { ResponseGenerator } from './response-generator.js';
import { QuestionGenerator, FeedbackGenerator } from './llm-client.js';
import { ParticipantLogger } from './logger.js';

export class ParticipantSimulator {
  private persona: Persona;
  private runId: string;
  private config: ThrottleConfig;
  private api: ApiClient;
  private responseGen: ResponseGenerator;
  private questionGen: QuestionGenerator;
  private feedbackGen: FeedbackGenerator;
  private logger: ParticipantLogger;

  constructor(persona: Persona, runId: string, config: ThrottleConfig) {
    this.persona = persona;
    this.runId = runId;
    this.config = config;
    this.api = new ApiClient(config);
    this.responseGen = new ResponseGenerator(persona);
    this.questionGen = new QuestionGenerator();
    this.feedbackGen = new FeedbackGenerator();
    this.logger = new ParticipantLogger(runId, persona.id);
  }

  async run(): Promise<void> {
    const startTime = Date.now();

    try {
      // Phase 1: Initialize
      const initStart = Date.now();
      const initPayload = {
        language: this.persona.demographics.language,
        isAiParticipant: true,
        aiPersonaId: this.persona.id,
        aiRunId: this.runId
      };

      const { participantId, condition } = await this.api.request(() =>
        this.api.initialize(initPayload)
      );

      this.logger.setParticipantId(participantId);
      this.logger.setCondition(condition);
      this.logger.logStep({
        phase: 'initialize',
        duration: Date.now() - initStart,
        request: { endpoint: '/experiment/initialize', method: 'POST', body: initPayload },
        response: { status: 200, body: { participantId, condition } },
        error: null
      });

      await this.randomDelay();

      // Phase 2: Baseline Survey
      const baselineStart = Date.now();
      const baselinePayload = this.responseGen.baselineResponses();

      await this.api.request(() =>
        this.api.submitBaseline(participantId, baselinePayload)
      );

      this.logger.logStep({
        phase: 'baseline',
        duration: Date.now() - baselineStart,
        request: { endpoint: '/experiment/baseline', method: 'POST', body: { participantId, ...baselinePayload } },
        response: { status: 200, body: {} },
        error: null
      });

      await this.randomDelay();

      // Phase 3: Chat Interaction
      const chatStart = Date.now();
      const chatHistory = await this.simulateChat(participantId, condition);

      this.logger.logStep({
        phase: 'chat',
        duration: Date.now() - chatStart,
        request: { endpoint: '/chat/message', method: 'POST', body: { messages: chatHistory.length } },
        response: { status: 200, body: { messagesExchanged: chatHistory.length } },
        error: null
      });

      await this.randomDelay();

      // Phase 4: Donation Decision
      const donationStart = Date.now();
      const donates = this.responseGen.donationDecision(condition);
      const donationConfig = donates ? this.responseGen.donationConfig(condition) : null;

      await this.api.request(() =>
        this.api.submitDonation(participantId, donates, donationConfig)
      );

      this.logger.logStep({
        phase: 'donation',
        duration: Date.now() - donationStart,
        request: { endpoint: '/experiment/donation', method: 'POST', body: { decision: donates ? 'donate' : 'decline', config: donationConfig } },
        response: { status: 200, body: {} },
        error: null
      });

      await this.randomDelay();

      // Phase 5: Post-Task Survey
      const postMeasuresStart = Date.now();
      const postMeasures = this.responseGen.postTaskResponses(condition);

      // Generate feedback via LLM in persona's language
      postMeasures.openFeedback = await this.feedbackGen.generateFeedback(this.persona, donates);

      await this.api.request(() =>
        this.api.submitPostMeasures(participantId, postMeasures)
      );

      this.logger.logStep({
        phase: 'post-measures',
        duration: Date.now() - postMeasuresStart,
        request: { endpoint: '/experiment/post-measures', method: 'POST', body: postMeasures },
        response: { status: 200, body: {} },
        error: null
      });

      // Complete
      this.logger.complete();
      const totalTime = Date.now() - startTime;
      console.log(`[OK] ${participantId} (${this.persona.id}, ${condition}) - ${Math.round(totalTime / 1000)}s - ${donates ? 'donated' : 'declined'}`);

    } catch (error: any) {
      this.logger.fail(error.message);
      console.error(`[FAIL] ${this.persona.id}: ${error.message}`);
      throw error;
    }
  }

  private async simulateChat(participantId: string, condition: string): Promise<ChatMessage[]> {
    const conversationHistory: ChatMessage[] = [];
    const questionCount = this.persona.interactionStyle.questionCount;

    for (let i = 0; i < questionCount; i++) {
      // Generate question using Apertus LLM based on persona traits
      const question = await this.questionGen.generateChatQuestion(
        this.persona,
        conversationHistory,
        i
      );

      // Send to chatbot and get response
      const response = await this.api.request(() =>
        this.api.sendChatMessage(
          participantId,
          question,
          conversationHistory,
          this.persona.demographics.language
        )
      );

      conversationHistory.push(
        { role: 'user', content: question },
        { role: 'assistant', content: response }
      );

      // Small delay between messages (realistic pacing)
      await this.delay(1000 + Math.random() * 2000);
    }

    return conversationHistory;
  }

  private async randomDelay(): Promise<void> {
    const delay = this.config.minDelayBetweenSteps +
      Math.random() * (this.config.maxDelayBetweenSteps - this.config.minDelayBetweenSteps);
    await this.delay(delay);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
