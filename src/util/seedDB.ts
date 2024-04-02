import { Prisma } from '@prisma/client'
import fs from 'node:fs/promises'
import { dbAwards } from '../reddcord/awards.js'
import { prisma } from './db.js'

export async function seedDB() {
  // Add username parts

  const adjectives = await fs
    .readFile('./resources/adjectives.txt', 'utf-8')
    .then((a) => a.trim().split('\n'))
  const nouns = await fs
    .readFile('./resources/animals.txt', 'utf-8')
    .then((n) => n.trim().split('\n'))

  const createData: Prisma.UsernamePartCreateInput[] = [
    ...adjectives.map((word) => ({ word, part: 'adjective' })),
    ...nouns.map((word) => ({ word, part: 'noun' })),
  ]

  await prisma.$transaction(async (tx) => {
    await tx.usernamePart.deleteMany()

    for (const data of createData) {
      console.log(`Creating ${data.part} ${data.word}`)
      await tx.usernamePart.create({ data })
    }
  })

  // Add awards

  await prisma.$transaction(async (tx) => {
    for (const data of dbAwards) {
      console.log(`Creating award ${data.name}`)
      await tx.storeItem.upsert({
        where: { name: data.name },
        update: data,
        create: data,
      })
    }
  })

  await prisma.user.upsert({
    where: { discordId: '74768773940256768' },
    update: {},
    create: {
      discordId: '74768773940256768',
      username: 'DazzlingFullWyvern',
    },
  })

  console.log('Vacuuming...')
  await prisma.$queryRaw`VACUUM`
  console.log('Optimize')
  await prisma.$queryRaw`PRAGMA optimize`
}
