import absoluteModulo from './modules/absolute-modulo/index.js'
import { randomHash } from './modules/random-uuid/index.js'
import {
  TimeClass as ToneTimeClass,
  Time as ToneTime,
  start
} from 'tone'

/* # Alteration */
type AlterationValue = number
type AlterationDescriptor = AlterationValue | Alteration
class Alteration {
  private _value: AlterationValue
  get value () { return this._value }
  
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
}

/* # SimpleStep */
type SimpleStepValue = 0 | 1 | 2 | 3 | 4 | 5 | 6
type SimpleStepDescriptor = SimpleStepValue | SimpleStep
class SimpleStep {
  private _value: SimpleStepValue
  get value () { return Math.floor(absoluteModulo(this._value, 7)) as SimpleStepValue }
  
  constructor (descriptor?: SimpleStepDescriptor) {
    if (descriptor instanceof SimpleStep) { this._value = descriptor._value }
    else { this._value = descriptor ?? 0 }
  }
  
  clone () {
    return new SimpleStep(this.value)
  }

  static getRandom () {
    const value = Math.floor(Math.random() * 7) as SimpleStepValue
    return new SimpleStep(value)
  }
}

/* # Step */
type StepValue = number
type StepDescriptor = StepValue | Step
class Step {
  private _value: StepValue
  get value () { return this._value }
  
  constructor (descriptor?: StepDescriptor) {
    if (descriptor instanceof Step) { this._value = descriptor._value }
    else { this._value = descriptor ?? 0 }
  }
  
  clone () {
    return new Step(this.value)
  }

  static getRandom () {
    const value = Math.floor((Math.random() * 28) - 14) as StepValue
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
}
class SimpleInterval {
  private _value: SimpleIntervalValue
  get value () { return this._value }
  
