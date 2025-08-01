import { INodePropertyOptions } from "n8n-workflow";

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
      // value: 'getAllChannels',
      value: 'GET_ALL_CHANNELS',
      description: 'Return all the channels of a Workspace',
      params: [{}]
    }
  },
  CLOSING_NOTES: {
    GET_ALL_CLOSING_NOTES: {
      name: 'Get all Closing Notes',
      // value: 'getAllClosingNotes',
      value: 'GET_ALL_CLOSING_NOTES',
      description: 'Return all the Closing Notes of a Workspace',
      params: [{}]
    }
  },
  COMMENTS: {
    ADD_COMMENT: {
      name: 'Add a Comment',
      // value: 'addComment',
      value: 'ADD_COMMENT',
      description: 'Adds a comment to a conversation',
      params: [
        {
          displayName: 'Identifier Type',
          name: 'identifierType',
          type: 'options',
          options: [
            { name: 'ID', value: 'id' },
            { name: 'Email', value: 'email' },
            { name: 'Phone', value: 'phone' },
          ],
          required: true,
          description: 'How would you like to identify the contact?'
        },
        {
          displayName: 'Contact ID',
          name: 'contactId',
          type: 'number',
          required: true,
          description: 'Numeric ID of the contact',
          displayOptions: {
            show: {
              identifierType: ['id'],
            },
          },
        },
        {
          displayName: 'Contact Identifier',
          name: 'contactIdentifier',
          type: 'string',
          required: true,
          description: 'Email or phone of the contact',
          displayOptions: {
            show: {
              identifierType: ['email', 'phone'],
            },
          },
        },
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
      // value: 'addSpaceTag',
      value: 'ADD_SPACE_TAG',
      description: 'Adds Tag(s) for a Contact',
      params: [{}]
    },
    DELETE_SPACE_TAG: {
      name: 'Delete a Space Tag',
      // value: 'deleteSpaceTag',
      value: 'DELETE_SPACE_TAG',
      description: 'Deletes space tag',
      params: [{}]
    },
    UPDATE_SPACE_TAG: {
      name: 'Update a Space Tag',
      // value: 'updateSpaceTag',
      value: 'UPDATE_SPACE_TAG',
      description: 'Updates a Space Tag',
      params: [{}]
    },
    REMOVE_TAGS: {
      name: 'Remove many Tags',
      // value: 'removeTags',
      value: 'REMOVE_TAGS',
      description: 'Removes Tag(s) for a Contact',
      params: [{}]
    },
    DELETE_CONTACT: {
      name: 'Delete a Contact',
      // value: 'deleteContact',
      value: 'DELETE_CONTACT',
      description: 'Deletes a Contact',
      params: [{}]
    },
    MERGE_CONTACT: {
      name: 'Merge a Contact',
      // value: 'mergeContact',
      value: 'MERGE_CONTACT',
      description: 'Merges two Contacts',
      params: [{}]
    },
    FIND_CONTACT_CHANNELS: {
      name: 'Find many Contact Channels',
      // value: 'getContactChannels',
      value: 'FIND_CONTACT_CHANNELS',
      description: 'Find connected Channels of a Contact',
      params: [{}]
    },
    FIND_CONTACT: {
      name: 'Find a Contact',
      // value: 'getContact',
      value: 'FIND_CONTACT',
      description: 'Finds a specific Contact by identifier',
      params: [{}]
    },
    ADD_TAGS: {
      name: 'Add many Tags',
      // value: 'addTags',
      value: 'ADD_TAGS',
      description: 'Adds Tag(s) for a Contact',
      params: [{}]
    },
    GET_MANY_CONTACTS: {
      name: 'Get many Contacts',
      // value: 'getManyContacts',
      value: 'GET_MANY_CONTACTS',
      description: 'Return multiple Contacts that matches with the search condition',
      params: [
        {
          displayName: 'Search',
          name: 'search',
          type: 'string',
          required: false,
          description: 'Search term for filtering Contacts'
        },
        {
          displayName: 'Category',
          name: 'category',
          type: 'string',
          required: false,
          description: 'Category of the contact field to filter on',
        },
        {
          displayName: 'Field',
          name: 'field',
          type: 'string',
          required: false,
          description: 'Specific contact field to match',
        },
        {
          displayName: 'Operator',
          name: 'operator',
          type: 'options',
          options: [
            { name: 'Equals', value: 'eq' },
            { name: 'Not Equals', value: 'neq' },
            { name: 'Contains', value: 'contains' },
            { name: 'Does Not Contain', value: 'ncontains' },
          ],
          required: false,
          description: 'Comparison operator to use for filtering',
        },
        {
          displayName: 'Value',
          name: 'value',
          type: 'string',
          required: false,
          description: 'Value to compare against',
        },
        {
          displayName: 'Condition Operator',
          name: 'conditionOperator',
          type: 'options',
          options: [
            { name: 'AND', value: 'and' },
            { name: 'OR', value: 'or' },
          ],
          required: false,
          description: 'Logical operator to combine multiple conditions',
        },
      ]
    },
    UPDATE_CONTACT: {
      name: 'Update a Contact',
      // value: 'updateContact',
      value: 'UPDATE_CONTACT',
      description: 'pdates Contact Field(s) of a Contact. Leave the contact field empty if you want to remain the existing value.',
      params: [{}]
    },
    CREATE_OR_UPDATE_CONTACT: {
      name: 'Create or Update a Contact',
      // value: 'createOrUpdateContact',
      value: 'CREATE_OR_UPDATE_CONTACT',
      description: 'Creates or updates a Contact. Leave the contact field empty if you want to store an empty value or remain the existing value. It is highly recommended to add a delay before executing a new action after creating a new contact, as processing time is required',
      params: [{}]
    },
    CREATE_CONTACT: {
      name: 'Create a Contact',
      // value: 'createContact',
      value: 'CREATE_CONTACT',
      description: 'Creates a Contact. Leave the contact field empty if you want to store an empty value or remain the existing value. It is highly recommended to add a delay before executing a new action after creating a new contact, as processing time is required',
      params: [{}]
    }
  },
  CONTACT_FIELDS: {
    GET_ALL_CUSTOM_FIELDS: {
      name: 'Get all Custom Fields',
      // value: 'getAllCustomFields',
      value: 'GET_ALL_CUSTOM_FIELDS',
      description: 'Return all the Custom Fields of a Workspace',
      params: [{}]
    },
    FIND_CUSTOM_FIELD: {
      name: 'Find a Custom Field',
      // value: 'getCustomField',
      value: 'FIND_CUSTOM_FIELD',
      description: 'Finds a specific Contact Field',
      params: [{
        displayName: 'Custom Field ID',
        name: 'customFieldId',
        type: 'string',
        required: true,
        description: 'Custom Field ID',
      }]
    },
    CREATE_CUSTOM_FIELD: {
      name: 'Create a Custom Field',
      // value: 'createCustomField',
      value: 'CREATE_CUSTOM_FIELD',
      description: 'Creates a Custom Field',
      params: [{}]
    }
  },
  CONVERSATIONS: {
    ASSIGN_OR_UNASSIGNED_CONVERSATION: {
      name: 'Assign or unassign a Conversation',
      // value: 'updateContactAssignee',
      value: 'ASSIGN_OR_UNASSIGNED_CONVERSATION',
      description: 'Updates the assignee of a conversation',
      params: [{}]
    },
    OPEN_OR_CLOSE_CONVERSATION: {
      name: 'Open or close a Conversation',
      // value: 'updateContactConversationStatus',
      value: 'OPEN_OR_CLOSE_CONVERSATION',
      description: 'Updates the status of a conversation',
      params: [{}]
    }
  },
  LIFECYCLE: {
    REMOVE_CONTACT_LIFECYCLE: {
      name: 'Remove a Contact Lifecycle',
      // value: 'unassignContactLifecycle',
      value: 'REMOVE_CONTACT_LIFECYCLE',
      description: 'Unassign contact lifecycle stage',
      params: [{}]
    },
    UPDATE_CONTACT_LIFECYCLE: {
      name: 'Update a Contact Lifecycle',
      // value: 'updateContactLifecycle',
      value: 'UPDATE_CONTACT_LIFECYCLE',
      description: 'Update contact lifecycle stage',
      params: [{}]
    },
  },
  MESSAGES: {
    FIND_MESSAGE: {
      name: 'Find a Message',
      // value: 'getContactMessage',
      value: 'FIND_MESSAGE',
      description: 'Finds a specific message by identifier',
      params: [{}]
    },
    SEND_MESSAGE: {
      name: 'Send a Message',
      // value: 'sendMessage',
      value: 'SEND_MESSAGE',
      description: 'Sends a message to a contact',
      params: [{}]
    },
  },
  USER: {
    FIND_USER: {
      name: 'Find a User',
      // value: 'getUser',
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
      // value: 'getAllUsers',
      value: 'GET_ALL_USERS',
      description: 'Return all the users of a Workspace',
      params: [{}]
    }
  }
} as const satisfies Record<string, Record<string, INodePropertyOptions & { params: Array<Record<string, Object>> }>>;

const PLATFORM_API_URLS = {
  staging: 'https://staging.respond.io/integration',
  production: 'https://app.respond.io/integration',
  test: 'https://a8b4597fcf19.ngrok-free.app/integration'
}

export { TRIGGER_SETTINGS, TRIGGER_SETTINGS_EVENT_SOURCES, PLATFORM_API_URLS, ACTION_SETTINGS };
