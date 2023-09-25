/* ALTERATION */

export namespace AlterationTypes {
  export type Value = number
}

export class Alteration {
  value: AlterationTypes.Value
  constructor () {
    this.value = 0
  }
}

/* STEP */

export namespace StepTypes {
  export type SimpleValue = 0 | 1 | 2 | 3 | 4 | 5 | 6
  export type Value = SimpleValue
}

export class Step {
  value: StepTypes.Value
  constructor () {
    this.value = 0
  }
}

/* INTERVAL */

export namespace IntervalTypes {
  export type SimpleValue = {
    step: StepTypes.SimpleValue
    alteration: Alteration
  }
  
  export type Value = {
    step: Step
    alteration: Alteration
  }
}

export class Interval {
  value: IntervalTypes.Value
  constructor () {
    this.value = {
      step: new Step(),
      alteration: new Alteration()
    }
  }
}

/* SCALE */

export namespace ScaleTypes {
  export type Value = IntervalTypes.SimpleValue[]
}

export class Scale {
  value: ScaleTypes.Value
  constructor () {
    this.value = []
  }
}

/* CHORD */

export namespace ChordTypes {
  export type Value = {
    base: Interval
    scale: Scale
  }
  export type Descriptor = Value | Chord | string
}

export class Chord {
  value: ChordTypes.Value

  constructor (descriptor: ChordTypes.Descriptor = {
    base: new Interval(),
    scale: new Scale()
  }) {
    this.value = {
      base: new Interval(),
      scale: new Scale()
    }
  } 
}

/* SOUND */

export namespace NoteTypes {
  export enum Context {
    KEY = 'key',
    CHORD = 'chord',
    ABSOLUTE = 'absolute'
  }
  type ValueCommons = {
    context: Context
    alteration: Alteration
    octaveOffset: number | null
  }
  export type StepValue = ValueCommons & { step: Step }
  export type IntervalValue = ValueCommons & { interval: Interval }
  export type Value = StepValue | IntervalValue
}

export class Note {
  value: NoteTypes.Value
  constructor () {
    this.value = {
      context: NoteTypes.Context['ABSOLUTE'],
      alteration: new Alteration(),
      octaveOffset: null,
      interval: new Interval()
    }
  }
}

/* ACTION */

export namespace ActionTypes {
  export type Value = {
    /* bpm ramp, set chord, set key, set tuning, etc... */
  }
}

export class Action {
  value: ActionTypes.Value
  constructor () {
    this.value = {}
  }
}

/* RELATIVE TIME */

export namespace RelativeTimeTypes {
  export type Value = [number, number]
}

export class RelativeTime {
  value: RelativeTimeTypes.Value
  constructor () {
    this.value = [1, 1]
  }
}

/* SEQUENCE */

export namespace SequenceTypes {
  export type ValueDuration = string | number | RelativeTime
  export type Value = {
    duration: string | number | RelativeTime
    timedEvents: Array<{
      relativeTime: RelativeTime
      event: Note | Action
    }>
  }
  export type Descriptor = Value | Sequence | string
}

export class Sequence {
  value: SequenceTypes.Value
  constructor (descriptor?: SequenceTypes.Descriptor) {
    this.value = {
      duration: '1m',
      timedEvents: []
    }
  }
}

/* TUNING */

export namespace TuningTypes {
  export type Value = (interval: Interval) => number
  export type Descriptor = Value | Tuning | string
}

export class Tuning {
  static commonTunings = {
    none: () => 0
  }
  value: TuningTypes.Value
  constructor (descriptor: TuningTypes.Descriptor = 'none') {
    if (descriptor instanceof Tuning) this.value = descriptor.value
    else if (typeof descriptor === 'function') this.value = descriptor
    else {
      this.value = Tuning.commonTunings[descriptor as 'none'] ?? Tuning.commonTunings.none
    }
  }
}

/* PART */

type Texture = {}

export namespace PartTypes {
  export type Value = {
    startTuning: Tuning
    startKey: Chord
    startChord: Chord
    startTexture: Texture
    sequences: Map<string, Sequence>
    sequencesOrder: string[]
  }
  export type Descriptor = Value | Part
}

