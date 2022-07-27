import { getEventListBySearch } from './../requests/requests.js';
import { logError, echoError } from './../utils/logger.js';

function renderEventEntity(ctx, eventEntity = {}, context = {}) {
  const {
    team1 = null,
    team2 = null,
    gameDt = null,
    status = null,
    eventTitle = null,
    expired = false,
    tournamentTitle = null,
    categoryTitle = null,
  } = eventEntity;

  const { betSum } = context;

  const outcomes = eventEntity.outcomes;

  const winLeftOutcome = Object.values(outcomes).find((outcome) => outcome.outcomeKey === '_1');
  const drawOutcome = Object.values(outcomes).find((outcome) => outcome.outcomeKey === 'x');
  const winRightOutcome = Object.values(outcomes).find((outcome) => outcome.outcomeKey === '_2');

  if (winLeftOutcome && drawOutcome && winRightOutcome && betSum) {
    ctx.reply(
      `Найдено событие:\n${tournamentTitle ?? ''}/${categoryTitle ?? ''}\nВыберите ставку`,
      Markup.inlineKeyboard([[
        Markup.button.callback(`Победа ${team1 ? team1 : 'левых'} (x${winLeftOutcome.value + ''})`,
          `bet:${winLeftOutcome.id}-${winLeftOutcome.facId}:${betSum}`),
        Markup.button.callback(`Ничья (x${drawOutcome.value + ''})`,
          `bet:${drawOutcome.id}-${drawOutcome.facId}:${betSum}`),
        Markup.button.callback(`Победа ${team2 ? team2 : 'правых'} (x${winRightOutcome.value + ''})`,
          `bet:${winRightOutcome.id}-${winRightOutcome.facId}:${betSum}`)
      ]])
    )
  }
}

export default () => async (ctx, next) => {

  const ERROR_MESSAGE_INVALID_FORMAT = 'Попробуйте повторить ввод соблюдая формат:\n/bet <команда 1> - <команда 2>, <сумма ставки>';

  const { message = {} } = ctx.update;
  ctx.match = message.text?.match(/\/bet\s(.+)/);

  if (!ctx.match || !ctx.match.length < 2) {
    ctx.reply(`${ERROR_MESSAGE_INVALID_FORMAT}`);
    return;
  }

  const commandComponents = ctx.match[1].split(' ');
  if (!commandComponents.length < 2) {
    ctx.reply(`${ERROR_MESSAGE_INVALID_FORMAT}`);
    return;
  }

  const betSum = commandComponents[commandComponents.length - 1];
  if (!/^\d+$/.test(betSum)) {
    ctx.reply(`Ошибка определения суммы ставки. ${ERROR_MESSAGE_INVALID_FORMAT}`);
    return;
  }

  const eventNameComponents = commandComponents.slice(0, -1).join(' ').split('-');
  let [team1Name = '', team2Name = ''] = eventNameComponents;

  team1Name = team1Name.trim();
  team2Name = team2Name.trim();

  if (team1Name === '' || team2Name === '') {
    ctx.reply(`Ошибка определения играющих команд. ${ERROR_MESSAGE_INVALID_FORMAT}`);
    return;
  }

  try {
    const { data } = await getEventListBySearch(`${team1Name} - ${team2Name}`);

    const [result] = data?.result;
    console.log(result)
    let eventEntity = null;

    let eventsEntityIdx = 0;
    for (eventEntity of result.events ?? []) {
      const {
        gameDt = null,
        status = null,
        eventTitle = null,
        expired = false,
        tournamentTitle = null,
        categoryTitle = null,
      } = eventEntity;

      if (gameDt && status && eventTitle && !expired) {
        break;
      }

      renderEventEntity(ctx, eventEntity, context = { betSum });

      eventEntity++;
      if (eventsEntityIdx > 3) {
        break
      }
    }

    if (eventsEntityIdx === 0) {
      throw new Error('Не найдено событий которые еще не завершились к данному моменту.');
    }

  } catch (e) {
    ctx.reply('Произошла ошибка поиска игрового события. Попробутйе уточнить ввод введя более точные названия команд.');
  }
}