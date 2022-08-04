import dotenv from 'dotenv';
dotenv.config();

import { Telegraf, Markup } from 'telegraf'
import { login as loginReq, getEventListBySearch, makeBet, getBalance, getUserInfo } from './requests.js';
import jwt_decode from 'jwt-decode';
import sessionStorage from './sessionStorage.js';
import { decodeToken, getSubDataFromToken } from './token.js';
import { getUserFromId } from './helpers.js';

const bot = new Telegraf(process.env.BOT_TOKEN);

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

  ctx.reply('Логинимся');
  
  try {
    const { data } = await loginReq(login, password);
    
    const token = data.meta.token;
    const number = getSubDataFromToken(token);

    const [userInfoResponse, userBalanceResponse] = await Promise.all([getUserInfo(token, number), getBalance(token, number)]);

    sessionStorage.set(getUserFromId(ctx), {
      token,
      number,
      wallet: userBalanceResponse.data.result[0]
    });

    const userInfo = userInfoResponse.data.result;
    const walletInfo = userBalanceResponse.data.result[0];
    ctx.reply(`Здравствуйте, ${userInfo.firstName}, Ваш баланс: ${walletInfo.balanceLocalizedString}`);
  } catch(e) {
    console.log(e)
    ctx.reply('Произошла ошибка авторизации');
    return;
  }
});

bot.command('makeBet', async (ctx) => {
  const match = ctx.update.message.text.match(/\/makeBet (\D*)(\d+)(\D*)/);
  const search = match[1].trim();
  const amount = match[2].trim();

  const rightName = search.split('-')[0].trim();
  const leftName = search.split('-')[1].trim();

  try {
    const {data} = await getEventListBySearch(search);

    const result = data.result[0];

    if (result === undefined) {
      ctx.reply('События не найдены');
      return;
    }

    const event = result.events[0];
  
    if(event) {
      const outcomesTupel = event.outcomes;

      const winLeftOutcome = Object.values(outcomesTupel).find((outcome) => outcome.outcomeKey === '_1');
      const drawOutcome = Object.values(outcomesTupel).find((outcome) => outcome.outcomeKey === 'x');
      const winRightOutcome = Object.values(outcomesTupel).find((outcome) => outcome.outcomeKey === '_2');

      const buttons = drawOutcome ? [
        Markup.button.callback(`Победа ${leftName} ${winLeftOutcome.value}`, `makeBet_${winLeftOutcome.id}-${winLeftOutcome.facId}-${amount}`),
        Markup.button.callback(`Ничья ${drawOutcome.value}`, `makeBet_${drawOutcome.id}-${drawOutcome.facId}-${amount}`),
        Markup.button.callback(`Победа ${rightName} ${winRightOutcome.value}`, `makeBet_${winRightOutcome.id}-${winRightOutcome.facId}-${amount}`)
      ] : [
        Markup.button.callback(`Победа ${leftName} ${winLeftOutcome.value}`, `makeBet_${winLeftOutcome.id}-${winLeftOutcome.facId}-${amount}`),
        Markup.button.callback(`Победа ${rightName} ${winRightOutcome.value}`, `makeBet_${winRightOutcome.id}-${winRightOutcome.facId}-${amount}`)
      ]

      ctx.reply(
        'Выберите ставку',
        Markup.inlineKeyboard([ buttons ])
      )
    } else {
      ctx.reply('События не найдены')
    }
  } catch(e) {
    ctx.reply('Произошла ошибка поиска событий, возможно вашего события не существует')
    console.log(e);
  }
  
});

bot.action(/^makeBet_(\d+)\-(\d+)-(\d+)/, async (ctx) => {
  try{
    const response = await makeBet(ctx.update.callback_query.from.id, {
      amount: ctx.match[3],
      outcomeId: ctx.match[1],
      factorId: ctx.match[2]
    });

    ctx.reply('Вы успешно совершили ставку ');
  } catch(e) {
    console.log(e.response)
  }
});

bot.inlineQuery(/^$/, (ctx) => {
  ctx.answerInlineQuery([{
      type: 'article',
      id: 0,
      title: 'Введите команды и сумму для ставки',
      input_message_content: {
        message_text: `Вы не ввели команду и сумму, например:
        Факел - Ахмат 1000`
      }
    }
  ]);
});

bot.action('reject', (ctx) => {
  ctx.editMessageText("Ставка отменена")
})

