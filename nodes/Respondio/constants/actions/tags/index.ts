import { INodeProperties } from "n8n-workflow";
import ACTION_NAMES from "../action_names";

const colorCodeOptions = [
  { name: '', value: '' },
  { name: 'Gray', value: 'tag-grey' },
  { name: 'Red', value: 'tag-red' },
  { name: 'Orange', value: 'tag-orange' },
  { name: 'Yellow', value: 'tag-yellow' },
  { name: 'Green', value: 'tag-green' },
  { name: 'Blue', value: 'tag-blue' },
  { name: 'Indigo', value: 'tag-indigo' },
  { name: 'Purple', value: 'tag-purple' },
]

export default {
  [ACTION_NAMES.ADD_SPACE_TAG]: {
    name: 'Add a Space Tag',
    value: 'ADD_SPACE_TAG',
    description: 'Adds Tag(s) for a Contact',
    params: [
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        required: true,
        description: 'Name of space tag'
      },
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        required: false,
        description: 'Description of space tag'
      },
      {
        displayName: 'Color Code',
        name: 'colorCode',
        type: 'options',
        options: colorCodeOptions,
        required: false,
        description: 'Color code of space tag'
      },
      {
        displayName: 'Emoji',
        name: 'emoji',
        type: 'string',
        required: false,
        description: 'Emoji for space tag',
      },
    ] as unknown as INodeProperties[]
  },
  [ACTION_NAMES.DELETE_SPACE_TAG]: {
    name: 'Delete a Space Tag',
    value: 'DELETE_SPACE_TAG',
    description: 'Deletes space tag',
    params: [
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        required: true,
        description: 'Name of space tag to delete',
      },
    ] as unknown as INodeProperties[]
  },
  [ACTION_NAMES.UPDATE_SPACE_TAG]: {
    name: 'Update a Space Tag',
    value: 'UPDATE_SPACE_TAG',
    description: 'Updates a Space Tag',
    params: [
      {
        displayName: 'Current Name',
        name: 'currentName',
        type: 'string',
        required: true,
        description: 'Current Name of space tag'
      },
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        required: true,
        description: 'Name of space tag'
      },
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        required: false,
        description: 'Description of space tag'
      },
      {
        displayName: 'Color Code',
        name: 'colorCode',
        type: 'options',
        options: colorCodeOptions,
        required: false,
        description: 'Color code of space tag'
      },
      {
        displayName: 'Emoji',
        name: 'emoji',
        type: 'string',
        required: false,
        description: 'Emoji for space tag',
      },
    ] as unknown as INodeProperties[]
  },
}
