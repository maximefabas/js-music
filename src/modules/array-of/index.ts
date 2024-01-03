type Filler<T = any> = (pos?: number) => T

export default function arrayOf<T> (filler: Filler<T>, length: number) {
  return new Array(length)
    .fill(null)
    .map((_, pos) => filler(pos))
}
