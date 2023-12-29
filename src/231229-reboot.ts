/* Alteration */
type Alteration = number

/* Step & SimpleStep */
type SimpleStep = 0 | 1 | 2 | 3 | 4 | 5 | 6
type Step = number

/* Interval & SimpleInterval */
type SimpleInterval = {
  alteration: Alteration
  step: SimpleStep
}

type Interval = Omit<SimpleInterval, 'step'> & {
  step: Step
}

/* Scale & Voicing */
type Scale = SimpleInterval[]
// type Voicing = Interval[]

/* Note & Chord */
type Note = {
  base: 'absolute' | 'chord' | 'key' | Interval
  interval: Interval
}

type Chord = {
  base: 'absolute' | 'chord' | 'key' | Interval
  scale: Scale
}

/* Events */
type RelativeDuration = [number, number]
type BeatDuration = string
type SecondDuration = number
type Duration = RelativeDuration | BeatDuration | SecondDuration

type NoteEvent = {
  payload: Note
  duration: Duration
}

type TempoEvent = {
  payload: number
  duration: Duration
}

type Signature = RelativeDuration
type SignatureEvent = { payload: Signature }
type ContextChordEvent = { payload: Chord }
type ContextKeyEvent = { payload: Chord }

type Event = NoteEvent | TempoEvent | SignatureEvent | ContextChordEvent | ContextKeyEvent

/* Sequence */
type Sequence = {
  duration: Duration
  events: Array<{
    event: Event
    offset: Duration
  }>
}

/* Part */
type Part = Array<{
  name: string
  sequences: Sequence[]
}>

/* Song */
type Song = {
  initBpm: number
  initSignature: number
  initKey: Chord
  initChord: Chord
  tracks: Array<{
    instrument: any
    name: string
    parts: Part[]
  }>
}
