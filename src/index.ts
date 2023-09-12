import { romanize, deromanize } from './modules/romans-safe/index.js'
import { REGEXPS } from './regexps.js'
import absoluteModulo from './modules/absolute-modulo/index.js'
import toAlphanum from './modules/to-alphanum/index.js'
import * as regexpUtils from './modules/regexp-utils/index.js'
import { MainQualities, qualitiesToIntervalsNameMap } from './data/scales-qualities.js'
import * as scalesData from './data/scales-names.js'

/*

interval('c^4') === pitch('c^4')
chord('C^4mixolydian') === key('C^4mixolydian')
pitch('c^4', scale) => gives a scale context to the pitch
so you can do pitch('!4', majorScale) => access the fourth of the major scale  
pitch('')

by default, method calls on instance do mutate value or not ?
- pitch.clone().doStuff() ?
- pitch.doStuff().mutate(pitch) ?

*/

/* Alteration */

export namespace AlterationTypes {
  export type Value = number
  export type Name = string
}

export class Alteration {
  static name (value: AlterationTypes.Value): AlterationTypes.Name {
    if (value > 0) return new Array(value).fill('#').join('')
    if (value < 0) return new Array(-1 * value).fill('ß').join('')
    return ''
  }
  static fromName (name: AlterationTypes.Name): AlterationTypes.Value {
    const chars = name.split('')
    const sharps = chars.filter(char => char === '#').length
    const flats = chars.filter(char => char === 'ß').length
    return sharps - flats
  }

  static lessAltered (...alterations: AlterationTypes.Value[]): AlterationTypes.Value | undefined {
    const sorted = alterations
      .map(alt => ({
        value: alt,
        weight: alt > 0 ? alt + .5 : Math.abs(alt)
      }))
      .sort((itemA, itemB) => itemA.weight - itemB.weight)
      .map(item => item.value)
    return sorted.at(0)
  }
}

/* Interval */

export namespace IntervalTypes {
  export type StepValue = number
  export type Value = {
    step: StepValue
    alteration: AlterationTypes.Value
  }
  export type SimpleStepValue = 0 | 1 | 2 | 3 | 4 | 5 | 6
  export type SimpleValue = Value & {
    step: SimpleStepValue
  }
  export type Name = string
}

export class Interval {
  static name (value: IntervalTypes.Value): IntervalTypes.Name {
    const { step, alteration } = value
    const alterationName = Alteration.name(alteration)
    let stepName: string
    if (step > 0) { stepName = `${step + 1}` }
    else if (step === 0) { stepName = '1' }
    else { stepName = `${step - 1}` }
    return `${alterationName}${stepName}`
  }

  static fromName (name: IntervalTypes.Name, defaultToFirst: true): IntervalTypes.Value
  static fromName (name: IntervalTypes.Name, defaultToFirst: false): IntervalTypes.Value | undefined
  static fromName (name: IntervalTypes.Name): IntervalTypes.Value | undefined
  static fromName (name: IntervalTypes.Name, defaultToFirst: boolean = false): IntervalTypes.Value | undefined {
    const nameChars = name.split('')
    const stepNameChars = nameChars.filter(char => char === '-' || !Number.isNaN(parseInt(char)))
    let parsedStepValue = parseInt(stepNameChars.join(''))
    if (!Number.isInteger(parsedStepValue)) return defaultToFirst
       ? { step: 0, alteration: 0 }
       : undefined
    if (parsedStepValue >= 1) { parsedStepValue -= 1 }
    else if (parsedStepValue <= -1) { parsedStepValue += 1 }
    const alteration = Alteration.fromName(name)
    return {
      step: parsedStepValue,
      alteration
    }
  }

  static simplify (value: IntervalTypes.Value): IntervalTypes.SimpleValue {
    const { step, alteration } = value
    const simpleStep = Math.floor(
      absoluteModulo(step, 7)
    ) as IntervalTypes.SimpleStepValue
    return {
      step: simpleStep,
      alteration
    }
  }

  // [WIP] should find a way to put getters here
  static commonNames = {
    first: Interval.simplify(Interval.fromName('1', true)),
    majorSecond: Interval.simplify(Interval.fromName('2', true)),
    minorSecond: Interval.simplify(Interval.fromName('ß2', true)),
    majorThird: Interval.simplify(Interval.fromName('3', true)),
    minorThird: Interval.simplify(Interval.fromName('ß3', true)),
    perfectFourth: Interval.simplify(Interval.fromName('4', true)),
    augmentedFourth: Interval.simplify(Interval.fromName('#4', true)),
    perfectFifth: Interval.simplify(Interval.fromName('5', true)),
    diminishedFifth: Interval.simplify(Interval.fromName('ß5', true)),
    augmentedFifth: Interval.simplify(Interval.fromName('#5', true)),
    majorSixth: Interval.simplify(Interval.fromName('6', true)),
    minorSixth: Interval.simplify(Interval.fromName('ß6', true)),
    majorSeventh: Interval.simplify(Interval.fromName('7', true)),
    minorSeventh: Interval.simplify(Interval.fromName('ß7', true)),
    diminishedSeventh: Interval.simplify(Interval.fromName('ßß7', true))
  }

  static semitonesValues: [0, 2, 4, 5, 7, 9, 11] = [0, 2, 4, 5, 7, 9, 11]
  
  static semitones (value: IntervalTypes.Value): number {
    const simplified = Interval.simplify(value)
    const simplifiedStepAsSemitones = Interval.semitonesValues
      .at(simplified.step) as typeof Interval.semitonesValues[IntervalTypes.SimpleStepValue]
    const simplifiedAsSemitones = simplifiedStepAsSemitones + simplified.alteration
    const octaves = (value.step - simplified.step) / 7
    return 12 * octaves + simplifiedAsSemitones
  }

  static between (
    intervalA: IntervalTypes.Value,
    intervalB: IntervalTypes.Value
  ): IntervalTypes.Value {
    const siA = Interval.simplify(intervalA)
    const siB = Interval.simplify(intervalB)
    const stepBetweenSis = siB.step - siA.step
    const semitonesBetweenSiSteps = Interval.semitones({
      step: stepBetweenSis,
      alteration: 0
    })
    const semitonesBetweenSis = Interval.semitones(siB) - Interval.semitones(siA)
    const alteration = semitonesBetweenSis - semitonesBetweenSiSteps
    const semitonesBetweenIntervals = Interval.semitones(intervalB) - Interval.semitones(intervalA)
    const octavesBetweenIntervals = Math.floor((semitonesBetweenIntervals - semitonesBetweenSis) / 12)
    const step = stepBetweenSis + 7 * octavesBetweenIntervals
    return { step, alteration }
  }

  static add (
    intervalA: IntervalTypes.Value,
    intervalB: IntervalTypes.Value
  ): IntervalTypes.Value {
    const sumAsSemitones = Interval.semitones(intervalA) + Interval.semitones(intervalB)
    const step = intervalA.step + intervalB.step
    const stepsAsSemitones = Interval.semitones({
      step,
      alteration: 0
    })
    const alteration = sumAsSemitones - stepsAsSemitones
    return { step, alteration }
  }

  static invert (interval: IntervalTypes.Value) {
    const unison = { step: 0, alteration: 0 }
    return Interval.between(interval, unison)
  }

  static subtract (
    intervalA: IntervalTypes.Value,
    intervalB: IntervalTypes.Value
  ): IntervalTypes.Value {
    const invertedB = Interval.invert(intervalB)
    return Interval.add(intervalA, invertedB)
  }

  static negative (
    interval: IntervalTypes.Value,
    mainAxis: IntervalTypes.Value = {
      step: 2,
      alteration: -1
    },
    secondaryAxis: IntervalTypes.Value = {
      step: mainAxis.step,
      alteration: mainAxis.alteration + 1
    }
  ): IntervalTypes.Value {
    const distanceToMainAxis = Interval.between(interval, mainAxis)
    const distanceAppliedToSecondAxis = Interval.add(distanceToMainAxis, secondaryAxis)
    return distanceAppliedToSecondAxis
  }
  
  static sort (intervals: IntervalTypes.SimpleValue[]): IntervalTypes.SimpleValue[]
  static sort (intervals: IntervalTypes.Value[]): IntervalTypes.Value[]
  static sort (intervals: IntervalTypes.Value[]): IntervalTypes.Value[] {
    const sortedIntervals = [...intervals]
      .sort((intA, intB) => {
        const { step: stepA, alteration: alterationA } = intA
        const { step: stepB, alteration: alterationB } = intB
        if (stepA === stepB) return alterationA - alterationB
        return stepA - stepB
      })
    return sortedIntervals
  }
  
  static dedupe (intervals: IntervalTypes.SimpleValue[]): IntervalTypes.SimpleValue[]
  static dedupe (intervals: IntervalTypes.Value[]): IntervalTypes.Value[]
  static dedupe (intervals: IntervalTypes.Value[]): IntervalTypes.Value[] {
    const intervalsNamesMap = new Map(intervals.map(int => [Interval.name(int), int]))
    const dedupedIntervals = [...intervalsNamesMap]
      .map(([, int]) => int)
    return dedupedIntervals
  }
  
