import {
  Transport,
  start as startAudioContext
} from 'tone'
import absoluteModulo from './modules/absolute-modulo/index.js'
import arrayOf from './modules/array-of/index.js'
import clamp from './modules/clamp/index.js'
import random, { randomInt } from './modules/random/index.js'

/* # Utility types */
type ValueSetter<Descriptor, Value> = Descriptor | ((curr: Value) => Descriptor)

/* # Alteration */
type AlterationValue = number
type AlterationDescriptor = AlterationValue | Alteration
type AlterationSetter = ValueSetter<AlterationDescriptor, AlterationValue>
class Alteration {
  private _value: AlterationValue
  get value () { return this._value }
  get flatValue () { return this._value }
  
  mutate (setter: AlterationSetter): Alteration {
    if (setter instanceof Alteration) { this._value = setter.value }
    else {
      const desc = typeof setter === 'function' ? setter(this._value) : setter
      this._value = new Alteration(desc).value
    }
    return this
  }

  constructor (descriptor?: AlterationDescriptor) {
    if (descriptor instanceof Alteration) { this._value = descriptor._value }
    else { this._value = descriptor ?? 0 }
  }

  clone (): Alteration {
    return new Alteration(this.value)
  }

  static getRandom (): Alteration {
    const rand = Math.random()
    let value: number
    if (rand < .1) { value = -2 }
    else if (rand < .3) { value = -1 }
    else if (rand < .7) { value = 0 }
    else if (rand < .9) { value = 1 }
    else { value = 2 }
    return new Alteration(value)
  }

  add (desc: AlterationDescriptor = 1): Alteration {
    const toAdd = new Alteration(desc)
    return new Alteration(this.value + toAdd.value)
  }

  subtract (desc: AlterationDescriptor = 1): Alteration {
    const toAdd = new Alteration(desc)
    return new Alteration(this.value - toAdd.value)
  }

  static lessAltered (...alterationsDescs: AlterationDescriptor[]): Alteration | undefined {
    const sorted = alterationsDescs
      .map(altDesc => new Alteration(altDesc))
      .map(alt => {
        const altValue = alt.value
        return {
          alteration: alt,
          weight: altValue > 0
            ? altValue + .5
            : Math.abs(altValue)
        }
      })
      .sort((itemA, itemB) => itemA.weight - itemB.weight)
      .map(item => item.alteration)
    return sorted.at(0)
  }
}

/* # SimpleStep */
type SimpleStepValue = 0 | 1 | 2 | 3 | 4 | 5 | 6
type SimpleStepDescriptor = SimpleStepValue | SimpleStep
type SimpleStepSetter = ValueSetter<SimpleStepDescriptor, SimpleStepValue>
class SimpleStep {
  private _value: SimpleStepValue
  
  get value (): SimpleStepValue {
    return Math.floor(absoluteModulo(this._value, 7)) as SimpleStepValue
  }

  get flatValue () { return this._value }

  mutate (setter: SimpleStepSetter): SimpleStep {
    if (setter instanceof SimpleStep) { this._value = setter.value }
    else {
      const desc = typeof setter === 'function' ? setter(this._value) : setter
      this._value = new SimpleStep(desc).value
    }
    return this
  }

  constructor (descriptor?: SimpleStepDescriptor) {
    if (descriptor instanceof SimpleStep) { this._value = descriptor._value }
    else { this._value = descriptor ?? 0 }
  }

  clone (): SimpleStep {
    return new SimpleStep(this.value)
  }

  static getRandom (): SimpleStep {
    const value = randomInt(7) as SimpleStepValue
    return new SimpleStep(value)
  }

  static semitonesValues: [0, 2, 4, 5, 7, 9, 11] = [0, 2, 4, 5, 7, 9, 11]
  
  asSemitones (): number {
    return SimpleStep.semitonesValues[this.value]
  }

  toStep (): Step {
    return new Step(this.value)
  }
}

/* # Step */
type StepValue = number
type StepDescriptor = StepValue | Step
type StepSetter = ValueSetter<StepDescriptor, StepValue>
class Step {
  private _value: StepValue
  get value () { return this._value }
  get flatValue () { return this._value }
  
  mutate (setter: StepSetter): Step {
    if (setter instanceof Step) { this._value = setter.value }
    else {
      const desc = typeof setter === 'function' ? setter(this._value) : setter
      this._value = new Step(desc).value
    }
    return this
  }

  constructor (descriptor?: StepDescriptor) {
    if (descriptor instanceof Step) { this._value = descriptor._value }
    else { this._value = descriptor ?? 0 }
  }

  clone (): Step {
    return new Step(this.value)
  }

  static getRandom (): Step {
    const value = randomInt(14, -14) as StepValue
    return new Step(value)
  }

  toSimpleStep (): SimpleStep {
    const simpleValue = Math.floor(absoluteModulo(this.value, 7)) as SimpleStepValue
    return new SimpleStep(simpleValue)
  }

  asSemitones (): number {
    const { value } = this
    const asSimpleStep = this.toSimpleStep()
    const { value: simpleValue } = asSimpleStep
    const octavesCovered = Math.floor((value - simpleValue) / 7)
    return asSimpleStep.asSemitones() + 12 * octavesCovered
  }
}

/* # SimpleInterval */
type SimpleIntervalValue = {
  alteration: Alteration
  step: SimpleStep
}

type SimpleIntervalDescriptor = SimpleInterval | {
  alteration?: AlterationDescriptor
  step?: SimpleStepDescriptor
}

type SimpleIntervalSetter = ValueSetter<SimpleIntervalDescriptor, SimpleIntervalValue>

class SimpleInterval {
  private _value: SimpleIntervalValue
  
  get value (): SimpleIntervalValue {
    const { alteration, step } = this._value
    return {
      alteration: alteration.clone(),
      step: step.clone()
    }
  }
  
  get flatValue () {
    const { alteration, step } = this.value
    return {
      alteration: alteration.flatValue,
      step: step.flatValue
    }
  }
  
  mutate (setter: SimpleIntervalSetter): SimpleInterval {
    if (setter instanceof SimpleInterval) { this._value = setter.value }
    else {
      const desc = typeof setter === 'function' ? setter(this._value) : setter
      this._value = new SimpleInterval(desc).value
    }
    return this
  }

