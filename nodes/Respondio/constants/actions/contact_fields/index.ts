import { INodeProperties } from "n8n-workflow";
import { ACTION_NAMES } from "../..";

export default {
  [ACTION_NAMES.GET_ALL_CUSTOM_FIELDS]: {
    name: 'Get all Custom Fields',
    value: 'GET_ALL_CUSTOM_FIELDS',
    description: 'Return all the Custom Fields of a Workspace',
    params: [{
      displayName: 'Limit',
      name: 'limit',
      type: 'number',
      required: false,
      description: 'Maximum number of Contacts to return',
      default: 10
    }] as unknown as INodeProperties[]
  },
  [ACTION_NAMES.FIND_CUSTOM_FIELD]: {
    name: 'Find a Custom Field',
    value: 'FIND_CUSTOM_FIELD',
    description: 'Finds a specific Contact Field',
    params: [{
      displayName: 'Custom Field ID',
      name: 'customFieldId',
      type: 'number',
      required: true,
      description: 'Custom Field ID',
      default: undefined,
    }] as unknown as INodeProperties[]
  },
  [ACTION_NAMES.CREATE_CUSTOM_FIELD]: {
    name: 'Create a Custom Field',
    value: 'CREATE_CUSTOM_FIELD',
    description: 'Creates a Custom Field',
    params: [
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        required: true,
        description: 'Name of the Custom Field',
        default: '',
      },
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        required: false,
        description: 'Description of the Custom Field',
        default: '',
      },
      {
        displayName: 'Slug',
        name: 'slug',
        type: 'string',
        required: false,
        description: 'The unique identifier for API and integrations. Field ID cannot be edited once added. Only letters, numbers, and underscores are allowed for this field.',
        default: '',
      },
      {
        displayName: 'Type',
        name: 'dataType',
        type: 'options',
        options: [
          { name: 'Text', value: 'text' },
          { name: 'List', value: 'list' },
          { name: 'Checkbox', value: 'checkbox' },
          { name: 'Email', value: 'email' },
          { name: 'Number', value: 'number' },
          { name: 'URL', value: 'url' },
          { name: 'Date', value: 'date' },
          { name: 'Time', value: 'time' },
        ],
        required: true,
        description: 'Type of the Custom Field',
        default: '',
      },
      {
        displayName: 'Options',
        name: 'allowedValues',
        type: 'string',
        typeOptions: { multipleValues: true },
        required: false,
        description: 'List Values',
        default: [],
        displayOptions: {
          show: {
            dataType: ['list'],
          },
        },
      }
    ] as unknown as INodeProperties[]
  }
}
