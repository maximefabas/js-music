import {
  // PitchClassLetter,
  Alteration,
  // PitchClass,
  // Octave,
  // Pitch,
  // SimpleInterval,
  Interval,
  Scale
} from './index.js'
import Graph from './modules/dependency-grapher/index.js'

// ========== GRAPH STUFF ==========

console.log('-- Dependencies --')
new Graph()
  .add('Alteration.name', [])
  .add('Alteration.fromName', [])
  .add('Interval.name', ['Alteration.name'])
  .add('Interval.fromName', ['Alteration.fromName'])
  .add('Interval.simplify', ['Alteration.fromName'])
  .add('Interval.commonNames', ['Interval.simplify', 'Interval.fromName'])
  .add('Interval.semitones', ['Interval.simplify'])
  .add('Interval.between', ['Interval.simplify', 'Interval.semitones'])
  .add('Interval.add', ['Interval.semitones'])
  .add('Interval.invert', ['Interval.between'])
  .add('Interval.subtract', ['Interval.invert', 'Interval.add'])
  .add('Interval.negative', ['Interval.between', 'Interval.add'])
  .add('Interval.sort', [])
  .add('Interval.dedupe', ['Interval.name'])
  .add('Interval.semitoneDedupe', ['Interval.semitones'])
  .add('Interval.shiftStep', ['Interval.semitones', 'Interval.between'])
  .add('Interval.rationalize', ['Interval.shiftStep'])
  .add('Scale.fromName', ['Interval.fromName', 'Interval.simplify'])
  .add('Scale.name', ['Interval.name'])
  .add('Scale.reallocate', ['Interval.sort', 'Interval.semitoneDedupe', 'Interval.semitones', 'Interval.shiftStep', 'Interval.simplify'])
  .add('Scale.binary', ['Interval.semitones'])
  .add('Scale.fromBinary', ['Scale.reallocate', 'Interval.simplify', 'Interval.rationalize'])
  .add('Scale.decimal', ['Scale.binary'])
  .add('Scale.fromDecimal', [])
  .add('Scale.pattern', ['Scale.binary'])
  .add('Scale.fromPattern', ['Scale.fromBinary'])
  .add('Scale.distance', ['Scale.binary'])
  .add('Scale.intervalsAtStep', [])
  .add('Scale.hasSteps', ['Scale.intervalsAtStep'])
  .add('Scale.hasIntervals', [])
  .add('Scale.rotations', ['Interval.simplify', 'Interval.rationalize', 'Interval.sort', 'Interval.add', 'Interval.between'])
  .add('Scale.rotationalSymmetryAxes', ['Scale.rotations', 'Scale.pattern'])
  .add('Scale.modes', ['Scale.rotations', 'Scale.decimal', 'Interval.name'])
  .add('Scale.reflections', ['Scale.rotations', 'Scale.pattern', 'Scale.fromPattern'])
  .add('Scale.reflectionSymmetryAxes', ['Scale.reflections', 'Scale.pattern'])
  .add('Scale.negation', ['Scale.pattern', 'Scale.fromPattern'])
  .add('Scale.supersets', ['Scale.pattern', 'Scale.fromPattern'])
  .add('Scale.subsets', ['Scale.pattern', 'Scale.fromPattern'])
  .add('Scale.rahmPrimeForm', ['Scale.rotations', 'Scale.reflections', 'Scale.fromDecimal'])
  .add('Scale.merge', ['Interval.sort', 'Interval.dedupe'])
  .add('Scale.part', ['Interval.name'])
  .add('Scale.omitStep', [])
  .add('Scale.qualityTableSort', ['Interval.fromName', 'Interval.semitones'])
  .add('Scale.isMajor', ['Scale.hasIntervals', 'Interval.commonNames'])
  .add('Scale.isMinor', ['Scale.isMajor', 'Scale.hasIntervals', 'Interval.commonNames'])
  .add('Scale.qualityTable', ['Interval.name', 'Scale.qualityTableSort', 'Scale.hasIntervals', 'Interval.commonNames', 'Scale.hasSteps', 'Scale.isMajor', 'Scale.isMinor'])
  .add('Scale.qualityTableToQuality', [])
  .add('Scale.quality', ['Scale.qualityTable', 'Scale.qualityTableToQuality'])
  .add('Scale.qualityToQualityTable', ['Interval.fromName', 'Scale.qualityTableSort', 'Interval.simplify'])
  .add('Scale.fromQualityTable', ['Scale.qualityTableSort', 'Scale.fromName', 'Scale.omitStep', 'Scale.merge', 'Interval.fromName', 'Interval.simplify', 'Interval.name', 'Scale.part'])
  .add('Scale.fromQuality', ['Scale.qualityToQualityTable', 'Scale.fromQualityTable'])
  .add('Scale.commonName', ['Scale.decimal', 'Scale.name'])
  .add('Scale.thematicNames', ['Scale.decimal', 'Scale.name'])
  .add('Scale.fromThematicName', ['Scale.fromDecimal'])
  .add('Scale.fromCommonName', ['Scale.fromDecimal', 'Scale.fromThematicName'])
  .print()

