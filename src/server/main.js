
import {TaskStore, TaskViewStore, FromServerTask} from 'store/Telephonist/TaskStore'
import {useStrict} from 'mobx'
useStrict(true)


class Validator {
  taskDoneErrors = (json) => {
    let taskStore = TaskStore(FromServerTask(JSON.parse(json)))
    let taskViewStore = new TaskViewStore(taskStore)
    return [...taskViewStore.doneErrors]
  }
}
global.validator = new Validator()
global.Validator_taskDoneErrors = global.validator.taskDoneErrors
