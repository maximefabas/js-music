import _scalesMainNamesJson from './scales-names.main.json'
import _scalesAltNamesJson from './scales-names.alt.json'

/* Absolute modulo (should be a dependency) */
export function absoluteModulo (nbr: number, modulo: number): number {
  return ((nbr % modulo) + modulo) % modulo
}

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
}

/* Interval */

export namespace IntervalTypes {
  export type IntervalClassValue = number
  export type Value = {
    intervalClass: IntervalClassValue
    alteration: AlterationTypes.Value
  }
  export type SimpleIntervalClassValue = 0 | 1 | 2 | 3 | 4 | 5 | 6
  export type SimpleValue = Value & {
    intervalClass: SimpleIntervalClassValue
  }
  export type Name = string
}

export class Interval {
  static name (value: IntervalTypes.Value): IntervalTypes.Name {
    const { intervalClass, alteration } = value
    const alterationName = Alteration.name(alteration)
    let intervalClassName: string
    if (intervalClass > 0) { intervalClassName = `${intervalClass + 1}` }
    else if (intervalClass === 0) { intervalClassName = '1' }
    else { intervalClassName = `${intervalClass - 1}` }
    return `${alterationName}${intervalClassName}`
  }
  
  static fromName (name: IntervalTypes.Name): IntervalTypes.Value | undefined {
    const nameChars = name.split('')
    const intervalClassNameChars = nameChars.filter(char => char === '-' || !Number.isNaN(parseInt(char)))
    let parsedIntervalClassValue = parseInt(intervalClassNameChars.join(''))
    if (!Number.isInteger(parsedIntervalClassValue)) return undefined
    if (parsedIntervalClassValue >= 1) { parsedIntervalClassValue -= 1 }
    else if (parsedIntervalClassValue <= -1) { parsedIntervalClassValue += 1 }
    const alteration = Alteration.fromName(name)
    return {
      intervalClass: parsedIntervalClassValue,
      alteration
    }
  }

  static simplify (value: IntervalTypes.Value): IntervalTypes.SimpleValue {
    const { intervalClass, alteration } = value
    const simpleIntervalClass = Math.floor(
      absoluteModulo(intervalClass, 7)
    ) as IntervalTypes.SimpleIntervalClassValue
    return {
      intervalClass: simpleIntervalClass,
      alteration
    }
  }

  static semitonesValues: [0, 2, 4, 5, 7, 9, 11] = [0, 2, 4, 5, 7, 9, 11]
  
  static semitones (value: IntervalTypes.Value): number {
    const simplified = Interval.simplify(value)
    const simplifiedClassAsSemitones = Interval.semitonesValues
      .at(simplified.intervalClass) as typeof Interval.semitonesValues[IntervalTypes.SimpleIntervalClassValue]
    const simplifiedAsSemitones = simplifiedClassAsSemitones + simplified.alteration
    const octaves = (value.intervalClass - simplified.intervalClass) / 7
    return 12 * octaves + simplifiedAsSemitones
  }

  static between (
    intervalA: IntervalTypes.Value,
    intervalB: IntervalTypes.Value
  ): IntervalTypes.Value {
    const siA = Interval.simplify(intervalA)
    const siB = Interval.simplify(intervalB)
    const intervalClassBetweenSis = siB.intervalClass - siA.intervalClass
    const semitonesBetweenSiClasses = Interval.semitones({
      intervalClass: intervalClassBetweenSis,
      alteration: 0
    })
    const semitonesBetweenSis = Interval.semitones(siB) - Interval.semitones(siA)
    const alteration = semitonesBetweenSis - semitonesBetweenSiClasses
    const semitonesBetweenIntervals = Interval.semitones(intervalB) - Interval.semitones(intervalA)
    const octavesBetweenIntervals = Math.floor((semitonesBetweenIntervals - semitonesBetweenSis) / 12)
    const intervalClass = intervalClassBetweenSis + 7 * octavesBetweenIntervals
    return { intervalClass, alteration }
  }

  static add (
    intervalA: IntervalTypes.Value,
    intervalB: IntervalTypes.Value
  ): IntervalTypes.Value {
    const sumAsSemitones = Interval.semitones(intervalA) + Interval.semitones(intervalB)
    const intervalClass = intervalA.intervalClass + intervalB.intervalClass
    const intClassAsSemitones = Interval.semitones({
      intervalClass,
      alteration: 0
    })
    const alteration = sumAsSemitones - intClassAsSemitones
    return { intervalClass, alteration }
  }