// ========== ASSERT STUFF ==========
function assert (label: string, assertion: unknown) {
  if (Array.isArray(assertion)) {
    assertion.forEach((innerAssertion, pos) => {
      assert(`${label} (${pos})`, innerAssertion)
    })
  }
  else if (typeof assertion === 'function') {
    try {
      const result = assertion()
      if (result === false) throw new Error(`🚫 FAILURE: "${label}""`)
      else console.info(`✅ SUCCESS: "${label}"`)
    } catch (err) {
      throw new Error(`🚫 FAILURE: "${err}""`)
    }
  }
  else if (assertion === false) throw new Error(`🚫 FAILURE: "${label}""`)
  else console.info(`✅ SUCCESS: "${label}"`)
}

/* PitchClassLetter */
// console.log('-- PitchClassLetter --')
// console.log(Object
//   .entries(Object.getOwnPropertyDescriptors(PitchClassLetter))
//   .filter(([, desc]) => desc.writable === true)
//   .map(([key]) => key)
//   .join('\n')
// )
// assert('PitchClassLetters amount is 7', PitchClassLetter.namesArr.length === 7)
// assert('PitchClassLetter value 0 is named c', PitchClassLetter.valueToName(0) === 'c')
// assert('PitchClassLetter value 3 is named f', PitchClassLetter.valueToName(3) === 'f')
// assert('PitchClassLetter any value above 7 is named c', () => new Array(100)
//   .fill(null)
//   .map((_, pos) => (pos + 8))
//   .every(value => PitchClassLetter.valueToName(value) === 'c')
// )
// assert('PitchClassLetter g value is 4', PitchClassLetter.fromName('g') === 4)
// assert('PitchClassLetter b value is 6', PitchClassLetter.fromName('b') === 6)
// assert('PitchClassLetter ehz!r!hearhaa value is 6', PitchClassLetter.fromName('ehz!r!hearhaa') === 5)
// assert('PitchClassLetter h value is undefined', PitchClassLetter.fromName('h') === undefined)

/* Alteration */
console.log('-- Alteration --')
console.log(Object
  .entries(Object.getOwnPropertyDescriptors(Alteration))
  .filter(([, desc]) => desc.writable === true)
  .map(([key]) => key)
  .join('\n')
)
assert('Alteration of -2 is named ßß', Alteration.name(-2) === 'ßß')
assert('Alteration of 3 is named ###', Alteration.name(3) === '###')

