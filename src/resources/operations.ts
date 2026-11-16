import type {
  ProcessingStatus,
  ProcessingLookupInput,
  ProcessingResult,
} from '../api-types.js';
import type { BinaryResult } from '../types.js';
import { ProjectResource } from './project.js';
export class OperationsResource extends ProjectResource {
  get(id: string): Promise<ProcessingStatus> {
    return this.json('GET', ['operations', id]);
  }
  lookup(input: ProcessingLookupInput): Promise<ProcessingStatus> {
    return this.json('POST', ['operations', 'lookup'], input);
  }
  async result(id: string): Promise<ProcessingResult> {
    const result = await this.http.requestBinary(
      'GET',
      await this.url(['operations', id, 'result']),
    );
    if (result.contentType.includes('application/json'))
      return JSON.parse(new TextDecoder().decode(result.data)).data as Exclude<
        ProcessingResult,
        BinaryResult
      >;
    return result;
  }
}
