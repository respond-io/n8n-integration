import { INodeProperties } from "n8n-workflow";

export default {
  generateFields: (): INodeProperties[] => [
    {
      displayName: 'Attachment Type',
      required: true,
      name: 'attachmentType',
      type: 'options',
      options: [
        { name: 'Image', value: 'image' },
        { name: 'Video', value: 'video' },
        { name: 'Audio', value: 'audio' },
        { name: 'File', value: 'file' }
      ],
      description: 'Choose your attachment type.',
      default: 'image',
      displayOptions: {
        show: {
          messageType: ['attachments']
        }
      }
    },
    {
      displayName: 'Attachment Link',
      required: true,
      name: 'attachmentLink',
      type: 'string',
      description: 'The URL link of the attachment.',
      default: '',
      displayOptions: {
        show: {
          messageType: ['attachments']
        }
      }
    },
  ]
}
