import { createRng, pick } from '../helpers/random'
import WORDS from '../packages/type-faker/words.json' // Words from: https://www.random-generator.org.uk/words/

const rng = createRng()

export default class UsernameGenerator {
  static rng = createRng()
  static WORDS = WORDS

  static generate(customRng?: () => number) {
    const pickWords = (remainingWordsNeeded: number, chosenWords: string[] = []): string[] => {
      if (remainingWordsNeeded === 0) return chosenWords

      const word = pick(customRng || rng, this.WORDS)
      if (chosenWords.includes(word)) return pickWords(remainingWordsNeeded, chosenWords)

      return pickWords(remainingWordsNeeded - 1, [...chosenWords, word])
    }

    return pickWords(3).join('_')
  }
}
