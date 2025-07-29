import {
    INodeType,
    INodeTypeDescription,
    IWebhookFunctions,
    IHookFunctions,
    IWebhookResponseData,
    NodeConnectionType,
  } from 'n8n-workflow';
  
  export class RespondioTrigger implements INodeType {
    description: INodeTypeDescription;
    webhookMethods: any;


    constructor() {
      this.description = {
        displayName: 'Respond.io Trigger',
        name: 'respondioTrigger',
        icon: 'file:respondio.svg',
        group: ['trigger'],
        version: 1,
        description: 'Trigger workflow via Respond.io webhook',
        defaults: {
          name: 'Respond.io Trigger',
        },
        inputs: [],
        outputs: [NodeConnectionType.Main],
        credentials: [
          {
            name: 'respondIoApi',
            required: true,
          },
        ],
        webhooks: [
          {
            name: 'default',
            httpMethod: 'POST',
            responseMode: 'onReceived',
            path: 'respondio',
          },
        ],
        properties: [
          {
            displayName: 'Event Type',
            name: 'eventType',
            type: 'options',
            options: [
              { name: 'Message Created', value: 'message.new' },
              { name: 'Conversation Closed', value: 'conversation.closed' },
            ],
            default: 'message.new',
          },
        ],
      };
    
      this.webhookMethods = {
        default: {
          async create(this: IHookFunctions): Promise<boolean> {
            const credentials = await this.getCredentials('respondIoApi');
            const webhookUrl = this.getNodeWebhookUrl('default');
            const eventType = this.getNodeParameter('eventType', 0) as string;
    
            const response = await this.helpers.request({
              method: 'POST',
              url: 'https://api.respond.io/webhooks',
              headers: {
                Authorization: `Bearer ${credentials.apiKey}`,
              },
              body: {
                url: webhookUrl,
                event: eventType,
              },
              json: true,
            });
    
            // Store webhook ID for later cleanup
            this.getWorkflowStaticData('global').respondioWebhookId = response.id;
    
            return true;
          },
    
          async delete(this: IHookFunctions): Promise<boolean> {
            const credentials = await this.getCredentials('respondIoApi');
            const staticData = this.getWorkflowStaticData('global');
            const webhookId = staticData.respondioWebhookId;
    
            if (!webhookId) return true;
    
            await this.helpers.request({
              method: 'DELETE',
              url: `https://api.respond.io/webhooks/${webhookId}`,
              headers: {
                Authorization: `Bearer ${credentials.apiKey}`,
              },
            });
    
            return true;
          },
    
          async checkExists(this: IHookFunctions): Promise<boolean> {
            // Optional: check if the webhook already exists
            return false;
          },
        },
      };
    }
    
    async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
      const req = this.getRequestObject();
      const body = req.body;
    
      return {
        workflowData: [[{ json: body }]],
      };
    }
  }

