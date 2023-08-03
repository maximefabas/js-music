// 'use strict'

const utils = {
  log_cnt: 0,
  log: function (...params) {
    utils.log_cnt++
    console.log(utils.log_cnt, ...params)
  },
  info: function (...params) {
    console.info(...params)
  },
  error: function (...params) {
    console.error(...params)
  }
}

/* * * * * * * * * * * * * * * * * * * * * * * * 
 *
 * THEORY OBJECT
 *
 * * * * * * * * * * * * * * * * * * * * * * * */
class TheoryObject {
  constructor () {
    utils.log(`${this.constructor.name}.__proto__.constructor() -`, arguments)
    this._id = new Array(4).fill(0).map(e => Math.random().toString(36).slice(2)).join('-')
    this._value = undefined
    this._value_history = []
    this.init(...arguments)
    utils.log(`${this.constructor.name}.__proto__.constructor() - constructed`, this._value)
  }

  init () {
    utils.log(`${this.constructor.name}().__proto__.init()`, arguments)
    if (arguments.length === 0) this.value = this.constructor.defaultValue    
    else if (arguments.length === 1 && (arguments[0] === null || arguments[0] === undefined)) this.value = this.constructor.defaultValue
    else if (arguments.length === 1 && arguments[0].constructor === this.constructor) this.value = arguments[0]._.value
    else if (arguments.length === 1 && typeof arguments[0] === 'string' && this.constructor.isNameValid(arguments[0])) this.value = this.constructor.nameToValue(arguments[0])
    else if (arguments.length === 1) this.value = this.constructor.propsToValue(arguments[0])
    else this.value = this.constructor.propsToValue(...arguments)
  }

  get value () {
    utils.log(`${this.constructor.name}().__proto__.value - GET -`, this._value)
    return this._value
  }

  set value (value) {
    if (!this.constructor.isValueValid(value)) {
      utils.log(`${this.constructor.name}().__proto__.value - SET - invalid value -`, value)
      return
    }
    this._value_history.push({ value, timestamp: Date.now() })
    this._value = value
    utils.log(`${this.constructor.name}().__proto__.value - SET -`, value)
  }

  get name () {
    const name = this.constructor.valueToName(this.value)
    utils.log(`${this.constructor.name}().__proto__.name - GET`, name)
    return this.constructor.valueToName(this.value)
  }

  set name (name) {
    if (!this.constructor.isNameValid(name)) {
      utils.log(`${this.constructor.name}().__proto__.name - SET - invalid name -`, name)
      return
    }
    const newVal = this.constructor.nameToValue(name)
    this.value = newVal
    utils.log(`${this.constructor.name}().__proto__.name - SET -`, name)
  }

  get _ () {
    const copy = new this.constructor(this.name)
    utils.log(`${this.constructor.name}().__proto__._ - GET -`, copy)
    return copy
  }

  static get nameRegexp () {
    const regexp = /^$/
    utils.log(`${this.constructor.name}().__proto__.nameRegexp - GET -`, regexp)
    return regexp
  }

  static get defaultValue () {
    utils.log(`${this.constructor.name}.__proto__.defaultValue - GET -`, null)
    return null
  }
  
  static isNameValid (name) {
    if (typeof name !== 'string') {
      utils.log(`${this.constructor.name}.__proto__.isNameValid() -`, name, false)
      return false
    }
    const match = name.match(new RegExp(`^${this.nameRegexp.source}$`))
    const result = match ? true : false
    utils.log(`${this.constructor.name}.__proto__.isNameValid() -`, name, result)
    return result
  }
  
  static nameToValue (name) {
    utils.log(`${this.constructor.name}.__proto__.nameToValue() -`, name, null)
    return null
  }
  
  static propsToValue (props) {
    utils.log(`${this.constructor.name}.__proto__.propsToValue() -`, props, null)
    return null
  }
  
  static isValueValid (value) {
    utils.log(`${this.constructor.name}.__proto__.isValueValid() -`, value, value === null)
    return value === null
  }

  static valueToName (value) {
    utils.log(`${this.constructor.name}.__proto__.valueToName() -`, value, '')
    return ''
  }

