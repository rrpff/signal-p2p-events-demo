import seedrandom from 'seedrandom'

const TEST_SEED = 'TEST_SEED'

export const createRng = () => process.env.NODE_ENV === 'test' ? seedrandom(TEST_SEED) : seedrandom()
export const pick = (rng: () => number, options: any[]) => options[Math.floor(rng() * options.length)]
