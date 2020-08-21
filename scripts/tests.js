const tests = [
  new PitchLetter('F').value === 5,
  new PitchLetter('H').value === 0,
  new PitchLetter(2).name === 'c',
  new PitchLetter().value === 0,

  new Alteration('#bbb###bbbbb#').value === -3,
  new Alteration('#bbb###bbbbb#').name === 'bbb',
  new Alteration(-1).name === 'b',
  new Alteration().value === 0,
  
  new PitchClass('bbG').name === 'bbg',
  new PitchClass(123).name === 'a',
  new PitchClass('grae#fz#ghazB').name === '##b',
  new PitchClass().name === 'a',

  new Octave(7).value === 7,
  new Octave('7.3').value === 7,
  new Octave().value === 4,

  new Pitch('bB3').name === 'bb3',
  new Pitch().name === 'a4',

  // new FundamentalFrequency(420).value === 420,
  // new FundamentalFrequency('420.3').value === 420.3,
  // new FundamentalFrequency('zzz').value === 440,
  // new FundamentalFrequency().value === 440,

  // new Temperament('12tet').value.join('/') === [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100].join('/'),
  // new Temperament([0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100]).name === '12tet',
  // new Temperament('jtrkzthzgvze').name === '12tet',
  // new Temperament().name === '12tet'
]

tests.forEach((test, i) => {
  if (test === false) console.error(`Test ${i+1} failed.`)
  else if (test !== true) console.error(`Test ${i+1} failed: ${test}`)
})
