import { login } from './../requests/requests.js';
import { log, logError, errorHandler, echoError } from './../helpers/index.js'

const AUTH_USERS_SESSION_KEY = 'authenticated-users';

export default () => async (ctx, next) => {
  const { message = {} } = ctx.update;
  ctx.match = message.text?.match(/\/login\s([a-zA-Z@\-0-9]+)\s([a-zA-Z0-9\-!@#$%^&\*]+)/);
  const { username = null, password = null } = ctx.match && ctx.match[1] && ctx.match[2] ?
    {
      username: ctx.match[1],
      password: ctx.match[2],
    } : {};

  if (!username || !password) {
    ctx.reply('Попробуйте повторить ввод соблюдая формат:\n/login <ваш логин> <ваш пароль>');
    return;
  }

  if (!ctx.session) {
    echoError('Хранилище сессий не инициализировано');
    return;
  }

  const authUsers = ctx.session[AUTH_USERS_SESSION_KEY];
  if (!authUsers) {
    ctx.session[AUTH_USERS_SESSION_KEY] = {};
  }

  try {
    ctx.reply('Авторизация пользователя ...');


    const { data } = await login(login, password);
    const token = data?.meta?.token;
    const decodedToken = jwt_decode(token);

    const userInfoResponse = await getUserInfo(token, JSON.parse(decodedToken.sub).number);
    const { firstName = null, lastName = null, userNumber: userNumber = null } = userInfoResponse?.data?.result ?? {};

    ctx.session[AUTH_USERS_SESSION_KEY][ctx.message.from.id] = {
      token,
      firstName,
      lastName,
      number: userNumber
    };

    await ctx.deleteMessage(ctx.message.message_id)
    ctx.reply(`Добро пожаловать, ${firstName} ${lastName}. Авторизация прошла успешно.`);
  } catch (e) {
    logError(e, 'loginHandler');
    echoError('Ошибка авторизации.')
  }
}