export class Part {
  value: PartTypes.Value
  constructor (descriptor?: PartTypes.Descriptor) {
    if (descriptor === undefined) {
      this.value = {
        startTuning: new Tuning(),
        startKey: new Chord(),
        startChord: new Chord(),
        startTexture: {},
        sequences: new Map(),
        sequencesOrder: []
      }
    } else if (descriptor instanceof Part) {
      this.value = descriptor.value
    } else {
      this.value = descriptor
    }
  }

  setTuning (
    this: Part,
    tuning: TuningTypes.Descriptor): Part {
    this.value = { ...this.value, startTuning: new Tuning(tuning) }
    return this
  }

  setKey (
    this: Part,
    key: ChordTypes.Descriptor): Part {
    this.value = { ...this.value, startKey: new Chord(key) }
    return this
  }

  setChord (
    this: Part,
    key: ChordTypes.Descriptor): Part {
    this.value = { ...this.value, startChord: new Chord(key) }
    return this
  }

  addSequence (): Part
  addSequence (descriptor: SequenceTypes.Descriptor): Part
  addSequence (name: string, descriptor: SequenceTypes.Descriptor): Part
  addSequence (nameOrDesc: string | SequenceTypes.Descriptor, descriptor: SequenceTypes.Descriptor): Part
  addSequence (this: Part, nameOrDesc?: SequenceTypes.Descriptor | string, descriptor?: SequenceTypes.Descriptor): Part {
    let name: string
    let sequence: Sequence
    if (descriptor === undefined) {
      name = crypto.randomUUID()      
      sequence = nameOrDesc === undefined
        ? new Sequence()
        : new Sequence(nameOrDesc)
    } else {
      if (typeof nameOrDesc === 'string') name = nameOrDesc
      else name = crypto.randomUUID()
      sequence = new Sequence(descriptor) 
    }
    this.value.sequences = new Map(this.value.sequences)
    this.value.sequences.set(name, sequence)
    return this
  }

  getSequence (name: string): Sequence | undefined
  getSequence (name: string, forceOrDescriptor: true): Sequence
  getSequence (name: string, forceOrDescriptor: SequenceTypes.Descriptor): Sequence
  getSequence (name: string, forceOrDescriptor: false): Sequence | undefined
  getSequence (this: Part, name: string, forceOrDescriptor?: boolean | SequenceTypes.Descriptor): Sequence | undefined {
    const { sequences } = this.value
    const found = sequences.get(name)
    if (found !== undefined) return found
    if (forceOrDescriptor !== undefined
      && forceOrDescriptor !== false) {
      const created = forceOrDescriptor === true
        ? new Sequence(undefined)
        : new Sequence(forceOrDescriptor)
      this.addSequence(name, created)
      return created
    }
    return found
  }

  removeSequence (this: Part, nameOrSeq: string | Sequence): Part {
    const { sequences } = this.value
    if (typeof nameOrSeq === 'string') {
      this.value = { ...this.value, sequences: new Map(this.value.sequences) }
      this.value.sequences.delete(nameOrSeq)
      return this
    }
    const foundKey = Object.keys(sequences)
      .find(key => sequences.get(key) === nameOrSeq)
    if (foundKey === undefined) return this
    return this.removeSequence(foundKey)
  }
}

/*
part.setTuning(tuningExp)
part.tuning
part.setKey(keyExp)
part.key
part.setChord(chordExp)
part.setTexture ?
part.addSequence(sequence, name, position?)
*/

/* SIGNATURE */

export namespace SignatureTypes {
  export type Value = [number, number]
  export type Descriptor = Value | Signature | number
}

export class Signature {
  value: SignatureTypes.Value
  constructor (descriptor: SignatureTypes.Descriptor = 1) {
    if (typeof descriptor === 'number') this.value = [descriptor, 1]
    else if (Array.isArray(descriptor)) this.value = [descriptor[0] ?? 1, descriptor[1] ?? 1]
    else this.value = descriptor.value
  }
}

/* BPM */

export namespace BpmTypes {
  export type Value = number
  export type Descriptor = Value | Bpm
}

export class Bpm {
  value: BpmTypes.Value
  constructor (descriptor: BpmTypes.Descriptor = 60) {
    this.value = typeof descriptor === 'number'
      ? descriptor
      : descriptor.value
  }
}

/* TRACK */

export namespace TrackTypes {
  export type Value = {
    startBpm: Bpm
    startSignature: Signature
    startTuning: Tuning
    startKey: Chord
    startChord: Chord
    parts: Map<string, Part>
  }
}

