import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  Attachment,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  Interaction,
  StringSelectMenuBuilder,
} from 'discord.js'
import {
  SleetSlashCommand,
  formatUser,
  getGuild,
  inGuildGuard,
} from 'sleetcord'
import { baseLogger } from 'sleetcord-common'
import { prisma } from '../util/db.js'
import { effectAwards } from './awards.js'
import {
  PostFullInfo,
  THREE_MINUTES,
  countAndSortByOccurrences,
  getGuildConfig,
  getPostFullInfo,
  getReddcordUser,
  getUserOwnedAwards,
} from './utils.js'

const BUTTON_UPVOTE = 'post_upvote'
const BUTTON_DOWNVOTE = 'post_downvote'
const BUTTON_AWARD = 'post_award'

const BUTTON_DELETE = 'post_delete'
const BUTTON_BLOCK = 'post_block'

export const post = new SleetSlashCommand(
  {
    name: 'post',
    description: 'Create a new post!',
    options: [
      {
        name: 'title',
        description: 'The title of the post',
        type: ApplicationCommandOptionType.String,
        required: true,
        max_length: 256,
      },
      {
        name: 'content',
        description: 'The content of the post',
        type: ApplicationCommandOptionType.String,
        max_length: 4096,
      },
      {
        name: 'image',
        description: 'The image of the post',
        type: ApplicationCommandOptionType.Attachment,
      },
    ],
    dm_permission: false,
  },
  {
    run: runPost,
    interactionCreate: handleInteractionCreate,
  },
)

async function runPost(interaction: ChatInputCommandInteraction) {
  inGuildGuard(interaction)

  await interaction.deferReply({
    ephemeral: true,
  })

  const reddcordUser = await getReddcordUser(interaction.user)

  if (!reddcordUser) {
    await interaction.editReply({
      content:
        'You must register an account before you can create a post! Use `/register` to register an account.',
    })
    return
  }

  if (reddcordUser.blocked) {
    await interaction.editReply({
      content: 'Mods have blocked you from creating new posts!',
    })
    return
  }

  const title = interaction.options.getString('title', true)
  const content = interaction.options.getString('content')
  const image = interaction.options.getAttachment('image')

  try {
    await createPost(interaction, {
      username: reddcordUser.username,
      title,
      content,
      image,
    })
  } catch (error) {
    baseLogger.error(error, 'Error creating post!')
    await interaction.editReply({
      content: 'An error occurred while creating the post! Try again later!',
    })
  }
}

interface Post {
  username: string
  title: string
  content?: string | null
  image?: Attachment | null
}

async function createPost(
  interaction: ChatInputCommandInteraction<'cached' | 'raw'>,
  post: Post,
) {
  // Get the guild config
  const guildConfig = await getGuildConfig(interaction.guildId)

  if (!guildConfig) {
    await interaction.editReply({
      content:
        'This guild does not have a Reddcord configuration set up. Someone has to set it up first!',
    })
    return
  }

  // Create the post
  const createdPost = await prisma.post.create({
    data: {
      authorId: interaction.user.id,
      authorUsername: post.username,
      title: post.title,
      content: post.content ?? null,
      image: post.image?.url ?? null,
    },
  })

  const fullPost = await getPostFullInfo(createdPost.id)

  if (!fullPost) {
    await interaction.editReply({
      content: 'An error occurred while creating the post! Try again later!',
    })
    return
  }

  // Then send it
  const guild = await getGuild(interaction, true)
  const postChannel = guild.channels.cache.get(guildConfig.postChannel)
  const logChannel = guild.channels.cache.get(guildConfig.logChannel)

  const embeds = formatPost(fullPost)

  const deleteButton = new ButtonBuilder()
    .setCustomId(`${BUTTON_DELETE}:${createdPost.id}`)
    .setLabel('Delete Post')
    .setStyle(ButtonStyle.Danger)
  const blockButton = new ButtonBuilder()
    .setCustomId(`${BUTTON_BLOCK}:${createdPost.id}`)
    .setLabel('Block User')
    .setStyle(ButtonStyle.Danger)
  const moderationRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    deleteButton,
    blockButton,
  )

  if (logChannel?.isTextBased()) {
    await logChannel.send({
      content: `New post by ${formatUser(interaction.user)}!`,
      embeds,
      components: [moderationRow],
    })
  }

  const upvoteButton = new ButtonBuilder()
    .setCustomId(`${BUTTON_UPVOTE}:${createdPost.id}`)
    .setLabel('Upvote')
    .setStyle(ButtonStyle.Success)
  const downvoteButton = new ButtonBuilder()
    .setCustomId(`${BUTTON_DOWNVOTE}:${createdPost.id}`)
    .setLabel('Downvote')
    .setStyle(ButtonStyle.Danger)
  const awardButton = new ButtonBuilder()
    .setCustomId(`${BUTTON_AWARD}:${createdPost.id}`)
    .setLabel('Give Award')
    .setStyle(ButtonStyle.Primary)
  const postRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    upvoteButton,
    downvoteButton,
    awardButton,
  )

  if (postChannel?.isTextBased()) {
    const message = await postChannel.send({
      embeds,
      components: [postRow],
    })

    await prisma.post.update({
      where: {
        id: createdPost.id,
      },
      data: {
        channelId: postChannel.id,
        messageId: message.id,
      },
    })

    await interaction.editReply({
      content: 'Post created successfully!',
    })
  } else {
    await interaction.editReply({
      content: 'Post created successfully, but failed to send the message!',
    })
  }
}

