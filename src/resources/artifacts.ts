import type {
  ToolArtifact,
  ArtifactSaveInput,
  ListOptions,
} from '../api-types.js';
import type { Page, BinaryResult, UploadSource } from '../types.js';
import { appendFile, prepareUpload } from '../http/multipart.js';
import { ProjectResource } from './project.js';
export class ArtifactsResource extends ProjectResource {
  list(
    params: Pick<ListOptions, 'page' | 'limit' | 'q' | 'kind'> = {},
  ): Promise<Page<ToolArtifact>> {
    return this.page(['tools', 'artifacts'], params);
  }
  get(id: string): Promise<ToolArtifact> {
    return this.json('GET', ['tools', 'artifacts', id]);
  }
  delete(id: string): Promise<{ message: string }> {
    return this.json('DELETE', ['tools', 'artifacts', id]);
  }
  async download(id: string): Promise<BinaryResult> {
    return this.http.requestBinary(
      'GET',
      await this.url(['tools', 'artifacts', id, 'content']),
    );
  }
  async save(
    source: UploadSource,
    input: ArtifactSaveInput,
  ): Promise<ToolArtifact> {
    const prepared = await prepareUpload(source, {
      contentType: input.contentType,
    });
    const form = new FormData();
    appendFile(form, 'file', prepared);
    for (const [key, value] of Object.entries(input))
      if (value !== undefined)
        form.append(
          key,
          key === 'requestSnapshot' ? JSON.stringify(value) : String(value),
        );
    return (
      await this.http.requestMultipartJson<ToolArtifact>(
        'POST',
        await this.url(['tools', 'artifacts']),
        form,
        { uploadLength: prepared.byteLength },
      )
    ).data;
  }
}
