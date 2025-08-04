import { INodeProperties, INodePropertyOptions } from "n8n-workflow";
import { generateContactIdentifierInputFields, generateContactInputFields, IContactIdentifiers } from "../utils";
import send_message from "./send_message";

const TRIGGER_SETTINGS = {
  CONTACT_ASSIGNEE_UPDATED: {
    name: 'Contact Assignee Updated',
    value: 'contactAssigneeUpdated',
    description: 'Trigger on contact assignee being updated',
  },
  CONTACT_TAG_UPDATED: {
    name: 'Contact Tag Updated',
    value: 'contactTagUpdated',
    description: 'Trigger on contact tag being updated',
  },
  CONTACT_UPDATED: {
    name: 'Contact Updated',
    value: 'contactUpdated',
    description: 'Trigger on contact being updated',
  },
  CONVERSATION_CLOSED: {
    name: 'Conversation Closed',
    value: 'conversationClosed',
    description: 'Trigger on conversation being closed',
  },
  CONVERSATION_OPENED: {
    name: 'Conversation Opened',
    value: 'conversationOpened',
    description: 'Trigger on conversation being opened',
  },
  NEW_COMMENT: {
    name: 'New Comment',
    value: 'newComment',
    description: 'Trigger on new comment being added to a conversation',
  },
  NEW_CONTACT: {
    name: 'New Contact',
    value: 'newContact',
    description: 'Trigger on new contact being created',
  },
  NEW_INCOMING_MESSAGE: {
    name: 'New Incoming Message',
    value: 'newIncomingMessage',
    description: 'Trigger on new incoming message',
  },
  NEW_OUTGOING_MESSAGE: {
    name: 'New Outgoing Message',
    value: 'newOutgoingMessage',
    description: 'Trigger on new outgoing message',
  },
  CONTACT_LIFECYCLE_UPDATED: {
    name: 'Contact Lifecycle Updated',
    value: 'lifecycleUpdated',
    description: 'Trigger on contact lifecycle being updated',
  },
} as const satisfies Record<string, INodePropertyOptions>;

export type TriggerSettingKey = keyof typeof TRIGGER_SETTINGS;

const TRIGGER_SETTINGS_EVENT_SOURCES = {
  CONVERSATION_CLOSED: [
    { name: 'User', value: 'user' },
    { name: 'Workflow', value: 'workflow' },
    { name: 'Developer API', value: 'api' },
    { name: 'Zapier', value: 'zapier' },
    { name: 'Bot', value: 'bot' },
    { name: 'Make', value: 'make' },
  ],
  CONVERSATION_OPENED: [
    { name: 'User', value: 'user' },
    { name: 'Contact', value: 'contact' },
    { name: 'Workflow', value: 'workflow' },
    { name: 'Api', value: 'api' },
    { name: 'Zapier', value: 'zapier' },
    { name: 'Make', value: 'make' },
    { name: 'Click-to-Chat-Ads', value: 'ctc_ads' },
  ],
  NEW_OUTGOING_MESSAGE: [
    { name: 'User', value: 'user' },
    { name: 'Workflow', value: 'workflow' },
    { name: 'Developer API', value: 'api' },
    { name: 'Zapier', value: 'zapier' },
    { name: 'Bot', value: 'bot' },
    { name: 'Echo', value: 'echo' },
    { name: 'Make', value: 'make' },
  ]
}

