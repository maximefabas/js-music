import { romanize, deromanize } from './modules/romans-safe/index.js'
import { REGEXPS } from './regexps.js'
import absoluteModulo from './modules/absolute-modulo/index.js'
import toAlphanum from './modules/to-alphanum/index.js'
import * as regexpUtils from './modules/regexp-utils/index.js'
import { MainQualities, mainQualitiesToIntervalsNameMap } from './data/scales-qualities.js'
import * as scalesData from './data/scales-names.js'
import { Synth, now, start, Time, Transport } from 'tone'
import { parse } from './experimentation.js'

// // parse('#C^4')
// console.log(lol({
//   string: '#C-^^4',
//   type: InstructionType.RAW
// }))

// console.log(lol({
//   string: '#c-^^4',
//   type: InstructionType.RAW
// }))

parse(`<II:3>M7`)

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
    first: Interval.simplify({ step: 0, alteration: 0 }),
    majorSecond: Interval.simplify({ step: 1, alteration: 0 }),
    minorSecond: Interval.simplify({ step: 1, alteration: -1 }),
    majorThird: Interval.simplify({ step: 2, alteration: 0 }),
    minorThird: Interval.simplify({ step: 2, alteration: -1 }),
    perfectFourth: Interval.simplify({ step: 3, alteration: 0 }),
    augmentedFourth: Interval.simplify({ step: 3, alteration: 1 }),
    perfectFifth: Interval.simplify({ step: 4, alteration: 0 }),
    diminishedFifth: Interval.simplify({ step: 4, alteration: -1 }),
    augmentedFifth: Interval.simplify({ step: 4, alteration: 1 }),
    majorSixth: Interval.simplify({ step: 5, alteration: 0 }),
    minorSixth: Interval.simplify({ step: 5, alteration: -1 }),
    majorSeventh: Interval.simplify({ step: 6, alteration: 0 }),
    minorSeventh: Interval.simplify({ step: 6, alteration: -1 }),
    diminishedSeventh: Interval.simplify({ step: 6, alteration: -2 })
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

  static qualityWeight (scale: ScaleTypes.Value): number {
    let weight = Math.abs(scale.length - 3) * 100
    if (scale.length < 3) { weight += 800 }
    if (!Scale.hasSteps(scale, 0)) { weight += 10000 }
    if (!Scale.hasIntervals(scale, Interval.commonNames.majorThird)) { weight += 1 }
    if (!Scale.hasSteps(scale, 2)) { weight += 10 }
    if (!Scale.hasIntervals(scale, Interval.commonNames.perfectFifth)) { weight += 2 }
    if (!Scale.hasSteps(scale, 4)) { weight += 10 }
    if (scale.length === 4 && !Scale.hasSteps(scale, 6)) { weight += 10 }
    if (scale.length === 5 && !Scale.hasSteps(scale, 1)) { weight += 10 }
    if (scale.length === 6 && !Scale.hasSteps(scale, 3)) { weight += 10 }
    if (scale.length === 7 && !Scale.hasSteps(scale, 5)) { weight += 10 }
    const { accidents, omissions, additions } = Scale.qualityTable(scale)
    weight += accidents.flat().length * 200
    weight += omissions.flat().length * 1000
    weight += additions.flat().length * 1000
    return weight
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
    const mainQualityScaleName = mainQualitiesToIntervalsNameMap.get(mainQuality) ?? '1,3,5'
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

  static fromScaleAndStep (
    scale: ScaleTypes.Value,
    step: IntervalTypes.SimpleStepValue): ChordTypes.Value[] {
    const intervals = Scale.intervalsAtStep(scale, step)
    const chords = intervals
      .map(interval => {
        const intervalsAsSemitoneValues = Interval.semitones(interval)
        const scaleRotation = Scale.rotations(scale).at(intervalsAsSemitoneValues)
        if (scaleRotation === undefined) return undefined
        const subsets = [scaleRotation, ...Scale.subsets(scaleRotation)]
        return subsets.map(subset => ({
          base: interval as IntervalTypes.Value,
          scale: subset,
          weight: Scale.qualityWeight(subset)
        }))
      })
      .flat()
      .filter((e): e is ChordTypes.Value & { weight: number } => e !== undefined)
      .sort((chA, chB) => chB.weight - chA.weight)
      .map(withWeight => ({
        base: withWeight.base,
        scale: withWeight.scale,
        weight: withWeight.weight
      }))
    return chords
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

/* Voice */

export namespace VoiceTypes {
  export type Value = IntervalTypes.Value[]
  export type Descriptor = (IntervalTypes.Value | IntervalTypes.StepValue)[][]
}

export class Voice {
  static fromScale (
    scale: ScaleTypes.Value,
    descriptor?: VoiceTypes.Descriptor
  ): VoiceTypes.Value {
    if (descriptor === undefined) return [...scale]
    const returned: VoiceTypes.Value = []
    descriptor.forEach((intsOrSteps, octave) => {
      intsOrSteps.forEach(intOrStep => {
        if (typeof intOrStep === 'number') {
          const simpleStep = Interval.simplify({ step: intOrStep, alteration: 0 }).step
          const foundIntervals = Scale.intervalsAtStep(scale, simpleStep)
          const octaveStep = 7 * octave + Math.floor((intOrStep - simpleStep) / 7) * 7
          foundIntervals.forEach(interval => {
            returned.push(Interval.add(interval, { step: octaveStep, alteration: 0 }))
          })
        } else {
          const octaveStep = 7 * octave
          returned.push(Interval.add(intOrStep, { step: octaveStep, alteration: 0 }))
        }
      })
    })
    return returned
  }
  
  static fromChord (
    chord: ChordTypes.Value,
    descriptor?: VoiceTypes.Descriptor
  ): VoiceTypes.Value {
    const voicedScale = Voice.fromScale(chord.scale, descriptor)
    return voicedScale.map(int => Interval.add(chord.base, int))
  }
}

/* Note */

export namespace NoteTypes {
  export type Value = {
    pitch: IntervalTypes.Value
    duration: string | number
    velocity: number
  }
  export type DurationDescriptor = string
    | number
    | ((int: IntervalTypes.Value | undefined, pos?: number) => string | number)
  export type VelocityDescriptor = number
    | ((int: IntervalTypes.Value | undefined, pos?: number) => number)
}

export class Note {
  static fromVoice (
    voice: VoiceTypes.Value,
    durationDescriptor?: NoteTypes.DurationDescriptor,
    velocityDescriptor?: NoteTypes.VelocityDescriptor
  ): NoteTypes.Value[] {
    return voice.map((pitch, pos) => {
      let duration: string | number = 0
      if (typeof durationDescriptor === 'number') { duration = durationDescriptor }
      else if (typeof durationDescriptor === 'string') { duration = durationDescriptor }
      else if (durationDescriptor !== undefined) { duration = durationDescriptor(pitch, pos) }
      let velocity: number = 0
      if (typeof velocityDescriptor === 'number') { velocity = velocityDescriptor }
      else if (velocityDescriptor !== undefined) { velocity = velocityDescriptor(pitch, pos) }
      return { pitch, duration, velocity }
    })
  }
}

/* Sound */

export namespace SoundTypes {
  export type Value = {
    frequency: number
    duration: string | number
    velocity: number
  }

  export type Tuner = (int: IntervalTypes.Value) => number
}

export class Sound {
  static twelveTetTuner: SoundTypes.Tuner = (int: IntervalTypes.Value) => {
    const c0Freq = 16.35160
    const semitoneValue = Interval.semitones(int)
    return Math.pow(2, semitoneValue / 12) * c0Freq
  }

  static fromNote (
    note: NoteTypes.Value,
    tuner: SoundTypes.Tuner = Sound.twelveTetTuner
  ): SoundTypes.Value {
    return {
      frequency: tuner(note.pitch),
      duration: note.duration,
      velocity: note.velocity
    }
  }

  static playNow (
    { frequency, duration, velocity }: SoundTypes.Value,
    synth: Synth = new Synth().toDestination()
  ) {
    synth.triggerAttackRelease(
      frequency,
      duration,
      now(),
      velocity
    )
  }
}

/* Sequence */
export namespace SequenceTypes {
  export type Value = {
    duration: string | number
    timedNotes: Array<{
      normalizedTime: number,
      note: NoteTypes.Value
    }>
  }
  export type NotesArr = Array<NoteTypes.Value | NotesArr>
}

export class Sequence {
  static notesArrToTimedSounds (
    notesArr: SequenceTypes.NotesArr,
    duration = 1,
    offset = 0
  ): SequenceTypes.Value['timedNotes'] {
    const returned: SequenceTypes.Value['timedNotes'] = []
    notesArr.forEach((soundOrArr, pos, arr) => {
      const thisDuration = duration / arr.length
      const thisOffset = offset + (pos * duration / arr.length)      
      if (Array.isArray(soundOrArr)) returned.push(...Sequence.notesArrToTimedSounds(
        soundOrArr,
        thisDuration,
        thisOffset
      ))
      else returned.push({
        note: soundOrArr,
        normalizedTime: thisOffset
      })
    })
    return returned
  }
  
  static fromNotes (
    notesArr: SequenceTypes.NotesArr,
    duration: string | number
  ) {
    const sequence: SequenceTypes.Value = {
      duration,
      timedNotes: Sequence.notesArrToTimedSounds(notesArr)
    }
    return sequence
  }
}

// const majorScale = Scale.fromCommonName('harmonic-minor') ?? []
// const c4note: IntervalTypes.Value = {
//   step: 4 * 7 - 3,
//   alteration: 0
// }
// const cMajorChord: ChordTypes.Value = {
//   base: c4note,
//   scale: majorScale
// }


/*
- une séquence est une liste d'évènements programmés dans le temps, d'une durée donnée


- Event {
  payload:
    - joue pitch, key interval, key step, chord interval, chord step
      - #c^^, #2, <#2>, #<2>, !2, <!2>, #<!2>, {#2}, #{2}, {!2}, #{!2}
    - joue chord, chord from key int, from key step, from chord int, from chord step
      - #C^^, #II, <#II>, #<II>, !II, <!II>, #<!II>, {#II}, {!II}, #{!II}
    - set chord
      - {{!II} mixolydian}
    - set chord scale
      - {{} mixolydian}
    - set chord base
      - {<!II> ~}
    - set key
      - <<!III> ~mod(3)>
    - set key scale
      - <<> phrygian>
    - set key base
      - <<!III> ~>
    - set / ramp instrument setting
      ?instr.trumpet.distortion = 0.5
    - set time signature
    - set / ramp tuning
    - set / ramp bpm
    - start / end loop ?
}

- Event : note / notes

- NoteCommons = {
  - context: 'key' | 'chord' | 'absolute'
  - alteration: Alteration
  - octaveOffset: number | null
}
- StepNote = NoteCommons & { step: number }
- IntervalNote = NoteCommons & { interval: Interval }
- Note = StepNote | IntervalNote

note('#<#2>') => {
  context: 'key',
  interval: { step: 1, alteration: 1 },
  alteration: 1,
  octaveOffset: 0
}

note('#{!2}') => {
  context: 'chord',
  step: 1,
  alteration: 1,
  octaveOffset: 0
}

notes('<#II^^>') => [
  { context: 'key', interval: { step: 1, alteration: 1 }, alteration: 0, octaveOffset: 2 },
  { context: 'key', interval: { step: 3, alteration: 2 }, alteration: 0, octaveOffset: 2 },
  { context: 'key', interval: { step: 5, alteration: 1 }, alteration: 0, octaveOffset: 2 },
  { context: 'key', interval: { step: 7, alteration: 1 }, alteration: 0, octaveOffset: 2 }
]

notes('<!II-^>') => [
  { context: 'key', step: 1, alteration: 0, octaveOffset: -1 },
  { context: 'key', step: 3, alteration: 0, octaveOffset: -1 },
  { context: 'key', step: 5, alteration: 0, octaveOffset: -1 },
  { context: 'key', step: 7, alteration: 0, octaveOffset: -1 }
]

note('#c') => {
  context: 'absolute',
  interval: { step: 0, alteration: 1 },
  alteration: 0,
  octaveOffset: 0
}

note('#c^4') => {
  context: 'absolute',
  interval: { step: 28, alteration: 1 },
  alteration: 0,
  octaveOffset: null
}

notes('ßDm7') => [
  { context: 'absolute', interval: { step: 1, alteration: -1 }, alteration: 0, octaveOffset: 0 },
  { context: 'absolute', interval: { step: 3, alteration: 0 },  alteration: 0, octaveOffset: 0 },
  { context: 'absolute', interval: { step: 5, alteration: -1 }, alteration: 0, octaveOffset: 0 },
  { context: 'absolute', interval: { step: 7, alteration: -1 }, alteration: 0, octaveOffset: 0 }
]

notes('ßDm7^4') => [
  { context: 'absolute', interval: { step: 29, alteration: -1 }, alteration: 0, octaveOffset: null },
  { context: 'absolute', interval: { step: 31, alteration: 0 },  alteration: 0, octaveOffset: null },
  { context: 'absolute', interval: { step: 33, alteration: -1 }, alteration: 0, octaveOffset: null },
  { context: 'absolute', interval: { step: 35, alteration: -1 }, alteration: 0, octaveOffset: null }
]


- RelativeTime {
  numerator: number
  denominator: number
}

- Pattern {
  event?: Event
  grid: Array<(undefined | {
    relativeDuration: RelativeTime
    intensity: number
  })>
}
- Line {
  timeline: Array<{
    relativeDuration: RelativeTime
    event: Event
  }>
}
- Sequence {
  duration: string | number | RelativeTime
  timedEvents: Array<{
    relativeTime: RelativeTime
    event: Event
  }>
}

const mySeq = sequence([1 / 4], [
  { relativeTime: [1 / 32], event: {...} },
  { relativeTime: [1 / 32], event: {...} },
  { relativeTime: [1 / 32], event: {...} },
  { relativeTime: [1 / 32], event: {...} }
])

- Instrument {
  tuning: Tuning
  key: Chord
  chord: Chord
  texture: Tone.Instrument
  sequences: Sequence<string | number>[]
}

- Track {
  bpm: Bpm
  signature: TimeSignature
  tuning: Tuning
  key: Chord
  chord: Chord
  instruments: Instrument[]
}

*/






/* * * * * * * * * * * * * * * * * * * * 
 *
 * INTERACTIONS
 * 
 * * * * * * * * * * * * * * * * * * * */

// const voiced = Voice.fromChord(cMajorChord, [
//   [0, 1, 2, 3, 4, 5, 6],
//   [0, 1, 2, 3, 4, 5, 6, 7]
// ])
const voiced = Voice.fromChord(cMajorChord, [[0, 2, 4, 6]])
const notes = Note.fromVoice(voiced, '4n', 1)
// console.log(notes)
const sounds = notes.map(note => Sound.fromNote(note))
const upAndDownSounds = [
  ...sounds,
  // ...[...sounds.slice(0, -1)].reverse()
]

const seq = Sequence.fromNotes(
  []
/*[{
  pitch: { step: 4 * 7, alteration: 0 },
  duration: '2n',
  velocity: 1
}, [
  {
    pitch: { step: 4 * 7 + 1, alteration: 0 },
    duration: '4n',
    velocity: 1
  }, [
    {
      pitch: { step: 4 * 7, alteration: 0 },
      duration: '8n',
      velocity: 1
    }, [
      {
        pitch: { step: 4 * 7 + 1, alteration: 0 },
        duration: '16n',
        velocity: 1
      },
      {
        pitch: { step: 4 * 7 + 4, alteration: 0 },
        duration: '16n',
        velocity: 1
      },
    ]]
]]*/, '1n')

document.querySelector('.play')?.addEventListener('click', () => {
  Transport.stop()
  const { duration: sequenceDuration, timedNotes } = seq
  timedNotes.forEach(timedSound => {
    const {
      normalizedTime,
      note: {
        pitch,
        duration,
        velocity
      }
    } = timedSound
    Transport.schedule(time => {
      const synth = new Synth().toDestination()
      synth.triggerAttackRelease(
        Sound.twelveTetTuner(pitch),
        duration,
        time + Time(sequenceDuration).toSeconds() * normalizedTime,
        velocity
      )
    }, Transport.now())
  })
  Transport.start()
})

const enableBtn = document.querySelector('.audio-enable')
enableBtn?.addEventListener('click', () => {
  start()
  if (enableBtn !== undefined) {
    enableBtn.setAttribute('disabled', '')
    enableBtn.innerHTML = 'Audio enabled.'
  }
})









/* * * * * * * * * * * * * * * * * * * * 
 *
 * BLOC NOTES
 * 
 * * * * * * * * * * * * * * * * * * * */

/*

ÉVÈNEMENTS :
setup clé courante (Chord<base, scale>)
  setup base, setup scale
  * scale peut être une transformation depuis la clé
  * scale peut être une transformation depuis l'accord courant
  * base peut être
    * un pitch
    ou
    * un intervalle,
    * ou un step
    de
    * la clé
    * ou de l'accord courant

setup accord courant (Chord<base, scale>)
  * scale peut être une transformation depuis la clé
  * scale peut être une transformation depuis l'accord courant
  * base peut être
    * un pitch
    ou
    * un intervalle,
    * ou un step
    de
    * la clé
    * ou de l'accord courant

setup tempo, temporamp
setup tuning
setup time signature

play individual notes (melody)
play voiced chords

let ring (notes and voices)

setup / play loops




pitch class ßd
pitch letter !d
own (scale ?) interval ß9
own (scale ?) step !9
key interval <ß9>
key step <!9>
chord interval {ß9}
chord step {!9}

pitch chord ßDm7
pitch letter chord <!D>m7 // Find the D in the current key
                   {!D}m7 // find the D in the current chord

key chord         <ii>m7 [-x-x,--x-,x]
                  <ii>m7 [!3, <!5>, {!7}, ß9]
                  <!II:13> <acc,omi,add> <invert> <offset> <voice>

chord chord       {!II:7} // Find the chord 2 steps above the current chord






key interval chord 

// SHEET MUSIC

tune              `${tuning}`
key               `ßa^3 mixolydian`
sign              `4/4`
bpm               `${bpm}`








tune              12tet
key               ßa^3 mixolydian
sign              4/4
bpm               75
-
inst trumpet      <preset>
inst drums        <preset>
inst organ        <preset>
-

chord mychord     <II:13>
prog prog1        I - IV - iiß6 - ii!ß6 - $mychord
prog prog2        (transformations plus compliquées de scales notamment)
prog prog3        Dm7 - ii7 - <II:13>no(9, !11, <9>, <!11>, {9}, {!11})/{!3}

pattern patt3     key       | ßa^3 mixolydian |               |                |                |
                  chord     | <II:13>        |                |                |                |
                  velocity  | <velocity func>;                                                  |
                  !7      * |----x~~~----xx--|--5---8---------|----------------|----------------| * 
                  {!7}    * |-xxx---xxx~---x-|----------------|----------------|----------------| *
                  !5      * |---x----x-------|------6---------|----------------|----------------| *
                  !3      * |--x-------X-----|----------------|----------------|----------------| *
                  !1      * |x---x---x---x---|----------------|----------------|----------------| *

sequence intro {
  duration               1m
  bpm                    180 1m
  chords                 | <!II:13>• <!I:7>• <!V:6> • <!I>   |
  pattern                | {I}     • {I}   • {I}    • {I}    |
             {!13}      *|--------|--------|--------|--------|
             {!7}       *|-3~~----|-3~~----|-3~~----|-3~~----|
             {!5}       *|-5~~----|-5~~----|-5~~----|-5~~----|
             {!3}       *|-5~~----|-5~~----|-5~~----|-5~~----|
             {!1}       *|7~~~----|7~~~----|7~~~----|7~~~----|
}

loop introloop {
  sequence               $sequence.intro
  loops                  16
  looper                 $looper.mylooper
}

seq myseq         4 measures
spread            $prog.prog1    1 | 2 | 3 | [4 | 5]
* key             ßb^4
* to trumpet      $patt3 | $patt2 | $patt1 | [ $patt4 | $patt8 ]
* to drums        !7   |----x~~~----xx--|----------------|----------------|----------------|
                  {!7} |-xxx---xxx~---x-|----------------|----------------|----------------|
                  !5   |---x----x-------|----------------|----------------|----------------|
                  !3   |--x-------X-----|----------------|----------------|----------------|
                  !1   |x---x---x---x---|----------------|----------------|----------------|




*                 <II>-^no(<!6>) c^4   • ~      • {!I}   • {!V}
*                 ~
*                 


seq               1 measure
spread            $prog.prog1    1, 2, 3, [4, 5]
  sub 1           {!I:13} [x------,-------]
  sub 2
    sub 1         <!1>                 • <!4>   • <!6>   • <!3>
    sub 2         ~ <!1,!4>
    sub 3         
    sub 4
  sub 3
  sub 4  
    | c // joue le c le plus proche de la clé
    | 1 // joue la note 1 de la clé
    | !1 // joue la note 1 de l'accord
    | ßVII M7 // joue l'accord en fonction de la clé
    | A-^^ // Accord de A à 2 octaves sous la clé 
    | A!-^// Accord de A à 1 octave sous l'accord








loop              4 measures (4 notes / beats / 16ths / ...)
spread prog1      1, 2, 3, [4, 5]
play              | c . c . c . c ; c . c . c . c . c . c ; c . c . c . c . c . c ; c . c . c . c . c . 
                  | 1 . 2 . 6 . c ; c . c . c . c . c . c ; c . c . c . c . c . c ; c . c . c . c . c . 
                  |
                  |




Une note : c  __  #c^4
Une note, relativement à la clé :  c-^^ (the c, 2 octaves lower. eg key base is ßa^3, c-^^= c^1)
Une note, relativement à l'échelle ? : c-!!^ (n'a pas de sens à priori)
Une note, relativement à un accord : 









*/























// const sequence: any = null
// const loop: any = null
// const key: any = null
// const instrument: any = null
// const bpm: any = null

// key('start key', 'ßa^3 mixolydian')

// bpm('start bpm', { value: 60 })
// bpm('after intro bpm', { value: 180 })

// sequence('intro', (intro: any) => ({
//   key:                    key.get('start key'),
//   duration:               '1m',
//   bpm: {                  value: bpm.get('after intro bpm').value,
//                           ramp: '1m',
//                           from: bpm.get('start bpm').value
//   },
//   chords:                 `            | <!II:13>• <!I:7>• <!V:6> • <!I>   |`,
//   pattern:                `{!13}      *|--------|--------|--------|--------|
//                            {!7}       *|-3~~----|-3~~----|-3~~----|-3~~----|
//                            {!5}       *|-5~~----|-5~~----|-5~~----|-5~~----|
//                            {!3}       *|-5~~----|-5~~----|-5~~----|-5~~----|
//                            {!1}       *|7~~~----|7~~~----|7~~~----|7~~~----|`            
// }))

// loop('intro loop', (introLoop: any) => ({
//   sequence:             sequence.get('intro'),
//   loops:                16,
//   looper:               (sequence: any, loopNb: any) => {
//     return sequence
//   }
// }))

// instrument('trumpet', (trumpet: any) => ({
  
// }))

















// sequence intro {
//   duration               1m
//   bpm                    180 1m
//   chords                 | <!II:13>• <!I:7>• <!V:6> • <!I>   |
//   pattern                | {I}     • {I}   • {I}    • {I}    |
//              {!13}      *|--------|--------|--------|--------|
//              {!7}       *|-3~~----|-3~~----|-3~~----|-3~~----|
//              {!5}       *|-5~~----|-5~~----|-5~~----|-5~~----|
//              {!3}       *|-5~~----|-5~~----|-5~~----|-5~~----|
//              {!1}       *|7~~~----|7~~~----|7~~~----|7~~~----|
// }

// loop introloop {
//   sequence               $sequence.intro
//   loops                  16
//   looper                 $looper.mylooper
// }


// Chord.fromScaleAndStep(
//   Scale.fromIntervalsName('1,ß3,ß5,ßß7') as any,
//   0
// ).map(chord => {
//   console.log(`${Interval.name(chord.base)} ${Scale.quality(chord.scale)} // ${Scale.pattern(chord.scale)} // ${(chord as any).weight} // ${chord.scale.length}`)
// })

// <root><scale><modifiers><inversion><root><voicing> ?
// root =>
//    interval: ß4
//    interval with octave : ß4^4
//    pitch: ßC^4
//    step from parent scale with octave : !!4^4
// root+scale =>
//    any of the above + scale (commonname or quality)
//    step + length : !4{5}


// [WIP] when parsing chord name, the m of mixolydian gets interpreted as a m of minor...
// Chord.fromName('ß-IVmixolydian,no(!3)add(2)/!4\\!!2')

// [WIP]
// - single parser function, write full template <alt><base><quality/name><modifiers><inv><offset><voice> ?
// - Interval could be of type relative or absolute in order to manage pitch related stuff ?

// [WIP]
// - single parser function, write full template <alt><base><quality/name><modifiers><inv><offset><voice> ?
// - Interval could be of type relative or absolute in order to manage pitch related stuff ?

;`
f  • f^4  • f^+  • § | 4  • 4^4  • 4^+  • § | <4>  • <4>^4  • <4>^+  • § |

Fm • F^4m • F^+m • § | iv • iv^4 • iv^+ • § | <iv> • <iv>^4 • <iv>^+ • § |




`
// const context = {} as any
// context.key = key('ßa^3 mixolydian')
// const progression = [
//   context.key.get('<!II:7>'),
//   context.key.get('<!V:7>'),
//   context.key.get('<!I:7>')
// ]

/*  
from: https://www.youtube.com/watch?v=SF8CdxcdJgw
1, 5 => stable notes
ß3, 3 => modal notes
6, ß7 => hollow notes
2, 4 => unstable notes
7, ß6 => leading notes
ß2, #4 => uncanny notes
*/