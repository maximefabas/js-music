/* Absolute modulo (should be a dependency) */
export function absoluteModulo (nbr: number, modulo: number): number {
  return ((nbr % modulo) + modulo) % modulo
}

/* PitchClassLetter */

export type PitchClassLetterValue = number
export type PitchClassLetterName = string
export const pitchClassLettersNamesArr: Array<PitchClassLetterName> = ['c', 'd', 'e', 'f', 'g', 'a', 'b']
export function pitchClassLetterValueToName (value: PitchClassLetterValue): PitchClassLetterName {
  return pitchClassLettersNamesArr[value] ?? 'c'
}
export function pitchClassLetterNameToValue (name: PitchClassLetterName): PitchClassLetterValue | undefined {
  const validLetters = name.split('').filter(char => pitchClassLettersNamesArr.includes(char))
  const lastFoundValidLetter = validLetters.at(-1)
  const position = (pitchClassLettersNamesArr as Array<string | undefined>).indexOf(lastFoundValidLetter)
  if (position === -1) return undefined
  return position
}

/* Alteration */

export type AlterationValue = number
export type AlterationName = string
export function alterationValueToName (value: AlterationValue): AlterationName {
  if (value > 0) return new Array(value).fill('#').join('')
  if (value < 0) return new Array(-1 * value).fill('ß').join('')
  return ''
}
export function alterationNameToValue (name: AlterationName): AlterationValue {
  const chars = name.split('')
  const sharps = chars.filter(char => char === '#').length
  const flats = chars.filter(char => char === 'ß').length
  return sharps - flats
}

/* PitchClass */

export type PitchClassValue = {
  alteration: AlterationValue
  pitchClassLetter: PitchClassLetterValue
}
export type PitchClassName = string
export function pitchClassValueToName (value: PitchClassValue): PitchClassName {
  const alterationName = alterationValueToName(value.alteration)
  const letterName = pitchClassLetterValueToName(value.pitchClassLetter)
  return `${alterationName}${letterName}`
}
export function pitchClassNameToValue (name: PitchClassName): PitchClassValue | undefined {
  const alterationValue = alterationNameToValue(name)
  const pitchClassLetterValue = pitchClassLetterNameToValue(name)
  if (pitchClassLetterValue === undefined) return undefined
  return {
    alteration: alterationValue,
    pitchClassLetter: pitchClassLetterValue
  }
}

/* Octave */

export type OctaveValue = number
export type OctaveName = string
export function octaveValueToName (value: OctaveValue): OctaveName { return `${value}` }
export function octaveNameToValue (name: OctaveName): OctaveValue | undefined {
  const chars = name.split('')
  const numberChars = chars.filter(char => !Number.isNaN(parseInt(char) || char === '-'))
  const strValue = numberChars.join('')
  const parsedValue = parseInt(strValue)
  if (!Number.isInteger(parsedValue)) return undefined
  return parsedValue
}

/* Pitch */

