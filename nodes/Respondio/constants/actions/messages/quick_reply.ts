import { INodeProperties } from "n8n-workflow";

export default {
  generateFields: (): INodeProperties[] => [
    {
      displayName: 'Quick Reply Title',
      required: true,
      name: 'title',
      type: 'string',
      description: 'The title of the quick reply.',
      default: '',
      displayOptions: {
        show: {
          messageType: ['quick_reply'],
        }
      }
    },
    {
      displayName: 'List of replies',
      name: 'replies',
      type: 'string',
      typeOptions: { multipleValues: true },
      required: true,
      default: [],
      description: 'The list of replies, up to 10 items.',
      displayOptions: {
        show: {
          messageType: ['quick_reply'],
        }
      }
    },
  ]
}
