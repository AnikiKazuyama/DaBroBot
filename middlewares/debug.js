import { logError } from './../helpers/index.js'

export default () => async (ctx, next) => {
  error(ctx.update)
  next(ctx)
}
