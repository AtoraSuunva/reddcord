import {
  ApplicationCommandOptionType,
  ChannelType,
  ChatInputCommandInteraction,
} from 'discord.js'
import { SleetSlashCommand, getTextBasedChannel, inGuildGuard } from 'sleetcord'
import { prisma } from '../util/db.js'
import { channelFormatter, formatConfig } from '../util/format.js'

export const reddConfig = new SleetSlashCommand(
  {
    name: 'config',
    description: 'Configure Reddcord',
    dm_permission: false,
    options: [
      {
        name: 'post_channel',
        description: 'The channel to send new posts in',
        type: ApplicationCommandOptionType.Channel,
        channel_types: [
          ChannelType.GuildText,
          ChannelType.AnnouncementThread,
          ChannelType.PublicThread,
          ChannelType.PrivateThread,
          ChannelType.GuildAnnouncement,
          ChannelType.GuildVoice,
        ],
      },
      {
        name: 'log_channel',
        description: 'The channel to log posts in with moderation buttons',
        type: ApplicationCommandOptionType.Channel,
        channel_types: [
          ChannelType.GuildText,
          ChannelType.AnnouncementThread,
          ChannelType.PublicThread,
          ChannelType.PrivateThread,
          ChannelType.GuildAnnouncement,
          ChannelType.GuildVoice,
        ],
      },
    ],
  },
  {
    run: runConfig,
  },
)

async function runConfig(interaction: ChatInputCommandInteraction) {
  inGuildGuard(interaction)

  await interaction.deferReply({
    ephemeral: true,
  })

  const postChannel = await getTextBasedChannel(
    interaction,
    'post_channel',
    true,
  )
  const logChannel = await getTextBasedChannel(interaction, 'log_channel', true)

  // Save the config
  const config = await prisma.config.upsert({
    create: {
      guildId: interaction.guildId,
      postChannel: postChannel.id,
      logChannel: logChannel.id,
    },
    update: {
      postChannel: postChannel.id,
      logChannel: logChannel.id,
    },
    where: {
      guildId: interaction.guildId,
    },
  })

  await interaction.editReply({
    content: `Updated config!\n${formatConfig({
      config,
      formatters: {
        logChannel: channelFormatter,
        postChannel: channelFormatter,
      },
    })}`,
  })
}
