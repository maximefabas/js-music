export function mergeFlags (...flagStrs: string[]): string {
  const flagsSet = new Set<string>()
  flagStrs.forEach(flagStr => flagStr
    .split('')
    .forEach(char => flagsSet.add(char))
  )
  return [...flagsSet.values()].join('')
}

export function setFlags (regexp: RegExp, _flags: string): RegExp {
  const flags = mergeFlags(regexp.flags, _flags)
  return new RegExp(`${regexp.source}`, flags)
}

export function fromStart (regexp: RegExp, _flags: string = 'g'): RegExp {
  const flags = mergeFlags(regexp.flags, _flags)
  return new RegExp(`^(${regexp.source})`, flags)
}

export function toEnd (regexp: RegExp, _flags: string = 'g'): RegExp {
  const flags = mergeFlags(regexp.flags, _flags)
  return new RegExp(`(${regexp.source})$`, flags)
}

export function fromStartToEnd (regexp: RegExp, _flags: string = 'g'): RegExp {
  const flags = mergeFlags(regexp.flags, _flags)
  return fromStart(toEnd(regexp, flags), flags)
}

export function stringStartsWith (string: string, _regexp: RegExp): boolean
export function stringStartsWith (string: string, _regexp: RegExp, returnMatches: true): RegExpMatchArray | null
export function stringStartsWith (string: string, _regexp: RegExp, returnMatches: false): boolean
export function stringStartsWith (string: string, _regexp: RegExp, returnMatches: false, _flags: string): boolean
export function stringStartsWith (string: string, _regexp: RegExp, returnMatches: true, _flags: string): RegExpMatchArray | null
export function stringStartsWith (string: string, _regexp: RegExp, returnMatches = true, _flags: string = 'g'): RegExpMatchArray | null | boolean {
  const regexp = fromStart(_regexp, _flags)
  return returnMatches ? string.match(regexp) : regexp.test(string)
}

export function stringEndsWith (string: string, _regexp: RegExp): boolean
export function stringEndsWith (string: string, _regexp: RegExp, returnMatches: true): RegExpMatchArray | null
export function stringEndsWith (string: string, _regexp: RegExp, returnMatches: false): boolean
export function stringEndsWith (string: string, _regexp: RegExp, returnMatches: false, _flags: string): boolean
export function stringEndsWith (string: string, _regexp: RegExp, returnMatches: true, _flags: string): RegExpMatchArray | null
export function stringEndsWith (string: string, _regexp: RegExp, returnMatches = true, _flags: string = 'g'): RegExpMatchArray | null | boolean {
  const regexp = toEnd(_regexp, _flags)
  return returnMatches ? string.match(regexp) : regexp.test(string)
}

export function stringIs (string: string, _regexp: RegExp): boolean
export function stringIs (string: string, _regexp: RegExp, returnMatches: true): RegExpMatchArray | null
export function stringIs (string: string, _regexp: RegExp, returnMatches: false): boolean
export function stringIs (string: string, _regexp: RegExp, returnMatches: false, _flags: string): boolean
export function stringIs (string: string, _regexp: RegExp, returnMatches: true, _flags: string): RegExpMatchArray | null
export function stringIs (string: string, _regexp: RegExp, returnMatches = false, _flags: string = 'g'): RegExpMatchArray | null | boolean {
  const regexp = fromStartToEnd(_regexp, _flags)
  return returnMatches ? string.match(regexp) : regexp.test(string)
}
