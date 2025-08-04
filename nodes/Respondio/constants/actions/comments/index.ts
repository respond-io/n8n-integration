import { INodeProperties } from "n8n-workflow";
import { ACTION_NAMES } from "../..";
import { generateContactIdentifierInputFields, IContactIdentifiers } from "../../../utils";

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
