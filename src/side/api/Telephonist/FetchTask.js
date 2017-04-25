import {FromServerTask, ToServerTask} from 'store/Telephonist/TaskStore'
import {ParseResponseError, ParseResponseJson} from 'side/api'


export default async function FetchTask ({history, id}) {
  if (String(id).match(/^new-/)) {
    return {
      task: {
        id    : id,
        offer : {},
      },
    }
  }
  let url = `/${history.basename}/rest/telephonist/tasks/${id}`

  let response = await fetch(url, {
    credentials: 'same-origin',
  })
  let json = await ParseResponseJson(response)
  if (json.error) {
    console.error(`faield fetch ${url}`, json.error.message)
    return json
  }
  return {task: FromServerTask(json)}
}

export async function FetchSaveTask ({history, task}) {
  let url = `/${history.basename}/rest/telephonist/tasks/realty`

  task = ToServerTask(task)


  let response = await fetch(url, {
    credentials : 'same-origin',
    method      : task.id ? 'POST' : 'PUT',
    headers     : {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify(task),
  })
  let error = await ParseResponseError(response)
  if (error) {
    console.error(`faield fetch ${url}`, error.message)
    return {error}
  }

  if (task.id) return {ok: true}

  let json = await ParseResponseJson(response)
  if (json.error) {
    console.error(`faield fetch ${url}`, json.error.message)
    return {error}
  }

  return {ok: true, newTaskID: json.id}
}


export async function FetchDoneTask ({history, id}) {
  let url = `/${history.basename}/rest/telephonist/tasks/${id}/status/checked`
  let response = await fetch(url, {
    credentials : 'same-origin',
    method      : 'POST',
  })
  let error = await ParseResponseError(response)
  if (error) {
    console.error(`faield fetch ${url}`, error.message)
    return {error}
  }
  return {}
}

export async function FetchDeleteTask ({history, id}) {
  let url = `/${history.basename}/rest/telephonist/tasks/${id}`
  let response = await fetch(url, {
    credentials : 'same-origin',
    method      : 'DELETE',
  })
  let error = await ParseResponseError(response)
  if (error) {
    console.error(`faield fetch ${url}`, error.message)
    return {error}
  }
  return {}
}

export async function FetchToWorkTask ({history, id}) {
  let url = `/${history.basename}/rest/telephonist/tasks/${id}/status/inProgress`
  let response = await fetch(url, {
    credentials : 'same-origin',
    method      : 'POST',
  })
  let error = await ParseResponseError(response)
  if (error) {
    console.error(`faield fetch ${url}`, error.message)
    return {error}
  }
  return {}
}

export async function FetchCancelTask ({history, id}) {
  let url = `/${history.basename}/rest/telephonist/tasks/${id}/status/unchecked`
  let response = await fetch(url, {
    credentials : 'same-origin',
    method      : 'POST',
  })
  let error = await ParseResponseError(response)
  if (error) {
    console.error(`faield fetch ${url}`, error.message)
    return {error}
  }
  return {}
}

let statusMap = {
  CHECKED     : 'checked',
  UNCHECKED   : 'unchecked',
  IN_PROGRESS : 'inProgress',
}

export async function FetchChangeTaskStatus ({history, id, status}) {
  let url = `/${history.basename}/rest/telephonist/tasks/${id}/status/${statusMap[status]}`
  let response = await fetch(url, {
    credentials : 'same-origin',
    method      : 'POST',
  })
  let error = await ParseResponseError(response)
  if (error) {
    console.error(`faield fetch ${url}`, error.message)
    return {error}
  }
  return {ok: true}
}

export async function FetchChangeTaskUser ({history, id, userId}) {
  if (!userId) return {ok: true}
  let url = `/${history.basename}/rest/telephonist/tasks/${id}/user/${userId}`
  let response = await fetch(url, {
    credentials : 'same-origin',
    method      : 'PUT',
  })
  let error = await ParseResponseError(response)
  if (error) {
    console.error(`faield fetch ${url}`, error.message)
    return {error}
  }
  return {ok: true}
}