  static toX (val, x) {
    const mod = val % x
    const result = mod < 0 ? (mod + x) : mod
    utils.log(`${this.constructor.name}.__proto__.toX() -`, val, x, result)
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
    utils.log('PitchLetter.constructor() -', arguments)
    super(...arguments)
    utils.log('PitchLetter.constructor() - constructed -', this.value)
  }

  static get nameRegexp () {
    const regexp = /[abcdefg]/
    utils.log('PitchLetter.defaultValue -', /[abcdefg]/)
    return regexp
  }
  
  static get defaultValue () {
    utils.log('PitchLetter.defaultValue -', 0)
    return 0
  }
  
  static nameToValue (name) {
    if (!this.isNameValid(name)) {
      utils.log('PitchLetter.nameToValue() - invalid name -', name, undefined)
      return undefined
    }
    const index = PitchLetter.letters.indexOf(name)
    const result = index !== -1 ? index : this.defaultValue
    utils.log('PitchLetter.nameToValue() -', name, result)
    return result
  }
  
  static propsToValue (...props) {
    const defaultValue = this.defaultValue
    if (props.length === 1) {
      if (typeof props[0] === 'number') {
        const result = TheoryObject.toX(parseInt(props[0], 10), PitchLetter.letters.length)
        utils.log('PitchLetter.propsToValue() -', props, result)
        return result
      }
      utils.log('PitchLetter.propsToValue() -', props, defaultValue)
      return defaultValue
    } else {
      utils.log('PitchLetter.propsToValue() -', props, defaultValue)
      return defaultValue
    }
  }

  static isValueValid (value) {
    const result = Number.isInteger(value) && value >= 0 && value <= 6
    utils.log('PitchLetter.isValueValid() -', value, result)
    return result
  }
  
  static valueToName (value) {
    const result = this.isValueValid(value) ? PitchLetter.letters[value] : undefined
    utils.log('PitchLetter.valueToName() -', value, result)
    return result
  }

  /* intervalBetween */
  static intervalBetween (_a, _b) {
    const a = new PitchLetter(_a).name
    const b = new PitchLetter(_b).name
    const posOfA = PitchLetter.letters.indexOf(a)
    const posOfB = PitchLetter.letters.indexOf(b)
    if (posOfA === -1 || posOfB === -1) {
      utils.log('PitchLetter.intervalBetween() -', _a, _b, undefined)
      return
    }
    const intervalNumber = posOfB - posOfA >= 0
      ? new IntervalNumber(posOfB - posOfA)
      : new IntervalNumber(PitchLetter.letters.length + posOfB - posOfA)
    const intervalNumberAsHalfSteps = intervalNumber.asHalfSteps
    const halfStepsFromValues = posOfB - posOfA >= 0
      ? PitchLetter.lettersValues[posOfB] - PitchLetter.lettersValues[posOfA]
      : 12 + PitchLetter.lettersValues[posOfB] - PitchLetter.lettersValues[posOfA]
    const alteration = new Alteration(halfStepsFromValues - intervalNumberAsHalfSteps)
    const result = new Interval(intervalNumber, alteration)
    utils.log('PitchLetter.intervalBetween() -', _a, _b, result)
    return result
  }

