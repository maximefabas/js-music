import { start } from 'tone'
import absoluteModulo from './modules/absolute-modulo/index.js'
import arrayOf from './modules/array-of/index.js'
import clamp from './modules/clamp/index.js'
import { randomHash } from './modules/random-uuid/index.js'
import random, { randomInt } from './modules/random/index.js'

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

  // [TRASH]
  get str () {
    if (this.value === 0) return ''
    return arrayOf<string>(
      () => this.value < 0 ? 'ß' : '#',
      Math.abs(this.value)
    ).join('')
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
    const value = randomInt(7) as SimpleStepValue
    return new SimpleStep(value)
  }

  // [TRASH]
  get str () {
    return `${this.value + 1}`
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
    const value = randomInt(14, -14) as StepValue
    return new Step(value)
  }

  // [TRASH]
  get str () {
    return `${this.value + 1}`
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

  // [TRASH]
  get str () {
    const { alteration, step } = this.value
    return `${alteration.str}${step.str}`
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

  // [TRASH]
  get str () {
    const { alteration, step } = this.value
    return `${alteration.str}${step.str}`
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
      this._value = descriptor.map(int => new SimpleInterval(int))
    }
  }

  clone () {
    return new Scale(this.value.map(int => int.clone()))
  }

  static getRandom () {
    const length = randomInt(12)
    const value = arrayOf(() => SimpleInterval.getRandom(), length)
    return new Scale(value)
  }

  // [TRASH]
  get str () {
    console.log(this)
    return `[${this.value.map(int => int.str).join(',')}]`
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
    const basePos = randomInt(4) as 0 | 1 | 2 | 3
    const base = (['absolute', 'chord', 'key'].at(basePos) ?? Interval.getRandom()) as NoteValue['base']
    return new Note({
      base: base,
      interval: Interval.getRandom()
    })
  }

  // [TRASH]
  get str () {
    const { base, interval } = this.value
    if (base === 'absolute') return interval.str
    if (base === 'key') return `{${interval.str}}`
    if (base === 'chord') return `{{${interval.str}}}`
    return `{{${interval.str}}-{${base.str}}}`
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
    const basePos = randomInt(4) as 0 | 1 | 2 | 3
    const base = (['absolute', 'chord', 'key'].at(basePos) ?? Interval.getRandom()) as ChordValue['base']
    return new Chord({
      base: base,
      scale: Scale.getRandom()
    })
  }

  // [TRASH]
  get str () {
    const { base, scale } = this.value
    if (base === 'absolute') return scale.str
    if (base === 'key') return `{${scale.str}}`
    if (base === 'chord') return `{{${scale.str}}}`
    return `{{${scale.str}}-{${base.str}}}`
  }
}

/* # Duration */
type DurationValue = number
type DurationDescriptor = Duration | number
class Duration {
  private _value: DurationValue
  get value () { return this._value }

  constructor (descriptor?: DurationDescriptor) {
    if (descriptor instanceof Duration) { this._value = descriptor.value }
    else { this._value = descriptor ?? 1 }
  }

  clone () {
    return new Duration(this.value)
  }

  static getRandom () {
    return new Duration(random(4))
  }

  // [TRASH]
  get str () {
    return `0:${this.value}:0`
  }
}