/* PitchClass */
// console.log('-- PitchClass --')
// console.log(Object
//   .entries(Object.getOwnPropertyDescriptors(PitchClass))
//   .filter(([, desc]) => desc.writable === true)
//   .map(([key]) => key)
//   .join('\n')
// )
// assert('PitchClass value { alt: 2, ptch: 2 } is named ##e', PitchClass.valueToName({
//   alteration: 2,
//   pitchClassLetter: 2
// }) === '##e')
// assert('PitchClass value { alt: -1, ptch: 20 } is named ßc', PitchClass.valueToName({
//   alteration: -1,
//   pitchClassLetter: 20
// }) === 'ßc')
// assert('PitchClass name ßßf has value { alt: -2, ptch: 3 }', () => {
//   const value = PitchClass.fromName('ßßf')
//   if (value === undefined) return false
//   const { alteration, pitchClassLetter } = value
//   return alteration === -2 && pitchClassLetter === 3
// })
// assert('PitchClass name z has value undefined', PitchClass.fromName('z') === undefined)

/* Octave */
// console.log('-- Octave --')
// console.log(Object
//   .entries(Object.getOwnPropertyDescriptors(Octave))
//   .filter(([, desc]) => desc.writable === true)
//   .map(([key]) => key)
//   .join('\n')
// )
// assert('Octave with value 4 has name 4', Octave.valueToName(4) === '4')
// assert('Octave with name 4 has value 4', Octave.fromName('4') === 4)

/* Pitch */
// console.log('-- Pitch --')
// console.log(Object
//   .entries(Object.getOwnPropertyDescriptors(Pitch))
//   .filter(([, desc]) => desc.writable === true)
//   .map(([key]) => key)
//   .join('\n')
// )
// assert('Pitch with value { oct: 4, ptch: { ptch: 0, alt: 1 } } has name #c^4', Pitch.valueToName({
//   pitchClass: { pitchClassLetter: 0, alteration: 1 },
//   octave: 4
// }) === '#c^4')
// assert('Pitch name ßßg^-2 has value of { oct: -2, ptch: { ptch: 4, alt: -2 } }', () => {
//   const value = Pitch.fromName('ßßg^-2')
//   if (value === undefined) return false
//   const {
//     pitchClass: {
//       pitchClassLetter,
//       alteration
//     },
//     octave
//   } = value
//   return pitchClassLetter === 4
//     && alteration === -2
//     && octave === -2
// })

