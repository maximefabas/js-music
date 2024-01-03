export default function clamp (num: number, bound1: number, bound2: number): number {
  const min = Math.min(bound1, bound2)
  const max = Math.max(bound1, bound2)
  return Math.min(Math.max(num, min), max)
}
