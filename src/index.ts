/* Absolute modulo (should be a dependency) */
export function absoluteModulo (nbr: number, modulo: number): number {
  return ((nbr % modulo) + modulo) % modulo
}

/* PitchClassLetter */

export type PitchClassLetterValue = number
export type PitchClassLetterName = string
export const pitchClassLettersNamesArr: PitchClassLetterName[] = ['c', 'd', 'e', 'f', 'g', 'a', 'b']
export const pitchClassLettersSemitonesFromCArr: number[] = [0, 2, 4, 5, 7, 9, 11]
export function pitchClassLetterValueToName (value: PitchClassLetterValue): PitchClassLetterName {
  return pitchClassLettersNamesArr[value] ?? 'c'
}
export function pitchClassLetterNameToValue (name: PitchClassLetterName): PitchClassLetterValue | undefined {
  const validLetters = name.split('').filter(char => pitchClassLettersNamesArr.includes(char))
  const lastFoundValidLetter = validLetters.at(-1)
  const position = (pitchClassLettersNamesArr as (string | undefined)[]).indexOf(lastFoundValidLetter)
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
  const modulatedSimpleIntervalClass = absoluteModulo(simpleIntervalClass, 7)
  const alterationName = alterationValueToName(alteration)
  let simpleIntervalClassName: string
  if (modulatedSimpleIntervalClass > 0) { simpleIntervalClassName = `${modulatedSimpleIntervalClass + 1}` }
  else if (modulatedSimpleIntervalClass === 0) { simpleIntervalClassName = '1' }
  else { simpleIntervalClassName = `${-1 * modulatedSimpleIntervalClass + 1}` }
  return `${alterationName}${simpleIntervalClassName}`
}

export function simpleIntervalNameToValue (name: SimpleIntervalName): SimpleIntervalValue | undefined {
  const nameChars = name.split('')
  const simpleIntervalClassNameChars = nameChars.filter(char => char === '-' || !Number.isNaN(parseInt(char)))
  let parsedSimpleIntervalClassValue = parseInt(simpleIntervalClassNameChars.join(''))
  if (!Number.isInteger(parsedSimpleIntervalClassValue)) return undefined
  if (parsedSimpleIntervalClassValue >= 1) { parsedSimpleIntervalClassValue -= 1 }
  else if (parsedSimpleIntervalClassValue <= -1) { parsedSimpleIntervalClassValue += 1 }
  const modulatedSimpleIntervalClass = absoluteModulo(parsedSimpleIntervalClassValue, 7)  
  const simpleIntervalClass = Math.abs(modulatedSimpleIntervalClass > 0
    ? modulatedSimpleIntervalClass
    : -1 * modulatedSimpleIntervalClass
  )
  const alteration = alterationNameToValue(name)
  return { simpleIntervalClass, alteration }
}

export const simpleIntervalSemitonesValuesArr = [0, 2, 4, 5, 7, 9, 11]

export function simpleIntervalInvert (value: SimpleIntervalValue): SimpleIntervalValue {
  const { simpleIntervalClass: _simpleIntervalClass, alteration } = value
  const simpleIntervalClass = absoluteModulo(_simpleIntervalClass, 7)
  const invertedSimpleIntervalClass = absoluteModulo(7 - simpleIntervalClass, 7)
  const simpleIntervalClassSemitoneValue = simpleIntervalSemitonesValuesArr[simpleIntervalClass]
  const invertedSimpleIntervalClassSemitoneValue = simpleIntervalSemitonesValuesArr[invertedSimpleIntervalClass]
  const modulateedSemitonesSum = absoluteModulo(simpleIntervalClassSemitoneValue + invertedSimpleIntervalClassSemitoneValue, 12)
  return {
    simpleIntervalClass: invertedSimpleIntervalClass,
    alteration: - 1 * modulateedSemitonesSum - alteration
  }
}