/* SimpleInterval */
// console.log('-- SimpleInterval --')
// console.log(Object
//   .entries(Object.getOwnPropertyDescriptors(SimpleInterval))
//   .filter(([, desc]) => desc.writable === true)
//   .map(([key]) => key)
//   .join('\n')
// )
// assert('SimpleInterval with value 3/-2 name is ßß4', SimpleInterval.valueToName({
//   simpleIntervalClass: 3,
//   alteration: -2
// }) === 'ßß4')
// assert('SimpleInterval with value -3/-2 name is ßß5', SimpleInterval.valueToName({
//   simpleIntervalClass: -3,
//   alteration: -2
// }) === 'ßß5')
// assert('SimpleInterval with value 55/4 name is ####7', SimpleInterval.valueToName({
//   simpleIntervalClass: 55,
//   alteration: 4
// }) === '####7')
// assert('SimpleInterval with name ß7 has value 6/-1', () => {
//   const value = SimpleInterval.fromName('ß7')
//   if (value === undefined) return false
//   const { simpleIntervalClass, alteration } = value
//   return simpleIntervalClass === 6 && alteration === -1
// })
// assert('SimpleInterval with name #9 has value 1/1', () => {
//   const value = SimpleInterval.fromName('#9')
//   if (value === undefined) return false
//   const { simpleIntervalClass, alteration } = value
//   return simpleIntervalClass === 1 && alteration === 1
// })
// assert('SimpleInterval with value 1/1 inversion has value 6/-2', () => {
//   const { simpleIntervalClass, alteration } = SimpleInterval.invert({
//     simpleIntervalClass: 1,
//     alteration: 1
//   })
//   return simpleIntervalClass === 6 && alteration === -2
// })
// assert('SimpleInterval with value -2/4 inversion has value 2/-5', () => {
//   const { simpleIntervalClass, alteration } = SimpleInterval.invert({
//     simpleIntervalClass: -2,
//     alteration: 4
//   })
//   return simpleIntervalClass === 2 && alteration === -5
// })
// assert('SimpleInterval with value 8/0 inversion has value 6/-1', () => {
//   const { simpleIntervalClass, alteration } = SimpleInterval.invert({
//     simpleIntervalClass: 8,
//     alteration: 0
//   })
//   return simpleIntervalClass === 6 && alteration === -1
// })
// assert('simpleIntervalSemitonesValuesArr has correct values', SimpleInterval.semitonesValuesArr.length === 7
//   && SimpleInterval.semitonesValuesArr.every((value, valuePos) => [0, 2, 4, 5, 7, 9, 11][valuePos] === value))
// assert('SimpleInterval of ß2 invertion is 7', SimpleInterval.valueToName(
//   SimpleInterval.invert(
//     SimpleInterval.fromName('ß2') as any
//   )
// ) === '7')
// assert('SimpleInterval of #8 invertion is ß1', SimpleInterval.valueToName(
//   SimpleInterval.invert(
//     SimpleInterval.fromName('#8') as any
//   )
// ) === 'ß1')
// assert('SimpleInterval of ß4 is 4 semitones', SimpleInterval.toSemitones(
//   SimpleInterval.fromName('ß4') as any
// ) === 4)
// assert('SimpleInterval of ###7 is 14 semitones', SimpleInterval.toSemitones(
//   SimpleInterval.fromName('###7') as any
// ) === 14)
// assert('SsimpleInterval between pitchClasses c and d is 2', SimpleInterval.valueToName(
//   SimpleInterval.fromPitchClasses(
//     PitchClass.fromName('c') as any,
//     PitchClass.fromName('ßd') as any
//   )
// ) === 'ß2')
// assert('SimpleInterval between pitchClasses b and d is ß3', SimpleInterval.valueToName(
//   SimpleInterval.fromPitchClasses(
//     PitchClass.fromName('b') as any,
//     PitchClass.fromName('d') as any
//   )
// ) === 'ß3')
// assert('SimpleInterval between pitchClasses a and ßßb is ßß2', SimpleInterval.valueToName(
//   SimpleInterval.fromPitchClasses(
//     PitchClass.fromName('a') as any,
//     PitchClass.fromName('ßßb') as any
//   )
// ) === 'ßß2')
// assert('SimpleInterval #3 becomes Interval #17 rised by 2 octaves', Interval.valueToName(
//   SimpleInterval.toInterval({
//     simpleIntervalClass: 2,
//     alteration: 1
//   }, 2)
// ) === '#17')
// assert('SimpleInterval ß2 added to PitchClass #b gives PitchClass #c', PitchClass.valueToName(
//   SimpleInterval.addToPitchClass(
//     SimpleInterval.fromName('ß2') as any,
//     PitchClass.fromName('#b') as any
//   ) as any
// )  === '#c')
// assert('SimpleInterval #2 added to PitchClass ßßa gives PitchClass ßb', PitchClass.valueToName(
//   SimpleInterval.addToPitchClass(
//     SimpleInterval.fromName('#2') as any,
//     PitchClass.fromName('ßßa') as any
//   ) as any
// ) === 'ßb')

// assert('SimpleInterval ß2 subtracted to PitchClass #c gives PitchClass #b', PitchClass.valueToName(
//   SimpleInterval.subtractToPitchClass(
//     SimpleInterval.fromName('ß2') as any,
//     PitchClass.fromName('#c') as any
//   ) as any
// ) === '#b')
// assert('SimpleInterval #2 subtracted to PitchClass ßßb gives PitchClass ßßßa', PitchClass.valueToName(
//   SimpleInterval.subtractToPitchClass(
//     SimpleInterval.fromName('#2') as any,
//     PitchClass.fromName('ßßb') as any
//   ) as any
// ) === 'ßßßa')
// assert('SimpleInterval between simple intervals ß2 and #7 is ##6', SimpleInterval.valueToName(
//   SimpleInterval.fromSimpleIntervals(
//     SimpleInterval.fromName('ß2') as any,
//     SimpleInterval.fromName('#7') as any
//   ) as any
// ) === '##6')

