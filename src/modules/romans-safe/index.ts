import {
  romanize as unsafeRomanize,
  deromanize as unsafeDeromanize
} from 'romans'

export const romanize = (...args: Parameters<typeof unsafeRomanize>) => {
  try { return unsafeRomanize(...args) }
  catch (err) { return undefined }
}

export const deromanize = (...args: Parameters<typeof unsafeDeromanize>) => {
  try { return unsafeDeromanize(...args) }
  catch (err) { return undefined }
}
