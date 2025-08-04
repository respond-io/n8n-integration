import { INodeProperties } from "n8n-workflow";

export default {
  generateFields: (): INodeProperties[] => [{
    displayName: 'Message',
    name: 'text',
    type: 'string',
    required: false,
    description: 'Enter your email text',
    default: '',
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
    default: '',
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
    default: '',
    displayOptions: {
      show: {
        messageType: ['email'],
      },
    },
  },
  {
    displayName: 'Attachments',
    name: 'attachments',
    type: 'collection',
    placeholder: 'Add Attachment',
    description: 'Enter your Attachments details.',
    default: {},
    options: [
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
        description: 'Choose your attachment type.',
        default: 'image'
      },
      {
        displayName: 'File Name',
        name: 'fileName',
        type: 'string',
        description: 'Enter your attachment file name.',
        default: '',
      },
      {
        displayName: 'File Link',
        name: 'url',
        type: 'string',
        description: 'Enter your attachment link.',
        default: '',
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

