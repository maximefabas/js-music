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

export function scaleDistanceFromScale (scaleA: ScaleValue, scaleB: ScaleValue): number {
  const aBits = scaleToBinaryValue(scaleA).split('').map(bit => parseInt(bit, 10))
  const bBits = scaleToBinaryValue(scaleB).split('').map(bit => parseInt(bit, 10))
  const moves = aBits.map((bit, i) => bit - bBits[i])
    .filter(bit => bit)
  const positiveMoves = moves.filter(bit => bit === 1)
  const negativeMoves = moves.filter(bit => bit === -1)
  return Math.max(positiveMoves.length, negativeMoves.length)
}

export function scaleHasIntervalClass (scale: ScaleValue, _intervalClass: number|number[]) {
  const intervalClasses = Array.isArray(_intervalClass) ? _intervalClass : [_intervalClass]
  const intervalClassesInScale = new Set(scale.map(int => int.simpleIntervalClass))
  return intervalClasses.every(intClass => intervalClassesInScale.has(intClass))
}

export function scaleToChordQuality (scale: ScaleValue): string {
  const namedIntervals = scale.map(int => simpleIntervalValueToName(int))
  const hasMajorThird = namedIntervals.includes('3')
  const hasMinorThird = namedIntervals.includes('ß3')
  const hasAnyThird = namedIntervals.some(int => int.match(/3/igm))
  const isMajor = hasMajorThird
  const isMinor = !isMajor && hasMinorThird
  const hasPerfectFifth = namedIntervals.includes('5')
  const hasDiminishedFifth = namedIntervals.includes('ß5')
  const hasAugmentedFifth = namedIntervals.includes('#5')
  const hasAnyFifth = namedIntervals.some(int => int.match(/5/igm))
  const hasMajorSeventh = namedIntervals.includes('7')
  const hasMinorSeventh = namedIntervals.includes('ß7')
  const hasDiminishedSeventh = namedIntervals.includes('ßß7')
  const hasMajorNinth = namedIntervals.includes('2')
  const hasMinorNinth = namedIntervals.includes('ß2')
  const hasPerfectEleventh = namedIntervals.includes('4')
  const hasAugmentedEleventh = namedIntervals.includes('#4')
  const hasMajorThirteenth = namedIntervals.includes('6')
  const hasMinorThirteenth = namedIntervals.includes('ß6')
  const hasExtensionsBelowThirteenth = hasMinorSeventh
    || hasMajorSeventh
    || hasMinorNinth
    || hasMajorNinth
    || hasPerfectEleventh
    || hasAugmentedEleventh
  const hasExtensionsBelowEleventh = hasMinorSeventh
    || hasMajorSeventh
    || hasMinorNinth
    || hasMajorNinth
  const hasExtensionsBelowNinth = hasMinorSeventh || hasMajorSeventh

  type S = string[]
  const nameObj = {
    mainQuality: '',
    hasMinorQuality: false,
    accidents: new Array(7).fill(null).map(_ => ([] as S)) as [S, S, S, S, S, S, S],
    omissions: new Array(7).fill(null).map(_ => ([] as S)) as [S, S, S, S, S, S, S],
    additions: new Array(7).fill(null).map(_ => ([] as S)) as [S, S, S, S, S, S, S],
    leftovers: namedIntervals
  }

  const isDim = !hasMajorThird
    && hasMinorThird
    && !hasPerfectFifth
    && hasDiminishedFifth

  const isAug = !isDim
    && !hasPerfectFifth
    && hasMajorThird
    && hasAugmentedFifth

  const handleEleventhsWhenExpected = (
    hasPerfectEleventh: boolean,
    hasAugmentedEleventh: boolean
  ) => {
    if (hasPerfectEleventh && hasAugmentedEleventh) {
      nameObj.additions[3].push('#11')
      nameObj.leftovers = nameObj.leftovers.filter(i => !['4', '#4'].includes(i))
    } else if (hasPerfectEleventh) {
      nameObj.leftovers = nameObj.leftovers.filter(i => !['4'].includes(i))
    } else if (hasAugmentedEleventh) {
      nameObj.accidents[3].push('#11')
      nameObj.leftovers = nameObj.leftovers.filter(i => !['#4'].includes(i))
    } else {
      nameObj.omissions[3].push('11')
    }
  }

  const handleNinthsWhenExpected = (
    hasMajorNinth: boolean,
    hasMinorNinth: boolean
  ) => {
    if (hasMajorNinth && hasMinorNinth) {
      nameObj.additions[1].push('ß9')
      nameObj.leftovers = nameObj.leftovers.filter(i => !['2', 'ß2'].includes(i))
    } else if (hasMajorNinth) {
      nameObj.leftovers = nameObj.leftovers.filter(i => !['2'].includes(i))
    } else if (hasMinorNinth) {
      nameObj.accidents[1].push('ß9')
      nameObj.leftovers = nameObj.leftovers.filter(i => !['ß2'].includes(i))
    } else {
      nameObj.omissions[1].push('9')
    }
  }

  const handleSeventhsWhenExpected = (
    hasMajorSeventh: boolean,
    hasMinorSeventh: boolean
  ) => {
    if (hasMajorSeventh && hasMinorSeventh) {
      nameObj.additions[6].push('7')
      nameObj.leftovers = nameObj.leftovers.filter(i => !['7', 'ß7'].includes(i))
    } else if (hasMajorSeventh || hasMinorSeventh) {
      nameObj.leftovers = nameObj.leftovers.filter(i => !['7', 'ß7'].includes(i))
    } else {
      nameObj.omissions[6].push('7')
    }
  }

  const handleFifthsWhenExpected = (
    hasPerfectFifth: boolean,
    hasAnyFifth: boolean
  ) => {
    if (hasPerfectFifth) {
      nameObj.leftovers = nameObj.leftovers.filter(i => !['5'].includes(i))
    } else if (hasAnyFifth) {
      const fifths = nameObj.leftovers.filter(int => int.match(/5/igm))
      const [accFifth, ...addFifths] = fifths
      nameObj.accidents[4].push(accFifth)
      nameObj.additions[4].push(...addFifths)
      nameObj.leftovers = nameObj.leftovers.filter(int => !fifths.includes(int))
    } else {
      nameObj.omissions[4].push('5')
    }
  }

  const handleThirdsWhenExpected = (
    isMajor: boolean,
    isMinor: boolean,
    hasAnyThird: boolean
  ) => {
    if (isMajor) {
      nameObj.leftovers = nameObj.leftovers.filter(i => !['3'].includes(i))
    } else if (isMinor) {
      nameObj.hasMinorQuality = true
      nameObj.leftovers = nameObj.leftovers.filter(i => !['ß3'].includes(i))
    } else if (hasAnyThird) {
      const thirds = nameObj.leftovers.filter(int => int.match(/3/igm))
      const [accThird, ...addThirds] = thirds
      nameObj.accidents[2].push(accThird)
      nameObj.additions[2].push(...addThirds)
      nameObj.leftovers = nameObj.leftovers.filter(int => !thirds.includes(int))
    } else {
      nameObj.omissions[2].push('3')
    }
  }

  // Diminished
  if (isDim) {
    nameObj.mainQuality = 'dim'
    nameObj.leftovers = nameObj.leftovers.filter(i => !['ß3', 'ß5'].includes(i))
    
    // dim + 13th
    if (hasMajorThirteenth) {
      nameObj.mainQuality = '6'
      nameObj.hasMinorQuality = true
      nameObj.accidents[4].push('ß5')
      nameObj.leftovers = nameObj.leftovers.filter(i => !['6'].includes(i))
      if (hasExtensionsBelowThirteenth) {
        nameObj.mainQuality = '13'
        // M
        if (hasMajorSeventh && !hasMinorSeventh) {
          nameObj.mainQuality = 'M13'
          nameObj.leftovers = nameObj.leftovers.filter(i => !['7'].includes(i))
        }
        // 11th
        handleEleventhsWhenExpected(hasPerfectEleventh, hasAugmentedEleventh)
        // 9th
        handleNinthsWhenExpected(hasMajorNinth, hasMinorNinth)
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
      }
    
    // dim + ß13th
    } else if (hasMinorThirteenth) {
      nameObj.mainQuality = 'ß6'
      nameObj.hasMinorQuality = true
      nameObj.accidents[4].push('ß5')
      nameObj.leftovers = nameObj.leftovers.filter(i => !['ß6'].includes(i))
      if (hasExtensionsBelowThirteenth) {
        nameObj.mainQuality = 'ß13'
        // M
        if (hasMajorSeventh && !hasMinorSeventh) {
          nameObj.mainQuality = 'Mß13'
          nameObj.leftovers = nameObj.leftovers.filter(i => !['7'].includes(i))
        }
        // 11th
        handleEleventhsWhenExpected(hasPerfectEleventh, hasAugmentedEleventh)
        // 9th
        handleNinthsWhenExpected(hasMajorNinth, hasMinorNinth)
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
      }

    // dim + 11th
    } else if (hasPerfectEleventh) {
      nameObj.mainQuality = '11'
      nameObj.hasMinorQuality = true
      nameObj.accidents[4].push('ß5')
      nameObj.leftovers = nameObj.leftovers.filter(i => !['4'].includes(i))
      // M
      if (hasMajorSeventh && !hasMinorSeventh) {
        nameObj.mainQuality = 'M11'
        nameObj.leftovers = nameObj.leftovers.filter(i => !['7'].includes(i))
      }
      // 9th
      handleNinthsWhenExpected(hasMajorNinth, hasMinorNinth)
      // 7th
      handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)

    // dim + #11th
    } else if (hasPerfectEleventh) {
      nameObj.mainQuality = '#11'
      nameObj.hasMinorQuality = true
      nameObj.accidents[4].push('ß5')
      nameObj.leftovers = nameObj.leftovers.filter(i => !['#4'].includes(i))
      // M
      if (hasMajorSeventh && !hasMinorSeventh) {
        nameObj.mainQuality = 'M#11'
        nameObj.leftovers = nameObj.leftovers.filter(i => !['7'].includes(i))
      }
      // 9th
      handleNinthsWhenExpected(hasMajorNinth, hasMinorNinth)
      // 7th
      handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
      
    // dim + 9th
    } else if (hasMajorNinth) {
      nameObj.mainQuality = '9'
      nameObj.hasMinorQuality = true
      nameObj.accidents[4].push('ß5')
      nameObj.leftovers = nameObj.leftovers.filter(i => !['2'].includes(i))
      // M
      if (hasMajorSeventh && !hasMinorSeventh) {
        nameObj.mainQuality = 'M9'
        nameObj.leftovers = nameObj.leftovers.filter(i => !['7'].includes(i))
      }
      // 7th
      handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
    
    // dim + ß9th
    } else if (hasMinorNinth) {
      nameObj.mainQuality = 'ß9'
      nameObj.hasMinorQuality = true
      nameObj.accidents[4].push('ß5')
      nameObj.leftovers = nameObj.leftovers.filter(i => !['ß2'].includes(i))
      // M
      if (hasMajorSeventh && !hasMinorSeventh) {
        nameObj.mainQuality = 'Mß9'
        nameObj.leftovers = nameObj.leftovers.filter(i => !['7'].includes(i))
      }
      // 7th
      handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)

    // dim + ßß7th
    } else if (hasDiminishedSeventh) {
      nameObj.mainQuality = 'dim7'
      nameObj.leftovers = nameObj.leftovers.filter(i => !['ßß7'].includes(i))
    
    // dim + ß7th
    } else if (hasMinorSeventh) {
      nameObj.mainQuality = '7'
      nameObj.hasMinorQuality = true
      nameObj.accidents[4].push('ß5')
      nameObj.leftovers = nameObj.leftovers.filter(i => !['ß7'].includes(i))
    
    // dim + 7th
    } else if (hasMajorSeventh) {
      nameObj.mainQuality = 'M7'
      nameObj.hasMinorQuality = true
      nameObj.accidents[4].push('ß5')
      nameObj.leftovers = nameObj.leftovers.filter(i => !['7'].includes(i))
    }
  
  // Augmented
  } else if (isAug) {
    nameObj.mainQuality = 'aug'
    nameObj.leftovers = nameObj.leftovers.filter(i => !['3', '#5'].includes(i))

    // aug + 13th
    if (hasMajorThirteenth) {
      nameObj.mainQuality = '6'
      nameObj.accidents[4].push('#5')
      nameObj.leftovers = nameObj.leftovers.filter(i => !['6'].includes(i))
      if (hasExtensionsBelowThirteenth) {
        nameObj.mainQuality = '13#5'
        // M
        if (hasMajorSeventh && !hasMinorSeventh) {
          nameObj.mainQuality = 'M13#5'
          nameObj.leftovers = nameObj.leftovers.filter(i => !['7'].includes(i))
        }
        // 11th
        handleEleventhsWhenExpected(hasPerfectEleventh, hasAugmentedEleventh)
        // 9th
        handleNinthsWhenExpected(hasMajorNinth, hasMinorNinth)
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
      }
    
    // aug + ß13th
    } else if (hasMinorThirteenth) {
      nameObj.mainQuality = 'ß6'
      nameObj.accidents[4].push('#5')
      nameObj.leftovers = nameObj.leftovers.filter(i => !['ß6'].includes(i))
      if (hasExtensionsBelowThirteenth) {
        nameObj.mainQuality = 'ß13'
        // M
        if (hasMajorSeventh && !hasMinorSeventh) {
          nameObj.mainQuality = 'Mß13'
          nameObj.leftovers = nameObj.leftovers.filter(i => !['7'].includes(i))
        }
        // 11th
        handleEleventhsWhenExpected(hasPerfectEleventh, hasAugmentedEleventh)
        // 9th
        handleNinthsWhenExpected(hasMajorNinth, hasMinorNinth)
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
      }

    // aug + 11th
    } else if (hasPerfectEleventh) {
      nameObj.mainQuality = '11'
      nameObj.accidents[4].push('#5')
      nameObj.leftovers = nameObj.leftovers.filter(i => !['4'].includes(i))
      // M
      if (hasMajorSeventh && !hasMinorSeventh) {
        nameObj.mainQuality = 'M11'
        nameObj.leftovers = nameObj.leftovers.filter(i => !['7'].includes(i))
      }
      // 9th
      handleNinthsWhenExpected(hasMajorNinth, hasMinorNinth)
      // 7th
      handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)

    // aug + #11th
    } else if (hasPerfectEleventh) {
      nameObj.mainQuality = '#11'
      nameObj.accidents[4].push('#5')
      nameObj.leftovers = nameObj.leftovers.filter(i => !['#4'].includes(i))
      // M
      if (hasMajorSeventh && !hasMinorSeventh) {
        nameObj.mainQuality = 'M#11'
        nameObj.leftovers = nameObj.leftovers.filter(i => !['7'].includes(i))
      }
      // 9th
      handleNinthsWhenExpected(hasMajorNinth, hasMinorNinth)
      // 7th
      handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
      
    // aug + 9th
    } else if (hasMajorNinth) {
      nameObj.mainQuality = '9'
      nameObj.accidents[4].push('#5')
      nameObj.leftovers = nameObj.leftovers.filter(i => !['2'].includes(i))
      // M
      if (hasMajorSeventh && !hasMinorSeventh) {
        nameObj.mainQuality = 'M9'
        nameObj.leftovers = nameObj.leftovers.filter(i => !['7'].includes(i))
      }
      // 7th
      handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
    
    // aug + ß9th
    } else if (hasMinorNinth) {
      nameObj.mainQuality = 'ß9'
      nameObj.accidents[4].push('#5')
      nameObj.leftovers = nameObj.leftovers.filter(i => !['ß2'].includes(i))
      // M
      if (hasMajorSeventh && !hasMinorSeventh) {
        nameObj.mainQuality = 'Mß9'
        nameObj.leftovers = nameObj.leftovers.filter(i => !['7'].includes(i))
      }
      // 7th
      handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)

    // aug + ß7th
    } else if (hasMinorSeventh) {
      nameObj.mainQuality = 'aug7'
      nameObj.leftovers = nameObj.leftovers.filter(i => !['ß7'].includes(i))
    
    // aug + 7th
    } else if (hasMajorSeventh) {
      nameObj.mainQuality = 'augM7'
      nameObj.leftovers = nameObj.leftovers.filter(i => !['7'].includes(i))
    
    // aug + ßß7th
    } else if (hasDiminishedSeventh) {
      nameObj.mainQuality = 'augßß7'
      nameObj.leftovers = nameObj.leftovers.filter(i => !['ßß7'].includes(i))
    }

  // Not diminished nor augmented
  } else {

    // 13th
    if (hasMajorThirteenth) {
      nameObj.mainQuality = '6'
      nameObj.leftovers = nameObj.leftovers.filter(i => !['6'].includes(i))
      if (hasExtensionsBelowThirteenth) {
        nameObj.mainQuality = '13'
        nameObj.accidents[4].push('#5')
        nameObj.leftovers = nameObj.leftovers.filter(i => !['6'].includes(i))
        if (hasExtensionsBelowThirteenth) {
          nameObj.mainQuality = '13#5'
          // M
          if (hasMajorSeventh && !hasMinorSeventh) {
            nameObj.mainQuality = 'M13#5'
            nameObj.leftovers = nameObj.leftovers.filter(i => !['7'].includes(i))
          }
          // 11th
          handleEleventhsWhenExpected(hasPerfectEleventh, hasAugmentedEleventh)
          // 9th
          handleNinthsWhenExpected(hasMajorNinth, hasMinorNinth)
          // 7th
          handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
        }  
      }
      // 5th
      handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
      // 3rd
      handleThirdsWhenExpected(isMajor, isMinor, hasAnyThird)

    // ß13
    } else if (hasMinorThirteenth) {
    // 11
    } else if (hasPerfectEleventh) {
    // #11
    } else if (hasAugmentedEleventh) {
    // 9
    } else if (hasMajorNinth) {
    // ß9
    } else if (hasMinorNinth) {
    // 7
    } else if (hasMinorSeventh) {
    // M7
    } else if (hasMajorSeventh) {
    // No extension
    } else {

    }
  }

