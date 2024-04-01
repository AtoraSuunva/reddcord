import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
} from 'discord.js'
import { SleetSlashCommand } from 'sleetcord'
import { prisma } from '../util/db.js'
import { THREE_MINUTES } from './utils.js'

export const register = new SleetSlashCommand(
  {
    name: 'register',
    description: 'Register an account with Reddcord',
    dm_permission: false,
  },
  {
    run: runRegister,
  },
)

const ACCEPT_ID = 'accept'
const REROLL_ID = 'reroll'

async function runRegister(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({
    ephemeral: true,
  })

  await registerUser(interaction)
}

async function registerUser(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
) {
  const username = await randomUsername()

  const acceptButton = new ButtonBuilder()
    .setCustomId(ACCEPT_ID)
    .setLabel('Accept')
    .setStyle(ButtonStyle.Success)
  const rerollButton = new ButtonBuilder()
    .setCustomId(REROLL_ID)
    .setLabel('Reroll')
    .setStyle(ButtonStyle.Secondary)
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    acceptButton,
    rerollButton,
  )

  const message =
    interaction instanceof ButtonInteraction
      ? await interaction.update({
          content: `Your random username is **${username}**! Do you want to keep this or reroll it?\n(You can always reroll it later by re-registering.)`,
          components: [row],
          fetchReply: true,
        })
      : await interaction.editReply({
          content: `Your random username is **${username}**! Do you want to keep this or reroll it?\n(You can always reroll it later by re-registering.)`,
          components: [row],
        })

  let clickedButton: ButtonInteraction

  try {
    clickedButton = await message.awaitMessageComponent({
      componentType: ComponentType.Button,
      time: THREE_MINUTES,
    })
  } catch (err) {
    return interaction instanceof ButtonInteraction
      ? await interaction.update({
          content: 'Timed out. Try registering again.',
          components: [],
        })
      : await interaction.editReply({
          content: 'Timed out. Try registering again.',
          components: [],
        })
  }

  if (clickedButton.customId === ACCEPT_ID) {
    await prisma.user.upsert({
      create: {
        discordId: interaction.user.id,
        username,
      },
      update: {
        username,
      },
      where: {
        discordId: interaction.user.id,
      },
    })

    return await clickedButton.update({
      content: `Your username is now **${username}**! Now you're ready to post!`,
      components: [],
    })
  } else if (clickedButton.customId === REROLL_ID) {
    return registerUser(clickedButton)
  } else {
    return clickedButton.update({
      content: 'Invalid button clicked.',
      components: [],
    })
  }
}

async function randomUsername(): Promise<string> {
  // Pick 2 random adjectives + a random noun

  const adjCount = await prisma.usernamePart.count({
    where: {
      part: 'adjective',
    },
  })

  const adjectives = await Promise.all([
    prisma.usernamePart.findMany({
      select: {
        word: true,
      },
      take: 1,
      skip: Math.floor(Math.random() * adjCount),
      where: {
        part: 'adjective',
      },
    }),
    prisma.usernamePart.findMany({
      select: {
        word: true,
      },
      take: 1,
      skip: Math.floor(Math.random() * adjCount),
      where: {
        part: 'adjective',
      },
    }),
  ]).then((a) => a.map((adj) => capitalize(adj[0].word)))

  const nounCount = await prisma.usernamePart.count({
    where: {
      part: 'noun',
    },
  })

  const noun = await prisma.usernamePart
    .findMany({
      select: {
        word: true,
      },
      take: 1,
      skip: Math.floor(Math.random() * nounCount),
      where: {
        part: 'noun',
      },
    })
    .then((n) => n.map((n) => capitalize(n.word)))

  const newUsername = `${adjectives.join('')}${noun}`

  // Check if it's already taken
  const user = await prisma.user.findUnique({
    where: {
      username: newUsername,
    },
  })

  if (user) {
    return randomUsername()
  } else {
    return newUsername
  }
}

function capitalize(word: string): string {
  return word[0].toUpperCase() + word.slice(1)
}
