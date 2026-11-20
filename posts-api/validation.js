function parsePositiveInt(value) {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return null
  }
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null
}

function validatePost(body, isPatch = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Le corps de la requête doit être un objet JSON'
  }

  const allowedFields = ['postId', 'name', 'email', 'body']
  const keys = Object.keys(body)

  if (isPatch && keys.length === 0) {
    return 'Aucun champ à modifier'
  }

  for (const key of keys) {
    if (!allowedFields.includes(key)) {
      return `Champ non autorisé : ${key}`
    }
  }

  if (!isPatch || body.postId !== undefined) {
    if (!Number.isInteger(body.postId) || body.postId < 1) {
      return 'Le champ postId doit être un entier supérieur ou égal à 1'
    }
  }

  if (!isPatch || body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0 || body.name.length > 100) {
      return 'Le champ name doit être un texte de 1 à 100 caractères'
    }
  }

  if (!isPatch || body.email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (typeof body.email !== 'string' || body.email.length > 100 || !emailRegex.test(body.email)) {
      return 'Le champ email doit être une adresse e-mail valide de 100 caractères maximum'
    }
  }

  if (!isPatch || body.body !== undefined) {
    if (typeof body.body !== 'string' || body.body.trim().length === 0 || body.body.length > 500) {
      return 'Le champ body doit être un texte de 1 à 500 caractères'
    }
  }

  return null
}

module.exports = {
  parsePositiveInt,
  validatePost
}
