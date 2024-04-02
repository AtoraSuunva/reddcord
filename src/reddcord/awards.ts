import { Prisma } from '@prisma/client'
import { hyperlink } from 'discord.js'
import { emojify } from 'emojify-lyrics'
import owoifyDefault from 'owoify-js'
import { escapeAllMarkdown } from 'sleetcord'
import thesaurus from 'word-thesaurus'
import { PostFullInfo } from './utils.js'

const owoify = owoifyDefault.default

type AwardWithEffect = Prisma.StoreItemCreateInput & {
  applyEffect(
    postInfo: PostFullInfo,
    giver: Prisma.UserGetPayload<true>,
  ): PostFullInfo
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
        content: `${postInfo.content}\n### Edit: Thanks for the gold kind stranger!`,
      }
    },
  },
  {
    type: 'award',
    name: 'Silver',
    emoji: '🥈',
    description: 'When a post is OK. Adds ✨sparkles✨~.',
    price: 5,
    currency: 'upvote',
    applyEffect(postInfo) {
      return {
        ...postInfo,
        title: randomReplaceWords(
          postInfo.title,
          (char) => `✨${char}✨~`,
          0.05,
        ),
        content: randomReplaceWords(
          postInfo.content ?? '',
          (char) => `✨${char}✨~`,
          0.025,
        ),
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
        title: randomReplaceCharacters(
          postInfo.title,
          (char) =>
            `${char}\u{034F}${String.fromCodePoint(0x0300 + randomInt(0, 0x4e))}`,
          0.05,
        ),
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
        addedImages: [
          ...postInfo.addedImages,
          'https://cathedral.org/wp-content/uploads/2022/10/HM-The-Queen-26-November-2001-scaled-1-740x494.jpg?var=',
        ],
      }
    },
  },
  {
    type: 'award',
    name: 'Thesaurize',
    emoji: '📚',
    description: 'Increase post fanciness by using synonyms randomly',
    price: 5,
    currency: 'upvote',
    applyEffect(postInfo) {
      return {
        ...postInfo,
        title: randomReplaceWords(
          postInfo.title,
          (word) => {
            const synonyms = thesaurus.find(word)
            if (synonyms.length > 0) {
              return pickRandom(pickRandom(synonyms).raw)
            } else {
              return word
            }
          },
          0.2,
        ),
        content: randomReplaceWords(
          postInfo.content ?? '',
          (word) => {
            const synonyms = thesaurus.find(word)
            if (synonyms.length > 0) {
              return pickRandom(pickRandom(synonyms).raw)
            } else {
              return word
            }
          },
          0.1,
        ),
      }
    },
  },
  {
    type: 'award',
    name: 'Verify TRUE',
    emoji: '✅',
    description: 'Verify the post is TRUE',
    price: 10,
    currency: 'upvote',
    applyEffect(postInfo) {
      return {
        ...postInfo,
        title: '[✅ TRUE] ' + postInfo.title,
        addedImages: [
          ...postInfo.addedImages,
          'https://media.discordapp.net/stickers/1224516034287898744.jpeg?size=1024&var=',
        ],
      }
    },
  },
  {
    type: 'award',
    name: 'YELLING',
    emoji: '🗣️',
    description: 'MAKES THE POST MORE NOTICEABLE BY YELLING.',
    price: 7,
    currency: 'upvote',
    applyEffect(postInfo) {
      return {
        ...postInfo,
        title: postInfo.title.toUpperCase(),
        content: '## ' + (postInfo.content?.toUpperCase() ?? ''),
      }
    },
  },
  {
    type: 'award',
    name: 'Sponsor',
    emoji: '💸',
    description: 'Put your username right on the post!',
    price: 10,
    currency: 'upvote',
    applyEffect(postInfo, giver) {
      return {
        ...postInfo,
        title: '[SPONSOR] ' + postInfo.title,
        content: `### The following sponsored by ${giver.username}:\n\n${postInfo.content}`,
      }
    },
  },
  {
    type: 'award',
    name: 'Screenshot',
    emoji: '📸',
    description: 'Watermarks the post.',
    price: 5,
    currency: 'upvote',
    applyEffect(postInfo) {
      return {
        ...postInfo,
        addedImages: [
          ...postInfo.addedImages,
          'https://cdn.discordapp.com/attachments/211956704798048256/1224523036040892436/fhya91kpt0r81.jpg?ex=661dccf2&is=660b57f2&hm=f75405f915134f01b46380631a17b2a0b8f7f89fe185a2beb80708dc74e25c8c&var=',
        ],
      }
    },
  },

  // Downvotes
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
        title: emojify(postInfo.title),
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
            hyperlink(
              escapeAllMarkdown(word),
              `https://www.amazon.co.uk/s?field-keywords=${encodeURIComponent(word)}`,
            ),
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
        title:
          '* ' +
          postInfo.title
            .toLowerCase()
            .replaceAll(/,.!?/g, '')
            .split('\n')
            .join('.\n* ') +
          '.',
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
        title: postInfo.title
          .replace(/r/g, 'rrr')
          .replace(/R/g, 'RRR')
          .replace(/l/g, 'r')
          .replace(/L/g, 'R')
          .replace(/you/g, 'ye')
          .replace(/You/g, 'Ye')
          .replace(/your/g, 'yer')
          .replace(/Your/g, 'Yer')
          .replace(/ing/g, "in'"),
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
        title: randomReplaceWords(
          postInfo.title,
          (word) =>
            word
              .split('')
              .map((char) => (char === ' ' ? ' ' : '█'))
              .join(''),
          0.1,
        ),
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
  {
    type: 'award',
    name: 'Verify FALSE',
    emoji: '❌',
    description: 'Verify the post is FALSE',
    price: 10,
    currency: 'downvote',
    applyEffect(postInfo) {
      return {
        ...postInfo,
        title: '[❌ FALSE] ' + postInfo.title,
        addedImages: [
          ...postInfo.addedImages,
          'https://media.discordapp.net/stickers/1224515950666059846.jpeg?size=1024&var=',
        ],
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

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