bot.action(/^makeBetInline_(\d+)\-(\d+)-(\d+)/, async (ctx) => {
  try{
    const {data} = await makeBet(ctx.update.callback_query.from.id, {
      amount: ctx.match[3],
      outcomeId: ctx.match[1],
      factorId: ctx.match[2]
    });

    const errorMessage = data.result[0].errorMessage;
    if (errorMessage) {
      ctx.editMessageText(errorMessage);
      return;
    }

    ctx.editMessageText(`
      Вы успешно совершили ставку: можете посмотреть в приложении https://ft20-ligastavokru-crm-pay-lb-01.app-ses.com/tracking/${data.result[0].betId}
    `);
  } catch(e) {
    console.log(e)
    console.log(e.response)
  }
});

bot.inlineQuery(/(\D*)(\d+)(\D*)/, async (ctx) => {
  const search = ctx.match[1].trim();
  const amount = ctx.match[2].trim();

  const userId = ctx.update.inline_query.from.id;

  if (amount > sessionStorage.get(userId)?.wallet?.balance) {
    return ctx.answerInlineQuery([
      {
        type: 'article',
        id: 8,
        title: 'Недостаточно средств на балансе для совершения ставки',
        input_message_content: {
          message_text: `
          Ваш баланс: ${sessionStorage.get(userId)?.wallet?.balance}₽
Недостаточно средств для совершения пари на сумму: ${amount}₽
          `
        },
        cache_time: 1
      }
    ]);
  }

  const left = search.split('-')[0];
  const right = search.split('-')[1];

  if (!left || !right) {
    return ctx.answerInlineQuery([
      {
        type: 'article',
        id: 7,
        title: 'Неверный формат события',
        input_message_content: {
          message_text: 'Неверный формат события, скорее всего вы забыли "-" между названиями команд'
        },
        cache_time: 1
      }
    ]);
  }

  const rightName = right.trim();
  const leftName = left.trim();

  try {
    const {data} = await getEventListBySearch(search);

    const result = data.result[0];

    if (result === undefined) {
      ctx.answerInlineQuery([
        {
          type: 'article',
          id: 5,
          title: `Событие не найдено`,
          input_message_content: {
            message_text: 'Мы не смогли найти событие'
          },
          cache_time: 1
        }
      ]);

      return;
    }

    const event = result.events[0];

    const outcomesTupel = event.outcomes;

      const winLeftOutcome = Object.values(outcomesTupel).find((outcome) => outcome.outcomeKey === '_1');
      const drawOutcome = Object.values(outcomesTupel).find((outcome) => outcome.outcomeKey === 'x');
      const winRightOutcome = Object.values(outcomesTupel).find((outcome) => outcome.outcomeKey === '_2');

      ctx.answerInlineQuery([
        {
          type: 'article',
          id: 0,
          title: `Победа ${leftName} ${winLeftOutcome.value}`,
          cache_time: 1,
          input_message_content: {
            message_text: `Делаем ставку на победу ${leftName}: ${winLeftOutcome.value} на сумму ${amount}₽ ?`
          },
          reply_markup: {
            inline_keyboard: [[
              {text: 'Сделать ставку', callback_data: `makeBetInline_${winLeftOutcome.id}-${winLeftOutcome.facId}-${amount}`},
              {text: 'Отменить', callback_data: 'reject'}
            ]]
          }
        },
        {
          type: 'article',
          id: 1,
          title: `Ничья ${drawOutcome.value}`,
          cache_time: 1,
          input_message_content: {
            message_text: `Делаем ставку на ничью ${leftName} - ${rightName}: ${drawOutcome.value}, на сумму ${amount}₽ ?`
          },
          reply_markup: {
            inline_keyboard: [[
              {text: 'Сделать ставку', callback_data: `makeBetInline_${drawOutcome.id}-${drawOutcome.facId}-${amount}`},
              {text: 'Отменить', callback_data: 'reject'}
            ]]
          }
        },
        {
          type: 'article',
          id: 2,
          title: `Победа ${rightName} ${winRightOutcome.value}`,
          cache_time: 1,
          input_message_content: {
            message_text: `Делаем ставку на победу ${rightName}: ${winRightOutcome.value}, на сумму ${amount}₽ ?`
          },
          reply_markup: {
            inline_keyboard: [[
              {text: 'Сделать ставку', callback_data: `makeBetInline_${winRightOutcome.id}-${winRightOutcome.facId}-${amount}`},
              {text: 'Отменить', callback_data: 'reject'}
            ]]
          }
        }
      ]);
} catch (e) {
  console.log(e.response);
}
});

bot.launch();
