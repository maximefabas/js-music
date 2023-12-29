import {
  setFlags,
  stringStartsWith
} from './modules/regexp-utils/index.js'

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

/* NOTE */

// descriptor
// c => context = 'absolute', alt = 0, { step: 0, alteration: 0 }, octaveOffset = 0
// #2 => context = 'absolute', alt = 0, { step: 1, alteration: 1 }, octaveOffset = 0
// !2 means => the closest step you have from a 2 natural, so :
// - !#2 means => #2
// - #!2 means => the closest step you have from 2, sharpened by 1

// #!2 => context = 'absolute', alt = 1, step = 1, octaveOffset = 0
// !#2 => context = 'absolute', alt = 0, interval = { step: 1, alteration: 1 }, octaveOffset = 0
// #{!2-^^} => context = 'chord', alt = 1, step = 1, octaveOffset = -2
// #{!2-^4} => context = 'chord', alt = 1, step = 29, octaveOffset = null

// Use intervals to create extended single note chords like :
// ß3 add(3, 5, 7)
// chord descriptor
// C^^, C^^m7, C^^ add(9), C^^ no(d, !d, !d^,  ß!9, !ß9 === ß9, 9, !9, ß!9, <7>, <!7>, ) add(...)
// add(<7>, <!7>, #<7>, #<#7>)
// <!II> <!II:3> <!II:4> <!II7>
// #<!ßIX-^^ mM7 add(#{!5})>


/* Alteration */
// #|ß
const alteration = /(#|ß)+/

/* Interval */
// SimpleStep : 0 | 1 | 2 | 3 | 4 | 5 | 6
// PitchLetter : a | b | c | d | e | f | g
// Step : number
// Octaver : -?\^+[0-9]*
// Interval : <alteration? /> <step /> <octaver? />
// Pitch : <alteration? /> <pitch-letter /> <octaver? />
// const simpleStep = /1|2|3|4|5|6|7/
const pitchLetter = /a|b|c|d|e|f|g/
const step = /-?[1-9]([0-9])*/
const octaver = /-?\^+[1-9]([0-9])*/
// const simpleInterval = new RegExp(`(${alteration.source})?(${simpleStep.source})`)
const interval = new RegExp(`(${alteration.source})?(${step.source})(${octaver.source})?`)
const pitch = new RegExp(`(${alteration.source})?(${pitchLetter.source})(${octaver.source})?`)

/* Step marker */
// !
const stepMarker = /!/

/* Step int or pitch */
// <step-marker? /> <interval | pitch /> <octaver? /> 
const stepIntOrPitch = new RegExp(`(${stepMarker.source})?((${interval.source})|(${pitch.source}))(${octaver.source})?`)

/* Context */
// <|{  - end: -  >|}
const contextStart = /<|\{/
const contextEnd = />|\}/

/* Note */
// <alteration? /> <context?> <step-int-or-pitch /> </context?>
const note = new RegExp(`(${alteration.source})?(${contextStart.source})?(${stepIntOrPitch.source})(${contextEnd.source})?`)

/* Roman */
const roman = /(M{1,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})|M{0,4}(CM|C?D|D?C{1,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})|M{0,4}(CM|CD|D?C{0,3})(XC|X?L|L?X{1,3})(IX|IV|V?I{0,3})|M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|I?V|V?I{1,3}))/

/* Capital  A | B | C | D | E | F | G */
const capital = /A|B|C|D|E|F|G/

const romanOrCapital = new RegExp(`(${roman.source})|(${capital.source})`)

/* Extensions */
// The idea behind <!II:7> in order to get the second main chord of the current key, with it's extension on it's 7th
// :2 => !1, !2, !5
// :3 => !1, !3
// :4 => !1, !4, !5
// :5 => !1, !5
// :6 => !1, !3, !5, !6
// :7 => !1, !3, !5, !7
// :9 => !1, !3, !5, !7, !9
// :11 => !1, !3, !5, !7, !9, !11
// :13 => !1, !3, !5, !7, !9, !11, !13
const extensions = /:[1-9]([0-9])*/

// Modifier, inversion, offset
// Modifier :   [a-z]+\((<note />,)*\)
// Inversion :  \/<note />
// Offset :     \\\<note />
// Quality:               list of main qualities
// Full quality :   <quality /> <modifiers? /> <inversion? /> <offset? />
const modifier = new RegExp(`[a-z]+\\((${note.source})?(,${note.source})*\\)`)
const modifiers = new RegExp(`(${modifier.source})(${modifier.source})*`)
const inversion = new RegExp(`/(${note.source})`)
// const offset = new RegExp(`\(${note.source})`)
const backslash = /\\/
const offset = new RegExp(`(${backslash.source})(${note.source})`)
const quality = new RegExp(`[WIP]`)
const fullQuality = new RegExp(`(${quality.source})(${modifiers.source})?(${inversion.source})?(${offset.source})?`)

