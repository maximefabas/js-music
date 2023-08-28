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
  return rotations.filter(rotation => {
    const decimalValue = scaleToDecimalValue(rotation)
    return decimalValue % 2 !== 0
  })
  // [WIP] what to do with this approach ?
  // const lowestInterval = scale.sort((intA, intB) => {
  //   const { simpleIntervalClass: intClassA, alteration: altA } = intA
  //   const { simpleIntervalClass: intClassB, alteration: altB } = intB
  //   if (intClassA === intClassB) return altA - altB
  //   else return intClassA - intClassB
  // }).at(0)
  // const lowestIntervalName = lowestInterval !== undefined
  //   ? simpleIntervalValueToName(lowestInterval)
  //   : undefined
  // const rotations = scaleToRotations(scale)
  // return rotations.filter(rotation => {
  //   const rotationLowestInterval = rotation.sort((intA, intB) => {
  //     const { simpleIntervalClass: intClassA, alteration: altA } = intA
  //     const { simpleIntervalClass: intClassB, alteration: altB } = intB
  //     if (intClassA === intClassB) return altA - altB
  //     else return intClassA - intClassB
  //   }).at(0)
  //   const rotationLowestIntervalName = rotationLowestInterval !== undefined
  //   ? simpleIntervalValueToName(rotationLowestInterval)
  //   : undefined
  //   return rotationLowestIntervalName === lowestIntervalName
  // })
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

type S = string[]
export type ScaleChordQualityTable = {
  mainQuality: string
  hasMinorQuality: boolean
  accidents: [S, S, S, S, S, S, S]
  omissions: [S, S, S, S, S, S, S]
  additions: [S, S, S, S, S, S, S]
  leftovers: string[]
}

