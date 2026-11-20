const Koa = require('koa')
const Router = require('@koa/router')

const app = new Koa()
const router = new Router()

const examples = [
  { id: 1, title: 'Découvrir Koa', done: true },
  { id: 2, title: 'Comprendre le modèle oignon des middlewares', done: true },
  { id: 3, title: 'Créer une API REST avec un routeur', done: false }
]

app.use(async (ctx, next) => {
  const debut = Date.now()
  await next()
  const duree = Date.now() - debut
  ctx.set('X-Response-Time', `${duree}ms`)
  console.log(`${ctx.method} ${ctx.path} -> ${ctx.status} (${duree} ms)`)
})

router.get('/health', (ctx) => {
  ctx.status = 200
  ctx.body = { status: 'ok' }
})

router.get('/examples', (ctx) => {
  const { done } = ctx.query

  if (done !== undefined) {
    if (done !== 'true' && done !== 'false') {
      ctx.status = 400
      ctx.body = { error: "Le paramètre 'done' doit être 'true' ou 'false'" }
      return
    }

    const isDone = done === 'true'
    ctx.status = 200
    ctx.body = examples.filter((ex) => ex.done === isDone)
    return
  }

  ctx.status = 200
  ctx.body = examples
})

router.get('/examples/count', (ctx) => {
  ctx.status = 200
  ctx.body = { count: examples.length }
})

router.get('/examples', (ctx) => {
  if (ctx.query.bool === 'true') {
    ctx.body = examples.filter((ex) => ex.bool === true)
  } else if (ctx.query.bool === 'false') {
    ctx.body = examples.filter((ex) => ex.bool === false)
  }
})

router.get('/examples/:id', (ctx) => {
  const id = Number(ctx.params.id)

  const example = examples.find((ex) => ex.id === id)

  if (example) {
    ctx.body = example
  } else {
    ctx.body = { error: 'Exemple introuvable' }
  }
})

app.use(router.routes())
app.use(router.allowedMethods())

app.listen(3000, () => {
  console.log('Serveur Koa démarré sur http://localhost:3000')
})
