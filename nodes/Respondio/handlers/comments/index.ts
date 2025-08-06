import { IExecuteFunctions, INodeExecutionData, NodeExecutionWithMetadata, NodeOperationError } from "n8n-workflow";
import { ACTION_NAMES } from "../../constants/actions/action_names";
import { callDeveloperApi, constructIdentifier } from "../../utils";

const execute = async (
  action: ACTION_NAMES,
  executionContext: IExecuteFunctions,
): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> => {
  // we only care about ADD_COMMENT for the COMMENTS operation
  if (action !== ACTION_NAMES.ADD_COMMENT) return []

  const identifier = constructIdentifier(executionContext);
  const commentContent = executionContext.getNodeParameter('comment', 0, '') as string;

  if (!commentContent) {
    const error = new NodeOperationError(executionContext.getNode(), 'Comment content is required');

    return [[{
      json: {},
      error,
      pairedItem: { item: 0 },
    }]];
  }

  const response = await callDeveloperApi(executionContext, {
    method: 'POST',
    path: `/contact/${identifier}/comment`,
    body: { text: commentContent },
  })

  return [[{ json: response }]]
}

export default { execute }

