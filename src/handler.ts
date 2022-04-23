declare const APP_STATE: KVNamespace
import * as uuid from 'uuid'

const MAX_BODY_SIZE = 256_000 // 256KB
const SUBJECT_REGEX = /^(Patient|Practitioner|PractitionerRole|RelatedPerson|Person)\/[A-Za-z0-9\-\.]{1,64}$/
const CODING_REGEX = /^https:\/\/.+\|.+$/
const JSON_OPTS = {
  headers: { 'content-type': 'application/fhir+json' },
}

const randomId = () => uuid.v4()

function ensureAuthorized(request: Request) {
  // Replace this with real logic to check whether this
  // request is allowed to proceed, based on any combination
  // of access token, client, principal, patient, or backend rules
  if (request.headers.get('authorization') !== 'Bearer secret-shh-fixme') {
    throw { message: 'Unauthorized', status: 401 }
  }
}
const ensureValid = (name: string, extractor: (r: any) => string, validator: RegExp) => (r: any, expected?: string) => {
  const result = extractor(r)
  if (!result.match(validator)) {
    throw `Invalid ${name}`
  }
  if (expected && expected !== result) {
    throw `Cannot change ${name} after state creation`
  }
  return result
}
const ensureValidSubject = ensureValid('subject', (r) => `${r?.subject?.reference}`, SUBJECT_REGEX)
const ensureValidCoding = ensureValid('coding', (r) => `${r.code.coding[0].system}|${r.code.coding[0].code}`, CODING_REGEX)

export async function handleRequest(request: Request): Promise<Response> {
  ensureAuthorized(request)
  const reqUrl = new URL(request.url)
  if (request.method === 'GET') {
    // Query via $smart-app-state-query
    const reqSubject = reqUrl.searchParams.get('subject')
    const reqCode = reqUrl.searchParams.get('code')
    const body = {
      subject: { reference: reqSubject },
      code: { coding: [{ system: reqCode?.split('|')[0], code: reqCode?.split('|')[1] }] },
    }

    const subject = ensureValidSubject(body)
    const coding = ensureValidCoding(body)
    const prefix = `${subject}:${coding}`
    const matchingKeys = await APP_STATE.list({ prefix })
    const matchingValues = matchingKeys.keys.map(async (k) => await APP_STATE.get(k.name, 'json'))

    return new Response(
      JSON.stringify({
        resourceType: 'Bundle',
        entry: (await Promise.all(matchingValues)).map((v) => ({
          resource: v,
        })),
      }),
      JSON_OPTS,
    )
  } else if (request.method === 'POST') {
    // Modify via $smart-app-state-modify
    const bodyText = await request.text()
    if (bodyText.length > MAX_BODY_SIZE) {
      throw { message: 'Requeest body is larger than 256kb', status: 413 }
    }
    const body = JSON.parse(bodyText)
    const subject = ensureValidSubject(body)
    const coding = ensureValidCoding(body)

    if (!body.id) {
      // Create
      const id = (body.id = randomId())
      const key = `${subject}:${coding}:${id}`
      const stored = JSON.stringify(body)
      await APP_STATE.put(key, stored)
      return new Response(stored, JSON_OPTS)
    } else {
      // Update or Delete
      const id = body.id
      const key = `${subject}:${coding}:${id}`
      const previouslyStored = (await APP_STATE.get(key, 'json')) as any
      ensureValidSubject(previouslyStored, subject) // prevent changes
      ensureValidCoding(previouslyStored, coding)

      if (body.extension) {
        // Update
        const stored = JSON.stringify(body)
        await APP_STATE.put(key, stored)
        return new Response(stored, JSON_OPTS)
      } else {
        // Delete
        await APP_STATE.delete(key)
        return new Response(null, { status: 204 })
      }
    }
  } else {
    throw { status: 404 }
  }
}