const FAKE_URL = 'https://suplex.me/dummy-link'

function formatPost(post: PostFullInfo): EmbedBuilder[] {
  // For each award, apply the effect
  let postCopy = structuredClone(post)

  for (const award of postCopy.awards) {
    const effect = effectAwards.find((a) => a.name === award.award.name)

    if (effect) {
      postCopy = effect.applyEffect(postCopy, award.user)
    }
  }

  const embed = new EmbedBuilder()
    .setURL(FAKE_URL)
    .setAuthor({
      name: postCopy.author.username,
    })
    .setTitle(postCopy.title)

  if (postCopy.content) {
    embed.setDescription(postCopy.content.slice(0, 2048))
  }

  if (postCopy.image) {
    embed.setImage(postCopy.image)
  }

  embed.addFields([
    {
      name: 'Votes',
      value: `\`▲ ${postCopy.countedVotes.upvotes} • ▼ ${postCopy.countedVotes.downvotes}\``,
      inline: true,
    },
  ])

  if (postCopy.awards.length > 0) {
    embed.addFields([
      {
        name: 'Awards',
        value: countAndSortByOccurrences(postCopy.awards, (a) => a.award.name)
          .map(
            ({ count, item: { award } }) =>
              `${award.emoji} ${award.name}${count > 1 ? ` x${count}` : ''}`,
          )
          .join('\n'),
        inline: true,
      },
    ])
  }

  const embeds = [embed]

  if (postCopy.addedImages.length > 0) {
    let addedImages = postCopy.image ? 1 : 0

    for (const image of postCopy.addedImages) {
      if (!embed.data.image) {
        embed.setImage(`${image}${image.endsWith('=') ? addedImages : ''}`)
      } else {
        embeds.push(
          new EmbedBuilder()
            .setURL(FAKE_URL)
            .setImage(`${image}${image.endsWith('=') ? addedImages : ''}`),
        )
      }

      if (++addedImages >= 4) break
    }
  }

  return embeds
}

// Buttons!

async function handleInteractionCreate(interaction: Interaction) {
  if (interaction.isButton() && interaction.customId.startsWith('post_')) {
    await handleButton(interaction)
  }
}

async function handleButton(interaction: ButtonInteraction) {
  const [type, postIdString] = interaction.customId.split(':')
  const postId = parseInt(postIdString, 10)

  switch (type) {
    case BUTTON_UPVOTE:
      await handleVote(interaction, postId, 1)
      break
    case BUTTON_DOWNVOTE:
      await handleVote(interaction, postId, -1)
      break
    case BUTTON_AWARD:
      await handleAward(interaction, postId)
      break
    case BUTTON_DELETE:
      await handleDelete(interaction, postId)
      break
    case BUTTON_BLOCK:
      await handleBlock(interaction, postId)
      break
  }
}

async function handleVote(
  interaction: ButtonInteraction,
  postId: number,
  vote: number,
) {
  const reddcordUser = await getReddcordUser(interaction.user)

  if (!reddcordUser) {
    await interaction.reply({
      content:
        'You must register an account before you can vote on posts! Use `/register` to register an account.',
      ephemeral: true,
    })
    return
  }

  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
  })

  if (!post) {
    await interaction.reply({
      content: 'This post does not exist!',
      ephemeral: true,
    })
    return
  }

  await prisma.postVote.upsert({
    create: {
      postId: postId,
      userId: interaction.user.id,
      value: vote,
    },
    update: {
      value: vote,
    },
    where: {
      postId_userId: {
        postId,
        userId: interaction.user.id,
      },
    },
  })

  const fullPost = await getPostFullInfo(postId)

  if (!fullPost) {
    await interaction.reply({
      content: 'An error occurred while voting on the post!',
      ephemeral: true,
    })
    return
  }

  const embeds = formatPost(fullPost)

  await interaction.update({
    embeds,
  })
}

