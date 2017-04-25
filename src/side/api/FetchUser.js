import {nullUser} from 'store/UserStore'


export default async function FetchUser ({history}) {
  if (history) return nullUser
  let response = await fetch(`/${history.basename}/rest/telephonist/user`, {
    credentials: 'same-origin',
  })
  if (response.status === 403) return nullUser
  if (!response.ok) {
    console.error(`faield fetch /rest/telephonist/user: ${response.statusText}`)
    return {
      error: {
        message: 'Произошла внутренняя ошибка',
      }
    }
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
  if (!response || !response.user || !response.user.id) {
    console.error(`faield fetch /rest/telephonist/user: bad user response`)
    return {
      error: {
        message: 'Произошла внутренняя ошибка',
      }
    }
  }
  let user = {
    permissions : response.user.permissions,
    loggedIn    : true,
    id          : response.user.id,
  };

  [user.firstName, user.lastName] = (response.user.fullName || '').replace(/<[^>]+>/g, '').split(', ')

  return user
}

export async function FetchUsers ({history}) {
  let response = await fetch(`/${history.basename}/rest/telephonist/users`, {
    credentials: 'same-origin',
  })
  if (response.status === 403) {
    return {
      error: {
        message: 'Недостаточно прав',
      },
    }
  }
  if (!response.ok) {
    console.error(`faield fetch /rest/telephonist/user: ${response.statusText}`)
    return {
      error: {
        message: 'Произошла внутренняя ошибка',
      }
    }
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
  if (!response || !response.user || !response.user) {
    console.error(`faield fetch /rest/telephonist/users: bad users response`)
    return {
      error: {
        message: 'Произошла внутренняя ошибка',
      }
    }
  }
  let users = {}
  response.user.forEach(user => {
    users[user.id] = {
      permissions : user.permissions,
      id          : user.id,
      fullName    : user.fullName,
      username    : user.username,
    }
  })

  return {
    users,
    ok: true,
  }
}
