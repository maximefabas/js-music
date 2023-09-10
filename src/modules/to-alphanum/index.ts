export default function toAlphanum (string: string, replacer: string = ''): string {
  const replaced = string.replace(/[^a-z0-9]/igm, replacer)
  if (replacer.length === 0) return replaced
  return replaced.replace(new RegExp(`${replacer}+`, 'igm'), replacer)
}
