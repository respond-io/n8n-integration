import { INodeProperties } from "n8n-workflow";
import { generateContactIdentifierInputFields, IContactIdentifiers } from "../../../utils";
import ACTION_NAMES from "../action_names";

export default {
  [ACTION_NAMES.REMOVE_CONTACT_LIFECYCLE]: {
    name: 'Remove a Contact Lifecycle',
    value: 'REMOVE_CONTACT_LIFECYCLE',
    description: 'Unassign contact lifecycle stage',
    params: generateContactIdentifierInputFields([
      IContactIdentifiers.id,
      IContactIdentifiers.email,
      IContactIdentifiers.phone,
    ]) as unknown as INodeProperties[]
  },
  [ACTION_NAMES.UPDATE_CONTACT_LIFECYCLE]: {
    name: 'Update a Contact Lifecycle',
    value: 'UPDATE_CONTACT_LIFECYCLE',
    description: 'Update contact lifecycle stage',
    params: [
      ...generateContactIdentifierInputFields([
        IContactIdentifiers.id,
        IContactIdentifiers.email,
        IContactIdentifiers.phone,
      ]),
      {
        displayName: 'Lifecycle Stage Name',
        name: 'name',
        type: 'string',
        required: true,
        description: 'Name of the lifecycle stage',
        default: ''
      },
    ] as unknown as INodeProperties[]
  },
}