/* Chord */
// Root :           <step-marker? /> <alteration? /> <roman | capital /> <octaver? /> (:<extensions />)?
// Chord :                <alteration? /> <context?> <chord-root /> </context?> <full-quality />
const root = new RegExp(`(${stepMarker.source})?(${alteration.source})?(${romanOrCapital.source})(${octaver.source})?(${extensions.source})?`)
const chord = new RegExp(`(${alteration.source})?(${contextStart.source})?(${root.source})(${contextEnd.source})?(${fullQuality.source})?`)
const chordOrNote = new RegExp(`(${chord.source})|(${note.source})`)

export function parse (string: string): any {
  console.log(string)
  const chordsOrNotes = string.match(setFlags(chordOrNote, 'gm'))
  console.log(chordsOrNotes)
}

/* Parsing attempts below, then class Note */

// export enum InstructionType {
//   RAW = 'raw',
//   CHORD_OR_NOTE = 'chord-or-note',
//   CHORD = 'chord',
//   NOTE = 'note',
//   UNKNOWN = 'unknown'
// }
// type Instruction = { string: string, type: InstructionType }


// export function lol (instruction: Instruction): Instruction[] {
//   console.log(instruction)
//   // Raw
//   if (instruction.type === InstructionType.RAW) {
//     const chordsOrNotes = stringStartsWith(instruction.string, setFlags(chordOrNote, 'igm'), true)
//     if (chordsOrNotes === null) return [instruction]
//     const subInstructions = chordsOrNotes?.map(chordOrNoteStr => ({
//       type: InstructionType.CHORD_OR_NOTE,
//       string: chordOrNoteStr
//     }))
//     return subInstructions.map(instruction => lol(instruction)).flat()

//   // Chord or note
//   } else if (instruction.type === InstructionType.CHORD_OR_NOTE) {
//     const chordStr = stringStartsWith(instruction.string, setFlags(chord, 'gm'), true)?.at(0)
//     const noteStr = stringStartsWith(instruction.string, setFlags(note, 'gm'), true)?.at(0)
//     if (chordStr !== undefined) {
//       return lol({ type: InstructionType.CHORD, string: chordStr })
//     } else if (noteStr !== undefined) {
//       return lol({ type: InstructionType.NOTE, string: noteStr })
//     } else {
//       return [instruction]
//     }

//   // Chord
//   } else if (instruction.type === InstructionType.CHORD) {
//     alteration
//     contextStart
//     root
//     contextEnd
//     fullQuality
//   // Note
//   } else if (instruction.type === InstructionType.NOTE) {
  
//   }
//   return [instruction]
// }


// export default function parse (str: string) {
//   let walter = str
//   const results: [string, string][] = []
//   while (true) {
//     // Security
//     const inputLength = walter.length
    
//     console.log('walter', walter)
//     const isChordOrNote = stringStartsWith(walter, chordOrNote, true)
    
//     // Chord or note
//     if (isChordOrNote) {
//       const chordOrNoteStr = isChordOrNote.at(0) ?? ''
//       console.log('chordOrNoteStr', chordOrNoteStr)
//       const isChord = stringStartsWith(chordOrNoteStr, chord, true)
//       const isNote = stringStartsWith(chordOrNoteStr, note, true)
      
//       if (isChord) results.push
//       // Chord
//       if (isChord) {
//         const chordStr = isChord.at(0) ?? ''
//         console.log('chordStr', chordStr)
//         const isAlteration = stringStartsWith(chordStr, alteration, true)
//         const isContextStart = stringStartsWith(chordStr, contextStart, true)
//         const isRoot = stringStartsWith(chordStr, root, true)
//         const isContextEnd = stringStartsWith(chordStr, contextEnd, true)
//         const isFullQuality = stringStartsWith(chordStr, fullQuality, true)
        
//         // Alteration
//         if (isAlteration) {
//           const alterationStr = isAlteration.at(0) ?? ''
//           results.push(['alteration', alterationStr])
//           walter = walter.replace(alterationStr, '')  
        
//         // Context start
//         } else if (isContextStart) {
//           const contextStartStr = isContextStart.at(0) ?? ''
//           results.push(['contextStart', contextStartStr])
//           walter = walter.replace(contextStartStr, '')  
        
//         // Root
//         } else if (isRoot) {
//           const rootStr = isRoot.at(0) ?? ''
//           console.log('rootStr', rootStr)
//           const isStepMarker = stringStartsWith(rootStr, stepMarker, true)
//           const isAlteration = stringStartsWith(rootStr, alteration, true)
//           const isRomanOrCapital = stringStartsWith(rootStr, romanOrCapital, true)
//           const isOctaver = stringStartsWith(rootStr, octaver, true)
//           const isExtensions = stringStartsWith(rootStr, extensions, true)
          
//           // Step marker
//           if (isStepMarker) {
//             const stepMarkerStr = isStepMarker.at(0) ?? ''
//             results.push(['stepMarker', stepMarkerStr])
//             walter = walter.replace(stepMarkerStr, '')
//           }

