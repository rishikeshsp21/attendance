export let onFaceCapturedCallback:
  ((embeddingString: string) => void) | null = null;

// Setter function used before navigation
export function setOnFaceCapturedCallback(
  cb: (embeddingString: string) => void
) {
  onFaceCapturedCallback = cb;
}
