import { INodeProperties } from "n8n-workflow";
import { ACTION_NAMES } from "../..";

export default {
  [ACTION_NAMES.GET_ALL_CHANNELS]: {
    name: 'Get all Channels',
    value: ACTION_NAMES.GET_ALL_CHANNELS,
    description: 'Return all the channels of a Workspace',
    params: [
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Maximum number of channels to return',
        default: 10
      }
    ] as unknown as INodeProperties[]
  }
}
