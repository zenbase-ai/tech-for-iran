import { randomInt } from "es-toolkit"

/**
 * Returns true with probability `numerator/denominator`, false otherwise.
 * @param numerator - Number of times to return true
 * @param denominator - Total number of possible outcomes
 * @returns true with probability numerator/denominator
 * @example
 * chance(4, 7)
 */
export const chance = (numerator: number, denominator: number) =>
  randomInt(0, denominator) < numerator
