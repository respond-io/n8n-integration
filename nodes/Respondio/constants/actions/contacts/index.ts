import { INodeProperties } from "n8n-workflow";
import { generateContactIdentifierInputFields, generateContactInputFields, IContactIdentifiers } from "../../../utils";
import ACTION_NAMES from "../action_names";

export default {
  [ACTION_NAMES.REMOVE_TAGS]: {
    name: 'Remove many Tags',
    value: 'REMOVE_TAGS',
    description: 'Removes Tag(s) for a Contact',
    params: [
      ...generateContactIdentifierInputFields([
        IContactIdentifiers.id,
        IContactIdentifiers.email,
        IContactIdentifiers.phone,
      ]),
      {
        displayName: 'Select tag(s) to delete',
        name: 'tagIds',
        type: 'multiOptions',
        typeOptions: {
          loadOptionsMethod: 'getTagsForContact',
          loadOptionsDependsOn: ['identifierType', 'contactId', 'contactIdentifier'],
        },
        required: true,
        description: 'Choose the tag(s) to delete from this contact',
      },
    ] as unknown as INodeProperties[]
  },
  [ACTION_NAMES.DELETE_CONTACT]: {
    name: 'Delete a Contact',
    value: 'DELETE_CONTACT',
    description: 'Deletes a Contact',
    params: [
      ...generateContactIdentifierInputFields([
        IContactIdentifiers.id,
        IContactIdentifiers.email,
        IContactIdentifiers.phone,
      ]),
    ] as unknown as INodeProperties[]
  },
  [ACTION_NAMES.FIND_CONTACT_CHANNELS]: {
    name: 'Find many Contact Channels',
    value: 'FIND_CONTACT_CHANNELS',
    description: 'Find connected Channels of a Contact',
    params: [
      ...generateContactIdentifierInputFields([
        IContactIdentifiers.id,
        IContactIdentifiers.email,
        IContactIdentifiers.phone,
      ]),
    ] as unknown as INodeProperties[]
  },
  [ACTION_NAMES.FIND_CONTACT]: {
    name: 'Find a Contact',
    value: 'FIND_CONTACT',
    description: 'Finds a specific Contact by identifier',
    params: [
      ...generateContactIdentifierInputFields([
        IContactIdentifiers.id,
        IContactIdentifiers.email,
        IContactIdentifiers.phone,
      ]),
    ] as unknown as INodeProperties[]
  },
  [ACTION_NAMES.ADD_TAGS]: {
    name: 'Add many Tags',
    value: 'ADD_TAGS',
    description: 'Adds Tag(s) for a Contact',
    params: [
      ...generateContactIdentifierInputFields([
        IContactIdentifiers.id,
        IContactIdentifiers.email,
        IContactIdentifiers.phone,
      ]),
      {
        displayName: 'Tags',
        name: 'tags',
        type: 'string',
        typeOptions: { multipleValues: true },
        default: [],
        placeholder: 'TagName',
        description: 'List of tags as strings',
        required: true
      }
    ] as unknown as INodeProperties[]
  },
  [ACTION_NAMES.GET_MANY_CONTACTS]: {
    name: 'Get many Contacts',
    value: 'GET_MANY_CONTACTS',
    description: 'Return multiple Contacts that matches with the search condition',
    params: [
      {
        displayName: 'Search',
        name: 'search',
        type: 'string',
        required: false,
        description: 'Search term for filtering Contacts',
        default: ''
      },
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Maximum number of Contacts to return',
        default: 10
      }
    ] as unknown as INodeProperties[]
  },
  [ACTION_NAMES.UPDATE_CONTACT]: {
    name: 'Update a Contact',
    value: 'UPDATE_CONTACT',
    description: 'Updates Contact Field(s) of a Contact. Leave the contact field empty if you want to remain the existing value.',
    params: [
      ...generateContactIdentifierInputFields([
        IContactIdentifiers.id,
        IContactIdentifiers.email,
        IContactIdentifiers.phone,
      ]),
      ...generateContactInputFields(false),
    ] as unknown as INodeProperties[]
  },
  [ACTION_NAMES.CREATE_OR_UPDATE_CONTACT]: {
    name: 'Create or Update a Contact',
    value: 'CREATE_OR_UPDATE_CONTACT',
    description: 'Creates or updates a Contact. Leave the contact field empty if you want to store an empty value or remain the existing value. It is highly recommended to add a delay before executing a new action after creating a new contact, as processing time is required',
    params: [
      ...generateContactIdentifierInputFields([
        IContactIdentifiers.id,
        IContactIdentifiers.email,
        IContactIdentifiers.phone,
      ]),
      ...generateContactInputFields(false),
    ] as unknown as INodeProperties[]
  },
  [ACTION_NAMES.CREATE_CONTACT]: {
    name: 'Create a Contact',
    value: 'CREATE_CONTACT',
    description: 'Creates a Contact. Leave the contact field empty if you want to store an empty value or remain the existing value. It is highly recommended to add a delay before executing a new action after creating a new contact, as processing time is required',
    params: [
      ...generateContactIdentifierInputFields([
        IContactIdentifiers.email,
        IContactIdentifiers.phone,
      ]),
      ...generateContactInputFields(true),
    ] as unknown as INodeProperties[]
  }
}