//////////    reg    Not dim nor aug => major
//////////    
//////////      13     Has 13 => 6
//////////               Has 13, ß7 => 13
//////////               No ß7, Has 13, 7 => M13
//////////               No ß7, 7, Has 13, 9 | ß9 | 11 | #11 => 13
//////////    
//////////      ß13    No 13, Has ß13 => ß6
//////////               Has ß13, ß7 => ß13
//////////               No ß7, Has ß13, 7 => Mß13
//////////               No ß7, 7, Has ß13, 9 | ß9 | 11 | #11 => ß13
//////////    
//////////      11     No 13, ß13 Has 11 => 11
//////////               Has 3, 11 => 11
//////////               Has 3, 11, ß7 => 11
//////////               No ß7, Has 3, 11, 7 => M11
//////////               No ß7, 7, Has 3, 11, 9 | ß9 => 11
//////////              
//////////               No 3, Has 11 => sus4
//////////               Has 11, ß7 => 7sus4
//////////                       Has 11, ß7, 9 => 7sus24
//////////    
//////////               No ß7, Has 11, 7 => M7sus4
//////////                       Has 11, 7, 9 => M7sus24
//////////    
//////////               No ß7, 7, Has 11, 9 => sus24
//////////               No ß7, 7, 9, Has 11, ß9 => 11ß9 no(3)
//////////    
//////////      #11    No 13, ß13, 11, Has 3, #11 => #11
//////////               Has 3, #11, ß7 => #11
//////////               No ß7, Has 3, #11, 7 => M#11
//////////               No ß7, 7, Has 3, #11, 9 | ß9 => #11
//////////    
//////////      9      No 13, ß13, 11, #11, Has 9 => 9
//////////               Has 3, 9 => 9
//////////               Has 3, 9, ß7 => 9
//////////               No ß7, Has 3, 9, 7 => M9
//////////               No 3, Has 9 => sus2
//////////               Has 9, ß7 => 7sus2
//////////               No ß7, Has 9, 7 => M7sus2            
//////////    
//////////      ß9     No 13, ß13, 11, #11, 9, Has 3, ß9 => ß9
//////////               Has 3, ß9, ß7 => ß9
//////////               No ß7, Has 3, ß9, 7 => Mß9
//////////    
//////////      ß7     No 13, ß13, 11, #11, 9, ß9, Has 3, ß7 => 7
//////////    
//////////      7      No 13, ß13, 11, #11, 9, ß9, ß7, Has 3, 7 => M7

