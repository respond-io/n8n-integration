import { IExecuteFunctions, INodeExecutionData, NodeExecutionWithMetadata } from "n8n-workflow";
import { ACTION_NAMES } from "../../constants/actions/action_names";
import { callDeveloperApi, constructIdentifier } from "../../utils";
import { DeleteManyTagsResponse } from "../../types";

const actionHandlers = {
  [ACTION_NAMES.ASSIGN_OR_UNASSIGNED_CONVERSATION]: async (executionContext: IExecuteFunctions, itemIndex: number, identifier: string) => {
    const assignmentType = executionContext.getNodeParameter('assignmentType', itemIndex, '') as string;
    const assigneeUserId = executionContext.getNodeParameter('assigneeUserId', itemIndex, '') as string;
    const assigneeUserEmail = executionContext.getNodeParameter('assigneeUserEmail', itemIndex, '') as string;

    const payload: { assignee: number | string | null } = { assignee: null };

    if (assignmentType === 'userId') payload.assignee = Number(assigneeUserId);
    if (assignmentType === 'userEmail') payload.assignee = assigneeUserEmail;

    return callDeveloperApi<DeleteManyTagsResponse>(executionContext, {
      method: 'POST',
      path: `/contact/${identifier}/conversation/assignee`,
      body: payload
    })
  },
  [ACTION_NAMES.OPEN_OR_CLOSE_CONVERSATION]: async (executionContext: IExecuteFunctions, itemIndex: number, identifier: string) => {
    const conversationStatus = executionContext.getNodeParameter('status', itemIndex, '') as string;
    const category = executionContext.getNodeParameter('category', itemIndex, '') as string;
    const summary = executionContext.getNodeParameter('summary', itemIndex, '') as string;

    const payload = {
      status: conversationStatus,
      category,
      summary,
    }

    return await callDeveloperApi<DeleteManyTagsResponse>(executionContext, {
      method: 'POST',
      path: `/contact/${identifier}/conversation/status`,
      body: payload,
    })
  },
}

const ALLOWED_CONVERSATION_ACTIONS = [
  ACTION_NAMES.ASSIGN_OR_UNASSIGNED_CONVERSATION,
  ACTION_NAMES.OPEN_OR_CLOSE_CONVERSATION,
] as const;

type VALID_CONVERSATION_ACTIONS = typeof ALLOWED_CONVERSATION_ACTIONS[number];

const execute = async (
  action: VALID_CONVERSATION_ACTIONS,
  executionContext: IExecuteFunctions,
): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> => {
  if (!ALLOWED_CONVERSATION_ACTIONS.includes(action)) return []
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
