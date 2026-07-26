addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { name, message, type, post } = await request.json()

    if (!name || !message || !type) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Campos obrigatórios: name, message, type'
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!['guestbook', 'comment'].includes(type)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'type deve ser "guestbook" ou "comment"'
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const date = new Date().toISOString().split('T')[0]

    let title
    let body
    let labels = ['pending']

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

    const githubResponse = await fetch(
      'https://api.github.com/repos/EdwinNRM/Blog/issues',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_PAT}`,
          'Content-Type': 'application/json',
          'User-Agent': 'guestbook-worker'
        },
        body: JSON.stringify({ title, body, labels })
      }
    )

    if (!githubResponse.ok) {
      const err = await githubResponse.text()
      console.error('GitHub API error:', err)
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao criar issue no GitHub'
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const issue = await githubResponse.json()

    return new Response(JSON.stringify({
      success: true,
      issue: issue.number
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (e) {
    console.error('Worker error:', e)
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor'
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