export function simpleIntervalToInterval (
  simpleInterval: SimpleIntervalValue,
  octave: OctaveValue = 0
): IntervalValue {
  const { simpleIntervalClass, alteration } = simpleInterval
  return {
    intervalClass: simpleIntervalClass + 7 * octave,
    alteration
  }
}

export function simpleIntervalToSemitones (value: SimpleIntervalValue): number {
  const { simpleIntervalClass, alteration } = value
  const motulatedSimpleIntervalClass = absoluteModulo(simpleIntervalClass, 7)
  const simpleIntervalClassAsSemitones = simpleIntervalSemitonesValuesArr[motulatedSimpleIntervalClass]
  return simpleIntervalClassAsSemitones + alteration
}

export function simpleIntervalFromPitchClasses (
  pitchClassA: PitchClassValue,
  pitchClassB: PitchClassValue): SimpleIntervalValue {
  const { pitchClassLetter: _pitchClassLetterA, alteration: alterationA } = pitchClassA
  const { pitchClassLetter: _pitchClassLetterB, alteration: alterationB } = pitchClassB
  const pitchClassLetterA = absoluteModulo(_pitchClassLetterA, 7)
  const pitchClassLetterB = absoluteModulo(_pitchClassLetterB, 7)
  const simpleIntervalClass = absoluteModulo(pitchClassLetterB - pitchClassLetterA, 7)
  const pitchClassLetterAAsSemitones = simpleIntervalSemitonesValuesArr[pitchClassLetterA]
  const pitchClassLetterBAsSemitones = simpleIntervalSemitonesValuesArr[pitchClassLetterB]
  let pitchClassLettersIntervalAsSemitone = pitchClassLetterBAsSemitones - pitchClassLetterAAsSemitones
  if (pitchClassLettersIntervalAsSemitone < 0) { pitchClassLettersIntervalAsSemitone *= -1 }
  const simpleIntervalClassAsSemitones = simpleIntervalToSemitones({ simpleIntervalClass, alteration: 0 })
  const pitchClassLetterAAsSemitonesFromC = pitchClassLettersSemitonesFromCArr[pitchClassLetterA]
  const pitchClassLetterBAsSemitonesFromC = pitchClassLettersSemitonesFromCArr[pitchClassLetterB]
  const semitonesBetweenPitchClassLetters = absoluteModulo(pitchClassLetterBAsSemitonesFromC - pitchClassLetterAAsSemitonesFromC, 12)
  const alteration = (semitonesBetweenPitchClassLetters - simpleIntervalClassAsSemitones)
    + (alterationB - alterationA)
  return { simpleIntervalClass, alteration }
}

export function simpleIntervalAddToPitchClass (
  simpleInterval: SimpleIntervalValue,
  pitchClass: PitchClassValue
): PitchClassValue | undefined {
  const { simpleIntervalClass } = simpleInterval
  const {
    pitchClassLetter,
    alteration: pitchClassAlteration
  } = pitchClass
  const newPitchClassLetterPosition = absoluteModulo(pitchClassLetter + simpleIntervalClass, 7)
  const newPitchClassLetterName = pitchClassLettersNamesArr[newPitchClassLetterPosition]
  const newPitchClassLetter = pitchClassLetterNameToValue(newPitchClassLetterName)
  if (newPitchClassLetter === undefined) return
  const simpleIntervalAsSemitones = simpleIntervalToSemitones(simpleInterval)
  const semitonesBetweenPitchLetters = simpleIntervalToSemitones(
    simpleIntervalFromPitchClasses(
      { pitchClassLetter, alteration: 0 },
      { pitchClassLetter: newPitchClassLetter, alteration: 0 }
    )
  )
  const semitonesDifference = simpleIntervalAsSemitones - semitonesBetweenPitchLetters
  return {
    alteration: semitonesDifference + pitchClassAlteration,
    pitchClassLetter: newPitchClassLetter
  }
}

export function simpleIntervalSubtractToPitchClass (
  simpleInterval: SimpleIntervalValue,
  pitchClass: PitchClassValue
): PitchClassValue | undefined {
  const invertedSimpleInterval = simpleIntervalInvert(simpleInterval)
  return simpleIntervalAddToPitchClass(
    invertedSimpleInterval,
    pitchClass
  )
}

