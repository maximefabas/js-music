'use strict'

const debug_mode = true
function log () {
  if (debug_mode) {
    console.log(...arguments)
  }
}

// alteration = {}
// alteration.regexp = /[#b]*/
// alteartion.catch = str => str.match(new RegExp(`^${alteration.regexp.source}$`))[0]

// pitchLetter = {}
// pitchLetter.regexp = /[abcdefg]/
// pitchLetter.catch = str => str.match(new RegExp(`^${pitchLetter.regexp.source}$`))[0]

// pitchClass = {}
// pitchClass.regexp = new RegExp(`${alteration.regexp.source}${pitchLetter.regexp.source}`)
// pitchClass.catch = str => {
//   const altRegexp = new RegExp(`^${alteration.regexp.source}`)
//   const alteration = str.match(altRegexp)[0]
//   const letterRegexp = new RegExp(`${pitchLetter.regexp.source}$`)
//   const letter = str.match(letterRegexp)[0]
//   return letter
//     ? `${alteration}${letter}`
//     : `${alteration.slice(0, -1)}b`
// }

// octave = {}
// octave.regexp = /\^[0-9]+/
// octave.catch = str => str.match(new RegExp(`^${octave.regexp.source}$`))[0]

// pitch = {}
// pitch.regexp = new RegExp(`${pitchClass.regexp.source}(${octave.regexp.source})?`)
// pitch.catch = str => {
//   const pitchClassRegexp = new RegExp(`^${pitchClass.regexp.source}`)
//   const pitchClass = str.match(pitchClassRegexp)[0]
//   const octaveRegexp = new RegExp(`${octave.regexp.source}$`)
//   const octave = str.match(octaveRegexp)[0] || '^4'
//   return `${pitchClass}${octave}`
// }

// intervalNumber = {}
// intervalNumber.regexp = /[0-9]+/
// intervalNumber.catch = str => str.match(new RegExp(`^${intervalNumber.regexp.source}$`))[0]

// interval = {}
// interval.regexp = new RegExp(`${alteration.regexp.source}${intervalNumber.regexp.source}`)
// interval.catch = str => {
//   const altRegexp = new RegExp(`^${alteration.regexp.source}`)
//   const alteration = str.match(altRegexp)[0]
//   const numberRegexp = new RegExp(`${intervalNumber.regexp.source}$`)
//   const number = str.match(numberRegexp)[0]
//   return `${alteration}${number}`
// }

// scale = {}
// scale.regexp = /[\s\S]*/
// scale.catch = str => str.match(new Regexp(`^${scale.regexp.source}$`))

/* * * * * * * * * * * * * * * * * * * * * * * * 
 *
 * THEORY OBJECT
 *
 * * * * * * * * * * * * * * * * * * * * * * * */
class TheoryObject {
  constructor () {
    // this.instrument = new Tone.PolySynth().connect(Tone.Master)
    console.log('Theory Object - constructor')
    this.init = this.init.bind(this)
    this.id = Array(4).fill(0).map(e => Math.random().toString(36).slice(2)).join('-')
    this.value = this.init(...arguments)
  }

  /* _ */
  get _ () {
    console.log('Theory Object - copy')
    return new this.constructor(this.name)
  }

  init () {
    console.log('Theory Object - init')
    const instanceInArgs = arguments.length === 1 && arguments[0] instanceof this.constructor
    if (instanceInArgs) return arguments[0]._.value
    const isLiteral = arguments.length === 1 && typeof arguments[0] === 'string'
    if (isLiteral) return TheoryObject.readLiteral(arguments[0], this.constructor)
    return this.constructor.readProps(...arguments)
  }

  /* readProps */
  static readProps () {
    return arguments[0]
  }
  
  /* readLiteral */
  static readLiteral (literal, asConstructor) {
    return asConstructor.readProps(literal)
  }

  /* toX */
  static toX (val, x) {
    const mod = val % x
    const result = mod < 0 ? (mod + x) : mod
    return result
  }
}

/* * * * * * * * * * * * * * * * * * * * * * * * 
 *
 * PITCH LETTER
 * --
 * Value:
 * number
 *
 * * * * * * * * * * * * * * * * * * * * * * * */
class PitchLetter extends TheoryObject {
  constructor () {
    super(...arguments)
    console.log('PitchLetter - constructor')
  }

  /* name */
  get name () {
    return PitchLetter.letters[this.value]
  }

