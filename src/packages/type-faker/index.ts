import WORDS from './words.json' // Words from: https://www.random-generator.org.uk/words/

type WithoutIntersection<T, U> = Pick<T, Exclude<keyof T, keyof U>>
type SubMapping<TBase, TSub> = Mapping<WithoutIntersection<TSub, TBase> & Partial<TBase>>
type CombinedMapping<TBase, TSub> = Mapping<WithoutIntersection<TSub, TBase>> & Mapping<TBase>
type Mapping<T> = {
  [K in keyof T]: () => T[K]
}

const pick = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)]

export default class TypeFaker<T> {
  static static = (value: any) => () => value
  static word = () => () => pick(WORDS)
  static letter = () => () => String.fromCharCode(97 + Math.floor(Math.random() * 26))
  static integer = () => () => Math.floor(Math.random() * 10)
  static date = () => () => new Date(Math.floor(Math.random() * Date.now()))
  static ulid = () => () => {
    let str = ''
    while (str.length < 26) str += Math.random() > 0.5 ? TypeFaker.integer()() : TypeFaker.letter()()
    return str.toUpperCase()
  }

  constructor(private mapping: Mapping<T>) {}

  extend<TExtension extends T>(subMapping: SubMapping<T, TExtension>): TypeFaker<TExtension> {
    const combined: CombinedMapping<T, TExtension> = { ...this.mapping, ...subMapping }
    return new TypeFaker<TExtension>(combined as Mapping<TExtension>)
  }

  generate(overrides: Partial<T> = {}): T {
    const keys = Object.keys(this.mapping) as (keyof T)[]
    const generated = keys.reduce((acc, key) => {
      const value = this.mapping[key]()
      return { ...acc, [key]: value }
    }, {} as T)

    return { ...generated, ...overrides }
  }
}
