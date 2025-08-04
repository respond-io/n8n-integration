import { INodeProperties } from "n8n-workflow";
import { generateContactIdentifierInputFields, IContactIdentifiers } from "../../../utils";
import { ACTION_NAMES } from "../action_names";

export default {
  [ACTION_NAMES.ASSIGN_OR_UNASSIGNED_CONVERSATION]: {
    name: 'Assign or unassign a Conversation',
    value: 'ASSIGN_OR_UNASSIGNED_CONVERSATION',
    description: 'Updates the assignee of a conversation',
    params: [
      ...generateContactIdentifierInputFields([
        IContactIdentifiers.id,
        IContactIdentifiers.email,
        IContactIdentifiers.phone,
      ]),
      {
        displayName: 'Assignment Type',
        name: 'assignmentType',
        type: 'options',
        options: [
          { name: 'Unassign the Contact', value: 'none' },
          { name: 'Assign by User ID', value: 'userId' },
          { name: 'Assign by User Email', value: 'userEmail' },
        ],
        required: true,
        description: 'Type of the Custom Field',
        default: '',
      },
      {
        displayName: 'Select User ID',
        name: 'assigneeUserId',
        type: 'options',
        required: true,
        description: 'The ID of the user to assign the conversation to. This ID can be found under Settings > "Users"',
        typeOptions: {
          loadOptionsMethod: 'getSpaceUsers',
          loadOptionsDependsOn: ['assignmentType']
        },
        default: '',
        displayOptions: {
          show: {
            assignmentType: ['userId'],
          },
        },
      },
      {
        displayName: 'Select User Email',
        name: 'assigneeUserEmail',
        type: 'string',
        required: true,
        description: 'The email of the user to assign the conversation to. This email can be found under Settings > "Users"',
        typeOptions: {
          loadOptionsMethod: 'getSpaceUsers',
          loadOptionsDependsOn: ['assignmentType']
        },
        default: '',
        displayOptions: {
          show: {
            assignmentType: ['userEmail'],
          },
        },
      }
    ] as unknown as INodeProperties[]
  },
  [ACTION_NAMES.OPEN_OR_CLOSE_CONVERSATION]: {
    name: 'Open or close a Conversation',
    value: 'OPEN_OR_CLOSE_CONVERSATION',
    description: 'Updates the status of a conversation',
    params: [
      ...generateContactIdentifierInputFields([
        IContactIdentifiers.id,
        IContactIdentifiers.email,
        IContactIdentifiers.phone,
      ]),
      {
        displayName: 'Conversation Status',
        name: 'status',
        type: 'options',
        required: true,
        description: 'Status of the conversation',
        options: [
          { name: 'Open', value: 'open' },
          { name: 'Close', value: 'close' },
        ],
      },
      {
        displayName: 'Select Conversation Category',
        name: 'category',
        type: 'string',
        required: true,
        description: 'The category of the conversation.',
        typeOptions: {
          loadOptionsMethod: 'getClosingNotes',
          loadOptionsDependsOn: ['status']
        },
        default: '',
        displayOptions: {
          show: {
            status: ['close'],
          },
        },
      },
      {
        displayName: 'Summary',
        name: 'summary',
        type: 'string',
        required: false,
        description: 'Summary of the conversation',
        default: '',
        displayOptions: {
          show: {
            status: ['close'],
          },
        },
      }
    ] as unknown as INodeProperties[]
  }
}