export function simpleIntervalFromSimpleIntervals (
  simpleIntervalA: SimpleIntervalValue,
  simpleIntervalB: SimpleIntervalValue
): SimpleIntervalValue | undefined {
  const pretextPitchClass = pitchClassNameToValue('c')
  if (pretextPitchClass === undefined) return undefined
  const pretextPlusB = simpleIntervalAddToPitchClass(simpleIntervalB, pretextPitchClass)
  if (pretextPlusB === undefined) return undefined
  const pretextPlusBMinusA = simpleIntervalSubtractToPitchClass(simpleIntervalA, pretextPlusB)
  if (pretextPlusBMinusA === undefined) return undefined
  return simpleIntervalFromPitchClasses(pretextPitchClass, pretextPlusBMinusA)
}

/* Interval */

export type IntervalClassValue = number
export type IntervalValue = {
  intervalClass: IntervalClassValue
  alteration: AlterationValue
}
export type IntervalName = string

export function intervalValueToName (value: IntervalValue): IntervalName {
  const { intervalClass, alteration } = value
  const alterationName = alterationValueToName(alteration)
  let intervalClassName: string
  if (intervalClass > 0) { intervalClassName = `${intervalClass + 1}` }
  else if (intervalClass === 0) { intervalClassName = '1' }
  else { intervalClassName = `${intervalClass - 1}` }
  return `${alterationName}${intervalClassName}`
}

export function intervalNameToValue (name: IntervalName): IntervalValue | undefined {
  const nameChars = name.split('')
  const intervalClassNameChars = nameChars.filter(char => char === '-' || !Number.isNaN(parseInt(char)))
  let parsedIntervalClassValue = parseInt(intervalClassNameChars.join(''))
  if (!Number.isInteger(parsedIntervalClassValue)) return undefined
  if (parsedIntervalClassValue >= 1) { parsedIntervalClassValue -= 1 }
  else if (parsedIntervalClassValue <= -1) { parsedIntervalClassValue += 1 }
  const alteration = alterationNameToValue(name)
  return {
    intervalClass: parsedIntervalClassValue,
    alteration
  }
}

export function intervalToSimpleInterval (value: IntervalValue): SimpleIntervalValue {
  const { intervalClass, alteration } = value
  const simpleIntervalClass = absoluteModulo(intervalClass, 7)
  return { simpleIntervalClass, alteration }
}

export function intervalToSemitones (value: IntervalValue): number {
  const { intervalClass } = value
  const simpleInterval = intervalToSimpleInterval(value)
  const simpleIntervalAsSemitones = simpleIntervalToSemitones(simpleInterval)
  const octaves = Math.floor(intervalClass / 7)
  return 12 * octaves + simpleIntervalAsSemitones
}

export function intervalFromPitches (
  pitchA: PitchValue,
  pitchB: PitchValue): IntervalValue | undefined {
  const { pitchClass: pitchClassA, octave: octaveA } = pitchA
  const { pitchClass: pitchClassB, octave: octaveB } = pitchB
  const simpleIntervalBetweenPitches = simpleIntervalFromPitchClasses(pitchClassA, pitchClassB)
  const { simpleIntervalClass, alteration } = simpleIntervalBetweenPitches
  const pitchClassBIsOnNextOctave = pitchClassB.pitchClassLetter < pitchClassA.pitchClassLetter
  let octavesDiff = octaveB - octaveA
  if (pitchClassBIsOnNextOctave) { octavesDiff -= 1 }
  return {
    intervalClass: simpleIntervalClass + 7 * octavesDiff,
    alteration: alteration
  }
}

