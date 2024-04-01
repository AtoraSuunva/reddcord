import { Prisma } from '@prisma/client'
import { emojify } from 'emojify-lyrics'
import owoifyDefault from 'owoify-js'
import { PostFullInfo } from './utils.js'

const owoify = owoifyDefault.default

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
  {
    type: 'award',
    name: 'The Queen',
    emoji: '👑',
    description: 'Adds the queen to the post.',
    price: 15,
    currency: 'upvote',
    applyEffect(postInfo) {
      return {
        ...postInfo,
        image:
          'https://cathedral.org/wp-content/uploads/2022/10/HM-The-Queen-26-November-2001-scaled-1-740x494.jpg',
      }
    },
  },
  // Positive effect
  {
    type: 'award',
    name: 'Shiny',
    emoji: '✨',
    description: 'Add some sparkle to the post.',
    price: 5,
    currency: 'upvote',
    applyEffect(postInfo) {
      return {
        ...postInfo,
        content: randomReplaceWords(
          postInfo.content ?? '',
          (word) => `✨${word}✨`,
          0.1,
        ),
      }
    },
  },
  // Downvotes
  {
    type: 'award',
    name: 'YELLING',
    emoji: '🗣️',
    description: 'TURNS A POST FULLY INTO UPPERCASE LETTERS.',
    price: 5,
    currency: 'downvote',
    applyEffect(postInfo) {
      return {
        ...postInfo,
        title: postInfo.title.toUpperCase(),
        content: postInfo.content?.toUpperCase() ?? '',
      }
    },
  },
  {
    type: 'award',
    name: 'owoify',
    emoji: '🦉',
    description: 'owoify the post. You know what that means.',
    price: 5,
    currency: 'downvote',
    applyEffect(postInfo) {
      return {
        ...postInfo,
        title: owoify(postInfo.title),
        content: owoify(postInfo.content ?? ''),
      }
    },
  },
  {
    type: 'award',
    name: 'uwuify',
    emoji: '🦄',
    description: 'uwuify the post. Even worse than owoify.',
    price: 10,
    currency: 'downvote',
    applyEffect(postInfo) {
      return {
        ...postInfo,
        title: owoify(postInfo.title, 'uwu'),
        content: owoify(postInfo.content ?? '', 'uwu'),
      }
    },
  },
  {
    type: 'award',
    name: 'Emojify',
    emoji: '😂',
    description: 'Adds relevant emojis to make the post 96% more hip',
    price: 5,
    currency: 'downvote',
    applyEffect(postInfo) {
      return {
        ...postInfo,
        content: emojify(postInfo.content ?? ''),
      }
    },
  },
  {
    type: 'award',
    name: 'Spongebob',
    emoji: '🧽',
    description: 'MaKe CaSiNg aLtErNaTe!',
    price: 15,
    currency: 'downvote',
    applyEffect(postInfo) {
      return {
        ...postInfo,
        title: randomReplaceCharacters(
          postInfo.title,
          (char, i) => (i % 2 ? char.toUpperCase() : char),
          1,
        ),
        content: randomReplaceCharacters(
          postInfo.content ?? '',
          (char, i) => (i % 2 ? char.toUpperCase() : char),
          1,
        ),
      }
    },
  },
  {
    type: 'award',
    name: 'Affiliate',
    emoji: '💰',
    description: 'Add "affiliate links" to the post.',
    price: 3,
    currency: 'downvote',
    applyEffect(postInfo) {
      return {
        ...postInfo,
        content: randomReplaceWords(
          postInfo.content ?? '',
          (word) =>
            `[${word}](https://www.amazon.co.uk/s?field-keywords=${encodeURIComponent(word)})`,
          0.1,
        ),
      }
    },
  },
  {
    type: 'award',
    name: 'sans',
    emoji: '💀',
    description: "* make the post like sans' dialog.",
    price: 3,
    currency: 'downvote',
    applyEffect(postInfo) {
      return {
        ...postInfo,
        content:
          '* ' +
          (postInfo.content
            ?.toLowerCase()
            .replaceAll(/,.!?/g, '')
            .split('\n')
            .join('.\n* ') ?? '') +
          '.',
      }
    },
  },
  {
    type: 'award',
    name: 'Pirate',
    emoji: '☠️',
    description: 'Turn the post into pirate speak.',
    price: 5,
    currency: 'downvote',
    applyEffect(postInfo) {
      return {
        ...postInfo,
        content:
          postInfo.content
            ?.replace(/r/g, 'rrr')
            .replace(/R/g, 'RRR')
            .replace(/l/g, 'r')
            .replace(/L/g, 'R')
            .replace(/you/g, 'ye')
            .replace(/You/g, 'Ye')
            .replace(/your/g, 'yer')
            .replace(/Your/g, 'Yer')
            .replace(/ing/g, "in'") ?? '',
      }
    },
  },
  {
    type: 'award',
    name: 'Censor',
    emoji: '🤬',
    description: 'Censor random words in the post.',
    price: 5,
    currency: 'downvote',
    applyEffect(postInfo) {
      return {
        ...postInfo,
        content: randomReplaceWords(
          postInfo.content ?? '',
          (word) =>
            word
              .split('')
              .map((char) => (char === ' ' ? ' ' : '█'))
              .join(''),
          0.1,
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
  replacer: (char: string, index: number) => string,
  chance = 0.1,
) {
  return str
    .split('')
    .map((char, i) => (Math.random() < chance ? replacer(char, i) : char))
    .join('')
}

function randomReplaceWords(
  str: string,
  replacer: (word: string, index: number) => string,
  chance = 0.1,
) {
  return str
    .split(' ')
    .map((word, i) => (Math.random() < chance ? replacer(word, i) : word))
    .join(' ')
}

/**
 * @param min Inclusive
 * @param max Inclusive
 * @returns Randomly generated integer between min and max
 */
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
