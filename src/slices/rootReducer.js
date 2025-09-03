// ** Reducers Imports
import navbar from './navbar'
import layout from './layout'
import auth from './authentication'
import users from './appUsersSlice'

const rootReducer = {
  auth,
  users,
  navbar,
  layout,
}

export default rootReducer