/* Interval */
console.log('-- Interval --')
console.log(Object
  .entries(Object.getOwnPropertyDescriptors(Interval))
  .filter(([, desc]) => desc.writable === true)
  .map(([key]) => key)
  .join('\n')
)
assert('Interval with value 3/-2 name is ßß4', Interval.name({
  step: 3,
  alteration: -2
}) === 'ßß4')
assert('Interval with value -3/-2 name is ßß-4', Interval.name({
  step: -3,
  alteration: -2
}) === 'ßß-4')
assert('Interval with value 55/4 name is ####56', Interval.name({
  step: 55,
  alteration: 4
}) === '####56')
assert('Interval with name ß7 has value 6/-1', () => {
  const { step, alteration } = Interval.fromName('ß7') as any
  return step === 6 && alteration === -1
})
assert('Interval with name #9 has value 8/1', () => {
  const { step, alteration } = Interval.fromName('#9') as any
  return step === 8 && alteration === 1
})
assert('Interval with name -14 has value -13/0', () => {
  const { step, alteration } = Interval.fromName('-14') as any
  return step === -13 && alteration === 0
})
assert('Interval of ßß-17 is ßß6 as a SimpleInterval', Interval.name(
  Interval.simplify(
    Interval.fromName('ßß-17') as any
  )
) === 'ßß6')
assert('Interval of -12 is -19 semitones', Interval.semitones(
  Interval.fromName('-12') as any
) === -19)
assert('Interval of 1 is 0 semitones', Interval.semitones(
  Interval.fromName('1') as any
) === 0)
assert('Interval of ßß3 is 2 semitones', Interval.semitones(
  Interval.fromName('ßß3') as any
) === 2)
// assert('Interval between pitch b^2 and d^4 is ß10', Interval.name(
//   Interval.fromPitches(
//     Pitch.fromName('b^2') as any,
//     Pitch.fromName('d^4') as any
//   ) as any
// ) === 'ß10')
// assert('Interval between pitch a^2 and ßßb^1 is ßß-7', Interval.valueToName(
//   Interval.fromPitches(
//     Pitch.fromName('a^2') as any,
//     Pitch.fromName('ßßb^1') as any
//   ) as any
// ) === 'ßß-7')
// assert('Interval -2 added to Pitch c^4 gives pitch b^3', Pitch.valueToName(
//   Interval.addToPitch(
//     Interval.fromName('-2') as any,
//     Pitch.fromName('c^4') as any
//   ) as any
// ) === 'b^3')
// assert('Interval -ßß2 added to Pitch ßßc^4 gives pitch ßßßßb^3', Pitch.valueToName(
//   Interval.addToPitch(
//     Interval.fromName('-ßß2') as any,
//     Pitch.fromName('ßßc^4') as any
//   ) as any
// ) === 'ßßßßb^3')
assert('Interval ß5 inverted is #-5', Interval.name(
  Interval.invert(
    Interval.fromName('ß5') as any
  ) as any
) === '#-5')
assert('Interval -8 inverted is 8', Interval.name(
  Interval.invert(
    Interval.fromName('-8') as any
  ) as any
) === '8')
assert('Interval 2 inverted is ß-2', Interval.name(
  Interval.invert(
    Interval.fromName('2') as any
  ) as any
) === 'ß-2')
// assert('Interval -2 subtracted to Pitch b^3 gives pitch c^4', Pitch.valueToName(
//   Interval.subtractToPitch(
//     Interval.fromName('-2') as any,
//     Pitch.fromName('b^3') as any
//   ) as any
// ) === 'c^4')
// assert('Interval -ßß2 subtracted to Pitch ßßßßb^3 gives pitch ßßc^4', Pitch.valueToName(
//   Interval.subtractToPitch(
//     Interval.fromName('-ßß2') as any,
//     Pitch.fromName('ßßßßb^3') as any
//   ) as any
// ) === 'ßßc^4')
assert('Interval between intervals ß-7 and #14 is ##20', Interval.name(
  Interval.between(
    Interval.fromName('ß-7') as any,
    Interval.fromName('#14') as any
  ) as any
) === '##20')
assert('Intervals ßß7, #5 and 2 are sorted as 2, #5, ßß7', 
  Interval.sort([
    Interval.fromName('ßß7') as any,
    Interval.fromName('#5') as any,
    Interval.fromName('2') as any
  ]).map(interval => Interval.name(interval))
    .join(',') === '2,#5,ßß7')
