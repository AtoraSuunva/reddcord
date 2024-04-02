import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  ComponentType,
  Message,
  StringSelectMenuBuilder,
} from 'discord.js'
import { SleetSlashCommand, inGuildGuard } from 'sleetcord'
import { prisma } from '../util/db.js'
import { plural } from '../util/format.js'
import { THREE_MINUTES, getUserVoteBalance } from './utils.js'

export const store = new SleetSlashCommand(
  {
    name: 'store',
    description: 'View the store',
    dm_permission: false,
  },
  {
    run: runStore,
  },
)

async function runStore(interaction: ChatInputCommandInteraction) {
  inGuildGuard(interaction)

  await interaction.deferReply({
    ephemeral: true,
  })

  // Check if the user is registered
  const user = await prisma.user.findFirst({
    where: {
      discordId: interaction.user.id,
    },
  })

  if (!user) {
    await interaction.editReply(
      'You must be registered to use the store! Use `/register` to register!',
    )
    return
  }

  // Get the user's balance

  const balance = await getUserVoteBalance(interaction.user.id)

  // Get the store items
  const storeItems = await prisma.storeItem.findMany({
    orderBy: {
      id: 'asc',
    },
    take: 25,
  })

  const purchaseSelect = new StringSelectMenuBuilder()
    .setCustomId('purchase')
    .addOptions(
      storeItems.map((item) => ({
        emoji: item.emoji,
        label: item.name,
        description: item.description,
        value: item.id.toString(),
      })),
    )
    .setPlaceholder('Select an item to purchase')
  const purchaseRow =
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      purchaseSelect,
    )

  const responseMessage = await interaction.editReply({
    content: userBalanceFormat(balance),
    embeds: [
      {
        title: 'Store',
        description: storeItems
          .map(
            (item) =>
              `${item.emoji} **${item.name}**: ${item.description} - ${plural(item.currency, item.price)}`,
          )
          .join('\n'),
      },
    ],
    components: [purchaseRow],
  })

  // Wait for user to select an option
  await waitForSelect(interaction, responseMessage)
}

async function waitForSelect(
  interaction: ChatInputCommandInteraction,
  message: Message,
) {
  let purchaseInteraction

  try {
    purchaseInteraction = await message.awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      time: THREE_MINUTES,
    })
  } catch (e) {
    await interaction.editReply({
      content: 'Store purchase timed out',
      components: [],
    })
    return
  }

  // Get user balance again
  const updatedBalance = await getUserVoteBalance(interaction.user.id)

  // Get the item the user selected
  const selectedItem = await prisma.storeItem.findUnique({
    where: {
      id: parseInt(purchaseInteraction.values[0]),
    },
  })

  if (!selectedItem) {
    await purchaseInteraction.update('Invalid store item selected')
    return waitForSelect(interaction, message)
  }

  if (interaction.user.id !== process.env.MOD_ABUSE) {
    // Check if the user has enough balance
    if (
      selectedItem.currency === 'upvote' &&
      updatedBalance.upvotes < selectedItem.price
    ) {
      await purchaseInteraction.update(
        `You do not have enough upvotes to purchase this item. (Missing **${updatedBalance.upvotes - selectedItem.price}**!)\n${userBalanceFormat(updatedBalance)}`,
      )
      return waitForSelect(interaction, message)
    }

    if (
      selectedItem.currency === 'downvote' &&
      updatedBalance.downvotes < selectedItem.price
    ) {
      await purchaseInteraction.update(
        `You do not have enough downvotes to purchase this item. (Missing **${updatedBalance.downvotes - selectedItem.price}**!)\n${userBalanceFormat(updatedBalance)}}`,
      )
      return waitForSelect(interaction, message)
    }
  }

  // Create the purchase
  await prisma.storePurchase.create({
    data: {
      userId: interaction.user.id,
      currency: selectedItem.currency,
      price: selectedItem.price,
      itemId: selectedItem.id,
      consumed: false,
    },
  })

  // Update the user's balance
  const reUpdatedBalance = await getUserVoteBalance(interaction.user.id)

  await purchaseInteraction.update({
    content: `You have successfully purchased ${selectedItem.name}!\n${userBalanceFormat(reUpdatedBalance)}`,
  })

  return waitForSelect(interaction, message)
}

function userBalanceFormat(balance: { upvotes: number; downvotes: number }) {
  return `You have:\n- ${plural('upvote', balance.upvotes)}\n- ${plural('downvote', balance.downvotes)}`
}
