export default class UsernameGenerator {
  // Words from: https://www.random-generator.org.uk/words/
  static WORDS = [
    "joystick", "disease", "country", "students", "awesome", "natter", "smashing", "chuckle", "unkind", "hedges",
    "teachers", "december", "partner", "summer", "people", "bravely", "dearest", "guitar", "cheaters", "dungeons",
    "deeply", "deadly", "brothers", "muppet", "cannot", "dagger", "horses", "kitten", "sunrise", "tights", "cherry",
    "kicked", "puppies", "monday", "husband", "friend", "homework", "japanese", "commit", "number", "squeeze", "greasy",
    "chatter", "whilst", "darkness", "please", "sarong", "kissed", "avatar", "nestled", "spider", "though", "sunset",
    "school", "cornish", "english", "thinking", "dreams", "mistaken", "poppies", "french", "england", "scottish",
    "kindly", "purple", "thought", "smoking", "insight", "hearts", "without", "resist", "rather", "shorts", "poetic",
    "mother", "outlook", "moonwalk", "rocking", "creative", "vinegar", "flowers", "complain", "warnings", "wolves",
    "brains", "scrummy", "daring", "spring", "speaks", "dishes", "crimes", "hideous", "canada", "dapple", "tuesday",
    "thoughts", "autumn", "grandma", "insight", "canadian", "handbag", "complain", "gnomes", "cheaters", "tigers",
    "annoying", "strain", "defined", "hearts", "darkly", "spinach", "thoughts", "cherry", "mirrored", "hideous",
    "shorts", "creative", "thought", "singing", "spread", "celery", "travel", "speaks", "single", "england",
    "barbecue", "review", "rachel", "pointy", "playing", "moonwalk", "american", "hammers", "shiver", "daring",
    "without", "winter", "rapping", "cousin", "violet", "wolves", "thinking", "smashing", "homies", "dreamt",
    "daughter", "december", "warnings", "probable", "briskly", "dancing", "snooze", "bravely", "dearest",
    "natter", "street", "little", "twenty", "eating", "vinegar", "monkeys", "kindly", "bootleg", "deeply",
    "ladies", "strong", "monster", "friends", "rocking", "guitar", "knight", "dishes", "kicked", "cornish",
    "cheese", "scottish", "chatter", "accord", "idyllic", "kissed", "saturday", "mourned", "german", "sausage",
    "chapel", "evening", "initial", "darkness", "snitches", "deftly", "nuzzle", "summer", "lovely", "busily",
    "sunset"
  ]

  static generate() {
    const pickWords = (remainingWordsNeeded: number, chosenWords: string[] = []): string[] => {
      if (remainingWordsNeeded === 0) return chosenWords

      const rand = Math.random()
      const word = this.WORDS[Math.floor(rand * this.WORDS.length)]
      if (chosenWords.includes(word)) return pickWords(remainingWordsNeeded, chosenWords)

      return pickWords(remainingWordsNeeded - 1, [...chosenWords, word])
    }

    return pickWords(3).join('_')
  }
}