  static invert (interval: IntervalTypes.Value) {
    const unison = { intervalClass: 0, alteration: 0 }
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
      intervalClass: 2,
      alteration: -1
    },
    secondaryAxis: IntervalTypes.Value = {
      intervalClass: mainAxis.intervalClass,
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
        const { intervalClass: intervalClassA, alteration: alterationA } = intA
        const { intervalClass: intervalClassB, alteration: alterationB } = intB
        if (intervalClassA === intervalClassB) return alterationA - alterationB
        return intervalClassA - intervalClassB
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
        intervalClass: 0,
        alteration: sem
      }
      return chosenInterval
    })
  }
  
  static shiftClass (
    interval: IntervalTypes.Value,
    newIntervalClass: IntervalTypes.IntervalClassValue
  ): IntervalTypes.Value {
    const unalteredInputInterval: IntervalTypes.Value = { ...interval, alteration: 0 }
    const unalteredTargetInterval: IntervalTypes.Value = { intervalClass: newIntervalClass, alteration: 0 }
    const intervalBetweenUnalteredInputAndTarget = Interval.between(unalteredInputInterval, unalteredTargetInterval)
    const semitonesBeteenInputAndTarget = Interval.semitones(intervalBetweenUnalteredInputAndTarget)
    return {
      intervalClass: newIntervalClass,
      alteration: interval.alteration - semitonesBeteenInputAndTarget
    }
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
      const rationalizedOnceMore = Interval.shiftClass(
        rationalized,
        interval.alteration >= 0 // technically could just check if strictly superior
          ? rationalized.intervalClass + 1
          : rationalized.intervalClass - 1
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
  export enum MainQualities {
    OMITTED_MAJOR = '',
    EXPLICIT_MAJOR = 'maj',
    TWO = '2',
    THREE = '3',
    FOUR = '4',
    FIVE = '5',
    SUS_2 = 'sus2',
    SUS_FLAT_2 = 'susß2',
    SUS_SHARP_2 = 'sus#2',
    SUS_4 = 'sus4',
    SUS_FLAT_4 = 'susß4',
    SUS_SHARP_4 = 'sus#4',
    DIM = 'dim',
    AUG = 'aug',
    SIX = '6',
    FLAT_SIX = 'ß6',
    SHARP_SIX = '#6',
    SEVEN = '7',
    FLAT_SEVEN = 'ß7',
    MAJ_SEVEN = 'M7',
    DIM_SEVEN = 'dim7',
    DIM_FLAT_SEVEN = 'dimß7',
    DIM_DIM_SEVEN = 'dimßß7',
    DIM_MAJ_SEVEN = 'dimM7',
    AUG_SEVEN = 'aug7',
    AUG_FLAT_SEVEN = 'augß7',
    AUG_DIM_SEVEN = 'augßß7',
    AUG_MAJ_SEVEN = 'augM7',
    SUS_24 = 'sus24',
    SUS_FLAT_2_4 = 'susß24',
    SUS_SHARP_2_4 = 'sus#24',
    SUS_2_FLAT_4 = 'sus2ß4',
    SUS_2_SHARP_4 = 'sus2#4',
    SUS_FLAT_2_FLAT_4 = 'susß2ß4',
    SUS_FLAT_2_SHARP_4 = 'susß2#4',
    SUS_SHARP_2_FLAT_4 = 'sus#2ß4',
    SUS_SHARP_2_SHARP_4 = 'sus#2#4',
    SEVEN_SUS_2 = '7sus2',
    SEVEN_SUS_FLAT_2 = '7susß2',
    SEVEN_SUS_SHARP_2 = '7sus#2',
    MAJ_SEVEN_SUS_2 = 'M7sus2',
    MAJ_SEVEN_SUS_FLAT_2 = 'M7susß2',
    MAJ_SEVEN_SUS_SHARP_2 = 'M7sus#2',
    SEVEN_SUS_4 = '7sus4',
    SEVEN_SUS_FLAT_4 = '7susß4',
    SEVEN_SUS_SHARP_4 = '7sus#4',
    MAJ_SEVEN_SUS_4 = 'M7sus4',
    MAJ_SEVEN_SUS_FLAT_4 = 'M7susß4',
    MAJ_SEVEN_SUS_SHARP_4 = 'M7sus#4',
    NINE = '9',
    FLAT_NINE = 'ß9',
    SHARP_NINE = '#9',
    MAJ_NINE = 'M9',
    MAJ_FLAT_NINE = 'Mß9',
    MAJ_SHARP_NINE = 'M#9',
    SEVEN_SUS_24 = '7sus24',
    SEVEN_SUS_FLAT_2_4 = '7susß24',
    SEVEN_SUS_SHARP_2_4 = '7sus#24',
    SEVEN_SUS_2_FLAT_4 = '7sus2ß4',
    SEVEN_SUS_2_SHARP_4 = '7sus2#4',
    SEVEN_SUS_FLAT_2_FLAT_4 = '7susß2ß4',
    SEVEN_SUS_FLAT_2_SHARP_4 = '7susß2#4',
    SEVEN_SUS_SHARP_2_FLAT_4 = '7sus#2ß4',
    SEVEN_SUS_SHARP_2_SHARP_4 = '7sus#2#4',
    MAJ_SEVEN_SUS_24 = 'M7sus24',
    MAJ_SEVEN_SUS_FLAT_2_4 = 'M7susß24',
    MAJ_SEVEN_SUS_SHARP_2_4 = 'M7sus#24',
    MAJ_SEVEN_SUS_2_FLAT_4 = 'M7sus2ß4',
    MAJ_SEVEN_SUS_2_SHARP_4 = 'M7sus2#4',
    MAJ_SEVEN_SUS_FLAT_2_FLAT_4 = 'M7susß2ß4',
    MAJ_SEVEN_SUS_FLAT_2_SHARP_4 = 'M7susß2#4',
    MAJ_SEVEN_SUS_SHARP_2_FLAT_4 = 'M7sus#2ß4',
    MAJ_SEVEN_SUS_SHARP_2_SHARP_4 = 'M7sus#2#4',
    ELEVEN = '11',
    MAJ_ELEVEN = 'M11',
    SHARP_ELEVEN = '#11',
    MAJ_SHARP_ELEVEN = 'M#11',
    THIRTEEN = '13',
    MAJ_THIRTEEN = 'M13',
    FLAT_THIRTEEN = 'ß13',
    MAJ_FLAT_THIRTEEN = 'Mß13'
  }
  type S = string[]
  export type QualityTable = {
    mainQuality: ScaleTypes.MainQualities
    hasMinorQuality: boolean
    accidents: [S, S, S, S, S, S, S]
    omissions: [S, S, S, S, S, S, S]
    additions: [S, S, S, S, S, S, S]
    leftovers: string[]
  }
}

export class Scale {
  static fromName (name: ScaleTypes.Name): ScaleTypes.Value {
    const parsedIntervalNames = name.split(',')
    const intervals = parsedIntervalNames
      .map(intervalName => Interval.fromName(intervalName))
      .filter((int): int is IntervalTypes.Value => int !== undefined)
      .map(int => Interval.simplify(int))
    return intervals
  }
  
  static name (scale: ScaleTypes.Value): ScaleTypes.Name {
    return scale.map(interval => Interval.name(interval)).join(',')
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
    const intervalClassSlots = new Array(7)
      .fill(null)
      .map((_, pos) => ({
        intervalClass: pos as IntervalTypes.SimpleIntervalClassValue,
        intervals: sortedDeduped
          .filter(({ intervalClass }) => intervalClass === pos)
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
      from: IntervalTypes.SimpleIntervalClassValue,
      toUp: boolean = true
    ): typeof intervalClassSlots {
      const sourceSlot = slots
        .find(slot => slot.intervalClass === from)
      if (sourceSlot === undefined) return slots
      const destinationSlot = slots
        .find(slot => slot.intervalClass === from + (toUp ? 1 : -1))
      if (destinationSlot === undefined) return slots
      const sourceIntervalsAsSemitones = sourceSlot.intervals
        .map(interval => Interval.semitones(interval))
      const targetIntervalSemitoneValue = toUp
        ? Math.max(...sourceIntervalsAsSemitones)
        : Math.min(...sourceIntervalsAsSemitones)
      const targetInterval = sourceSlot.intervals
        .find(interval => Interval.semitones(interval) === targetIntervalSemitoneValue)
      if (targetInterval === undefined) return slots
      const shiftedTargetInterval = Interval.shiftClass(targetInterval, destinationSlot.intervalClass)
      destinationSlot.intervals.push(Interval.simplify(shiftedTargetInterval))
      const newSourceSlotIntervals = sourceSlot.intervals.filter(interval => interval !== targetInterval)
      sourceSlot.intervals.splice(0, Infinity, ...newSourceSlotIntervals)
      return slots
    }
  
    function chineseWhisperIntervalFromSlotToSlot (
      slots: typeof intervalClassSlots,
      from: IntervalTypes.SimpleIntervalClassValue,
      to: IntervalTypes.SimpleIntervalClassValue
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
            ? from + iteration as IntervalTypes.SimpleIntervalClassValue
            : from - iteration as IntervalTypes.SimpleIntervalClassValue,
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
            intervalClass: 0,
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

  static hasStep (
    scale: ScaleTypes.Value,
    _intervalClass: IntervalTypes.SimpleIntervalClassValue|IntervalTypes.SimpleIntervalClassValue[]
  ): boolean {
    const intervalClasses = Array.isArray(_intervalClass) ? _intervalClass : [_intervalClass]
    const intervalClassesInScale = new Set(scale.map(int => int.intervalClass))
    return intervalClasses.every(intClass => intervalClassesInScale.has(intClass))
  }

  static rotations (scale: ScaleTypes.Value): ScaleTypes.Value[] {
    return new Array(12)
      .fill(null)
      .map((_, rotationPos) => {
        const pretextInterval: IntervalTypes.Value = { intervalClass: 0, alteration: 0 }
        const rotationPosAsInterval = Interval.simplify(Interval.rationalize({
          intervalClass: 0,
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
      const { intervalClass: intClassA, alteration: altA } = intA
      const { intervalClass: intClassB, alteration: altB } = intB
      if (intClassA === intClassB) return altA - altB
      else return intClassA - intClassB
    }).at(0)
    const lowestIntervalName = lowestInterval !== undefined
      ? Interval.name(lowestInterval)
      : undefined
    const rotations = Scale.rotations(scale)
    return rotations.filter(rotation => {
      const rotationLowestInterval = rotation.sort((intA, intB) => {
        const { intervalClass: intClassA, alteration: altA } = intA
        const { intervalClass: intClassB, alteration: altB } = intB
        if (intClassA === intClassB) return altA - altB
        else return intClassA - intClassB
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
    _steps: IntervalTypes.SimpleIntervalClassValue
      | IntervalTypes.SimpleIntervalClassValue[]
  ): ScaleTypes.Value {
    const steps = Array.isArray(_steps) ? _steps : [_steps]
    return scale.filter(int => !steps.includes(int.intervalClass))
  }
  
  static mainQualitiesToNameMap = new Map<ScaleTypes.MainQualities, string>([
    [ScaleTypes.MainQualities.OMITTED_MAJOR, '1,3,5'],
    [ScaleTypes.MainQualities.EXPLICIT_MAJOR, '1,3,5'],
    [ScaleTypes.MainQualities.TWO, '1,2'],
    [ScaleTypes.MainQualities.THREE, '1,3'],
    [ScaleTypes.MainQualities.FOUR, '1,4'],
    [ScaleTypes.MainQualities.FIVE, '1,5'],
    [ScaleTypes.MainQualities.SUS_2, '1,2,5'],
    [ScaleTypes.MainQualities.SUS_FLAT_2, '1,ß2,5'],
    [ScaleTypes.MainQualities.SUS_SHARP_2, '1,#2,5'],
    [ScaleTypes.MainQualities.SUS_4, '1,4,5'],
    [ScaleTypes.MainQualities.SUS_FLAT_4, '1,ß4,5'],
    [ScaleTypes.MainQualities.SUS_SHARP_4, '1,#4,5'],
    [ScaleTypes.MainQualities.DIM, '1,ß3,ß5'],
    [ScaleTypes.MainQualities.AUG, '1,3,#5'],
    [ScaleTypes.MainQualities.SIX, '1,3,5,6'],
    [ScaleTypes.MainQualities.FLAT_SIX, '1,3,5,ß6'],
    [ScaleTypes.MainQualities.SHARP_SIX, '1,3,5,#6'],
    [ScaleTypes.MainQualities.SEVEN, '1,3,5,ß7'],
    [ScaleTypes.MainQualities.FLAT_SEVEN, '1,3,5,ß7'],
    [ScaleTypes.MainQualities.MAJ_SEVEN, '1,3,5,7'],
    [ScaleTypes.MainQualities.DIM_SEVEN, '1,ß3,ß5,ßß7'],
    [ScaleTypes.MainQualities.DIM_FLAT_SEVEN, '1,ß3,ß5,ß7'],
    [ScaleTypes.MainQualities.DIM_DIM_SEVEN, '1,ß3,ß5,ßß7'],
    [ScaleTypes.MainQualities.DIM_MAJ_SEVEN, '1,ß3,ß5,7'],
    [ScaleTypes.MainQualities.AUG_SEVEN, '1,3,#5,ß7'],
    [ScaleTypes.MainQualities.AUG_FLAT_SEVEN, '1,3,#5,ß7'],
    [ScaleTypes.MainQualities.AUG_DIM_SEVEN, '1,3,#5,ßß7'],
    [ScaleTypes.MainQualities.AUG_MAJ_SEVEN, '1,3,#5,7'],
    [ScaleTypes.MainQualities.SUS_24, '1,2,4,5'],
    [ScaleTypes.MainQualities.SUS_FLAT_2_4, '1,ß2,4,5'],
    [ScaleTypes.MainQualities.SUS_SHARP_2_4, '1,#2,4,5'],
    [ScaleTypes.MainQualities.SUS_2_FLAT_4, '1,2,ß4,5'],
    [ScaleTypes.MainQualities.SUS_2_SHARP_4, '1,2,#4,5'],
    [ScaleTypes.MainQualities.SUS_FLAT_2_FLAT_4, '1,ß2,ß4,5'],
    [ScaleTypes.MainQualities.SUS_FLAT_2_SHARP_4, '1,ß2,#4,5'],
    [ScaleTypes.MainQualities.SUS_SHARP_2_FLAT_4, '1,#2,ß4,5'],
    [ScaleTypes.MainQualities.SUS_SHARP_2_SHARP_4, '1,#2,#4,5'],
    [ScaleTypes.MainQualities.SEVEN_SUS_2, '1,2,5,ß7'],
    [ScaleTypes.MainQualities.SEVEN_SUS_FLAT_2, '1,ß2,5,ß7'],
    [ScaleTypes.MainQualities.SEVEN_SUS_SHARP_2, '1,#2,5,ß7'],
    [ScaleTypes.MainQualities.MAJ_SEVEN_SUS_2, '1,2,5,7'],
    [ScaleTypes.MainQualities.MAJ_SEVEN_SUS_FLAT_2, '1,ß2,5,7'],
    [ScaleTypes.MainQualities.MAJ_SEVEN_SUS_SHARP_2, '1,#2,5,7'],
    [ScaleTypes.MainQualities.SEVEN_SUS_4, '1,4,5,ß7'],
    [ScaleTypes.MainQualities.SEVEN_SUS_FLAT_4, '1,ß4,5,ß7'],
    [ScaleTypes.MainQualities.SEVEN_SUS_SHARP_4, '1,#4,5,ß7'],
    [ScaleTypes.MainQualities.MAJ_SEVEN_SUS_4, '1,4,5,7'],
    [ScaleTypes.MainQualities.MAJ_SEVEN_SUS_FLAT_4, '1,ß4,5,7'],
    [ScaleTypes.MainQualities.MAJ_SEVEN_SUS_SHARP_4, '1,#4,5,7'],
    [ScaleTypes.MainQualities.NINE, '1,3,5,ß7,2'],
    [ScaleTypes.MainQualities.FLAT_NINE, '1,3,5,ß7,ß2'],
    [ScaleTypes.MainQualities.SHARP_NINE, '1,3,5,ß7,#2'],
    [ScaleTypes.MainQualities.MAJ_NINE, '1,3,5,7,2'],
    [ScaleTypes.MainQualities.MAJ_FLAT_NINE, '1,3,5,7,ß2'],
    [ScaleTypes.MainQualities.MAJ_SHARP_NINE, '1,3,5,7,#2'],
    [ScaleTypes.MainQualities.SEVEN_SUS_24, '1,2,4,5,ß7'],
    [ScaleTypes.MainQualities.SEVEN_SUS_FLAT_2_4, '1,ß2,4,5,ß7'],
    [ScaleTypes.MainQualities.SEVEN_SUS_SHARP_2_4, '1,#2,4,5,ß7'],
    [ScaleTypes.MainQualities.SEVEN_SUS_2_FLAT_4, '1,2,ß4,5,ß7'],
    [ScaleTypes.MainQualities.SEVEN_SUS_2_SHARP_4, '1,2,#4,5,ß7'],
    [ScaleTypes.MainQualities.SEVEN_SUS_FLAT_2_FLAT_4, '1,ß2,ß4,5,ß7'],
    [ScaleTypes.MainQualities.SEVEN_SUS_FLAT_2_SHARP_4, '1,ß2,#4,5,ß7'],
    [ScaleTypes.MainQualities.SEVEN_SUS_SHARP_2_FLAT_4, '1,#2,ß4,5,ß7'],
    [ScaleTypes.MainQualities.SEVEN_SUS_SHARP_2_SHARP_4, '1,#2,#4,5,ß7'],
    [ScaleTypes.MainQualities.MAJ_SEVEN_SUS_24, '1,2,4,5,7'],
    [ScaleTypes.MainQualities.MAJ_SEVEN_SUS_FLAT_2_4, '1,ß2,4,5,7'],
    [ScaleTypes.MainQualities.MAJ_SEVEN_SUS_SHARP_2_4, '1,#2,4,5,7'],
    [ScaleTypes.MainQualities.MAJ_SEVEN_SUS_2_FLAT_4, '1,2,ß4,5,7'],
    [ScaleTypes.MainQualities.MAJ_SEVEN_SUS_2_SHARP_4, '1,2,#4,5,7'],
    [ScaleTypes.MainQualities.MAJ_SEVEN_SUS_FLAT_2_FLAT_4, '1,ß2,ß4,5,7'],
    [ScaleTypes.MainQualities.MAJ_SEVEN_SUS_FLAT_2_SHARP_4, '1,ß2,#4,5,7'],
    [ScaleTypes.MainQualities.MAJ_SEVEN_SUS_SHARP_2_FLAT_4, '1,#2,ß4,5,7'],
    [ScaleTypes.MainQualities.MAJ_SEVEN_SUS_SHARP_2_SHARP_4, '1,#2,#4,5,7'],
    [ScaleTypes.MainQualities.ELEVEN, '1,3,5,ß7,2,4'],
    [ScaleTypes.MainQualities.MAJ_ELEVEN, '1,3,5,7,2,4'],
    [ScaleTypes.MainQualities.SHARP_ELEVEN, '1,3,5,ß7,2,#4'],
    [ScaleTypes.MainQualities.MAJ_SHARP_ELEVEN, '1,3,5,7,2,#4'],
    [ScaleTypes.MainQualities.THIRTEEN, '1,3,5,ß7,2,4,6'],
    [ScaleTypes.MainQualities.MAJ_THIRTEEN, '1,3,5,7,2,4,6'],
    [ScaleTypes.MainQualities.FLAT_THIRTEEN, '1,3,5,ß7,2,4,ß6'],
    [ScaleTypes.MainQualities.MAJ_FLAT_THIRTEEN, '1,3,5,7,2,4,ß6']
  ])
  
  static qualityTableSort (_qualityTable: ScaleTypes.QualityTable): ScaleTypes.QualityTable {
    const qualityTable = { ..._qualityTable }
    type NameAndSemitonesObj = {
      name: string
      semitoneValue: number
    };
    qualityTable.accidents = qualityTable.accidents.map(intClass => {
      return intClass
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
  
    qualityTable.omissions = qualityTable.omissions.map(intClass => {
      return intClass
        .map(intName => {
          if (intName.match(/^![0-9]+$/)) return {
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
    qualityTable.additions = qualityTable.additions.map(intClass => {
      return intClass
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
    const namedIntervals = scale.map(int => Interval.name(int))
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
      mainQuality: ScaleTypes.MainQualities.OMITTED_MAJOR,
      hasMinorQuality: false,
      accidents: new Array(7).fill(null).map(_ => ([] as S)) as ScaleTypes.QualityTable['accidents'],
      omissions: new Array(7).fill(null).map(_ => ([] as S)) as ScaleTypes.QualityTable['omissions'],
      additions: new Array(7).fill(null).map(_ => ([] as S)) as ScaleTypes.QualityTable['additions'],
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
  
    // Diminished
    if (isDim) {
      qualityTable.mainQuality = ScaleTypes.MainQualities.DIM
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß3', 'ß5'].includes(i))
      
      // dim + 13th
      if (hasMajorThirteenth) {
        qualityTable.mainQuality = ScaleTypes.MainQualities.SIX
        qualityTable.hasMinorQuality = true
        qualityTable.accidents[4].push('ß5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['6'].includes(i))
        if (hasExtensionsBelowThirteenth) {
          qualityTable.mainQuality = ScaleTypes.MainQualities.THIRTEEN
          // M
          if (hasMajorSeventh && !hasMinorSeventh) {
            qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_THIRTEEN
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
        qualityTable.mainQuality = ScaleTypes.MainQualities.FLAT_SIX
        qualityTable.hasMinorQuality = true
        qualityTable.accidents[4].push('ß5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß6'].includes(i))
        if (hasExtensionsBelowThirteenth) {
          qualityTable.mainQuality = ScaleTypes.MainQualities.FLAT_THIRTEEN
          // M
          if (hasMajorSeventh && !hasMinorSeventh) {
            qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_FLAT_THIRTEEN
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
        qualityTable.mainQuality = ScaleTypes.MainQualities.ELEVEN
        qualityTable.hasMinorQuality = true
        qualityTable.accidents[4].push('ß5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['4'].includes(i))
        // M
        if (hasMajorSeventh && !hasMinorSeventh) {
          qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_ELEVEN
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
        }
        // 9th
        handleNinthsWhenExpected(hasMajorNinth, hasMinorNinth)
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
  
      // dim + #11th
      } else if (hasPerfectEleventh) {
        qualityTable.mainQuality = ScaleTypes.MainQualities.SHARP_ELEVEN
        qualityTable.hasMinorQuality = true
        qualityTable.accidents[4].push('ß5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['#4'].includes(i))
        // M
        if (hasMajorSeventh && !hasMinorSeventh) {
          qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_SHARP_ELEVEN
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
        }
        // 9th
        handleNinthsWhenExpected(hasMajorNinth, hasMinorNinth)
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
        
      // dim + 9th
      } else if (hasMajorNinth) {
        qualityTable.mainQuality = ScaleTypes.MainQualities.NINE
        qualityTable.hasMinorQuality = true
        qualityTable.accidents[4].push('ß5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
        // M
        if (hasMajorSeventh && !hasMinorSeventh) {
          qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_NINE
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
        }
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
      
      // dim + ß9th
      } else if (hasMinorNinth) {
        qualityTable.mainQuality = ScaleTypes.MainQualities.FLAT_NINE
        qualityTable.hasMinorQuality = true
        qualityTable.accidents[4].push('ß5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß2'].includes(i))
        // M
        if (hasMajorSeventh && !hasMinorSeventh) {
          qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_FLAT_NINE
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
        }
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
  
      // dim + ßß7th
      } else if (hasDiminishedSeventh) {
        qualityTable.mainQuality = ScaleTypes.MainQualities.DIM_SEVEN
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ßß7'].includes(i))
      
      // dim + ß7th
      } else if (hasMinorSeventh) {
        qualityTable.mainQuality = ScaleTypes.MainQualities.SEVEN
        qualityTable.hasMinorQuality = true
        qualityTable.accidents[4].push('ß5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß7'].includes(i))
      
      // dim + 7th
      } else if (hasMajorSeventh) {
        qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_SEVEN
        qualityTable.hasMinorQuality = true
        qualityTable.accidents[4].push('ß5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
      }
    
    // Augmented
    } else if (isAug) {
      qualityTable.mainQuality = ScaleTypes.MainQualities.AUG
      qualityTable.leftovers = qualityTable.leftovers.filter(i => !['3', '#5'].includes(i))
  
      // aug + 13th
      if (hasMajorThirteenth) {
        qualityTable.mainQuality = ScaleTypes.MainQualities.SIX
        qualityTable.accidents[4].push('#5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['6'].includes(i))
        if (hasExtensionsBelowThirteenth) {
          qualityTable.mainQuality = ScaleTypes.MainQualities.THIRTEEN
          // M
          if (hasMajorSeventh && !hasMinorSeventh) {
            qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_THIRTEEN
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
        qualityTable.mainQuality = ScaleTypes.MainQualities.FLAT_SIX
        qualityTable.accidents[4].push('#5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß6'].includes(i))
        if (hasExtensionsBelowThirteenth) {
          qualityTable.mainQuality = ScaleTypes.MainQualities.FLAT_THIRTEEN
          // M
          if (hasMajorSeventh && !hasMinorSeventh) {
            qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_FLAT_THIRTEEN
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
        qualityTable.mainQuality = ScaleTypes.MainQualities.ELEVEN
        qualityTable.accidents[4].push('#5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['4'].includes(i))
        // M
        if (hasMajorSeventh && !hasMinorSeventh) {
          qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_ELEVEN
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
        }
        // 9th
        handleNinthsWhenExpected(hasMajorNinth, hasMinorNinth)
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
  
      // aug + #11th
      } else if (hasPerfectEleventh) {
        qualityTable.mainQuality = ScaleTypes.MainQualities.SHARP_ELEVEN
        qualityTable.accidents[4].push('#5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['#4'].includes(i))
        // M
        if (hasMajorSeventh && !hasMinorSeventh) {
          qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_SHARP_ELEVEN
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
        }
        // 9th
        handleNinthsWhenExpected(hasMajorNinth, hasMinorNinth)
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
        
      // aug + 9th
      } else if (hasMajorNinth) {
        qualityTable.mainQuality = ScaleTypes.MainQualities.NINE
        qualityTable.accidents[4].push('#5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
        // M
        if (hasMajorSeventh && !hasMinorSeventh) {
          qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_NINE
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
        }
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
      
      // aug + ß9th
      } else if (hasMinorNinth) {
        qualityTable.mainQuality = ScaleTypes.MainQualities.FLAT_NINE
        qualityTable.accidents[4].push('#5')
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß2'].includes(i))
        // M
        if (hasMajorSeventh && !hasMinorSeventh) {
          qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_FLAT_NINE
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
        }
        // 7th
        handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
  
      // aug + ß7th
      } else if (hasMinorSeventh) {
        qualityTable.mainQuality = ScaleTypes.MainQualities.AUG_SEVEN
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß7'].includes(i))
      
      // aug + 7th
      } else if (hasMajorSeventh) {
        qualityTable.mainQuality = ScaleTypes.MainQualities.AUG_MAJ_SEVEN
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
      
      // aug + ßß7th
      } else if (hasDiminishedSeventh) {
        qualityTable.mainQuality = ScaleTypes.MainQualities.AUG_DIM_SEVEN
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ßß7'].includes(i))
      }
  
    // Not diminished nor augmented
    } else {
  
      // 13th
      if (hasMajorThirteenth) {
        qualityTable.mainQuality = ScaleTypes.MainQualities.SIX
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['6'].includes(i))
        if (hasExtensionsBelowThirteenth) {
          qualityTable.mainQuality = ScaleTypes.MainQualities.THIRTEEN
          // M
          if (hasMajorSeventh && !hasMinorSeventh) {
            qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_THIRTEEN
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
        qualityTable.mainQuality = ScaleTypes.MainQualities.FLAT_SIX
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß6'].includes(i))
        if (hasExtensionsBelowThirteenth) {
          qualityTable.mainQuality = ScaleTypes.MainQualities.FLAT_THIRTEEN
          // M
          if (hasMajorSeventh && !hasMinorSeventh) {
            qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_FLAT_THIRTEEN
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
        qualityTable.mainQuality = ScaleTypes.MainQualities.ELEVEN
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['4'].includes(i))
  
        // Only 1 and 4 => 4
        if (namedIntervals.length === 2 && hasFirst) {
          qualityTable.mainQuality = ScaleTypes.MainQualities.FOUR
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['1'].includes(i))
        // No 3 or ß3 => sus4
        } else if (!hasMajorThird && !hasMinorThird) {
          qualityTable.mainQuality = ScaleTypes.MainQualities.SUS_4
          if (hasMinorSeventh) {
            qualityTable.mainQuality = ScaleTypes.MainQualities.SEVEN_SUS_4
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß7'].includes(i))
            if (hasMajorNinth) {
              qualityTable.mainQuality = ScaleTypes.MainQualities.SEVEN_SUS_24
              qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
            } else if (hasMinorNinth) {
              qualityTable.mainQuality = ScaleTypes.MainQualities.SEVEN_SUS_FLAT_2_4
              qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß2'].includes(i))
            }
          } else if (hasMajorSeventh) {
            qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_SEVEN_SUS_4
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
            if (hasMajorNinth) {
              qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_SEVEN_SUS_24
              qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
            } else if (hasMinorNinth) {
              qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_SEVEN_SUS_FLAT_2_4
              qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß2'].includes(i))
            }
          } else if (hasMajorNinth) {
            qualityTable.mainQuality = ScaleTypes.MainQualities.SUS_24
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
          } else if (hasMinorNinth) {
            qualityTable.mainQuality = ScaleTypes.MainQualities.SUS_FLAT_2_4
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß2'].includes(i))
          }
          // 5th
          handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
  
        // Has 3 or ß3
        } else {
          // M
          if (hasMajorSeventh && !hasMinorSeventh) {
            qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_ELEVEN
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
        qualityTable.mainQuality = ScaleTypes.MainQualities.SHARP_ELEVEN
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['#4'].includes(i))
  
        // No 3 or ß3, => sus#4
        if (!hasMajorThird && !hasMinorThird) {
          qualityTable.mainQuality = ScaleTypes.MainQualities.SUS_SHARP_4
          if (hasMinorSeventh) {
            qualityTable.mainQuality = ScaleTypes.MainQualities.SEVEN_SUS_SHARP_4
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß7'].includes(i))
            if (hasMajorNinth) {
              qualityTable.mainQuality = ScaleTypes.MainQualities.SEVEN_SUS_2_SHARP_4
              qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
            } else if (hasMinorNinth) {
              qualityTable.mainQuality = ScaleTypes.MainQualities.SEVEN_SUS_FLAT_2_SHARP_4
              qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß2'].includes(i))
            }
          } else if (hasMajorSeventh) {
            qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_SEVEN_SUS_SHARP_4
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
            if (hasMajorNinth) {
              qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_SEVEN_SUS_2_SHARP_4
              qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
            } else if (hasMinorNinth) {
              qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_SEVEN_SUS_FLAT_2_SHARP_4
              qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß2'].includes(i))
            }
          } else if (hasMajorNinth) {
            qualityTable.mainQuality = ScaleTypes.MainQualities.SUS_2_SHARP_4
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
          } else if (hasMinorNinth) {
            qualityTable.mainQuality = ScaleTypes.MainQualities.SUS_FLAT_2_SHARP_4
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß2'].includes(i))
          }
          // 5th
          handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
  
        // Has 3 or ß3
        } else {
          // M
          if (hasMajorSeventh && !hasMinorSeventh) {
            qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_SHARP_ELEVEN
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
        qualityTable.mainQuality = ScaleTypes.MainQualities.NINE        
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['2'].includes(i))
        
        // Only 1 and 2 => 2
        if (namedIntervals.length === 2 && hasFirst) {
          qualityTable.mainQuality = ScaleTypes.MainQualities.TWO
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['1'].includes(i))
        
        // No 3, ß3 => sus2
        } else if (!hasMajorThird && !hasMinorThird) {
          qualityTable.mainQuality = ScaleTypes.MainQualities.SUS_2
          if (hasMinorSeventh) {
            qualityTable.mainQuality = ScaleTypes.MainQualities.SEVEN_SUS_2
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß7'].includes(i))
          } else if (hasMajorSeventh) {
            qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_SEVEN_SUS_2
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
          }
          // 5th
          handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
        
        // Has 3 or ß3
        } else {
          // M
          if (hasMajorSeventh && !hasMinorSeventh) {
            qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_NINE
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
        qualityTable.mainQuality = ScaleTypes.MainQualities.FLAT_NINE
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß2'].includes(i))
        
        // No 3, ß3 => susß2
        if (!hasMajorThird && !hasMinorThird) {
          qualityTable.mainQuality = ScaleTypes.MainQualities.SUS_FLAT_2
          if (hasMinorSeventh) {
            qualityTable.mainQuality = ScaleTypes.MainQualities.SEVEN_SUS_FLAT_2
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß7'].includes(i))
          } else if (hasMajorSeventh) {
            qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_SEVEN_SUS_FLAT_2
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
          }
          // 5th
          handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
  
        // Has 3 or ß3
        } else {
          // M
          if (hasMajorSeventh && !hasMinorSeventh) {
            qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_FLAT_NINE
            qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
          }
          // 7th
          handleSeventhsWhenExpected(hasMajorSeventh, hasMinorSeventh)
          // 5th
          handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
          // 3rd
          handleThirdsWhenExpected(isMajor, isMinor, hasAnyThird)
        }
  
      // 7
      } else if (hasMinorSeventh) {
        qualityTable.mainQuality = ScaleTypes.MainQualities.SEVEN
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['ß7'].includes(i))
        // 5th
        handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
        // 3rd
        handleThirdsWhenExpected(isMajor, isMinor, hasAnyThird)
  
      // M7
      } else if (hasMajorSeventh) {
        qualityTable.mainQuality = ScaleTypes.MainQualities.MAJ_SEVEN
        qualityTable.leftovers = qualityTable.leftovers.filter(i => !['7'].includes(i))
        // 5th
        handleFifthsWhenExpected(hasPerfectFifth, hasAnyFifth)
        // 3rd
        handleThirdsWhenExpected(isMajor, isMinor, hasAnyThird)
  
      // No extension
      } else {
        // Only 1 and 3 => 3
        if (namedIntervals.length === 2 && hasFirst && hasMajorThird) {
          qualityTable.mainQuality = ScaleTypes.MainQualities.THREE
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['1', '3'].includes(i))
        } else if (namedIntervals.length === 2 && hasFirst && hasMinorThird) {
          qualityTable.mainQuality = ScaleTypes.MainQualities.THREE
          qualityTable.hasMinorQuality = true
          qualityTable.leftovers = qualityTable.leftovers.filter(i => !['1', 'ß3'].includes(i))
        // Only 1 and 5 => 5
        } else if (namedIntervals.length === 2 && hasFirst && hasPerfectFifth) {
          qualityTable.mainQuality = ScaleTypes.MainQualities.FIVE
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
    new Array(7).fill(null).forEach((_, intClass) => {
      const intClassName = `${intClass + 1}`
      const regex = new RegExp(intClassName, 'igm')
      const foundInLeftovers = qualityTable.leftovers.filter(i => i.match(regex))
      foundInLeftovers.forEach(leftover => {
        qualityTable.additions[intClass as IntervalTypes.SimpleIntervalClassValue].push(leftover)
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
    if (flattenedOmissions.length > 0) { quality += `no(${flattenedOmissions.join(',')})` }
    const flattenedAdditions = qualityTable.additions.flat()
    if (flattenedAdditions.length > 0) { quality += `add(${flattenedAdditions.join(',')})` }
    return quality
  }
  
  static quality (scale: ScaleTypes.Value): string {
    const qualityTable = Scale.qualityTable(scale)
    const quality = Scale.qualityTableToQuality(qualityTable)
    return quality
  }
  
  static qualityToQualityTable (quality: string): ScaleTypes.QualityTable {
    let workingQuality = quality
    const qualityTable: ScaleTypes.QualityTable = {
      mainQuality: ScaleTypes.MainQualities.OMITTED_MAJOR,
      hasMinorQuality: false,
      accidents: new Array(7).fill(null).map(e => ([])) as unknown as ScaleTypes.QualityTable['accidents'],
      omissions: new Array(7).fill(null).map(e => ([])) as unknown as ScaleTypes.QualityTable['omissions'],
      additions: new Array(7).fill(null).map(e => ([])) as unknown as ScaleTypes.QualityTable['additions'],
      leftovers: []
    }
  
    // Minor quality
    qualityTable.hasMinorQuality = workingQuality.match(/^m/) !== null
    if (qualityTable.hasMinorQuality) workingQuality = workingQuality.replace(/^m/, '')
  
    // Main quality
    const mainQualitiesArr = Object
      .entries(ScaleTypes.MainQualities)
      .map(([_, val]) => val)
      .filter(qual => qual !== '')
      .sort((qualA, qualB) => qualB.length - qualA.length)
    qualityTable.mainQuality = mainQualitiesArr.find(qual => {
      const qualLength = qual.length
      const workingQualityFirstChars = workingQuality.slice(0, qualLength)
      return workingQualityFirstChars === qual
    }) ?? ScaleTypes.MainQualities.OMITTED_MAJOR
    workingQuality = workingQuality.slice(qualityTable.mainQuality.length)
  
    const intervalRegex = /(ß|#)*[0-9]+/
    const intervalsBlockRegex = new RegExp(`${intervalRegex.source}(,${intervalRegex.source})*`)
    const intervalClassRegex = /![0-9]+/
    const intervalOrClassRegex = new RegExp(`((${intervalRegex.source})|(${intervalClassRegex.source}))`)
    const intervalOrClassBlockRegex = new RegExp(`${intervalOrClassRegex.source}(,${intervalOrClassRegex.source})*`)
    const omissionBlockRegex = new RegExp(`no\\(${intervalOrClassBlockRegex.source}\\)`, 'igm')
    const additionBlockRegex = new RegExp(`add\\(${intervalsBlockRegex.source}\\)`, 'igm')
  
    // Omissions
    const omissionsBlocks = workingQuality.match(omissionBlockRegex) ?? []
    omissionsBlocks.forEach(omissionBlock => {
      workingQuality = workingQuality.replace(omissionBlock, '')
      const omittedIntervalsNames = omissionBlock
        .replace(/^no\(/, '')
        .replace(/\)$/, '')
        .split(',')
      omittedIntervalsNames.forEach(intName => {
        const int = Interval.fromName(intName)
        if (int === undefined) return;
        qualityTable.omissions[int.intervalClass as IntervalTypes.SimpleIntervalClassValue].push(intName)
      })
    })
  
    // Additions
    const additionsBlocks = workingQuality.match(additionBlockRegex) ?? []
    additionsBlocks.forEach(additionBlock => {
      workingQuality = workingQuality.replace(additionBlock, '')
      const addedIntervalsNames = additionBlock
        .replace(/^add\(/, '')
        .replace(/\)$/, '')
        .split(',')
      addedIntervalsNames.forEach(intName => {
        const int = Interval.fromName(intName)
        if (int === undefined) return;
        qualityTable.additions[int.intervalClass as IntervalTypes.SimpleIntervalClassValue].push(intName)
      })
    })
  
    // Accidents
    let whileLoopsCnt = 0
    while (true) {
      whileLoopsCnt++
      if (whileLoopsCnt >= 100) break;
      const accident = workingQuality.match(intervalRegex)
      if (accident === null) break;
      workingQuality = workingQuality.replace(accident[0], '')
      const intName = accident[0]
      const int = Interval.fromName(intName)
      if (int === undefined) continue;
      qualityTable.accidents[int.intervalClass as IntervalTypes.SimpleIntervalClassValue].push(intName)
    }
  
    return Scale.qualityTableSort(qualityTable)
  }
  
  static fromQualityTable (_qualityTable: ScaleTypes.QualityTable): ScaleTypes.Value {
    const {
      hasMinorQuality,
      mainQuality,
      accidents,
      omissions,
      additions
    } = Scale.qualityTableSort(_qualityTable)
    const mainQualityScaleName = Scale.mainQualitiesToNameMap.get(mainQuality) ?? '1,3,5'
    let returnedScale = Scale.fromName(mainQualityScaleName)
    if (hasMinorQuality) {
      returnedScale = Scale.omitStep(returnedScale, 2)
      returnedScale = Scale.merge(returnedScale, Scale.fromName('ß3'))
    }
    accidents.forEach((intNames, intClass) => {
      if (intNames.length === 0) return
      const intNamesAsScale = intNames
        .map(intName => Interval.fromName(intName))
        .filter((int): int is IntervalTypes.Value => int !== undefined)
        .map(int => Interval.simplify(int))
      returnedScale = Scale.omitStep(returnedScale, intClass as IntervalTypes.SimpleIntervalClassValue)
      returnedScale = Scale.merge(returnedScale, intNamesAsScale)
    })
    omissions.forEach((intNames, intClass) => {
      intNames.forEach(intName => {
        if (intName.match(/^![0-9]+$/)) {
          returnedScale = Scale.omitStep(returnedScale, intClass as IntervalTypes.SimpleIntervalClassValue)
        } else {
          const interval = Interval.fromName(intName)
          if (interval === undefined) return;
          const normalizedIntName = Interval.name(interval)
          returnedScale = Scale.part(returnedScale, Scale.fromName(normalizedIntName))
        }
      })
    })
    const additionsScaleName = additions
      .flat()
      .map(intName => {
        const interval = Interval.fromName(intName)
        if (interval === undefined) return;
        const normalizedIntName = Interval.name(interval)
        return normalizedIntName
      })
      .filter(name => name !== undefined)
      .join(',')
    const additionsScale = Scale.fromName(additionsScaleName)
    returnedScale = Scale.merge(returnedScale, additionsScale)
    returnedScale = Interval.sort(returnedScale)
      .map(int => Interval.simplify(int))
    return returnedScale
  }
  
  static fromQuality (quality: string): ScaleTypes.Value {
    const table = Scale.qualityToQualityTable(quality)
    return Scale.fromQualityTable(table)
  }
  
  static mainNamesJson = _scalesMainNamesJson as Record<string, string>
  static altNamesJson = _scalesAltNamesJson as Record<string, Array<{ category: string, name: string }>>
  
  static decimalValueToCommonNamesMap = new Map(
    Object
      .entries(Scale.mainNamesJson)
      .map(([key, mainName]) => [parseInt(key), mainName])
  )
  
  static thematicNamesCategories = new Set(
    Object
      .entries(Scale.altNamesJson)
      .map(([, names]) => names.map(name => name.category))
      .flat()
  )
  
  static decimalValueToThematicNamesMap = new Map(
    Object
      .entries(Scale.altNamesJson)
      .map(([key, names]) => [parseInt(key), names])
  )
  
  static commonName (scale: ScaleTypes.Value): string {
    const decimalValue = Scale.decimal(scale)
    const commonName = Scale.decimalValueToCommonNamesMap.get(decimalValue) ?? Scale.name(scale)
    return commonName
  }
  
  static thematicNames (
    scale: ScaleTypes.Value,
    category: string | null = null
  ): Array<{ category: string, name: string }> {
    const decimalValue = Scale.decimal(scale)
    const thematicNames = Scale.decimalValueToThematicNamesMap
      .get(decimalValue) ?? []
    if (category === null) return thematicNames
    return thematicNames.filter(item => item.category === category)
  }
  
  static thematicNameToValue (name: string): ScaleTypes.Value | undefined {
    let foundDecimalValue: number | undefined = undefined
    Scale.decimalValueToThematicNamesMap.forEach((nameItems, decimalValue) => {
      if (foundDecimalValue !== undefined) return;
      const names = nameItems.map(nameItem => nameItem.name)
      if (names.includes(name)) { foundDecimalValue = decimalValue }
    })
    if (foundDecimalValue === undefined) return;
    return Scale.fromDecimal(foundDecimalValue)
  }
  
  static commonNameToValue (
    name: string,
    excludeThematicNames: boolean = false
  ): ScaleTypes.Value | undefined {
    const decimalValueAndNameFromCommonNames = [...Scale.decimalValueToCommonNamesMap
      .entries()]
      .find(([, commonName]) => commonName === name)
    if (decimalValueAndNameFromCommonNames !== undefined) {
      const decimalValue = decimalValueAndNameFromCommonNames[0]
      return Scale.fromDecimal(decimalValue)
    }
    if (excludeThematicNames) return undefined
    return Scale.thematicNameToValue(name)
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



// const lol = [
//   ['1', null],
//   ['ß2', '2', null],
//   ['ß3', '3', null],
//   ['4', '#4', null],
//   ['ß5', '5', '#5', null],
//   ['ß6', '6', null],
//   ['ßß7', 'ß7', '7', null]
// ]

// new Array(Math.pow(4, 7))
// // new Array(1)
//   .fill(0)
//   .map((_, pos) => {
//     const base4Pos = (pos + 0).toString(4).split('').map(e => parseInt(e))
//     const reversedBase4Pos = [...base4Pos].reverse()
//     const withZeros = [...reversedBase4Pos, 0, 0, 0, 0, 0, 0, 0]
//     const sliced = withZeros.slice(0, 7).reverse()
//     const intervals = new Array(7).fill(null).map((_, pos) => lol[pos][sliced[pos]])
//     if (intervals.includes(undefined as any)) return;
//     const scaleName = intervals.filter(e => e!== null).join(',')
//     const scale = Scale.fromName(scaleName)
//     const quality = Scale.quality(scale)
//     const table = Scale.qualityToQualityTable(quality)
//     const value = Scale.fromQualityTable(table)
//     const name = Scale.name(value)
//     // console.log(scaleName, '——>', quality, '——>', name)
//     if (scaleName !== name) { console.log(pos, scaleName, '|', scale, '|', quality, '|', name) }
//     return {
//       scaleName,
//       scale,
//       quality,
//       table,
//       value,
//       name
//     }
//   })


/* Roman */

export namespace RomanTypes {
  export type Value = {
    interval: IntervalTypes.Value
    scale: ScaleTypes.Value
  }
  
  export type Name = string
}

`
f  • f^4  • f^+  • § | 4  • 4^4  • 4^+  • § | <4>  • <4>^4  • <4>^+  • § |

Fm • F^4m • F^+m • § | iv • iv^4 • iv^+ • § | <iv> • <iv>^4 • <iv>^+ • § |




`

// export function Scale.fromName (name: ScaleTypes.Name): RomanValue {
//   const parsedIntervalNames = name.split(',')
//   const intervals = parsedIntervalNames
//     .map(intervalName => SimpleInterval.fromName(intervalName))
//     .filter((int): int is SimpleIntervalTypes.Value => int !== undefined)
//   return intervals
// }

// export function Scale.name (scale: ScaleTypes.Value): ScaleTypes.Name {
//   return scale.map(interval => SimpleInterval.name(interval)).join(',')
// }


