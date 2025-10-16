import { IExecuteFunctions, INodeExecutionData, NodeExecutionWithMetadata } from "n8n-workflow";
import { ACTION_NAMES } from "../../constants/actions/action_names";
import { callDeveloperApi, constructIdentifier } from "../../utils";
import { CreateContactResponse } from "../../types";

const actionHandlers = {
  [ACTION_NAMES.REMOVE_CONTACT_LIFECYCLE]: async (executionContext: IExecuteFunctions, _: number, identifier: string) => {
    return callDeveloperApi<CreateContactResponse>(executionContext, {
      method: 'POST',
      path: `/contact/${identifier}/lifecycle/update`,
      body: { name: null }
    })
  },
  [ACTION_NAMES.UPDATE_CONTACT_LIFECYCLE]: async (executionContext: IExecuteFunctions, itemIndex: number, identifier: string) => {
    const lifecycleName = executionContext.getNodeParameter('name', itemIndex, '') as string;

    return callDeveloperApi<CreateContactResponse>(executionContext, {
      method: 'POST',
      path: `/contact/${identifier}/lifecycle/update`,
      body: { name: lifecycleName },
    })
  },
}

const ALLOWED_LIFECYCLE_ACTIONS = [
  ACTION_NAMES.REMOVE_CONTACT_LIFECYCLE,
  ACTION_NAMES.UPDATE_CONTACT_LIFECYCLE,
] as const;

type VALID_LIFECYCLE_ACTIONS = typeof ALLOWED_LIFECYCLE_ACTIONS[number];

const execute = async (
  action: VALID_LIFECYCLE_ACTIONS,
  executionContext: IExecuteFunctions,
): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> => {
  if (!ALLOWED_LIFECYCLE_ACTIONS.includes(action)) return []
  const items = executionContext.getInputData();
  const results: INodeExecutionData[] = [];
  const handler = actionHandlers[action];

  if (!handler) return [[{ json: { message: 'Action not handled' }, pairedItem: { item: 0 } }]]

  for (let i = 0; i < items.length; i++) {
    const identifier = constructIdentifier(executionContext, i);

    const data = await handler(executionContext, i, identifier);

    results.push({ json: data, pairedItem: { item: i } });
  }

  return [results];
}

export default { execute }