async function handleAward(interaction: ButtonInteraction, postId: number) {
  // Check if the user is blocked
  const reddcordUser = await getReddcordUser(interaction.user)

  if (!reddcordUser) {
    await interaction.reply({
      content:
        'You must register an account before you can give posts awards! Use `/register` to register an account.',
      ephemeral: true,
    })
    return
  }

  if (reddcordUser.blocked) {
    await interaction.reply({
      content: 'You have been blocked from giving posts awards!.',
      ephemeral: true,
    })
    return
  }

  // Get the awards the user owns
  const purchasedAwards = await getUserOwnedAwards(interaction.user.id)

  if (purchasedAwards.length === 0) {
    await interaction.reply({
      content: 'You do not own any unspent awards!',
      ephemeral: true,
    })
    return
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId(`award_select:${postId}`)
    .addOptions(
      purchasedAwards.slice(0, 25).map((a) => ({
        emoji: a.item.emoji,
        label: a.item.name,
        description: a.item.description.slice(0, 50),
        value: a.id.toString(),
      })),
    )
    .setPlaceholder('Select an award to give')

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    select,
  )

  const selectMessage = await interaction.reply({
    content: 'Select an award to give this post:',
    components: [row],
    ephemeral: true,
    fetchReply: true,
  })

  let component

  try {
    component = await selectMessage.awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      time: THREE_MINUTES,
    })
  } catch (error) {
    await selectMessage.edit({
      content: 'You took too long to select an award!',
      components: [],
    })
    return
  }

  await component.deferUpdate()

  const purchaseId = parseInt(component.values[0], 10)
  const awardPurchase = purchasedAwards.find((a) => a.id === purchaseId)

  if (!awardPurchase) {
    await component.editReply({
      content: 'Invalid award selected!',
      components: [],
    })
    return
  }

  // Award the post
  await prisma.$transaction([
    prisma.postAward.create({
      data: {
        postId,
        awardId: awardPurchase.item.id,
        userId: interaction.user.id,
      },
    }),
    prisma.storePurchase.update({
      where: {
        id: purchaseId,
      },
      data: {
        consumed: true,
      },
    }),
  ])

  // Update post
  const fullPost = await getPostFullInfo(postId)
  if (!fullPost) {
    await component.editReply({
      content: 'An error occurred while awarding the post!',
      components: [],
    })
    return
  }

  const embeds = formatPost(fullPost)

  await interaction.message.edit({
    embeds,
  })

  await component.editReply({
    content: 'Award given successfully!',
    components: [],
  })
}

async function handleDelete(interaction: ButtonInteraction, postId: number) {
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
  })

  if (!post) {
    await interaction.reply({
      content: 'This post does not exist!',
      ephemeral: true,
    })
    return
  }

  await prisma.post.delete({
    where: {
      id: postId,
    },
  })

  if (!post.channelId || !post.messageId) {
    await interaction.reply({
      content: 'Post deleted successfully, but failed to delete the message!',
    })
    return
  }

  const guild = await getGuild(interaction, true)
  const postChannel = guild.channels.cache.get(post.channelId)
  if (postChannel?.isTextBased()) {
    await postChannel.messages.delete(post.messageId)
  }

  await interaction.message.edit({
    components: [],
  })

  await interaction.reply({
    content: 'Post deleted successfully!',
  })
}

async function handleBlock(interaction: ButtonInteraction, postId: number) {
  // Get the user from the post and then set them blocked
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
    include: {
      author: true,
    },
  })

  if (!post) {
    await interaction.reply({
      content: 'This post does not exist!',
      ephemeral: true,
    })
    return
  }

  if (post.author.blocked) {
    await interaction.reply({
      content: 'This user is already blocked!',
      ephemeral: true,
    })
    return
  }

  await prisma.user.update({
    where: {
      discordId: post.authorId,
    },
    data: {
      blocked: true,
    },
  })

  await interaction.reply({
    content: `User blocked successfully by ${formatUser(interaction.user)}!`,
  })
}
