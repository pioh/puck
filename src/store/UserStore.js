import {createFactory, mapOf} from 'mobx-state-tree'


export const permissions = {
  LOGGED_OUT : 'LOGGED_OUT',
  LOADING    : 'LOADING',
  USER       : 'USER',
}

export const nullUser = {
  permissions : {},
  tags        : {},
  loggedIn    : false,
  id          : null,
}

export const UserStore = createFactory({
  permissions : mapOf(),
  tags        : mapOf(),
  loggedIn    : null,
  id          : null,
})
