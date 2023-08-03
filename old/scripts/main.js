'use strict'

document.addEventListener('keydown', handleKeydown)
let isAudioContextResumed = false

async function handleKeydown (e) {
  if (!isAudioContextResumed) {
    await Tone.start()
    isAudioContextResumed = true
  }
  if (e.key === ' ') {
    playThatFunkyMusicWhiteBoy()
  }
}

function playThatFunkyMusicWhiteBoy () {
  // const cents = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100]
  // const temp = new Temperament(cents)
  // temp.play('8n')
  const bn = new PitchLetter(1454)
  console.log(bn.value)

  // const pitch = new Pitch(450)
  // pitch.play()
}
