import { IntervalTimeline, start } from 'tone'
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
  
  setValue (setter: AlterationSetter) {
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

  clone () {
    return new Alteration(this.value)
  }

  static getRandom () {
    const rand = Math.random()
    let value: number
    if (rand < .1) { value = -2 }
    else if (rand < .3) { value = -1 }
    else if (rand < .7) { value = 0 }
    else if (rand < .9) { value = 1 }
    else { value = 2 }
    return new Alteration(value)
  }

  add (desc: AlterationDescriptor = 1) {
    const toAdd = new Alteration(desc)
    this.setValue(this.value + toAdd.value)
  }

  subtract (desc: AlterationDescriptor = 1) {
    const toAdd = new Alteration(desc)
    this.setValue(this.value - toAdd.value)
  }
}

/* # SimpleStep */
type SimpleStepValue = 0 | 1 | 2 | 3 | 4 | 5 | 6
type SimpleStepDescriptor = SimpleStepValue | SimpleStep
type SimpleStepSetter = ValueSetter<SimpleStepDescriptor, SimpleStepValue>
class SimpleStep {
  private _value: SimpleStepValue
  
  get value () {
    return Math.floor(absoluteModulo(this._value, 7)) as SimpleStepValue
  }

  setValue (setter: SimpleStepSetter) {
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

  clone () {
    return new SimpleStep(this.value)
  }

  static getRandom () {
    const value = randomInt(7) as SimpleStepValue
    return new SimpleStep(value)
  }
}

/* # Step */
type StepValue = number
type StepDescriptor = StepValue | Step
type StepSetter = ValueSetter<StepDescriptor, StepValue>
class Step {
  private _value: StepValue
  get value () { return this._value }
  