assert('Intervals 1, ßß2, 3, 3, 5 are deduped as 1, ßß2, 3, 5', Interval.dedupe([
  Interval.fromName('1') as any,
  Interval.fromName('ßß2') as any,
  Interval.fromName('3') as any,
  Interval.fromName('3') as any,
  Interval.fromName('5') as any
]).map(interval => Interval.name(interval))
  .join(',') === '1,ßß2,3,5')
assert('Intervals 1, ßß2, ßßßß3, ßßßßß4, 5 are semitoneDeduped as 1, 5', Interval.semitoneDedupe([
  Interval.fromName('1') as any,
  Interval.fromName('ßß2') as any,
  Interval.fromName('ßßßß3') as any,
  Interval.fromName('ßßßßß4') as any,
  Interval.fromName('5') as any
]).map(interval => Interval.name(interval))
  .join(',') === '1,5')
assert('Interval ß3 shifted to interval class 2 (numeric: 1) is #2', Interval.name(
  Interval.shiftStep(
    Interval.fromName('ß3') as any,
    1
  ) as any
) === '#2')
assert('Interval ##7 shifted to interval class 5 (numeric: 4) is ######5', Interval.name(
  Interval.shiftStep(
    Interval.fromName('##7') as any,
    4
  ) as any
) === '######5')
assert('Interval ####3 rationalized is #5', Interval.name(
  Interval.rationalize(
    Interval.fromName('####3') as any
  )
) === '#5')
assert('Interval ####3 hard rationalized is ß6', Interval.name(
  Interval.rationalize(
    Interval.fromName('####3') as any,
    true
  )
) === 'ß6')
// scaleNameToValue
// scaleValueToName
// scaleReallocateIntervals

/* Scale */
console.log('-- Scale --')
console.log(Object
  .entries(Object.getOwnPropertyDescriptors(Scale))
  .filter(([, desc]) => desc.writable === true)
  .map(([key]) => key)
  .join('\n')
)

assert('Scale named 1,#4,ß2,3,#2 has intervals 1 #4 ß2 3 #2', Scale.fromName('1,#4,ß2,3,#2')
  .map(e => Interval.name(e)).join(' ') === '1 #4 ß2 3 #2')
assert('Scale with values 1 ß3 5 7 is named 1,ß3,5,7', Scale.name([
  Interval.fromName('1') as any,
  Interval.fromName('ß3'),
  Interval.fromName('5'),
  Interval.fromName('7')
]) === '1,ß3,5,7')
assert('Scale with values ß3 1 5 7 is named ß3,1,5,7', Scale.name([
  Interval.fromName('ß3') as any,
  Interval.fromName('1'),
  Interval.fromName('5'),
  Interval.fromName('7')
]) === 'ß3,1,5,7')

assert('Scale with intervals 1, ##1, ####1, #####1, #######1, #########1, ###########1 is reallocated as 1,2,3,4,5,6,7', Scale.reallocate([
  Interval.fromName('1') as any,
  Interval.fromName('##1'),
  Interval.fromName('####1'),
  Interval.fromName('#####1'),
  Interval.fromName('#######1'),
  Interval.fromName('#########1'),
  Interval.fromName('###########1')
]).map(int => Interval.name(int)).join(',') === '1,2,3,4,5,6,7')

assert('Scale with intervals 1, #1, 2, 4, ß5, ß6, 6, #6, 7 is reallocated as 1,ß2,2,#3,#4,#5,6,#6,7', Scale.reallocate([
  Interval.fromName('1') as any,
  Interval.fromName('#1'),
  Interval.fromName('2'),
  Interval.fromName('4'),
  Interval.fromName('ß5'),
  Interval.fromName('ß6'),
  Interval.fromName('6'),
  Interval.fromName('#6'),
  Interval.fromName('7')
]).map(int => Interval.name(int)).join(',') === '1,ß2,2,#3,#4,#5,6,#6,7')