//////////    dim    No 3, 5, Has ß3, ß5 => dim
//////////    
//////////      13     Has ß3, ß5, 13 => m6ß5
//////////               Has ß3, ß5, 13, ß7 => m13ß5
//////////               No ß7, Has ß3, ß5, 13, 7 => mM13ß5
//////////               No ß7, 7, Has ß3, ß5, 9 | ß9 | 11 | #11, 13 => m13ß5
//////////            
//////////      ß13    No 13, Has ß3, ß5, ß13 => mß6ß5
//////////               Has ß3, ß5, ß7 => mß13ß5
//////////               No ß7, Has ß3, ß5, 7 =>mMß13ß5
//////////               No ß7, 7, Has ß3, ß5, 9 | ß9 | 11 | #11, ß13 => mß13ß5
//////////            
//////////      11     No 13, ß13, Has ß3, ß5, 11 => m11ß5
//////////               Has ß3, ß5, 11, ß7 => m11ß5
//////////               No ß7, Has ß3, ß5, 11, 7 => mM11ß5
//////////    
//////////      #11    No 13, ß13, 11, Has ß3, ß5, #11 => m#11ß5
//////////               Has ß3, ß5, #11, ß7 => m#11ß5
//////////               No ß7, Has ß3, ß5, #11, 7 => mM#11ß5
//////////    
//////////      9      No 13, ß13, 11, #11, Has ß3, ß5, 9 => m9ß5
//////////               Has ß3, ß5, 9, ß7 => m9ß5
//////////               No ß7, Has ß3, ß5, 9, 7 => mM9ß5
//////////    
//////////      ß9     No 13, ß13, 11, #11, 9, Has ß3, ß5, ß9 => mß9ß5
//////////               Has ß3, ß5, ß9, ß7 => mß9ß5
//////////               No ß7, Has ß3, ß5, ß9, 7 => mMß9ß5
//////////    
//////////      ßß7    No 13, ß13, 11, #11, 9, ß9, Has ß3, ß5, ßß7 => dim7
//////////    
//////////      ß7     No 13, ß13, 11, #11, 9, ß9, ßß7, Has ß3, ß5, ß7 => m7ß5
//////////    
//////////      7      No 13, ß13, 11, #11, 9, ß9, ßß7, ß7, Has ß3, ß5, 7 => mM7ß5
//////////    

