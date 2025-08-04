import { INodeProperties } from "n8n-workflow";
import { generateContactIdentifierInputFields, IContactIdentifiers } from "../../../utils";
import { ACTION_NAMES } from "../action_names";

export default {
  [ACTION_NAMES.ADD_COMMENT]: {
    name: 'Add a Comment',
    value: 'ADD_COMMENT',
    description: 'Adds a comment to a conversation',
    params: [
      ...generateContactIdentifierInputFields([
        IContactIdentifiers.id,
        IContactIdentifiers.email,
        IContactIdentifiers.phone,
      ]),
      {
        displayName: 'Comment',
        name: 'comment',
        type: 'string',
        required: true,
        description: 'Wrap mentioned user ids in $userId$, for example: $1$'
      }
    ] as unknown as INodeProperties[]
  }
}
