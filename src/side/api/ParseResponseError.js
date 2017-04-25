
export function ErrorFromJson (json) {
  if (!json) return null
  if (typeof json !== 'object') return {message: String(json)}
  if (!json.error) {
    if (json.status && json.status !== 'ok' && json.status !== 200) {
      json.error = 'status: ' + json.status
    } else return null
  }
  if (typeof json.error !== 'object') json.error = json
  json.error.message = [
    json.error.error,
    json.error.exception,
    json.error.message,
  ].filter(v => v).join('\n')
  return json.error
}

export async function ParseResponseError (response) {
  response = response.clone()
  let response2 = response.clone()
  let error = null
  try {
    let json = await response.json()
    error = ErrorFromJson(json)
  } catch (e) {
    try {
      let message = (await response2.text()).match(/<pre>(.*)/)[1]
      if (message) error = {message}
    } catch (e2) {}
  }
  if (!error && !response.ok) error = {message: ''}
  if (!error) return null
  let premessage = 'Произошла внутренняя ошибка'
  switch (response.status) {
    case 403: premessage = 'Ошибка доступа. Недостаточно прав'; break
  }
  error.message = [premessage, error.message].filter(v => v).join('\n')

  return error
}

export async function ParseResponseJson (response) {
  let error = await ParseResponseError(response)
  if (error) return {error}

  try {
    let ret = await response.json()
    error = ErrorFromJson(ret)
    if (error) {
      ret.error = error
    }
    return ret
  } catch (e) {
    return {
      error: {
        message: 'Failed parse json from server\n' + e.message
      },
    }
  }
}
