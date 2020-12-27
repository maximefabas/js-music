// Empty prop in constructor
// 1 prop & nullish arg
// 1 prop & constructor arg
// 1 prop && name arg

// defaultValue
// isNameValid
// nameToValue
// propsToValue
// valueToName
// value, _value
// get name, set name
// copy
// 

const tests = [
  /* TheoryObject */
  TheoryObject.defaultValue === null,
  TheoryObject.isNameValid('') === true,
  TheoryObject.isNameValid('any other value') === false,
  TheoryObject.nameToValue('any value') === null,
  TheoryObject.propsToValue('any value') === null,
  TheoryObject.valueToName('any value') === '',

  TheoryObject.toX(5, 4) === 1,
  TheoryObject.toX(-1, 4) === 3,
  TheoryObject.toX(-41, 12) === 7,
  TheoryObject.toX(10, 10) === 0,
  
  new TheoryObject().value === TheoryObject.defaultValue,
  new TheoryObject(null).value === TheoryObject.defaultValue,
  new TheoryObject(undefined).value === TheoryObject.defaultValue,
  new TheoryObject(new TheoryObject()).constructor.name === 'TheoryObject',

  new TheoryObject()._.constructor.name === 'TheoryObject',
  new TheoryObject()._value === new TheoryObject().value,
  (() => { const a = new TheoryObject(); a.value = 'test'; return a.value === null })(),
  new TheoryObject().name === '',
  (() => { const a = new TheoryObject(); a.name = 'test'; return a.name === '' })(),
  new TheoryObject()._.constructor.name === 'TheoryObject',

  /* PitchLetter */
  PitchLetter.defaultValue === 0,
  PitchLetter.isNameValid('') === false,
  PitchLetter.isNameValid('a') === true,
  PitchLetter.isNameValid('A') === false,
  PitchLetter.isNameValid('h') === false,
  PitchLetter.isNameValid('H') === false,
  PitchLetter.nameToValue('g') === 6,
  PitchLetter.nameToValue('G') === undefined,
  PitchLetter.propsToValue(19) === TheoryObject.toX(19, 7),

  PitchLetter.intervalBetween('f', 'e').name === '7',
  PitchLetter.intervalBetween('a', 'b').name === '2',
  PitchLetter.intervalBetween('a', 'z').name === '1',

  new PitchLetter().value === PitchLetter.defaultValue,
  new PitchLetter(null).value === PitchLetter.defaultValue,
  new PitchLetter(undefined).value === PitchLetter.defaultValue,
  new PitchLetter(new PitchLetter()).constructor.name === 'PitchLetter',

  new PitchLetter()._.constructor.name === 'PitchLetter',
  new PitchLetter(7)._value === new PitchLetter(7).value,
  new PitchLetter('f').value === 5,
  new PitchLetter('F').value === 0,
  new PitchLetter('h').value === 0,
  new PitchLetter(4).name === 'e',
  (() => { const a = new PitchLetter('g'); a.name = 'b'; return a.name === 'b' })(),
  (() => { const a = new PitchLetter('g'); a.name = 'z'; return a.name === 'g' })(),
  
  
  new PitchLetter(2).name === 'c',
  new PitchLetter().value === 0,
  new Alteration('#bbb###bbbbb#').value === -3,
  new Alteration().value === 0,
  new Alteration('#bbb###bbbbb#').name === 'bbb',
  new Alteration(-1).name === 'b',
  new Alteration('##').asHalfSteps === 2,
  Alteration.intervalBetween('b', '#').name === '##1',
  Alteration.sum('#', 'bb').value === -1,
  new PitchClass('##f').value.pitchLetter.name === 'f',
  new PitchClass('##F').value.pitchLetter.name === 'a',
  new PitchClass('##f').value.alteration.name === '##',
  new PitchClass('bbg').name === 'bbg',
  new PitchClass(123).name === 'a',
  new PitchClass('c', 2).name === '##c',
  new PitchClass('c', 'bb').name === 'bbc',
  new PitchClass('grae#fz#ghazB').name === 'a',
  new PitchClass().name === 'a',
  PitchClass.intervalBetween('bb', '#c').name === '#2',
  new Octave(7).value === 7,
  new Octave('7.3').value === 4,
  new Octave().value === 4,
  new Octave('^4').name === '^4',
  new Octave('^4').asHalfSteps === 48,
  Octave.intervalBetween(2, 4).name === '15',
  Octave.sum(2, 3).value === 5,
  new Pitch('bb^3').name === 'bb^3',
  new Pitch().name === 'a^4',
  new Pitch('#c', 4).name === '#c^4',
  Pitch.intervalBetween('c^4', '#f^5').name === '#11',
  new IntervalNumber(4).value === 4,
  new IntervalNumber(40).name === '41',
  new IntervalNumber('0').value === 0,
  new IntervalNumber('1').value === 0,
  new IntervalNumber(0).value === 0,
  new IntervalNumber(1).value === 1,
  new IntervalNumber(6).asHalfSteps === 11,
  IntervalNumber.intervalBetween(1, 2).name === '2',
  IntervalNumber.intervalBetween(0, -1).name === '-2',
  IntervalNumber.intervalBetween(0, 101).name === '102',
  IntervalNumber.sum(0, 2).value === 2,
  IntervalNumber.sum(-1, 3).value === 2,
  new Interval(0).name === '1',
  new Interval(1).name === 'b2',
  new Interval(-1).name === '#-2',
  new Interval(7).name === '5',
  new Interval('0').name === '1',
  new Interval('1').name === '1',
  new Interval('-1').name === '1',
  new Interval('7').name === '7',
  new Interval('#-1').name === '#1',
  new Interval('7').asHalfSteps === 11,
  Interval.intervalBetween('b2', 'b4').name === 'b3',
  Interval.intervalBetween('7', '5').name === '-3',
  Interval.sum('b2', 'b4').name === 'bb5',
  Interval.liftNumber('b2', 1).name === 'bbb3',
  Interval.liftNumber('3', 1).name === 'b4',
  Interval.liftNumber('b8', -1).name === '7',
  // Scale.allocateIntervals(['1', 'b2', '2', 'b3', '3'].map(e => new Interval(e))).map(interval => interval.name).join(',') === '1,b2,bb3,bb4,bbb5',
  // Scale.allocateIntervals(['6', '#6', 'b7', '7', '#7', '##7'].map(e => new Interval(e))).map(interval => interval.name).join(',') === '########2,#####3,########4,#####5,##6,b7'
]

tests.forEach((test, i) => test
  ? console.info('test', i + 1, 'success')
  : console.error('test', i + 1, 'failed'))
