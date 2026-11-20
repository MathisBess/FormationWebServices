const fs = require('fs')
const path = require('path')
const Koa = require('koa')
const Router = require('@koa/router')
const bodyParser = require('koa-bodyparser')

const app = new Koa()
const router = new Router()

const seedPath = path.join(__dirname, 'posts.seed.json')
const rawData = fs.readFileSync(seedPath, 'utf-8')
const posts = JSON.parse(rawData)

function parsePositiveInt(value) {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return null
  }
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return null
  }
  return parsed
}

const DEFAULT_ERROR_MESSAGES = {
  404: 'Route introuvable',
  405: 'Méthode non autorisée',
  501: 'Méthode non implémentée'
}

app.use(async (ctx, next) => {
  try {
    await next()
    if (ctx.status >= 400 && ctx.body === undefined) {
      const status = ctx.status
      ctx.status = status
      ctx.body = {
        error: DEFAULT_ERROR_MESSAGES[status] || 'Requête invalide'
      }
    }
  } catch (err) {
    const status = err.status || err.statusCode || 500
    ctx.status = status
    ctx.body = {
      error: status >= 500 ? 'Erreur interne du serveur' : err.message || 'Requête invalide'
    }
  }
})

app.use(
  bodyParser({
    onerror(err, ctx) {
      if (err.status === 413) {
        ctx.throw(413, 'Corps de requête trop volumineux')
      }
      ctx.throw(400, 'Corps JSON invalide')
    }
  })
)

router.get('/posts', (ctx) => {
  const { postId } = ctx.query

  if (postId !== undefined) {
    const parsedPostId = parsePositiveInt(postId)
    if (parsedPostId === null) {
      ctx.throw(400, 'Le paramètre postId doit être un entier supérieur ou égal à 1')
    }
    ctx.status = 200
    ctx.body = posts.filter((post) => post.postId === parsedPostId)
    return
  }

  ctx.status = 200
  ctx.body = posts
})

router.get('/posts/:id', (ctx) => {
  const id = parsePositiveInt(ctx.params.id)
  const post = id !== null ? posts.find((item) => item.id === id) : undefined

  if (!post) {
    ctx.throw(404, 'Post introuvable')
  }

  ctx.status = 200
  ctx.body = post
})

app.use(router.routes())
app.use(router.allowedMethods())

const PORT = process.env.PORT || 3000
app.listen(PORT)
