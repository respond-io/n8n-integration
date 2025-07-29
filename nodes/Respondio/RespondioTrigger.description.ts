import type { INodeProperties } from 'n8n-workflow';

export const RespondIoTriggerDescription: INodeProperties[] = [
  {
    displayName: 'Event Type',
    name: 'eventType',
    type: 'options',
    options: [
      { name: 'Message Created', value: 'message.new' },
      { name: 'Conversation Closed', value: 'conversation.closed' },
    ],
    default: 'message.new',
    description: 'Event from Respond.io to trigger the workflow',
  },
];