assert('Scale with intervals 7, ßß7, ßßßß7, ßßßßß7, ßßßßßßß7, ßßßßßßßßß7, ßßßßßßßßßßß7 is reallocated as 1,2,3,#4,5,6,7', Scale.reallocate([
  Interval.fromName('7') as any,
  Interval.fromName('ßß7'),
  Interval.fromName('ßßßß7'),
  Interval.fromName('ßßßßß7'),
  Interval.fromName('ßßßßßßß7'),
  Interval.fromName('ßßßßßßßßß7'),
  Interval.fromName('ßßßßßßßßßßß7')
]).map(int => Interval.name(int)).join(',') === '1,2,3,#4,5,6,7')

assert('Scale with intervals 1, ß2, 2, ß3, 3, ßß6, ß6, 6, ß7, 7 is reallocated as 1,ß2,2,ß3,3,##4,#5,6,#6,7', Scale.reallocate([
  Interval.fromName('1') as any,
  Interval.fromName('ß2'),
  Interval.fromName('2'),
  Interval.fromName('ß3'),
  Interval.fromName('3'),
  Interval.fromName('ßß6'),
  Interval.fromName('ß6'),
  Interval.fromName('6'),
  Interval.fromName('ß7'),
  Interval.fromName('7')
]).map(int => Interval.name(int)).join(',') === '1,ß2,2,ß3,3,##4,#5,6,#6,7')


const lol = [
  ['1', null],
  ['ß2', '2', null],
  ['ß3', '3', null],
  ['4', '#4', null],
  ['ß5', '5', '#5', null],
  ['ß6', '6', null],
  ['ßß7', 'ß7', '7', null]
]

new Array(Math.pow(4, 7))
// new Array(1)
  .fill(0)
  .map((_, pos) => {
    const base4Pos = (pos + 0).toString(4).split('').map(e => parseInt(e))
    const reversedBase4Pos = [...base4Pos].reverse()
    const withZeros = [...reversedBase4Pos, 0, 0, 0, 0, 0, 0, 0]
    const sliced = withZeros.slice(0, 7).reverse()
    const intervals = new Array(7).fill(null).map((_, pos) => lol.at(pos)?.at(sliced.at(pos) as any))
    if (intervals.includes(undefined as any)) return;
    const scaleName = intervals.filter(e => e!== null).join(',')
    const scale = Scale.fromName(scaleName)
    const quality = Scale.quality(scale)
    const table = Scale.qualityToQualityTable(quality)
    const value = Scale.fromQualityTable(table)
    const name = Scale.name(value)
    // console.log(scaleName, '——>', quality, '——>', name)
    if (scaleName !== name) console.log('ERROR', pos, scaleName, '|', scale, '|', quality, '|', name)
    return {
      scaleName,
      scale,
      quality,
      table,
      value,
      name
    }
  })

// console.log(Interval.nameRegexp)

// const regexps = makeRegexpFromStrings([...Scale.mainQualitiesToNameMap].map(([mainQuality]) => mainQuality))
// const strings = ['a', 'abc', 'abcd', 'bce', 'bcz']
// const strings = [...Scale.mainQualitiesToNameMap].map(([mainQuality]) => mainQuality)

// const commonNames = [...Scale.decimalValueToCommonNamesMap].map(([, name]) => name)
// const thematicNames = [...Scale.decimalValueToThematicNamesMap].map(([, items]) => {
//   return items.map(item => item.name)
// }).flat()

// console.log(thematicNames.length)
// const strings = [...commonNames, ...thematicNames]
// console.log(strings.join(','))

// const regexp = makeRegexpFromStrings(strings)
// strings.forEach(str => {
//   console.log(str.match(regexp))
// })
// console.log(regexp)
// console.log(strings)
// ;(window as any).rrreg = new RegExp(`^${regexp.source}$`)


