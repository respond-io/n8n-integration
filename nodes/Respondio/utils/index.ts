import { ILoadOptionsFunctions, INodeProperties } from "n8n-workflow"
import { setTimeout as waitFor } from 'timers/promises';

import languagesJSON from './languages.json'
import countriesJSON from './countries.json'
import { PLATFORM_API_URLS } from "../constants";

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
      default: IContactIdentifiers.id,
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

export const constructIdentifier = (identifierType: IContactIdentifiers, identifierValue: string | number) => {
  const trimmedValue = identifierValue.toString().trim()
  const trimmedType = identifierType.trim().toLowerCase()
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
      default: '',
    },
    {
      displayName: 'Contact\'s Last Name',
      required: false,
      name: 'lastName',
      type: 'string',
      description: 'Last name of the contact',
      default: '',
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
      default: '',
    },
    {
      displayName: 'Contact\'s Profile Picture URL',
      required: false,
      name: 'profilePic',
      type: 'string',
      description: 'Profile picture URL of the contact',
      default: '',
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
      default: '',
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
      },
      {
        displayName: 'Contact\'s Phone Number',
        required: false,
        name: 'phone',
        type: 'string' as const,
        description: 'Phone number of the contact',
        default: '',
      }
    )
  }

  return result;
}

export async function paginateWithCursor<TItem, TResult>(
  fetchPageFn: (cursor: string | null, limit: number) => Promise<{
    items: TItem[];
    nextCursor: string | null;
  }>,
  mapItem: (item: TItem) => TResult,
  options?: {
    limit?: number;
    delayMs?: number;
    logger?: { info: (msg: string) => void };
    includeRaw?: boolean;
  }
): Promise<{ transformed: TResult[]; raw: TItem[] }> {
  const transformed: TResult[] = [];
  const includeRaw = options?.includeRaw || false;
  const raw: TItem[] = [];

  const limit = options?.limit || 10;
  const delayMs = options?.delayMs || 500;
  const logger = options?.logger || null;

  let cursor: string | null = null;

  do {
    const { items, nextCursor } = await fetchPageFn(cursor, limit);
    if (logger) logger.info(`Fetched ${items.length} items`);
    transformed.push(...items.map(mapItem));
    if (includeRaw) raw.push(...items);

    cursor = nextCursor;
    if (cursor) await waitFor(delayMs);
  } while (cursor);

  return { transformed, raw };
}

type PaginatedApiResponse<T> = {
  items: T[];
  pagination?: {
    next?: string;
  };
};

export async function fetchPaginatedOptions<TItem, TResult>(
  context: ILoadOptionsFunctions,
  credentialsName: string,
  path: string,
  mapItem: (item: TItem) => TResult,
  options?: {
    limit?: number;
    logLabel?: string;
    includeRaw?: boolean;
  }
): Promise<{ transformed: TResult[]; raw: TItem[] }> {
  const credentials = await context.getCredentials(credentialsName);
  const env = credentials?.environment as 'production' | 'staging' || 'staging';
  const platformUrl = PLATFORM_API_URLS[env];
  const fullPath = `${platformUrl}${path}`;
  const logLabel = options?.logLabel ?? path;

  const includeRaw = options?.includeRaw || false;

  const { transformed, raw } = await paginateWithCursor<TItem, TResult>(
    async (cursor, limit) => {
      const urlObject = new URL(fullPath);
      urlObject.searchParams.set('limit', limit.toString());
      if (cursor) urlObject.searchParams.set('cursorId', cursor);

      context.logger.info(`Fetching ${logLabel} from URL: ${urlObject.toString()}`);

      const response = await context.helpers.request({
        url: urlObject.toString(),
        method: 'GET',
        headers: {
          Authorization: `Bearer ${credentials.apiKey}`,
        },
        json: true,
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
    }
  );

  context.logger.info(`Total ${logLabel} fetched: ${transformed.length}`);
  return { transformed, raw };
}

