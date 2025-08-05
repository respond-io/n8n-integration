import { IExecuteFunctions, INodeExecutionData, NodeExecutionWithMetadata } from "n8n-workflow";
import { ACTION_NAMES } from "../../constants/actions/action_names";
// import { callDeveloperApi, constructIdentifier } from "../../utils";
import { callDeveloperApi, constructIdentifier } from "../../utils";
import { CreateSpaceTagResponse, DeleteSpaceTagResponse } from "../../types";

// [ACTION_NAMES.ADD_SPACE_TAG]: contactActions.ADD_SPACE_TAG,
// [ACTION_NAMES.DELETE_SPACE_TAG]: contactActions.DELETE_SPACE_TAG,
// [ACTION_NAMES.UPDATE_SPACE_TAG]: contactActions.UPDATE_SPACE_TAG,
// [ACTION_NAMES.REMOVE_TAGS]: contactActions.REMOVE_TAGS,
// [ACTION_NAMES.DELETE_CONTACT]: contactActions.DELETE_CONTACT,
// [ACTION_NAMES.FIND_CONTACT_CHANNELS]: contactActions.FIND_CONTACT_CHANNELS,
// [ACTION_NAMES.FIND_CONTACT]: contactActions.FIND_CONTACT,
// [ACTION_NAMES.ADD_TAGS]: contactActions.ADD_TAGS,
// [ACTION_NAMES.GET_MANY_CONTACTS]: contactActions.GET_MANY_CONTACTS,
// [ACTION_NAMES.UPDATE_CONTACT]: contactActions.UPDATE_CONTACT,
// [ACTION_NAMES.CREATE_OR_UPDATE_CONTACT]: contactActions.CREATE_OR_UPDATE_CONTACT,
// [ACTION_NAMES.CREATE_CONTACT]: contactActions.CREATE_CONTACT,

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

  if (action === ACTION_NAMES.ADD_SPACE_TAG) {
    const name = executionContext.getNodeParameter('name', 0, '') as string;
    const description = executionContext.getNodeParameter('description', 0, '') as string;
    const colorCode = executionContext.getNodeParameter('colorCode', 0, '') as string;
    const emoji = executionContext.getNodeParameter('emoji', 0, '') as string;

    const payload = {
      name,
      description,
      colorCode,
      emoji
    }

    const response = await callDeveloperApi<CreateSpaceTagResponse>(executionContext, {
      method: 'POST',
      path: '/space/tag',
      body: payload,
    })

    return [[{ json: response.message }]];
  }

  if (action === ACTION_NAMES.DELETE_SPACE_TAG) {
    const name = executionContext.getNodeParameter('name', 0, '') as string;

    const response = await callDeveloperApi<DeleteSpaceTagResponse>(executionContext, {
      method: 'DELETE',
      path: '/space/tag',
      body: { name },
    })

    return [[{ json: response }]]
  }

  if (action === ACTION_NAMES.UPDATE_SPACE_TAG) {
    const currentName = executionContext.getNodeParameter('currentName', 0, '') as string;
    const name = executionContext.getNodeParameter('name', 0, '') as string;
    const description = executionContext.getNodeParameter('description', 0, '') as string;
    const colorCode = executionContext.getNodeParameter('colorCode', 0, '') as string;
    const emoji = executionContext.getNodeParameter('emoji', 0, '') as string;

    const payload = {
      currentName,
      name,
      description,
      colorCode,
      emoji
    }

    const response = await callDeveloperApi<CreateSpaceTagResponse>(executionContext, {
      method: 'PUT',
      path: '/space/tag',
      body: payload,
    })

    return [[{ json: response }]]
  }

  if (action === ACTION_NAMES.REMOVE_TAGS) {
    const identifier = constructIdentifier(executionContext);

    const tags = executionContext.getNodeParameter('tagIds', 0, []) as string[];
    executionContext.logger.info(`Removing tags: ${JSON.stringify(tags)} from contact: ${identifier}`);
  }

  // if (action === ACTION_NAMES.REMOVE_TAGS) {
  //   const identifier = constructIdentifier(executionContext);
  //   const tagId = executionContext.getNodeParameter('tagId', 0, undefined) as string;
  // }

  // if (action === ACTION_NAMES.FIND_CUSTOM_FIELD) {
  //   const customFieldId = executionContext.getNodeParameter('customFieldId', 0, undefined) as number;
  //
  //   const response = await callDeveloperApi(executionContext, {
  //     method: 'GET',
  //     path: `/space/custom_field/${customFieldId}`,
  //   })
  //
  //   return [[{ json: response }]];
  // }
  //
  // const name = executionContext.getNodeParameter('name', 0, '') as string;
  // const description = executionContext.getNodeParameter('description', 0, '') as string;
  // const slug = executionContext.getNodeParameter('slug', 0, '') as string;
  // const dataType = executionContext.getNodeParameter('dataType', 0, 'text') as string;
  // const allowedValues = executionContext.getNodeParameter('allowedValues', 0, []) as string[];
  //
  // const payload = {
  //   name,
  //   description,
  //   dataType,
  //   allowedValues,
  //   slug
  // }
  // executionContext.logger.info(`Payload used: ${JSON.stringify(payload)}`)
  //
  // const response = await callDeveloperApi(executionContext, {
  //   method: 'POST',
  //   path: `/space/custom_field`,
  //   body: payload
  // })
  //
  // return [[{ json: response }]]
  return [[]]
}

export default { execute }
