import { SleetModule } from 'sleetcord'
import { reddConfig } from './config.js'
import { manage_block } from './manage_block.js'
import { post } from './post.js'
import { register } from './register.js'
import { store } from './store.js'

export const reddModules: SleetModule[] = [
  reddConfig,
  manage_block,
  post,
  register,
  store,
]
