import { IExecuteFunctions, INodeExecutionData, NodeExecutionWithMetadata } from "n8n-workflow";
import { ACTION_NAMES } from "../../constants/actions/action_names";
import { callDeveloperApi } from "../../utils";
import { GetAllUsersResponse, GetUserResponseItem } from "../../types";

const actionHandlers = {
  [ACTION_NAMES.FIND_USER]: async (executionContext: IExecuteFunctions, itemIndex: number) => {
    const userId = executionContext.getNodeParameter('userId', itemIndex, '') as string;

    return callDeveloperApi<GetUserResponseItem>(executionContext, {
      method: 'GET',
      path: `/space/user/${userId}`,
    })
  },
  [ACTION_NAMES.GET_ALL_USERS]: async (executionContext: IExecuteFunctions, itemIndex: number) => {
    const limit = executionContext.getNodeParameter('limit', itemIndex, 100) as number;

    const response = await callDeveloperApi<GetAllUsersResponse>(executionContext, {
      method: 'GET',
      path: `/space/user?limit=${limit}`,
    })

    return response.items;
  },
}

const ALLOWED_USER_ACTIONS = [
  ACTION_NAMES.FIND_USER,
  ACTION_NAMES.GET_ALL_USERS,
] as const;

type VALID_USER_ACTIONS = typeof ALLOWED_USER_ACTIONS[number];

const execute = async (
  action: VALID_USER_ACTIONS,
  executionContext: IExecuteFunctions,
): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> => {
  if (!ALLOWED_USER_ACTIONS.includes(action)) return []
  const items = executionContext.getInputData();
  const results: INodeExecutionData[] = [];
  const handler = actionHandlers[action];

  if (!handler) return [[{ json: { message: 'Action not handled' }, pairedItem: { item: 0 } }]]

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