export function intervalAddToPitch (
  interval: IntervalValue,
  pitch: PitchValue): PitchValue | undefined {
  const simpleInterval = intervalToSimpleInterval(interval)
  const { pitchClass, octave } = pitch
  const newPitchClass = simpleIntervalAddToPitchClass(simpleInterval, pitchClass)
  if (newPitchClass === undefined) return undefined
  const newPitchClassIsOnNextOctave = newPitchClass.pitchClassLetter < pitch.pitchClass.pitchClassLetter
  const intermediatePitch: PitchValue = {
    pitchClass: newPitchClass,
    octave: newPitchClassIsOnNextOctave
      ? octave + 1
      : octave
  }
  const { intervalClass } = interval
  const { simpleIntervalClass } = simpleInterval
  const octavesDiff = Math.floor((intervalClass - simpleIntervalClass) / 7)
  return {
    pitchClass: intermediatePitch.pitchClass,
    octave: intermediatePitch.octave + octavesDiff
  }
}

export function intervalInvert (interval: IntervalValue): IntervalValue | undefined {
  const pretextOriginPitch = pitchNameToValue('c^0')
  if (pretextOriginPitch === undefined) return undefined
  const pretextDestinationPitch = intervalAddToPitch(interval, pretextOriginPitch)
  if (pretextDestinationPitch === undefined) return undefined
  const invertedInterval = intervalFromPitches(pretextDestinationPitch, pretextOriginPitch)
  return invertedInterval
}

export function intervalSubtractToPitch (
  interval: IntervalValue,
  pitch: PitchValue): PitchValue | undefined {
  const invertedInterval = intervalInvert(interval)
  if (invertedInterval === undefined) return undefined
  return intervalAddToPitch(invertedInterval, pitch)
}

export function intervalFromIntervals (
  intervalA: IntervalValue,
  intervalB: IntervalValue
) {
  const pretextPitch = pitchNameToValue('c^4')
  if (pretextPitch === undefined) return undefined
  const pretextPlusB = intervalAddToPitch(intervalB, pretextPitch)
  if (pretextPlusB === undefined) return undefined
  const pretextPlusBMinusA = intervalSubtractToPitch(intervalA, pretextPlusB)
  if (pretextPlusBMinusA === undefined) return undefined
  return intervalFromPitches(pretextPitch, pretextPlusBMinusA)
}

export function intervalsSort (intervals: IntervalValue[]) {
  const sortedIntervals = intervals
    .sort((intA, intB) => {
      const { intervalClass: intervalClassA, alteration: alterationA } = intA
      const { intervalClass: intervalClassB, alteration: alterationB } = intB
      if (intervalClassA === intervalClassB) return alterationA - alterationB
      return intervalClassA - intervalClassB
    })
  return sortedIntervals
}

export function intervalsDedupe (intervals: IntervalValue[]): IntervalValue[] {
  const intervalsSemitonesMap = new Map<IntervalValue, number>(intervals.map(interval => [
    interval,
    intervalToSemitones(interval)
  ]))
  const semitonesSet = new Set(intervalsSemitonesMap.values())
  const semitonesIntervalsMap = new Map<number, IntervalValue[]>([...semitonesSet.values()]
    .map(semitoneValue => {
      const intervalsForThisSemitone = [...intervalsSemitonesMap.entries()]
        .filter(([_, sem]) => (sem === semitoneValue))
        .map(([int]) => int)
      return [semitoneValue, intervalsForThisSemitone]
    })
  )
  const semitonesIntervalMap = new Map<number, IntervalValue>([...semitonesIntervalsMap.entries()]
    .map(([sem, ints]) => {
      const lesserAlterationValue = Math.min(...ints.map(({ alteration }) => Math.abs(alteration)))
      const intervalWithLesserAltValue = ints.find(interval => Math.abs(interval.alteration) === lesserAlterationValue)
      const chosenInterval = intervalWithLesserAltValue ?? ints[0] ?? {
        intervalClass: 0,
        alteration: sem
      }
      return [sem, chosenInterval]
    })
  )
  return [...semitonesIntervalMap.values()]
}