  static get letters () {
    const result = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
    utils.log('PitchLetter.letters - GET -', result)
    return result
  }
  static get lettersValues () {
    const result = [0, 2, 3, 5, 7, 8, 10]
    utils.log('PitchLetter.lettersValues - GET -', result)
    return result
  }
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
    utils.log('Alteration.constructor() -', arguments)
    super(...arguments)
    utils.log('Alteration.constructor() - constructed -', this.value)
  }

  get asHalfSteps () {
    utils.log('Alteration().asHalfSteps() -', this.value)
    return this.value
  }

  static get nameRegexp () { 
    const regexp = /[#b]*/
    utils.log('Alteration().nameRegexp - GET -', regexp)
    return regexp
  }
  
  static get defaultValue () {
    utils.log('Alteration.defaultValue -', 0)
    return 0
  }

  static nameToValue (name) {
    if (!this.isNameValid(name)){
      utils.log('Alteration.nameToValue() - invalid name -', name, undefined)
      return undefined
    }
    const flats = name.length - name.split('b').join('').length
    const sharps = name.length - name.split('#').join('').length
    const value = sharps - flats
    utils.log('Alteration.nameToValue() -', name, value)
    return value 
  }
  
  static propsToValue (...props) {
    const defaultValue = this.defaultValue
    if (props.length === 1) {
      const value = typeof props[0] === 'number'
        ? parseInt(props[0], 10)
        : defaultValue
      utils.log('Alteration.propsToValue() -', props, value)
      return value
    } else {
      utils.log('Alteration.propsToValue() -', props, defaultValue)
      return defaultValue
    }
  }

  static isValueValid (value) {
    utils.log('Alteration.isValueValid() -', value, true)
    return true
  }

  static valueToName (value) {
    const name = value >= 0
      ? new Array(value).fill('#').join('')
      : new Array(-1 * value).fill('b').join('')
    utils.log('Alteration.valueToName() -', value, name)
    return name
  }

  static intervalBetween (_a, _b) {
    const a = new Alteration(_a).value
    const b = new Alteration(_b).value
    const interval = new Interval(0, b - a)
    utils.log('Alteration.intervalBetween() -', _a, _b, interval)
    return interval
  }

  static sum (_a, _b) {
    const a = new Alteration(_a).value
    const b = new Alteration(_b).value
    const alteration = new Alteration(a + b)
    utils.log('Alteration.sum() -', _a, _b, alteration)
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
    utils.log('PitchClass.constructor() -', arguments)
    super(...arguments)
    utils.log('PitchClass.constructor() - constructed -', this.value)
  }

  static get nameRegexp () {
    const regexp = new RegExp(`${Alteration.nameRegexp.source}${PitchLetter.nameRegexp.source}`)
    utils.log('PitchClass().nameRegexp - GET -', regexp)
    return regexp
  }
  
  static get defaultValue () {
    const defaultValue = {
      pitchLetter: new PitchLetter(),
      alteration: new Alteration()
    }
    utils.log('PitchClass.defaultValue -', defaultValue)
    return defaultValue
  }

  static nameToValue (name) {
    if (!this.isNameValid(name)) {
      utils.log('PitchClass.nameToValue() - invalid name -', name, undefined)
      return undefined
    }
    const altRegexp = new RegExp(`^${Alteration.nameRegexp.source}`)
    const alterationMatch = name.match(altRegexp)
    const alteration = alterationMatch ? alterationMatch[0] : ''
    const letterRegexp = new RegExp(`${PitchLetter.nameRegexp.source}$`)
    const letterMatch = name.slice(alteration.length).match(letterRegexp)
    const letter = letterMatch ? letterMatch[0] : ''
    const value = {
      pitchLetter: new PitchLetter(letter ? letter : 'b'),
      alteration: new Alteration(letter ? alteration : alteration.slice(0, 1))
    }
    utils.log('PitchClass.nameToValue() -', name, value)
    return value
  }

  static propsToValue (...props) {
    const defaultValue = this.defaultValue
    if (props.length === 2) {
      const pitchLetter = new PitchLetter(props[0])
      const alteration = new Alteration(props[1])
      const value = { pitchLetter, alteration }
      utils.log('PitchClass.propsToValue() -', props, value)
      return value
    } else if (props.length === 1) {
      utils.log('PitchClass.propsToValue() -', props, defaultValue)
      return defaultValue
    } else {
      utils.log('PitchClass.propsToValue() -', props, defaultValue)
      return defaultValue
    }
  }

  static isValueValid (value) {
    utils.log('PitchClass.isValueValid() -', value, true)
    return true
  }

  static valueToName (value) {
    const name = `${value.alteration.name}${value.pitchLetter.name}`
    utils.log('PitchClass.valueToName() -', value, name)
    return name
  }

  static intervalBetween (_a, _b) {
    const a = new PitchClass(_a).value
    const b = new PitchClass(_b).value
    const pitchLetterInterval = PitchLetter.intervalBetween(a.pitchLetter, b.pitchLetter)
    const alterationInterval = Alteration.intervalBetween(a.alteration, b.alteration)
    const interval = Interval.sum(pitchLetterInterval, alterationInterval)
    utils.log('PitchClass.intervalBetween() -', _a, _b, interval)
    return interval
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
    utils.log('Octave.constructor() -', arguments)
    super(...arguments)
    utils.log('Octave.constructor() - constructed -', this.value)
  }

  get asHalfSteps () {
    const halfSteps = 12 * this.value
    utils.log('Octave().asHalfSteps - GET -', halfSteps)
    return halfSteps
  }

  static get nameRegexp () {
    const regexp = /\^[0-9]+/
    utils.log('Octave.nameRegexp - GET -', regexp)
    return regexp
  }

  static get defaultValue () {
    const value = 4
    utils.log('Octave.defaultValue - GET -', value)
    return 4
  }

  static nameToValue (name) {
    if (!this.isNameValid(name)) {
      utils.log('Octave.nameToValue() - invalid name -', name, undefined)
      return undefined
    }
    const match = name.match(new RegExp(`^${Octave.nameRegexp.source}$`))
    const strValue = match[0].slice(1)
    const value = parseInt(strValue, 10)
    utils.log('Octave.nameToValue() -', name, value)
    return value
  }

  static propsToValue (...props) {
    const defaultValue = this.defaultValue
    if (props.length === 1) {
      if (typeof props[0] === 'number') {
        const value = parseInt(props[0], 10)
        utils.log('Octave.propsToValue() -', props, value)
        return value
      } else {
        utils.log('Octave.propsToValue() -', props, defaultValue)
        return defaultValue
      }
    }
    utils.log('Octave.propsToValue() -', props, defaultValue)
    return defaultValue
  }

  static isValueValid (value) {
    utils.log('Octave.isValueValid() -', value, true)
    return true
  }

  static valueToName (value) {
    const name = `^${value}`
    utils.log('Octave.valueToName() -', value, name)
    return name
  }

  static intervalBetween (_a, _b) {
    const a = new Octave(_a)
    const b = new Octave(_b)
    const interval = new Interval(12 * (b.value - a.value))
    utils.log('Octave.intervalBetween() -', _a, _b, interval)
    return interval
  }

  static sum (_a, _b) {
    const a = new Octave(_a).value
    const b = new Octave(_b).value
    const octave = new Octave(a + b)
    utils.log('Octave.sum() -', _a, _b, octave)
    return octave
  }
}

