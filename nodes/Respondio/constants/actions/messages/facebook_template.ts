import { INodeProperties } from "n8n-workflow";

export default {
  generateFields: (): INodeProperties[] => [
    {
      displayName: 'Facebook Template Name',
      required: true,
      name: 'templateId',
      type: 'options',
      description: 'The name of the approved Facebook template.',
      default: '',
      typeOptions: {
        loadOptionsMethod: 'getMessengerTemplates',
        loadOptionsDependsOn: ['channelId']
      },
      displayOptions: {
        show: {
          messageType: ['facebook_template']
        }
      }
    },
    {
      displayName: 'Facebook Template Language Code',
      name: 'templateLanguageCode',
      type: 'options',
      required: true,
      default: '',
      description: 'The language code of the approved Facebook template.',
      typeOptions: {
        loadOptionsMethod: 'getMessengerTemplateLanguageCodes',
        loadOptionsDependsOn: ['templateId']
      },
      displayOptions: {
        show: {
          messageType: ['facebook_template'],
          templateId: [{ _cnd: { exists: true } }]
        }
      },
    },
    {
      displayName: 'Template\'s Header / Body preview will be available at the bottom of the section',
      name: 'templatePreviewNotice',
      type: 'notice',
      required: false,
      default: '',
      description: 'This is informational only. The template\'s header and body preview will be available at the bottom of the section after selecting the template.',
      displayOptions: {
        show: {
          messageType: ['facebook_template'],
          templateId: [{ _cnd: { exists: true } }]
        }
      },
    },
    {
      displayName: 'Catalog type buttons will always send all products in the catalog, only MPM will allow to select products (updating the switch to disable for catalog will not actually remove it from the template message)',
      name: 'templateCatalogNotice',
      type: 'notice',
      required: false,
      default: '',
      description: 'This is informational only.',
      displayOptions: {
        show: {
          messageType: ['facebook_template'],
          templateId: [{ _cnd: { exists: true } }]
        }
      },
    },
    {
      displayName: 'Facebook Template Component Fields',
      name: 'messengerTemplateComponentFields',
      type: 'resourceMapper',
      default: {
        mappingMode: 'defineBelow',
        value: null,
      },
      noDataExpression: true,
      required: true,
      typeOptions: {
        resourceMapper: {
          resourceMapperMethod: 'getMessengerTemplateComponentFields',
          mode: 'add',
          addAllFields: true,
          multiKeyMatch: true,
          supportAutoMap: false,
        },
        loadOptionsDependsOn: ['templateId']
      },
      displayOptions: {
        show: {
          messageType: ['facebook_template'],
          templateId: [{ _cnd: { exists: true } }],
        }
      }
    },
    {
      displayName: 'Template Preview (Informational Only)',
      name: 'templatePreview',
      type: 'options',
      description: 'Template content preview (informational only)',
      default: [],
      displayOptions: {
        show: {
          messageType: ['facebook_template'],
          templateId: [{ _cnd: { exists: true } }],
        }
      },
      typeOptions: {
        loadOptionsDependsOn: ['templateId'],
        loadOptionsMethod: 'getMessengerTemplatePreviewOptions',
      },
      options: []
    },
  ]
}
