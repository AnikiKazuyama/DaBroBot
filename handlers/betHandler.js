import { getEventListBySearch } from './../requests/requests.js';

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
    const eventEntity = result.events[0];

    if (eventEntity) {
      const { team1, team2 } = eventEntity;
      const outcomes = eventEntity.outcomes;

      const winLeftOutcome = Object.values(outcomes).find((outcome) => outcome.outcomeKey === '_1');
      const drawOutcome = Object.values(outcomes).find((outcome) => outcome.outcomeKey === 'x');
      const winRightOutcome = Object.values(outcomes).find((outcome) => outcome.outcomeKey === '_2');

      ctx.reply(
        'Выберите ставку',
        Markup.inlineKeyboard([[
          Markup.button.callback(`Победа ${team1 ? team1 : 'левых'}`, `bet:${winLeftOutcome.id}-${winLeftOutcome.facId}`),
          Markup.button.callback('Ничья', `bet:${drawOutcome.id}-${drawOutcome.facId}`),
          Markup.button.callback(`Победа ${team2 ? team2 : 'правых'}`, `bet:{winRightOutcome.id}-${winRightOutcome.facId}`)
        ]])
      )
    }
  } catch (e) {
    ctx.reply('Произошла ошибка поиска игрового события. Попробутйе уточнить ввод введя более точные названия команд.');
  }
}