import { login } from './../requests/requests.js';

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

  try {
    ctx.reply('Авторизация пользователя ...');

    const { data } = await login(login, password);
    const token = data?.meta?.token;
    const decodedToken = jwt_decode(token);

    const userInfoResponse = await getUserInfo(token, JSON.parse(decodedToken.sub).number);
    const userNumber = userInfoResponse.data.result.number;

    const sessionAuthorizedMap = ctx.session['authorized-users'];
    if (!sessionAuthorizedMap) {
      ctx.session['authorized-users'] = {};
    }

    ctx.session['authorized-users'][ctx.message.from.id] = {
      token,
      number: userNumber
    };

    await ctx.deleteMessage(ctx.message.message_id)
    ctx.reply('Авторизация прошла успешно.');

  } catch (e) {
    ctx.reply('Произошла ошибка авторизации.');
  }
}