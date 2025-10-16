import { IExecuteFunctions, INodeExecutionData, NodeExecutionWithMetadata, NodeOperationError } from "n8n-workflow";
import { ACTION_NAMES } from "../../constants/actions/action_names";
import { callDeveloperApi, constructIdentifier } from "../../utils";
import { CreateCommentResponse } from "../../types";

const ALLOWED_COMMENT_ACTIONS = [
  ACTION_NAMES.ADD_COMMENT,
] as const;

type VALID_COMMENT_ACTIONS = typeof ALLOWED_COMMENT_ACTIONS[number];

const execute = async (
  action: VALID_COMMENT_ACTIONS,
  executionContext: IExecuteFunctions,
): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> => {
  if (!ALLOWED_COMMENT_ACTIONS.includes(action)) return []
  const items = executionContext.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const identifier = constructIdentifier(executionContext, i);
    const commentContent = executionContext.getNodeParameter('comment', i, '') as string;

    if (!commentContent) {
      const error = new NodeOperationError(executionContext.getNode(), 'Comment content is required');

      results.push({ json: {}, error, pairedItem: { item: i } });
    }

    const response = await callDeveloperApi<CreateCommentResponse>(executionContext, {
      method: 'POST',
      path: `/contact/${identifier}/comment`,
      body: { text: commentContent },
    })

    results.push({ json: response, pairedItem: { item: i } });
  }

  return [results];
}

export default { execute }

