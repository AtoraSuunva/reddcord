import { Prisma } from '@prisma/client'
import { PostFullInfo } from './utils.js'

type AwardWithEffect = Prisma.StoreItemCreateInput & {
  applyEffect(postInfo: PostFullInfo): PostFullInfo
}

export const effectAwards: AwardWithEffect[] = [
  {
    type: 'award',
    name: 'Gold',
    emoji: '🥇',
    description: 'For the best posts! You get a thanks in return!',
    price: 10,
    currency: 'upvote',
    applyEffect(postInfo) {
      return {
        ...postInfo,
        content: `${postInfo.content}\nEdit: Thanks for the gold kind stranger!`,
      }
    },
  },
  {
    type: 'award',
    name: 'Silver',
    emoji: '🥈',
    description: 'When a post is OK. No effect.',
    price: 5,
    currency: 'upvote',
    applyEffect(postInfo) {
      return {
        ...postInfo,
      }
    },
  },
  {
    type: 'award',
    name: 'Bronze',
    emoji: '🥉',
    description: 'Actually made of dirt. Partially covers the post.',
    price: 3,
    currency: 'upvote',
    applyEffect(postInfo) {
      return {
        ...postInfo,
        content: randomReplaceCharacters(
          postInfo.content ?? '',
          (char) =>
            `${char}\u{034F}${String.fromCodePoint(0x0300 + randomInt(0, 0x4e))}`,
          0.025,
        ),
      }
    },
  },
]

export const dbAwards: Prisma.StoreItemCreateInput[] = effectAwards.map(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ applyEffect, ...rest }) => rest,
)

/**
 * Randomly replace characters in a string using a replacer function
 */
function randomReplaceCharacters(
  str: string,
  replacer: (char: string) => string,
  chance = 0.1,
) {
  return str
    .split('')
    .map((char) => (Math.random() < chance ? replacer(char) : char))
    .join('')
}

/**
 * @param min Inclusive
 * @param max Inclusive
 * @returns Randomly generated integer between min and max
 */
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
