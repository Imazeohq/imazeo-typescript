import type { OutputsSummary, OutputRow, ListOptions } from '../api-types.js';
import type { Page } from '../types.js';
import { ProjectResource } from './project.js';
export class OutputsResource extends ProjectResource {
  summary(): Promise<OutputsSummary> {
    return this.json('GET', ['outputs', 'summary']);
  }
  list(
    params: Pick<ListOptions, 'page' | 'limit' | 'q' | 'type'> = {},
  ): Promise<Page<OutputRow>> {
    return this.page(['outputs'], params);
  }
}
