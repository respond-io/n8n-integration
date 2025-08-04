import { ACTION_NAMES } from "../..";

export default {
  [ACTION_NAMES.FIND_USER]: {
    name: 'Find a User',
    value: 'FIND_USER',
    description: 'Finds a specific user by identifier',
    params: [{
      displayName: 'User ID',
      name: 'userId',
      type: 'string',
      required: true,
      description: 'The ID of the user to find. This ID can be found under Settings > "Users"',
    }]
  },
  [ACTION_NAMES.GET_ALL_USERS]: {
    name: 'Get all Users',
    value: 'GET_ALL_USERS',
    description: 'Return all the users of a Workspace',
    params: [{
      displayName: 'Limit',
      name: 'limit',
      type: 'number',
      required: false,
      description: 'Maximum number of Contacts to return',
      default: 10
    }]
  }
}
