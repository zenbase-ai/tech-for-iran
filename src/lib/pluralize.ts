import plur from "plur"

export default function pluralize(count: number, word: string): string {
  return `${count} ${plur(word, count)}`
}
