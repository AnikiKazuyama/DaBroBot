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


/*
bot.command('makeBet', async (ctx) => {

  const [_, search] = ctx.update.message.text.split('/makeBet ');
  const { data } = await getEventListBySearch(search);
  console.log(search)

  const result = data.result[0];
  console.log(data)
  const event = result.events[0];
  if (event) {
    const outcomesTupel = event.outcomes;

    const winLeftOutcome = Object.values(outcomesTupel).find((outcome) => outcome.outcomeKey === '_1');
    const drawOutcome = Object.values(outcomesTupel).find((outcome) => outcome.outcomeKey === 'x');
    const winRightOutcome = Object.values(outcomesTupel).find((outcome) => outcome.outcomeKey === '_2');

    ctx.reply(
      'Выберите ставку',
      Markup.inlineKeyboard([[
        Markup.button.callback('Победа левых', `makeBet_${winLeftOutcome.id}-${winLeftOutcome.facId}`),
        Markup.button.callback('Ничья', `makeBet_${drawOutcome.id}-${drawOutcome.facId}`),
        Markup.button.callback('Победа правых', `makeBet_{winRightOutcome.id}-${winRightOutcome.facId}`)
      ]])
    )
  }
});

bot.command('btn', (ctx) => {
  return ctx.reply('random example',
    Markup.inlineKeyboard([[Markup.button.callback('One', '1')]])
  )
}
)
*/

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