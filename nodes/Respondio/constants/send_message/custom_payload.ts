import { INodeProperties } from "n8n-workflow";

export default {
  generateFields: (): INodeProperties[] => [
    {
      displayName: 'Custom Payload Description',
      required: true,
      name: 'customPayloadDescription',
      type: 'notice',
      description: 'Refer to the channel documentation for the required payload structure. Must be a valid JSON object',
      default: '',
      displayOptions: {
        show: {
          messageType: ['custom_payload'],
        }
      }
    },
    {
      displayName: 'Custom Payload',
      name: 'payload',
      type: 'json',
      required: true,
      default: '{}',
      description: 'Enter your custom payload as a JSON object.',
      displayOptions: {
        show: {
          messageType: ['custom_payload'],
        }
      }
    },
  ]
}
