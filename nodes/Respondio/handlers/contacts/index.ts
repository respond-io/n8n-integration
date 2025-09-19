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

const execute = async (
  action: ACTION_NAMES,
  executionContext: IExecuteFunctions,
): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> => {
  // we only care about GET_ALL_CUSTOM_FIELDS, FIND_CUSTOM_FIELD, CREATE_CUSTOM_FIELD for the CUSTOM_FIELDS operation
  const allowedActions = [
    ACTION_NAMES.ADD_SPACE_TAG,
    ACTION_NAMES.DELETE_SPACE_TAG,
    ACTION_NAMES.UPDATE_SPACE_TAG,
    ACTION_NAMES.REMOVE_TAGS,
    ACTION_NAMES.DELETE_CONTACT,
    ACTION_NAMES.FIND_CONTACT_CHANNELS,
    ACTION_NAMES.FIND_CONTACT,
    ACTION_NAMES.ADD_TAGS,
    ACTION_NAMES.GET_MANY_CONTACTS,
    ACTION_NAMES.UPDATE_CONTACT,
    ACTION_NAMES.CREATE_OR_UPDATE_CONTACT,
    ACTION_NAMES.CREATE_CONTACT,
  ]
  if (!allowedActions.includes(action)) return []

  if (action === ACTION_NAMES.REMOVE_TAGS) {
    const identifier = constructIdentifier(executionContext);

    const tags = executionContext.getNodeParameter('tagIds', 0, []) as string[];

    const response = await callDeveloperApi<DeleteManyTagsResponse>(executionContext, {
      method: 'DELETE',
      path: `/contact/${identifier}/tag`,
      body: tags
    })

    return [[{ json: response }]]
  }

  if (action === ACTION_NAMES.DELETE_CONTACT) {
    const identifier = constructIdentifier(executionContext);

    const response = await callDeveloperApi<DeleteManyTagsResponse>(executionContext, {
      method: 'DELETE',
      path: `/contact/${identifier}`,
    })

    return [[{ json: response }]]
  }

  if (action === ACTION_NAMES.FIND_CONTACT_CHANNELS) {
    const identifier = constructIdentifier(executionContext);

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

    return [raw.map((item) => ({ json: item }))];
  }

  if (action === ACTION_NAMES.FIND_CONTACT) {
    const identifier = constructIdentifier(executionContext);

    const response = await callDeveloperApi<GetContactResponse>(executionContext, {
      method: 'GET',
      path: `/contact/${identifier}`,
    })

    return [[{ json: response }]];
  }

  if (action === ACTION_NAMES.ADD_TAGS) {
    const identifier = constructIdentifier(executionContext);
    const tags = executionContext.getNodeParameter('tags', 0, '') as string;

    const response = await callDeveloperApi<DeleteManyTagsResponse>(executionContext, {
      method: 'POST',
      path: `/contact/${identifier}/tag`,
      body: tags
    })

    return [[{ json: response }]];
  }

  if (action === ACTION_NAMES.GET_MANY_CONTACTS) {
    const search = executionContext.getNodeParameter('search', 0, '') as string;
    const limit = executionContext.getNodeParameter('limit', 0, 10) as number;

    const response = await callDeveloperApi<GetManyContactsResponse>(executionContext, {
      method: 'POST',
      path: `/contact/list?limit=${limit}`,
      body: {
        search,
        timezone: 'utc',
        filter: { $or: [] }
      }
    })

    return [response.items.map((item) => ({ json: item }))];
  }

  // UPDATE_CONTACT does not have email / phone to be updateable
  if (action === ACTION_NAMES.UPDATE_CONTACT) {
    const identifier = constructIdentifier(executionContext);
    const firstName = executionContext.getNodeParameter('firstName', 0, '') as string;
    const lastName = executionContext.getNodeParameter('lastName', 0, '') as string;
    const language = executionContext.getNodeParameter('language', 0, '') as string;
    const profilePic = executionContext.getNodeParameter('profilePic', 0, '') as string;
    const countryCode = executionContext.getNodeParameter('countryCode', 0, '') as string;
    const customFieldMapper = executionContext.getNodeParameter('customFields', 0, []) as CustomFieldMapperReturnValue;

    const customFields = constructCustomFieldFromResourceMapper(customFieldMapper);

    const payload = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(language && { language }),
      ...(profilePic && { profilePic }),
      ...(countryCode && { countryCode }),
      ...(customFields.length && { custom_fields: customFields }),
    }

    const response = await callDeveloperApi<DeleteManyTagsResponse>(executionContext, {
      method: 'PUT',
      path: `/contact/${identifier}`,
      body: payload,
    })

    return [[{ json: response }]];
  }

  if (action === ACTION_NAMES.CREATE_OR_UPDATE_CONTACT) {
    const identifier = constructIdentifier(executionContext);
    const firstName = executionContext.getNodeParameter('firstName', 0, '') as string;
    const lastName = executionContext.getNodeParameter('lastName', 0, '') as string;
    const language = executionContext.getNodeParameter('language', 0, '') as string;
    const profilePic = executionContext.getNodeParameter('profilePic', 0, '') as string;
    const countryCode = executionContext.getNodeParameter('countryCode', 0, '') as string;
    const customFieldMapper = executionContext.getNodeParameter('customFields', 0, []) as CustomFieldMapperReturnValue;

    const customFields = constructCustomFieldFromResourceMapper(customFieldMapper);

    const payload = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(language && { language }),
      ...(profilePic && { profilePic }),
      ...(countryCode && { countryCode }),
      ...(customFields.length && { custom_fields: customFields }),
    }

    const response = await callDeveloperApi<DeleteManyTagsResponse>(executionContext, {
      method: 'POST',
      path: `/contact/create_or_update/${identifier}`,
      body: payload,
    })

    return [[{ json: response }]];
  }

  if (action === ACTION_NAMES.CREATE_CONTACT) {
    const identifier = constructIdentifier(executionContext);
    const firstName = executionContext.getNodeParameter('firstName', 0, '') as string;
    const lastName = executionContext.getNodeParameter('lastName', 0, '') as string;
    const language = executionContext.getNodeParameter('language', 0, '') as string;
    const profilePic = executionContext.getNodeParameter('profilePic', 0, '') as string;
    const countryCode = executionContext.getNodeParameter('countryCode', 0, '') as string;
    const email = executionContext.getNodeParameter('email', 0, '') as string;
    const phone = executionContext.getNodeParameter('phone', 0, '') as string;
    const customFieldMapper = executionContext.getNodeParameter('customFields', 0, []) as CustomFieldMapperReturnValue;

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

    const response = await callDeveloperApi<CreateContactResponse>(executionContext, {
      method: 'POST',
      path: `/contact/${identifier}`,
      body: payload,
    })

    return [[{ json: response }]];
  }

  return [[]]
}

export default { execute }
