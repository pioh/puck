import FetchUser from './FetchUser'


export default async function FetchLogin ({history, username, password}) {
  let data = Object.entries({
    username,
    password,
    requestType   : 'ajaxLogin',
    'remember-me' : 'on',
  }).map(([key, val]) => [key, encodeURIComponent(val)].join('=')).join('&')

  let response = await fetch(`/${history.basename}/login`, {
    method      : 'POST',
    credentials : 'same-origin',
    headers     : {
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
    },
    body: data,
  })

  if (!response.ok) {
    console.error(`faield fetch /rest/telephonist/login: ${response.statusText}`)
    return {error: {message: 'Произошла внутренняя ошибка'}}
  }
  let response2 = response.clone()
  try {
    response = await response.json()
  } catch (e) {
    let error = e
    try {
      let text = (await response2.text()).match(/<pre>(.*)/)[1]
      if (text) error = new Error(text)
    } catch (e2) {
    }
    throw error
  }
  if (response.status !== 0) {
    return {error: {message: response.message}}
  }
  let user = await FetchUser({history})
  if (user.error) return user
  return {}
}