export function scaleToChordQualityTable (scale: ScaleValue): ScaleChordQualityTable {
  const namedIntervals = scale.map(int => simpleIntervalValueToName(int))
  const hasFirst = namedIntervals.includes('1')
  const hasAnyFirst = namedIntervals.some(int => int.match(/1/igm))
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

  type S = string[]
  const qualityTable = {
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
      qualityTable.additions[3].push('#11')
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['4', '#4'].includes(i))
    } else if (hasPerfectEleventh) {
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['4'].includes(i))
    } else if (hasAugmentedEleventh) {
      qualityTable.accidents[3].push('#11')
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['#4'].includes(i))
    } else {
      qualityTable.omissions[3].push('11')
    }
  }

  const handleNinthsWhenExpected = (
    hasMajorNinth: boolean,
    hasMinorNinth: boolean
  ) => {
    if (hasMajorNinth && hasMinorNinth) {
      qualityTable.additions[1].push('ß9')
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2', 'ß2'].includes(i))
    } else if (hasMajorNinth) {
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
    } else if (hasMinorNinth) {
      qualityTable.accidents[1].push('ß9')
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß2'].includes(i))
    } else {
      qualityTable.omissions[1].push('9')
    }
  }

  const handleSeventhsWhenExpected = (
    hasMajorSeventh: boolean,
    hasMinorSeventh: boolean
  ) => {
    if (hasMajorSeventh && hasMinorSeventh) {
      qualityTable.additions[6].push('7')
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7', 'ß7'].includes(i))
    } else if (hasMajorSeventh || hasMinorSeventh) {
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7', 'ß7'].includes(i))
    } else {
      qualityTable.omissions[6].push('ß7')
    }
  }

  const handleFifthsWhenExpected = (
    hasPerfectFifth: boolean,
    hasAnyFifth: boolean
  ) => {
    if (hasPerfectFifth) {
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['5'].includes(i))
    } else if (hasAnyFifth) {
      const fifths = qualityTable.leftovers.filter(int => int.match(/5/igm))
      const [accFifth, ...addFifths] = fifths
      qualityTable.accidents[4].push(accFifth)
      qualityTable.additions[4].push(...addFifths)
      qualityTable.leftovers = qualityTable.leftovers.filter(int => !fifths.includes(int))
    } else {
      qualityTable.omissions[4].push('5')
    }
  }

  const handleThirdsWhenExpected = (
    isMajor: boolean,
    isMinor: boolean,
    hasAnyThird: boolean
  ) => {
    if (isMajor) {
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['3'].includes(i))
    } else if (isMinor) {
      qualityTable.hasMinorQuality = true
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß3'].includes(i))
    } else if (hasAnyThird) {
      const thirds = qualityTable.leftovers.filter(int => int.match(/3/igm))
      const [accThird, ...addThirds] = thirds
      qualityTable.accidents[2].push(accThird)
      qualityTable.additions[2].push(...addThirds)
      qualityTable.leftovers = qualityTable.leftovers.filter(int => !thirds.includes(int))
    } else {
      qualityTable.omissions[2].push('3')
    }
  }

  // Diminished
  if (isDim) {
    qualityTable.mainQuality = 'dim'
    qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß3', 'ß5'].includes(i))
    
    // dim + 13th
    if (hasMajorThirteenth) {
      qualityTable.mainQuality = '6'
      qualityTable.hasMinorQuality = true
      qualityTable.accidents[4].push('ß5')
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['6'].includes(i))
      if (hasExtensionsBelowThirteenth) {
        qualityTable.mainQuality = '13'
        // M
        if (hasMajorSeventh && !hasMinorSeventh) {
          qualityTable.mainQuality = 'M13'
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
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
      qualityTable.mainQuality = 'ß6'
      qualityTable.hasMinorQuality = true
      qualityTable.accidents[4].push('ß5')
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß6'].includes(i))
      if (hasExtensionsBelowThirteenth) {
        qualityTable.mainQuality = 'ß13'
        // M
        if (hasMajorSeventh && !hasMinorSeventh) {
          qualityTable.mainQuality = 'Mß13'
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
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
      qualityTable.mainQuality = '11'
      qualityTable.hasMinorQuality = true
      qualityTable.accidents[4].push('ß5')
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['4'].includes(i))
      // M
      if (hasMajorSeventh && !hasMinorSeventh) {
        qualityTable.mainQuality = 'M11'
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
      }
      // 9th
      handleNinthsWhenExpected(hasMajorNinth, hasMinorNinth)
      // 7th
      handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)

    // dim + #11th
    } else if (hasPerfectEleventh) {
      qualityTable.mainQuality = '#11'
      qualityTable.hasMinorQuality = true
      qualityTable.accidents[4].push('ß5')
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['#4'].includes(i))
      // M
      if (hasMajorSeventh && !hasMinorSeventh) {
        qualityTable.mainQuality = 'M#11'
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
      }
      // 9th
      handleNinthsWhenExpected(hasMajorNinth, hasMinorNinth)
      // 7th
      handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
      
    // dim + 9th
    } else if (hasMajorNinth) {
      qualityTable.mainQuality = '9'
      qualityTable.hasMinorQuality = true
      qualityTable.accidents[4].push('ß5')
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
      // M
      if (hasMajorSeventh && !hasMinorSeventh) {
        qualityTable.mainQuality = 'M9'
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
      }
      // 7th
      handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
    
    // dim + ß9th
    } else if (hasMinorNinth) {
      qualityTable.mainQuality = 'ß9'
      qualityTable.hasMinorQuality = true
      qualityTable.accidents[4].push('ß5')
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß2'].includes(i))
      // M
      if (hasMajorSeventh && !hasMinorSeventh) {
        qualityTable.mainQuality = 'Mß9'
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
      }
      // 7th
      handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)

    // dim + ßß7th
    } else if (hasDiminishedSeventh) {
      qualityTable.mainQuality = 'dim7'
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ßß7'].includes(i))
    
    // dim + ß7th
    } else if (hasMinorSeventh) {
      qualityTable.mainQuality = '7'
      qualityTable.hasMinorQuality = true
      qualityTable.accidents[4].push('ß5')
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß7'].includes(i))
    
    // dim + 7th
    } else if (hasMajorSeventh) {
      qualityTable.mainQuality = 'M7'
      qualityTable.hasMinorQuality = true
      qualityTable.accidents[4].push('ß5')
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
    }
  
  // Augmented
  } else if (isAug) {
    qualityTable.mainQuality = 'aug'
    qualityTable.leftovers = qualityTable.leftovers.filter(i => !['3', '#5'].includes(i))

    // aug + 13th
    if (hasMajorThirteenth) {
      qualityTable.mainQuality = '6'
      qualityTable.accidents[4].push('#5')
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['6'].includes(i))
      if (hasExtensionsBelowThirteenth) {
        qualityTable.mainQuality = '13#5'
        // M
        if (hasMajorSeventh && !hasMinorSeventh) {
          qualityTable.mainQuality = 'M13#5'
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
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
      qualityTable.mainQuality = 'ß6'
      qualityTable.accidents[4].push('#5')
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß6'].includes(i))
      if (hasExtensionsBelowThirteenth) {
        qualityTable.mainQuality = 'ß13'
        // M
        if (hasMajorSeventh && !hasMinorSeventh) {
          qualityTable.mainQuality = 'Mß13'
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
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
      qualityTable.mainQuality = '11'
      qualityTable.accidents[4].push('#5')
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['4'].includes(i))
      // M
      if (hasMajorSeventh && !hasMinorSeventh) {
        qualityTable.mainQuality = 'M11'
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
      }
      // 9th
      handleNinthsWhenExpected(hasMajorNinth, hasMinorNinth)
      // 7th
      handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)

    // aug + #11th
    } else if (hasPerfectEleventh) {
      qualityTable.mainQuality = '#11'
      qualityTable.accidents[4].push('#5')
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['#4'].includes(i))
      // M
      if (hasMajorSeventh && !hasMinorSeventh) {
        qualityTable.mainQuality = 'M#11'
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
      }
      // 9th
      handleNinthsWhenExpected(hasMajorNinth, hasMinorNinth)
      // 7th
      handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
      
    // aug + 9th
    } else if (hasMajorNinth) {
      qualityTable.mainQuality = '9'
      qualityTable.accidents[4].push('#5')
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
      // M
      if (hasMajorSeventh && !hasMinorSeventh) {
        qualityTable.mainQuality = 'M9'
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
      }
      // 7th
      handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
    
    // aug + ß9th
    } else if (hasMinorNinth) {
      qualityTable.mainQuality = 'ß9'
      qualityTable.accidents[4].push('#5')
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß2'].includes(i))
      // M
      if (hasMajorSeventh && !hasMinorSeventh) {
        qualityTable.mainQuality = 'Mß9'
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
      }
      // 7th
      handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)

    // aug + ß7th
    } else if (hasMinorSeventh) {
      qualityTable.mainQuality = 'aug7'
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß7'].includes(i))
    
    // aug + 7th
    } else if (hasMajorSeventh) {
      qualityTable.mainQuality = 'augM7'
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
    
    // aug + ßß7th
    } else if (hasDiminishedSeventh) {
      qualityTable.mainQuality = 'augßß7'
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ßß7'].includes(i))
    }

  // Not diminished nor augmented
  } else {

    // 13th
    if (hasMajorThirteenth) {
      qualityTable.mainQuality = '6'
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['6'].includes(i))
      if (hasExtensionsBelowThirteenth) {
        qualityTable.mainQuality = '13'
        // M
        if (hasMajorSeventh && !hasMinorSeventh) {
          qualityTable.mainQuality = 'M13'
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
        }
        // 11th
        handleEleventhsWhenExpected(hasPerfectEleventh, hasAugmentedEleventh)
        // 9th
        handleNinthsWhenExpected(hasMajorNinth, hasMinorNinth)
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
      }
      // 5th
      handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
      // 3rd
      handleThirdsWhenExpected(isMajor, isMinor, hasAnyThird)

    // ß13
    } else if (hasMinorThirteenth) {
      qualityTable.mainQuality = 'ß6'
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß6'].includes(i))
      if (hasExtensionsBelowThirteenth) {
        qualityTable.mainQuality = 'ß13'
        // M
        if (hasMajorSeventh && !hasMinorSeventh) {
          qualityTable.mainQuality = 'Mß13'
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
        }
        // 11th
        handleEleventhsWhenExpected(hasPerfectEleventh, hasAugmentedEleventh)
        // 9th
        handleNinthsWhenExpected(hasMajorNinth, hasMinorNinth)
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
      }
      // 5th
      handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
      // 3rd
      handleThirdsWhenExpected(isMajor, isMinor, hasAnyThird)

    // 11
    } else if (hasPerfectEleventh) {
      qualityTable.mainQuality = '11'
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['4'].includes(i))

      // No 3 or ß3 => sus4
      if (!hasMajorThird && !hasMinorThird) {
        qualityTable.mainQuality = 'sus4'
        if (hasMinorSeventh) {
          qualityTable.mainQuality = '7sus4'
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß7'].includes(i))
          if (hasMajorNinth) {
            qualityTable.mainQuality = '7sus24'
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
          }
        } else if (hasMajorSeventh) {
          qualityTable.mainQuality = 'M7sus4'
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
          if (hasMajorNinth) {
            qualityTable.mainQuality = '7sus24'
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
          }
        } else if (hasMajorNinth) {
          qualityTable.mainQuality = 'sus24'
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
        }
        // 5th
        handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)

      // Has 3 or ß3
      } else {
        // M
        if (hasMajorSeventh && !hasMinorSeventh) {
          qualityTable.mainQuality = 'M11'
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
        }
        // 9th
        handleNinthsWhenExpected(hasMajorNinth, hasMinorNinth)
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
        // 5th
        handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
        // 3rd
        handleThirdsWhenExpected(isMajor, isMinor, hasAnyThird)
      }

    // #11
    } else if (hasAugmentedEleventh) {
      qualityTable.mainQuality = '#11'
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['#4'].includes(i))

      // No 3 or ß3, => sus#4
      if (!hasMajorThird && !hasMinorThird) {
        qualityTable.mainQuality = 'sus#4'
        if (hasMinorSeventh) {
          qualityTable.mainQuality = '7sus#4'
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß7'].includes(i))
          if (hasMajorNinth) {
            qualityTable.mainQuality = '7sus2#4'
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
          }
        } else if (hasMajorSeventh) {
          qualityTable.mainQuality = 'M7sus#4'
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
          if (hasMajorNinth) {
            qualityTable.mainQuality = '7sus2#4'
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
          }
        } else if (hasMajorNinth) {
          qualityTable.mainQuality = 'sus2#4'
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
        }
        // 5th
        handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)

      // Has 3 or ß3
      } else {
        // M
        if (hasMajorSeventh && !hasMinorSeventh) {
          qualityTable.mainQuality = 'M#11'
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
        }
        // 9th
        handleNinthsWhenExpected(hasMajorNinth, hasMinorNinth)
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
        // 5th
        handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
        // 3rd
        handleThirdsWhenExpected(isMajor, isMinor, hasAnyThird)
      }

    // 9
    } else if (hasMajorNinth) {
      qualityTable.mainQuality = '9'        
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
      
      // No 3, ß3 => sus2
      if (!hasMajorThird && !hasMinorThird) {
        qualityTable.mainQuality = 'sus2'
        if (hasMinorSeventh) {
          qualityTable.mainQuality = '7sus2'
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß7'].includes(i))
        } else if (hasMajorSeventh) {
          qualityTable.mainQuality = 'M7sus2'
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
        }
      
      // Has 3 or ß3
      } else {
        // M
        if (hasMajorSeventh && !hasMinorSeventh) {
          qualityTable.mainQuality = 'M9'
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
        }
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
        // 5th
        handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
        // 3rd
        handleThirdsWhenExpected(isMajor, isMinor, hasAnyThird)
      }

    // ß9
    } else if (hasMinorNinth) {
      qualityTable.mainQuality = 'ß9'
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß2'].includes(i))
      // M
      if (hasMajorSeventh && !hasMinorSeventh) {
        qualityTable.mainQuality = 'Mß9'
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
      }
      // 7th
      handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
      // 5th
      handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
      // 3rd
      handleThirdsWhenExpected(isMajor, isMinor, hasAnyThird)

    // 7
    } else if (hasMinorSeventh) {
      qualityTable.mainQuality = '7'
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß7'].includes(i))
      // 5th
      handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
      // 3rd
      handleThirdsWhenExpected(isMajor, isMinor, hasAnyThird)

    // M7
    } else if (hasMajorSeventh) {
      qualityTable.mainQuality = 'M7'
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
      // 5th
      handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
      // 3rd
      handleThirdsWhenExpected(isMajor, isMinor, hasAnyThird)

    // No extension
    } else {
      if (!hasAnyFifth && !hasAnyThird) {
        // 5th
        handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
        // 3rd
        handleThirdsWhenExpected(isMajor, isMinor, hasAnyThird)
      } else if (hasAnyThird && !hasAnyFifth) {
        if (hasMajorThird) {
          qualityTable.mainQuality = '3'
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['3'].includes(i))
        } else if (hasMinorThird) {
          qualityTable.mainQuality = 'ß3'
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß3'].includes(i))
        } else {
          const [firstThird] = qualityTable.leftovers.filter(i => i.match(/3/igm))
          qualityTable.mainQuality = firstThird
        }
      } else if (!hasAnyThird && hasAnyFifth) {
        if (hasPerfectFifth) {
          qualityTable.mainQuality = '5'
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['5'].includes(i))
        } else if (hasDiminishedFifth) {
          qualityTable.mainQuality = 'ß5'
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß5'].includes(i))
        } else if (hasAugmentedFifth) {
          qualityTable.mainQuality = '#5'
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['#5'].includes(i))
        } else {
          const [firstFifth] = qualityTable.leftovers.filter(i => i.match(/5/igm))
          qualityTable.mainQuality = firstFifth
        }
      } else { 
        // 5th
        handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
        // 3rd
        handleThirdsWhenExpected(isMajor, isMinor, hasAnyThird)
      }
    }
  }

  // 1st
  if (hasFirst) {
    qualityTable.leftovers = qualityTable.leftovers.filter(i => !['1'].includes(i))
  } else if (!hasFirst && hasAnyFirst) {
    const firstFirst = qualityTable.leftovers.find(int => int.match(/1/igm))
    if (firstFirst === undefined) { qualityTable.omissions[0].push('1') }
    else {
      qualityTable.accidents[0].push(firstFirst)
      qualityTable.leftovers = qualityTable.leftovers.filter(i => ![firstFirst].includes(i))
    }
  } else {
    qualityTable.omissions[0].push('1')
  }

  // Leftovers
  new Array(7).fill(null).forEach((_, intClass) => {
    const intClassName = `${intClass + 1}`
    const regex = new RegExp(intClassName, 'igm')
    const foundInLeftovers = qualityTable.leftovers.filter(i => i.match(regex))
    foundInLeftovers.forEach(leftover => {
      qualityTable.additions[intClass].push(leftover)
    })
  })

  return qualityTable
}

