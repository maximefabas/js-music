export default function assert (label: string, assertion: unknown) {
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
