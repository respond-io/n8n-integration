import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';
import { PLATFORM_API_URLS } from '../nodes/Respondio/constants';

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
      displayName: 'API Url',
      name: 'domain',
      type: 'options',
      options: [
        {
          name: 'Live',
          value: PLATFORM_API_URLS.production.developerApi,
        },
        {
          name: 'Staging',
          value: PLATFORM_API_URLS.staging.developerApi
        }
      ],
      default: PLATFORM_API_URLS.production.developerApi,
      description: 'Choose the Respond.io API URL to connect to.',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '={{ "Bearer " + $credentials.apiKey }}',
        'Content-Type': 'application/json',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{ $credentials.domain }}',
      url: '/v2/space/user?limit=1',
      method: 'GET',
      headers: { Authorization: '={{ "Bearer " + $credentials.apiKey }}' },
      timeout: 10000,
    }
  }
}