  constructor (descriptor?: SimpleIntervalDescriptor) {
    if (descriptor instanceof SimpleInterval) { this._value = { ...descriptor._value } }
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
    const clonedAlt = alteration.clone()
    const clonedStep = step.clone()
    return new SimpleInterval({
      alteration: clonedAlt,
      step: clonedStep
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
class Interval {
  private _value: IntervalValue
  get value () { return this._value }
  
  constructor (descriptor?: IntervalDescriptor) {
    if (descriptor instanceof Interval) { this._value = { ...descriptor._value } }
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
    const clonedAlt = alteration.clone()
    const clonedStep = step.clone()
    return new Interval({
      alteration: clonedAlt,
      step: clonedStep
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
class Scale {
  private _value: ScaleValue
  get value () { return this._value /* [WIP] sort/dedupe steps here */ }
  
  constructor (descriptor: ScaleDescriptor = []) {
    if (descriptor instanceof Scale) { this._value = { ...descriptor._value } }
    else {
      this._value = descriptor.map(simpleIntervalDesc => new SimpleInterval(simpleIntervalDesc))
    }
  }
  
  clone () {
    return new Scale(this.value.map(int => int.clone()))
  }

  static getRandom () {
    const length = Math.floor(Math.random() * 12)
    const value = new Array(length).fill(null).map(() => SimpleInterval.getRandom())
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
class Note {
  private _value: NoteValue
  get value () { return this._value }
  
  constructor (descriptor?: NoteDescriptor) {
    if (descriptor instanceof Note) { this._value = { ...descriptor._value } }
    else {
      const { base, interval } = descriptor ?? {}
      this._value = {
        base: base ?? 'absolute',
        interval: new Interval(interval)
      }
    }
  }
  
  clone () {
    return new Note({
      base: this.value.base,
      interval: this.value.interval.clone()
    })
  }

  static getRandom () {
    const basePos = Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3
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
class Chord {
  private _value: ChordValue
  get value () { return this._value }
  
  constructor (descriptor?: ChordDescriptor) {
    if (descriptor instanceof Chord) { this._value = { ...descriptor?.value } }
    else {
      const { base, scale } = descriptor ?? {}
      this._value = {
        base: base ?? 'absolute',
        scale: new Scale(scale)
      }
    }
  }
  
  clone () {
    return new Chord({
      base: this.value.base,
      scale: this.value.scale.clone()
    })
  }

  static getRandom () {
    const basePos = Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3
    const base = (['absolute', 'chord', 'key'].at(basePos) ?? Interval.getRandom()) as ChordValue['base']
    return new Chord({
      base: base,
      scale: Scale.getRandom()
    })
  }
}

/* # Duration */
type DurationValue = ToneTimeClass
type DurationDescriptor = Duration | ToneTimeClass | string
class Duration {
  private _value: DurationValue
  get value () { return this._value }
  
  constructor (descriptor?: DurationDescriptor) {
    if (descriptor instanceof Duration) { this._value = descriptor.value }
    else { this._value = ToneTime(descriptor) }
  }
  
  clone () {
    return new Duration(this.value)
  }

  static getRandom () {
    const units = ['i', 'n', 't', 'm', 's', 'hz']
    const randomUnit = units[Math.floor(Math.random() * units.length)]
    const randomLength = Math.random() * 10
    const time = ToneTime(`${randomLength}${randomUnit}`)
    return new Duration(time)
  }
}

/* # Events */
type NoteEventValue = {
  payload: Note
  duration: Duration
}
type NoteEventDescriptor = NoteEvent | {
  payload?: NoteDescriptor
  duration?: DurationDescriptor
}
class NoteEvent {
  private _value: NoteEventValue
  get value () { return this._value }
  
  constructor (descriptor?: NoteEventDescriptor) {
    if (descriptor instanceof NoteEvent) { this._value = { ...descriptor.value } }
    else {
      const { payload, duration } = descriptor ?? {}
      this._value = {
        payload: payload instanceof Note ? payload : new Note(payload),
        duration: duration instanceof Duration ? duration : new Duration(duration)
      }
    }
  }
  
  clone () {
    return new NoteEvent({
      payload: this.value.payload.clone(),
      duration: this.value.duration.clone()
    })
  }

  static getRandom () {
    return new NoteEvent({
      payload: Note.getRandom(),
      duration: Duration.getRandom()
    })
  }
}

/* # Sequence */
type SequenceValue = {
  duration: Duration
  events: Array<{
    event: NoteEvent
    offset: Duration
  }>
}
type SequenceDescriptor = Sequence | {
  duration?: DurationDescriptor
  events?: Array<{
    event?: NoteEventDescriptor
    offset?: DurationDescriptor
  }>
}
class Sequence {
  private _value: SequenceValue
  get value () { return this._value }
  
  constructor (descriptor?: SequenceDescriptor) {
    if (descriptor instanceof Sequence) { this._value = descriptor.value }
    else {
      const { duration, events } = descriptor ?? {}
      this._value = {
        duration: duration instanceof Duration ? duration : new Duration(duration),
        events: (events ?? []).map(eventDescriptor => {
          const { event, offset } = eventDescriptor
          return {
            event: event instanceof NoteEvent ? event : new NoteEvent(event),
            offset: offset instanceof Duration ? offset : new Duration(offset)
          }
        })
      }
    }
  }
  
  clone () {
    return new Sequence({
      duration: this.value.duration.clone(),
      events: this.value.events.map(offsettedEvent => ({
        event: offsettedEvent.event.clone(),
        offset: offsettedEvent.offset.clone()
      }))
    })
  }

  static getRandom () {
    return new Sequence({
      duration: Duration.getRandom(),
      events: new Array(Math.floor(Math.random() * 20)).fill(null).map(() => {
        return {
          event: NoteEvent.getRandom(),
          offset: Duration.getRandom()
        }
      })
    })
  }
}


/* # PartValue */
type PartValue = Array<{
  name: string
  sequences: Sequence[]
}>
type PartDescriptor = Part | Array<{
  name?: string
  sequences?: Array<SequenceDescriptor>
}>
class Part {
  private _value: PartValue
  get value () { return this._value }
  
  constructor (descriptor: PartDescriptor = []) {
    if (descriptor instanceof Part) { this._value = descriptor.value }
    else {
      this._value = descriptor.map(namedSequenceDescriptor => {
        const { name = randomHash(8), sequences = [] } = namedSequenceDescriptor
        return {
          name,
          sequences: sequences.map(seqDescriptor => {
            if (seqDescriptor instanceof Sequence) return seqDescriptor
            else { return new Sequence(seqDescriptor) }
          })
        }
      })
    }
  }
  
  clone () {
    return new Part(this.value.map(namedSequences => ({
      name: namedSequences.name,
      sequences: namedSequences.sequences.map(seq => seq.clone())
    })))
  }

  static getRandom () {
    return new Part(new Array(Math.floor(Math.random() * 6)).fill(null).map(() => {
      return {
        name: randomHash(8),
        sequences: new Array(Math.floor(Math.random() * 6)).fill(null).map(() => {
          return Sequence.getRandom()
        })
      }
    }))
  }
}

/* # Bpm */
type BpmValue = number
type BpmDescriptor = Bpm | BpmValue
class Bpm {
  private _value: BpmValue
  get value () { return this._value }
  
  constructor (descriptor?: BpmDescriptor) {
    if (descriptor instanceof Bpm) { this._value = descriptor.value }
    else { this._value = descriptor ?? 120 }
  }
  
  clone () {
    return new Bpm(this.value)
  }

  static getRandom () {
    return new Bpm(Math.floor(Math.random() * 120 + 55))
  }
}

/* # Song */
type SongValue = {
  initBpm: Bpm
  initKey: Chord
  initChord: Chord
  tracks: Array<{
    name: string
    parts: Part[]
  }>
}
type SongDescriptor = Song | {
  initBpm?: BpmDescriptor
  initKey?: ChordDescriptor
  initChord?: ChordDescriptor
  tracks?: Array<{
    name?: string
    parts?: PartDescriptor[]
  }>
}

class Song {
  private _value: SongValue
  get value () { return this._value }
  
  constructor (descriptor: SongDescriptor) {
    if (descriptor instanceof Song) { this._value = descriptor.value }
    else {
      const { initBpm, initKey, initChord, tracks = [] } = descriptor
      this._value = {
        initBpm: new Bpm(initBpm),
        initKey: new Chord(initKey),
        initChord: new Chord(initChord),
        tracks: tracks.map(partDescriptor => {
          const { name = randomHash(8), parts = [] } = partDescriptor
          return {
            name,
            parts: parts.map(partDescriptor => new Part(partDescriptor))
          }
        })
      }
    }
  }
  
  clone () {
    const { initBpm, initKey, initChord, tracks } = this.value
    return new Song({
      initBpm: initBpm.clone(),
      initKey: initKey.clone(),
      initChord: initChord.clone(),
      tracks: tracks.map(track => ({
        name: track.name,
        parts: track.parts.map(part => part.clone())
      }))
    })
  }

  static getRandom () {
    return new Song({
      initBpm: Bpm.getRandom(),
      initKey: Chord.getRandom(),
      initChord: Chord.getRandom(),
      tracks: new Array(Math.floor(Math.random() * 8)).fill(null).map(() => {
        return {
          name: randomHash(8),
          parts: new Array(Math.floor(Math.random() * 8)).fill(null).map(() => Part.getRandom())
        }
      })
    })
  }

  getDomRepresentation () {
    const wrapper = document.createElement('div')
    wrapper.innerHTML += `
      <div><strong>init bpm: </strong>${this.value.initBpm.value}</div>
      <div><strong>init key: </strong>${JSON.stringify(this.value.initKey.value)}</div>
      <div><strong>init chord: </strong>${JSON.stringify(this.value.initKey.value)}</div>`
    return wrapper
  }
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
playBtn?.addEventListener('click', () => { console.log('should play the song') })
// Pause song
pauseBtn?.addEventListener('click', () => { console.log('should pause the song') })
// Stop song
stopBtn?.addEventListener('click', () => { console.log('should stop the song') })