  /* readProps */
  static readProps () {
    console.log('PitchLetter - readProps')
    if (arguments.length === 1) {
      const letters = PitchLetter.letters
      if (typeof arguments[0] === 'number') return TheoryObject.toX(parseInt(arguments[0], 10), letters.length)
      if (typeof arguments[0] === 'string'
        && letters.includes(arguments[0].toLowerCase()))
        return letters.indexOf(arguments[0].toLowerCase())
    }
    return 0
  }

  /* intervalBetween */
  static intervalBetween (_a, _b) {
    const a = new PitchLetter(_a).name
    const b = new PitchLetter(_b).name
    const posOfA = PitchLetter.letters.indexOf(a)
    const posOfB = PitchLetter.letters.indexOf(b)
    if (posOfA === -1 || posOfB === -1) return
    const intervalNumber = posOfB - posOfA >= 0
      ? new IntervalNumber(posOfB - posOfA)
      : new IntervalNumber(PitchLetter.letters.length + posOfB - posOfA)
    const intervalNumberAsHalfSteps = intervalNumber.asHalfSteps
    const halfStepsFromValues = posOfB - posOfA >= 0
      ? PitchLetter.lettersValues[posOfB] - PitchLetter.lettersValues[posOfA]
      : 12 + PitchLetter.lettersValues[posOfB] - PitchLetter.lettersValues[posOfA]
    const alteration = new Alteration(halfStepsFromValues - intervalNumberAsHalfSteps)
    return new Interval(intervalNumber, alteration)
  }

  // [WIP] probably to delete
  // static sum (_a, _b) {
  //   const a = new PitchLetter(_a).value
  //   const b = new PitchLetter(_b).value
  //   console.log(a, b)
  //   const newVal = TheoryObject.toX(a + b, PitchLetter.letters.length)
  //   const pitchLetter = new PitchLetter(newVal)
  //   return pitchLetter
  // }

  static letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
  static lettersValues = [0, 2, 3, 5, 7, 8, 10]
}

/* * * * * * * * * * * * * * * * * * * * * * * * 
 *
 * ALTERATION
 * --
 * Value:
 * number
 *
 * * * * * * * * * * * * * * * * * * * * * * * */
class Alteration extends TheoryObject {
  constructor () {
    super(...arguments)
    console.log('Alteration - constructor')
  }

  get name () {
    return this.value >= 0
      ? new Array(this.value).fill('#').join('')
      : new Array(-1 * this.value).fill('b').join('')
  }

  get asHalfSteps () {
    return this.value
  }

  static readProps () {
    console.log('Alteration - readProps')
    if (arguments.length === 1) {
      if (typeof arguments[0] === 'number') return parseInt(arguments[0], 10)
      if (typeof arguments[0] === 'string') {
        const flats = arguments[0].length - arguments[0].split('b').join('').length
        const sharps = arguments[0].length - arguments[0].split('#').join('').length
        return sharps - flats
      }
    }
    return 0
  }

  static intervalBetween (_a, _b) {
    const a = new Alteration(_a).value
    const b = new Alteration(_b).value
    const interval = new Interval(0, b - a)
    return interval
  }

  static sum (_a, _b) {
    const a = new Alteration(_a).value
    const b = new Alteration(_b).value
    const alteration = new Alteration(a + b)
    return alteration
  }
}

/* * * * * * * * * * * * * * * * * * * * * * * * 
 *
 * PITCH CLASS
 * --
 * Value:
 * { pitchLetter: <PitchLetter>, alteration: <Alteration> }
 *
 * * * * * * * * * * * * * * * * * * * * * * * */
class PitchClass extends TheoryObject {
  constructor () {
    super(...arguments)
    console.log('PitchClass - constructor')
  }

  get name () {
    return `${this.value.alteration.name}${this.value.pitchLetter.name}`
  }

  static readProps () {
    console.log('PitchClass - readProps')
    if (arguments.length === 2) {
      const pitchLetter = new PitchLetter(arguments[0])
      const alteration = new Alteration(arguments[1])
      return { pitchLetter, alteration }
    } else if (arguments.length === 1) {
      if (typeof arguments[0] === 'string') {
        const alteration = new Alteration(arguments[0].slice(0, -1))
        const pitchLetter = new PitchLetter(arguments[0].slice(-1))
        return { pitchLetter, alteration }
      }
    }
    return {
      pitchLetter: new PitchLetter('a'),
      alteration: new Alteration('')
    }
  }

