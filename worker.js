// == Cloudflare Worker - Guestbook & Comments API ==
const GITHUB_REPO = 'EdwinNRM/Blog'

// Simple in-memory rate limit: max N requests per IP per windowMs
const RATE_LIMIT = {
  maxRequests: 5,        // max submissions per window
  windowMs: 60_000,      // 1 minute window
  cache: new Map(),
}

function rateLimited(ip) {
  const now = Date.now()
  const record = RATE_LIMIT.cache.get(ip)

  // Lazy cleanup: delete stale entries as we encounter them
  if (record && now - record.start > RATE_LIMIT.windowMs) {
    RATE_LIMIT.cache.delete(ip)
  }

  if (!record || now - record.start > RATE_LIMIT.windowMs) {
    RATE_LIMIT.cache.set(ip, { start: now, count: 1 })
    return false
  }

  record.count++
  if (record.count > RATE_LIMIT.maxRequests) return true
  return false
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response('', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido' }, 405)
  }

  // Rate limiting by IP
  const ip = request.headers.get('CF-Connecting-IP') ||
             request.headers.get('X-Forwarded-For') ||
             'unknown'
  if (rateLimited(ip)) {
    return jsonResponse({ error: 'Muitas requisições. Aguarde um minuto.' }, 429)
  }

  let data
  try {
    data = await request.json()
  } catch {
    return jsonResponse({ error: 'JSON inválido' }, 400)
  }

  const name = (data.name || '').trim().slice(0, 100)
  const message = (data.message || '').trim().slice(0, 1000)
  const type = (data.type || '').trim()
  const post = (data.post || '').trim().slice(0, 200)

  if (!name || !message || !type) {
    return jsonResponse({ error: 'Campos obrigatórios: name, message, type' }, 400)
  }

  if (!['guestbook', 'comment'].includes(type)) {
    return jsonResponse({ error: 'type deve ser "guestbook" ou "comment"' }, 400)
  }

  const date = new Date().toISOString().split('T')[0]

  let title, body, labels = ['pending']

  if (type === 'guestbook') {
    title = `[Guestbook] ${name}`
    labels.push('guestbook')
    body = `**Name:** ${name}\n**Message:** ${message}\n**Date:** ${date}\n**Type:** guestbook`
  } else {
    const slug = post || 'unknown'
    title = `[Comment] ${slug} - ${name}`
    labels.push('comment')
    body = `**Name:** ${name}\n**Message:** ${message}\n**Date:** ${date}\n**Type:** comment\n**Post:** ${slug}`
  }

  try {
    const githubResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/issues`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'guestbook-worker',
        },
        body: JSON.stringify({ title, body, labels }),
      }
    )

    if (!githubResponse.ok) {
      const err = await githubResponse.text()
      console.error('GitHub API error:', err)
      return jsonResponse({ error: 'Erro ao criar issue no GitHub' }, 500)
    }

    const issue = await githubResponse.json()
    return jsonResponse({ success: true, issue: issue.number })
  } catch (err) {
    console.error('Worker error:', err)
    return jsonResponse({ error: 'Erro interno', details: err.message }, 500)
  }
}
