const fs = require('fs')
const path = require('path')
const Koa = require('koa')
const Router = require('@koa/router')
const bodyParser = require('koa-bodyparser')
const { parsePositiveInt, validatePost } = require('./validation')

const app = new Koa()
const router = new Router()

const seedPath = path.join(__dirname, 'posts.seed.json')
const rawData = fs.readFileSync(seedPath, 'utf-8')
const posts = JSON.parse(rawData)
// Compteur monotone pour ne jamais réutiliser l'id d'un post supprimé
let nextId = Math.max(0, ...posts.map((post) => post.id)) + 1

app.use(async (ctx, next) => {
  try {
    await next()
    if (ctx.status === 404 && ctx.body === undefined) {
      ctx.status = 404
      ctx.body = { error: 'Route introuvable' }
    } else if (ctx.status === 405 && ctx.body === undefined) {
      ctx.status = 405
      ctx.body = { error: 'Méthode non autorisée' }
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
    onerror: (err, ctx) => {
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

router.post('/posts', (ctx) => {
  const error = validatePost(ctx.request.body)
  if (error) {
    ctx.throw(400, error)
  }

  const { postId, name, email, body } = ctx.request.body
  const newPost = {
    postId,
    id: nextId++,
    name,
    email,
    body
  }

  posts.push(newPost)
  ctx.status = 201
  ctx.set('Location', `/posts/${newPost.id}`)
  ctx.body = newPost
})

router.delete('/posts/:id', (ctx) => {
  const id = parsePositiveInt(ctx.params.id)
  const index = id !== null ? posts.findIndex((item) => item.id === id) : -1

  if (index === -1) {
    ctx.throw(404, 'Post introuvable')
  }

  posts.splice(index, 1)
  ctx.status = 204
})

app.use(router.routes())
app.use(router.allowedMethods())

const PORT = process.env.PORT || 3000
app.listen(PORT)
