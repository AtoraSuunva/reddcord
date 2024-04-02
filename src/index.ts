import { GatewayIntentBits, Options, Partials, RESTOptions } from 'discord.js'
import env from 'env-var'
import { SleetClient } from 'sleetcord'
import { initDBLogging } from 'sleetcord-common'
import { modules } from './modules.js'
import { prisma } from './util/db.js'
import { seedDB } from './util/seedDB.js'

async function main() {
  const parts = await prisma.usernamePart.findFirst()

  if (!parts) {
    await seedDB()
  }

  const TOKEN = env.get('TOKEN').required().asString()
  const APPLICATION_ID = env.get('APPLICATION_ID').required().asString()

  initDBLogging(prisma)

  const sleetClient = new SleetClient({
    sleet: {
      token: TOKEN,
      applicationId: APPLICATION_ID,
    },
    client: {
      rest: {
        // I hate types sometimes, the native fetch works, but then plays bad with everything else
        // that involves streams
        makeRequest: fetch as unknown as RESTOptions['makeRequest'],
      },
      intents: [GatewayIntentBits.Guilds],
      partials: [Partials.Channel, Partials.GuildMember, Partials.User],
      makeCache: Options.cacheWithLimits({
        ...Options.DefaultMakeCacheSettings,
        AutoModerationRuleManager: 0,
        BaseGuildEmojiManager: 0,
        DMMessageManager: 0,
        GuildBanManager: 0,
        GuildEmojiManager: 0,
        GuildForumThreadManager: 0,
        GuildInviteManager: 0,
        GuildMemberManager: 0,
        GuildMessageManager: 0,
        GuildScheduledEventManager: 0,
        GuildStickerManager: 0,
        GuildTextThreadManager: 0,
        MessageManager: 0,
        PresenceManager: 0,
        ReactionManager: 0,
        ReactionUserManager: 0,
        StageInstanceManager: 0,
        ThreadManager: 0,
        ThreadMemberManager: 0,
        UserManager: 0,
        VoiceStateManager: 0,
      }),
    },
  })

  // TODO: some modules should be locked to, say, a dev guild only
  // `registerOnlyInGuilds` solves that, but we need a way to pass which guild(s) to the commands
  // `devGuild` option in sleet? `registerOnlyInGuilds: ['devGuild']`?
  sleetClient.addModules(modules)
  await sleetClient.putCommands()
  await sleetClient.login()
}

await main()
