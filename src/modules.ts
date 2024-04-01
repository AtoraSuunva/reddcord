import { SleetModule } from 'sleetcord'
import { logging } from 'sleetcord-common'
import { reddActivity } from './misc/activity.js'
import { reddModules } from './reddcord/index.js'

export const modules: SleetModule[] = [logging, reddActivity, ...reddModules]
