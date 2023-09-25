import stringsToRegexp from './modules/strings-to-regexp/index.js'
import { mainQualitiesToIntervalsNameMap } from './data/scales-qualities.js'
import * as scalesData from './data/scales-names.js'
import { setFlags } from './modules/regexp-utils/index.js'

/* Alteration */
const alteration = /(#|ß)*/

/* Interval */
const simpleStep = /1|2|3|4|5|6|7/
const step = /-?[1-9]([0-9])*/
const simpleInterval = new RegExp(`(${alteration.source})?(${simpleStep.source})`)
const interval = new RegExp(`(${alteration.source})?(${step.source})`)

/* Scale */
const ownStepStart = /!+/
const ownStep = new RegExp(`(${ownStepStart.source})(${step.source})`)
const intervalsNameSeparator = /,/
const intervalsName = new RegExp(`${interval.source}(${intervalsNameSeparator.source}${interval.source})*`)
const minorQuality = /m/
const mainQuality = new RegExp(`${stringsToRegexp([...mainQualitiesToIntervalsNameMap.keys()]).source}`)
const intervalOrOwnStep = new RegExp(`(${interval.source})|(${ownStep.source})`)
const intervalOrOwnStepList = new RegExp(`(${intervalOrOwnStep.source})(${intervalsNameSeparator.source}${intervalOrOwnStep.source})*`)
const accidents = new RegExp(`(${interval.source})+`)
const omissionsStart = /no\(/
const omissionsEnd = /\)/
const omissions = new RegExp(`(${omissionsStart.source})(${intervalOrOwnStepList.source})(${omissionsEnd.source})`)
const additionsStart = /add\(/
const additionsEnd = /\)/
const additions = new RegExp(`(${additionsStart.source})(${intervalsName.source})(${additionsEnd.source})`)
const inversionIdentifier = new RegExp(`\\/`)
const inversion = new RegExp(`(${inversionIdentifier.source})(${intervalOrOwnStep.source})`)
const modifiers = new RegExp(`(${accidents.source})?(${omissions.source})?(${additions.source})?`)
const modifiersAndInversion = new RegExp(`(${modifiers.source})?(${inversion.source})?`)
const qualityRoot = new RegExp(`(${minorQuality.source})?(${mainQuality.source})?`)
const qualityExtension = new RegExp(`(${modifiersAndInversion.source})`)
const quality = new RegExp(`(${qualityRoot.source})?((,)?${qualityExtension.source})?`)
const commonNameRoot = new RegExp(`${stringsToRegexp([...scalesData.allCommonNames]).source}`)
const commonNameExtension = new RegExp(`(,${modifiers.source})?(${inversion.source})`)
const commonName = new RegExp(`(${commonNameRoot.source})(${commonNameExtension})?`)
const thematicNameRoot = new RegExp(`${stringsToRegexp([...scalesData.allThematicNames]).source}`)
const thematicNameExtension = new RegExp(`(,${modifiers.source})?(${inversion.source})`)
const thematicName = new RegExp(`(${thematicNameRoot.source})(${thematicNameExtension})?`)
const commonOrThematicNameRoot = new RegExp(`${stringsToRegexp([
  ...scalesData.allCommonNames,
  ...scalesData.allThematicNames
]).source}`)
const commonOrThematicName = new RegExp(`(${commonOrThematicNameRoot.source})(${commonNameExtension.source})?`)
const qualityOrCommonName = new RegExp(`(${quality.source})|(${commonOrThematicName.source})`)

/* Chord */
const roman = /(M{1,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})|M{0,4}(CM|C?D|D?C{1,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})|M{0,4}(CM|CD|D?C{0,3})(XC|X?L|L?X{1,3})(IX|IV|V?I{0,3})|M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|I?V|V?I{1,3}))/
const offsetIdentifier = /\\/
const offset = new RegExp(`(${offsetIdentifier.source})(${intervalOrOwnStep.source})`)
const chordQuality = new RegExp(`(${quality.source})(${offset.source})?`)
const chordCommonName = new RegExp(`(${commonName.source})(${offset.source})?`)
const chordThematicName = new RegExp(`(${thematicName.source})(${offset.source})?`)
const chordQualityOrCommonName = new RegExp(`(${chordQuality.source})|(${chordCommonName.source})|(${chordThematicName.source})`)
const chord = new RegExp(`(${alteration.source})?(-)?(${setFlags(roman, 'i')})(${chordQualityOrCommonName.source})?`)

/* Chord */

const REGEXPS = {
  alteration,
  simpleStep,
  step,
  simpleInterval,
  interval,
  ownStepStart,
  ownStep,
  intervalsName,
  intervalsNameSeparator,
  minorQuality,
  mainQuality,
  intervalOrOwnStep,
  intervalOrOwnStepList,
  accidents,
  omissionsStart,
  omissionsEnd,
  omissions,
  additionsStart,
  additionsEnd,
  additions,
  inversionIdentifier,
  inversion,
  modifiers,
  modifiersAndInversion,
  qualityRoot,
  qualityExtension,
  quality,
  commonNameRoot,
  commonNameExtension,
  commonName,
  thematicNameRoot,
  thematicNameExtension,
  thematicName,
  commonOrThematicNameRoot,
  commonOrThematicName,
  qualityOrCommonName,
  roman,
  offsetIdentifier,
  offset,
  chordQuality,
  chordCommonName,
  chordThematicName,
  chordQualityOrCommonName,
  chord
}

window.REGEXPS = REGEXPS

export { REGEXPS }