  constructor (descriptor?: SimpleIntervalDescriptor) {
    if (descriptor instanceof SimpleInterval) { this._value = descriptor._value }
    else {
      const { alteration, step } = descriptor ?? {}
      this._value = {
        alteration: new Alteration(alteration),
        step: new SimpleStep(step)
      }
    }
  }

  clone (): SimpleInterval {
    const { alteration, step } = this.value
    return new SimpleInterval({
      alteration: alteration.clone(),
      step: step.clone()
    })
  }

  static getRandom (): SimpleInterval {
    return new SimpleInterval({
      alteration: Alteration.getRandom(),
      step: SimpleStep.getRandom()
    })
  }

  // [WIP] Maybe this asSemitones and distanceBetween should only belong to Interval ?
  asSemitones (): number {
   const { step, alteration } = this.value
   return step.asSemitones() + alteration.value
  }

  static distanceBetween (
    siADesc: SimpleIntervalDescriptor,
    siBDesc: SimpleIntervalDescriptor): Interval {
    // [WIP] distance between {4/0} and {2/0} is negative here, and maybe shouldn't ?
    // or create static absoluteDistanceBetween ? <= maybe better
    const siA = new SimpleInterval(siADesc)
    const siB = new SimpleInterval(siBDesc)
    const stepBetweenSis = siB.value.step.value - siA.value.step.value
    const semitonesBetweenSiSteps = new Interval({ step: stepBetweenSis, alteration: 0 }).asSemitones()
    const semitonesBetweenSis = siB.asSemitones() - siA.asSemitones()
    const alteration = semitonesBetweenSis - semitonesBetweenSiSteps
    return new Interval({ step: stepBetweenSis, alteration })
  }

  toInterval (): Interval {
    return new Interval(this.flatValue)
  }
}

/* # Interval */
type IntervalValue = Omit<SimpleIntervalValue, 'step'> & { step: Step }
type IntervalDescriptor = Interval | {
  alteration?: AlterationDescriptor
  step?: StepDescriptor
}

type IntervalSetter = ValueSetter<IntervalDescriptor, IntervalValue>

class Interval {
  private _value: IntervalValue
  
  get value (): IntervalValue {
    const { alteration, step } = this._value
    return {
      alteration: alteration.clone(),
      step: step.clone()
    }
  }

  get flatValue () {
    const { alteration, step } = this.value
    return {
      alteration: alteration.flatValue,
      step: step.flatValue
    }
  }

  mutate (setter: IntervalSetter): Interval {
    if (setter instanceof Interval) { this._value = setter.value }
    else {
      const desc = typeof setter === 'function' ? setter(this._value) : setter
      this._value = new Interval(desc).value
    }
    return this
  }

  constructor (descriptor?: IntervalDescriptor) {
    if (descriptor instanceof Interval) { this._value = descriptor._value }
    else {
      const { alteration, step } = descriptor ?? {}
      this._value = {
        alteration: new Alteration(alteration),
        step: new Step(step)
      }
    }
  }

  clone (): Interval {
    const { alteration, step } = this.value
    return new Interval({
      alteration: alteration.clone(),
      step: step.clone()
    })
  }

  static getRandom (): Interval {
    return new Interval({
      alteration: Alteration.getRandom(),
      step: Step.getRandom()
    })
  }

  toSimpleInterval (): SimpleInterval {
    const { value: { step, alteration } } = this
    const simpleStep = step.toSimpleStep()
    return new SimpleInterval({ step: simpleStep, alteration })
  }

  asSemitones (): number {
    const { step, alteration } = this.value
    return step.asSemitones() + alteration.value
  }

  static distanceBetween (
    intADesc: IntervalDescriptor,
    intBDesc: IntervalDescriptor): Interval {
    const intA = new Interval(intADesc)
    const intB = new Interval(intBDesc)
    const siA = intA.toSimpleInterval()
    const siB = intB.toSimpleInterval()
    const distanceBetweenSis = SimpleInterval.distanceBetween(siA, siB).value
    const fullOctavesBetweenInts = Math.floor((intB.asSemitones() - intA.asSemitones()) / 12)
    const resultSteps = fullOctavesBetweenInts * 7 + distanceBetweenSis.step.value
    return new Interval({
      step: resultSteps,
      alteration: distanceBetweenSis.alteration
    })
  }

  add (intervalDesc: IntervalDescriptor) {
    const interval = new Interval(intervalDesc)
    const { step: thisStep } = this.value
    const { step: intStep } = interval.value
    const sumAsSemitones = this.asSemitones() + interval.asSemitones()
    const resultStep = thisStep.value + intStep.value
    const stepsAsSemitones = new Interval({ step: resultStep, alteration: 0 }).asSemitones()
    const alteration = sumAsSemitones - stepsAsSemitones
    return new Interval({ step: resultStep, alteration })
  }

  invert () {
    const unison = new Interval({ step: 0, alteration: 0 })
    return Interval.distanceBetween(this, unison)
  }

  subtract (
    intADesc: IntervalDescriptor,
    intBDesc: IntervalDescriptor): Interval {
    const invertedB = new Interval(intBDesc).invert()
    return new Interval(intADesc).add(invertedB)
  }

  negate (
    _mainAxis: IntervalDescriptor = { step: 2, alteration: -1 },
    _secondaryAxis?: IntervalDescriptor
  ): Interval {
    const mainAxis = new Interval(_mainAxis)
    const mainAxisValue = mainAxis.value
    const secondaryAxis = _secondaryAxis instanceof Interval ? _secondaryAxis : {
      step: mainAxisValue.step,
      alteration: mainAxisValue.alteration.value + 1,
      ..._secondaryAxis
    }
    const distanceToMainAxis = Interval.distanceBetween(this, mainAxis)
    return distanceToMainAxis.add(secondaryAxis)
  }

  static sort (...descriptors: IntervalDescriptor[]) {
    const sortedIntervals = [...descriptors]
      .map(desc => new Interval(desc))
      .sort((intA, intB) => {
        const { step: stepA, alteration: alterationA } = intA.flatValue
        const { step: stepB, alteration: alterationB } = intB.flatValue
        if (stepA === stepB) return alterationA - alterationB
        return stepA - stepB
      })
    return sortedIntervals
  }