/* # Velocity */
type VelocityValue = number
type VelocityDescriptor = Velocity | VelocityValue
class Velocity {
  private _value: VelocityValue
  get value () {
    return clamp(this._value, 0, 1)
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

  // [TRASH]
  get str () {
    return `¨${this.value.toString().slice(1)}`
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

class NoteEvent {
  private _value: NoteEventValue
  get value () { return this._value }

  constructor (descriptor?: NoteEventDescriptor) {
    if (descriptor instanceof NoteEvent) { this._value = { ...descriptor.value } }
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
    return new NoteEvent({
      payload: this.value.payload.clone(),
      duration: this.value.duration.clone(),
      velocity: this.value.velocity.clone()
    })
  }

  static getRandom () {
    return new NoteEvent({
      payload: Note.getRandom(),
      duration: Duration.getRandom(),
      velocity: Velocity.getRandom()
    })
  }

  // [TRASH]
  get str () {
    const { payload, duration, velocity } = this.value
    return `note;${payload.str};${duration.str};${velocity.str}`
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
    return new Bpm(randomInt(180, 50))
  }

  // [TRASH]
  get str () {
    const { value } = this
    return `${value}bpm`
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

class BpmEvent {
  private _value: BpmEventValue
  get value () { return this._value }

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
    return new BpmEvent({
      payload: this.value.payload.clone(),
      duration: this.value.duration.clone()
    })
  }

  static getRandom () {
    return new BpmEvent({
      payload: Bpm.getRandom(),
      duration: Duration.getRandom()
    })
  }

  // [TRASH]
  get str () {
    const { payload, duration } = this.value
    return `bpm;${payload.str};${duration}`
  }
}

/* # KeyEvent */
type KeyEventValue = { payload: Chord }
type KeyEventDescriptor = KeyEvent | { payload?: ChordDescriptor }
class KeyEvent {
  private _value: KeyEventValue
  get value () { return this._value }

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
    return new KeyEvent({
      payload: this.value.payload.clone()
    })
  }

  static getRandom () {
    return new KeyEvent({ payload: Chord.getRandom() })
  }

  // [TRASH]
  get str () {
    const { payload } = this.value
    return `key;${payload.str}`
  }
}

/* # ChordEvent */
type ChordEventValue = { payload: Chord }
type ChordEventDescriptor = ChordEvent | { payload?: ChordDescriptor }
class ChordEvent {
  private _value: ChordEventValue
  get value () { return this._value }

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
    return new ChordEvent({
      payload: this.value.payload.clone()
    })
  }

  static getRandom () {
    return new ChordEvent({ payload: Chord.getRandom() })
  }

  // [TRASH]
  get str () {
    const { payload } = this.value
    return `chord;${payload.str}`
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

type SequenceDescriptor = Sequence | {
  duration?: DurationDescriptor
  events?: Array<{
    event?: EventDescriptor
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
      events: arrayOf(() => ({
        event: NoteEvent.getRandom(),
        offset: Duration.getRandom()
      }), randomInt(20))
    })
  }

  // [TRASH]
  get str () {
    const { duration, events } = this.value
    return [
      `SEQ: ${duration.str}`,
      ...events.map(ev => `${ev.event.str}@${ev.offset.str}`)
    ].join('\n')
  }
}

/* # Part */
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
    return new Part(arrayOf(() => ({
      name: randomHash(8),
      sequences: arrayOf(() => Sequence.getRandom(), randomInt(6))
    }),
    randomInt(6)))
  }

  // [TRASH]
  get str () {
    const { value } = this
    return value.map(namedSeqs => {
      return [namedSeqs.name, ...namedSeqs.sequences.map(sq => sq.str)]
        .join('\n')
    }).join('\n\n')
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

  constructor (descriptor?: SongDescriptor) {
    if (descriptor instanceof Song) { this._value = descriptor.value }
    else {
      const { initBpm, initKey, initChord, tracks = [] } = descriptor ?? {}
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
      tracks: new Array(randomInt(8)).fill(null).map(() => {
        return {
          name: randomHash(8),
          parts: new Array(randomInt(8)).fill(null).map(() => Part.getRandom())
        }
      })
    })
  }

  magic () {
    this.value.tracks.map(trackData => {
      console.group(`TRACK ${trackData.name}`)
      trackData.parts.forEach((partData, partPos) => {
        console.group(`PART ${partPos + 1}`)
        partData.value.forEach(seqeucesData => {
          console.group(`SEQUENCE ${seqeucesData.name}`)
          seqeucesData.sequences.forEach(seq => {
            console.log(seq.str)
          })
          console.groupEnd()
        })
        console.groupEnd()
      })
      console.groupEnd()
    })
  }

  // [TRASH]
  get str () {
    const { initBpm, initKey, initChord, tracks } = this.value
    return [
      `initBpm: ${initBpm.str}`,
      `initKey: ${initKey.str}`,
      `initChord: ${initChord.str}`,
      ...tracks.map(trackData => {
        return [
          `TRACK - ${trackData.name}`,
          ...trackData.parts.map(part => {
            return part.str
          })
        ].join('\n')
      })
    ].join('\n')
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
  // song.magic()
  song.magic()
})
// Pause song
pauseBtn?.addEventListener('click', () => { console.log('should pause the song') })
// Stop song
stopBtn?.addEventListener('click', () => { console.log('should stop the song') })