export function intervalShiftIntervalClass (interval: IntervalValue, newIntervalClass: IntervalClassValue): IntervalValue | undefined {
  const unalteredInputInterval: IntervalValue = { ...interval, alteration: 0 }
  const unalteredTargetInterval: IntervalValue = { intervalClass: newIntervalClass, alteration: 0 }
  const intervalBetweenUnalteredInputAndTarget = intervalFromIntervals(unalteredInputInterval, unalteredTargetInterval)
  if (intervalBetweenUnalteredInputAndTarget === undefined) return undefined
  const semitonesBeteenInputAndTarget = intervalToSemitones(intervalBetweenUnalteredInputAndTarget)
  return {
    intervalClass: newIntervalClass,
    alteration: interval.alteration - semitonesBeteenInputAndTarget
  }
}

export function intervalRationalize (
  interval: IntervalValue,
  forceFlatOutput: boolean = false
): IntervalValue {
  if (interval.alteration === 0) return interval
  let rationalized = interval
  const signsAreEqual = (nbr1: number, nbr2: number) => {
    if (nbr1 === 0) return true
    if (nbr1 > 0) return nbr2 >= 0
    return nbr2 <= 0
  }
  while (true) {
    if (rationalized.alteration === 0) break;
    const rationalizedOnceMore = intervalShiftIntervalClass(
      rationalized,
      interval.alteration >= 0 // technically could just check if strictly superior
        ? rationalized.intervalClass + 1
        : rationalized.intervalClass - 1
    )
    if (rationalizedOnceMore === undefined) break
    const alterationSignsAreEqual = signsAreEqual(interval.alteration, rationalizedOnceMore.alteration)
    if (!forceFlatOutput || interval.alteration <= 0) {
      if (alterationSignsAreEqual) { rationalized = rationalizedOnceMore }
      else break;
    } else {
      // interval.alteration is > 0 here
      if (alterationSignsAreEqual) { rationalized = rationalizedOnceMore }
      else {
        rationalized = rationalizedOnceMore;
        break;
      }
    }
  }
  return rationalized
}

/* Scale */

export type ScaleValue = SimpleIntervalValue[]
export type ScaleName = string

export function scaleNameToValue (name: ScaleName): ScaleValue {
  const parsedIntervalNames = name.split(',')
  const intervals = parsedIntervalNames
    .map(intervalName => simpleIntervalNameToValue(intervalName))
    .filter((int): int is SimpleIntervalValue => int !== undefined)
  return intervals
}

export function scaleValueToName (scale: ScaleValue): ScaleName {
  return scale.map(interval => simpleIntervalValueToName(interval)).join(',')
}

