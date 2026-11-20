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

router.get('/posts', (ctx) => {
  const { postId } = ctx.query

  if (postId !== undefined) {
    const parsedPostId = parsePositiveInt(postId)
    if (parsedPostId === null) {
      ctx.status = 400
      ctx.body = { error: 'Le paramètre postId doit être un entier supérieur ou égal à 1' }
      return
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
    ctx.status = 404
    ctx.body = { error: 'Post introuvable' }
    return
  }

  ctx.status = 200
  ctx.body = post
})

app.use(bodyParser())
app.use(router.routes())
app.use(router.allowedMethods())

const PORT = process.env.PORT || 3000
app.listen(PORT)
