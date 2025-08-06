import { INodeProperties } from "n8n-workflow";
import ACTION_NAMES from "../action_names";

export default {
  [ACTION_NAMES.GET_ALL_CLOSING_NOTES]: {
    name: 'Get all Closing Notes',
    value: 'GET_ALL_CLOSING_NOTES',
    description: 'Return all the Closing Notes of a Workspace',
    params: [
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Maximum number of Closing Notes to return',
        default: 10
      }
    ] as unknown as INodeProperties[]
  }
}
