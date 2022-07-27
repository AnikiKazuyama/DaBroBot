import dotenv from 'dotenv';
dotenv.config();

import { Telegraf, Markup } from 'telegraf';
import { getUserInfo, login as loginReq, getEventListBySearch } from './requests/requests.js';
import jwt_decode from 'jwt-decode';

import { log, errorHandler } from './helpers/index.js'
import { userMiddleware } from './middlewares/index.js'
import { startCommand } from './commands/index.js'
import { loginHandler, betHandler } from './handlers/index.js'

import LocalSession from 'telegraf-session-local';

const bot = new Telegraf(process.env.BOT_TOKEN);

const localSession = new LocalSession({
  storage: LocalSession.storageMemory
});

// property session
bot.use(localSession.middleware())

bot.start(startCommand());
bot.command('login', loginHandler());
bot.command('bet', betHandler());


bot.on('inline_query', ({ inlineQuery, telegram }) => {
  telegram.answerInlineQuery(inlineQuery.id, `Some result ${inlineQuery.query}`);
});

bot.action(/^bet:(\d+)\-(\d+)/, (ctx) => {
  console.log(ctx.match[1]);
  console.log(ctx.match[2]);
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))