import {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class RespondIoApi implements ICredentialType {
	name = 'respondIoApi';
	displayName = 'Respond.io API';

	documentationUrl = 'https://developers.respond.io/docs/api';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Your Respond.io API key',
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{
					name: 'Live',
					value: 'live',
				},
				{
					name: 'Staging',
					value: 'staging',
				},
			],
			default: 'live',
			description: 'Choose the Respond.io environment',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'Authorization': 'Bearer {{ $credentials.apiKey }}',
				'Content-Type': 'application/json',
			},
		},
	};

    //TODO: add credentials test later

} 