/* * * * * * * * * * * * * * * * * * * * * * * * 
 *
 * PITCH
 * --
 * Value:
 * { pitchClass: <PitchClass>, octave: <Octave> }
 *
 * * * * * * * * * * * * * * * * * * * * * * * */
class Pitch extends TheoryObject {
  constructor () {
    utils.log('Pitch.constructor() -', arguments)
    super(...arguments)
    utils.log('Pitch.constructor() - constructed -', this.value)
  }

  static get nameRegexp () {
    const regexp = new RegExp(`${PitchClass.nameRegexp.source}(${Octave.nameRegexp.source})?`)
    utils.log('Pitch.nameRegexp - GET -', regexp)
    return regexp
  }

  static get defaultValue () {
    const value = { pitchClass: new PitchClass(), octave: new Octave() }
    utils.log('Pitch.defaultValue - GET -', value)
    return value
  }
  
  static nameToValue (name) {
    if (!this.isNameValid(name)) {
      utils.log('Pitch.nameToValue() - invalid name -', name, undefined)
      return undefined
    }
    const pitchClassMatch = name.match(new RegExp(`^${PitchClass.nameRegexp.source}`))
    const octaveMatch = name.match(new RegExp(`${Octave.nameRegexp.source}$`))
    const pitchClassMatched = pitchClassMatch ? pitchClassMatch[0] : undefined
    const octaveMatched = octaveMatch ? octaveMatch[0] : undefined
    const pitchClass = new PitchClass(pitchClassMatched)
    const octave = new Octave(octaveMatched)
    const value = { pitchClass, octave }
    utils.log('Pitch.nameToValue() -', name, value)
    return value
  }

  static propsToValue (...props) {
    const defaultValue = this.defaultValue
    if (props.length === 2) {
      const pitchClass = new PitchClass(props[0])
      const octave = new Octave(props[1])
      const value = { pitchClass, octave }
      utils.log('Pitch.propsToValue() -', props, value)
      return value
    } else if (props.length === 1) {
      utils.log('Pitch.propsToValue() -', props, defaultValue)
      return defaultValue
    }
    utils.log('Pitch.propsToValue() -', props, defaultValue)
    return defaultValue
  }