const ACTION_SETTINGS = {
  CHANNELS: {
    GET_ALL_CHANNELS: {
      name: 'Get all Channels',
      value: 'GET_ALL_CHANNELS',
      description: 'Return all the channels of a Workspace',
      params: [{}]
    }
  },
  CLOSING_NOTES: {
    GET_ALL_CLOSING_NOTES: {
      name: 'Get all Closing Notes',
      value: 'GET_ALL_CLOSING_NOTES',
      description: 'Return all the Closing Notes of a Workspace',
      params: [{}]
    }
  },
  COMMENTS: {
    ADD_COMMENT: {
      name: 'Add a Comment',
      value: 'ADD_COMMENT',
      description: 'Adds a comment to a conversation',
      params: [
        ...generateContactIdentifierInputFields([
          IContactIdentifiers.id,
          IContactIdentifiers.email,
          IContactIdentifiers.phone,
        ]),
        {
          displayName: 'Comment',
          name: 'comment',
          type: 'string',
          required: true,
          description: 'Wrap mentioned user ids in $userId$, for example: $1$'
        }
      ]
    }
  },
  CONTACTS: {
    ADD_SPACE_TAG: {
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
          options: [
            { name: 'Gray', value: 'tag-grey' },
            { name: 'Red', value: 'tag-red' },
            { name: 'Orange', value: 'tag-orange' },
            { name: 'Yellow', value: 'tag-yellow' },
            { name: 'Green', value: 'tag-green' },
            { name: 'Blue', value: 'tag-blue' },
            { name: 'Indigo', value: 'tag-indigo' },
            { name: 'Purple', value: 'tag-purpole' },
          ],
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
      ]
    },
    DELETE_SPACE_TAG: {
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
      ]
    },
    UPDATE_SPACE_TAG: {
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
          options: [
            { name: 'Gray', value: 'tag-grey' },
            { name: 'Red', value: 'tag-red' },
            { name: 'Orange', value: 'tag-orange' },
            { name: 'Yellow', value: 'tag-yellow' },
            { name: 'Green', value: 'tag-green' },
            { name: 'Blue', value: 'tag-blue' },
            { name: 'Indigo', value: 'tag-indigo' },
            { name: 'Purple', value: 'tag-purpole' },
          ],
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
      ]
    },
    REMOVE_TAGS: {
      name: 'Remove many Tags',
      value: 'REMOVE_TAGS',
      description: 'Removes Tag(s) for a Contact',
      params: [
        ...generateContactIdentifierInputFields([
          IContactIdentifiers.id,
          IContactIdentifiers.email,
          IContactIdentifiers.phone,
        ]),
        {
          displayName: 'Select a Tag to Delete',
          name: 'tagId',
          type: 'options',
          typeOptions: {
            loadOptionsMethod: 'getTagsForContact',
            loadOptionsDependsOn: ['identifierType', 'contactId', 'contactIdentifier'],
          },
          required: true,
          description: 'Choose the tag to delete from this contact',
        },
      ]
    },
    DELETE_CONTACT: {
      name: 'Delete a Contact',
      value: 'DELETE_CONTACT',
      description: 'Deletes a Contact',
      params: [
        ...generateContactIdentifierInputFields([
          IContactIdentifiers.id,
          IContactIdentifiers.email,
          IContactIdentifiers.phone,
        ]),
      ]
    },
    FIND_CONTACT_CHANNELS: {
      name: 'Find many Contact Channels',
      value: 'FIND_CONTACT_CHANNELS',
      description: 'Find connected Channels of a Contact',
      params: [
        ...generateContactIdentifierInputFields([
          IContactIdentifiers.id,
          IContactIdentifiers.email,
          IContactIdentifiers.phone,
        ]),
      ]
    },
    FIND_CONTACT: {
      name: 'Find a Contact',
      value: 'FIND_CONTACT',
      description: 'Finds a specific Contact by identifier',
      params: [
        ...generateContactIdentifierInputFields([
          IContactIdentifiers.id,
          IContactIdentifiers.email,
          IContactIdentifiers.phone,
        ]),
      ]
    },
    ADD_TAGS: {
      name: 'Add many Tags',
      value: 'ADD_TAGS',
      description: 'Adds Tag(s) for a Contact',
      params: [
        ...generateContactIdentifierInputFields([
          IContactIdentifiers.id,
          IContactIdentifiers.email,
          IContactIdentifiers.phone,
        ]),
        {
          displayName: 'Tags',
          name: 'tags',
          type: 'string',
          typeOptions: { multipleValues: true },
          default: [],
          placeholder: 'TagName',
          description: 'List of tags as strings',
          required: true
        }
      ]
    },
    GET_MANY_CONTACTS: {
      name: 'Get many Contacts',
      value: 'GET_MANY_CONTACTS',
      description: 'Return multiple Contacts that matches with the search condition',
      params: [
        {
          displayName: 'Search',
          name: 'search',
          type: 'string',
          required: false,
          description: 'Search term for filtering Contacts',
          default: ''
        },
        {
          displayName: 'Limit',
          name: 'limit',
          type: 'number',
          required: false,
          description: 'Maximum number of Contacts to return',
          default: 10
        }
      ]
    },
    UPDATE_CONTACT: {
      name: 'Update a Contact',
      value: 'UPDATE_CONTACT',
      description: 'Updates Contact Field(s) of a Contact. Leave the contact field empty if you want to remain the existing value.',
      params: [
        ...generateContactIdentifierInputFields([
          IContactIdentifiers.id,
          IContactIdentifiers.email,
          IContactIdentifiers.phone,
        ]),
        ...generateContactInputFields(false),
      ]
    },
    CREATE_OR_UPDATE_CONTACT: {
      name: 'Create or Update a Contact',
      value: 'CREATE_OR_UPDATE_CONTACT',
      description: 'Creates or updates a Contact. Leave the contact field empty if you want to store an empty value or remain the existing value. It is highly recommended to add a delay before executing a new action after creating a new contact, as processing time is required',
      params: [
        ...generateContactIdentifierInputFields([
          IContactIdentifiers.id,
          IContactIdentifiers.email,
          IContactIdentifiers.phone,
        ]),
        ...generateContactInputFields(false),
      ]
    },
    CREATE_CONTACT: {
      name: 'Create a Contact',
      value: 'CREATE_CONTACT',
      description: 'Creates a Contact. Leave the contact field empty if you want to store an empty value or remain the existing value. It is highly recommended to add a delay before executing a new action after creating a new contact, as processing time is required',
      params: [
        ...generateContactIdentifierInputFields([
          IContactIdentifiers.email,
          IContactIdentifiers.phone,
        ]),
        ...generateContactInputFields(true),
      ]
    }
  },
  CONTACT_FIELDS: {
    GET_ALL_CUSTOM_FIELDS: {
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
      }]
    },
    FIND_CUSTOM_FIELD: {
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
      }]
    },
    CREATE_CUSTOM_FIELD: {
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
      ]
    }
  },
  CONVERSATIONS: {
    ASSIGN_OR_UNASSIGNED_CONVERSATION: {
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
      ]
    },
    OPEN_OR_CLOSE_CONVERSATION: {
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
      ]
    }
  },
  LIFECYCLE: {
    REMOVE_CONTACT_LIFECYCLE: {
      name: 'Remove a Contact Lifecycle',
      value: 'REMOVE_CONTACT_LIFECYCLE',
      description: 'Unassign contact lifecycle stage',
      params: generateContactIdentifierInputFields([
        IContactIdentifiers.id,
        IContactIdentifiers.email,
        IContactIdentifiers.phone,
      ])
    },
    UPDATE_CONTACT_LIFECYCLE: {
      name: 'Update a Contact Lifecycle',
      value: 'UPDATE_CONTACT_LIFECYCLE',
      description: 'Update contact lifecycle stage',
      params: [
        ...generateContactIdentifierInputFields([
          IContactIdentifiers.id,
          IContactIdentifiers.email,
          IContactIdentifiers.phone,
        ]),
        {
          displayName: 'Lifecycle Stage Name',
          name: 'name',
          type: 'string',
          required: true,
          description: 'Name of the lifecycle stage',
          default: ''
        },
      ]
    },
  },
  MESSAGES: {
    FIND_MESSAGE: {
      name: 'Find a Message',
      value: 'FIND_MESSAGE',
      description: 'Finds a specific message by identifier',
      params: [
        ...generateContactIdentifierInputFields([
          IContactIdentifiers.id,
          IContactIdentifiers.email,
          IContactIdentifiers.phone,
        ]),
        {
          displayName: 'Message ID',
          name: 'messageId',
          type: 'number',
          required: true,
          description: 'Numeric ID of the message',
          default: 0,
        }
      ]
    },
    // do this last
    SEND_MESSAGE: {
      name: 'Send a Message',
      value: 'SEND_MESSAGE',
      description: 'Sends a message to a contact',
      // @ts-expect-error
      params: send_message
    },
  },
  USER: {
    FIND_USER: {
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
    GET_ALL_USERS: {
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
} as const satisfies Record<string, Record<string, INodePropertyOptions & { params: Array<INodeProperties> | Array<Object> }>>;

const PLATFORM_API_URLS = {
  staging: 'https://staging.respond.io/integration',
  production: 'https://app.respond.io/integration',
  test: 'https://a8b4597fcf19.ngrok-free.app/integration'
}

export { TRIGGER_SETTINGS, TRIGGER_SETTINGS_EVENT_SOURCES, PLATFORM_API_URLS, ACTION_SETTINGS };
