
export default async function FetchLogout ({history}) {
  await fetch(`/${history.basename}/logout`, {
    credentials: 'same-origin',
  })
  return {}
}
