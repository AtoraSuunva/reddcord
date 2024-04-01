import { ActivityType } from 'discord.js'
import { SleetModule } from 'sleetcord'

export const reddActivity = new SleetModule(
  {
    name: 'activity',
  },
  {
    ready: (client) => {
      client.user.setActivity({
        name: 'Thanks for the gold kind stranger!',
        type: ActivityType.Custom,
      })
    },
  },
)
