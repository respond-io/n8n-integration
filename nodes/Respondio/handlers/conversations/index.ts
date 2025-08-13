import { IExecuteFunctions, INodeExecutionData, NodeExecutionWithMetadata } from "n8n-workflow";
import { ACTION_NAMES } from "../../constants/actions/action_names";
import { callDeveloperApi, constructIdentifier } from "../../utils";
import { DeleteManyTagsResponse } from "../../types";

const execute = async (
  action: ACTION_NAMES,
  executionContext: IExecuteFunctions,
): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> => {
  // we only care about ASSIGN_OR_UNASSIGNED_CONVERSATION & OPEN_OR_CLOSE_CONVERSATION for the CONVERSATIONS operation
  const allowedActions = [
    ACTION_NAMES.ASSIGN_OR_UNASSIGNED_CONVERSATION,
    ACTION_NAMES.OPEN_OR_CLOSE_CONVERSATION,
  ]
  if (!allowedActions.includes(action)) return []

  const identifier = constructIdentifier(executionContext);

  if (action === ACTION_NAMES.ASSIGN_OR_UNASSIGNED_CONVERSATION) {
    const assignmentType = executionContext.getNodeParameter('assignmentType', 0, '') as string;
    const assigneeUserId = executionContext.getNodeParameter('assigneeUserId', 0, '') as string;
    const assigneeUserEmail = executionContext.getNodeParameter('assigneeUserEmail', 0, '') as string;

    const payload: { assignee: number | string | null } = { assignee: null };

    if (assignmentType === 'userId') payload.assignee = Number(assigneeUserId);
    if (assignmentType === 'userEmail') payload.assignee = assigneeUserEmail;

    const response = await callDeveloperApi<DeleteManyTagsResponse>(executionContext, {
      method: 'POST',
      path: `/contact/${identifier}/conversation/assignee`,
      body: payload
    })

    return [[{ json: response }]]
  }

  if (action === ACTION_NAMES.OPEN_OR_CLOSE_CONVERSATION) {
    const conversationStatus = executionContext.getNodeParameter('status', 0, '') as string;
    const category = executionContext.getNodeParameter('category', 0, '') as string;
    const summary = executionContext.getNodeParameter('summary', 0, '') as string;

    const payload = {
      status: conversationStatus,
      category,
      summary,
    }

    const response = await callDeveloperApi<DeleteManyTagsResponse>(executionContext, {
      method: 'POST',
      path: `/contact/${identifier}/conversation/status`,
      body: payload,
    })

    return [[{ json: response }]]
  }

  return [[{ json: { message: 'Action not handled' } }]]
}

export default { execute }
