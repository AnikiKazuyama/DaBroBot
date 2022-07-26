import dotenv from 'dotenv';
dotenv.config();

import { Telegraf, Markup } from 'telegraf'
import { getUserInfo, login as loginReq, getEventListBySearch } from './requests.js';
import jwt_decode from 'jwt-decode';

const bot = new Telegraf(process.env.BOT_TOKEN);

const usersInfo = { };

bot.start((ctx) => {
  ctx.reply(`Для начала работы вам необходимо авторизоваться`);
});

bot.command('login', async (ctx) => {
  const getCredentials = (text) => ctx.update.message.text.split(' ');

  const [_, login, password] = getCredentials();

  if (login === undefined || login.length === 0) {
    ctx.reply('Введите логин и пароль через пробел');
    return;
  }

  if (password === undefined) {
    ctx.reply('Введите пароль');
    return;
  }

  ctx.reply('Логигнимся');
  
  try {
    const { data } = await loginReq(login, password);
    const token = data.meta.token;
    const decodedToken = jwt_decode(token);

    const userInfoResponse = await getUserInfo(token, JSON.parse(decodedToken.sub).number);
    const userNumber = userInfoResponse.data.result.number;

    usersInfo[ctx.message.from.id] = {
      token,
      number: userNumber
    };

  } catch(e) {
    console.log(e);
    console.error(e.response);
    ctx.reply('Произошла ошибка авторизации');
    return;
  }

  ctx.reply('Успешно залогинен');
});

bot.command('makeBet', async (ctx) => {
  
  const [_, search] = ctx.update.message.text.split('/makeBet ');
  const {data} = await getEventListBySearch(search);
  console.log(search)

  const result = data.result[0];
  console.log(data)
  const event = result.events[0];
  if(event) {
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
    Markup.inlineKeyboard([[ Markup.button.callback('One', '1') ]])
  )
}
)

bot.on('inline_query', ({inlineQuery, telegram}) => {
  telegram.answerInlineQuery(inlineQuery.id, `Some result ${inlineQuery.query}`);
});

bot.action(/^makeBet_(\d+)\-(\d+)/, (ctx) => {
  console.log(ctx.match[1]);
  console.log(ctx.match[2]);
});

bot.launch();