  static semitoneDedupe (intervals: IntervalTypes.SimpleValue[]): IntervalTypes.SimpleValue[]
  static semitoneDedupe (intervals: IntervalTypes.Value[]): IntervalTypes.Value[]
  static semitoneDedupe (intervals: IntervalTypes.Value[]): IntervalTypes.Value[] {
    const intervalsSemitonesMap = new Map<IntervalTypes.Value, number>(
      intervals.map(interval => [
        interval,
        Interval.semitones(interval)
      ]
    ))
    const dedupedSemitones = [...new Set(intervalsSemitonesMap.values())]
    const semitonesAndIntervals = dedupedSemitones.map(semitoneValue => {
      const intervals = [...intervalsSemitonesMap]
        .filter(([_, sem]) => (sem === semitoneValue))
        .map(([int]) => int)
      return { semitoneValue, intervals }
    })
    const semitonesIntervalsMap = new Map<number, IntervalTypes.Value[]>(semitonesAndIntervals.map(({
      semitoneValue,
      intervals
    }) => [semitoneValue, intervals]))
    return [...semitonesIntervalsMap].map(([sem, ints]) => {
      const lesserAlterationValue = Math.min(...ints.map(({ alteration }) => Math.abs(alteration)))
      const intervalWithLesserAltValue = ints.find(interval => Math.abs(interval.alteration) === lesserAlterationValue)
      const chosenInterval = intervalWithLesserAltValue ?? ints[0] ?? {
        step: 0,
        alteration: sem
      }
      return chosenInterval
    })
  }
  
  static shiftStep (
    interval: IntervalTypes.Value,
    step: IntervalTypes.StepValue
  ): IntervalTypes.Value {
    const unalteredInputInterval: IntervalTypes.Value = { ...interval, alteration: 0 }
    const unalteredTargetInterval: IntervalTypes.Value = { step, alteration: 0 }
    const intervalBetweenUnalteredInputAndTarget = Interval.between(unalteredInputInterval, unalteredTargetInterval)
    const semitonesBeteenInputAndTarget = Interval.semitones(intervalBetweenUnalteredInputAndTarget)
    const alteration = interval.alteration - semitonesBeteenInputAndTarget
    return { step, alteration }
  }
  
