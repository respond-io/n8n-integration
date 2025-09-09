import { IExecuteFunctions, IHttpRequestOptions, ILoadOptionsFunctions, INodeProperties, INodePropertyOptions, IRequestOptions, sleep } from "n8n-workflow"

import languagesJSON from './languages.json'
import countriesJSON from './countries.json'
import { DEVELOPER_API_BASE_URL } from "../constants";
import { CustomFieldMapperReturnValue, WhatsAppTemplate } from "../types";

export enum IContactIdentifiers {
  id = 'id',
  email = 'email',
  phone = 'phone',
}

export enum IContactIdentifierNames {
  contactId = 'contactId',
  contactIdentifier = 'contactIdentifier',
}

export const generateContactIdentifierInputFields = (
  fields: IContactIdentifiers[] = [],
): INodeProperties[] => {
  const defaultIdentifierType = fields.includes(IContactIdentifiers.id) ?
    IContactIdentifiers.id :
    IContactIdentifiers.email;
  return [
    {
      displayName: 'Identifier Type',
      name: 'identifierType',
      type: 'options',
      options: fields.map((item) => ({
        name: item.charAt(0).toUpperCase() + item.slice(1),
        value: item,
      })),
      required: true,
      description: 'How would you like to identify the contact?',
      default: defaultIdentifierType
    },
    {
      displayName: 'Contact ID',
      name: 'contactId',
      type: 'number',
      required: true,
      description: 'Numeric ID of the contact',
      displayOptions: {
        show: {
          identifierType: [IContactIdentifiers.id],
        },
      },
      default: '',
    },
    {
      displayName: 'Contact Identifier',
      name: 'contactIdentifier',
      type: 'string',
      required: true,
      description: 'Email or phone of the contact',
      displayOptions: {
        show: {
          identifierType: [IContactIdentifiers.email, IContactIdentifiers.phone],
        },
      },
      default: ''
    },
  ]
}

export const constructIdentifier = (executionContext: IExecuteFunctions | ILoadOptionsFunctions) => {
  const identifierType = executionContext.getNodeParameter('identifierType', 0, 10) as IContactIdentifiers;
  const contactId = executionContext.getNodeParameter('contactId', 0, 0) as string;
  const contactIdentifier = executionContext.getNodeParameter('contactIdentifier', 0, 'email') as string;

  const identifierValue = identifierType === IContactIdentifiers.id ? contactId : contactIdentifier;

  const trimmedType = identifierType.trim().toLowerCase()
  let trimmedValue = identifierValue.toString().trim()

  // make sure to normalize the identifier value for phone number
  if (trimmedType === IContactIdentifiers.phone) trimmedValue = trimmedValue.replace(/[^0-9+]/g, '');

  return `${trimmedType}:${trimmedValue}`
}

export const generateContactInputFields = (isCreateContact: boolean = false): INodeProperties[] => {
  const result: INodeProperties[] = [
    {
      displayName: 'Contact\'s First Name',
      required: isCreateContact,
      name: 'firstName',
      type: 'string',
      description: 'First name of the contact',
      default: ''
    },
    {
      displayName: 'Contact\'s Last Name',
      required: false,
      name: 'lastName',
      type: 'string',
      description: 'Last name of the contact',
      default: ''
    },
    {
      displayName: 'Contact\'s Preferred Language',
      required: false,
      name: 'language',
      type: 'options',
      options: languagesJSON.map((language) => ({
        name: language.English,
        value: language.alpha2,
      })),
      description: 'Preferred language of the contact',
      default: 'en'
    },
    {
      displayName: 'Contact\'s Profile Picture URL',
      required: false,
      name: 'profilePic',
      type: 'string',
      description: 'Profile picture URL of the contact',
      default: ''
    },
    {
      displayName: 'Contact\'s Country',
      required: false,
      name: 'countryCode',
      type: 'options',
      options: countriesJSON.map((country) => ({
        name: country.Name,
        value: country.Code,
      })),
      description: 'Country of the contact',
      default: 'US'
    },
  ];

  if (isCreateContact) {
    const lastNameIndex = 1;
    result.splice(
      lastNameIndex + 1,
      0,
      {
        displayName: 'Contact\'s Email Address',
        required: false,
        name: 'email',
        type: 'string' as const,
        description: 'Email address of the contact',
        default: '',
        displayOptions: {
          show: {
            identifierType: [IContactIdentifiers.phone],
          }
        }
      },
      {
        displayName: 'Contact\'s Phone Number',
        required: false,
        name: 'phone',
        type: 'string' as const,
        description: 'Phone number of the contact',
        default: '',
        displayOptions: {
          show: {
            identifierType: [IContactIdentifiers.email],
          }
        }
      }
    )
  }

  result.push({
    displayName: 'Custom Fields',
    name: 'customFields',
    type: 'resourceMapper',
    default: {
      mappingMode: 'defineBelow',
      value: null,
    },
    noDataExpression: true,
    required: false,
    typeOptions: {
      resourceMapper: {
        resourceMapperMethod: 'getCustomFields',
        mode: 'add',
        addAllFields: true,
        multiKeyMatch: true,
        supportAutoMap: false,
      },
      loadOptionsDependsOn: ['identifierType'],
    }
  })

  return result;
}

