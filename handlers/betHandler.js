import { getEventListBySearch } from './../requests/requests.js';
import { logError, echoError } from './../utils/logger.js';

function renderEventEntity(ctx, eventEntity) {
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

  const outcomes = eventEntity.outcomes;

  const winLeftOutcome = Object.values(outcomes).find((outcome) => outcome.outcomeKey === '_1');
  const drawOutcome = Object.values(outcomes).find((outcome) => outcome.outcomeKey === 'x');
  const winRightOutcome = Object.values(outcomes).find((outcome) => outcome.outcomeKey === '_2');

  if (!winLeftOutcome || !drawOutcome || !winRightOutcome) {
    ctx.reply(
      `Найдено событие:\n${tournamentTitle ?? ''}/${categoryTitle ?? ''}\nВыберите ставку`,
      Markup.inlineKeyboard([[
        Markup.button.callback(`Победа ${team1 ? team1 : 'левых'}`,
          `bet:${winLeftOutcome.id}-${winLeftOutcome.facId}`),
        Markup.button.callback('Ничья',
          `bet:${drawOutcome.id}-${drawOutcome.facId}`),
        Markup.button.callback(`Победа ${team2 ? team2 : 'правых'}`,
          `bet:${winRightOutcome.id}-${winRightOutcome.facId}`)
      ]])
    )
  }
}

export default () => async (ctx, next) => {
  const { message = {} } = ctx.update;
  ctx.match = message.text?.match(/\/bet\s(.+)/);
  const eventNameComponents = (ctx.match && ctx.match[1] ? ctx.match[1] : '').split('-');

  if (eventNameComponents.length < 2) {
    ctx.reply('Попробуйте повторить ввод соблюдая формат:\n/bet <команда 1> - <команда 2>');
    return;
  }

  let [team1Name = '', team2Name = ''] = eventNameComponents;
  team1Name = team1Name.trim();
  team2Name = team2Name.trim();

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

      renderEventEntity(ctx, eventEntity);

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