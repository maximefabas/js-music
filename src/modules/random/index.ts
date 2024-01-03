export default function random (max: number = 1, min: number = 0) {
  if (min === max || min > max) return NaN
  const range = max - min
  return (Math.random() * range) + min
}

export function randomInt (max?: number, min?: number) {
  return Math.floor(random(max, min))
}
