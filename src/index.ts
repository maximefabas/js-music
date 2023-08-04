/* Absolute modulo (should be a dependency) */
function absoluteModulo (nbr: number, modulo: number): number {
  return ((nbr % modulo) + modulo) % modulo
}

/* PitchClassLetter */

type PitchClassLetterValue = number
type PitchClassLetterName = string

const pitchClassLettersValuesAndNamesArr: Array<[PitchClassLetterValue, PitchClassLetterName]> = [
  [0, 'a'],
  [2, 'b'],
  [4, 'c'],
  [5, 'd'],
  [7, 'e'],
  [9, 'f'],
  [11, 'g']
]
const pitchClassLettersValuesToNamesMap = new Map<PitchClassLetterValue, PitchClassLetterName>(pitchClassLettersValuesAndNamesArr)
const pitchClassLettersNamesToValuesMap = new Map<PitchClassLetterName, PitchClassLetterValue>(pitchClassLettersValuesAndNamesArr.map(pair => ([pair[1], pair[0]])))

function pitchClassLetterValueToName (value: PitchClassLetterValue): PitchClassLetterName {
  return pitchClassLettersValuesToNamesMap.get(value) ?? 'c'
}

function pitchClassLetterNameToValue (name: PitchClassLetterName): PitchClassLetterValue|undefined {
  const validLetters = [...pitchClassLettersNamesToValuesMap.keys()]
  const lastFoundValidLetter = name.split('')
    .filter(char => validLetters.includes(char))
    .at(-1)
  if (lastFoundValidLetter === undefined) return undefined
  return pitchClassLettersNamesToValuesMap.get(lastFoundValidLetter)
}

/* Alteration */

type AlterationValue = number
type AlterationName = string

function alterationValueToName (value: AlterationValue): AlterationName {
  if (value > 0) return new Array(value).fill('#').join('')
  if (value < 0) return new Array(-1 * value).fill('ß').join('')
  return ''
}

function alterationNameToValue (name: AlterationName): AlterationValue {
  const chars = name.split('')
  const sharps = chars.filter(char => char === '#').length
  const flats = chars.filter(char => char === 'ß').length
  return sharps - flats
}

/* PitchClass */

type PitchClassValue = {
  alteration: AlterationValue
  pitchClassLetter: PitchClassLetterValue
}
type PitchClassName = string

function pitchClassValueToName (value: PitchClassValue): PitchClassName {
  const alterationName = alterationValueToName(value.alteration)
  const letterName = pitchClassLetterValueToName(value.pitchClassLetter)
  return `${alterationName}${letterName}`
}

function pitchClassNameToValue (name: PitchClassName): PitchClassValue|undefined {
  const alterationValue = alterationNameToValue(name)
  const pitchClassLetterValue = pitchClassLetterNameToValue(name)
  if (pitchClassLetterValue === undefined) return undefined
  return {
    alteration: alterationValue,
    pitchClassLetter: pitchClassLetterValue
  }
}

/* Octave */

type OctaveValue = number
type OctaveName = string

function octaveValueToName (value: OctaveValue): OctaveName {
  return `${value}`
}

function octaveNameToValue (name: OctaveName): OctaveValue|undefined {
  const chars = name.split('')
  const numberChars = chars.filter(char => !Number.isNaN(parseInt(char)))
  const strValue = numberChars.join('')
  const parsedValue = parseInt(strValue)
  if (!Number.isInteger(parsedValue)) return undefined
  return parsedValue
}

/* Pitch */

type PitchValue = {
  pitchClass: PitchClassValue,
  octave: OctaveValue
}
type PitchName = string

function pitchValueToName (value: PitchValue): PitchName {
  const pitchClassName = pitchClassValueToName(value.pitchClass)
  const octaveName = octaveValueToName(value.octave)
  return `${pitchClassName}^${octaveName}`
}