export function scaleReallocateIntervals (scale: ScaleValue): ScaleValue {
  const complexIntervalsScale = scale.map(simpleInterval => simpleIntervalToInterval(simpleInterval))
  const sortedDedupedComplexIntervals = intervalsSort(intervalsDedupe(complexIntervalsScale))
  const sortedDedupedIntervals = sortedDedupedComplexIntervals.map(interval => intervalToSimpleInterval(interval))
  const nbIntervals = sortedDedupedIntervals.length
  const nbIntervalsOverSeven = nbIntervals / 7
  const nbIntervalsModuloSeven = nbIntervals % 7
  const minPressureAllowed = Math.floor(nbIntervalsOverSeven)
  const maxPressureAllowed = nbIntervalsModuloSeven === 0 ? minPressureAllowed : Math.ceil(nbIntervalsOverSeven)
  const nbSlotsAtMaxPressure = nbIntervalsModuloSeven === 0 ? minPressureAllowed * 7 : nbIntervals - minPressureAllowed * 7
  const intervalClassSlots = new Array(7)
    .fill(null)
    .map((_, pos) => ({
      intervalClass: pos,
      intervals: sortedDedupedIntervals
        .filter(({ simpleIntervalClass }) => simpleIntervalClass === pos)
    }))
    .map(slot => ({
      ...slot,
      pressureForSort: slot.intervalClass === 0 && maxPressureAllowed !== 1
        ? -Infinity
        : slot.intervals.length
    }))
    .sort((slotA, slotB) => slotB.pressureForSort - slotA.pressureForSort)
    .map((slot, pos) => ({
      ...slot,
      targetPressure: pos < nbSlotsAtMaxPressure
        ? maxPressureAllowed
        : minPressureAllowed
    }))
    .sort((slotA, slotB) => slotA.intervalClass - slotB.intervalClass)

  function moveIntervalToNeighbourSlot (
    slots: typeof intervalClassSlots,
    from: number,
    toUp: boolean = true
  ): typeof intervalClassSlots {
    const sourceSlot = slots.find(slot => slot.intervalClass === from)
    const destinationSlot = slots.find(slot => slot.intervalClass === from + (toUp ? 1 : -1))
    if (sourceSlot === undefined) return slots
    if (destinationSlot === undefined) return slots
    const sourceIntervalsAsSemitones = sourceSlot.intervals.map(interval => simpleIntervalToSemitones(interval))
    const targetIntervalSemitoneValue = toUp
      ? Math.max(...sourceIntervalsAsSemitones)
      : Math.min(...sourceIntervalsAsSemitones)
    const targetInterval = sourceSlot.intervals.find(interval => simpleIntervalToSemitones(interval) === targetIntervalSemitoneValue)
    if (targetInterval === undefined) return slots
    const shiftedTargetInterval = intervalShiftIntervalClass(
      simpleIntervalToInterval(targetInterval),
      destinationSlot.intervalClass
    )
    if (shiftedTargetInterval === undefined) return slots
    destinationSlot.intervals.push(intervalToSimpleInterval(shiftedTargetInterval))
    const newSourceSlotIntervals = sourceSlot.intervals.filter(interval => interval !== targetInterval)
    sourceSlot.intervals.splice(0, Infinity, ...newSourceSlotIntervals)
    return slots
  }

  function chineseWhisperIntervalFromSlotToSlot (
    slots: typeof intervalClassSlots,
    from: number,
    to: number
  ): typeof intervalClassSlots {
    if (from === to) return slots
    const distance = Math.abs(to - from)
    for (
      let iteration = 0;
      iteration < distance;
      iteration++) {
      moveIntervalToNeighbourSlot(
        slots,
        to > from
          ? from + iteration
          : from - iteration,
        to > from
      )
    }
    return slots
  }

  for (const {
    intervalClass,
    intervals,
    targetPressure
  } of intervalClassSlots) {
    const nbToGive = intervals.length - targetPressure
    const slotsToFill = intervalClassSlots.reduce((acc, curr) => {
      if (nbToGive <= acc.length) return acc
      if (curr.targetPressure <= curr.intervals.length) return acc
      const returnCurrSlotNTimes = Math.min(
        nbToGive - acc.length,
        curr.targetPressure - curr.intervals.length
      )
      return [...acc, ...new Array(returnCurrSlotNTimes).fill(curr)]
    }, [] as typeof intervalClassSlots)
    for (const slotToFill of slotsToFill) {
      chineseWhisperIntervalFromSlotToSlot(
        intervalClassSlots,
        intervalClass,
        slotToFill.intervalClass        
      )
    }
  }
  return intervalClassSlots
    .sort((slotA, slotB) => slotA.intervalClass - slotB.intervalClass)
    .map(({ intervals }) => intervals.sort((intA, intB) => {
      return simpleIntervalToSemitones(intA)
        - simpleIntervalToSemitones(intB)
    }))
    .flat()
}

export function scaleToBinaryValue (scale: ScaleValue): string {
  const intervalsAsSemitoneValues = scale.map(interval => absoluteModulo(
    simpleIntervalToSemitones(interval),
    12
  ))
  const binArray = new Array(12)
    .fill(null)
    .map((_, pos) => intervalsAsSemitoneValues.includes(pos) ? 1 : 0)
    .reverse()
  const binStr = binArray.join('')
  return binStr
}