  static intervalBetween (_a, _b) {
    const a = new PitchClass(_a).value
    const b = new PitchClass(_b).value
    const pitchLetterInterval = PitchLetter.intervalBetween(a.pitchLetter, b.pitchLetter)
    const alterationInterval = Alteration.intervalBetween(a.alteration, b.alteration)
    return Interval.sum(pitchLetterInterval, alterationInterval)
  }
}

/* * * * * * * * * * * * * * * * * * * * * * * * 
 *
 * OCTAVE
 * --
 * Value:
 * number
 *
 * * * * * * * * * * * * * * * * * * * * * * * */
class Octave extends TheoryObject {
  constructor () {
    super(...arguments)
    console.log('Octave - constructor')
  }

  get name () {
    return `${this.value}`
  }

  get asHalfSteps () {
    return 12 * this.value
  }

  static readProps () {
    console.log('Octave - readProps')
    if (arguments.length === 1) {
      if (typeof arguments[0] === 'number') return parseInt(arguments[0], 10)
      if (typeof arguments[0] === 'string') {
        const parsed = parseInt(arguments[0], 10)
        return Number.isNaN(parsed) ? 4 : parsed
      }
    }
    return 4
  }

  static intervalBetween (_a, _b) {
    const a = new Octave(_a)
    const b = new Octave(_b)
    return new Interval(12 * (b.value - a.value))
  }

  static sum (_a, _b) {
    const a = new Octave(_a).value
    const b = new Octave(_b).value
    const octave = new Octave(a + b)
    return octave
  }
}

/* * * * * * * * * * * * * * * * * * * * * * * * 
 *
 * PITCH
 * --
 * Value:
 * { class: <PitchClass>, octave: <Octave> }
 *
 * * * * * * * * * * * * * * * * * * * * * * * */
class Pitch extends TheoryObject {
  constructor () {
    super(...arguments)
    console.log('Pitch - constructor')
  }

  get name () {
    return `${this.value.pitchClass.name}${this.value.octave.value}`
  }

  static readProps () {
    console.log('Pitch - readProps')
    if (arguments.length === 2) {
      const pitchClass = new PitchClass(arguments[0])
      const octave = new Octave(arguments[1])
      return { pitchClass, octave }
    } else if (arguments.length === 1) {
      if (typeof arguments[0] === 'string') {
        const octaveMatch = arguments[0].match(/[0-9]+$/)
        const octave = octaveMatch ? new Octave(octaveMatch[0]) : new Octave()
        const octaveStrIndex = octaveMatch ? octaveMatch.index : arguments[0].length
        const propsWithoutOctave = arguments[0].slice(0, octaveStrIndex)
        const pitchClass = new PitchClass(propsWithoutOctave)
        return { pitchClass, octave }
      }
    }
    return { pitchClass: new PitchClass(), octave: new Octave() }
  }

  static intervalBetween (_a, _b) {
    const a = new Pitch(_a)
    const b = new Pitch(_b)
    const betweenClasses = PitchClass.intervalBetween(a.value.pitchClass, b.value.pitchClass)
    const betweenOctaves = Octave.intervalBetween(a.value.octave, b.value.octave)
    return Interval.sum(betweenClasses, betweenOctaves)
  }
}

/* * * * * * * * * * * * * * * * * * * * * * * * 
 *
 * INTERVAL NUMBER
 * --
 * Value:
 * number
 *
 * * * * * * * * * * * * * * * * * * * * * * * */
class IntervalNumber extends TheoryObject {
  constructor () {
    super(...arguments)
    console.log('IntervalNumber - constructor')
  }

  get name () {
    return this.value >= 0
      ? `${this.value + 1}`
      : `${this.value - 1}`
  }

  get asHalfSteps () {
    const loops = Math.floor(Math.abs(this.value) / 7)
    const normalizedValue = Math.abs(this.value % 7)
    return this.value >= 0
      ? loops * 12 + IntervalNumber.numbersToHalfSteps[normalizedValue]
      : loops * -12 - IntervalNumber.numbersToHalfSteps[normalizedValue]
  }

  static readProps () {
    console.log('IntervalNumber - readProps')
    if (arguments.length === 1) {
      if (typeof arguments[0] === 'string') {
        const parsed = parseInt(arguments[0], 10)
        return parsed > 0 ? parsed - 1 : parsed === 0 ? parsed : parsed + 1
      } else if (typeof arguments[0] === 'number') {
        return arguments[0]
      }
    }
    return 0
  }