  static dedupe (...descriptors: IntervalDescriptor[]): Interval[] {
    const deduped: Interval[] = []
    descriptors.forEach(desc => {
      const int = new Interval(desc)
      const { step, alteration } = int.flatValue
      const existsAlready = deduped.find(dedupedInt => {
        const val = dedupedInt.value
        return val.step.value === step
          && val.alteration.value === alteration
      })
      if (!existsAlready) deduped.push(int)
    })
    return deduped
  }

  static semitoneDedupe (...descriptors: IntervalDescriptor[]): Interval[] {
    const intervals = descriptors.map(desc => new Interval(desc))
    const intervalsSemitonesMap = new Map<Interval, number>(intervals.map(i => ([i, i.asSemitones()])))
    const dedupedSemitones = [...new Set(intervalsSemitonesMap.values())]
    const semitonesAndIntervals = dedupedSemitones.map(semitoneValue => {
      const intervals = [...intervalsSemitonesMap]
        .filter(([_, sem]) => (sem === semitoneValue))
        .map(([int]) => int)
      return { semitoneValue, intervals }
    })
    const semitonesIntervalsMap = new Map<number, Interval[]>(semitonesAndIntervals.map(({
      semitoneValue,
      intervals
    }) => [semitoneValue, intervals]))
    return [...semitonesIntervalsMap].map(([sem, ints]) => {
      const lesserAlterationValue = Math.min(...ints.map(int => Math.abs(int.value.alteration.value)))
      const intervalWithLesserAltValue = ints.find(int => Math.abs(int.value.alteration.value) === lesserAlterationValue)
      const chosenInterval = intervalWithLesserAltValue ?? ints[0] ?? new Interval({
        step: 0,
        alteration: sem
      })
      return chosenInterval
    })
  }

  shiftStep (targetStep: StepDescriptor): Interval {
    const { value: thisValue } = this
    const unalteredInputInterval = new Interval({ ...thisValue, alteration: 0 })
    const unalteredTargetInterval = new Interval({ step: targetStep, alteration: 0 })
    const intervalBetweenUnalteredInputAndTarget = Interval.distanceBetween(unalteredInputInterval, unalteredTargetInterval)
    const semitonesBeteenInputAndTarget = intervalBetweenUnalteredInputAndTarget.asSemitones()
    const alteration = thisValue.alteration.value - semitonesBeteenInputAndTarget
    return new Interval({ step: targetStep, alteration })
  }
  
