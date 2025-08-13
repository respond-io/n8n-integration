import { IExecuteFunctions, INodeExecutionData, NodeExecutionWithMetadata } from "n8n-workflow";
import { ACTION_NAMES } from "../../constants/actions/action_names";
import { callDeveloperApi, constructIdentifier } from "../../utils";
import { CreateContactResponse } from "../../types";

const execute = async (
  action: ACTION_NAMES,
  executionContext: IExecuteFunctions,
): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> => {
  // we only care about ASSIGN_OR_UNASSIGNED_CONVERSATION & OPEN_OR_CLOSE_CONVERSATION for the CONVERSATIONS operation
  const allowedActions = [
    ACTION_NAMES.REMOVE_CONTACT_LIFECYCLE,
    ACTION_NAMES.UPDATE_CONTACT_LIFECYCLE,
  ]
  if (!allowedActions.includes(action)) return []

  const identifier = constructIdentifier(executionContext);

  if (action === ACTION_NAMES.REMOVE_CONTACT_LIFECYCLE) {
    const response = await callDeveloperApi<CreateContactResponse>(executionContext, {
      method: 'POST',
      path: `/contact/${identifier}/lifecycle/update`,
      body: { name: null }
    })

    return [[{ json: response }]]
  }

  if (action === ACTION_NAMES.UPDATE_CONTACT_LIFECYCLE) {
    const lifecycleName = executionContext.getNodeParameter('name', 0, '') as string;

    const response = await callDeveloperApi<CreateContactResponse>(executionContext, {
      method: 'POST',
      path: `/contact/${identifier}/lifecycle/update`,
      body: { name: lifecycleName },
    })

    return [[{ json: response }]]
  }

  return [[{ json: { message: 'Action not handled' } }]]
}

export default { execute }
