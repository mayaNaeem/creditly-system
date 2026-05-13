export class CrmIntegration {
  async sendEvent(event: { type: string; accountId: string; meta?: Record<string, unknown> }) {
    if (event.meta?.['simulateFailure']) {
      throw new Error('Simulated CRM failure');
    }
    return { accepted: true };
  }
}
