// Reduces a set of same-length vectors to 2 dimensions with PCA, so 1536
// numbers can be plotted on a flat chart. Uses the Gram-matrix trick
// (n x n instead of dim x dim) since there are always far fewer points
// than dimensions here, and power iteration for the top 2 eigenvectors,
// so nothing beyond plain arithmetic is needed, no matrix library.
export function reduceToTwoDimensions(
  vectors: number[][]
): { x: number; y: number }[] {
  const n = vectors.length
  if (n === 0) return []
  const dim = vectors[0].length

  const mean = new Array(dim).fill(0)
  for (const v of vectors) for (let i = 0; i < dim; i++) mean[i] += v[i] / n
  const centered = vectors.map((v) => v.map((x, i) => x - mean[i]))

  const gram: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      let sum = 0
      for (let k = 0; k < dim; k++) sum += centered[i][k] * centered[j][k]
      gram[i][j] = sum
      gram[j][i] = sum
    }
  }

  function matVec(m: number[][], v: number[]) {
    return m.map((row) => row.reduce((acc, x, i) => acc + x * v[i], 0))
  }
  function norm(v: number[]) {
    return Math.sqrt(v.reduce((a, x) => a + x * x, 0))
  }
  function normalize(v: number[]) {
    const nn = norm(v)
    return nn === 0 ? v : v.map((x) => x / nn)
  }
  function dot(a: number[], b: number[]) {
    return a.reduce((s, x, i) => s + x * b[i], 0)
  }
  function topEigenvector(m: number[][], deflate: number[][]) {
    let v = normalize(Array.from({ length: m.length }, () => Math.random()))
    for (let iter = 0; iter < 300; iter++) {
      let mv = matVec(m, v)
      for (const d of deflate) {
        const c = dot(mv, d)
        mv = mv.map((x, i) => x - c * d[i])
      }
      v = normalize(mv)
    }
    return { vec: v, value: dot(matVec(m, v), v) }
  }

  const pc1 = topEigenvector(gram, [])
  const pc2 = topEigenvector(gram, [pc1.vec])
  const scale1 = Math.sqrt(Math.max(pc1.value, 0))
  const scale2 = Math.sqrt(Math.max(pc2.value, 0))

  return pc1.vec.map((_, i) => ({
    x: pc1.vec[i] * scale1,
    y: pc2.vec[i] * scale2,
  }))
}
