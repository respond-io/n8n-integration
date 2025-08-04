import { INodeProperties } from "n8n-workflow";

export default {
  generateFields: (): INodeProperties[] => [
    {
      displayName: 'message',
      required: true,
      name: 'text',
      type: 'string',
      description: 'Enter your text message',
      default: '',
      displayOptions: {
        show: {
          messageType: ['text'],
        }
      }
    },
    {
      displayName: 'Message Tag',
      name: 'messageTag',
      type: 'options',
      required: true,
      options: [
        { name: 'ACCOUNT_UPDATE', value: 'ACCOUNT_UPDATE' },
        { name: 'POST_PURCHASE_UPDATE', value: 'POST_PURCHASE_UPDATE' },
        { name: 'CONFIRMED_EVENT_UPDATE', value: 'CONFIRMED_EVENT_UPDATE' },
      ],
      default: 'ACCOUNT_UPDATE',
      description: 'Required if the channel is facebook or instagram and the message is being sent outside the standard 24 hour messaging window',
      displayOptions: {
        show: {
          messageType: ['text'],
        }
      }
    },
  ]
}
