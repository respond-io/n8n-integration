import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';
import { DEVELOPER_API_BASE_URL } from '../nodes/Respondio/constants';

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
    }
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
      baseURL: DEVELOPER_API_BASE_URL,
      url: '/v2/space/user?limit=1',
      method: 'GET',
      headers: { Authorization: '={{ "Bearer " + $credentials.apiKey }}' },
      timeout: 10000,
    }
  }
}