export function scaleChordQualityTableToQuality (qualityTable: ScaleChordQualityTable): string {
  let quality = ''
  if (qualityTable.hasMinorQuality) quality += 'm'
  quality += qualityTable.mainQuality
  qualityTable.accidents.flat().forEach(accident => { quality += ` ${accident}` })
  const flattenedOmissions = qualityTable.omissions.flat()
  if (flattenedOmissions.length > 0) { quality += ` no(${flattenedOmissions.join(',')})` }
  const flattenedAdditions = qualityTable.additions.flat()
  if (flattenedAdditions.length > 0) { quality += ` add(${flattenedAdditions.join(',')})` }
  return quality
}

export function scaleChordQualityTableToQualityWeight (qualityTable: ScaleChordQualityTable): number {
  let weight = 0
  weight += qualityTable.accidents.flat().length
  weight += qualityTable.omissions.flat().length * 1.2
  weight += qualityTable.additions.flat().length * 1.2
  return weight
}

export function scaleToRawChordQuality (scale: ScaleValue): string {
  const qualityTable = scaleToChordQualityTable(scale)
  const quality = scaleChordQualityTableToQuality(qualityTable)
  return quality
}

export function scaleToChordQuality (scale: ScaleValue): string {
  const modes = scaleToModes(scale)
  const modesQualityTables = modes.map((mode, modePos) => {
    const rotationAsInterval = scale[modePos]
    const rotationAsIntervalName = simpleIntervalValueToName(rotationAsInterval)
    const qualityTable = scaleToChordQualityTable(mode)
    const weight = scaleChordQualityTableToQualityWeight(qualityTable)
    const name = scaleChordQualityTableToQuality(qualityTable)
    const nameWithMajor = name !== '' ? name : 'maj'
    const invertedName = rotationAsIntervalName === '1' ? name : `${nameWithMajor}/${rotationAsIntervalName}`
    return {
      mode,
      qualityTable,
      weight,
      name,
      invertedName
    }
  })
  const minWeight = Math.min(...modesQualityTables.map(table => table.weight))
  const minWeightMode = modesQualityTables.find(table => table.weight === minWeight)
  return minWeightMode?.invertedName ?? scaleToRawChordQuality(scale)
}

// console.log(scaleToChordQuality(scaleNameToValue('1,ß3,ß6')))

// console.log(
//   scaleToChordQualityTable(
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

new Array(Math.pow(4, 7))
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
    console.log(
      scaleName,
      '——>',
      scaleToRawChordQuality(scale).length - scaleToChordQuality(scale).length,
      scaleToRawChordQuality(scale),
      ' | ',
      scaleToChordQuality(scale)
    )
  })

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

