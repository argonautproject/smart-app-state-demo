import { handleRequest } from './handler'

addEventListener('fetch', (event) => {
  event.respondWith(
    new Promise(async (resolve, reject) => {
      try {
        resolve(await handleRequest(event.request))
      } catch (e: any) {
        resolve(new Response(e.message || null, { status: e.status || 500 }))
      }
    }),
  )
})
