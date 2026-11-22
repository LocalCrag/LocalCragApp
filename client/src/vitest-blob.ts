import { Blob as NodeBlob, File as NodeFile } from 'node:buffer';

// jsdom's Blob becomes a plain object under structured clone, so IndexedDB
// round-trips lose `size` and `type`. Node's Blob clones correctly.
const scope = globalThis as typeof globalThis & {
  Blob: typeof Blob;
  File: typeof File;
};
scope.Blob = NodeBlob as unknown as typeof Blob;
scope.File = NodeFile as unknown as typeof File;
if (typeof window !== 'undefined') {
  window.Blob = scope.Blob;
  window.File = scope.File;
}
