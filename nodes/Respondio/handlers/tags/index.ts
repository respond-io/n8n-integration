import { IExecuteFunctions, INodeExecutionData, NodeExecutionWithMetadata } from "n8n-workflow";
import { ACTION_NAMES } from "../../constants/actions/action_names";
import { callDeveloperApi } from "../../utils";
import {
  CreateSpaceTagResponse,
  DeleteSpaceTagResponse,
} from "../../types";

const execute = async (
  action: ACTION_NAMES,
  executionContext: IExecuteFunctions,
): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> => {
  // we only care about ADD_SPACE_TAG, DELETE_SPACE_TAG & UPDATE_SPACE_TAG for the TAGS operation
  const allowedActions = [
    ACTION_NAMES.ADD_SPACE_TAG,
    ACTION_NAMES.DELETE_SPACE_TAG,
    ACTION_NAMES.UPDATE_SPACE_TAG,
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

  return [[]]
}

export default { execute }