  rationalize (forceFlatOutput: boolean = false): Interval {
    const { step: thisStep, alteration: thisAlteration } = this.flatValue
    if (thisAlteration === 0) return this
    let rationalized = { step: thisStep, alteration: thisAlteration }
    const signsAreEqual = (nbr1: number, nbr2: number) => {
      if (nbr1 === 0) return true
      if (nbr1 > 0) return nbr2 >= 0
      return nbr2 <= 0
    }
    while (true) {
      if (rationalized.alteration === 0) break;
      const rationalizedOnceMore = new Interval(rationalized).shiftStep(
        thisAlteration >= 0 // technically could just check if strictly superior
          ? rationalized.step + 1
          : rationalized.step - 1
      ).flatValue      
      const alterationSignsAreEqual = signsAreEqual(thisAlteration, rationalizedOnceMore.alteration)
      if (!forceFlatOutput || thisAlteration <= 0) {
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
    return new Interval(rationalized)
  }
}

/* # Scale */
type ScaleValue = SimpleInterval[]
type ScaleDescriptor = Scale | SimpleIntervalDescriptor[]
type ScaleSetter = ValueSetter<ScaleDescriptor, ScaleValue>

class Scale {
  private _value: ScaleValue

  get value (): SimpleInterval[] {
    const valueAsIntervals = this._value.map(sInt => new Interval(sInt.flatValue))
    const sorted = Interval.sort(...valueAsIntervals)
    const deduped = Interval.semitoneDedupe(...sorted)
    return deduped.map(int => int.toSimpleInterval())
  }

  get flatValue () { return this.value.map(s => s.flatValue) }

  mutate (setter: ScaleSetter) {
    if (setter instanceof Scale) { this._value = setter.value }
    else {
      const desc = typeof setter === 'function' ? setter(this._value) : setter
      this._value = new Scale(desc).value
    }
    return this
  }

  constructor (descriptor: ScaleDescriptor = []) {
    if (descriptor instanceof Scale) { this._value = descriptor.value }
    else { this._value = descriptor.map(int => new SimpleInterval(int)) }
  }

  clone () {
    return new Scale(this.value.map(int => int.clone()))
  }

  static getRandom () {
    const length = randomInt(12)
    const value = arrayOf(SimpleInterval.getRandom, length)
    return new Scale(value)
  }
}

/* # Note */
type NoteValue = {
  context: 'absolute' | 'chord' | 'key'
  height: Interval | Step
}

type NoteDescriptor = Note | {
  context?: NoteValue['context']
  height?: IntervalDescriptor | StepDescriptor
}

type NoteSetter = ValueSetter<NoteDescriptor, NoteValue>

class Note {
  private _value: NoteValue
  
  get value () {
    const { context, height } = this._value
    return {
      context,
      height: height.clone()
    }
  }

  get flatValue () {
    const { context, height } = this.value
    return {
      context,
      height: height.flatValue
    }
  }

  mutate (setter: NoteSetter) {
    if (setter instanceof Note) { this._value = setter.value }
    else {
      const desc = typeof setter === 'function' ? setter(this._value) : setter
      this._value = new Note(desc).value
    }
    return this
  }

  constructor (descriptor?: NoteDescriptor) {
    if (descriptor instanceof Note) { this._value = descriptor.value }
    else {
      const { context, height } = descriptor ?? {}
      let valueHeight: Interval | Step
      if (height instanceof Interval) { valueHeight = height.clone() }
      else if (height instanceof Step) { valueHeight = height.clone() }
      else if (typeof height === 'number') { valueHeight = new Step(height) }
      else if (height === undefined) { valueHeight = new Step(0) }
      else { valueHeight = new Interval(height) }
      this._value = {
        context: context ?? 'absolute',
        height: valueHeight
      }
    }
  }

  clone () {
    const { context, height } = this.value
    return new Note({
      context,
      height: height.clone()
    })
  }

  static getRandom () {
    const contextPos = randomInt(3) as 0 | 1 | 2
    const context = ['absolute', 'chord', 'key'].at(contextPos) as NoteValue['context']
    return new Note({
      context: context,
      height: Math.random() > .5
        ? Interval.getRandom()
        : Step.getRandom()
    })
  }
}

/* # Chord */
type ChordValue = {
  context: 'absolute' | 'chord' | 'key'
  base: Interval | Step
  scale: Scale
}

type ChordDescriptor = Chord | {
  context?: ChordValue['context']
  base?: IntervalDescriptor | StepDescriptor
  scale?: ScaleDescriptor
}

type ChordSetter = ValueSetter<ChordDescriptor, ChordValue>

class Chord {
  private _value: ChordValue
  
  get value () {
    const { context, base, scale } = this._value
    return {
      context,
      base: base.clone(),
      scale: scale.clone()
    }
  }

  get flatValue () {
    const { context, base, scale } = this.value
    return {
      context,
      base: base.flatValue,
      scale: scale.flatValue
    }
  }
  
  mutate (setter: ChordSetter) {
    if (setter instanceof Chord) { this._value = setter.value }
    else {
      const desc = typeof setter === 'function' ? setter(this._value) : setter
      this._value = new Chord(desc).value
    }
    return this
  }

  constructor (descriptor?: ChordDescriptor) {
    if (descriptor instanceof Chord) { this._value = descriptor.value }
    else {
      const { context, base, scale } = descriptor ?? {}
      let actualBase: Interval | Step
      if (base instanceof Step) { actualBase = new Step(base) }
      else if (base instanceof Interval) { actualBase = new Interval(base) }
      else if (typeof base === 'number') { actualBase = new Step(base) }
      else if (base === undefined) { actualBase = new Step(0) }
      else { actualBase = new Interval(base) }
      this._value = {
        context: context ?? 'absolute',
        base: actualBase,
        scale: new Scale(scale)
      }
    }
  }

  clone () {
    const { context, base, scale } = this.value
    return new Chord({
      context,
      base: base.clone(),
      scale: scale.clone()
    })
  }

  static getRandom () {
    const contextPos = randomInt(3) as 0 | 1 | 2
    const context = ['absolute', 'chord', 'key'].at(contextPos) as ChordValue['context']
    return new Chord({
      context: context,
      base: Interval.getRandom(),
      scale: Scale.getRandom()
    })
  }
}

/* # Duration */
type DurationValue = number // As beats
type DurationDescriptor = Duration | number
type DurationSetter = ValueSetter<DurationDescriptor, DurationValue>

class Duration {
  private _value: DurationValue
  get value () { return this._value }
  get flatValue () { return this.value }
  
  mutate (setter: DurationSetter) {
    if (setter instanceof Duration) { this._value = setter.value }
    else {
      const desc = typeof setter === 'function' ? setter(this._value) : setter
      this._value = new Duration(desc).value
    }
    return this
  }
  
  constructor (descriptor?: DurationDescriptor) {
    if (descriptor instanceof Duration) { this._value = descriptor.value }
    else { this._value = descriptor ?? 0 }
  }

  clone () {
    return new Duration(this.value)
  }

  static getRandom () {
    return new Duration(random(4))
  }

  add (desc: DurationDescriptor) {
    const toAdd = new Duration(desc)
    this.mutate(this.value + toAdd.value)
    return this
  }

  get asBeatNotation () {
    const { value } = this
    const beats = Math.floor(value)
    const remainder = value - beats
    const sixteenths = 4 * remainder
    return `0:${beats}:${sixteenths}`
  }
}

/* # Velocity */
type VelocityValue = number
type VelocityDescriptor = Velocity | VelocityValue
type VelocitySetter = ValueSetter<VelocityDescriptor, VelocityValue>

class Velocity {
  private _value: VelocityValue
  
  get value () { return clamp(this._value, 0, 1) }
  get flatValue () { return this.value }
  
  mutate (setter: VelocitySetter) {
    if (setter instanceof Velocity) { this._value = setter.value }
    else {
      const desc = typeof setter === 'function' ? setter(this._value) : setter
      this._value = new Velocity(desc).value
    }
    return this
  }

  constructor (descriptor?: VelocityDescriptor) {
    if (descriptor instanceof Velocity) { this._value = descriptor.value }
    else { this._value = descriptor ?? 1 }
  }

  clone () {
    return new Velocity(this.value)
  }

  static getRandom () {
    return new Velocity(Math.random())
  }
}

/* # NoteEvent */
type NoteEventValue = {
  payload: Note
  duration: Duration
  velocity: Velocity
}

type NoteEventDescriptor = NoteEvent | {
  payload?: NoteDescriptor
  duration?: DurationDescriptor
  velocity?: Velocity
}

type NoteEventSetter = ValueSetter<NoteEventDescriptor, NoteEventValue>

class NoteEvent {
  private _value: NoteEventValue
  
  get value () {
    const { payload, duration, velocity } = this._value
    return {
      payload: payload.clone(),
      duration: duration.clone(),
      velocity: velocity.clone()
    }
  }

  get flatValue () {
    const { payload, duration, velocity } = this.value
    return {
      payload: payload.flatValue,
      duration: duration.flatValue,
      velocity: velocity.flatValue
    }
  }
  
  mutate (setter: NoteEventSetter) {
    if (setter instanceof NoteEvent) { this._value = setter.value }
    else {
      const desc = typeof setter === 'function' ? setter(this._value) : setter
      this._value = new NoteEvent(desc).value
    }
    return this
  }

  constructor (descriptor?: NoteEventDescriptor) {
    if (descriptor instanceof NoteEvent) { this._value = descriptor.value }
    else {
      const { payload, duration, velocity } = descriptor ?? {}
      this._value = {
        payload: new Note(payload),
        duration: new Duration(duration),
        velocity: new Velocity(velocity)
      }
    }
  }

  clone () {
    const { payload, duration, velocity } = this.value
    return new NoteEvent({
      payload: payload.clone(),
      duration: duration.clone(),
      velocity: velocity.clone()
    })
  }

  static getRandom () {
    return new NoteEvent({
      payload: Note.getRandom(),
      duration: Duration.getRandom(),
      velocity: Velocity.getRandom()
    })
  }
}

/* # Bpm */
type BpmValue = number
type BpmDescriptor = Bpm | BpmValue
type BpmSetter = ValueSetter<BpmDescriptor, BpmValue>

class Bpm {
  private _value: BpmValue
  get value () { return this._value }
  get flatValue () { return this._value }
  
  mutate (setter: BpmSetter) {
    if (setter instanceof Bpm) { this._value = setter.value }
    else {
      const desc = typeof setter === 'function' ? setter(this._value) : setter
      this._value = new Bpm(desc).value
    }
    return this
  }

  constructor (descriptor?: BpmDescriptor) {
    if (descriptor instanceof Bpm) { this._value = descriptor.value }
    else { this._value = descriptor ?? 120 }
  }

  clone () {
    return new Bpm(this.value)
  }

  static getRandom () {
    return new Bpm(randomInt(180, 50))
  }
}

/* # BpmEvent */
type BpmEventValue = { payload: Bpm }
type BpmEventDescriptor = BpmEvent | { payload?: BpmDescriptor }
type BpmEventSetter = ValueSetter<BpmEventDescriptor, BpmEventValue>

class BpmEvent {
  private _value: BpmEventValue
  
  get value () {
    const { payload } = this._value
    return { payload: payload.clone() }
  }

  get flatValue () {
    const { payload } = this.value
    return { payload: payload.flatValue }
  }

  mutate (setter: BpmEventSetter) {
    if (setter instanceof BpmEvent) { this._value = setter.value }
    else {
      const desc = typeof setter === 'function' ? setter(this._value) : setter
      this._value = new BpmEvent(desc).value
    }
    return this
  }

  constructor (descriptor?: BpmEventDescriptor) {
    if (descriptor instanceof BpmEvent) { this._value = descriptor.value }
    else {
      const { payload } = descriptor ?? {}
      this._value = { payload: new Bpm(payload) }
    }
  }

  clone () {
    const { payload } = this.value
    return new BpmEvent({ payload: payload.clone() })
  }

  static getRandom () {
    return new BpmEvent({ payload: Bpm.getRandom() })
  }
}

/* # KeyEvent */
type KeyEventValue = { payload: Chord }
type KeyEventDescriptor = KeyEvent | { payload?: ChordDescriptor }
type KeyEventSetter = ValueSetter<KeyEventDescriptor, KeyEventValue>

class KeyEvent {
  private _value: KeyEventValue
  
  get value () {
    const { payload } = this._value
    return { payload: payload.clone() }
  }

  get flatValue () {
    const { payload } = this.value
    return { payload: payload.flatValue }
  }
  
  mutate (setter: KeyEventSetter) {
    if (setter instanceof KeyEvent) { this._value = setter.value }
    else {
      const desc = typeof setter === 'function' ? setter(this._value) : setter
      this._value = new KeyEvent(desc).value
    }
    return this
  }

  constructor (descriptor?: KeyEventDescriptor) {
    if (descriptor instanceof KeyEvent) { this._value = descriptor.value }
    else {
      const { payload } = descriptor ?? {}
      this._value = {
        payload: new Chord(payload)
      }
    }
  }

  clone () {
    const { payload } = this.value
    return new KeyEvent({
      payload: payload.clone()
    })
  }

  static getRandom () {
    return new KeyEvent({ payload: Chord.getRandom() })
  }
}

/* # ChordEvent */
type ChordEventValue = { payload: Chord }
type ChordEventDescriptor = ChordEvent | { payload?: ChordDescriptor }
type ChordEventSetter = ValueSetter<ChordEventDescriptor, ChordEventValue>

class ChordEvent {
  private _value: ChordEventValue
  
  get value () {
    const { payload } = this._value
    return { payload: payload.clone() }
  }

  get flatValue () {
    const { payload } = this.value
    return { payload: payload.flatValue }
  }
  
  mutate (setter: ChordEventSetter) {
    if (setter instanceof ChordEvent) { this._value = setter.value }
    else {
      const desc = typeof setter === 'function' ? setter(this._value) : setter
      this._value = new ChordEvent(desc).value
    }
    return this
  }

  constructor (descriptor?: ChordEventDescriptor) {
    if (descriptor instanceof ChordEvent) { this._value = descriptor.value }
    else {
      const { payload } = descriptor ?? {}
      this._value = {
        payload: new Chord(payload)
      }
    }
  }

  clone () {
    const { payload } = this.value
    return new ChordEvent({
      payload: payload.clone()
    })
  }

  static getRandom () {
    return new ChordEvent({ payload: Chord.getRandom() })
  }
}

/* # Instrument */
type InstrumentValue = null
type InstrumentDescriptor = InstrumentValue | Instrument
type InstrumentSetter = ValueSetter<InstrumentDescriptor, InstrumentValue>
class Instrument {
  private _value: InstrumentValue
  get value () { return this._value }
  get flatValue () { return this._value }
  
  mutate (setter: InstrumentSetter) {
    if (setter instanceof Instrument) { this._value = setter.value }
    else {
      const desc = typeof setter === 'function' ? setter(this._value) : setter
      this._value = new Instrument(desc).value
    }
    return this
  }

  constructor (descriptor?: InstrumentDescriptor) {
    if (descriptor instanceof Instrument) { this._value = descriptor._value }
    else { this._value = descriptor ?? null }
  }

  clone () {
    return new Instrument(this.value)
  }

  static getRandom () {
    return new Instrument(null)
  }
}

/* # InstrumentEvent */
type InstrumentEventValue = { payload: (instrument: Instrument) => Instrument }
type InstrumentEventDescriptor = InstrumentEvent | { payload?: (instrument: Instrument) => Instrument }
type InstrumentEventSetter = ValueSetter<InstrumentEventDescriptor, InstrumentEventValue>

class InstrumentEvent {
  private _value: InstrumentEventValue
  
  get value () {
    const { payload } = this._value
    return { payload }
  }

  get flatValue () {
    return { ...this.value }
  }
  
  mutate (setter: InstrumentEventSetter) {
    if (setter instanceof InstrumentEvent) { this._value = setter.value }
    else {
      const desc = typeof setter === 'function' ? setter(this._value) : setter
      this._value = new InstrumentEvent(desc).value
    }
    return this
  }

  constructor (descriptor?: InstrumentEventDescriptor) {
    if (descriptor instanceof InstrumentEvent) { this._value = descriptor.value }
    else {
      const descriptorPayload = descriptor?.payload
      const payload = descriptorPayload ?? ((i: Instrument) => i)
      this._value = { payload }
    }
  }

  clone () {
    const { payload } = this.value
    return new InstrumentEvent({ payload })
  }

  static getRandom () {
    return new InstrumentEvent()
  }
}

/* # Event */
type AnyEvent = NoteEvent | BpmEvent | KeyEvent | ChordEvent | InstrumentEvent
type EventDescriptor = AnyEvent
  | ({ type: 'note' } & NoteEventDescriptor)
  | ({ type: 'bpm' } & BpmEventDescriptor)
  | ({ type: 'key' } & KeyEventDescriptor)
  | ({ type: 'chord' } & ChordEventDescriptor)
  | ({ type: 'instrument' } & InstrumentEventDescriptor)

/* # Sequence */
type SequenceValue = {
  duration: Duration
  timedEvents: Array<{
    event: AnyEvent
    offset: Duration
  }>
}

type SequenceTimedEventDescriptor = {
  event?: EventDescriptor
  offset?: DurationDescriptor
}

type SequenceDescriptor = Sequence | {
  duration?: DurationDescriptor
  timedEvents?: SequenceTimedEventDescriptor[]
}

type SequenceSetter = ValueSetter<SequenceDescriptor, SequenceValue>

class Sequence {
  private _value: SequenceValue
  
  get value () {
    const { duration, timedEvents } = this._value
    return {
      duration: duration.clone(),
      timedEvents: timedEvents.filter(event => {
        if (event.offset.value < 0) return false
        if (event.offset.value >= duration.value) return false
        return true
      }).map(({ event, offset }) => ({
        event: event.clone(),
        offset: offset.clone()
      }))
    }
  }

  get flatValue () {
    const { duration, timedEvents } = this.value
    return {
      duration: duration.flatValue,
      timedEvents: timedEvents.map(e => ({
        event: e.event.flatValue,
        offset: e.offset.flatValue
      }))
    }
  }
  
  mutate (this: Sequence, setter: SequenceSetter) {
    if (setter instanceof Sequence) { this._value = setter.value }
    else {
      const desc = typeof setter === 'function' ? setter(this._value) : setter
      this._value = new Sequence(desc).value
    }
    return this
  }

  constructor (descriptor?: SequenceDescriptor) {
    if (descriptor instanceof Sequence) { this._value = descriptor.value }
    else {
      const { duration, timedEvents } = descriptor ?? {}
      this._value = {
        duration: new Duration(duration),
        timedEvents: (timedEvents ?? []).map(eventDescriptor => {
          const { event, offset } = eventDescriptor
          let actualEvent: AnyEvent
          if (event instanceof NoteEvent) { actualEvent = new NoteEvent(event) }
          else if (event instanceof BpmEvent) { actualEvent = new BpmEvent(event) }
          else if (event instanceof KeyEvent) { actualEvent = new KeyEvent(event) }
          else if (event instanceof ChordEvent) { actualEvent = new ChordEvent(event) }
          else if (event instanceof InstrumentEvent) { actualEvent = new InstrumentEvent(event) }
          else if (event?.type === 'note') { actualEvent = new NoteEvent(event) }
          else if (event?.type === 'bpm') { actualEvent = new BpmEvent(event) }
          else if (event?.type === 'key') { actualEvent = new KeyEvent(event) }
          else if (event?.type === 'chord') { actualEvent = new ChordEvent(event) }
          else if (event?.type === 'instrument') { actualEvent = new InstrumentEvent(event) }
          else { actualEvent = new NoteEvent() }
          return {
            event: actualEvent,
            offset: new Duration(offset)
          }
        })
      }
    }
  }

  clone () {
    const { duration, timedEvents } = this.value
    return new Sequence({
      duration: duration.clone(),
      timedEvents: timedEvents.map(offsettedEvent => ({
        event: offsettedEvent.event.clone(),
        offset: offsettedEvent.offset.clone()
      }))
    })
  }

  static getRandom () {
    return new Sequence({
      duration: Duration.getRandom(),
      timedEvents: arrayOf(() => ({
        event: NoteEvent.getRandom(),
        offset: Duration.getRandom()
      }), randomInt(20))
    })
  }

  addEvents (this: Sequence, ...timedEvents: SequenceTimedEventDescriptor[]) {
    return this.mutate(curr => {
      return {
        ...curr,
        timedEvents: [...curr.timedEvents, ...timedEvents.map(({ event, offset }) => {
          let actualEvent: AnyEvent
          if (event instanceof NoteEvent) { actualEvent = new NoteEvent(event) }
          else if (event instanceof BpmEvent) { actualEvent = new BpmEvent(event) }
          else if (event instanceof KeyEvent) { actualEvent = new KeyEvent(event) }
          else if (event instanceof ChordEvent) { actualEvent = new ChordEvent(event) }
          else if (event instanceof InstrumentEvent) { actualEvent = new InstrumentEvent(event) }
          else if (event?.type === 'note') { actualEvent = new NoteEvent(event) }
          else if (event?.type === 'bpm') { actualEvent = new BpmEvent(event) }
          else if (event?.type === 'key') { actualEvent = new KeyEvent(event) }
          else if (event?.type === 'chord') { actualEvent = new ChordEvent(event) }
          else if (event?.type === 'instrument') { actualEvent = new InstrumentEvent(event) }
          else { actualEvent = new NoteEvent() }
          return {
            offset: new Duration(offset),
            event: actualEvent
          }
        })]
      }
    })
  }

  setDuration (this: Sequence, setter: DurationSetter) {
    const newDuration = this.value.duration.clone()
    newDuration.mutate(setter)
    this.mutate(curr => ({ ...curr, duration: newDuration }))
  }
}

/* # Track */
type TrackValue = {
  initInstrument: () => Instrument
  sequences: Sequence[]
}

type TrackDescriptor = Track | {
  initInstrument?: () => Instrument
  sequences?: SequenceDescriptor[]
}

type TrackSetter = ValueSetter<TrackDescriptor, TrackValue>

class Track {
  private _value: TrackValue
  
  get value (): TrackValue {
    const { initInstrument, sequences } = this._value
    return {
      initInstrument,
      sequences: sequences.map(seq => seq.clone())
    }
  }

  get flatValue () {
    const { initInstrument, sequences } = this.value
    return {
      initInstrument: initInstrument(),
      sequences: sequences.map(seq => seq.flatValue)
    }
  }
  
  mutate (setter: TrackSetter): Track {
    if (setter instanceof Track) { this._value = setter.value }
    else {
      const desc = typeof setter === 'function' ? setter(this._value) : setter
      this._value = new Track(desc).value
    }
    return this
  }
  
  constructor (descriptor?: TrackDescriptor) {
    if (descriptor instanceof Track) { this._value = descriptor.value }
    else {
      const {
        initInstrument = () => new Instrument(),
        sequences = []
      } = descriptor ?? {}
      this._value = {
        initInstrument: initInstrument,
        sequences: sequences.map(d => new Sequence(d))
      }
    }
  }

  clone (): Track {
    const { initInstrument, sequences } = this.value
    return new Track({
      initInstrument,
      sequences: sequences.map(s => s.clone())
    })
  }

  static getRandom (): Track {
    return new Track({
      sequences: arrayOf(
        Sequence.getRandom,
        randomInt(8)
      )
    })
  }

  get asSequence (): Sequence {
    const mergedSequence = new Sequence({ duration: 0, timedEvents: [] })
    this.value.sequences.forEach(sequence => {
      const { timedEvents: seqEvents, duration: seqDuration } = sequence.value
      const pMergedDuration = mergedSequence.value.duration.clone()
      mergedSequence.setDuration(curr => seqDuration.clone().add(curr))
      seqEvents.forEach(({ event, offset }) => {
        mergedSequence.addEvents({
          event,
          offset: pMergedDuration.add(offset)
        })
      })
    })
    return mergedSequence
  }

  handleEvent (eventDescriptor: InstrumentEventDescriptor) {
    const event = new InstrumentEvent(eventDescriptor)
    event.value.payload
  }
}

/* # Song */
type SongValue = {
  initBpm: Bpm
  initKey: Chord
  initChord: Chord
  tracks: Track[]
}

type SongDescriptor = Song | {
  initBpm?: BpmDescriptor
  initKey?: ChordDescriptor
  initChord?: ChordDescriptor
  tracks?: TrackDescriptor[]
}

type SongSetter = ValueSetter<SongDescriptor, SongValue>

class Song {
  private _value: SongValue
  
  get value () {
    const { initBpm, initKey, initChord, tracks } = this._value
    return {
      initBpm: initBpm.clone(),
      initKey: initKey.clone(),
      initChord: initChord.clone(),
      tracks: tracks.map(track => track.clone())
    }
  }

  get flatValue () {
    const { initBpm, initKey, initChord, tracks } = this.value
    return {
      initBpm: initBpm.flatValue,
      initKey: initKey.flatValue,
      initChord: initChord.flatValue,
      tracks: tracks.map(t => t.flatValue)
    }
  }
  
  mutate (setter: SongSetter) {
    if (setter instanceof Song) { this._value = setter.value }
    else {
      const desc = typeof setter === 'function' ? setter(this._value) : setter
      this._value = new Song(desc).value
    }
    return this
  }

  constructor (descriptor?: SongDescriptor) {
    if (descriptor instanceof Song) { this._value = descriptor.value }
    else {
      const { initBpm, initKey, initChord, tracks = [] } = descriptor ?? {}
      this._value = {
        initBpm: new Bpm(initBpm),
        initKey: new Chord(initKey),
        initChord: new Chord(initChord),
        tracks: tracks.map(d => new Track(d))
      }
    }
  }

  clone () {
    const { initBpm, initKey, initChord, tracks } = this.value
    return new Song({
      initBpm: initBpm.clone(),
      initKey: initKey.clone(),
      initChord: initChord.clone(),
      tracks: tracks.map(t => t.clone())
    })
  }

  static getRandom () {
    return new Song({
      initBpm: Bpm.getRandom(),
      initKey: Chord.getRandom(),
      initChord: Chord.getRandom(),
      tracks: arrayOf(Track.getRandom, randomInt(8))
    })
  }

  get timedEventsArray () {
    const { initBpm, initKey, initChord, tracks } = this.value
    const returned: Array<{
      event: AnyEvent
      offset: Duration
      track: Track | null
    }> = []
    returned.push(
      { event: new BpmEvent({ payload: initBpm }), offset: new Duration(0), track: null },
      { event: new KeyEvent({ payload: initKey }), offset: new Duration(0), track: null },
      { event: new ChordEvent({ payload: initChord }), offset: new Duration(0), track: null }
    )
    tracks.forEach(track => {
      const { asSequence } = track
      const { timedEvents } = asSequence.value
      const initedInstrument = track.value.initInstrument()
      returned.push({
        event: new InstrumentEvent({ payload: () => initedInstrument }),
        offset: new Duration(0),
        track
      })
      timedEvents.forEach(({ event, offset }) => returned.push({
        event,
        offset,
        track
      }))
    })
    return returned.sort((a, b) => {
      const aValue = a.offset.value
      const bValue = b.offset.value
      if (aValue !== bValue) return aValue - bValue
      const eventTypesOrder = [KeyEvent, ChordEvent, BpmEvent, InstrumentEvent, NoteEvent]
      const aWeight = eventTypesOrder.findIndex(construct => a instanceof construct) ?? 0
      const bWeight = eventTypesOrder.findIndex(construct => b instanceof construct) ?? 0
      return aWeight - bWeight
    })
  }
}

/* # Player */
// [WIP] take currentSong, currentKey, etc... into value ?
class Player {
  currentSong: Song | null = null
  currentKey: Chord | null = null
  currentChord: Chord | null = null
  currentBpm: Bpm | null = null
  currentTrackToInstrumentMap: Map<Track, Instrument> = new Map()
  
  private pauseTransport (): Player {
    Transport.pause()
    return this
  }
  
  private stopTransport (): Player {
    Transport.stop()
    return this
  }

  private startTransport (): Player {
    Transport.start()
    return this
  }

  private cancelTransportEvents (): Player {
    Transport.cancel()
    return this
  }

  get isPlaying (): boolean {
    return Transport.state === 'started'
  }

  private fastForwardEvents (
    _from: DurationDescriptor = 0,
    _to: DurationDescriptor = Infinity): Player {
    const { currentSong, currentTrackToInstrumentMap } = this
    if (currentSong === null) return this
    const from = new Duration(_from)
    const to = new Duration(_to)
    currentSong.timedEventsArray.forEach(({ event, offset, track }) => {
      if (offset.value < from.value) return;
      if (offset.value >= to.value) return;
      if (event instanceof NoteEvent) return;
      if (event instanceof KeyEvent) {
        // [WIP] need absolute values here
        this.currentKey = event.value.payload
      }
      if (event instanceof ChordEvent) {
        // [WIP] need absolute values here
        this.currentChord = event.value.payload
      }
      if (event instanceof BpmEvent) {
        const newBpm = event.value.payload.value
        this.currentBpm = new Bpm(newBpm)
        Transport.bpm.value = newBpm
      }
      if (event instanceof InstrumentEvent) {
        if (track === null) return;
        const currInstrument = currentTrackToInstrumentMap.get(track) ?? new Instrument()
        const newInstrument = event.value.payload(currInstrument)
        currentTrackToInstrumentMap.set(track, newInstrument)
      }
    })
    return this
  }

  private scheduleEvents (
    _from: DurationDescriptor = 0,
    _to: DurationDescriptor = Infinity): Player {
    const { currentSong } = this
    if (currentSong === null) return this
    const from = new Duration(_from)
    const to = new Duration(_to)
    currentSong.timedEventsArray.forEach(({ event, offset, track }) => {
      if (offset.value < from.value) return;
      if (offset.value >= to.value) return;
      Transport.schedule((toneTime) => {
        if (event instanceof KeyEvent) {
          // [WIP] need absolute values here
          this.currentKey = event.value.payload
        }
        if (event instanceof ChordEvent) {
          // [WIP] need absolute values here
          this.currentChord = event.value.payload
        }
        if (event instanceof BpmEvent) {
          const newBpm = event.value.payload.value
          this.currentBpm = new Bpm(newBpm)
          Transport.bpm.value = newBpm
        }
        const { currentTrackToInstrumentMap } = this
        if (event instanceof InstrumentEvent) {
          if (track === null) return;
          const currInstrument = currentTrackToInstrumentMap.get(track) ?? new Instrument()
          const newInstrument = event.value.payload(currInstrument)
          currentTrackToInstrumentMap.set(track, newInstrument)
        }
        if (event instanceof NoteEvent) {
          if (track === null) return;
          const currInstrument = currentTrackToInstrumentMap.get(track) ?? new Instrument()
          const { payload: note, duration, velocity } = event.value
          const { height, context } = note.value
          // [WIP] need absolute values here
          
        }
      }, offset.asBeatNotation)
    })
    return this
  }

  private reset (): Player {
    this.currentSong = null
    this.currentKey = null
    this.currentChord = null
    this.currentBpm = null
    this.currentTrackToInstrumentMap = new Map()
    return this
  }

  private transportPositionToDuration (): Duration {
    // [WIP] This assumes 192 PPQ. Later, PPQ could be assigned to a Song instance
    const { ticks } = Transport
    const beats = ticks / 192
    return new Duration(beats)
  }

  play (song?: Song, from?: Duration): Player {
    const pSong = this.currentSong
    if (song === undefined && this.currentSong === null) return this
    if (song !== undefined && song !== this.currentSong) { this.currentSong = song }
    if (this.currentSong === null) return this
    const isNewSong = pSong !== this.currentSong
    const isPlaying = Transport.state === 'started'
    
    // Same song
    if (!isNewSong) {
      // Same song, playing
      if (isPlaying) {
        // Same song, playing, no from
        if (from === undefined) return this;
        // Same song, playing, with from
        else {
          this.pauseTransport()
          this.cancelTransportEvents()
          this.fastForwardEvents(0, from)
          this.scheduleEvents(from)
          this.startTransport()
          return this
        }

      // Same song, paused
      } else {
        // Same song, paused, no from
        if (from === undefined) {
          this.cancelTransportEvents()
          const actualFrom = this.transportPositionToDuration()
          this.fastForwardEvents(0, actualFrom)
          this.scheduleEvents(actualFrom)
          this.startTransport()
          return this
        // Same song, paused, with from
        } else {
          this.cancelTransportEvents()
          this.fastForwardEvents(0, from)
          this.scheduleEvents(from)
          this.startTransport()
          return this
        }
      }
    
    // New song
    } else {
      // New song, playng
      if (isPlaying) {
        // New song, playng, no from
        if (from === undefined) {
          this.stopTransport()
          this.cancelTransportEvents()
          this.scheduleEvents(0)
          this.startTransport()
          return this
        // New song, playng, with from
        } else {
          this.stopTransport()
          this.cancelTransportEvents()
          Transport.position = from.asBeatNotation
          this.fastForwardEvents(0, from)
          this.scheduleEvents(from)
          this.startTransport()
          return this
        }

      // New song, paused
      } else {
        // New song, paused, no from
        if (from === undefined) {
          this.stopTransport()
          this.cancelTransportEvents()
          this.scheduleEvents(0)
          this.startTransport()
          return this
        // New song, paused, with from
        } else {
          Transport.position = from.asBeatNotation
          this.cancelTransportEvents()
          this.fastForwardEvents(0, from)
          this.scheduleEvents(from)
          this.startTransport()
          return this
        }
      }
    }
  }

  pause () {
    this.pauseTransport()
  }

  stop () {
    this.stopTransport()
    this.cancelTransportEvents()
    this.reset()
  }
}

// Create song
const song = Song.getRandom()
const playBtn = document.querySelector('.play')
const pauseBtn = document.querySelector('.pause')
const stopBtn = document.querySelector('.stop')

// Play song
let audioStarted = false
playBtn?.addEventListener('click', () => {
  if (audioStarted) {
    startAudioContext()
    audioStarted = true
  }
  console.log(song.timedEventsArray.map(timedEvent => {
    const { event, offset, track } = timedEvent
    console.log(offset.value, event.value, track)
  }))
})

// Pause song
pauseBtn?.addEventListener('click', () => { console.log('pause the song') })

// Stop song
stopBtn?.addEventListener('click', () => { console.log('stop the song') })
