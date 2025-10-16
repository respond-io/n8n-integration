import { IExecuteFunctions, INodeExecutionData, INodePropertyOptions, NodeExecutionWithMetadata } from "n8n-workflow";
import { ACTION_NAMES } from "../../constants/actions/action_names";
import { callDeveloperApi, constructCustomFieldFromResourceMapper, constructIdentifier, fetchPaginatedOptions } from "../../utils";
import {
  CreateContactPayload,
  CreateContactResponse,
  CustomFieldMapperReturnValue,
  DeleteManyTagsResponse,
  FindContactChannelsItem,
  GetContactResponse,
  GetManyContactsResponse,
} from "../../types";

const actionHandlers = {
  [ACTION_NAMES.REMOVE_TAGS]: async (executionContext: IExecuteFunctions, itemIndex: number) => {
    const identifier = constructIdentifier(executionContext, itemIndex);
    const tags = executionContext.getNodeParameter('tagIds', itemIndex, []) as string[];

    return callDeveloperApi<DeleteManyTagsResponse>(executionContext, {
      method: 'DELETE',
      path: `/contact/${identifier}/tag`,
      body: tags
    })
  },
  [ACTION_NAMES.DELETE_CONTACT]: async (executionContext: IExecuteFunctions, itemIndex: number) => {
    const identifier = constructIdentifier(executionContext, itemIndex);

    return callDeveloperApi<DeleteManyTagsResponse>(executionContext, {
      method: 'DELETE',
      path: `/contact/${identifier}`,
    })
  },
  [ACTION_NAMES.FIND_CONTACT_CHANNELS]: async (executionContext: IExecuteFunctions, itemIndex: number) => {
    const identifier = constructIdentifier(executionContext, itemIndex);

    const { raw } = await fetchPaginatedOptions<FindContactChannelsItem, INodePropertyOptions>(
      executionContext,
      'respondIoApi',
      `/contact/${identifier}/channels`,
      undefined,
      {
        includeTransformed: false,
        limit: 100,
        includeRaw: true,
        maxResults: Infinity,
      }
    )

    return raw;
  },
  [ACTION_NAMES.FIND_CONTACT]: async (executionContext: IExecuteFunctions, itemIndex: number) => {
    const identifier = constructIdentifier(executionContext, itemIndex);
    return callDeveloperApi<GetContactResponse>(executionContext, {
      method: 'GET',
      path: `/contact/${identifier}`,
    });
  },
  [ACTION_NAMES.ADD_TAGS]: async (executionContext: IExecuteFunctions, itemIndex: number) => {
    const identifier = constructIdentifier(executionContext, itemIndex);
    const tags = executionContext.getNodeParameter('tags', itemIndex, '') as string;

    return callDeveloperApi<DeleteManyTagsResponse>(executionContext, {
      method: 'POST',
      path: `/contact/${identifier}/tag`,
      body: tags
    })
  },
  [ACTION_NAMES.GET_MANY_CONTACTS]: async (executionContext: IExecuteFunctions, itemIndex: number) => {
    const search = executionContext.getNodeParameter('search', itemIndex, '') as string;
    const limit = executionContext.getNodeParameter('limit', itemIndex, 10) as number;

    const response = await callDeveloperApi<GetManyContactsResponse>(executionContext, {
      method: 'POST',
      path: `/contact/list?limit=${limit}`,
      body: {
        search,
        timezone: 'utc',
        filter: { $or: [] }
      }
    })

    return response.items;

  },
  [ACTION_NAMES.UPDATE_CONTACT]: async (executionContext: IExecuteFunctions, itemIndex: number) => {
    const identifier = constructIdentifier(executionContext, itemIndex);
    const firstName = executionContext.getNodeParameter('firstName', itemIndex, '') as string;
    const lastName = executionContext.getNodeParameter('lastName', itemIndex, '') as string;
    const language = executionContext.getNodeParameter('language', itemIndex, '') as string;
    const profilePic = executionContext.getNodeParameter('profilePic', itemIndex, '') as string;
    const countryCode = executionContext.getNodeParameter('countryCode', itemIndex, '') as string;
    const customFieldMapper = executionContext.getNodeParameter('customFields', itemIndex, []) as CustomFieldMapperReturnValue;

    const customFields = constructCustomFieldFromResourceMapper(customFieldMapper);

    const payload = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(language && { language }),
      ...(profilePic && { profilePic }),
      ...(countryCode && { countryCode }),
      ...(customFields.length && { custom_fields: customFields }),
    }

    return callDeveloperApi<DeleteManyTagsResponse>(executionContext, {
      method: 'PUT',
      path: `/contact/${identifier}`,
      body: payload,
    })
  },
  [ACTION_NAMES.CREATE_OR_UPDATE_CONTACT]: async (executionContext: IExecuteFunctions, itemIndex: number) => {
    const identifier = constructIdentifier(executionContext, itemIndex);
    const firstName = executionContext.getNodeParameter('firstName', itemIndex, '') as string;
    const lastName = executionContext.getNodeParameter('lastName', itemIndex, '') as string;
    const language = executionContext.getNodeParameter('language', itemIndex, '') as string;
    const profilePic = executionContext.getNodeParameter('profilePic', itemIndex, '') as string;
    const countryCode = executionContext.getNodeParameter('countryCode', itemIndex, '') as string;
    const customFieldMapper = executionContext.getNodeParameter('customFields', itemIndex, []) as CustomFieldMapperReturnValue;

    const customFields = constructCustomFieldFromResourceMapper(customFieldMapper);

    const payload = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(language && { language }),
      ...(profilePic && { profilePic }),
      ...(countryCode && { countryCode }),
      ...(customFields.length && { custom_fields: customFields }),
    }

    return callDeveloperApi<DeleteManyTagsResponse>(executionContext, {
      method: 'POST',
      path: `/contact/create_or_update/${identifier}`,
      body: payload,
    })
  },
  [ACTION_NAMES.CREATE_CONTACT]: async (executionContext: IExecuteFunctions, itemIndex: number) => {
    const identifier = constructIdentifier(executionContext, itemIndex);
    const firstName = executionContext.getNodeParameter('firstName', itemIndex, '') as string;
    const lastName = executionContext.getNodeParameter('lastName', itemIndex, '') as string;
    const language = executionContext.getNodeParameter('language', itemIndex, '') as string;
    const profilePic = executionContext.getNodeParameter('profilePic', itemIndex, '') as string;
    const countryCode = executionContext.getNodeParameter('countryCode', itemIndex, '') as string;
    const email = executionContext.getNodeParameter('email', itemIndex, '') as string;
    const phone = executionContext.getNodeParameter('phone', itemIndex, '') as string;
    const customFieldMapper = executionContext.getNodeParameter('customFields', itemIndex, []) as CustomFieldMapperReturnValue;

    const customFields = constructCustomFieldFromResourceMapper(customFieldMapper);

    const payload: CreateContactPayload = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(language && { language }),
      ...(profilePic && { profilePic }),
      ...(countryCode && { countryCode }),
      ...(customFields.length && { custom_fields: customFields }),
    }
    if (email.length) payload.email = email
    if (phone.length) payload.phone = phone

    return callDeveloperApi<CreateContactResponse>(executionContext, {
      method: 'POST',
      path: `/contact/${identifier}`,
      body: payload,
    })
  }
}