export function scaleBinaryValueToValue (binaryValue: ReturnType<typeof scaleToBinaryValue>): ScaleValue {
  return scaleReallocateIntervals(binaryValue
    .split('')
    .reverse()
    .map((bit, pos) => {
      if (bit === '1') return intervalToSimpleInterval(
        intervalRationalize({
          intervalClass: 0,
          alteration: pos
        }, true)
      )
    })
    .filter((item): item is SimpleIntervalValue => item !== undefined)
  )
}

export function scaleToDecimalValue (scale: ScaleValue): number {
  return parseInt(scaleToBinaryValue(scale), 2)
}

export function scaleDecimalValueToValue (decimalValue: ReturnType<typeof scaleToDecimalValue>): ScaleValue {
  return scaleBinaryValueToValue(decimalValue.toString(2))
}

export function scaleToPatternValue (scale: ScaleValue): string {
  return scaleToBinaryValue(scale)
    .split('')
    .reverse()
    .join('')
    .replaceAll('1', 'x')
    .replaceAll('0', '-')
}

export function scalePatternValueToValue (pattern: ReturnType<typeof scaleToPatternValue>): ScaleValue {
  return scaleBinaryValueToValue(pattern
    .split('')
    .reverse()
    .join('')
    .replaceAll('x', '1')
    .replaceAll('-', '0')
  )
}

export function scaleToRotations (scale: ScaleValue): ScaleValue[] {
  const scalePattern = scaleToPatternValue(scale)
  return new Array(12)
    .fill(null)
    .map((_, rotationPos) => {
      try {
        const pretextPitchClass = pitchClassNameToValue('c')
        if (pretextPitchClass === undefined) throw new Error('This should normally never happen.')
        const rotationPosAsInterval = intervalToSimpleInterval(
          intervalRationalize({
            intervalClass: 0,
            alteration: -1 * rotationPos
          }, true)
        )
        return intervalsSort(scale.map(interval => {
          const pretextPitchPlusThisInterval = simpleIntervalAddToPitchClass(interval, pretextPitchClass)
          if (pretextPitchPlusThisInterval === undefined) throw new Error('This should normally never happen.')
          const pretextPitchPlusRotationInterval = simpleIntervalAddToPitchClass(rotationPosAsInterval, pretextPitchPlusThisInterval)
          if (pretextPitchPlusRotationInterval === undefined) throw new Error('This should normally never happen.')
          const outputInterval = simpleIntervalFromPitchClasses(pretextPitchClass, pretextPitchPlusRotationInterval)
          return simpleIntervalToInterval(outputInterval)
        })).map(interval => intervalToSimpleInterval(interval))
      } catch (err) {
        // This is a less clean way for obtaining the rotation
        const patternBeginning = scalePattern.slice(0, rotationPos)
        const patternEnd = scalePattern.slice(rotationPos)
        const thisRotationPattern = `${patternEnd}${patternBeginning}`
        const rotatedScale = scalePatternValueToValue(thisRotationPattern)
        return rotatedScale
      }
    })
}

export function scaleToRotationalSymmetryAxes (scale: ScaleValue): number[] {
  const scalePattern = scaleToPatternValue(scale)
  const rotations = scaleToRotations(scale)
  return rotations
    .map(rotation => scaleToPatternValue(rotation))
    .map((rotationPattern, rotationPos) => rotationPattern === scalePattern ? rotationPos : undefined)
    .filter((elt): elt is number => elt !== undefined)
}

export function scaleToModes (scale: ScaleValue): ScaleValue[] {
  const rotations = scaleToRotations(scale)
  return rotations.filter(scale => scaleToDecimalValue(scale) % 2 !== 0)
}

export function scaleToReflections (scale: ScaleValue): ScaleValue[] {
  const rotations = scaleToRotations(scale)
  return rotations.map(rotation => {
    const patternArr = scaleToPatternValue(rotation).split('')
    const rotatedPattern = [patternArr[0], ...patternArr.slice(1).reverse()].join('')
    const reflected = scalePatternValueToValue(rotatedPattern)
    return reflected
  })
}