//////////    aug    No 5, Has 3, #5 => aug
//////////    
//////////      13     Has 3, #5, 13 => 6#5
//////////               Has 3, #5, 13, ß7 => 13#5
//////////               No ß7, Has 3, #5, 13, 7 => M13#5
//////////               No ß7, 7, Has 3, #5, 9 | ß9 | 11 | #11, 13 => 13#5
//////////    
//////////      ß13    No 13, Has 3, #5, ß13 => ß6#5
//////////               Has 3, #5, ß13, ß7 => ß13#5
//////////               No ß7, Has 3, #5, ß13, 7 => Mß13#5
//////////               No ß7, 7, Has 3, #5, 9 | ß9 | 11 | #11, ß13 => ß13#5
//////////    
//////////      11     No 13, ß13, Has 3, #5, 11 => 11#5
//////////               Has 3, #5, 11, ß7 => 11#5
//////////               No ß7, Has 3, #5, 11, 7 => M11#5
//////////    
//////////      #11    No 13, ß13, 11, Has 3, #5, #11 => #11#5
//////////               Has 3, #5, #11, ß7 => #11#5
//////////               No ß7, Has 3, #5, #11, 7 => M#11#5
//////////    
//////////      9      No 13, ß13, 11, #11, Has 3, #5, 9 => 9#5
//////////               Has 3, #5, 9, ß7 => 9#5
//////////               No ß7, Has 3, #5, 9, 7 => M9#5
//////////    
//////////      ß9     No 13, ß13, 11, #11, 9, Has 3, #5, ß9 => ß9#5
//////////               Has 3, #5, ß9, ß7 => ß9#5
//////////               No ß7, Has 3, #5, ß9, 7 => Mß9#5
//////////    
//////////      ß7     No 13, ß13, 11, #11, 9, ß9, Has 3, #5, ß7 => aug7
//////////    
//////////      7      No 13, ß13, 11, #11, 9, ß9, ß7, Has 3, #5, 7 => augM7
//////////    
//////////      ßß7    No 13, ß13, 11, #11, 9, ß9, ß7, 7, Has 3, #5, ßß7 => augßß7
  
  // Handle 1 editions or omission
  // Handle leftovers

  console.log(nameObj)
  return ''
















  // const first = 0
  // const ninth = 1
  // const third = 2
  // const eleventh = 3
  // const fifth = 4
  // const thirteenth = 5
  // const seventh = 6

  // type IntervalInfoTable = {
  //   allIntervals: SimpleIntervalValue[]
  //   naturals: SimpleIntervalValue[]
  //   flats: SimpleIntervalValue[]
  //   sharps: SimpleIntervalValue[]
  //   mainInterval: SimpleIntervalValue | undefined
  //   namedAllIntervals: string[]
  //   namedNaturals: string[]
  //   namedFlats: string[]
  //   namedSharps: string[]
  //   namedMainInterval: string
  // }

  // function generateIntervalsTable (scale: ScaleValue): [
  //   IntervalInfoTable,
  //   IntervalInfoTable,
  //   IntervalInfoTable,
  //   IntervalInfoTable,
  //   IntervalInfoTable,
  //   IntervalInfoTable,
  //   IntervalInfoTable,
  //   string[]
  // ] {
  //   const intervalTable = new Array(7)
  //   .fill(null)
  //   .map((_, pos) => {
  //     const allIntervals = scale.filter(int => int.simpleIntervalClass === pos)
  //     const naturals = allIntervals.filter(int => int.alteration === 0)
  //     const flats = allIntervals.filter(int => int.alteration < 0)
  //     const sharps = allIntervals.filter(int => int.alteration > 0)
  //     const mainInterval = naturals.at(0) ?? flats.at(0) ?? sharps.at(0)
  //     return {
  //       allIntervals,
  //       naturals,
  //       flats,
  //       sharps,
  //       mainInterval,
  //       namedAllIntervals: allIntervals.map(int => simpleIntervalValueToName(int)),
  //       namedNaturals: naturals.map(int => simpleIntervalValueToName(int)),
  //       namedFlats: flats.map(int => simpleIntervalValueToName(int)),
  //       namedSharps: sharps.map(int => simpleIntervalValueToName(int)),
  //       namedMainInterval: mainInterval !== undefined
  //         ? simpleIntervalValueToName(mainInterval)
  //         : ''
  //     }
  //   }) as [
  //     IntervalInfoTable,
  //     IntervalInfoTable,
  //     IntervalInfoTable,
  //     IntervalInfoTable,
  //     IntervalInfoTable,
  //     IntervalInfoTable,
  //     IntervalInfoTable
  //   ]
  //   return [
  //     ...intervalTable,
  //     scale.map(int => simpleIntervalValueToName(int))
  //   ]
  // }

  // const [
  //   firsts,
  //   ninths,
  //   thirds,
  //   elevenths,
  //   fifths,
  //   thirteenths,
  //   sevenths,
  //   allNamedIntervals
  // ] = generateIntervalsTable(scale)

  // function canBeMinor (scale: ScaleValue) {
  //   const thirds = scale.filter(int => int.simpleIntervalClass === third)
  //   const hasMajorThird = thirds.filter(int => int.alteration === 0).length !== 0
  //   if (hasMajorThird) return false
  //   const hasMinorThird = thirds.filter(int => int.alteration === -1).length !== 0
  //   return hasMinorThird
  // }

  // function canBeMajor (scale: ScaleValue) {
  //   const thirds = scale.filter(int => int.simpleIntervalClass === third)
  //   const hasMajorThird = thirds.filter(int => int.alteration === 0).length !== 0
  //   return hasMajorThird
  // }

  // function canBeDiminished (scale: ScaleValue) {
  //   const hasMinorProperties = canBeMinor(scale)
  //   if (!hasMinorProperties) return false
  //   const fifths = scale.filter(int => int.simpleIntervalClass === fifth)
  //   const hasPerfectFifth = fifths.filter(int => int.alteration === 0).length !== 0
  //   if (hasPerfectFifth) return false
  //   const hasDiminishedFifth = fifths.filter(int => int.alteration === -1).length !== 0
  //   return hasDiminishedFifth
  // }

  // function canBeAugmented (scale: ScaleValue) {
  //   const hasMajorProperties = canBeMajor(scale)
  //   if (!hasMajorProperties) return false
  //   const fifths = scale.filter(int => int.simpleIntervalClass === fifth)
  //   const hasPerfectFifth = fifths.filter(int => int.alteration === 0).length !== 0
  //   if (hasPerfectFifth) return false
  //   const hasAugmentedFifth = fifths.filter(int => int.alteration === 1).length !== 0
  //   return hasAugmentedFifth
  // }

  // function canBeSuspended24 (scale: ScaleValue) {
  //   const ninths = scale.filter(int => int.simpleIntervalClass === ninth)
  //   const thirds = scale.filter(int => int.simpleIntervalClass === third)
  //   const elevenths = scale.filter(int => int.simpleIntervalClass === eleventh)
  //   const hasMajorNinth = ninths.filter(int => int.alteration === 0).length !== 0
  //   if (!hasMajorNinth) return false
  //   const hasMajorEleventh = elevenths.filter(int => int.alteration === 0).length !== 0
  //   if (!hasMajorEleventh) return false
  //   const hasThird = thirds.length !== 0
  //   return !hasThird
  // }

  // function canBeSuspended2 (scale: ScaleValue) {
  //   const ninths = scale.filter(int => int.simpleIntervalClass === ninth)
  //   const thirds = scale.filter(int => int.simpleIntervalClass === third)
  //   const hasMajorNinth = ninths.filter(int => int.alteration === 0).length !== 0
  //   if (!hasMajorNinth) return false
  //   const hasThird = thirds.length !== 0
  //   return !hasThird
  // }

  // function canBeSuspended4 (scale: ScaleValue) {
  //   const thirds = scale.filter(int => int.simpleIntervalClass === third)
  //   const elevenths = scale.filter(int => int.simpleIntervalClass === eleventh)
  //   const hasMajorEleventh = elevenths.filter(int => int.alteration === 0).length !== 0
  //   if (!hasMajorEleventh) return false
  //   const hasThird = thirds.length !== 0
  //   return !hasThird
  // }

  // function canBeDominant7 (scale: ScaleValue) {
  //   const sevenths = scale.filter(int => int.simpleIntervalClass === seventh)
  //   const hasMinorSeventh = sevenths.filter(int => int.alteration === -1).length !== 0
  //   return hasMinorSeventh
  // }

  // function canBeMajor7 (scale: ScaleValue) {
  //   const sevenths = scale.filter(int => int.simpleIntervalClass === seventh)
  //   const hasMajorSeventh = sevenths.filter(int => int.alteration === 0).length !== 0
  //   return hasMajorSeventh
  // }

  // function canBeDiminished7 (scale: ScaleValue) {
  //   const hasDiminishedProperties = canBeDiminished(scale)
  //   if (!hasDiminishedProperties) return false
  //   const hasDominant7Properties = canBeDominant7(scale)
  //   if (hasDominant7Properties) return false
  //   const hasMajor7Properties = canBeMajor7(scale)
  //   if (hasMajor7Properties) return false
  //   const sevenths = scale.filter(int => int.simpleIntervalClass === seventh)
  //   const hasDiminished7 = sevenths.filter(int => int.alteration === -2).length !== 0
  //   return hasDiminished7
  // }

  // function canBeAugmented7 (scale: ScaleValue) {
  //   const hasAugmentedProperties = canBeAugmented(scale)
  //   if (!hasAugmentedProperties) return false
  //   const hasDominant7Properties = canBeDominant7(scale)
  //   return hasDominant7Properties
  // }

  // function canBeAugmentedMajor7 (scale: ScaleValue) {
  //   const hasAugmentedProperties = canBeAugmented(scale)
  //   if (!hasAugmentedProperties) return false
  //   const hasMajor7Properties = canBeMajor7(scale)
  //   return hasMajor7Properties
  // }
  
  // function canBeNinth (scale: ScaleValue) {
  //   const ninths = scale.filter(int => int.simpleIntervalClass === ninth)
  //   const hasMajorNinth = ninths.filter(int => int.alteration === 0).length !== 0
  //   const hasMinorNinth = ninths.filter(int => int.alteration === -1).length !== 0
  //   return hasMajorNinth || hasMinorNinth
  // }

  // function canBeEleventh (scale: ScaleValue) {
  //   const elevenths = scale.filter(int => int.simpleIntervalClass === eleventh)
  //   const hasPerfectEleventh = elevenths.filter(int => int.alteration === 0).length !== 0
  //   const hasAugmentedEleventh = elevenths.filter(int => int.alteration === 1).length !== 0
  //   return hasPerfectEleventh || hasAugmentedEleventh
  // }

  // function canBeThirteenth (scale: ScaleValue) {
  //   const thirteenths = scale.filter(int => int.simpleIntervalClass === thirteenth)
  //   const hasMajorThirteenth = thirteenths.filter(int => int.alteration === 0).length !== 0
  //   const hasMinorThirteenth = thirteenths.filter(int => int.alteration === -1).length !== 0
  //   return hasMajorThirteenth || hasMinorThirteenth
  // }

  // let remainingIntervalsToName = [...allNamedIntervals]
  // const nameChunks: string[] = []
  
  // // ----------
  // // 13th
  // // ----------
  // if (
  //   ['ß3', '3'].includes(thirds.namedMainInterval)
  //   && ['ß7', '7'].includes(sevenths.namedMainInterval)
  //   && ['ß6', '6'].includes(thirteenths.namedMainInterval)
  // ) {
  //   nameChunks.push('some 13th shit')
  //   // cannot be sus here
  
  // // ----------
  // // 11th
  // // ----------
  // } else if (
  //   ['ß3', '3'].includes(thirds.namedMainInterval)
  //   && ['ß7', '7'].includes(sevenths.namedMainInterval)
  //   && ['4', '#4'].includes(elevenths.namedMainInterval)
  // ) {
  //   nameChunks.push('some 11th shit')
  //   // cannot be sus here
  
  // // ----------
  // // 9th
  // // ----------
  // } else if (
  //   ['ß3', '3'].includes(thirds.namedMainInterval)
  //   && ['ß7', '7'].includes(sevenths.namedMainInterval)
  //   && ['ß2', '2'].includes(ninths.namedMainInterval)
  // ) {
  //   nameChunks.push('some 9th shit')

  // // ----------
  // // 7th
  // // ----------
  // } else if (['ßß7', 'ß7', '7'].includes(sevenths.namedMainInterval)) {
    
  //   // dim7
  //   if (thirds.namedMainInterval === 'ß3'
  //     && fifths.namedMainInterval === 'ß5'
  //     && sevenths.namedMainInterval === 'ßß7') {
  //     nameChunks.push('dim7')
  //     remainingIntervalsToName = remainingIntervalsToName.filter(name => 
  //       name !== 'ß3'
  //       && name !== 'ß5'
  //       && name !== 'ßß7')
      
  //   // aug7
  //   } else if (thirds.namedMainInterval === '3'
  //     && fifths.namedMainInterval === '#5'
  //     && sevenths.namedMainInterval === 'ß7') {
  //     nameChunks.push('aug7')
  //     remainingIntervalsToName = remainingIntervalsToName.filter(name => 
  //       name !== '3'
  //       && name !== '#5'
  //       && name !== 'ß7')
  
  //   // augM7
  //   } else if (thirds.namedMainInterval === '3'
  //     && fifths.namedMainInterval === '#5'
  //     && sevenths.namedMainInterval === '7') {
  //     nameChunks.push('augM7')
  //     remainingIntervalsToName = remainingIntervalsToName.filter(name => 
  //       name !== '3'
  //       && name !== '#5'
  //       && name !== '7')

  //   // not dim7, aug7 nor augM7
  //   } else {
      
  //     // Determine seventh nature (add to chunks after thirds step)
  //     let seventhNature = ''
  //     if (sevenths.namedMainInterval === '7') {
  //       seventhNature = 'M7'
  //       remainingIntervalsToName = remainingIntervalsToName
  //         .filter(name => name !== '7')
  //     } else if (sevenths.namedMainInterval === 'ß7') {
  //       seventhNature = '7'
  //       remainingIntervalsToName = remainingIntervalsToName
  //         .filter(name => name !== 'ß7')
  //     }

  //     // Determine fifth nature
  //     let fifthNature = ''
  //     if (fifths.namedMainInterval === '') {
  //       fifthNature = 'no(5)'
  //     } else if (fifths.namedMainInterval === '5') {
  //       remainingIntervalsToName = remainingIntervalsToName
  //         .filter(name => name !== '5')
  //     } else {
  //       fifthNature = fifths.namedMainInterval
  //       remainingIntervalsToName = remainingIntervalsToName
  //         .filter(name => name !== fifths.namedMainInterval)
  //     }
      
  //     // with major third
  //     if (thirds.namedMainInterval === '3') {
  //       nameChunks.push(seventhNature, fifthNature)
  //       remainingIntervalsToName = remainingIntervalsToName
  //         .filter(name => name !== '3')
  //     }

  //     // no major but with minor third
  //     else if (thirds.namedMainInterval === 'ß3') {
  //       nameChunks.push('m', seventhNature, fifthNature)
  //       remainingIntervalsToName = remainingIntervalsToName
  //         .filter(name => name !== 'ß3')
  //     }

  //     // with other third than minor or major
  //     else if (scaleHasIntervalClass(scale, third)        
  //       && thirds.namedMainInterval !== '') {
  //       nameChunks.push(seventhNature, thirds.namedMainInterval, fifthNature)
  //       remainingIntervalsToName = remainingIntervalsToName
  //         .filter(name => name !== thirds.namedMainInterval)
  //     }

  //     // No third, look for sus2 or 4
  //     else if (scaleHasIntervalClass(scale, [ninth, eleventh])) {
        
  //       // is sus24
  //       if (ninths.namedMainInterval === '2'
  //         && elevenths.namedMainInterval === '4') {
  //         nameChunks.push('sus24', seventhNature, fifthNature)
  //         remainingIntervalsToName = remainingIntervalsToName
  //           .filter(name => name !== '2' && name !== '4')
        
  //       // is sus2
  //       } else if (ninths.namedMainInterval === '2') {
  //         nameChunks.push('sus2', seventhNature, fifthNature)
  //         remainingIntervalsToName = remainingIntervalsToName
  //           .filter(name => name !== '2')
        
  //       // is sus4
  //       } else if (elevenths.namedMainInterval === '4') {
  //         nameChunks.push('sus4', seventhNature, fifthNature)
  //         remainingIntervalsToName = remainingIntervalsToName
  //           .filter(name => name !== '4')
        
  //       // is no(3)
  //       } else {
  //         nameChunks.push(seventhNature, fifthNature, 'no(3)')
  //       }
  //     }

  //     // No third, not sus24, look for sus2
  //     else if (scaleHasIntervalClass(scale, ninth)) {
        
  //       // is sus2
  //       if (ninths.namedMainInterval === '2') {
  //         nameChunks.push('sus2', seventhNature, fifthNature)
  //         remainingIntervalsToName = remainingIntervalsToName
  //           .filter(name => name !== '2')

  //       // is no(3)
  //       } else {
  //         nameChunks.push(seventhNature, fifthNature, 'no(3)')
  //       }
        
  //     // No third, not sus24 or sus2, look for sus4
  //     } else if (scaleHasIntervalClass(scale, eleventh)) {
        
  //       // is sus4
  //       if (elevenths.namedMainInterval === '4') {
  //         nameChunks.push('sus4', seventhNature, fifthNature)
  //         remainingIntervalsToName = remainingIntervalsToName
  //           .filter(name => name !== '4')
        
  //       // is no(3)
  //       } else {
  //         nameChunks.push(seventhNature, fifthNature, 'no(3)')
  //       }

  //     // No third or sus
  //     } else {
  //       nameChunks.push(seventhNature, fifthNature)
  //       nameChunks.push('no(3)')
  //     }
  //   }
  
  // // ----------
  // // Not [3,7,13], [3,7,11], [3,7,9] or [7]
  // // ----------
  // } else {

  //   // ----------
  //   // 13th
  //   // ----------
  //   if (
  //     ['ß3', '3'].includes(thirds.namedMainInterval)
  //     && ['ß6', '6'].includes(thirteenths.namedMainInterval)
  //   ) {
  //     console.log('is 13th no(7) base')
  //     nameChunks.push('some 13th shit')
  //     // cannot be sus here
    
  //   // ----------
  //   // 11th
  //   // ----------
  //   } else if (
  //     ['ß3', '3'].includes(thirds.namedMainInterval)
  //     && ['4', '#4'].includes(elevenths.namedMainInterval)
  //   ) {
  //     console.log('is 11th no(7) base')
  //     nameChunks.push('some 11th shit')
  //     // cannot be sus here
    
  //   // ----------
  //   // 9th
  //   // ----------
  //   } else if (
  //     ['ß3', '3'].includes(thirds.namedMainInterval)
  //     && ['ß2', '2'].includes(ninths.namedMainInterval)
  //   ) {
  //     console.log('is 9th no(7) base')
  //     nameChunks.push('some 9th shit')

  //   // ----------
  //   // 7th
  //   // ----------
  //   } else {
  //     console.log('is triad base')
  //   }
  // }

  // // Handle first interval now
  // if (firsts.namedMainInterval === '') {
  //   nameChunks.push('no(1)')
  // } else {
  //   if (firsts.namedMainInterval !== '1') nameChunks.push(firsts.namedMainInterval)
  //   const namedFirstInterval = firsts.namedMainInterval
  //   remainingIntervalsToName = remainingIntervalsToName.filter(name => name !== namedFirstInterval)
  // }

  // remainingIntervalsToName.forEach(name => nameChunks.push(`add(${name})`))

  // // // Use remaining intervals to complete name
  // // if (firsts.allIntervals.length === 0) {
  // //   nameChunks.push('no(1)')
  // // // dim7 with 1st
  // // } else {
  // //   // dim7 with altered 1st
  // //   if (firsts.namedMainInterval !== '1'
  // //     && firsts.namedMainInterval !== '') {
  // //       nameChunks.push(...[
  // //         firsts.namedMainInterval,
  // //         ...firsts.namedAllIntervals
  // //           .slice(1)
  // //           .map(name => `add(${name})`)
  // //       ])
  // //   // dim7 with natural 1st
  // //   } else {
  // //     nameChunks.push(...firsts.namedAllIntervals
  // //       .slice(1)
  // //       .map(name => `add(${name})`)
  // //     )
  // //   } 
  // // }

  // return nameChunks
  //   .filter(chunk => chunk !== '')
  //   .map(chunk => ({
  //     chunk,
  //     type: chunk.match('^/add/')
  //       ? 2
  //       : (chunk.match(/^no/) ? 3 : 1)
  //   }))
  //   .sort((chunkA, chunkB) => chunkA.type - chunkB.type)
  //   .map(item => item.chunk)
  //   .join(' ')




  // // m|M|sus24|sus2|sus4|dim7|dim|aug|7|M7|(9, 11, 13, ...?)
  
  // // const qualifiers = new Array(7)
  // //   .fill(null)
  // //   .map((_, currIntervalClass) => {
  // //     const scaleIntervals = scale
  // //       .filter(interval => interval.simpleIntervalClass === currIntervalClass)
  // //     const naturalIntervals = scaleIntervals.filter(int => int.alteration === 0)
  // //     const flatIntervals = scaleIntervals.filter(int => int.alteration < 0)
  // //     const sharpIntervals = scaleIntervals.filter(int => int.alteration > 0)
  // //     const orderedIntervals = [
  // //       ...naturalIntervals,
  // //       ...flatIntervals,
  // //       ...sharpIntervals
  // //     ]
  // //     const thisIntervalClassQualifiers: string[] = []
  // //     if (orderedIntervals.length === 0) thisIntervalClassQualifiers.push(`no(${currIntervalClass + 1})`)
  // //     else {
  // //       const [firstOrderedInterval, ...otherOrderedIntervals] = orderedIntervals
  // //       if (!naturalIntervals.includes(firstOrderedInterval)) {
  // //         thisIntervalClassQualifiers.push(`${simpleIntervalValueToName(firstOrderedInterval)}`)
  // //       }
  // //       otherOrderedIntervals.forEach(int => {
  // //         thisIntervalClassQualifiers.push(`add(${simpleIntervalValueToName(int)})`)
  // //       })
  // //     }
  // //     return thisIntervalClassQualifiers
  // //   })
  // // return qualifiers.flat().join(' ')
}