  static sum (_a, _b) {
    const a = new IntervalNumber(_a)
    const b = new IntervalNumber(_b)
    const intervalNumber = new IntervalNumber(a.value + b.value)
    return intervalNumber
  }

  static intervalBetween (_a, _b) {
    const a = new IntervalNumber(_a)
    const b = new IntervalNumber(_b)
    const diff = b.value - a.value
    const interval = new Interval(diff, 0)
    return interval
  }

  static numbersToHalfSteps = [0, 2, 4, 5, 7, 9, 11]
}

/* * * * * * * * * * * * * * * * * * * * * * * * 
 *
 * INTERVAL
 * --
 * Value:
 * { intervalNumber: <IntervalNumber>, alteration: <Alteration> }
 *
 * * * * * * * * * * * * * * * * * * * * * * * */
class Interval extends TheoryObject {
  constructor () {
    super(...arguments)
    console.log('Interval - constructor')
  }

  get name () {
    return `${this.value.alteration.name}${this.value.intervalNumber.name}`
  }

  get asHalfSteps () {
    return this.value.intervalNumber.asHalfSteps + this.value.alteration.asHalfSteps
  }

  static readProps () {
    console.log('Interval - readProps')
    if (arguments.length === 2) {
      const intervalNumber = new IntervalNumber(arguments[0])
      const alteration = new Alteration(arguments[1])
      return { intervalNumber, alteration }
    } else if (arguments.length === 1) {
      if (typeof arguments[0] === 'string') {
        const alterationMatch = arguments[0].match(/^[#|b]*/)
        const alteration = new Alteration(alterationMatch[0])
        const intervalNumber = new IntervalNumber(arguments[0].replace(alterationMatch[0], ''))
        return { intervalNumber, alteration }
      } else if (typeof arguments[0] === 'number') {
        const loops = Math.floor(Math.abs(arguments[0]) / 12)
        const normalizedValue = Math.abs(arguments[0] % 12)
        const intervalName = Interval.halfStepsToIntervalName[normalizedValue]
        const alterationMatch = intervalName.match(/^[#|b]*/)
        const alteration = new Alteration(alterationMatch[0])
        const intervalNumber = new IntervalNumber(intervalName.replace(alterationMatch[0], ''))
        intervalNumber.value += loops * 7
        if (arguments[0] < 0) {
          intervalNumber.value *= - 1
          alteration.value *= - 1
        }
        return { intervalNumber, alteration }
      }
    }
    return {
      intervalNumber: new IntervalNumber(0),
      alteration: new Alteration()
    }
  }

  static intervalBetween (_a, _b) {
    const a = new Interval(_a)
    const b = new Interval(_b)
    const numberInterval = IntervalNumber.intervalBetween(a.value.intervalNumber, b.value.intervalNumber)
    const halfStepsDiff = b.asHalfSteps - a.asHalfSteps
    const alterationVal = halfStepsDiff - numberInterval.asHalfSteps
    const alteration = new Alteration(alterationVal)
    const interval = new Interval(numberInterval.value.intervalNumber.value, alteration)
    return interval
  }

  static sum (_a, _b) {
    const a = new Interval(_a)
    const b = new Interval(_b)
    const alteration = Alteration.sum(a.value.alteration, b.value.alteration)
    const intervalNumber = IntervalNumber.sum(a.value.intervalNumber, b.value.intervalNumber)
    return new Interval(intervalNumber, alteration)
  }

  static liftNumber (_a, _b) {
    const a = new Interval(_a)
    const b = new IntervalNumber(_b)
    const newIntervalNumber = IntervalNumber.sum(a.value.intervalNumber, b)
    const newInterval = new Interval(newIntervalNumber, a.value.alteration)
    const diffAlteration = new Alteration(-1 * (newInterval.asHalfSteps - a.asHalfSteps))
    const alteration = Alteration.sum(a.value.alteration, diffAlteration)
    const interval = new Interval(newIntervalNumber, alteration)
    return interval
  }

  static halfStepsToIntervalName = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7']
}

/* * * * * * * * * * * * * * * * * * * * * * * * 
 *
 * SCALE
 * --
 * Value:
 * steps: [...<Interval>]
 *
 * * * * * * * * * * * * * * * * * * * * * * * */
// new Scale('x-x-xx-x-x-x')
// new Scale(3251)
// new Scale(['1', 'b2', 'b3', '4', '5', '6', 'b7'])
// new Scale('mixolydian')

class Scale extends TheoryObject {
  constructor () {
    super(...arguments)
    console.log('Scale - constructor')
  }

  get lol () {
    return this.value.map(e => e.name).join(',')
  }

  static readProps () {
    console.log('Scale - readProps')
    if (arguments.length === 1) {
      if (Array.isArray(arguments[0])) {
        return arguments[0].map(e => new Interval(e))
      } else if (typeof arguments[0] === 'number') {
        const rawBinary = arguments[0].toString(2).split('').reverse().join('')
        const completion = '000000000000'
        const binary = (rawBinary + completion.slice(rawBinary.length)).slice(0, 12)
        const pattern = binary.replace(/1/igm, 'x').replace(/0/igm, '-')
        return Scale.fromPattern(pattern)
      } else if (typeof arguments[0] === 'string' && arguments[0].match(/^[x-]+$/igm)) {
        return Scale.fromPattern(arguments[0])
      } else if (typeof arguments[0] === 'string') {
        return Scale.fromName(arguments[0])
      }
    }
    return ['1', '2', '3', '4', '5', '6', '7'].map(e => new Interval(e))
  }

  static fromPattern (pattern) {
    const numbersList = pattern
      .split('')
      .map((e, i) => e === 'x' ? i : null)
      .filter(e => typeof e === 'number')

    // Transform number into interval, assign a slot to it
    const rawIntervals = numbersList.map(number => new Interval(number))
    const intervals = Scale.allocateIntervals(rawIntervals, pattern.length - 1)
    return intervals
  }

  static fromName (name) {
    return ['1', '2', '3', '4', '5', '6', '7'].map(e => new Interval(e)) 
  }

  static allocateIntervals (intervals, length) {
    const intervalsWithSlots = intervals.map((interval, i) => {
      const intervalNumber = interval.value.intervalNumber
      const slot = intervalNumber.value
      return { interval, slot }
    })

    // Find how many slots we need
    const maxSlot = new Interval(length).value.intervalNumber.value
    const nbSlots = Math.max(7, maxSlot + 1)
    
    // Find how many steps per slot we're looking for
    const steps = intervals.length
    const room = nbSlots - steps
    const maxPerSlot = Math.ceil(steps / nbSlots)
    const minPerSlot = Math.floor(steps / nbSlots)
    const slots = new Array(nbSlots).fill(null).map(e => ([]))

    // Push intervals in slots
    intervalsWithSlots.forEach(n => slots[n.slot].push(n.interval))

    // From bottom to top, find oversized slots and move
    // greater intervals to upper slot if there is room above it
    for (let i = 0 ; i < slots.length ; i++) {
      const slot = slots[i]
      const restOfSlots = slots.slice(i)
      if (slot.length > maxPerSlot) {
        const nextVacantPosInRest = restOfSlots.findIndex(slot => slot.length <= minPerSlot)
        if (nextVacantPosInRest > -1) {
          const slotsToLift = restOfSlots.slice(0, nextVacantPosInRest + 1)
          const liftedSlots = slotsToLift.map(e => ([]))
          slotsToLift.forEach((slot, j) => {
            if (j === 0) {
              const minIntervalValue = Math.min(...slot.map(int => int.asHalfSteps))
              const minInterval = slot.find(interval => interval.asHalfSteps === minIntervalValue)
              const toLift = slot.filter(interval => interval !== minInterval)
              const lifted = toLift.map(interval => Interval.liftNumber(interval, 1))
              liftedSlots[j].push(minInterval)
              liftedSlots[j + 1].push(...lifted)
            } else if (j < slotsToLift.length - 1) {
              const lifted = slot.map(interval => Interval.liftNumber(interval, 1))
              liftedSlots[j + 1].push(...lifted)
            } else {
              liftedSlots[j].push(...slot)
            }
          })
          liftedSlots.forEach((slot, j) => { slots[j + i] = slot })
        }
      }
    }

    // From top to bottom, find oversized slots and move
    // lesser intervals to lower slot if there is room below it
    slots.reverse()
    for (let i = 0 ; i < slots.length ; i++) {
      const slot = slots[i]
      const restOfSlots = slots.slice(i)
      if (slot.length > maxPerSlot) {
        const nextVacantPosInRest = restOfSlots.findIndex(slot => slot.length <= minPerSlot)
        if (nextVacantPosInRest > -1) {
          const slotsToDrop = restOfSlots.slice(0, nextVacantPosInRest + 1)
          const droppedSlots = slotsToDrop.map(e => ([]))
          slotsToDrop.forEach((slot, j) => {
            if (j === 0) {
              const minIntervalValue = Math.min(...slot.map(int => int.asHalfSteps))
              const minInterval = slot.find(interval => interval.asHalfSteps === minIntervalValue)
              const toDrop = slot.filter(interval => interval !== minInterval)
              const dropped = toDrop.map(interval => Interval.liftNumber(interval, -1))
              droppedSlots[j].push(minInterval)
              droppedSlots[j + 1].push(...dropped)
            } else if (j < slotsToDrop.length - 1) {
              const dropped = slot.map(interval => Interval.liftNumber(interval, -1))
              droppedSlots[j + 1].push(...dropped)
            } else {
              droppedSlots[j].push(...slot)
            }
          })
          droppedSlots.forEach((slot, j) => { slots[j + i] = slot })
        }
      }
    }
    slots.reverse()
    const result = []
    slots.forEach(s => s.forEach(i => result.push(i)))
    return result
  }
}

/* * * * * * * * * * * * * * * * * * * * * * * * 
 *
 * SCALE
 * --
 * Value:
 * <BitArray>
 *
 * * * * * * * * * * * * * * * * * * * * * * * */
// class Scale extends TheoryObject {
//   constructor () {
//     super(...arguments)
//   }

//   get decimalName () {
//     return parseInt(this.value.join(''), 2)
//   }

//   get binaryName () {
//     return this.value.join('')
//   }

//   get pattern () {
//     return this.value.map(bit => bit ? 'x' : '-').join('')
//   }

//   static readProps () {
//     if (arguments.length === 1) {
//       if (Array.isArray(arguments[0])) {
//         /* bit array */
//         if (arguments[0].every(bit => bit === 0 || bit === 1)) {
//           return arguments[0]
//         /* steps array */
//         } else if ('array of steps') {
//           /* [WIP] */
//           return [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1]
//         }
//       /* decimal name */
//       } else if (typeof arguments[0] === 'number') {
//         return parseInt(arguments[0], 10)
//           .toString(2)
//           .split('')
//           .map(e => parseInt(e))
//       } else if (typeof arguments[0] === 'string') {
//         const isBinaryName = arguments[0].split('').every(char => char.match(/[0|1]/igm))
//         const isPattern = arguments[0].split('').every(char => char.match(/[-|x]/igm))
//         /* binary name */
//         if (isBinaryName) {
//           return arguments[0].split('')
//             .map(char => parseInt(char, 10))
//         /* pattern */
//         } else if (isPattern) {
//           return arguments[0].split('')
//             .map(char => char === '-' ? 0 : 1)
//         /* name */
//         } else {
//           return Scale.nameToBitArray(arguments[0])
//         }

//       } else return [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1]
//     }
//   }

//   static nameToBitArray (name) {
//     let walter = name.replace(/\s/igm, '')
//     let output = [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0]
//     while (walter.length) {
//       console.log(walter)
//       const matchingQuality = Scale.qualities.find(quality => walter.match(quality.regexp))
//       if (!matchingQuality) {
//         console.log('no quality matching')
//         walter = ''
//       } else {
//         const match = walter.match(matchingQuality.regexp)[0]
//         walter = walter.slice(match.length)
//         output = matchingQuality.effect(output)
//         console.log(matchingQuality)
//         console.log(match)
//         console.log(output)
//       }
//     }
//     return [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1] 
//   }

//   static qualities = [
//     {
//       regexp: /^mixolydian/,
//       effect: bitArray => bitArray.length !== 12 ? bitArray : [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0]
//     }, {
//       regexp: /^sus24/,
//       effect: bitArray => bitArray.length !== 12 ? bitArray : bitArray.map((bit, i) => {
//         if (i === 2 || i === 5) return 1
//         if (i === 3 || i === 4) return 0
//         return bit
//       })
//     }, {
//       regexp: /^sus2/,
//       effect: bitArray => bitArray.length !== 12 ? bitArray : bitArray.map((bit, i) => {
//         if (i === 2) return 1
//         if (i === 3 || i === 4) return 0
//         return bit
//       })
//     }, {
//       regexp: /^sus4/,
//       effect: bitArray => bitArray.length !== 12 ? bitArray : bitArray.map((bit, i) => {
//         if (i === 3 || i === 4) return 0
//         if (i === 5) return 1
//         return bit
//       })
//     }, {
//       regexp: /^aug/,
//       effect: bitArray => bitArray.length !== 12 ? bitArray : bitArray.map((bit, i) => {
//         if (i === 3 || i === 7) return 0
//         if (i === 4 || i === 8) return 1
//         return bit
//       })
//     }, {
//       regexp: /^dim7/,
//       effect: bitArray => bitArray.length !== 12 ? bitArray : bitArray.map((bit, i) => {
//         if (i === 3 || i === 6 || i === 9) return 1
//         if (i === 4 || i === 7) return 0
//         return bit
//       })
//     }, {
//       regexp: /^dim/,
//       effect: bitArray => bitArray.length !== 12 ? bitArray : bitArray.map((bit, i) => {
//         if (i === 3 || i === 6) return 1
//         if (i === 4 || i === 7) return 0
//         return bit
//       })
//     }, {
//       regexp: /^M7/,
//       effect: bitArray => bitArray.length !== 12 ? bitArray : bitArray.map((bit, i) => {
//         if (i === 10) return 0
//         if (i === 11) return 1
//         return bit
//       })
//     }, {
//       regexp: /^7/,
//       effect: bitArray => bitArray.length !== 12 ? bitArray : bitArray.map((bit, i) => {
//         if (i === 10) return 1
//         if (i === 11) return 0
//         return bit
//       })
//     }, {
//       regexp: /^M/,
//       effect: bitArray => bitArray.length !== 12 ? bitArray : bitArray.map((bit, i) => {
//         if (i === 3) return 0
//         if (i === 4) return 1
//         return bit
//       })
//     }, {
//       regexp: /^m/,
//       effect: bitArray => bitArray.length !== 12 ? bitArray : bitArray.map((bit, i) => {
//         if (i === 3) return 1
//         if (i === 4) return 0
//         return bit
//       })
//     }, {
//       regexp: /^add\([b|#]*[1-7]\)/,
//       effect: null
//     }
//   ]
// }

/*

5
--- sus2
--- dim
--- m
-- M
-- aug
--- sus4
-- sus2/4
--- 7
--- M7
dim7


*/

/* * * * * * * * * * * * * * * * * * * * * * * * 
 *
 * FUNDAMENTAL FREQUENCY
 * --
 * Value:
 * number
 *
 * * * * * * * * * * * * * * * * * * * * * * * */
// class FundamentalFrequency extends TheoryObject {
//   constructor (props) {
//     super(props)
//     this.value = FundamentalFrequency.readProps(props)
//   }

//   static readProps (props) {
//     if (typeof props === 'number') return props
//     if (typeof props === 'string') {
//       const parsed = parseFloat(props)
//       return Number.isNaN(parsed) ? 440 : parsed
//     }
//     return 440
//   }
// }

/* * * * * * * * * * * * * * * * * * * * * * * * 
 *
 * TEMPERAMENT
 * --
 * Value:
 * ...cents
 *
 * * * * * * * * * * * * * * * * * * * * * * * */
// class Temperament extends TheoryObject {
//   constructor (props) {
//     super(props)
//     this.value = Temperament.readProps(props) // cents list
//   }

//   get name () {
//     const isNameKnown = Temperament.namesAndCents.find(pair => pair.cents.join('/') === this.value.join('/'))
//     return isNameKnown ? isNameKnown.name : null
//   }

//   static readProps (props) {
//     if (Array.isArray(props)) return props
//     if (typeof props === 'string') {
//       const isNameKnown = Temperament.namesAndCents.find(pair => pair.name === props)
//       if (isNameKnown) return isNameKnown.cents
//       return Temperament.readProps('12tet')  
//     }
//     return Temperament.readProps('12tet')
//   }

//   static namesAndCents = [
//     { name: '12tet', cents: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100] }
//   ]

//   // play (duration = '8n', time, velocity) {
//   //   this.value.forEach((cents, i) => {
//   //     const outPitch = Pitch.addCents(new Pitch(440), cents)
//   //     const outTime = new Tone.Time(duration).toSeconds() * i + new Tone.Time(time).toSeconds()
//   //     outPitch.play(duration, `+${outTime}`, velocity)
//   //   })
//   // }
// }