  static isValueValid (value) {
    utils.log('Pitch.isValueValid() -', value, true)
    return true
  }

  static valueToName (value) {
    const name = `${value.pitchClass.name}${value.octave.name}`
    utils.log('Pitch.valueToName() -', value, name)
    return name
  }

  static intervalBetween (_a, _b) {
    const a = new Pitch(_a)
    const b = new Pitch(_b)
    const betweenClasses = PitchClass.intervalBetween(a.value.pitchClass, b.value.pitchClass)
    const betweenOctaves = Octave.intervalBetween(a.value.octave, b.value.octave)
    const interval = Interval.sum(betweenClasses, betweenOctaves)
    utils.log('Pitch.intervalBetween() -', _a, _b, interval)
    return interval
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
    utils.log('IntervalNumber.constructor() -', arguments)
    super(...arguments)
    utils.log('IntervalNumber.constructor() - constructed -', this.value)
  }

  get asHalfSteps () {
    const loops = Math.floor(Math.abs(this.value) / 7)
    const normalizedValue = Math.abs(this.value % 7)
    const halfSteps = this.value >= 0
      ? loops * 12 + IntervalNumber.numbersToHalfSteps[normalizedValue]
      : loops * -12 - IntervalNumber.numbersToHalfSteps[normalizedValue]
    utils.log('IntervalNumber().asHalfSteps - GET -', halfSteps)
    return halfSteps
  }

  static get nameRegexp () {
    const regexp = /-?[0-9]+/
    utils.log('IntervalNumber.nameRegexp - GET -', regexp)
    return regexp
  }

  static get defaultValue () {
    utils.log('IntervalNumber.defaultValue - GET -', 0)
    return 0
  }
  
  static nameToValue (name) {
    if (!this.isNameValid(name)) {
      utils.log('IntervalNumber.nameToValue() - invalid name -', name, undefined)
      return undefined
    }
    const parsed = parseInt(name, 10)
    const value = parsed > 0 ? parsed - 1 : parsed === 0 ? parsed : parsed + 1
    utils.log('IntervalNumber.nameToValue() -', name, value)
    return value
  }

  static propsToValue (...props) {
    const defaultValue = this.defaultValue
    if (props.length === 1) {
      if (typeof props[0] === 'number') {
        const value = parseInt(props[0], 10)
        utils.log('IntervalNumber.propsToValue() -', props, value)
        return value
      } else {
        utils.log('IntervalNumber.propsToValue() -', props, defaultValue)
        return defaultValue
      }
    }
    utils.log('IntervalNumber.propsToValue() -', props, defaultValue)
    return defaultValue
  }

  static isValueValid (value) {
    utils.log('IntervalNumber.isValueValid() -', value, true)
    return true
  }

  static valueToName (value) {
    const name = value >= 0
      ? `${value + 1}`
      : `${value - 1}`
    utils.log('IntervalNumber.valueToName() -', value, name)
    return name
  }

  static sum (_a, _b) {
    const a = new IntervalNumber(_a)
    const b = new IntervalNumber(_b)
    const intervalNumber = new IntervalNumber(a.value + b.value)
    utils.log('IntervalNumber.sum() -', _a, _b, intervalNumber)
    return intervalNumber
  }

  static intervalBetween (_a, _b) {
    const a = new IntervalNumber(_a)
    const b = new IntervalNumber(_b)
    const diff = b.value - a.value
    const interval = new Interval(diff, 0)
    utils.log('IntervalNumber.intervalBetween() -', _a, _b, interval)
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
    utils.log('Interval.constructor() -', arguments)
    super(...arguments)
    utils.log('Interval.constructor() - constructed -', this.value)
  }

  get asHalfSteps () {
    const halfSteps = this.value.intervalNumber.asHalfSteps + this.value.alteration.asHalfSteps
    utils.log('Interval().asHalfSteps - GET -', halfSteps)
    return halfSteps
  }

  static get nameRegexp () {
    const regexp = new RegExp(`${Alteration.nameRegexp.source}${IntervalNumber.nameRegexp.source}`)
    utils.log('Interval.nameRegexp - GET -', regexp)
    return regexp
  }

