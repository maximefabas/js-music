/* Note letter */

type NoteLetterValue = number
type NoteLetterName = string
const noteLettersValuesToNamesMap = new Map<NoteLetterValue, NoteLetterName>([
  [0, 'a'],
  [2, 'b'],
  [4, 'c'],
  [5, 'd'],
  [7, 'e'],
  [9, 'f'],
  [11, 'g']
])

function noteLetterValueToName (value: NoteLetterValue) {
  return noteLettersValuesToNamesMap.get(value)
}

function noteLetterNameToValue (name: NoteLetterName) {
  const mapAsArr = [...noteLettersValuesToNamesMap.entries()]
    .map(([value, name]) => ({ value, name }))
  const nameExists = mapAsArr.find(pair => pair.name === name)
  if (nameExists === undefined) return undefined
  return nameExists.value
}

/* Alteration */

type AlterationValue = number
type AlterationName = string

function alterationValueToName (value: AlterationValue) {
  if (value > 0) return new Array(value).fill('#').join('')
  if (value < 0) return new Array(-1 * value).fill('♭').join('')
  return ''
}

function alterationNameToValue (name: AlterationName) {
  const chars = name.split('')
  const sharps = chars.filter(char => char === '#').length
  const flats = chars.filter(char => char === '♭').length
  return sharps - flats
}

/* Note */

type Note = {
  letter: NoteLetterValue
  alteration: AlterationValue
}