export function scaleToReflectionSymmetryAxes (scale: ScaleValue): number[] {
  const scalePattern = scaleToPatternValue(scale)
  const reflections = scaleToReflections(scale)
  return reflections
    .map(reflection => scaleToPatternValue(reflection))
    .map((reflectionPattern, reflectionPos) => reflectionPattern === scalePattern ? reflectionPos : undefined)
    .filter((elt): elt is number => elt !== undefined)
}

export function scaleToNegative (scale: ScaleValue): ScaleValue {
  const scalePattern = scaleToPatternValue(scale)
  const negatedPattern = scalePattern
    .replaceAll('x', 'y')
    .replaceAll('-', 'x')
    .replaceAll('y', '-')
  return scalePatternValueToValue(negatedPattern)
}

export function scaleToSupersets (scale: ScaleValue): ScaleValue[] {
  const pattern = scaleToPatternValue(scale)
  const nbOfSupersets = parseInt(
    pattern
      .replaceAll('x', '')
      .replaceAll('-', '1'),
    2) || 0
  return new Array(nbOfSupersets)
    .fill(null)
    .map((_, _supersetPos) => {
      const supersetPos = _supersetPos + 1
      const supersetBinaryAdditions = supersetPos.toString(2)
      const supersetPatternAdditions = supersetBinaryAdditions
        .split('')
        .reverse()
        .join('')
        .replaceAll('1', 'x')
        .replaceAll('0', '-')
      const supersetPattern = supersetPatternAdditions
        .split('')
        .reduce((acc, curr) => acc.replace('-', curr === 'x' ? 'x' : 'y'), pattern)
        .replaceAll('y', '-')
      const superset = scalePatternValueToValue(supersetPattern)
      return superset
    })
}

export function scaleToSubsets (scale: ScaleValue): ScaleValue[] {
  const pattern = scaleToPatternValue(scale)
  const nbOfSubsets = parseInt(
    pattern
      .replaceAll('-', '')
      .replaceAll('x', '1'),
    2) || 0
  return new Array(nbOfSubsets)
    .fill(null)
    .map((_, _subsetPos) => {
      const subsetPos = _subsetPos + 1
      const subsetBinaryDeletions = subsetPos.toString(2)
      const subsetPatternDeletions = subsetBinaryDeletions
        .split('')
        .reverse()
        .join('')
        .replaceAll('1', 'x')
        .replaceAll('0', '-')
      const subsetPattern = subsetPatternDeletions
        .split('')
        .reduce((acc, curr) => acc.replace('x', curr === 'x' ? '-' : 'y'), pattern)
        .replaceAll('y', 'x')
      const subset = scalePatternValueToValue(subsetPattern)
      return subset
    })
}

console.log(
  scaleToSubsets(
    scalePatternValueToValue('xxxxxxxxxxxx')
  )
  .map(e => scaleToPatternValue(e))
  .join('\n')
)

// CHORD NAME
// COMMON NAMES

// intervalPattern
// semitonesPattern
// maxInterval
// triads
// gender
// distanceTo
// scalesAt
// hemitones
// hemitonesPosition
// tritones
// tritonesPosition
// cohemitones
// cohemitonesPosition
// imperfections
// imperfectionsPosition
// stepsWithXabove
// stepsWithXabovePosition
// stepsWithXbelow
// stepsWithXbelowPosition
// isSupersetOf
// isSubsetOf
// primeForm
// rotationsToPrimeForm
// isPalindromic
// isChiral
// isBalanced
// intervalSpectrum
// merge
// subtract
// rotate
// reflect
// modulate
// negate
// becomePrime
// * DISTRIBUTION SPECTRA [WIP]
// * SPECTRUM VARIATION [WIP]
// * IS EQUAL [WIP]
// * IS MAXIMALLY EVEN [WIP]
// * HAS MYHILL'S PROPERTY [WIP]
// * IS PROPER (IS COHERENT) [WIP]
// * IS DEEP [WIP]
// * FORTE NUMBER [WIP]