  static rationalize (
    interval: IntervalTypes.Value,
    forceFlatOutput: boolean = false
  ): IntervalTypes.Value {
    if (interval.alteration === 0) return interval
    let rationalized = interval
    const signsAreEqual = (nbr1: number, nbr2: number) => {
      if (nbr1 === 0) return true
      if (nbr1 > 0) return nbr2 >= 0
      return nbr2 <= 0
    }
    while (true) {
      if (rationalized.alteration === 0) break;
      const rationalizedOnceMore = Interval.shiftStep(
        rationalized,
        interval.alteration >= 0 // technically could just check if strictly superior
          ? rationalized.step + 1
          : rationalized.step - 1
      )
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
}

/* Scale */

export namespace ScaleTypes {
  export type Value = IntervalTypes.SimpleValue[]
  export type Name = string
  type S = string[]
  export type QualityTable = {
    mainQuality: MainQualities
    hasMinorQuality: boolean
    accidents: [S, S, S, S, S, S, S]
    omissions: [S, S, S, S, S, S, S]
    additions: [S, S, S, S, S, S, S]
    leftovers: string[]
    inversion: IntervalTypes.SimpleValue | IntervalTypes.SimpleStepValue | null
  }
}

export class Scale {
  static isMainQuality (string: string): string is MainQualities {
    return Object
      .values(MainQualities)
      .includes(string as any)
  }

  static fromIntervalsName (name: string): ScaleTypes.Value {
    const parsedIntervalNames = name.split(regexpUtils.setFlags(REGEXPS.intervalsNameSeparator, 'g'))
    const intervals = parsedIntervalNames
      .map(intervalName => Interval.fromName(intervalName))
      .filter((int): int is IntervalTypes.Value => int !== undefined)
      .map(int => Interval.simplify(int))
    return intervals
  }
  
  static intervalsName (scale: ScaleTypes.Value): string {
    return scale.map(interval => Interval.name(interval)).join(REGEXPS.intervalsNameSeparator.source)
  }
  
  static reallocate (scale: ScaleTypes.Value): ScaleTypes.Value {
    const sortedDeduped = Interval.sort(Interval.semitoneDedupe(scale))
    const nbIntervals = sortedDeduped.length
    const nbIntervalsOverSeven = nbIntervals / 7
    const nbIntervalsModuloSeven = nbIntervals % 7
    const minPressureAllowed = Math.floor(nbIntervalsOverSeven)
    const maxPressureAllowed = nbIntervalsModuloSeven === 0
      ? minPressureAllowed
      : Math.ceil(nbIntervalsOverSeven)
    const nbSlotsAtMaxPressure = nbIntervalsModuloSeven === 0
      ? minPressureAllowed * 7
      : nbIntervals - minPressureAllowed * 7
    const stepSlots = new Array(7)
      .fill(null)
      .map((_, pos) => ({
        step: pos as IntervalTypes.SimpleStepValue,
        intervals: sortedDeduped
          .filter(({ step }) => step === pos)
      }))
      .map(slot => ({
        ...slot,
        pressureForSort: slot.step === 0 && maxPressureAllowed !== 1
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
      .sort((slotA, slotB) => slotA.step - slotB.step)
  
    function moveIntervalToNeighbourSlot (
      slots: typeof stepSlots,
      from: IntervalTypes.SimpleStepValue,
      toUp: boolean = true
    ): typeof stepSlots {
      const sourceSlot = slots
        .find(slot => slot.step === from)
      if (sourceSlot === undefined) return slots
      const destinationSlot = slots
        .find(slot => slot.step === from + (toUp ? 1 : -1))
      if (destinationSlot === undefined) return slots
      const sourceIntervalsAsSemitones = sourceSlot.intervals
        .map(interval => Interval.semitones(interval))
      const targetIntervalSemitoneValue = toUp
        ? Math.max(...sourceIntervalsAsSemitones)
        : Math.min(...sourceIntervalsAsSemitones)
      const targetInterval = sourceSlot.intervals
        .find(interval => Interval.semitones(interval) === targetIntervalSemitoneValue)
      if (targetInterval === undefined) return slots
      const shiftedTargetInterval = Interval.shiftStep(targetInterval, destinationSlot.step)
      destinationSlot.intervals.push(Interval.simplify(shiftedTargetInterval))
      const newSourceSlotIntervals = sourceSlot.intervals.filter(interval => interval !== targetInterval)
      sourceSlot.intervals.splice(0, Infinity, ...newSourceSlotIntervals)
      return slots
    }
  
    function chineseWhisperIntervalFromSlotToSlot (
      slots: typeof stepSlots,
      from: IntervalTypes.SimpleStepValue,
      to: IntervalTypes.SimpleStepValue
    ): typeof stepSlots {
      if (from === to) return slots
      const distance = Math.abs(to - from)
      for (
        let iteration = 0;
        iteration < distance;
        iteration++) {
        moveIntervalToNeighbourSlot(
          slots,
          to > from
            ? from + iteration as IntervalTypes.SimpleStepValue
            : from - iteration as IntervalTypes.SimpleStepValue,
          to > from
        )
      }
      return slots
    }
  
    for (const {
      step,
      intervals,
      targetPressure
    } of stepSlots) {
      const nbToGive = intervals.length - targetPressure
      const slotsToFill = stepSlots.reduce((acc, curr) => {
        if (nbToGive <= acc.length) return acc
        if (curr.targetPressure <= curr.intervals.length) return acc
        const returnCurrSlotNTimes = Math.min(
          nbToGive - acc.length,
          curr.targetPressure - curr.intervals.length
        )
        return [...acc, ...new Array(returnCurrSlotNTimes).fill(curr)]
      }, [] as typeof stepSlots)
      for (const slotToFill of slotsToFill) {
        chineseWhisperIntervalFromSlotToSlot(
          stepSlots,
          step,
          slotToFill.step        
        )
      }
    }
    return stepSlots
      .sort((slotA, slotB) => slotA.step - slotB.step)
      .map(({ intervals }) => intervals.sort((intA, intB) => {
        return Interval.semitones(intA)
          - Interval.semitones(intB)
      }))
      .flat()
  }
  
  static binary (scale: ScaleTypes.Value): string {
    const intervalsAsSemitoneValues = scale.map(interval => absoluteModulo(
      Interval.semitones(interval),
      12
    ))
    const binArray = new Array(12)
      .fill(null)
      .map((_, pos) => intervalsAsSemitoneValues.includes(pos) ? 1 : 0)
      .reverse()
    const binStr = binArray.join('')
    return binStr
  }
  
  static fromBinary (binaryValue: ReturnType<typeof Scale.binary>): ScaleTypes.Value {
    return Scale.reallocate(binaryValue
      .split('')
      .reverse()
      .map((bit, pos) => {
        if (bit === '1') return Interval.simplify(
          Interval.rationalize({
            step: 0,
            alteration: pos
          }, true)
        )
      })
      .filter((item): item is IntervalTypes.SimpleValue => item !== undefined)
    )
  }
  
  static decimal (scale: ScaleTypes.Value): number {
    return parseInt(Scale.binary(scale), 2)
  }
  
  static fromDecimal (decimalValue: ReturnType<typeof Scale.decimal>): ScaleTypes.Value {
    return Scale.fromBinary(decimalValue.toString(2))
  }
  
  static pattern (scale: ScaleTypes.Value): string {
    return Scale.binary(scale)
      .split('')
      .reverse()
      .join('')
      .replaceAll('1', 'x')
      .replaceAll('0', '-')
  }
  
  static fromPattern (pattern: ReturnType<typeof Scale.pattern>): ScaleTypes.Value {
    return Scale.fromBinary(pattern
      .split('')
      .reverse()
      .join('')
      .replaceAll('x', '1')
      .replaceAll('-', '0')
    )
  }
  
  static distance (scaleA: ScaleTypes.Value, scaleB: ScaleTypes.Value): number {
    const aBits = Scale.binary(scaleA).split('').map(bit => parseInt(bit, 10))
    const bBits = Scale.binary(scaleB).split('').map(bit => parseInt(bit, 10))
    const moves = aBits.map((bit, i) => bit - (bBits[i] ?? 0)).filter(bit => bit !== 0)
    const positiveMoves = moves.filter(bit => bit === 1)
    const negativeMoves = moves.filter(bit => bit === -1)
    return Math.max(positiveMoves.length, negativeMoves.length)
  }

  static intervalsAtStep (
    scale: ScaleTypes.Value,
    step: IntervalTypes.SimpleStepValue
  ): ScaleTypes.Value {
    return scale.filter(int => int.step === step)
  }

  static hasSteps (
    scale: ScaleTypes.Value,
    _steps: IntervalTypes.SimpleStepValue | IntervalTypes.SimpleStepValue[]
  ): boolean {
    const steps = Array.isArray(_steps) ? _steps : [_steps]
    return steps.every(step => Scale.intervalsAtStep(scale, step).length > 0)
  }

  static hasIntervals (
    scale: ScaleTypes.Value,
    _intervals: IntervalTypes.SimpleValue | IntervalTypes.SimpleValue[]
  ): boolean {
    const intervals = Array.isArray(_intervals) ? _intervals : [_intervals]
    return intervals.every(interval => scale.find(int => {
      return int.step === interval.step
        && int.alteration === interval.alteration
    }))
  }

  static rotations (scale: ScaleTypes.Value): ScaleTypes.Value[] {
    return new Array(12)
      .fill(null)
      .map((_, rotationPos) => {
        const pretextInterval: IntervalTypes.Value = { step: 0, alteration: 0 }
        const rotationPosAsInterval = Interval.simplify(Interval.rationalize({
          step: 0,
          alteration: -1 * rotationPos
        }, true))
        return Interval.sort(scale.map(interval => {
          const pretextIntervalPlusThisInterval = Interval.add(interval, pretextInterval)
          const pretextIntervalPlusRotationInterval = Interval.add(
            rotationPosAsInterval,
            pretextIntervalPlusThisInterval
          )
          const outputInterval = Interval.between(
            pretextInterval,
            pretextIntervalPlusRotationInterval
          )
          return outputInterval
        })).map(interval => Interval.simplify(interval))
      })
  }
  
  static rotationalSymmetryAxes (scale: ScaleTypes.Value): number[] {
    const scalePattern = Scale.pattern(scale)
    const rotations = Scale.rotations(scale)
    return rotations
      .map(rotation => Scale.pattern(rotation))
      .map((rotationPattern, rotationPos) => rotationPattern === scalePattern
        ? rotationPos
        : undefined
      ).filter((elt): elt is number => elt !== undefined)
  }
  
  static modes (scale: ScaleTypes.Value, pure: boolean = false): ScaleTypes.Value[] {
    if (!pure) {
      const rotations = Scale.rotations(scale)
      return rotations.filter(rotation => {
        const decimalValue = Scale.decimal(rotation)
        return decimalValue % 2 !== 0
      })
    }
    const lowestInterval = scale.sort((intA, intB) => {
      const { step: stepA, alteration: altA } = intA
      const { step: stepB, alteration: altB } = intB
      if (stepA === stepB) return altA - altB
      else return stepA - stepB
    }).at(0)
    const lowestIntervalName = lowestInterval !== undefined
      ? Interval.name(lowestInterval)
      : undefined
    const rotations = Scale.rotations(scale)
    return rotations.filter(rotation => {
      const rotationLowestInterval = rotation.sort((intA, intB) => {
        const { step: stepA, alteration: altA } = intA
        const { step: stepB, alteration: altB } = intB
        if (stepA === stepB) return altA - altB
        else return stepA - stepB
      }).at(0)
      const rotationLowestIntervalName = rotationLowestInterval !== undefined
        ? Interval.name(rotationLowestInterval)
        : undefined
      return rotationLowestIntervalName === lowestIntervalName
    })
  }
  
  static reflections (scale: ScaleTypes.Value): ScaleTypes.Value[] {
    const rotations = Scale.rotations(scale)
    return rotations.map(rotation => {
      const patternArr = Scale.pattern(rotation).split('')
      const rotatedPattern = [patternArr[0], ...patternArr.slice(1).reverse()].join('')
      const reflected = Scale.fromPattern(rotatedPattern)
      return reflected
    })
  }
  
  static reflectionSymmetryAxes (scale: ScaleTypes.Value): number[] {
    const scalePattern = Scale.pattern(scale)
    const reflections = Scale.reflections(scale)
    return reflections
      .map(reflection => Scale.pattern(reflection))
      .map((reflectionPattern, reflectionPos) => reflectionPattern === scalePattern ? reflectionPos : undefined)
      .filter((elt): elt is number => elt !== undefined)
  }
  
  static negation (scale: ScaleTypes.Value): ScaleTypes.Value {
    const scalePattern = Scale.pattern(scale)
    const negatedPattern = scalePattern
      .replaceAll('x', 'y')
      .replaceAll('-', 'x')
      .replaceAll('y', '-')
    return Scale.fromPattern(negatedPattern)
  }
  
  static supersets (scale: ScaleTypes.Value): ScaleTypes.Value[] {
    const pattern = Scale.pattern(scale)
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
        const superset = Scale.fromPattern(supersetPattern)
        return superset
      })
  }
  
  static subsets (scale: ScaleTypes.Value): ScaleTypes.Value[] {
    const pattern = Scale.pattern(scale)
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
        const subset = Scale.fromPattern(subsetPattern)
        return subset
      })
  }
  
  static rahmPrimeForm (scale: ScaleTypes.Value): ScaleTypes.Value {
    const allForms = [
      ...Scale.rotations(scale),
      ...Scale.reflections(scale)
    ]
    const minOddDecimalValue = Math.min(...allForms
      .map(scale => Scale.decimal(scale))
      .filter(scale => scale % 2 !== 0)
    )
    const asScale = Scale.fromDecimal(minOddDecimalValue)
    return asScale
  }
  
  static merge (
    scaleA: ScaleTypes.Value,
    scaleB: ScaleTypes.Value
  ): ScaleTypes.Value {
    const merged = [...scaleA, ...scaleB]
    const sorted = Interval.sort(merged)
    const deduped = Interval.dedupe(sorted)
    return deduped
  }
  
  static part (
    scaleA: ScaleTypes.Value,
    scaleB: ScaleTypes.Value
  ): ScaleTypes.Value {
    const scaleAWithNames = scaleA.map(int => ({
      interval: int,
      intervalName: Interval.name(int)
    }))
    const scaleBNames = scaleB.map(int => Interval.name(int))
    const filteredScaleAWithNames = scaleAWithNames.filter(item => !scaleBNames.includes(item.intervalName))
    return filteredScaleAWithNames.map(item => item.interval)
  }
  
  static omitStep (
    scale: ScaleTypes.Value,
    _steps: IntervalTypes.SimpleStepValue
      | IntervalTypes.SimpleStepValue[]
  ): ScaleTypes.Value {
    // [WIP] use Scale.part and Scale.intervalsAtStep ?
    const steps = Array.isArray(_steps) ? _steps : [_steps]
    return scale.filter(int => !steps.includes(int.step))
  }

  static isMajor (scale: ScaleTypes.Value): boolean {
    return Scale.hasIntervals(scale, Interval.commonNames.majorThird)
  }

  static isMinor (scale: ScaleTypes.Value): boolean {
    return !Scale.isMajor(scale)
      && Scale.hasIntervals(scale, Interval.commonNames.minorThird)
  }
  
  static qualityTableSort (_qualityTable: ScaleTypes.QualityTable): ScaleTypes.QualityTable {
    const qualityTable = { ..._qualityTable }
    type NameAndSemitonesObj = {
      name: string
      semitoneValue: number
    };
    qualityTable.accidents = qualityTable.accidents.map(step => {
      return step
        .map(intName => {
          const int = Interval.fromName(intName)
          if (int === undefined) return undefined
          const semitoneValue = Interval.semitones(int)
          return { name: intName, semitoneValue }
        })
        .filter((e): e is NameAndSemitonesObj => e !== undefined)
        .sort((eA, eB) => eA.semitoneValue - eB.semitoneValue)
        .map(e => e.name)
      }) as ScaleTypes.QualityTable['accidents']
  
    qualityTable.omissions = qualityTable.omissions.map(step => {
      return step
        .map(intName => {
          const isOwnStep = regexpUtils.stringIs(intName, REGEXPS.ownStep)
          if (isOwnStep) return {
            name: intName,
            semitoneValue: -Infinity
          }
          const int = Interval.fromName(intName)
          if (int === undefined) return undefined
          const semitoneValue = Interval.semitones(int)
          return {
            name: intName,
            semitoneValue
          }
        })
        .filter((e): e is NameAndSemitonesObj => e !== undefined)
        .sort((eA, eB) => eA.semitoneValue - eB.semitoneValue)
        .map(e => e.name)
      }) as ScaleTypes.QualityTable['omissions']
    qualityTable.additions = qualityTable.additions.map(step => {
      return step
        .map(intName => {
          const int = Interval.fromName(intName)
          if (int === undefined) return undefined
          const semitoneValue = Interval.semitones(int)
          return {
            name: intName,
            semitoneValue
          }
        })
        .filter((e): e is NameAndSemitonesObj => e !== undefined)
        .sort((eA, eB) => eA.semitoneValue - eB.semitoneValue)
        .map(e => e.name)
      }) as ScaleTypes.QualityTable['additions']
      return qualityTable
  }
  
  static qualityTable (scale: ScaleTypes.Value): ScaleTypes.QualityTable {    
    const hasFirst = Scale.hasIntervals(scale, Interval.commonNames.first)
    const hasAnyFirst = Scale.hasSteps(scale, 0)
    const hasMajorSecond = Scale.hasIntervals(scale, Interval.commonNames.majorSecond)
    const hasMinorSecond = Scale.hasIntervals(scale, Interval.commonNames.minorSecond)
    const hasMajorThird = Scale.hasIntervals(scale, Interval.commonNames.majorThird)
    const hasMinorThird = Scale.hasIntervals(scale, Interval.commonNames.minorThird)
    const hasAnyThird = Scale.hasSteps(scale, 2)
    const isMajor = Scale.isMajor(scale)
    const isMinor = Scale.isMinor(scale)
    const hasPerfectFourth = Scale.hasIntervals(scale, Interval.commonNames.perfectFourth)
    const hasAugmentedFourth = Scale.hasIntervals(scale, Interval.commonNames.augmentedFourth)
    const hasPerfectFifth = Scale.hasIntervals(scale, Interval.commonNames.perfectFifth)
    const hasDiminishedFifth = Scale.hasIntervals(scale, Interval.commonNames.diminishedFifth)
    const hasAugmentedFifth = Scale.hasIntervals(scale, Interval.commonNames.augmentedFifth)
    const hasAnyFifth = Scale.hasSteps(scale, 4)
    const hasMajorSixth = Scale.hasIntervals(scale, Interval.commonNames.majorSixth)
    const hasMinorSixth = Scale.hasIntervals(scale, Interval.commonNames.minorSixth)
    const hasMajorSeventh = Scale.hasIntervals(scale, Interval.commonNames.majorSeventh)
    const hasMinorSeventh = Scale.hasIntervals(scale, Interval.commonNames.minorSeventh)
    const hasDiminishedSeventh = Scale.hasIntervals(scale, Interval.commonNames.diminishedSeventh)
    const hasExtensionsBelowThirteenth = hasMinorSeventh
      || hasMajorSeventh
      || hasMinorSecond
      || hasMajorSecond
      || hasPerfectFourth
      || hasAugmentedFourth
  
    type S = string[]
    const namedIntervals = scale.map(int => Interval.name(int))
    const qualityTable = {
      mainQuality: MainQualities.OMITTED_MAJOR,
      hasMinorQuality: false,
      accidents: new Array(7).fill(null).map(_ => ([] as S)) as ScaleTypes.QualityTable['accidents'],
      omissions: new Array(7).fill(null).map(_ => ([] as S)) as ScaleTypes.QualityTable['omissions'],
      additions: new Array(7).fill(null).map(_ => ([] as S)) as ScaleTypes.QualityTable['additions'],
      leftovers: namedIntervals,
      inversion: null
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
      hasPerfectFourth: boolean,
      hasAugmentedFourth: boolean
    ) => {
      if (hasPerfectFourth && hasAugmentedFourth) {
        qualityTable.additions[3].push('#11')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['4', '#4'].includes(i))
      } else if (hasPerfectFourth) {
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['4'].includes(i))
      } else if (hasAugmentedFourth) {
        qualityTable.accidents[3].push('#11')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['#4'].includes(i))
      } else {
        qualityTable.omissions[3].push('11')
      }
    }
  
    const handleNinthsWhenExpected = (
      hasMajorSecond: boolean,
      hasMinorSecond: boolean
    ) => {
      if (hasMajorSecond && hasMinorSecond) {
        qualityTable.additions[1].push('ß9')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2', 'ß2'].includes(i))
      } else if (hasMajorSecond) {
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
      } else if (hasMinorSecond) {
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
        const [accFifth, ...addFifths] = fifths as [string, ...string[]]
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
        const [accThird, ...addThirds] = thirds as [string, ...string[]]
        qualityTable.accidents[2].push(accThird)
        qualityTable.additions[2].push(...addThirds)
        qualityTable.leftovers = qualityTable.leftovers.filter(int => !thirds.includes(int))
      } else {
        qualityTable.omissions[2].push('3')
      }
    }
  
    if (isDim) { // Diminished
      qualityTable.mainQuality = MainQualities.DIM
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß3', 'ß5'].includes(i))
      
      if (hasMajorSixth) { // dim + 13th
        qualityTable.mainQuality = MainQualities.SIX
        qualityTable.hasMinorQuality = true
        qualityTable.accidents[4].push('ß5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['6'].includes(i))
        if (hasExtensionsBelowThirteenth) {
          qualityTable.mainQuality = MainQualities.THIRTEEN
          // M
          if (hasMajorSeventh && !hasMinorSeventh) {
            qualityTable.mainQuality = MainQualities.MAJ_THIRTEEN
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
          }
          // 11th
          handleEleventhsWhenExpected(hasPerfectFourth, hasAugmentedFourth)
          // 9th
          handleNinthsWhenExpected(hasMajorSecond, hasMinorSecond)
          // 7th
          handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
        }
      
      } else if (hasMinorSixth) { // dim + ß13th
        qualityTable.mainQuality = MainQualities.FLAT_SIX
        qualityTable.hasMinorQuality = true
        qualityTable.accidents[4].push('ß5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß6'].includes(i))
        if (hasExtensionsBelowThirteenth) {
          qualityTable.mainQuality = MainQualities.FLAT_THIRTEEN
          // M
          if (hasMajorSeventh && !hasMinorSeventh) {
            qualityTable.mainQuality = MainQualities.MAJ_FLAT_THIRTEEN
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
          }
          // 11th
          handleEleventhsWhenExpected(hasPerfectFourth, hasAugmentedFourth)
          // 9th
          handleNinthsWhenExpected(hasMajorSecond, hasMinorSecond)
          // 7th
          handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
        }
  
      } else if (hasPerfectFourth) { // dim + 11th
        qualityTable.mainQuality = MainQualities.ELEVEN
        qualityTable.hasMinorQuality = true
        qualityTable.accidents[4].push('ß5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['4'].includes(i))
        if (hasMajorSeventh && !hasMinorSeventh) { // M
          qualityTable.mainQuality = MainQualities.MAJ_ELEVEN
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
        }
        // 9th
        handleNinthsWhenExpected(hasMajorSecond, hasMinorSecond)
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
  
      } else if (hasPerfectFourth) { // dim + #11th
        qualityTable.mainQuality = MainQualities.SHARP_ELEVEN
        qualityTable.hasMinorQuality = true
        qualityTable.accidents[4].push('ß5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['#4'].includes(i))
        if (hasMajorSeventh && !hasMinorSeventh) { // M
          qualityTable.mainQuality = MainQualities.MAJ_SHARP_ELEVEN
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
        }
        // 9th
        handleNinthsWhenExpected(hasMajorSecond, hasMinorSecond)
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
        
      } else if (hasMajorSecond) { // dim + 9th
        qualityTable.mainQuality = MainQualities.NINE
        qualityTable.hasMinorQuality = true
        qualityTable.accidents[4].push('ß5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
        if (hasMajorSeventh && !hasMinorSeventh) { // M
          qualityTable.mainQuality = MainQualities.MAJ_NINE
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
        }
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
      
      } else if (hasMinorSecond) { // dim + ß9th
        qualityTable.mainQuality = MainQualities.FLAT_NINE
        qualityTable.hasMinorQuality = true
        qualityTable.accidents[4].push('ß5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß2'].includes(i))
        if (hasMajorSeventh && !hasMinorSeventh) { // M
          qualityTable.mainQuality = MainQualities.MAJ_FLAT_NINE
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
        }
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
  
      } else if (hasDiminishedSeventh) { // dim + ßß7th
        qualityTable.mainQuality = MainQualities.DIM_SEVEN
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ßß7'].includes(i))
      
      } else if (hasMinorSeventh) { // dim + ß7th
        qualityTable.mainQuality = MainQualities.SEVEN
        qualityTable.hasMinorQuality = true
        qualityTable.accidents[4].push('ß5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß7'].includes(i))
      
      } else if (hasMajorSeventh) { // dim + 7th
        qualityTable.mainQuality = MainQualities.MAJ_SEVEN
        qualityTable.hasMinorQuality = true
        qualityTable.accidents[4].push('ß5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
      }
    
    } else if (isAug) { // Augmented
      qualityTable.mainQuality = MainQualities.AUG
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['3', '#5'].includes(i))
  
      if (hasMajorSixth) { // aug + 13th
        qualityTable.mainQuality = MainQualities.SIX
        qualityTable.accidents[4].push('#5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['6'].includes(i))
        if (hasExtensionsBelowThirteenth) {
          qualityTable.mainQuality = MainQualities.THIRTEEN
          // M
          if (hasMajorSeventh && !hasMinorSeventh) {
            qualityTable.mainQuality = MainQualities.MAJ_THIRTEEN
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
          }
          // 11th
          handleEleventhsWhenExpected(hasPerfectFourth, hasAugmentedFourth)
          // 9th
          handleNinthsWhenExpected(hasMajorSecond, hasMinorSecond)
          // 7th
          handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
        }
      
      } else if (hasMinorSixth) { // aug + ß13th
        qualityTable.mainQuality = MainQualities.FLAT_SIX
        qualityTable.accidents[4].push('#5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß6'].includes(i))
        if (hasExtensionsBelowThirteenth) {
          qualityTable.mainQuality = MainQualities.FLAT_THIRTEEN
          // M
          if (hasMajorSeventh && !hasMinorSeventh) {
            qualityTable.mainQuality = MainQualities.MAJ_FLAT_THIRTEEN
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
          }
          // 11th
          handleEleventhsWhenExpected(hasPerfectFourth, hasAugmentedFourth)
          // 9th
          handleNinthsWhenExpected(hasMajorSecond, hasMinorSecond)
          // 7th
          handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
        }
  
      } else if (hasPerfectFourth) { // aug + 11th
        qualityTable.mainQuality = MainQualities.ELEVEN
        qualityTable.accidents[4].push('#5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['4'].includes(i))
        if (hasMajorSeventh && !hasMinorSeventh) { // M
          qualityTable.mainQuality = MainQualities.MAJ_ELEVEN
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
        }
        // 9th
        handleNinthsWhenExpected(hasMajorSecond, hasMinorSecond)
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
  
      } else if (hasPerfectFourth) { // aug + #11th
        qualityTable.mainQuality = MainQualities.SHARP_ELEVEN
        qualityTable.accidents[4].push('#5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['#4'].includes(i))
        if (hasMajorSeventh && !hasMinorSeventh) { // M
          qualityTable.mainQuality = MainQualities.MAJ_SHARP_ELEVEN
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
        }
        // 9th
        handleNinthsWhenExpected(hasMajorSecond, hasMinorSecond)
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
        
      } else if (hasMajorSecond) { // aug + 9th
        qualityTable.mainQuality = MainQualities.NINE
        qualityTable.accidents[4].push('#5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
        if (hasMajorSeventh && !hasMinorSeventh) { // M
          qualityTable.mainQuality = MainQualities.MAJ_NINE
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
        }
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
      
      } else if (hasMinorSecond) { // aug + ß9th
        qualityTable.mainQuality = MainQualities.FLAT_NINE
        qualityTable.accidents[4].push('#5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß2'].includes(i))
        if (hasMajorSeventh && !hasMinorSeventh) { // M
          qualityTable.mainQuality = MainQualities.MAJ_FLAT_NINE
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
        }
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
  
      } else if (hasMinorSeventh) { // aug + ß7th
        qualityTable.mainQuality = MainQualities.AUG_SEVEN
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß7'].includes(i))
      
      } else if (hasMajorSeventh) { // aug + 7th
        qualityTable.mainQuality = MainQualities.AUG_MAJ_SEVEN
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
      
      } else if (hasDiminishedSeventh) { // aug + ßß7th
        qualityTable.mainQuality = MainQualities.AUG_DIM_SEVEN
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ßß7'].includes(i))
      }
  
    } else { // Not diminished nor augmented
  
      if (hasMajorSixth) { // 13th
        qualityTable.mainQuality = MainQualities.SIX
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['6'].includes(i))
        if (hasExtensionsBelowThirteenth) {
          qualityTable.mainQuality = MainQualities.THIRTEEN
          // M
          if (hasMajorSeventh && !hasMinorSeventh) {
            qualityTable.mainQuality = MainQualities.MAJ_THIRTEEN
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
          }
          // 11th
          handleEleventhsWhenExpected(hasPerfectFourth, hasAugmentedFourth)
          // 9th
          handleNinthsWhenExpected(hasMajorSecond, hasMinorSecond)
          // 7th
          handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
        }
        // 5th
        handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
        // 3rd
        handleThirdsWhenExpected(isMajor, isMinor, hasAnyThird)
  
      } else if (hasMinorSixth) { // ß13
        qualityTable.mainQuality = MainQualities.FLAT_SIX
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß6'].includes(i))
        if (hasExtensionsBelowThirteenth) {
          qualityTable.mainQuality = MainQualities.FLAT_THIRTEEN
          // M
          if (hasMajorSeventh && !hasMinorSeventh) {
            qualityTable.mainQuality = MainQualities.MAJ_FLAT_THIRTEEN
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
          }
          // 11th
          handleEleventhsWhenExpected(hasPerfectFourth, hasAugmentedFourth)
          // 9th
          handleNinthsWhenExpected(hasMajorSecond, hasMinorSecond)
          // 7th
          handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
        }
        // 5th
        handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
        // 3rd
        handleThirdsWhenExpected(isMajor, isMinor, hasAnyThird)
  
      } else if (hasPerfectFourth) { // 11
        qualityTable.mainQuality = MainQualities.ELEVEN
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['4'].includes(i))
  
        if (namedIntervals.length === 2 && hasFirst) { // Only 1 and 4 => 4
          qualityTable.mainQuality = MainQualities.FOUR
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['1'].includes(i))
        } else if (!hasMajorThird && !hasMinorThird) { // No 3 or ß3 => sus4
          qualityTable.mainQuality = MainQualities.SUS_4
          if (hasMinorSeventh) {
            qualityTable.mainQuality = MainQualities.SEVEN_SUS_4
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß7'].includes(i))
            if (hasMajorSecond) {
              qualityTable.mainQuality = MainQualities.SEVEN_SUS_24
              qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
            } else if (hasMinorSecond) {
              qualityTable.mainQuality = MainQualities.SEVEN_SUS_FLAT_2_4
              qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß2'].includes(i))
            }
          } else if (hasMajorSeventh) {
            qualityTable.mainQuality = MainQualities.MAJ_SEVEN_SUS_4
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
            if (hasMajorSecond) {
              qualityTable.mainQuality = MainQualities.MAJ_SEVEN_SUS_24
              qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
            } else if (hasMinorSecond) {
              qualityTable.mainQuality = MainQualities.MAJ_SEVEN_SUS_FLAT_2_4
              qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß2'].includes(i))
            }
          } else if (hasMajorSecond) {
            qualityTable.mainQuality = MainQualities.SUS_24
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
          } else if (hasMinorSecond) {
            qualityTable.mainQuality = MainQualities.SUS_FLAT_2_4
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß2'].includes(i))
          }
          // 5th
          handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
  
        } else { // Has 3 or ß3
          // M
          if (hasMajorSeventh && !hasMinorSeventh) {
            qualityTable.mainQuality = MainQualities.MAJ_ELEVEN
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
          }
          // 9th
          handleNinthsWhenExpected(hasMajorSecond, hasMinorSecond)
          // 7th
          handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
          // 5th
          handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
          // 3rd
          handleThirdsWhenExpected(isMajor, isMinor, hasAnyThird)
        }
  
      // #11
      } else if (hasAugmentedFourth) {
        qualityTable.mainQuality = MainQualities.SHARP_ELEVEN
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['#4'].includes(i))
  
        if (!hasMajorThird && !hasMinorThird) { // No 3 or ß3, => sus#4
          qualityTable.mainQuality = MainQualities.SUS_SHARP_4
          if (hasMinorSeventh) {
            qualityTable.mainQuality = MainQualities.SEVEN_SUS_SHARP_4
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß7'].includes(i))
            if (hasMajorSecond) {
              qualityTable.mainQuality = MainQualities.SEVEN_SUS_2_SHARP_4
              qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
            } else if (hasMinorSecond) {
              qualityTable.mainQuality = MainQualities.SEVEN_SUS_FLAT_2_SHARP_4
              qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß2'].includes(i))
            }
          } else if (hasMajorSeventh) {
            qualityTable.mainQuality = MainQualities.MAJ_SEVEN_SUS_SHARP_4
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
            if (hasMajorSecond) {
              qualityTable.mainQuality = MainQualities.MAJ_SEVEN_SUS_2_SHARP_4
              qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
            } else if (hasMinorSecond) {
              qualityTable.mainQuality = MainQualities.MAJ_SEVEN_SUS_FLAT_2_SHARP_4
              qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß2'].includes(i))
            }
          } else if (hasMajorSecond) {
            qualityTable.mainQuality = MainQualities.SUS_2_SHARP_4
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
          } else if (hasMinorSecond) {
            qualityTable.mainQuality = MainQualities.SUS_FLAT_2_SHARP_4
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß2'].includes(i))
          }
          // 5th
          handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
  
        } else { // Has 3 or ß3
          if (hasMajorSeventh && !hasMinorSeventh) { // M
            qualityTable.mainQuality = MainQualities.MAJ_SHARP_ELEVEN
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
          }
          // 9th
          handleNinthsWhenExpected(hasMajorSecond, hasMinorSecond)
          // 7th
          handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
          // 5th
          handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
          // 3rd
          handleThirdsWhenExpected(isMajor, isMinor, hasAnyThird)
        }
  
      } else if (hasMajorSecond) { // 9
        qualityTable.mainQuality = MainQualities.NINE        
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
        
        if (namedIntervals.length === 2 && hasFirst) { // Only 1 and 2 => 2
          qualityTable.mainQuality = MainQualities.TWO
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['1'].includes(i))
        } else if (!hasMajorThird && !hasMinorThird) { // No 3, ß3 => sus2
          qualityTable.mainQuality = MainQualities.SUS_2
          if (hasMinorSeventh) {
            qualityTable.mainQuality = MainQualities.SEVEN_SUS_2
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß7'].includes(i))
          } else if (hasMajorSeventh) {
            qualityTable.mainQuality = MainQualities.MAJ_SEVEN_SUS_2
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
          }
          // 5th
          handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
        } else { // Has 3 or ß3
          // M
          if (hasMajorSeventh && !hasMinorSeventh) {
            qualityTable.mainQuality = MainQualities.MAJ_NINE
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
          }
          // 7th
          handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
          // 5th
          handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
          // 3rd
          handleThirdsWhenExpected(isMajor, isMinor, hasAnyThird)
        }
  
      } else if (hasMinorSecond) { // ß9
        qualityTable.mainQuality = MainQualities.FLAT_NINE
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß2'].includes(i))
        
        if (!hasMajorThird && !hasMinorThird) { // No 3, ß3 => susß2
          qualityTable.mainQuality = MainQualities.SUS_FLAT_2
          if (hasMinorSeventh) {
            qualityTable.mainQuality = MainQualities.SEVEN_SUS_FLAT_2
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß7'].includes(i))
          } else if (hasMajorSeventh) {
            qualityTable.mainQuality = MainQualities.MAJ_SEVEN_SUS_FLAT_2
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
          }
          // 5th
          handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)

        } else { // Has 3 or ß3
          if (hasMajorSeventh && !hasMinorSeventh) { // M
            qualityTable.mainQuality = MainQualities.MAJ_FLAT_NINE
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
          }
          // 7th
          handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
          // 5th
          handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
          // 3rd
          handleThirdsWhenExpected(isMajor, isMinor, hasAnyThird)
        }
  
      } else if (hasMinorSeventh) { // 7
        qualityTable.mainQuality = MainQualities.SEVEN
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß7'].includes(i))
        // 5th
        handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
        // 3rd
        handleThirdsWhenExpected(isMajor, isMinor, hasAnyThird)
  
      } else if (hasMajorSeventh) { // M7
        qualityTable.mainQuality = MainQualities.MAJ_SEVEN
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
        // 5th
        handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
        // 3rd
        handleThirdsWhenExpected(isMajor, isMinor, hasAnyThird)
  
      } else { // No extension
        if (namedIntervals.length === 2 && hasFirst && hasMajorThird) { // Only 1 and 3 => 3
          qualityTable.mainQuality = MainQualities.THREE
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['1', '3'].includes(i))
        } else if (namedIntervals.length === 2 && hasFirst && hasMinorThird) { // Only 1 and ß3 => m3
          qualityTable.mainQuality = MainQualities.THREE
          qualityTable.hasMinorQuality = true
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['1', 'ß3'].includes(i))
        } else if (namedIntervals.length === 2 && hasFirst && hasPerfectFifth) { // Only 1 and 5 => 5
          qualityTable.mainQuality = MainQualities.FIVE
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['1', '5'].includes(i))
        }
        // 5th
        handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
        // 3rd
        handleThirdsWhenExpected(isMajor, isMinor, hasAnyThird)
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
    new Array(7).fill(null).forEach((_, step) => {
      const stepName = `${step + 1}`
      const regex = new RegExp(stepName, 'igm')
      const foundInLeftovers = qualityTable.leftovers.filter(i => i.match(regex))
      foundInLeftovers.forEach(leftover => {
        qualityTable.additions[step as IntervalTypes.SimpleStepValue].push(leftover)
      })
    })
  
    return Scale.qualityTableSort(qualityTable)
  }
  
  static qualityTableToQuality (qualityTable: ScaleTypes.QualityTable): string {
    let quality = ''
    if (qualityTable.hasMinorQuality) quality += 'm'
    quality += qualityTable.mainQuality
    qualityTable.accidents.flat().forEach(accident => { quality += `${accident}` })
    const flattenedOmissions = qualityTable.omissions.flat()
    if (flattenedOmissions.length > 0) {
      quality += `no(${flattenedOmissions.join(REGEXPS.intervalsNameSeparator.source)})`
    }
    const flattenedAdditions = qualityTable.additions.flat()
    if (flattenedAdditions.length > 0) {
      quality += `add(${flattenedAdditions.join(REGEXPS.intervalsNameSeparator.source)})`
    }
    return quality
  }
  
  static quality (scale: ScaleTypes.Value): string {
    const qualityTable = Scale.qualityTable(scale)
    const quality = Scale.qualityTableToQuality(qualityTable)
    return quality
  }

  // [WIP] invertedQualities

  static qualityToQualityTable (quality: string): ScaleTypes.QualityTable {
    let workingQuality = quality
    const qualityTable: ScaleTypes.QualityTable = {
      mainQuality: MainQualities.OMITTED_MAJOR,
      hasMinorQuality: false,
      accidents: new Array(7).fill(null).map(e => ([])) as unknown as ScaleTypes.QualityTable['accidents'],
      omissions: new Array(7).fill(null).map(e => ([])) as unknown as ScaleTypes.QualityTable['omissions'],
      additions: new Array(7).fill(null).map(e => ([])) as unknown as ScaleTypes.QualityTable['additions'],
      leftovers: [],
      inversion: null
    }

    // Inversion
    const inversionBlockRegexp = regexpUtils.setFlags(REGEXPS.inversion, 'g')
    const inversionBlockMatchArr = workingQuality.match(inversionBlockRegexp) ?? []
    const inversionBlock = inversionBlockMatchArr.at(0)
    if (inversionBlock !== undefined) {
      workingQuality = workingQuality.replace(inversionBlockRegexp, '')
      const inversionIdentifierRegexp = regexpUtils.fromStart(REGEXPS.inversionIdentifier, 'g')
      const inversionIntOrOwnStep = inversionBlock.replace(inversionIdentifierRegexp, '')
      const isOwnStep = regexpUtils.stringIs(inversionIntOrOwnStep, REGEXPS.ownStep)
      if (isOwnStep) {
        const ownStepStartRegexp = regexpUtils.fromStart(REGEXPS.ownStepStart, 'g')
        const stepStr = inversionIntOrOwnStep.replace(ownStepStartRegexp, '')
        const intFromStep = Interval.fromName(stepStr)
        if (intFromStep !== undefined) {
          const int = Interval.simplify(intFromStep)
          qualityTable.inversion = int.step
        }
      } else {
        const int = Interval.fromName(inversionIntOrOwnStep)
        if (int !== undefined) { qualityTable.inversion = Interval.simplify(int) }
      }
    }
  
    // Minor quality
    const minorQualityRegexp = regexpUtils.fromStart(REGEXPS.minorQuality, 'g')
    qualityTable.hasMinorQuality = minorQualityRegexp.test(workingQuality)
    if (qualityTable.hasMinorQuality) workingQuality = workingQuality.replace(minorQualityRegexp, '')
  
    // Main quality
    const mainQualityRegexp = regexpUtils.fromStart(REGEXPS.mainQuality, 'g')
    const foundMainQuality = regexpUtils.stringStartsWith(workingQuality, mainQualityRegexp, true)?.at(0)
    if (foundMainQuality !== undefined && Scale.isMainQuality(foundMainQuality)) {
      qualityTable.mainQuality = foundMainQuality
    }
    workingQuality = workingQuality.slice(qualityTable.mainQuality.length)
  
    // Omissions
    const omissionBlocksRegex = regexpUtils.setFlags(REGEXPS.omissions, 'g')
    const omissionsBlocks = (workingQuality.match(omissionBlocksRegex) ?? [])      
    omissionsBlocks.forEach(omissionBlock => {
      workingQuality = workingQuality.replace(omissionBlock, '')
      const blockStartRegexp = regexpUtils.fromStart(REGEXPS.omissionsStart)
      const blockEndRegexp = regexpUtils.toEnd(REGEXPS.omissionsEnd)
      const omittedIntervalsNames = omissionBlock
        .replace(blockStartRegexp, '')
        .replace(blockEndRegexp, '')
        .split(regexpUtils.setFlags(REGEXPS.intervalsNameSeparator, 'g'))
      omittedIntervalsNames.forEach(intNameOrOwnStep => {
        const ownStepIdentifierRegexp = regexpUtils.fromStart(REGEXPS.ownStepStart, 'g')
        const intName = intNameOrOwnStep.replace(ownStepIdentifierRegexp, '')
        const int = Interval.fromName(intName)
        if (int === undefined) return;
        const step = Interval.simplify(int).step
        qualityTable.omissions[step].push(intNameOrOwnStep)
      })
    })
  
    // Additions
    const additionsBlocksRegex = regexpUtils.setFlags(REGEXPS.additions, 'g')
    const additionsBlocks = (workingQuality.match(additionsBlocksRegex) ?? [])
      .filter(e => typeof e === 'string')
    additionsBlocks.forEach(additionBlock => {
      workingQuality = workingQuality.replace(additionBlock, '')
      const additionsBlockStartRegexp = regexpUtils.fromStart(REGEXPS.additionsStart, 'g')
      const additionsBlockEndRegexp = regexpUtils.toEnd(REGEXPS.additionsEnd, 'g')
      const addedIntervalsNames = additionBlock
        .replace(additionsBlockStartRegexp, '')
        .replace(additionsBlockEndRegexp, '')
        .split(regexpUtils.setFlags(REGEXPS.intervalsNameSeparator, 'g'))
      addedIntervalsNames.forEach(intName => {
        const int = Interval.fromName(intName)
        if (int === undefined) return;
        const step = Interval.simplify(int).step
        qualityTable.additions[step].push(intName)
      })
    })
  
    // Accidents
    let whileLoopsCnt = 0
    while (true) {
      whileLoopsCnt++
      if (whileLoopsCnt >= 100) break;
      const accidentMatchArray = regexpUtils.stringStartsWith(workingQuality, REGEXPS.interval, true, 'g')
      const accident = accidentMatchArray?.at(0)
      if (accident === undefined) break;
      workingQuality = workingQuality.replace(accident, '')
      const intName = accident
      const int = Interval.fromName(intName)
      if (int === undefined) continue;
      const step = Interval.simplify(int).step
      qualityTable.accidents[step].push(intName)
    }
  
    return Scale.qualityTableSort(qualityTable)
  }
  
  static fromQualityTable (_qualityTable: ScaleTypes.QualityTable): ScaleTypes.Value {
    const {
      hasMinorQuality,
      mainQuality,
      accidents,
      omissions,
      additions,
      inversion
    } = Scale.qualityTableSort(_qualityTable)
    
    // Main quality
    const mainQualityScaleName = qualitiesToIntervalsNameMap.get(mainQuality) ?? '1,3,5'
    let returnedScale = Scale.fromIntervalsName(mainQualityScaleName)
    
    // Minor quality
    if (hasMinorQuality) {
      returnedScale = Scale.omitStep(returnedScale, 2)
      returnedScale = Scale.merge(returnedScale, Scale.fromIntervalsName('ß3'))
    }

    // Accidents
    accidents.forEach((intNames, step) => {
      if (intNames.length === 0) return
      const intNamesAsScale = intNames
        .map(intName => Interval.fromName(intName))
        .filter((int): int is IntervalTypes.Value => int !== undefined)
        .map(int => Interval.simplify(int))
      returnedScale = Scale.omitStep(returnedScale, step as IntervalTypes.SimpleStepValue)
      returnedScale = Scale.merge(returnedScale, intNamesAsScale)
    })

    // Omissions
    omissions.forEach((intNames, step) => {
      intNames.forEach(intName => {
        const isOwnStep = regexpUtils.stringStartsWith(intName, REGEXPS.ownStep)
        if (isOwnStep) {
          returnedScale = Scale.omitStep(returnedScale, step as IntervalTypes.SimpleStepValue)
        } else {
          const interval = Interval.fromName(intName)
          if (interval === undefined) return;
          const normalizedIntName = Interval.name(interval)
          returnedScale = Scale.part(returnedScale, Scale.fromIntervalsName(normalizedIntName))
        }
      })
    })

    // Additions
    const additionsScaleName = additions
      .flat()
      .map(intName => {
        const interval = Interval.fromName(intName)
        if (interval === undefined) return;
        const normalizedIntName = Interval.name(interval)
        return normalizedIntName
      })
      .filter(name => name !== undefined)
      .join(REGEXPS.intervalsNameSeparator.source)
    const additionsScale = Scale.fromIntervalsName(additionsScaleName)
    returnedScale = Scale.merge(returnedScale, additionsScale)

    // Inversion
    let inversionAsInterval: IntervalTypes.SimpleValue | undefined = undefined
    if (typeof inversion === 'number') { // on own step
      const ownIntervals = Scale.intervalsAtStep(returnedScale, inversion)
      const lesserAlteration = Alteration.lessAltered(...ownIntervals.map(int => int.alteration))
      if (lesserAlteration !== undefined) {
        const ownInterval = ownIntervals.find(int => int.alteration === lesserAlteration)
        inversionAsInterval = ownInterval
      }
    } else if (inversion !== null) { // on interval
      inversionAsInterval = inversion
    }
    if (inversionAsInterval !== undefined) {
      if (!Scale.hasIntervals(returnedScale, inversionAsInterval)) {
        returnedScale.push(inversionAsInterval)
        returnedScale = Interval.dedupe(Interval.sort(returnedScale))
      }
      const invIntAsSemitones = Interval.semitones(inversionAsInterval)
      const rotations = Scale.rotations(returnedScale)
      const inverted = rotations.at(invIntAsSemitones)
      if (inverted !== undefined) { returnedScale = Interval.sort(inverted) }
    }

    return Interval.sort(returnedScale)
      .map(int => Interval.simplify(int))
  }
  
  static fromQuality (quality: string): ScaleTypes.Value {
    const table = Scale.qualityToQualityTable(quality)
    return Scale.fromQualityTable(table)
  }

  static commonName (scale: ScaleTypes.Value): ScaleTypes.Name | undefined {
    const decimalValue = Scale.decimal(scale)
    const commonName = scalesData.decimalValueToCommonNamesMap.get(decimalValue)
    return commonName
  }
  
  static thematicNames (
    scale: ScaleTypes.Value,
    category: string | null = null
  ): Array<{ category: string, name: string }> {
    const decimalValue = Scale.decimal(scale)
    const thematicNames = scalesData.decimalValueToThematicNamesMap
      .get(decimalValue) ?? []
    if (category === null) return thematicNames
    return thematicNames.filter(item => item.category === category)
  }
  
  static fromThematicName (name: string, defaultToMajor: true): ScaleTypes.Value
  static fromThematicName (name: string, defaultToMajor: false): ScaleTypes.Value | undefined
  static fromThematicName (name: string): ScaleTypes.Value | undefined
  static fromThematicName (name: string, defaultToMajor = false): ScaleTypes.Value | undefined {
    const defaultReturn = defaultToMajor ? Scale.fromIntervalsName('1,2,3,4,5,6,7') : undefined
    const [nameRootAndMods, inversionBlock] = name.split(regexpUtils.setFlags(REGEXPS.inversionIdentifier, 'g'))
    if (nameRootAndMods === undefined) return defaultReturn
    const [nameRoot, ...modifiersArr] = nameRootAndMods.split(regexpUtils.setFlags(REGEXPS.intervalsNameSeparator, 'g'))
    if (nameRoot === undefined) return defaultReturn
    const modifiersBlock = modifiersArr.join(REGEXPS.intervalsNameSeparator.source)
    let foundDecimalValue: number | undefined = undefined
    scalesData.decimalValueToThematicNamesMap.forEach((nameItems, decimalValue) => {
      if (foundDecimalValue !== undefined) return;
      const names = nameItems.map(nameItem => nameItem.name)
      if (names.includes(toAlphanum(nameRoot, '_').toLowerCase())) { foundDecimalValue = decimalValue }
    })
    if (foundDecimalValue !== undefined) {
      const scaleRoot = Scale.fromDecimal(foundDecimalValue)
      const scaleRootQuality = Scale.quality(scaleRoot)
      const inversionIdiom = inversionBlock !== undefined
        && inversionBlock !== ''
        ? `/${inversionBlock}`
        : ''
      const scaleQualityWithModsAndInv = `${scaleRootQuality}${modifiersBlock}${inversionIdiom}`
      return Scale.fromQuality(scaleQualityWithModsAndInv)
    }
    return defaultReturn
  }

  static fromCommonName (name: string, excludeThematicNames: boolean, defaultToMajor: true): ScaleTypes.Value
  static fromCommonName (name: string, excludeThematicNames: boolean, defaultToMajor: false): ScaleTypes.Value | undefined
  static fromCommonName (name: string): ScaleTypes.Value | undefined
  static fromCommonName (name: string, excludeThematicNames = false, defaultToMajor = false): ScaleTypes.Value | undefined {
    const defaultReturn = defaultToMajor ? Scale.fromIntervalsName('1,2,3,4,5,6,7') : undefined
    const [nameRootAndMods, inversionBlock] = name.split(regexpUtils.setFlags(REGEXPS.inversionIdentifier, 'g'))
    if (nameRootAndMods === undefined) return defaultReturn
    const [nameRoot, ...modifiersArr] = nameRootAndMods.split(regexpUtils.setFlags(REGEXPS.intervalsNameSeparator, 'g'))
    if (nameRoot === undefined) return defaultReturn
    const modifiersBlock = modifiersArr.join(REGEXPS.intervalsNameSeparator.source)
    const decimalValueAndNameFromCommonNames = [...scalesData.decimalValueToCommonNamesMap
      .entries()]
      .find(([, commonName]) => commonName === toAlphanum(nameRoot, '_').toLowerCase())
    if (decimalValueAndNameFromCommonNames !== undefined) {
      const decimalValue = decimalValueAndNameFromCommonNames[0]
      const scaleRoot = Scale.fromDecimal(decimalValue)
      const scaleRootQuality = Scale.quality(scaleRoot)
      const inversionIdiom = inversionBlock !== undefined
        && inversionBlock !== ''
        ? `/${inversionBlock}`
        : ''
      const scaleQualityWithModsAndInv = `${scaleRootQuality}${modifiersBlock}${inversionIdiom}`
      return Scale.fromQuality(scaleQualityWithModsAndInv)
    }
    if (excludeThematicNames) return defaultReturn
    return defaultToMajor
      ? Scale.fromThematicName(name, true)
      : Scale.fromThematicName(name)
  }
}

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

