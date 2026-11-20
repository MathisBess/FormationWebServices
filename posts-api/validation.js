const ALLOWED_FIELDS = ['postId', 'name', 'email', 'body']
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const FIELD_VALIDATORS = {
  postId: {
    check: (value) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 1,
    message: 'Le champ postId doit être un entier supérieur ou égal à 1'
  },
  name: {
    check: (value) => typeof value === 'string' && value.trim().length >= 1 && value.length <= 100,
    message: 'Le champ name doit être un texte de 1 à 100 caractères'
  },
  email: {
    check: (value) => typeof value === 'string' && value.length <= 100 && EMAIL_REGEX.test(value),
    message: 'Le champ email doit être une adresse e-mail valide de 100 caractères maximum'
  },
  body: {
    check: (value) => typeof value === 'string' && value.trim().length >= 1 && value.length <= 500,
    message: 'Le champ body doit être un texte de 1 à 500 caractères'
  }
}

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

function validatePostPayload(payload, { partial = false } = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { error: 'Le corps de la requête doit être un objet JSON' }
  }

  const keys = Object.keys(payload)
  if (partial && keys.length === 0) {
    return { error: 'Au moins un champ à modifier est requis' }
  }

  for (const key of keys) {
    if (!ALLOWED_FIELDS.includes(key)) {
      return { error: `Champ non autorisé : ${key}` }
    }
  }

  const validated = {}
  for (const field of ALLOWED_FIELDS) {
    const value = payload[field]
    if (value === undefined) {
      if (!partial) {
        return { error: `Le champ ${field} est obligatoire` }
      }
      continue
    }

    const validator = FIELD_VALIDATORS[field]
    if (!validator.check(value)) {
      return { error: validator.message }
    }

    validated[field] = value
  }

  return { data: validated }
}

module.exports = {
  parsePositiveInt,
  validatePostPayload
}
