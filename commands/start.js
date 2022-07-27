import { errorHandler } from './../helpers/index.js'

export default () => async (ctx) => {
  if (ctx.chat.type === 'private') {
    ctx.reply(`🤖 Вас приветствует бот Лиги Ставок ┏━┓.

Бот позволяет совершать ставки в Лиге Ставок используя ваш ранее созданный аккаунт.
Для начала работы вам необходимо авторизоваться выполнив команду /login.
Для просмотра списка всех доступных команды введите /help.
`)
      .catch(errorHandler)
  }
}
