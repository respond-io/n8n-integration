import { INodeProperties } from "n8n-workflow"
import languagesJSON from './languages.json'
import countriesJSON from './countries.json'

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

export const generateContactInputFields = (isCreateContact: boolean = false): INodeProperties[] => {
  const result: INodeProperties[] = [
    {
      displayName: 'Contact\'s First Name',
      required: isCreateContact,
      name: 'firstName',
      type: 'string',
      description: 'First name of the contact',
      default: '',
    },
    {
      displayName: 'Contact\'s Last Name',
      required: false,
      name: 'lastName',
      type: 'string',
      description: 'Last name of the contact',
      default: '',
    },
    {
      displayName: 'Contact\'s Preferred Language',
      required: false,
      name: 'language',
      type: 'options',
      options: languagesJSON.map((language) => ({
        name: language.English,
        value: language.alpha2,
      })),
      description: 'Preferred language of the contact',
      default: '',
    },
    {
      displayName: 'Contact\'s Profile Picture URL',
      required: false,
      name: 'profilePic',
      type: 'string',
      description: 'Profile picture URL of the contact',
      default: '',
    },
    {
      displayName: 'Contact\'s Country',
      required: false,
      name: 'countryCode',
      type: 'options',
      options: countriesJSON.map((country) => ({
        name: country.Name,
        value: country.Code,
      })),
      description: 'Country of the contact',
      default: '',
    },
  ];

  if (isCreateContact) {
    const lastNameIndex = 1;
    result.splice(
      lastNameIndex + 1,
      0,
      {
        displayName: 'Contact\'s Email Address',
        required: false,
        name: 'email',
        type: 'string' as const,
        description: 'Email address of the contact',
        default: '',
      },
      {
        displayName: 'Contact\'s Phone Number',
        required: false,
        name: 'phone',
        type: 'string' as const,
        description: 'Phone number of the contact',
        default: '',
      }
    )
  }

  return result;
}