export class Track {
  value: TrackTypes.Value
  constructor () {
    this.value = {
      startBpm: new Bpm(),
      startSignature: new Signature(),
      startTuning: new Tuning(),
      startKey: new Chord(),
      startChord: new Chord(),
      parts: new Map()
    }
  }

  setBpm (
    this: Track,
    bpm: BpmTypes.Descriptor): Track {
    this.value = { ...this.value, startBpm: new Bpm(bpm) }
    return this
  }

  setSignature (
    this: Track,
    signature: SignatureTypes.Descriptor): Track {
    this.value = { ...this.value, startSignature: new Signature(signature) }
    return this
  }

  setTuning (
    this: Track,
    tuning: TuningTypes.Descriptor): Track {
    this.value = { ...this.value, startTuning: new Tuning(tuning) }
    return this
  }

  setKey (
    this: Track,
    key: ChordTypes.Descriptor): Track {
    this.value = { ...this.value, startKey: new Chord(key) }
    return this
  }

  setChord (
    this: Track,
    key: ChordTypes.Descriptor): Track {
    this.value = { ...this.value, startChord: new Chord(key) }
    return this
  }

  addPart (this: Track, name: string, part: PartTypes.Descriptor): Track {
    this.value = { ...this.value, parts: new Map(this.value.parts) }
    this.value.parts.set(name, new Part(part))
    return this
  }

  getPart (name: string): Part | undefined
  getPart (name: string, forceOrDescriptor: true): Part
  getPart (name: string, forceOrDescriptor: PartTypes.Descriptor): Part
  getPart (name: string, forceOrDescriptor: false): Part | undefined
  getPart (this: Track, name: string, forceOrDescriptor?: boolean | PartTypes.Descriptor): Part | undefined {
    const { parts } = this.value
    const found = parts.get(name)
    if (found !== undefined) return found
    if (forceOrDescriptor !== undefined
      && forceOrDescriptor !== false) {
      const created = forceOrDescriptor === true
        ? new Part(undefined)
        : new Part(forceOrDescriptor)
      this.addPart(name, created)
      return created
    }
    return found
  }

  removePart (this: Track, nameOrPart: string | Part): Track {
    const { parts } = this.value
    if (typeof nameOrPart === 'string') {
      this.value = { ...this.value, parts: new Map(this.value.parts) }
      this.value.parts.delete(nameOrPart)
      return this
    }
    const foundKey = Object.keys(parts).find(key => parts.get(key) === nameOrPart)
    if (foundKey === undefined) return this
    return this.removePart(foundKey)
  }


  /* ... */

  static schedule (track: Track) {
    // for every part
    //   for every sequence in order
    //     resolve sequence to Notes and Actions in time
  }

  static currentTrack: Track | null = null
  static play (track: Track) {
    // set as current track
    // is current track
    //   is playing => save time, reschedule, set time, play
    //   is paused => save time, reschedule, set time, play
    //   is stopped => reschedule, play
    // is not current track
    //   reschedule, play
  }

  static pause (track: Track) {
    // is current track
    //   pause transport
    // is not current track
    //   do nothing
  }

  static stop (track: Track) {
    // is current track
    //   stop transport
    // is not current track
    //   do nothing
  }

  play () {
    Track.play(this)
    return this
  }
}

const track = new Track()
  .setBpm(80)
  .setSignature([4, 4])
  .setTuning('none')
  .setKey('C^4 major') // parsed with context being the current values of the track
  .setChord('<!I>')

const drumsPart = track.getPart('drums', new Part())
const bassPart = track.getPart('bass', new Part())
const organPart = track.getPart('organ', new Part())
const guitarPart = track.getPart('guitar', new Part())

drumsPart
  .setTuning('none')
  .setKey('C^4 major') // parsed with context being the current values of the track and/or part
  .setChord('<!I>')
  .addSequence('after intro', '<descriptor>')

track.play()

/* 

track.setBpm(bpmExp)
track.bpm
track.setSignature(signatureExp)
track.signature
track.setTuning(tuningExp)
track.tuning
track.setKey(keyExp)
track.key
track.setChord(chordExp)
track.addPart(partExp, name)
track.getPart('name')
track.parts

track.play()
track.pause()
track.stop()
*/
