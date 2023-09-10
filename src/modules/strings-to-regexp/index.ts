export default function stringsToRegexp (strings: string[]): RegExp {
  const rootsMap = stringsToRootsMap(strings)
  const source = regexpSourceFromRootsMap(rootsMap, false)
  const regexp = new RegExp(source)
  return regexp
}

function regexpEscape (string: string) {
  return string
    .replace(/\s/igm, '\\s')
    .replace(/\n/igm, '\\n')
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

type RootsMap = Map<string, { subRootsMap: RootsMap, isWordEnd: boolean }>

function stringsToRootsMap (strings: string[], rootsMap: RootsMap = new Map()): RootsMap {
  const lengthSorted = strings.sort((strA, strB) => strA.length - strB.length)
  lengthSorted.forEach(string => {
    const [firstChar, ...lastChars] = string
    const isWordEnd = lastChars.length === 0
    if (firstChar === undefined) return
    const roots = [...rootsMap.keys()]
    const foundRoot = roots.find(root => new RegExp(`^(${regexpEscape(root)})`).test(string))
    const subRootsMap = foundRoot !== undefined
      ? rootsMap.get(foundRoot)?.subRootsMap
      : undefined
    if (foundRoot === undefined || subRootsMap === undefined) {
      const subRootsMap: RootsMap = new Map()
      stringsToRootsMap([lastChars.join('')], subRootsMap)
      return rootsMap.set(firstChar, { subRootsMap, isWordEnd })
    }
    stringsToRootsMap([lastChars.join('')], subRootsMap)
  })
  return rootsMap
}

function regexpSourceFromRootsMap (
  rootsMap: RootsMap,
  isOptional: boolean
): string {
  const rootsMapEntries = [...rootsMap.entries()]
  if (rootsMapEntries.length === 0) return ''
  const regexpBody = rootsMapEntries.map(([root, rootData]) => {
    return `${regexpEscape(root)}${regexpSourceFromRootsMap(
      rootData.subRootsMap,
      rootData.isWordEnd
    )}`
  }).join('|')
  return isOptional
    ? `(${regexpBody})?`
    : `(${regexpBody})`
}