function pitchNameToValue (name: PitchName): PitchValue|undefined {
  const [pitchClassName, ...octaveNameArr] = name.split('^')
  const octaveName = octaveNameArr.join('^')
  const pitchClassValue = pitchClassNameToValue(pitchClassName)
  const octaveValue = octaveNameToValue(octaveName)
  if (pitchClassValue === undefined) return undefined
  if (octaveValue === undefined) return undefined
  return {
    pitchClass: pitchClassValue,
    octave: octaveValue
  }
}

/* SimpleInterval */

type SimpleIntervalValue = {
  simpleIntervalClass: number
  alteration: AlterationValue
}
type SimpleIntervalName = string

function simpleIntervalValueToName (value: SimpleIntervalValue): SimpleIntervalName {
  const { simpleIntervalClass, alteration } = value
  const alterationName = alterationValueToName(alteration)
  let simpleIntervalClassName: string
  if (simpleIntervalClass > 0) { simpleIntervalClassName = `${simpleIntervalClass + 1}` }
  else if (simpleIntervalClass === 0) { simpleIntervalClassName = '1' }
  else { simpleIntervalClassName = `${-1 * simpleIntervalClass + 1}` }
  return `${alterationName}${simpleIntervalClassName}`
}

function simpleIntervalNameToValue (name: SimpleIntervalName): SimpleIntervalValue|undefined {
  const nameChars = name.split('')
  const simpleIntervalClassNameChars = nameChars.filter(char => char === '-' || !Number.isNaN(parseInt(char)))
  const parsedSimpleIntervalClassValue = parseInt(simpleIntervalClassNameChars.join(''))
  if (!Number.isInteger(parsedSimpleIntervalClassValue)) return undefined
  let simpleIntervalClass: number
  if (parsedSimpleIntervalClassValue > 1) { simpleIntervalClass = parsedSimpleIntervalClassValue - 1 }
  else if (parsedSimpleIntervalClassValue < 1) { simpleIntervalClass = -1 * parsedSimpleIntervalClassValue - 1 }
  else { simpleIntervalClass = 0 }
  const alteration = alterationNameToValue(name)
  return { simpleIntervalClass, alteration }
}

function simpleIntervalValueAsSemitones (value: SimpleIntervalValue): number {
  const { simpleIntervalClass, alteration } = value
  return simpleIntervalClass + alteration
}

// [WIP] from semitones ? What to do with octaves ? direct convert octave to semitones, or go through simple interval or interval ?

/* Interval */

type IntervalValue = {
  simpleInterval: SimpleIntervalValue
  octave: OctaveValue
}
type IntervalName = string

function intervalValueToName (value: IntervalValue): IntervalName {
  

  // const { alteration, intervalClass } = value
  // const alterationName = alterationValueToName(alteration)
  // let intervalClassName: string
  // if (intervalClass === 0) { intervalClassName = '1' }
  // else if (intervalClass > 0) { intervalClassName = `${intervalClass + 1}` }
  // else { intervalClassName = `${intervalClass - 1}` }
  // return `${alterationName}${intervalClassName}`
}

// function intervalNameToValue (name: IntervalName): IntervalValue|undefined {
//   const nameChars = name.split('')
//   const intervalClassNameChars = nameChars.filter(char => {
//     return char === '-' || !Number.isNaN(parseInt(char))
//   })
//   const parsedIntervalClassValue = parseInt(intervalClassNameChars.join(''))
//   if (!Number.isInteger(parsedIntervalClassValue)) return undefined
//   let intervalClass: number
//   if (parsedIntervalClassValue > 1) { intervalClass = parsedIntervalClassValue - 1 }
//   else if (parsedIntervalClassValue < 1) { intervalClass = parsedIntervalClassValue + 1 }
//   else { intervalClass = 0 }
//   const alteration = alterationNameToValue(name)
//   return { intervalClass, alteration }
// }

// function intervalToSimpleInterval (value: IntervalValue): IntervalValue {
  
// }