const ALLOWED_CONTACT_ACTIONS = [
  ACTION_NAMES.REMOVE_TAGS,
  ACTION_NAMES.DELETE_CONTACT,
  ACTION_NAMES.FIND_CONTACT_CHANNELS,
  ACTION_NAMES.FIND_CONTACT,
  ACTION_NAMES.ADD_TAGS,
  ACTION_NAMES.GET_MANY_CONTACTS,
  ACTION_NAMES.UPDATE_CONTACT,
  ACTION_NAMES.CREATE_OR_UPDATE_CONTACT,
  ACTION_NAMES.CREATE_CONTACT,
] as const;

type VALID_CONTACT_ACTIONS = typeof ALLOWED_CONTACT_ACTIONS[number];

const execute = async (
  action: VALID_CONTACT_ACTIONS,
  executionContext: IExecuteFunctions,
): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> => {
  if (!ALLOWED_CONTACT_ACTIONS.includes(action)) return [];
  const items = executionContext.getInputData();
  const results: INodeExecutionData[] = [];
  const handler = actionHandlers[action];

  if (!handler) return [[{ json: { message: 'No action executed' }, pairedItem: 0 }]];

  for (let i = 0; i < items.length; i++) {
    const data = await handler(executionContext, i);

    if (Array.isArray(data)) {
      results.push(
        ...data.map(d => ({
          json: d,
          pairedItem: { item: i },
        }))
      );
    } else {
      results.push({ json: data, pairedItem: { item: i } });
    }
  }

  return [results];
}

export default { execute }
