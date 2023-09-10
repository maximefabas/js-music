export type Item = {
  dependencies: Item[]
  purposes: Item[]
}
export type Value = Map<unknown, Item>
export enum Errors {
  CANNOT_ADD_TWICE = 'cannot add a dependency twice',
  DEPENDENCY_NOT_FOUND = 'dependency not found'
}

export default class Graph {
  static getItemDepth (item: Item): number {
    const { dependencies } = item
    if (dependencies.length === 0) return 0
    const maxLevelOfDependencies = Math.max(...dependencies.map(dep => Graph.getItemDepth(dep)))
    return maxLevelOfDependencies + 1
  }

  value: Value = new Map()

  add (name: unknown, dependenciesNames: unknown[]) {
    if (this.value.get(name) !== undefined) throw new Error(`${Errors.CANNOT_ADD_TWICE}: ${name}`)
    const dependencies = dependenciesNames.map(name => {
      const dependency = this.value.get(name)
      if (dependency === undefined) throw new Error(`${Errors.DEPENDENCY_NOT_FOUND}: ${name}`)
      return dependency
    })
    const graphItem = { dependencies, purposes: [] }
    this.value.set(name, graphItem)
    dependencies.forEach(dependency => dependency.purposes.push(graphItem))
    return this
  }

  print () {
    [...this.value]
      .map(([name, item]) => ({ name, item, depth: Graph.getItemDepth(item) }))
      .sort((eltA, eltB) => eltA.depth - eltB.depth)
      .forEach(elt => {
        const indent = new Array(2 * elt.depth).fill(' ').join('')
        console.log(`${elt.depth} ${indent}${elt.name}`)
      })
    return this
  }
}
