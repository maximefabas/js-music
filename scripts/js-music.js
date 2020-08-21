'use strict'

/* * * * * * * * * * * * * * * * * * * * * * * * 
 *
 * THEORY OBJECT
 *
 * * * * * * * * * * * * * * * * * * * * * * * */
class TheoryObject {
  constructor (props) {
    this.instrument = new Tone.PolySynth().connect(Tone.Master)
    this.id = Math.random().toString(36).slice(2)
  }
}

/* * * * * * * * * * * * * * * * * * * * * * * * 
 *
 * PITCH LETTER
 * --
 * Value:
 * number
 *
 * Props:
 * number || letter
 *
 * * * * * * * * * * * * * * * * * * * * * * * */
class PitchLetter extends TheoryObject {
  constructor (props) {
    super(props)
    this.value = PitchLetter.readProps(props)
  }

  get name () {
    return PitchLetter.letters[this.value]
  }

  static readProps (props) {
    const letters = PitchLetter.letters
    if (typeof props === 'number') return parseInt(props, 10) % letters.length
    if (typeof props === 'string'
      && letters.includes(props.toLowerCase()))
      return letters.indexOf(props.toLowerCase())
    return 0
  }

  static letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
}

/* * * * * * * * * * * * * * * * * * * * * * * * 
 *
 * ALTERATION
 * --
 * Value:
 * number
 *
 * * * * * * * * * * * * * * * * * * * * * * * */
class Alteration extends TheoryObject {
  constructor (props) {
    super(props)
    this.value = Alteration.readProps(props)
  }

  get name () {
    return this.value >= 0
      ? new Array(this.value).fill('#').join('')
      : new Array(-1 * this.value).fill('b').join('')
  }

  static readProps (props) {
    if (typeof props === 'number') return parseInt(props, 10)
    if (typeof props === 'string') {
      const flats = props.length - props.split('b').join('').length
      const sharps = props.length - props.split('#').join('').length
      return sharps - flats
    }
    return 0
  }
}

/* * * * * * * * * * * * * * * * * * * * * * * * 
 *
 * PITCH CLASS
 * --
 * Value:
 * { letter: <PitchLetter>, alteration: <Alteration> }
 *
 * * * * * * * * * * * * * * * * * * * * * * * */
class PitchClass extends TheoryObject {
  constructor (props) {
    super(props)
    this.value = PitchClass.readProps(props)
  }

  get name () {
    return `${this.value.alteration.name}${this.value.letter.name}`
  }

  static readProps (props) {
    if (typeof props === 'string') {
      const alteration = new Alteration(props.slice(0, -1))
      const letter = new PitchLetter(props.slice(-1))
      return { letter, alteration }
    }
    return {
      letter: new PitchLetter('a'),
      alteration: new Alteration('')
    }
  }
}

/* * * * * * * * * * * * * * * * * * * * * * * * 
 *
 * OCTAVE
 * --
 * Value:
 * number
 *
 * * * * * * * * * * * * * * * * * * * * * * * */
class Octave extends TheoryObject {
  constructor (props) {
    super(props)
    this.value = Octave.readProps(props)
  }

  static readProps (props) {
    if (typeof props === 'number') return parseInt(props, 10)
    if (typeof props === 'string') {
      const parsed = parseInt(props, 10)
      return Number.isNaN(parsed) ? 4 : parsed
    }
    return 4
  }
}

/* * * * * * * * * * * * * * * * * * * * * * * * 
 *
 * PITCH
 * --
 * Value:
 * { class: <PitchClass>, octave: <Octave> }
 *
 * * * * * * * * * * * * * * * * * * * * * * * */
class Pitch extends TheoryObject {
  constructor (props) {
    super(props)
    this.value = Pitch.readProps(props)
  }

  get name () {
    return `${this.value.class.name}${this.value.octave.value}`
  }

  static readProps (props) {
    if (typeof props === 'string') {
      const octaveMatch = props.match(/[0-9]+$/)
      const octave = octaveMatch ? new Octave(octaveMatch[0]) : new Octave()
      const octaveStrIndex = octaveMatch ? octaveMatch.index : props.length
      const propsWithoutOctave = props.slice(0, octaveStrIndex)
      const pitchClass = new PitchClass(propsWithoutOctave)
      return { class: pitchClass, octave }
    }
    return { class: new PitchClass(), octave: new Octave() }
  }
}

/* * * * * * * * * * * * * * * * * * * * * * * * 
 *
 * SCALE
 * --
 * Value:
 * <BitArray>
 *
 * * * * * * * * * * * * * * * * * * * * * * * */
class Scale extends TheoryObject {
  constructor (props) {
    super(props)
    this.value = Scale.readProps(props)
  }

  get decimalName () {
    return parseInt(this.value.join(''), 2)
  }

  get binaryName () {
    return this.value.join('')
  }

  get pattern () {
    return this.value.map(bit => bit ? 'x' : '-').join('')
  }

  static readProps (props) {
    if (Array.isArray(props)) {
      /* bit array */
      if (props.every(bit => bit === 0 || bit === 1)) {
        return props
      /* steps array */
      } else if ('array of steps') {
        /* [WIP] */
        return [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1]
      }
    /* decimal name */
    } else if (typeof props === 'number') {
      return parseInt(props, 10)
        .toString(2)
        .split('')
        .map(e => parseInt(e))
    } else if (typeof props === 'string') {
      const isBinaryName = props.split('').every(char => char.match(/[0|1]/igm))
      const isPattern = props.split('').every(char => char.match(/[-|x]/igm))
      /* binary name */
      if (isBinaryName) {
        return props.split('')
          .map(char => parseInt(char, 10))
      /* pattern */
      } else if (isPattern) {
        return props.split('')
          .map(char => char === '-' ? 0 : 1)
      /* name */
      } else {
        return Scale.nameToBitArray(props)
      }

    } else return [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1]
  }

