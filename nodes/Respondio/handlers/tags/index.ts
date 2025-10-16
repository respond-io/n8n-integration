import { IExecuteFunctions, INodeExecutionData, NodeExecutionWithMetadata } from "n8n-workflow";
import { ACTION_NAMES } from "../../constants/actions/action_names";
import { callDeveloperApi } from "../../utils";
import {
  CreateSpaceTagResponse,
  DeleteSpaceTagResponse,
} from "../../types";

const actionHandlers = {
  [ACTION_NAMES.ADD_SPACE_TAG]: async (executionContext: IExecuteFunctions, itemIndex: number) => {
    const name = executionContext.getNodeParameter('name', itemIndex, '') as string;
    const description = executionContext.getNodeParameter('description', itemIndex, '') as string;
    const colorCode = executionContext.getNodeParameter('colorCode', itemIndex, '') as string;
    const emoji = executionContext.getNodeParameter('emoji', itemIndex, '') as string;

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
  [ACTION_NAMES.DELETE_SPACE_TAG]: async (executionContext: IExecuteFunctions, itemIndex: number) => {
    const name = executionContext.getNodeParameter('name', itemIndex, '') as string;

    return callDeveloperApi<DeleteSpaceTagResponse>(executionContext, {
      method: 'DELETE',
      path: '/space/tag',
      body: { name },
    })
  },
  [ACTION_NAMES.UPDATE_SPACE_TAG]: async (executionContext: IExecuteFunctions, itemIndex: number) => {
    const currentName = executionContext.getNodeParameter('currentName', itemIndex, '') as string;
    const name = executionContext.getNodeParameter('name', itemIndex, '') as string;
    const description = executionContext.getNodeParameter('description', itemIndex, '') as string;
    const colorCode = executionContext.getNodeParameter('colorCode', itemIndex, '') as string;
    const emoji = executionContext.getNodeParameter('emoji', itemIndex, '') as string;

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
  const items = executionContext.getInputData();
  const results: INodeExecutionData[] = [];
  const handler = actionHandlers[action];

  if (!handler) return [[{ json: { message: 'Action not handled' }, pairedItem: { item: 0 } }]]

  for (let i = 0; i < items.length; i++) {
    const data = await handler(executionContext, i);

    results.push({ json: data, pairedItem: { item: i } });
  }

  return [results];
}

export default { execute }