function getResponseLength<TItem, TResult>(
  includeRaw: boolean,
  includeTransformed: boolean,
  raw: TItem[],
  transformed: TResult[]
): number {
  if (includeRaw) return raw.length;
  if (includeTransformed) return transformed.length;
  return 0;
}

export async function paginateWithCursor<TItem, TResult>(
  fetchPageFn: (cursor: string | null, limit: number) => Promise<{
    items: TItem[];
    nextCursor: string | null;
  }>,
  mapItem?: (item: TItem) => TResult,
  options?: {
    limit?: number;
    delayMs?: number;
    logger?: { info: (msg: string) => void };
    includeRaw?: boolean;
    maxResults?: number;
    includeTransformed?: boolean;
  }
): Promise<{ transformed: TResult[]; raw: TItem[] }> {
  const transformed: TResult[] = [];
  const includeRaw = options?.includeRaw || false;
  const raw: TItem[] = [];

  const limit = options?.limit || 10;
  const delayMs = options?.delayMs || 500;
  const maxResults = options?.maxResults ?? Infinity;
  const includeTransformed = options?.includeTransformed ?? true;

  let cursor: string | null = null;
  do {
    const { items, nextCursor } = await fetchPageFn(cursor, limit);

    // dynamically calculate the response length based on what we are including
    let responseLength = getResponseLength(includeRaw, includeTransformed, raw, transformed)

    const remaining = maxResults - responseLength;

    // Slice if adding all items would exceed maxResults
    const itemsToAdd = remaining >= items.length ? items : items.slice(0, remaining);

    if (includeTransformed && mapItem) transformed.push(...itemsToAdd.map(mapItem));
    if (includeRaw) raw.push(...itemsToAdd);

    responseLength = getResponseLength(includeRaw, includeTransformed, raw, transformed);

    if (responseLength >= maxResults || !nextCursor) {
      break;
    }

    cursor = nextCursor;
    sleep(delayMs);
  } while (true);
  return { transformed, raw };
}

type PaginatedApiResponse<T> = {
  items: T[];
  pagination?: {
    next?: string;
  };
};

