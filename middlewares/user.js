import { errorHandler } from './../helpers/index.js'

export default () => async (ctx, next) => {
  if (ctx.updateType === 'channel_post' || !ctx.from || !ctx.session) {
    return
  }

  if (ctx.session.user) {
    return next()
  }

  const id = Number(ctx.from.id)
  const date = new Date()

  const user = {}
  if (user) {
    const diff = Object.keys(ctx.from).reduce((acc, key) => {
      if (key === 'id') {
        return acc
      }
      if (typeof ctx.from[key] === 'boolean') {
        user[key] = Boolean(user[key])
      }
      if (ctx.from[key] !== user[key]) {
        acc[key] = ctx.from[key]
      }
      return acc
    }, {})

    const fields = { ...diff, updated_at: date }

    ctx.session.user = user
  }

  return next()
}