/* Chord */

export namespace ChordTypes {
  export type Value = {
    base: IntervalTypes.Value
    scale: ScaleTypes.Value
  }
  export type Name = string
}

export class Chord {
  // name => (alt)? (sign)? (roman) ((name + mod | quality + mod) / (inv) \ (root))?
  // ß-IV

  static name (value: ChordTypes.Value) {
    const alterationName = Alteration.name(value.base.alteration)
    const baseStep = value.base.step
    const offsetBaseStep = baseStep >= 0 ? baseStep + 1 : baseStep - 1
    const isMinor = Scale.isMinor(value.scale)
    const offsetBaseStepIsPositive = offsetBaseStep > 0
    const romanized = romanize(Math.abs(offsetBaseStep)) ?? 'I' // romanize should be safe here and never return undefined
    const romanName = isMinor ? romanized.toLowerCase() : romanized.toUpperCase()
    const romanSign = offsetBaseStepIsPositive ? '' : '-'
    const rawQuality = Scale.quality(value.scale)
    const minorQualityRegexp = regexpUtils.fromStart(REGEXPS.minorQuality, 'g')
    const quality = isMinor
      ? rawQuality.replace(minorQualityRegexp, '')
      : rawQuality
    return `${alterationName}${romanSign}${romanName}${quality}`
  }

