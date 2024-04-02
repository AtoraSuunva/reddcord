import { ApplicationCommandOptionType } from 'discord.js'
import { SleetSlashCommand } from 'sleetcord'
import { prisma } from '../util/db.js'

export const manage_block = new SleetSlashCommand(
  {
    name: 'manage_block',
    description: 'Block or unblock a user from using Reddcord',
    dm_permission: false,
    default_member_permissions: ['BanMembers'],
    options: [
      {
        name: 'user',
        description: 'The user to unblock',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: 'block',
        description: 'Block the user from posting onto Reddcord',
        type: ApplicationCommandOptionType.Boolean,
        required: true,
      },
    ],
  },
  {
    run: async (interaction) => {
      const user = interaction.options.getUser('user', true)
      const block = interaction.options.getBoolean('block', true)

      await interaction.deferReply()

      const reddcordUser = await prisma.user.findFirst({
        where: {
          discordId: user.id,
        },
      })

      if (!reddcordUser) {
        return interaction.editReply({
          content: "That user isn't registered with Reddcord!",
        })
      }

      if (reddcordUser.blocked === block) {
        return interaction.editReply({
          content: `That user is already ${block ? '' : 'un'}blocked!`,
        })
      }

      await prisma.user.update({
        where: {
          discordId: user.id,
        },
        data: {
          blocked: block,
        },
      })

      return await interaction.editReply({
        content: 'User unblocked!',
      })
    },
  },
)