// console.log(
//   scaleToChordQuality(
//     scaleNameToValue('#1,#2,ßß7,ß2')
//   )
// )

const lol = [
  ['1', null],
  ['ß2', '2', null],
  ['ß3', '3', null],
  ['4', '#4', null],
  ['ß5', '5', '#5', null],
  ['ß6', '6', null],
  ['ßß7', 'ß7', '7', null]
]

new Array(Math.pow(4, 7) / 4)
  .fill(0)
  .map((_, pos) => {
    const base4Pos = pos.toString(4).split('').map(e => parseInt(e))
    const reversedBase4Pos = [...base4Pos].reverse()
    const withZeros = [...reversedBase4Pos, 0, 0, 0, 0, 0, 0, 0]
    const sliced = withZeros.slice(0, 7).reverse()
    const intervals = new Array(7).fill(null).map((_, pos) => lol[pos][sliced[pos]])
    if (intervals.includes(undefined as any)) return;
    const scaleName = intervals.filter(e => e!== null).join(',')
    const scale = scaleNameToValue(scaleName)
    console.log(scaleName, '——>', scaleToChordQuality(scale))
  })

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

export function scaleToRahmPrimeForm (scale: ScaleValue): ScaleValue {
  const allForms = [
    ...scaleToRotations(scale),
    ...scaleToReflections(scale)
  ]
  const minOddDecimalValue = Math.min(...allForms
    .map(scale => scaleToDecimalValue(scale))
    .filter(scale => scale % 2 !== 0)
  )
  const asScale = scaleDecimalValueToValue(minOddDecimalValue)
  return asScale
}

// CHORD NAME
// COMMON NAMES

// intervalPattern
// semitonesPattern
// maxInterval
// triads
// gender
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
// rotationsToPrimeForm /* prime form can also be obtained from reflection so... */
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