  static get defaultValue () {
    const value = {
      intervalNumber: new IntervalNumber(),
      alteration: new Alteration()
    }
    utils.log('IntervalNumber.defaultValue - GET -', value)
    return value
  }
  
  static nameToValue (name) {
    if (!this.isNameValid(name)) {
      utils.log('Interval.nameToValue() - invalid name -', name, undefined)
      return undefined
    }
    const alterationMatch = name.match(new RegExp(`^${Alteration.nameRegexp.source}`))
    const intervalNumberMatch = name.match(new RegExp(`${IntervalNumber.nameRegexp.source}$`))
    const alterationMatched = alterationMatch ? alterationMatch[0] : undefined
    const intervalNumberMatched = intervalNumberMatch ? intervalNumberMatch[0] : undefined
    const alteration = new Alteration(alterationMatched)
    const intervalNumber = new IntervalNumber(intervalNumberMatched)
    const value = { alteration, intervalNumber }
    utils.log('Interval.nameToValue() -', name, value)
    return value
  }

  static propsToValue (...props) {
    if (props.length === 2) {
      const intervalNumber = new IntervalNumber(props[0])
      const alteration = new Alteration(props[1])
      return { intervalNumber, alteration }
    } else if (props.length === 1) {
      if (typeof props[0] === 'number') {
        const loops = Math.floor(Math.abs(props[0]) / 12)
        const normalizedValue = Math.abs(props[0] % 12)
        const intervalName = Interval.halfStepsToIntervalName[normalizedValue]
        const alterationMatch = intervalName.match(/^[#|b]*/)
        const alteration = new Alteration(alterationMatch[0])
        const intervalNumber = new IntervalNumber(intervalName.replace(alterationMatch[0], ''))
        intervalNumber.value += loops * 7
        if (props[0] < 0) {
          intervalNumber.value *= - 1
          alteration.value *= - 1
        }
        return { intervalNumber, alteration }
      } else {
        return this.defaultValue
      }
    }
    return this.defaultValue
  }

  static isValueValid (value) {
    return true
  }

  static valueToName (value) {
    return `${value.alteration.name}${value.intervalNumber.name}`
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
  }

  static romanNumeralRegexp = /([IVXLCDM]+|[ivxlcdm]+)/;
  static scaleNameRegexp = /(major|minor|mixolydian|phrygian)/;
  static qualityRegexp = /(m|M|sus24|sus2|sus4|dim7|dim|aug|7|M7)/;
  static modifierRegexp = Interval.nameRegexp;
  static addFunctionParametersRegexp = new RegExp(`(${Interval.nameRegexp.source})(,(${Interval.nameRegexp.source}))*`);
  static noFunctionParametersRegexp = new RegExp(`(${Interval.nameRegexp.source})(,(${Interval.nameRegexp.source}))*`);
  static functionRegexp = new RegExp(`(add\((${this.addFunctionParametersRegexp.source})\)|no\((${this.noFunctionParametersRegexp.source})\))`);
  static pitchClassRegexp = PitchClass.nameRegexp;
  static localScaleIntervalRegexp = Interval.nameRegexp;
  static contextScaleIntervalRegexp = new RegExp(`{(${Interval.nameRegexp.source})}`);
  static localScaleStepRegexp = new RegExp(`{{(${IntervalNumber.nameRegexp.source})}}`);
  static contextScaleStepRegexp = new RegExp(`{{{(${IntervalNumber.nameRegexp.source})}}}`);
  static inversionRegexp = new RegExp(`\/((${this.pitchClassRegexp.source})|(${this.localScaleIntervalRegexp.source})|(${this.contextScaleIntervalRegexp.source})|(${this.localScaleStepRegexp.source})|(${this.contextScaleStepRegexp.source}))`);
  static shifterRegexp = new RegExp(`\|((${this.romanNumeralRegexp})|(${this.pitchClassRegexp.source})|(${this.contextScaleIntervalRegexp.source})|(${this.localScaleStepRegexp.source}))`);
  static nameRegexp = new RegExp(`^(${this.romanNumeralRegexp.source},?)?(((${this.scaleNameRegexp.source})|(${this.qualityRegexp.source})|(${this.modifierRegexp.source})|(${this.functionRegexp.source})),?)*(${this.inversionRegexp})?(${this.shifterRegexp})?$`)

  static readProps () {
    if (arguments.length === 1) {
      if (Array.isArray(arguments[0])) {
        return arguments[0].map(e => new Interval(e))
      } else if (typeof arguments[0] === 'number') {
        const rawBinary = arguments[0].toString(2).split('').reverse().join('')
        const completion = '000000000000'
        const binary = (rawBinary + completion.slice(rawBinary.length)).slice(0, 12)
        const pattern = binary.replace(/1/igm, 'x').replace(/0/igm, '-')
        return this.fromPattern(pattern)
      } else if (typeof arguments[0] === 'string' && arguments[0].match(/^[x-]+$/igm)) {
        return this.fromPattern(arguments[0])
      } else if (typeof arguments[0] === 'string') {
        return this.fromName(arguments[0])
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
    const intervals = this.allocateIntervals(rawIntervals, pattern.length - 1)
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

/*

Key = C major

Accord / note - D/A
Accord / intervalle dans l'accord - D/5
Accord / intervalle de scale - D/{6}
Accord / position de note dans l'accord - D/{{3}}

Accord relatif / intervalle dans l'accord - II/5
Accord relatif / intervalle de scale - II/{6}
Accord relatif / position de note dans l'accord - II/{{3}}

V/5|5 —> V = G —> V/5 = G/D —> V/5|5 —> D/A
V/{6}|{6} —> V = G —> V/{2} = G/D —> V/{2}|{6} = D/A
V/{{3}}|{{3}} —> V = G -> V/{{3}} = G/D -> V/{{3}}|{{3}} = A/E (impossible d'obtenir D/A dans cette forme)


const romanNumeralRegexp = /([IVXLCDM]+|[ivxlcdm]+)/
const scaleNameRegexp = /(major|minor|mixolydian|phrygian)/
const qualityRegexp = /(m|M|sus24|sus2|sus4|dim7|dim|aug|7|M7)/
const modifierRegexp = any interval —> Add or move

const addFunctionParametersRegexp = `(${Interval.nameRegexp.source})(,(${Interval.nameRegexp.source}))*`
const noFunctionParametersRegexp = `(${Interval.nameRegexp.source})(,(${Interval.nameRegexp.source}))*`

const functionRegexp = /(add\((${addFunctionParamsRegexp.source})\)|no\((${noFunctionParamsRegexp.source})\))/

const pitchClassRegexp = `${PitchClass.nameRegexp.source}`
const contextScaleIntervalRegexp = `{(${Interval.nameRegexp.source})}`
const localScaleStepRegexp = `{{(IntervalNumber.nameRegexp.source)}}`
const inversionRegexp = /\/((${pitchClassRegexp.source})|(${contextScaleIntervalRegexp.source})|(${localScaleStepRegexp.source}))/
const shifterRegexp = /|((${romanNumeralRegexp})|(${pitchClassRegexp.source})|(${contextScaleIntervalRegexp.source})|(${localScaleStepRegexp.source}))/

/4 —> 4,5,8,10

m/4 —> 4,5,8,b10

m/4|4 —> 4,5,8,b10 —> b7,8,11,13

---
romanNumeral 
scaleName | qualityRegexp | modifierRegexp | functionRegexp
inversionRegexp
shifterRegexp
---

const scaleNameRegexp = /
  ((${romanNumeralRegexp.source}(,)?)?
  ((${scaleNameRegexp.source}|${qualityRegexp.source}|${modifierRegexp.source}|${functionRegexp.source})(,)?)*
  (${inversionRegexp})?
  (${shifterRegexp})?
/





*/


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


m
M
sus2
sus4
sus24
dim
dim7
aug

b2
2
#2
... any interval name

add(<In>)


7
M7


Altered roman - /[#b]* / i,ii,iii,iv,v,vi,vii


I
II
III
IV
V
VI
VII
VIII
IX
X
XI
XII
XIII
XIV
XV
XVI
XVII
XVIII
XIX

units = /I{1,3}/






m,sus4,sus2,M7,dim,dim7,#5,




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


