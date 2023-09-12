export function withLabel (label: string): any {
  return function (method: Function, _context: DecoratorContext) {
    return function (this: any, ...args: any[]): any {
      console.group(label)
      return method.call(this, ...args)
    }
  }
}

export function withLabelEnd (method: Function, _context: DecoratorContext): any {
  return function (this: any, ...args: any[]): any {
    console.groupEnd()
    return method.call(this, ...args)
  }
}

export function withTime (method: Function, _context: DecoratorContext): any {
  return function (this: any, ...args: any[]): any {
    console.time('duration')
    const result = method.call(this, ...args)
    console.timeEnd('duration')
    return result
  }
}

export function withInput (method: Function, _context: DecoratorContext): any {
  return function (this: any, ...args: any[]): any {
    console.log('input:', ...args)
    return method.call(this, ...args)
  }
}

export function withResult (method: Function, _context: DecoratorContext): any {
  return function (this: any, ...args: any[]): any {
    const result = method.call(this, ...args)
    console.log('result', result)
    return result
  }
}
