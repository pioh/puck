import {ParseResponseError} from 'side/api'


export async function FetchRealtyTyWork ({history, hid}) {
  let url = `/${history.basename}/rest/telephonist/realties/${hid}/toWork`
  let response = await fetch(url, {
    method      : 'POST',
    credentials : 'same-origin',
  })
  return {
    error: await ParseResponseError(response),
  }
}
