/**
 * Calculate cosine similarity between two vectors
 * Returns a value between -1 and 1, where 1 means identical
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Generate a random 128-dimensional vector for face embedding simulation
 */
export function generateRandomEmbedding(): number[] {
  const embedding = [];
  for (let i = 0; i < 128; i++) {
    embedding.push(Math.random() * 2 - 1); // Random value between -1 and 1
  }
  return embedding;
}

/**
 * Calculate average embedding from multiple face embeddings
 */
export function averageEmbeddings(embeddings: number[][]): number[] {
  if (embeddings.length === 0) {
    throw new Error('Cannot average empty embeddings array');
  }

  const dimension = embeddings[0].length;
  const average = new Array(dimension).fill(0);

  for (const embedding of embeddings) {
    for (let i = 0; i < dimension; i++) {
      average[i] += embedding[i];
    }
  }

  for (let i = 0; i < dimension; i++) {
    average[i] /= embeddings.length;
  }

  return average;
}
