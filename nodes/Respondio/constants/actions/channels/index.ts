import { ACTION_NAMES } from "../..";

export default {
  [ACTION_NAMES.GET_ALL_CHANNELS]: {
    name: 'Get all Channels',
    value: 'GET_ALL_CHANNELS',
    description: 'Return all the channels of a Workspace',
    params: [
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Maximum number of Contacts to return',
        default: 10
      }
    ]
  }
}
