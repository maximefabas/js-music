import scalesMainNamesJson from './scales-names.main.js'
import scalesAltNamesJson from './scales-names.alt.js'
import toAlphanum from '../modules/to-alphanum/index.js'

export const decimalValueToCommonNamesMap = new Map(Object
  .entries(scalesMainNamesJson as Record<string, string>)
  .map(([key, mainName]) => [
    parseInt(key),
    toAlphanum(mainName, '_').toLowerCase()
  ])
)

export const allCommonNames = [...decimalValueToCommonNamesMap.values()]

export const thematicNamesCategories = new Set(Object
  .entries(scalesAltNamesJson as Record<string, Array<{ category: string, name: string }>>)
  .map(([, nameItems]) => nameItems.map(nameItem => toAlphanum(nameItem.category, '_').toLowerCase()))
  .flat()
)

export const decimalValueToThematicNamesMap = new Map(Object
  .entries(scalesAltNamesJson as Record<string, Array<{ category: string, name: string }>>)
  .map(([key, nameItems]) => [parseInt(key), nameItems.map(nameItem => ({
    category: toAlphanum(nameItem.category, '_').toLowerCase(),
    name: toAlphanum(nameItem.name, '_').toLowerCase()
  }))])
)

export const allThematicNames = [...decimalValueToThematicNamesMap.values()].flat().map(e => e.name)
