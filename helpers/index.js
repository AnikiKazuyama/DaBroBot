// eslint-disable-next-line no-console
const debug = (data, name = 'DEBUG') => {
  console.error(`${name} ${new Date()}`, JSON.stringify(data, null, '  '))
  return data
}

// eslint-disable-next-line no-console
const log = (data, name = 'LOG') => {
  console.log(`${name} ${new Date()}`, JSON.stringify(data, null, '  '))
  return data
}

// eslint-disable-next-line no-console
const errorHandler = (error) => debug(error)

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
  debug,
  errorHandler,
  makeUserMention
}
