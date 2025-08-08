import { INodeProperties } from "n8n-workflow";

export default {
  generateFields: (): INodeProperties[] => [{
    displayName: 'Message',
    name: 'text',
    type: 'string',
    required: true,
    description: 'Enter your email text',
    default: '',
    typeOptions: { rows: 20 },
    displayOptions: {
      show: {
        messageType: ['email'],
      },
    },
  },
  {
    displayName: 'Subject',
    name: 'subject',
    type: 'string',
    required: false,
    description: 'Enter your email subject',
    default: '',
    displayOptions: {
      show: {
        messageType: ['email'],
      },
    },
  },
  {
    displayName: 'CC',
    name: 'cc',
    type: 'string',
    typeOptions: { multipleValues: true },
    required: false,
    description: 'Enter your Email CC',
    default: [],
    displayOptions: {
      show: {
        messageType: ['email'],
      },
    },
  },
  {
    displayName: 'BCC',
    name: 'bcc',
    type: 'string',
    typeOptions: { multipleValues: true },
    required: false,
    description: 'Enter your Email BCC',
    default: [],
    displayOptions: {
      show: {
        messageType: ['email'],
      },
    },
  },
  {
    displayName: 'Attachments',
    name: 'attachmentCollection',
    type: 'fixedCollection',
    placeholder: 'Add Attachment',
    description: 'Add one or more attachments.',
    typeOptions: { multipleValues: true },
    default: [],
    required: false,
    options: [
      {
        displayName: 'Attachment',
        name: 'attachments',
        values: [
          {
            displayName: 'Attachment Type',
            name: 'type',
            type: 'options',
            options: [
              { name: 'Image', value: 'image' },
              { name: 'Video', value: 'video' },
              { name: 'Audio', value: 'audio' },
              { name: 'File', value: 'file' },
            ],
            description: 'Choose the type of attachment.',
            default: 'image',
          },
          {
            displayName: 'File Name',
            name: 'fileName',
            type: 'string',
            description: 'Enter the file name.',
            default: '',
          },
          {
            displayName: 'File Link',
            name: 'url',
            type: 'string',
            description: 'Enter the URL of the file.',
            default: '',
          },
        ],
      },
    ],
    displayOptions: {
      show: {
        messageType: ['email'],
      },
    },
  },
  {
    displayName: 'Reply To Message ID',
    name: 'replyToMessageId',
    type: 'string',
    required: false,
    description: 'Enter the Message ID of the message you wish to reply to.',
    default: '',
    displayOptions: {
      show: {
        messageType: ['email'],
      },
    },
  }]
}