export type PitchValue = {
  pitchClass: PitchClassValue,
  octave: OctaveValue
}
export type PitchName = string
export function pitchValueToName (value: PitchValue): PitchName {
  const pitchClassName = pitchClassValueToName(value.pitchClass)
  const octaveName = octaveValueToName(value.octave)
  return `${pitchClassName}^${octaveName}`
}
export function pitchNameToValue (name: PitchName): PitchValue | undefined {
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
export type SimpleIntervalClass = number
export type SimpleIntervalValue = {
  simpleIntervalClass: SimpleIntervalClass
  alteration: AlterationValue
}
export type SimpleIntervalName = string

export function simpleIntervalValueToName (value: SimpleIntervalValue): SimpleIntervalName {
  const { simpleIntervalClass, alteration } = value
  const alterationName = alterationValueToName(alteration)
  let simpleIntervalClassName: string
  if (simpleIntervalClass > 0) { simpleIntervalClassName = `${simpleIntervalClass + 1}` }
  else if (simpleIntervalClass === 0) { simpleIntervalClassName = '1' }
  else { simpleIntervalClassName = `${-1 * simpleIntervalClass + 1}` }
  return `${alterationName}${simpleIntervalClassName}`
}

export function simpleIntervalNameToValue (name: SimpleIntervalName): SimpleIntervalValue | undefined {
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

export function simpleIntervalClassInvert (simpleIntervalClass: SimpleIntervalClass): SimpleIntervalClass {
  console.log('simpleIntervalClassInvert - input', simpleIntervalClass)
  console.log('simpleIntervalClassInvert - return', 7 - simpleIntervalClass)
  return 7 - simpleIntervalClass
}

export function simpleIntervalClassToSemitones (simpleIntervalClass: SimpleIntervalClass): number | undefined {
  console.log('simpleIntervalClassToSemitones - input', simpleIntervalClass)
  const semitonesList = [0, 2, 4, 5, 7, 9, 11]
  const loops = Math.floor(simpleIntervalClass / 7)
  console.log('simpleIntervalClassToSemitones - loops', loops)
  const absSimpleIntervalClass = absoluteModulo(simpleIntervalClass, 7)
  console.log('simpleIntervalClassToSemitones - absSimpleIntervalClass', absSimpleIntervalClass)
  const absSemitones = semitonesList.at(absSimpleIntervalClass)
  console.log('simpleIntervalClassToSemitones - absSemitones', absSemitones)
  if (absSemitones === undefined) return undefined
  console.log('simpleIntervalClassToSemitones - return', 12 * loops + absSemitones)
  return 12 * loops + absSemitones
}

export function simpleIntervalToSemitones (value: SimpleIntervalValue): number | undefined {
  console.log('simpleIntervalToSemitones - input', value)
  const { simpleIntervalClass, alteration } = value
  const simpleIntervalClassAsSemitones = simpleIntervalClassToSemitones(simpleIntervalClass)
  console.log('simpleIntervalToSemitones - simpleIntervalClassAsSemitones', simpleIntervalClassAsSemitones)
  if (simpleIntervalClassAsSemitones === undefined) return undefined
  console.log('simpleIntervalToSemitones - return', simpleIntervalClassAsSemitones + alteration)
  return simpleIntervalClassAsSemitones + alteration
}

export function simpleIntervalInvert (value: SimpleIntervalValue): SimpleIntervalValue | undefined {
  console.log('simpleIntervalInvert - input', value)
  const inputAsSemitones = simpleIntervalToSemitones(value)
  console.log('simpleIntervalInvert - inputAsSemitones', inputAsSemitones)
  if (inputAsSemitones === undefined) return undefined
  const outputAsSemitones = 12 - inputAsSemitones
  console.log('simpleIntervalInvert - outputAsSemitones', outputAsSemitones)
  const { simpleIntervalClass } = value
  const invertedSimpleIntervalClass = simpleIntervalClassInvert(simpleIntervalClass)
  console.log('simpleIntervalInvert - invertedSimpleIntervalClass', invertedSimpleIntervalClass)
  const invertedSimpleIntervalClassAsSemitones = simpleIntervalClassToSemitones(invertedSimpleIntervalClass)
  console.log('simpleIntervalInvert - invertedSimpleIntervalClassAsSemitones', invertedSimpleIntervalClassAsSemitones)
  if (invertedSimpleIntervalClassAsSemitones === undefined) return undefined
  const invertedAlteration = outputAsSemitones - invertedSimpleIntervalClassAsSemitones
  console.log('simpleIntervalInvert - invertedAlteration', invertedAlteration)
  console.log('simpleIntervalInvert - return', {
    simpleIntervalClass: invertedSimpleIntervalClass,
    alteration: invertedAlteration
  })
  return {
    simpleIntervalClass: invertedSimpleIntervalClass,
    alteration: invertedAlteration
  }
}

console.log(simpleIntervalValueToName(
  simpleIntervalInvert(
    simpleIntervalNameToValue('9') as any
  ) as any
))

// export function simpleIntervalValueAsSemitones (value: SimpleIntervalValue): number {
//   const { simpleIntervalClass, alteration } = value
//   const simpleIntervalValuesArr = [0, 2, 4, 5, 7, 9, 11]
//   const octaves = Math.ceil(simpleIntervalClass / 7)
//   const octavesAsSemitones = 12 * octaves
//   const modulatedSimpleInterval = absoluteModulo(simpleIntervalClass, 7)

//   return simpleIntervalClass + alteration
// }

// [WIP] from semitones ? What to do with octaves ? direct convert octave to semitones, or go through simple interval or interval ?

/* Interval */

export type IntervalValue = {
  simpleInterval: SimpleIntervalValue
  octave: OctaveValue
}
export type IntervalName = string

export function intervalValueToName (value: IntervalValue): IntervalName {
  

  // const { alteration, intervalClass } = value
  // const alterationName = alterationValueToName(alteration)
  // let intervalClassName: string
  // if (intervalClass === 0) { intervalClassName = '1' }
  // else if (intervalClass > 0) { intervalClassName = `${intervalClass + 1}` }
  // else { intervalClassName = `${intervalClass - 1}` }
  // return `${alterationName}${intervalClassName}`
}

// function intervalNameToValue (name: IntervalName): IntervalValue | undefined {
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