//           // Alteration
//           else if (isAlteration) {
//             const alterationStr = isAlteration.at(0) ?? ''
//             results.push(['alteration', alterationStr])
//             walter = walter.replace(alterationStr, '')
//           }

//           // Roman or capital
//           else if (isRomanOrCapital) {
//             const romanOrCapitalStr = isRomanOrCapital.at(0) ?? ''
//             results.push(['romanOrCapital', romanOrCapitalStr])
//             walter = walter.replace(romanOrCapitalStr, '')
//           }

//           // Octaver
//           else if (isOctaver) {
//             const octaverStr = isOctaver.at(0) ?? ''
//             results.push(['octaver', octaverStr])
//             walter = walter.replace(octaverStr, '')
//           }

//           // Extensions
//           else if (isExtensions) {
//             const extensionsStr = isExtensions.at(0) ?? ''
//             results.push(['extensions', extensionsStr])
//             walter = walter.replace(extensionsStr, '')
//           }

//           else {
//             results.push(['root', rootStr])
//             walter = walter.replace(rootStr, '')  
//           }

//         // Context end
//         } else if (isContextEnd) {
//           const contextEndStr = isContextEnd.at(0) ?? ''
//           results.push(['contextEnd', contextEndStr])
//           walter = walter.replace(contextEndStr, '')  
        
//         // Full quality
//         } else if (isFullQuality) {
//           const fullQualityStr = isFullQuality.at(0) ?? ''
//           results.push(['fullQuality', fullQualityStr])
//           walter = walter.replace(fullQualityStr, '')  
        
//         // Other chord root stuff ?
//         } else {
//           results.push(['chord', chordStr])
//           walter = walter.replace(chordStr, '')
//         }
      
//       // Note
//       } else if (isNote) {
//         const noteStr = isNote.at(0) ?? ''
//         results.push(['note', noteStr])
//         walter = walter.replace(noteStr, '')
      
//       // Other Chord or note
//       } else {
//         results.push(['chord-or-note', chordOrNoteStr])
//         walter = walter.replace(chordOrNoteStr, '')
//       }

//     // Non parsable
//     } else {
//       console.log('what is it ?')
//       results.push(['walter', walter])
//       walter = walter.replace(walter, '')
//     }
//     // Parsing
//     // - chord ou note
//     // - chordOrNote = <alteration? /> <context?> <chord-root-step-int-or-pitch /> </context?> <full-quality />
//     // <alteration? /> <context?> <chord-root /> </context?> <full-quality /> | 
//     // <alteration? /> <context?> <step-int-or-pitch /> </context?>

//     // Before return
//     const outputLength = walter.length
//     if (inputLength <= outputLength) break;
    
//     // Return
//   }
//   console.log(results)
//   return results
// }




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

/* FRACTION */

export namespace FractionTypes {
  export type Value = [number, number]
}

export class Fraction {
  value: FractionTypes.Value
  constructor () {
    this.value = [1, 1]
  }
}

/* SEQUENCE */

export namespace SequenceTypes {
  export type ValueDuration = string | number | Fraction
  export type Value = {
    duration: string | number | Fraction
    timedEvents: Array<{
      relativeTime: Fraction
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
  static commonTunings: Record<string, TuningTypes.Value> = {
    none: () => 0
  }
  value: TuningTypes.Value
  constructor (descriptor: TuningTypes.Descriptor = 'none') {
    if (descriptor instanceof Tuning) this.value = descriptor.value
    else if (typeof descriptor === 'function') this.value = descriptor
    else {
      const { commonTunings: tunings } = Tuning
      const tuning = tunings[descriptor] ?? tunings.none as TuningTypes.Value
      this.value = tuning
    }
  }
}

/* PART (INSTRUMENT) */

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
  .setTuning('none') // Not sure about all these, should be events in sequence no ?
  .setKey('C^4 major') // parsed with context being the current values of the track and/or part
  .setChord('<!I>')
  .addSequence('after intro', '<descriptor>')

track.play()

/*
const rythm = '|4~~~----•--------|--------•--------|'
// Un rythme, c'est une séquence dans le temps : vélocités, sustain, silences
const rythm = [[[.4, true, true, true, null, null, null, null], []], [[], []]]
sequence('2m', [
  [chordNoteOrDescriptor, rythmOrDescriptor],
  [chordNoteOrDescriptor, rythmOrDescriptor]
]).loop(4, (seq, loopNb) => seq)

// Comment on matérialise les slide ? Comment on matérialise les bends ?


const line = '<I> | <II:7> | <V:7> • <v:7> | <I>'
const line = [chord, chord, [chord, chord], chord]

// Tout doit être signal modulable, non ?
// Pas sûr


*/

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





/*

const sequence = sequence('2m', [
  { event: '<I:5>', rythm: [10, true, true, true, null, null, null, null] },
  { event: '<V:5>', rythm: [null, null, null, null, 10, true, true, true] },
  { event: '<I:5>', rythm: 'x~~~|----' },
  { event: '<V:5>', rythm: '----|x~~~' }
])


*/