import { IExecuteFunctions, INodeExecutionData, NodeExecutionWithMetadata } from "n8n-workflow";
import { ACTION_NAMES } from "../../constants/actions/action_names";
import { callDeveloperApi } from "../../utils";
import {
  CreateSpaceTagResponse,
  DeleteSpaceTagResponse,
} from "../../types";

const actionHandlers = {
  [ACTION_NAMES.ADD_SPACE_TAG]: async (executionContext: IExecuteFunctions) => {
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

    return response;
  },
  [ACTION_NAMES.DELETE_SPACE_TAG]: async (executionContext: IExecuteFunctions) => {
    const name = executionContext.getNodeParameter('name', 0, '') as string;

    return callDeveloperApi<DeleteSpaceTagResponse>(executionContext, {
      method: 'DELETE',
      path: '/space/tag',
      body: { name },
    })
  },
  [ACTION_NAMES.UPDATE_SPACE_TAG]: async (executionContext: IExecuteFunctions) => {
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

    return callDeveloperApi<CreateSpaceTagResponse>(executionContext, {
      method: 'PUT',
      path: '/space/tag',
      body: payload,
    })
  },
}

const ALLOWED_TAG_ACTIONS = [
  ACTION_NAMES.ADD_SPACE_TAG,
  ACTION_NAMES.DELETE_SPACE_TAG,
  ACTION_NAMES.UPDATE_SPACE_TAG,
] as const;

type VALID_TAG_ACTIONS = typeof ALLOWED_TAG_ACTIONS[number];

const execute = async (
  action: VALID_TAG_ACTIONS,
  executionContext: IExecuteFunctions,
): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> => {
  if (!ALLOWED_TAG_ACTIONS.includes(action)) return []
  const handler = actionHandlers[action];
  const results: INodeExecutionData[] = [];

  if (!handler) return [[{ json: { message: 'Action not handled' }, pairedItem: { item: 0 } }]]

  const data = await handler(executionContext);

  results.push({ json: data, pairedItem: { item: 0 } });

  return [results];
}

export default { execute }
