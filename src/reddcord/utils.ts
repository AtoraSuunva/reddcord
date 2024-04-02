import { Prisma } from '@prisma/client'
import { Guild, GuildMember, User } from 'discord.js'
import { prisma } from '../util/db.js'

export const THREE_MINUTES = 3 * 60 * 1000

export function getReddcordUser(discordUser: User | GuildMember) {
  return prisma.user.findFirst({
    where: {
      discordId: discordUser.id,
    },
  })
}

export function getGuildConfig(guild: Guild | string) {
  return prisma.config.findFirst({
    where: {
      guildId: typeof guild === 'string' ? guild : guild.id,
    },
  })
}

export type PostFullInfo = Prisma.PostGetPayload<{
  include: {
    author: true
    awards: {
      include: {
        award: true
        user: true
      }
    }
    votes: true
  }
}> & {
  countedVotes: {
    upvotes: number
    downvotes: number
  }
}

export async function getPostFullInfo(
  id: number,
): Promise<PostFullInfo | null> {
  const [upvotes, downvotes, postInfo] = await Promise.all([
    prisma.postVote.count({
      where: {
        postId: id,
        value: 1,
      },
    }),

    prisma.postVote.count({
      where: {
        postId: id,
        value: -1,
      },
    }),

    prisma.post.findUnique({
      where: {
        id,
      },
      include: {
        author: true,
        awards: {
          include: {
            award: true,
            user: true,
          },
        },
        votes: true,
      },
    }),
  ])

  if (!postInfo) {
    return null
  } else {
    return {
      ...postInfo,
      countedVotes: {
        upvotes,
        downvotes,
      },
    }
  }
}

export async function getUserOwnedAwards(userId: string, take = 25, skip = 0) {
  return prisma.storePurchase.findMany({
    where: {
      userId,
      consumed: false,
      item: {
        type: 'award',
      },
    },
    include: {
      item: true,
    },
    orderBy: {
      id: 'asc',
    },
    skip,
    take,
    distinct: 'itemId',
  })
}

export async function getUserVoteBalance(
  userId: string,
): Promise<{ upvotes: number; downvotes: number }> {
  const earnedUpvotes = await prisma.postVote.count({
    where: {
      post: {
        authorId: userId,
      },
      value: 1,
    },
  })

  const earnedDownvotes = await prisma.postVote.count({
    where: {
      post: {
        authorId: userId,
      },
      value: -1,
    },
  })

  // Count spending

  const spentUpvotes = await prisma.storePurchase.groupBy({
    by: 'userId',
    _sum: {
      price: true,
    },
    where: {
      userId,
      currency: 'upvote',
    },
  })

  const spentDownvotes = await prisma.storePurchase.groupBy({
    by: 'userId',
    _sum: {
      price: true,
    },
    where: {
      userId,
      currency: 'downvote',
    },
  })

  return {
    upvotes: earnedUpvotes - (spentUpvotes[0]?._sum?.price ?? 0),
    downvotes: earnedDownvotes - (spentDownvotes[0]?._sum?.price ?? 0),
  }
}

export function countAndSortByOccurrences<T>(
  array: T[],
  getIdProp: (item: T) => unknown = (i) => i,
): {
  count: number
  item: T
}[] {
  const counts = new Map<unknown, { count: number; item: T }>()

  for (const item of array) {
    const id = getIdProp(item)
    const old = counts.get(id) ?? { count: 0, item }
    counts.set(id, {
      count: old.count + 1,
      item,
    })
  }

  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([, data]) => ({
      count: data.count,
      item: data.item,
    }))
}