export async function fetchPaginatedOptions<TItem, TResult>(
  context: ILoadOptionsFunctions | IExecuteFunctions,
  credentialsName: string,
  path: string,
  mapItem?: (item: TItem) => TResult,
  options?: {
    limit?: number;
    includeRaw?: boolean;
    maxResults?: number;
    includeTransformed?: boolean;
  }
): Promise<{ transformed: TResult[]; raw: TItem[] }> {
  const credentials = await context.getCredentials(credentialsName);
  const platformUrl = DEVELOPER_API_BASE_URL
  // remove preceding slash if exists
  const safePath = path.startsWith('/') ? path.slice(1) : path
  const fullPath = `${platformUrl}/v2/${safePath}`;

  const includeRaw = options?.includeRaw || false;
  const maxResults = options?.maxResults || Infinity;
  const includeTransformed = options?.includeTransformed || true;

  const { transformed, raw } = await paginateWithCursor<TItem, TResult>(
    async (cursor, limit) => {
      const urlObject = new URL(fullPath);
      urlObject.searchParams.set('limit', limit.toString());
      if (cursor) urlObject.searchParams.set('cursorId', cursor);

      const response = await context.helpers.request({
        url: urlObject.toString(),
        method: 'GET',
        headers: {
          Authorization: `Bearer ${credentials.apiKey}`,
        },
        json: true,
        timeout: 30000, // 30 seconds timeout
      }) as PaginatedApiResponse<TItem>;

      return {
        items: response.items,
        nextCursor: response?.pagination?.next
          ? new URL(response.pagination.next).searchParams.get('cursorId')
          : null,
      };
    },
    mapItem,
    {
      limit: options?.limit ?? 20,
      logger: context.logger,
      includeRaw,
      maxResults,
      includeTransformed,
    }
  );

  return { transformed, raw };
}

export async function callDeveloperApi<T>(
  executionContext: IExecuteFunctions | ILoadOptionsFunctions,
  {
    method,
    path,
    body,
    abortSignal,
    useHttpRequestHelper = false,
  }: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    body?: any;
    abortSignal?: any;
    useHttpRequestHelper?: boolean;
  }
): Promise<T> {
  const credentials = await executionContext.getCredentials('respondIoApi');
  const platformUrl = DEVELOPER_API_BASE_URL
  // remove preceding slash if exists
  const safePath = path.startsWith('/') ? path.slice(1) : path

  const options: IHttpRequestOptions | IRequestOptions = {
    url: `${platformUrl}/v2/${safePath}`,
    headers: { Authorization: `Bearer ${credentials.apiKey}` },
    method,
    body,
    json: true,
    abortSignal,
    timeout: 30000, // 30 seconds timeout
  };

  const response = useHttpRequestHelper ?
    executionContext.helpers.httpRequest(options) :
    executionContext.helpers.request(options);

  return response as T
}

export const constructCustomFieldFromResourceMapper = (
  customFieldMapper: CustomFieldMapperReturnValue,
): Array<{ name: string; value: string | number | boolean | Date }> => {
  const values = customFieldMapper?.value || null;
  if (!values) return [];

  return Object.entries(values).map(([key, value]) => {
    const result = {
      name: key,
      value,
    }

    const matchingSchema = customFieldMapper.schema.find((field) => field.id === key);

    if (matchingSchema && matchingSchema?.type === 'dateTime' && typeof value === 'string') {
      result.value = new Date(value).toISOString().split('T')[0];
    }

    return result
  });
}

export const getWhatsappTemplatesFunction = async (context: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> => {
  const channelId = context.getNodeParameter('channelId', 0) as string;
  const {
    transformed: allWhatsappTemplates,
    raw: rawWhatsappTemplates,
  } = await fetchPaginatedOptions<WhatsAppTemplate, INodePropertyOptions>(
    context,
    'respondIoApi',
    `/space/channel/${channelId}/mtm`,
    (item) => ({
      name: `${item.name} (${item.languageCode})`,
      value: item.id,
      description: `Namespace: ${item.namespace}, Category: ${item.category}, Status: ${item.status}`,
    }),
    { limit: 20, includeRaw: true }
  )

  const globalData = context.getWorkflowStaticData('global')
  if (!allWhatsappTemplates || allWhatsappTemplates.length === 0) {
    globalData.whatsappTemplates = undefined;
    return [{
      name: '⚠️ No WhatsApp templates found for this channel',
      value: '__EMPTY__',
      description: 'Please check if the channelId is correct or if templates exist.',
    }]
  }

  // store the raw templates in global static data for subsequent usage
  globalData.whatsappTemplates = JSON.stringify(rawWhatsappTemplates);
  return allWhatsappTemplates;
}

export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