  static nameToBitArray (name) {
    let walter = name.replace(/\s/igm, '')
    let output = [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0]
    while (walter.length) {
      console.log(walter)
      const matchingQuality = Scale.qualities.find(quality => walter.match(quality.regexp))
      if (!matchingQuality) {
        console.log('no quality matching')
        walter = ''
      } else {
        const match = walter.match(matchingQuality.regexp)[0]
        walter = walter.slice(match.length)
        output = matchingQuality.effect(output)
        console.log(matchingQuality)
        console.log(match)
        console.log(output)
      }
    }
    return [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1] 
  }

  static qualities = [
    {
      regexp: /^mixolydian/,
      effect: bitArray => bitArray.length !== 12 ? bitArray : [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0]
    }, {
      regexp: /^sus24/,
      effect: bitArray => bitArray.length !== 12 ? bitArray : bitArray.map((bit, i) => {
        if (i === 2 || i === 5) return 1
        if (i === 3 || i === 4) return 0
        return bit
      })
    }, {
      regexp: /^sus2/,
      effect: bitArray => bitArray.length !== 12 ? bitArray : bitArray.map((bit, i) => {
        if (i === 2) return 1
        if (i === 3 || i === 4) return 0
        return bit
      })
    }, {
      regexp: /^sus4/,
      effect: bitArray => bitArray.length !== 12 ? bitArray : bitArray.map((bit, i) => {
        if (i === 3 || i === 4) return 0
        if (i === 5) return 1
        return bit
      })
    }, {
      regexp: /^aug/,
      effect: bitArray => bitArray.length !== 12 ? bitArray : bitArray.map((bit, i) => {
        if (i === 3 || i === 7) return 0
        if (i === 4 || i === 8) return 1
        return bit
      })
    }, {
      regexp: /^dim7/,
      effect: bitArray => bitArray.length !== 12 ? bitArray : bitArray.map((bit, i) => {
        if (i === 3 || i === 6 || i === 9) return 1
        if (i === 4 || i === 7) return 0
        return bit
      })
    }, {
      regexp: /^dim/,
      effect: bitArray => bitArray.length !== 12 ? bitArray : bitArray.map((bit, i) => {
        if (i === 3 || i === 6) return 1
        if (i === 4 || i === 7) return 0
        return bit
      })
    }, {
      regexp: /^M7/,
      effect: bitArray => bitArray.length !== 12 ? bitArray : bitArray.map((bit, i) => {
        if (i === 10) return 0
        if (i === 11) return 1
        return bit
      })
    }, {
      regexp: /^7/,
      effect: bitArray => bitArray.length !== 12 ? bitArray : bitArray.map((bit, i) => {
        if (i === 10) return 1
        if (i === 11) return 0
        return bit
      })
    }, {
      regexp: /^M/,
      effect: bitArray => bitArray.length !== 12 ? bitArray : bitArray.map((bit, i) => {
        if (i === 3) return 0
        if (i === 4) return 1
        return bit
      })
    }, {
      regexp: /^m/,
      effect: bitArray => bitArray.length !== 12 ? bitArray : bitArray.map((bit, i) => {
        if (i === 3) return 1
        if (i === 4) return 0
        return bit
      })
    }, {
      regexp: /^add\([b|#]*[1-7]\)/,
      effect: null
    }
  ]

}

/*

5
--- sus2
--- dim
--- m
-- M
-- aug
--- sus4
-- sus2/4
--- 7
--- M7
dim7


*/

/* * * * * * * * * * * * * * * * * * * * * * * * 
 *
 * FUNDAMENTAL FREQUENCY
 * --
 * Value:
 * number
 *
 * * * * * * * * * * * * * * * * * * * * * * * */
// class FundamentalFrequency extends TheoryObject {
//   constructor (props) {
//     super(props)
//     this.value = FundamentalFrequency.readProps(props)
//   }

//   static readProps (props) {
//     if (typeof props === 'number') return props
//     if (typeof props === 'string') {
//       const parsed = parseFloat(props)
//       return Number.isNaN(parsed) ? 440 : parsed
//     }
//     return 440
//   }
// }

/* * * * * * * * * * * * * * * * * * * * * * * * 
 *
 * TEMPERAMENT
 * --
 * Value:
 * ...cents
 *
 * * * * * * * * * * * * * * * * * * * * * * * */
// class Temperament extends TheoryObject {
//   constructor (props) {
//     super(props)
//     this.value = Temperament.readProps(props) // cents list
//   }

//   get name () {
//     const isNameKnown = Temperament.namesAndCents.find(pair => pair.cents.join('/') === this.value.join('/'))
//     return isNameKnown ? isNameKnown.name : null
//   }

//   static readProps (props) {
//     if (Array.isArray(props)) return props
//     if (typeof props === 'string') {
//       const isNameKnown = Temperament.namesAndCents.find(pair => pair.name === props)
//       if (isNameKnown) return isNameKnown.cents
//       return Temperament.readProps('12tet')  
//     }
//     return Temperament.readProps('12tet')
//   }

//   static namesAndCents = [
//     { name: '12tet', cents: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100] }
//   ]

//   // play (duration = '8n', time, velocity) {
//   //   this.value.forEach((cents, i) => {
//   //     const outPitch = Pitch.addCents(new Pitch(440), cents)
//   //     const outTime = new Tone.Time(duration).toSeconds() * i + new Tone.Time(time).toSeconds()
//   //     outPitch.play(duration, `+${outTime}`, velocity)
//   //   })
//   // }
// }


