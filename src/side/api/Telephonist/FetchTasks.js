import {omit} from 'lib/Omit'

import {FromServerTask} from 'store/Telephonist/TaskStore'


export default async function FetchTasks ({history, filter, userID}) {
  let request = Object.entries(omit({
    sortBy         : filter.sortBy && filter.sortBy.replace('offer', 'realty') || undefined,
    page           : Math.floor(filter.offset / filter.limit),
    size           : filter.limit,
    reverse        : filter.reverse === true,
    onlyInProgress : false,
    userId         : userID,
  })).map(a => a.join('=')).join('&')

  let url = `/${history.basename}/rest/telephonist/tasks/browse?${request}`

  let response = await fetch(url, {
    credentials: 'same-origin',
  })
  if (!response.ok) {
    console.error(`faield fetch ${url}`)
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
  response.tasksCount = response.tasksCount || filter.offset + response.tasks.length + 1
  response.tasksPages = response.tasksPages || Math.ceil(response.tasksCount / filter.limit)

  response.tasksCount = Math.min(response.tasksPages * filter.limit, response.tasksCount)

  response.tasks = response.tasks.map((o, i) => {
    o = FromServerTask(o)
    o.index = filter.offset + i + 1
    return o
  })
  return response
}