  setValue (setter: StepSetter) {
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

  clone () {
    return new Step(this.value)
  }

  static getRandom () {
    const value = randomInt(14, -14) as StepValue
    return new Step(value)
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
} // [WIP] maybe a number of semitones here, that translates to the most probable interval?

type SimpleIntervalSetter = ValueSetter<SimpleIntervalDescriptor, SimpleIntervalValue>

class SimpleInterval {
  private _value: SimpleIntervalValue
  
  get value () {
    const { alteration, step } = this._value
    return {
      alteration: alteration.clone(),
      step: step.clone()
    }
  }
  
  setValue (setter: SimpleIntervalSetter) {
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

  clone () {
    const { alteration, step } = this.value
    return new SimpleInterval({
      alteration: alteration.clone(),
      step: step.clone()
    })
  }

  static getRandom () {
    return new SimpleInterval({
      alteration: Alteration.getRandom(),
      step: SimpleStep.getRandom()
    })
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
  
  get value () {
    const { alteration, step } = this._value
    return {
      alteration: alteration.clone(),
      step: step.clone()
    }
  }

  setValue (setter: IntervalSetter) {
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

  clone () {
    const { alteration, step } = this.value
    return new Interval({
      alteration: alteration.clone(),
      step: step.clone()
    })
  }

  static getRandom () {
    return new Interval({
      alteration: Alteration.getRandom(),
      step: Step.getRandom()
    })
  }
}

/* # Scale */
type ScaleValue = SimpleInterval[]
type ScaleDescriptor = Scale | SimpleIntervalDescriptor[]
type ScaleSetter = ValueSetter<ScaleDescriptor, ScaleValue>

class Scale {
  private _value: ScaleValue

  get value () {
    /* [WIP] sort/dedupe steps here */
    return this._value.map(int => int.clone())
  }

  setValue (setter: ScaleSetter) {
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
  base: 'absolute' | 'chord' | 'key' | Interval
  interval: Interval
}

type NoteDescriptor = Note | {
  base?: NoteValue['base']
  interval?: IntervalDescriptor
}

type NoteSetter = ValueSetter<NoteDescriptor, NoteValue>

class Note {
  private _value: NoteValue
  
  get value () {
    const { base, interval } = this._value
    return {
      base: base instanceof Interval ? base.clone() : base,
      interval: interval.clone()
    }
  }

  setValue (setter: NoteSetter) {
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
      const { base, interval } = descriptor ?? {}
      this._value = {
        base: base ?? 'absolute',
        interval: new Interval(interval)
      }
    }
  }

  clone () {
    const { base, interval } = this.value
    return new Note({
      base: base instanceof Interval ? base.clone() : base,
      interval: interval.clone()
    })
  }

  static getRandom () {
    const basePos = randomInt(4) as 0 | 1 | 2 | 3
    const base = (['absolute', 'chord', 'key'].at(basePos) ?? Interval.getRandom()) as NoteValue['base']
    return new Note({
      base: base,
      interval: Interval.getRandom()
    })
  }
}

/* # Chord */
type ChordValue = {
  base: 'absolute' | 'chord' | 'key' | Interval
  scale: Scale
}

type ChordDescriptor = Chord | {
  base?: ChordValue['base']
  scale?: ScaleDescriptor
}

type ChordSetter = ValueSetter<ChordDescriptor, ChordValue>

class Chord {
  private _value: ChordValue
  
  get value () {
    const { base, scale } = this._value
    return {
      base: base instanceof Interval ? base.clone() : base,
      scale: scale.clone()
    }
  }
  
  setValue (setter: ChordSetter) {
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
      const { base, scale } = descriptor ?? {}
      this._value = {
        base: base ?? 'absolute',
        scale: new Scale(scale)
      }
    }
  }

  clone () {
    const { base, scale } = this.value
    return new Chord({
      base: base instanceof Interval ? base.clone() : base,
      scale: scale.clone()
    })
  }

  static getRandom () {
    const basePos = randomInt(4) as 0 | 1 | 2 | 3
    const base = (['absolute', 'chord', 'key'].at(basePos) ?? Interval.getRandom()) as ChordValue['base']
    return new Chord({
      base: base,
      scale: Scale.getRandom()
    })
  }
}

/* # Duration */
type DurationValue = number
type DurationDescriptor = Duration | number
type DurationSetter = ValueSetter<DurationDescriptor, DurationValue>

class Duration {
  private _value: DurationValue
  get value () { return this._value }
  
  setValue (setter: DurationSetter) {
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
    this.setValue(this.value + toAdd.value)
    return this
  }
}

/* # Velocity */
type VelocityValue = number
type VelocityDescriptor = Velocity | VelocityValue
type VelocitySetter = ValueSetter<VelocityDescriptor, VelocityValue>

class Velocity {
  private _value: VelocityValue
  
  get value () {
    return clamp(this._value, 0, 1)
  }
  
  setValue (setter: VelocitySetter) {
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
  
  setValue (setter: NoteEventSetter) {
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
  
  setValue (setter: BpmSetter) {
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
type BpmEventValue = {
  payload: Bpm
  duration: Duration
}

type BpmEventDescriptor = BpmEvent | {
  payload?: BpmDescriptor
  duration?: DurationDescriptor
}

type BpmEventSetter = ValueSetter<BpmEventDescriptor, BpmEventValue>

class BpmEvent {
  private _value: BpmEventValue
  
  get value () {
    const { payload, duration } = this._value
    return {
      payload: payload.clone(),
      duration: duration.clone()
    }
  }

  setValue (setter: BpmEventSetter) {
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
      const { payload, duration } = descriptor ?? {}
      this._value = {
        payload: new Bpm(payload),
        duration: new Duration(duration)
      }
    }
  }

  clone () {
    const { payload, duration } = this.value
    return new BpmEvent({
      payload: payload.clone(),
      duration: duration.clone()
    })
  }

  static getRandom () {
    return new BpmEvent({
      payload: Bpm.getRandom(),
      duration: Duration.getRandom()
    })
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
  
  setValue (setter: KeyEventSetter) {
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
  
  setValue (setter: ChordEventSetter) {
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

/* # Event */
type EventDescriptor = NoteEvent | BpmEvent | KeyEvent | ChordEvent
  | ({ type: 'note' } & NoteEventDescriptor)
  | ({ type: 'bpm' } & BpmEventDescriptor)
  | ({ type: 'key' } & KeyEventDescriptor)
  | ({ type: 'chord' } & ChordEventDescriptor)

/* # Sequence */
type SequenceValue = {
  duration: Duration
  events: Array<{
    event: NoteEvent | BpmEvent | KeyEvent | ChordEvent
    offset: Duration
  }>
}

type SequenceTimedEventDescriptor = {
  event?: EventDescriptor
  offset?: DurationDescriptor
}

type SequenceDescriptor = Sequence | {
  duration?: DurationDescriptor
  events?: SequenceTimedEventDescriptor[]
}

type SequenceSetter = ValueSetter<SequenceDescriptor, SequenceValue>

class Sequence {
  private _value: SequenceValue
  
  get value () {
    const { duration, events } = this._value
    return {
      duration: duration.clone(),
      events: events.filter(event => {
        if (event.offset.value < 0) return false
        if (event.offset.value >= duration.value) return false
        return true
      }).map(({ event, offset }) => ({
        event: event.clone(),
        offset: offset.clone()
      }))
    }
  }
  
  setValue (setter: SequenceSetter) {
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
      const { duration, events } = descriptor ?? {}
      this._value = {
        duration: new Duration(duration),
        events: (events ?? []).map(eventDescriptor => {
          const { event, offset } = eventDescriptor
          let actualEvent: NoteEvent | BpmEvent | KeyEvent | ChordEvent
          if (event instanceof NoteEvent) { actualEvent = new NoteEvent(event) }
          else if (event instanceof BpmEvent) { actualEvent = new BpmEvent(event) }
          else if (event instanceof KeyEvent) { actualEvent = new KeyEvent(event) }
          else if (event instanceof ChordEvent) { actualEvent = new ChordEvent(event) }
          else if (event?.type === 'note') { actualEvent = new NoteEvent(event) }
          else if (event?.type === 'bpm') { actualEvent = new BpmEvent(event) }
          else if (event?.type === 'key') { actualEvent = new KeyEvent(event) }
          else if (event?.type === 'chord') { actualEvent = new ChordEvent(event) }
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
    const { duration, events } = this.value
    return new Sequence({
      duration: duration.clone(),
      events: events.map(offsettedEvent => ({
        event: offsettedEvent.event.clone(),
        offset: offsettedEvent.offset.clone()
      }))
    })
  }

  static getRandom () {
    return new Sequence({
      duration: Duration.getRandom(),
      events: arrayOf(() => ({
        event: NoteEvent.getRandom(),
        offset: Duration.getRandom()
      }), randomInt(20))
    })
  }

  addEvents (...timedEvents: SequenceTimedEventDescriptor[]) {
    this.setValue(curr => ({
      ...curr,
      events: [...curr.events, ...timedEvents.map(({ event, offset }) => {
        let actualEvent: NoteEvent | BpmEvent | KeyEvent | ChordEvent
        if (event instanceof NoteEvent) { actualEvent = new NoteEvent(event) }
        else if (event instanceof BpmEvent) { actualEvent = new BpmEvent(event) }
        else if (event instanceof KeyEvent) { actualEvent = new KeyEvent(event) }
        else if (event instanceof ChordEvent) { actualEvent = new ChordEvent(event) }
        else if (event?.type === 'note') { actualEvent = new NoteEvent(event) }
        else if (event?.type === 'bpm') { actualEvent = new BpmEvent(event) }
        else if (event?.type === 'key') { actualEvent = new KeyEvent(event) }
        else if (event?.type === 'chord') { actualEvent = new ChordEvent(event) }
        else { actualEvent = new NoteEvent() }
        return {
          offset: new Duration(offset),
          event: actualEvent
        }
      })]
    }))
    return this
  }
}

/* # Track */
type TrackValue = {
  initInstrument: () => any
  sequences: Sequence[]
}

type TrackDescriptor = Track | {
  initInstrument?: () => any
  sequences?: SequenceDescriptor[]
}

type TrackSetter = ValueSetter<TrackDescriptor, TrackValue>

class Track {
  private _value: TrackValue
  
  get value () {
    const { initInstrument, sequences } = this._value
    return {
      initInstrument,
      sequences: sequences.map(seq => seq.clone())
    }
  }
  
  setValue (setter: TrackSetter) {
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
        initInstrument = () => null,
        sequences = []
      } = descriptor ?? {}
      this._value = {
        initInstrument: initInstrument,
        sequences: sequences.map(d => new Sequence(d))
      }
    }
  }

  clone () {
    const { initInstrument, sequences } = this.value
    return new Track({
      initInstrument,
      sequences: sequences.map(s => s.clone())
    })
  }

  static getRandom () {
    return new Track({
      sequences: arrayOf(
        Sequence.getRandom,
        randomInt(8)
      )
    })
  }

  get mergedSequences () {
    console.group('mergedSequences')
    const merged = new Sequence({ duration: 0, events: [] })
    this.value.sequences.forEach(sequence => {
      console.group('seqence')
      const { duration: mergedDur, events: mergedEv } = merged.value
      console.log('mergedDur', mergedDur.value)
      console.log('mergedEv', mergedEv.map(e => ({ event: e.event.value, offset: e.offset.value })))
      const { duration, events } = sequence.value
      const mergedDuration = merged.value.duration
      const absoluteTimedEvents: SequenceTimedEventDescriptor[] = events.map(({ event, offset }) => {
        const absoluteOffset = new Duration(offset).add(mergedDuration)
        const clonedEvent = event.clone()
        return {
          offset: absoluteOffset,
          event: clonedEvent
        }
      })
      console.log('absoluteTimedEvents', absoluteTimedEvents)
      merged.addEvents(...absoluteTimedEvents)
      console.groupEnd()
      merged.setValue(curr => {
        console.log('curr', curr.duration.value, curr.events)
        return {
          ...curr,
          duration: mergedDuration.add(duration)
        }
      })
    })
    console.groupEnd()
    return merged
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
  
  setValue (setter: SongSetter) {
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

  lol () {
    return this.value.tracks.map(track => track.mergedSequences)
  }
}

/* # Player */
class Player {
  currentSong: Song | null = null
  play (song?: Song, from?: Duration) {
    if (song === undefined && this.currentSong === null) return;
    if (song !== undefined && song !== this.currentSong) { this.currentSong = song }
    if (this.currentSong === null) return;
  }

  pause () {}
  stop () {}
}

const song = Song.getRandom()
const enableBtn = document.querySelector('.audio-enable')
const playBtn = document.querySelector('.play')
const pauseBtn = document.querySelector('.pause')
const stopBtn = document.querySelector('.stop')

// Enable audio
enableBtn?.addEventListener('click', () => {
  start()
  if (enableBtn !== undefined) {
    enableBtn.setAttribute('disabled', '')
    enableBtn.innerHTML = 'Audio enabled.'
  }
})

// Play song
playBtn?.addEventListener('click', () => {
  console.log('should play the song, hihih')
  console.log(song.lol().at(0)?.value.events.length)
})
// Pause song
pauseBtn?.addEventListener('click', () => { console.log('should pause the song') })
// Stop song
stopBtn?.addEventListener('click', () => { console.log('should stop the song') })
