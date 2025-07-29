import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

export class RespondioV1 implements INodeType {
	description: INodeTypeDescription;


	constructor() {
		this.description = {
			displayName: 'Respond.io',
			name: 'respondio',
			group: ['input'],
			version: 1,
			description: 'Interact with Respond.io API',
			defaults: {
				name: 'Respond.io',
			},
			inputs: [NodeConnectionType.Main],
			outputs: [NodeConnectionType.Main],
			usableAsTool: true,
			credentials: [
				{
					name: 'respondIoApi',
					required: true,
				},
			],
			properties: [
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					options: [
						{ name: 'Send Message', value: 'sendMessage' },
						{ name: 'Get Contact', value: 'getContact' },
						{ name: 'Update Contact', value: 'updateContact' },
						{ name: 'Get Conversation', value: 'getConversation' },
					],
					default: 'sendMessage',
					noDataExpression: true,
				},
				{
					displayName: 'Contact ID',
					name: 'contactId',
					type: 'string',
					default: '',
					description: 'Contact ID to interact with',
					displayOptions: {
						show: {
							operation: ['sendMessage', 'getContact', 'updateContact', 'getConversation'],
						},
					},
				},
				{
					displayName: 'Message',
					name: 'message',
					type: 'string',
					default: '',
					description: 'Message to send',
					displayOptions: {
						show: {
							operation: ['sendMessage'],
						},
					},
				},
				{
					displayName: 'Contact Data',
					name: 'contactData',
					type: 'fixedCollection',
					default: {},
					description: 'Contact data to update',
					displayOptions: {
						show: {
							operation: ['updateContact'],
						},
					},
					typeOptions: {
						multipleValues: false,
					},
					options: [
						{
							displayName: 'Contact Information',
							name: 'contactInfo',
							values: [
								{
									displayName: 'Name',
									name: 'name',
									type: 'string',
									default: '',
								},
								{
									displayName: 'Email',
									name: 'email',
									type: 'string',
									default: '',
									placeholder: 'name@email.com',
								},
								{
									displayName: 'Phone',
									name: 'phone',
									type: 'string',
									default: '',
								},
							],
						},
					],
				},
			],
		};
	}


	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				const credentials = await this.getCredentials('respondIoApi');
				const environment = credentials.environment as string || 'live';
				
				// Determine API base URL based on environment
				const baseUrl = environment === 'staging' 
					? 'https://api-staging.respond.io' 
					: 'https://api.respond.io';

				let responseData: any;

				if (operation === 'sendMessage') {
					const contactId = this.getNodeParameter('contactId', itemIndex) as string;
					const message = this.getNodeParameter('message', itemIndex) as string;

					if (!contactId) {
						throw new NodeOperationError(this.getNode(), 'Contact ID is required for sending messages');
					}

					if (!message) {
						throw new NodeOperationError(this.getNode(), 'Message is required for sending messages');
					}

					responseData = await this.helpers.request({
						method: 'POST',
						url: `${baseUrl}/messages`,
						body: {
							contact_id: contactId,
							message: message,
						},
						headers: {
							Authorization: `Bearer ${credentials.apiKey}`,
							'Content-Type': 'application/json',
						},
						json: true,
					});
				} else if (operation === 'getContact') {
					const contactId = this.getNodeParameter('contactId', itemIndex) as string;

					if (!contactId) {
						throw new NodeOperationError(this.getNode(), 'Contact ID is required for getting contact');
					}

					responseData = await this.helpers.request({
						method: 'GET',
						url: `${baseUrl}/contacts/${contactId}`,
						headers: {
							Authorization: `Bearer ${credentials.apiKey}`,
						},
						json: true,
					});
				} else if (operation === 'updateContact') {
					const contactId = this.getNodeParameter('contactId', itemIndex) as string;
					const contactData = this.getNodeParameter('contactData', itemIndex) as any;

					if (!contactId) {
						throw new NodeOperationError(this.getNode(), 'Contact ID is required for updating contact');
					}

					const updateData: any = {};
					if (contactData?.contactInfo?.name) updateData.name = contactData.contactInfo.name;
					if (contactData?.contactInfo?.email) updateData.email = contactData.contactInfo.email;
					if (contactData?.contactInfo?.phone) updateData.phone = contactData.contactInfo.phone;

					responseData = await this.helpers.request({
						method: 'PUT',
						url: `${baseUrl}/contacts/${contactId}`,
						body: updateData,
						headers: {
							Authorization: `Bearer ${credentials.apiKey}`,
							'Content-Type': 'application/json',
						},
						json: true,
					});
				} else if (operation === 'getConversation') {
					const contactId = this.getNodeParameter('contactId', itemIndex) as string;

					if (!contactId) {
						throw new NodeOperationError(this.getNode(), 'Contact ID is required for getting conversation');
					}

					responseData = await this.helpers.request({
						method: 'GET',
						url: `${baseUrl}/conversations/${contactId}`,
						headers: {
							Authorization: `Bearer ${credentials.apiKey}`,
						},
						json: true,
					});
				}

				returnData.push({
					json: responseData,
					pairedItem: itemIndex,
				});

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: this.getInputData(itemIndex)[0].json,
						error,
						pairedItem: itemIndex,
					});
				} else {
					if (error.context) {
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [returnData];
	}
}

