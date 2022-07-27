import { debug } from './../helpers/index.js'

export default () => async (ctx, next) => {
  debug(ctx.update)
  next(ctx)
}
