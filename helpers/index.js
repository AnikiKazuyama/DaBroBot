// eslint-disable-next-line no-console
const logError = (data, name = 'DEBUG') => {
  console.error(`${name} ${new Date()}`, JSON.stringify(data, null, '  '))
  return data
}

// eslint-disable-next-line no-console
const log = (data, name = 'LOG') => {
  console.log(`${name} ${new Date()}`, JSON.stringify(data, null, '  '))
  return data
}

const isAuthenticated = (ctx) => {
  const sessionAuthorizedMap = ctx.session['authorized-users'];
  if (ctx.session
    && ctx.session['authorized-users']
    && ctx.session['authorized-users'][ctx.message.from.id]) {
    const { token = null, userNumber = null } = ctx.session['authorized-users'][ctx.message.from.id]
    return token && userNumber;
  }
  return false;
}

const echoError = (ctx, errorMessage = null) => {
  ctx.reply(`¯\_(ツ)_/¯ Внутренняя ошибка. {${errorMessage}}`);
}


const errorHandler = (error) => error(error)

const makeUserMention = ({
  id,
  username,
  first_name: firstName,
  last_name: lastName,
}) => username
    ? `@${username}`
    : `[${firstName || lastName}](tg://user?id=${id})`


export {
  log,
  logError,
  errorHandler,
  makeUserMention,
  isAuthenticated,
  echoError
}
