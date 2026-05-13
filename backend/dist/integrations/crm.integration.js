"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmIntegration = void 0;
class CrmIntegration {
    async sendEvent(event) {
        if (event.meta?.['simulateFailure']) {
            throw new Error('Simulated CRM failure');
        }
        return { accepted: true };
    }
}
exports.CrmIntegration = CrmIntegration;
