import { INodeProperties } from "n8n-workflow"

export enum IContactIdentifiers {
  id = 'id',
  email = 'email',
  phone = 'phone',
}

export enum IContactIdentifierNames {
  contactId = 'contactId',
  contactIdentifier = 'contactIdentifier',
}

export const generateContactIdentifierInputFields = (
  fields: IContactIdentifiers[] = [],
): INodeProperties[] => {
  return [
    {
      displayName: 'Identifier Type',
      name: 'identifierType',
      type: 'options',
      options: fields.map((item) => ({
        name: item.charAt(0).toUpperCase() + item.slice(1),
        value: item,
      })),
      required: true,
      description: 'How would you like to identify the contact?',
      default: IContactIdentifiers.id,
    },
    {
      displayName: 'Contact ID',
      name: 'contactId',
      type: 'number',
      required: true,
      description: 'Numeric ID of the contact',
      displayOptions: {
        show: {
          identifierType: [IContactIdentifiers.id],
        },
      },
      default: undefined,
    },
    {
      displayName: 'Contact Identifier',
      name: 'contactIdentifier',
      type: 'string',
      required: true,
      description: 'Email or phone of the contact',
      displayOptions: {
        show: {
          identifierType: [IContactIdentifiers.email, IContactIdentifiers.phone],
        },
      },
      default: ''
    },
  ]
}

export const constructIdentifier = (identifierType: IContactIdentifiers, identifierValue: string | number) => {
  const trimmedValue = identifierValue.toString().trim()
  const trimmedType = identifierType.trim().toLowerCase()
  return `${trimmedType}:${trimmedValue}`
}
