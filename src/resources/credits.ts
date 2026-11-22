import type { CreditQuote, CreditQuoteInput } from '../api-types.js';
import { ProjectResource } from './project.js';
export class CreditsResource extends ProjectResource {
  quote(input: CreditQuoteInput): Promise<CreditQuote> {
    return this.json('POST', ['credits', 'quote'], input);
  }
}
