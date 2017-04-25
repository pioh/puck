import uniq from 'lodash/uniq'

let files = `store/Telephonist/TaskStore
mobx
mobx-state-tree
mobx-state-tree
store/UserStore
mobx-state-tree
lodash/pick
lib/ISO
lib/Omit
mobx-state-tree
mobx-state-tree
mobx-state-tree
mobx
mobx
mobx
mobx-state-tree
lodash/get
lib/Omit
lib/ISO
lodash/pick
react
react-helmet
mobx-react
components/Header
react
mobx
mobx-react
side/Link
classnames
shortid
react
react
react
classnames
mobx
mobx-react
react
react-bootstrap-multiselect
lodash/get
mobx-react
mobx
react
react-bootstrap/es/FormGroup
react-bootstrap/es/InputGroup
mobx-react
mobx
react-datetime
classnames
lodash/get
components/lib
react
react-bootstrap-multiselect
lodash/get
classnames
mobx-react
mobx
react
mobx-react
mobx
react-datetime
lodash/get
jquery
react
mobx
classnames
react
mobx-react
mobx
jquery
classnames
lodash/get
react
classnames
mobx
mobx-react
lodash/get
side/Link
react-bootstrap/es/Pagination
react-md-spinner
shortid
react-tooltip
react-container-query
react
mobx-react
mobx
react-dom
lodash/get
lodash/omit
classnames
react
mobx-react
mobx
mobx-state-tree
react-tooltip
side/api/Yandex
store/Telephonist/OffersFilterStore
react
lodash/get
mobx
mobx-react
react-fine-uploader
react-dom
react-md-spinner
lodash/uniq
jquery
react
mobx-react
react-bootstrap/es/Tabs
react-bootstrap/es/Tab
side/api/Yandex
mobx
classnames
react-dom
react-md-spinner
react-tooltip
components/lib
react
mobx-react
mobx
lib/ISO
react
mobx-react
mobx
mobx-state-tree
store/Telephonist/AllTasksFilterStore
react
mobx
lib/Pretty
mobx-react
classnames
components/lib
store/Telephonist/const/enums
components/lib/Table
react
mobx
mobx-react
classnames
lib/Pretty
store/Telephonist/const/enums
components/lib/Table
react
mobx
lib/Pretty
mobx-react
classnames
store/Telephonist/const/enums
components/lib/Table
react-container-query
react
mobx
mobx-react
containers/Telephonist
components
components/Telephonist
components/Errors
store
react
mobx
mobx-react
side/History
store
side/fetchers
containers/Router
react
mobx-react
store/Telephonist/TasksStore
store/Telephonist/TasksFilterStore
side/fetchers/Telephonist
components/Telephonist/Tasks
react
mobx-react
store/Telephonist/TaskStore
store/Telephonist/AllTasksStore
side/fetchers/Telephonist
components/Telephonist/Task
react
mobx-react
store/Telephonist/OffersStore
store/Telephonist/OffersFilterStore
side/fetchers/Telephonist
components/Telephonist/Offers
components/Telephonist/OffersFilter
react
mobx-react
store/Telephonist/AllTasksStore
store/Telephonist/AllTasksFilterStore
side/fetchers/Telephonist
components/Telephonist/AllTasks
components/Telephonist/AllTasksFilter
mobx
history/createBrowserHistory
config/basenames
react
mobx
mobx-react
minimatch
classnames
store/UserStore
side/api
lib/Omit
store/Telephonist/TaskStore
store/Telephonist/const/enums
store/Telephonist/OfferStore
lib/Omit
lib/ISO
store/Telephonist/TaskStore
side/api
lib/Omit
store/Telephonist/TaskStore
mobx-state-tree
store/UserStore
side/api
mobx-state-tree
side/api/FetchUser
mobx
mobx-state-tree
jsondiffpatch/public/build/jsondiffpatch-full
shortid
lodash/uniq
lodash/set
lodash/get
store/Telephonist/TaskStore
side/api/Yandex
side/api/FetchUser
mobx-state-tree
side/api/Telephonist
mobx-state-tree
side/api/Telephonist
side/api/Telephonist/FetchRealtyTyWork
react
react-dom`.split('\n')

files = uniq(files)

export default files