  static fromName (name: ChordTypes.Name) {
    let workingName = name
    // Alteration
    const alterationMatchArr = (regexpUtils.stringStartsWith(workingName, REGEXPS.alteration, true) ?? [])
      .filter(str => str !== '')
      .sort((a, b) => b.length - a.length)
    const alterationStr = alterationMatchArr.at(0) ?? ''
    const alteration = alterationStr !== '' ? Alteration.fromName(alterationStr) : 0
    workingName = workingName.replace(alterationStr, '')
    // Sign
    const signMatchArr = (regexpUtils.stringStartsWith(workingName, /-/, true) ?? [])
      .filter(str => str !== '')
      .sort((a, b) => b.length - a.length)
    const signStr = signMatchArr.at(0) ?? ''
    const isNegative = signStr === '-'
    workingName = workingName.replace(signStr, '')
    // Offset
    const offsetMatchArr = (regexpUtils.stringEndsWith(workingName, REGEXPS.offset, true) ?? [])
      .filter(str => str !== '')
      .sort((a, b) => b.length - a.length)
    const offsetStr = offsetMatchArr.at(0) ?? ''
    const offset = offsetStr
    workingName = workingName.replace(regexpUtils.toEnd(REGEXPS.offset), '')
    // Inversion
    const inversionMatchArr = (regexpUtils.stringEndsWith(workingName, REGEXPS.inversion, true) ?? [])
      .filter(str => str !== '')
      .sort((a, b) => b.length - a.length)
    const inversionStr = inversionMatchArr.at(0) ?? ''
    const inversion = inversionStr
    workingName = workingName.replace(regexpUtils.toEnd(REGEXPS.inversion), '')
    // Quality or common name root
    let qualityOrCommonNameRootStr: string
    let qualityOrCommonNameExtensionStr: string
    const qualityRootRegexp = regexpUtils.setFlags(REGEXPS.qualityRoot, 'g')
    const qualityMatchArr = (workingName.match(qualityRootRegexp) ?? []) //regexpUtils.stringEndsWith(workingName, REGEXPS.quality, true) ?? []
      .filter(str => str !== '')
      .sort((a, b) => b.length - a.length)
    const qualityStr = qualityMatchArr.at(0)
    if (qualityStr !== undefined && qualityStr !== '') {
      qualityOrCommonNameRootStr = qualityStr
      workingName = workingName.replace(qualityStr, '')
      const qualityExtensionRegexp = regexpUtils.toEnd(regexpUtils.setFlags(REGEXPS.qualityExtension, 'g')) // regexpUtils.stringEndsWith(workingName, REGEXPS.qualityExtension, true)
      const qualityExtensionMatchArr = (workingName.match(qualityExtensionRegexp) ?? [])
        .filter(str => str !== '')
        .sort((a, b) => b.length - a.length)
      const qualityExtStr = qualityExtensionMatchArr.at(0)
      console.log(workingName)
      console.log(qualityExtensionRegexp.source)
      qualityOrCommonNameExtensionStr = qualityExtStr ?? ''
      workingName = workingName.replace(qualityExtensionRegexp, '')
    } else {
      const commonNameRootRegexp = regexpUtils.setFlags(REGEXPS.commonNameRoot, 'g')
      const commonNameMatchArr = (workingName.match(commonNameRootRegexp) ?? []) //regexpUtils.stringEndsWith(workingName, REGEXPS.commonName, true) ?? []
        .filter(str => str !== '')
        .sort((a, b) => b.length - a.length)
      const commonNameStr = commonNameMatchArr.at(0)
      if (commonNameStr !== undefined && commonNameStr !== '') {
        qualityOrCommonNameRootStr = commonNameStr
        workingName = workingName.replace(commonNameStr, '')
        const commonNameExtensionRegexp = regexpUtils.toEnd(regexpUtils.setFlags(REGEXPS.commonNameExtension, 'g')) // regexpUtils.stringEndsWith(workingName, REGEXPS.commonNameExtension, true)
        const commonNameExtensionMatchArr = (workingName.match(commonNameExtensionRegexp) ?? [])
          .filter(str => str !== '')
          .sort((a, b) => b.length - a.length)
        const commonNameExtStr = commonNameExtensionMatchArr.at(0)
        qualityOrCommonNameExtensionStr = commonNameExtStr ?? ''
        workingName = workingName.replace(commonNameExtensionRegexp, '')
      } else {
        const thematicNameRootRegexp = regexpUtils.setFlags(REGEXPS.thematicNameRoot, 'g')
        const thematicNameMatchArr = (workingName.match(thematicNameRootRegexp) ?? []) //regexpUtils.stringEndsWith(workingName, REGEXPS.thematicName, true) ?? []
          .filter(str => str !== '')
          .sort((a, b) => b.length - a.length)
        const thematicNameStr = thematicNameMatchArr.at(0)
        if (thematicNameStr !== undefined && thematicNameStr !== '') {
          qualityOrCommonNameRootStr = thematicNameStr
          workingName = workingName.replace(thematicNameStr, '')
          const thematicNameExtensionRegexp = regexpUtils.toEnd(regexpUtils.setFlags(REGEXPS.thematicNameExtension, 'g')) // regexpUtils.stringEndsWith(workingName, REGEXPS.thematicNameExtension, true)
          const thematicNameExtensionMatchArr = (workingName.match(thematicNameExtensionRegexp) ?? [])
            .filter(str => str !== '')
            .sort((a, b) => b.length - a.length)
          const thematicNameExtStr = thematicNameExtensionMatchArr.at(0)
          qualityOrCommonNameExtensionStr = thematicNameExtStr ?? ''
          workingName = workingName.replace(thematicNameExtensionRegexp, '')
        } else {
          qualityOrCommonNameRootStr = ''
          qualityOrCommonNameExtensionStr = ''
        }
      }
    }
    
    // Roman
    const romanRegexp = regexpUtils.setFlags(REGEXPS.roman, 'ig')
    const romanMatchArr = regexpUtils.stringStartsWith(workingName, romanRegexp, true) ?? []
    const romanStr = romanMatchArr.sort((a, b) => b.length - a.length).at(0) ?? ''
    const romanHasMinorQuality = !(/[A-Z]+/.test(romanStr))
    const romanValue = deromanize(romanStr.toUpperCase()) ?? '1' // deromanize should be safe here and never return undefined
    workingName = workingName.replace(romanStr, '')
    // Chord own steps
    console.log({
      alteration,
      offset,
      inversion,
      isNegative,
      romanValue,
      romanHasMinorQuality,
      qualityOrCommonNameRootStr,
      qualityOrCommonNameExtensionStr,
      workingName
    })
  }
}

// [WIP] when parsing chord name, the m of mixolydian gets interpreted as a m of minor...
Chord.fromName('ß-IVmixolydian,no(!3)add(2)/!4\\!!2')

;`
f  • f^4  • f^+  • § | 4  • 4^4  • 4^+  • § | <4>  • <4>^4  • <4>^+  • § |

Fm • F^4m • F^+m • § | iv • iv^4 • iv^+ • § | <iv> • <iv>^4 • <iv>^+ • § |




`



/*  
from: https://www.youtube.com/watch?v=SF8CdxcdJgw
1, 5 => stable notes
ß3, 3 => modal notes
6, ß7 => hollow notes
2, 4 => unstable notes
7, ß6 => leading notes
ß2, #4 => uncanny notes
*/