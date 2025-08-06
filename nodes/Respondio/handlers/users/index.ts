import { IExecuteFunctions, INodeExecutionData, NodeExecutionWithMetadata } from "n8n-workflow";
import { ACTION_NAMES } from "../../constants/actions/action_names";
import { callDeveloperApi } from "../../utils";
import { GetAllUsersResponse, GetUserResponseItem } from "../../types";

const execute = async (
  action: ACTION_NAMES,
  executionContext: IExecuteFunctions,
): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> => {
  // we only care about FIND_USER & GET_ALL_USERS for the USERS operation
  const allowedActions = [
    ACTION_NAMES.FIND_USER,
    ACTION_NAMES.GET_ALL_USERS,
  ]
  if (!allowedActions.includes(action)) return []

  if (action === ACTION_NAMES.FIND_USER) {
    const userId = executionContext.getNodeParameter('userId', 0, '') as string;

    const response = await callDeveloperApi<GetUserResponseItem>(executionContext, {
      method: 'GET',
      path: `/space/user/${userId}`,
    })

    return [[{ json: response }]]
  }

  if (action === ACTION_NAMES.GET_ALL_USERS) {
    const limit = executionContext.getNodeParameter('limit', 0, 100) as number;

    const response = await callDeveloperApi<GetAllUsersResponse>(executionContext, {
      method: 'GET',
      path: `/space/user?limit=${limit}`,
    })

    return [response.items.map((user) => ({ json: user }))]
  }

  return [[{ json: { message: 'Action not handled' } }]]
}

export default { execute }
