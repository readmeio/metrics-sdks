const ApplyToReadMe = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, description: 'Your full name', default: 'Your Name' },
      email: {
        type: 'string',
        format: 'email',
        description: 'A valid email we can reach you at.',
        default: 'you@example.com',
      },
      job: {
        type: 'string',
        description: "The job you're looking to apply for (https://readme.com/careers).\n\nDefault: `Product Designer`",
        enum: ['Product Designer'],
        default: 'Product Designer',
      },
      pronouns: {
        type: 'string',
        description: 'Learn more at https://lgbtlifecenter.org/pronouns/',
      },
      linkedin: {
        type: 'string',
        format: 'url',
        description: 'What have you been up to the past few years?',
      },
      github: {
        type: 'string',
        description: 'Or Bitbucket, Gitlab or anywhere else your code is hosted!',
        format: 'url',
      },
      coverLetter: {
        type: 'string',
        format: 'blob',
        description: 'What should we know about you?',
      },
      dontReallyApply: {
        type: 'boolean',
        description: 'Want to play with the API but not actually apply? Set this to true.',
        default: false,
      },
    },
    required: ['name', 'email', 'job'],
    $schema: 'http://json-schema.org/draft-04/schema#',
  },
} as const;
const CreateCategory = {
  body: {
    type: 'object',
    required: ['title'],
    properties: {
      title: {
        type: 'string',
        description: 'A short title for the category. This is what will show in the sidebar.',
      },
      type: {
        type: 'string',
        enum: ['reference', 'guide'],
        default: 'guide',
        description:
          'A category can be part of your reference or guide documentation, which is determined by this field.\n\nDefault: `guide`',
      },
    },
    $schema: 'http://json-schema.org/draft-04/schema#',
  },
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          'x-readme-version': {
            type: 'string',
            examples: ['v3.0'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '400': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'CATEGORY_INVALID',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const CreateChangelog = {
  body: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Title of the changelog.' },
      type: {
        type: 'string',
        enum: ['', 'added', 'fixed', 'improved', 'deprecated', 'removed'],
        description: 'Default: ',
      },
      body: { type: 'string', description: 'Body content of the changelog.' },
      hidden: { type: 'boolean', description: 'Visibility of the changelog.', default: true },
    },
    required: ['title', 'body'],
    $schema: 'http://json-schema.org/draft-04/schema#',
  },
} as const;
const CreateCustomPage = {
  body: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Title of the custom page.' },
      body: { type: 'string', description: 'Body formatted in Markdown (displayed by default).' },
      html: {
        type: 'string',
        description: 'Body formatted in HTML (sanitized, only displayed if `htmlmode` is **true**).',
      },
      htmlmode: {
        type: 'boolean',
        description: '**true** if `html` should be displayed, **false** if `body` should be displayed.',
        default: false,
      },
      hidden: { type: 'boolean', description: 'Visibility of the custom page.', default: true },
    },
    required: ['title'],
    $schema: 'http://json-schema.org/draft-04/schema#',
  },
  response: {
    '400': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'CUSTOMPAGE_INVALID',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '401': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_NOTFOUND',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '403': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_MISMATCH',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const CreateDoc = {
  body: {
    type: 'object',
    oneOf: [
      {
        required: ['title', 'category'],
        title: '`category` Parameter',
        properties: {
          title: { type: 'string', description: 'Title of the page.' },
          type: {
            type: 'string',
            description:
              'Type of the page. The available types all show up under the /docs/ URL path of your docs project (also known as the "guides" section). Can be "basic" (most common), "error" (page desribing an API error), or "link" (page that redirects to an external link).',
            enum: ['basic', 'error', 'link'],
          },
          body: {
            type: 'string',
            description:
              'Body content of the page, formatted in [ReadMe-flavored Markdown](https://docs.readme.com/rdmd/docs).',
          },
          category: {
            type: 'string',
            description:
              'Category ID of the page, which you can get through [the **Get all categories** endpoint](https://docs.readme.com/main/reference/getcategories).',
          },
          hidden: { type: 'boolean', description: 'Visibility of the page.' },
          order: {
            type: 'integer',
            description: 'The position of the page in your project sidebar.',
            examples: [999],
          },
          parentDoc: {
            type: 'string',
            description: "The parent doc's ID, if the page is a subpage.",
          },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'The error code for docs with the "error" type.',
              },
            },
          },
          categorySlug: {
            type: 'string',
            description:
              'The slug of the category this page is associated with. You can get this through [the **Get all categories** endpoint](https://docs.readme.com/main/reference/getcategories). This field is an alternative to the `category` field.',
          },
          parentDocSlug: {
            type: 'string',
            description:
              'If this page is a subpage, this field will be the slug of the parent document. You can get this through https://docs.readme.com/main/reference/docs#getdoc. This field is an alternative to the `parentDoc` field.',
          },
        },
        type: 'object',
      },
      {
        required: ['title', 'categorySlug'],
        title: '`categorySlug` Parameter',
        properties: {
          title: { type: 'string', description: 'Title of the page.' },
          type: {
            type: 'string',
            description:
              'Type of the page. The available types all show up under the /docs/ URL path of your docs project (also known as the "guides" section). Can be "basic" (most common), "error" (page desribing an API error), or "link" (page that redirects to an external link).',
            enum: ['basic', 'error', 'link'],
          },
          body: {
            type: 'string',
            description:
              'Body content of the page, formatted in [ReadMe-flavored Markdown](https://docs.readme.com/rdmd/docs).',
          },
          category: {
            type: 'string',
            description:
              'Category ID of the page, which you can get through [the **Get all categories** endpoint](https://docs.readme.com/main/reference/getcategories).',
          },
          hidden: { type: 'boolean', description: 'Visibility of the page.' },
          order: {
            type: 'integer',
            description: 'The position of the page in your project sidebar.',
            examples: [999],
          },
          parentDoc: {
            type: 'string',
            description: "The parent doc's ID, if the page is a subpage.",
          },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'The error code for docs with the "error" type.',
              },
            },
          },
          categorySlug: {
            type: 'string',
            description:
              'The slug of the category this page is associated with. You can get this through [the **Get all categories** endpoint](https://docs.readme.com/main/reference/getcategories). This field is an alternative to the `category` field.',
          },
          parentDocSlug: {
            type: 'string',
            description:
              'If this page is a subpage, this field will be the slug of the parent document. You can get this through https://docs.readme.com/main/reference/docs#getdoc. This field is an alternative to the `parentDoc` field.',
          },
        },
        type: 'object',
      },
    ],
    additionalProperties: true,
    $schema: 'http://json-schema.org/draft-04/schema#',
  },
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          'x-readme-version': {
            type: 'string',
            examples: ['v3.0'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '201': {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the page.' },
        type: {
          type: 'string',
          description:
            'Type of the page. The available types all show up under the /docs/ URL path of your docs project (also known as the "guides" section). Can be "basic" (most common), "error" (page desribing an API error), or "link" (page that redirects to an external link).\n\n`basic` `error` `link`',
          enum: ['basic', 'error', 'link'],
        },
        body: {
          type: 'string',
          description:
            'Body content of the page, formatted in [ReadMe-flavored Markdown](https://docs.readme.com/rdmd/docs).',
        },
        category: {
          type: 'string',
          description:
            'Category ID of the page, which you can get through [the **Get all categories** endpoint](https://docs.readme.com/main/reference/getcategories).',
        },
        hidden: { type: 'boolean', description: 'Visibility of the page.' },
        order: {
          type: 'integer',
          description: 'The position of the page in your project sidebar.',
          examples: [999],
        },
        parentDoc: {
          type: 'string',
          description: "The parent doc's ID, if the page is a subpage.",
        },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'The error code for docs with the "error" type.' },
          },
        },
      },
      additionalProperties: true,
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'DOC_INVALID',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '401': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_NOTFOUND',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '403': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_MISMATCH',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const CreateVersion = {
  body: {
    type: 'object',
    properties: {
      version: { type: 'string', description: 'Semantic Version' },
      codename: { type: 'string', description: 'Dubbed name of version.' },
      from: { type: 'string', description: 'Semantic Version to use as the base fork.' },
      is_stable: { type: 'boolean', description: 'Should this be the **main** version?' },
      is_beta: { type: 'boolean', default: true },
      is_hidden: { type: 'boolean', description: 'Should this be publically accessible?' },
      is_deprecated: {
        type: 'boolean',
        description: 'Should this be deprecated? Only allowed in PUT operations.',
      },
    },
    required: ['version', 'from'],
    $schema: 'http://json-schema.org/draft-04/schema#',
  },
  response: {
    '400': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'VERSION_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'VERSION_DUPLICATE',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'VERSION_FORK_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '401': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_NOTFOUND',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '403': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_MISMATCH',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '404': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'VERSION_FORK_NOTFOUND',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const DeleteApiSpecification = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'ID of the API specification. The unique ID for each API can be found by navigating to your **API Definitions** page.',
          },
        },
        required: ['id'],
      },
    ],
  },
  response: {
    '400': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'SPEC_ID_INVALID',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '401': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_NOTFOUND',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '403': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_MISMATCH',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '404': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'SPEC_NOTFOUND',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const DeleteCategory = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            examples: ['getting-started'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A URL-safe representation of the category title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the category "Getting Started", enter the slug "getting-started".',
          },
        },
        required: ['slug'],
      },
      {
        type: 'object',
        properties: {
          'x-readme-version': {
            type: 'string',
            examples: ['v3.0'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '404': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'CATEGORY_NOTFOUND',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const DeleteChangelog = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A URL-safe representation of the changelog title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the changelog "Owlet Weekly Update", enter the slug "owlet-weekly-update".',
          },
        },
        required: ['slug'],
      },
    ],
  },
} as const;
const DeleteCustomPage = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A URL-safe representation of the page title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the title "Getting Started", enter the slug "getting-started".',
          },
        },
        required: ['slug'],
      },
    ],
  },
  response: {
    '401': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_NOTFOUND',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '403': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_MISMATCH',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '404': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'CUSTOMPAGE_NOTFOUND',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const DeleteDoc = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A URL-safe representation of the page title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the title "Getting Started", enter the slug "getting-started".',
          },
        },
        required: ['slug'],
      },
      {
        type: 'object',
        properties: {
          'x-readme-version': {
            type: 'string',
            examples: ['v3.0'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '401': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_NOTFOUND',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '403': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_MISMATCH',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '404': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'DOC_NOTFOUND',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const DeleteVersion = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          versionId: {
            type: 'string',
            examples: ['v1.0.0'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Semver identifier for the project version. For best results, use the formatted `version_clean` value listed in the response from the [Get Versions endpoint](/reference/getversions).',
          },
        },
        required: ['versionId'],
      },
    ],
  },
  response: {
    '400': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'VERSION_CANT_REMOVE_STABLE',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '401': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_NOTFOUND',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '403': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_MISMATCH',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '404': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'VERSION_NOTFOUND',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const GetApiRegistry = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          uuid: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'An API Registry UUID. This can be found by navigating to your API Reference page and viewing code snippets for Node with the `api` library.',
          },
        },
        required: ['uuid'],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      additionalProperties: true,
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '404': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'REGISTRY_NOTFOUND',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const GetApiSchema = {
  response: {
    '200': {
      type: 'object',
      additionalProperties: true,
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const GetApiSpecification = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          perPage: {
            type: 'integer',
            default: 10,
            minimum: 1,
            maximum: 100,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'Number of items to include in pagination (up to 100, defaults to 10).',
          },
          page: {
            type: 'integer',
            default: 1,
            minimum: 1,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'Used to specify further pages (starts at 1).',
          },
        },
        required: [],
      },
      {
        type: 'object',
        properties: {
          'x-readme-version': {
            type: 'string',
            examples: ['v3.0'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        Link: {
          type: 'string',
          description:
            'Pagination information. See https://docs.readme.com/main/reference/pagination for more information.',
        },
        'x-total-count': {
          type: 'string',
          description:
            'The total amount of results, ignoring pagination. See https://docs.readme.com/main/reference/pagination for more information about pagination.',
        },
      },
    },
    '400': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'VERSION_EMPTY',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '401': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_NOTFOUND',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '403': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_MISMATCH',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '404': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'VERSION_NOTFOUND',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const GetCategories = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          perPage: {
            type: 'integer',
            default: 10,
            minimum: 1,
            maximum: 100,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'Number of items to include in pagination (up to 100, defaults to 10).',
          },
          page: {
            type: 'integer',
            default: 1,
            minimum: 1,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'Used to specify further pages (starts at 1).',
          },
        },
        required: [],
      },
      {
        type: 'object',
        properties: {
          'x-readme-version': {
            type: 'string',
            examples: ['v3.0'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        Link: {
          type: 'string',
          description:
            'Pagination information. See https://docs.readme.com/main/reference/pagination for more information.',
        },
        'x-total-count': {
          type: 'string',
          description:
            'The total amount of results, ignoring pagination. See https://docs.readme.com/main/reference/pagination for more information about pagination.',
        },
      },
    },
  },
} as const;
const GetCategory = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            examples: ['getting-started'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A URL-safe representation of the category title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the category "Getting Started", enter the slug "getting-started".',
          },
        },
        required: ['slug'],
      },
      {
        type: 'object',
        properties: {
          'x-readme-version': {
            type: 'string',
            examples: ['v3.0'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '404': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'CATEGORY_NOTFOUND',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const GetCategoryDocs = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            examples: ['getting-started'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A URL-safe representation of the category title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the category "Getting Started", enter the slug "getting-started".',
          },
        },
        required: ['slug'],
      },
      {
        type: 'object',
        properties: {
          'x-readme-version': {
            type: 'string',
            examples: ['v3.0'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '404': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'CATEGORY_NOTFOUND',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const GetChangelog = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A URL-safe representation of the changelog title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the changelog "Owlet Update", enter the slug "owlet-update".',
          },
        },
        required: ['slug'],
      },
    ],
  },
} as const;
const GetChangelogs = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          perPage: {
            type: 'integer',
            default: 10,
            minimum: 1,
            maximum: 100,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'Number of items to include in pagination (up to 100, defaults to 10).',
          },
          page: {
            type: 'integer',
            default: 1,
            minimum: 1,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'Used to specify further pages (starts at 1).',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        Link: {
          type: 'string',
          description:
            'Pagination information. See https://docs.readme.com/main/reference/pagination for more information.',
        },
        'x-total-count': {
          type: 'string',
          description:
            'The total amount of results, ignoring pagination. See https://docs.readme.com/main/reference/pagination for more information about pagination.',
        },
      },
    },
  },
} as const;
const GetCustomPage = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A URL-safe representation of the page title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the title "Getting Started", enter the slug "getting-started".',
          },
        },
        required: ['slug'],
      },
    ],
  },
  response: {
    '401': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_NOTFOUND',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '403': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_MISMATCH',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '404': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'CUSTOMPAGE_NOTFOUND',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const GetCustomPages = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          perPage: {
            type: 'integer',
            default: 10,
            minimum: 1,
            maximum: 100,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'Number of items to include in pagination (up to 100, defaults to 10).',
          },
          page: {
            type: 'integer',
            default: 1,
            minimum: 1,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'Used to specify further pages (starts at 1).',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        Link: {
          type: 'string',
          description:
            'Pagination information. See https://docs.readme.com/main/reference/pagination for more information.',
        },
        'x-total-count': {
          type: 'string',
          description:
            'The total amount of results, ignoring pagination. See https://docs.readme.com/main/reference/pagination for more information about pagination.',
        },
      },
    },
    '401': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_NOTFOUND',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '403': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_MISMATCH',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const GetDoc = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A URL-safe representation of the page title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the title "Getting Started", enter the slug "getting-started".',
          },
        },
        required: ['slug'],
      },
      {
        type: 'object',
        properties: {
          'x-readme-version': {
            type: 'string',
            examples: ['v3.0'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the page.' },
        type: {
          type: 'string',
          description:
            'Type of the page. The available types all show up under the /docs/ URL path of your docs project (also known as the "guides" section). Can be "basic" (most common), "error" (page desribing an API error), or "link" (page that redirects to an external link).\n\n`basic` `error` `link`',
          enum: ['basic', 'error', 'link'],
        },
        body: {
          type: 'string',
          description:
            'Body content of the page, formatted in [ReadMe-flavored Markdown](https://docs.readme.com/rdmd/docs).',
        },
        category: {
          type: 'string',
          description:
            'Category ID of the page, which you can get through [the **Get all categories** endpoint](https://docs.readme.com/main/reference/getcategories).',
        },
        hidden: { type: 'boolean', description: 'Visibility of the page.' },
        order: {
          type: 'integer',
          description: 'The position of the page in your project sidebar.',
          examples: [999],
        },
        parentDoc: {
          type: 'string',
          description: "The parent doc's ID, if the page is a subpage.",
        },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'The error code for docs with the "error" type.' },
          },
        },
      },
      additionalProperties: true,
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '401': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_NOTFOUND',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '403': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_MISMATCH',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '404': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'DOC_NOTFOUND',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const GetOpenRoles = {
  response: {
    '200': {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            description: 'A slugified version of the job opening title.',
            examples: ['api-engineer'],
          },
          title: {
            type: 'string',
            description: 'The job opening position.',
            examples: ['API Engineer'],
          },
          description: {
            type: 'string',
            description: 'The description for this open position. This content is formatted as HTML.',
          },
          pullquote: {
            type: 'string',
            description: 'A short pullquote for the open position.',
            examples: ['Deeply knowledgeable of the web, HTTP, and the API space.'],
          },
          location: {
            type: 'string',
            description: 'Where this position is located at.',
            examples: ['Remote'],
          },
          department: {
            type: 'string',
            description: "The internal organization you'll be working in.",
            examples: ['Engineering'],
          },
          url: {
            type: 'string',
            format: 'url',
            description: 'The place where you can apply for the position!',
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const GetProductionDoc = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A URL-safe representation of the page title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the title "Getting Started", enter the slug "getting-started".',
          },
        },
        required: ['slug'],
      },
      {
        type: 'object',
        properties: {
          'x-readme-version': {
            type: 'string',
            examples: ['v3.0'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the page.' },
        type: {
          type: 'string',
          description:
            'Type of the page. The available types all show up under the /docs/ URL path of your docs project (also known as the "guides" section). Can be "basic" (most common), "error" (page desribing an API error), or "link" (page that redirects to an external link).\n\n`basic` `error` `link`',
          enum: ['basic', 'error', 'link'],
        },
        body: {
          type: 'string',
          description:
            'Body content of the page, formatted in [ReadMe-flavored Markdown](https://docs.readme.com/rdmd/docs).',
        },
        category: {
          type: 'string',
          description:
            'Category ID of the page, which you can get through [the **Get all categories** endpoint](https://docs.readme.com/main/reference/getcategories).',
        },
        hidden: { type: 'boolean', description: 'Visibility of the page.' },
        order: {
          type: 'integer',
          description: 'The position of the page in your project sidebar.',
          examples: [999],
        },
        parentDoc: {
          type: 'string',
          description: "The parent doc's ID, if the page is a subpage.",
        },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'The error code for docs with the "error" type.' },
          },
        },
      },
      additionalProperties: true,
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '401': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_NOTFOUND',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '403': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_MISMATCH',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '404': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'DOC_NOTFOUND',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const GetProject = {
  response: {
    '200': {
      type: 'object',
      properties: {
        name: { type: 'string' },
        subdomain: { type: 'string' },
        jwtSecret: { type: 'string' },
        baseUrl: {
          type: 'string',
          format: 'url',
          description:
            'The base URL for the project. If the project is not running under a custom domain, it will be `https://projectSubdomain.readme.io`, otherwise it can either be or `https://example.com` or, in the case of an enterprise child project `https://example.com/projectSubdomain`.',
        },
        plan: { type: 'string' },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '401': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_NOTFOUND',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '403': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_MISMATCH',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const GetVersion = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          versionId: {
            type: 'string',
            examples: ['v1.0.0'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Semver identifier for the project version. For best results, use the formatted `version_clean` value listed in the response from the [Get Versions endpoint](/reference/getversions).',
          },
        },
        required: ['versionId'],
      },
    ],
  },
  response: {
    '401': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_NOTFOUND',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '403': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_MISMATCH',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '404': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'VERSION_NOTFOUND',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const GetVersions = {
  response: {
    '401': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_NOTFOUND',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '403': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_MISMATCH',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const SearchDocs = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'Search string to look for.',
          },
        },
        required: ['search'],
      },
      {
        type: 'object',
        properties: {
          'x-readme-version': {
            type: 'string',
            examples: ['v3.0'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '401': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_NOTFOUND',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '403': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_MISMATCH',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const UpdateApiSpecification = {
  body: {
    type: 'object',
    properties: {
      spec: {
        description: 'OpenAPI/Swagger file. We accept JSON or YAML.',
        type: 'string',
        format: 'binary',
      },
    },
    $schema: 'http://json-schema.org/draft-04/schema#',
  },
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'ID of the API specification. The unique ID for each API can be found by navigating to your **API Definitions** page.',
          },
        },
        required: ['id'],
      },
    ],
  },
  response: {
    '400': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'SPEC_FILE_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'SPEC_ID_DUPLICATE',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'SPEC_ID_INVALID',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'SPEC_INVALID',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'SPEC_INVALID_SCHEMA',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'SPEC_VERSION_NOTFOUND',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '401': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_NOTFOUND',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '403': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_MISMATCH',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '408': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'SPEC_TIMEOUT',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const UpdateCategory = {
  body: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'A short title for the category. This is what will show in the sidebar.',
      },
      type: {
        type: 'string',
        enum: ['reference', 'guide'],
        default: 'guide',
        description:
          'A category can be part of your reference or guide documentation, which is determined by this field.\n\nDefault: `guide`',
      },
    },
    $schema: 'http://json-schema.org/draft-04/schema#',
  },
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            examples: ['getting-started'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A URL-safe representation of the category title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the category "Getting Started", enter the slug "getting-started".',
          },
        },
        required: ['slug'],
      },
      {
        type: 'object',
        properties: {
          'x-readme-version': {
            type: 'string',
            examples: ['v3.0'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '400': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'CATEGORY_INVALID',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '404': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'CATEGORY_NOTFOUND',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const UpdateChangelog = {
  body: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Title of the changelog.' },
      type: {
        type: 'string',
        enum: ['', 'added', 'fixed', 'improved', 'deprecated', 'removed'],
        description: 'Default: ',
      },
      body: { type: 'string', description: 'Body content of the changelog.' },
      hidden: { type: 'boolean', description: 'Visibility of the changelog.', default: true },
    },
    required: ['title', 'body'],
    $schema: 'http://json-schema.org/draft-04/schema#',
  },
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A URL-safe representation of the changelog title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the changelog "Owlet Weekly Update", enter the slug "owlet-weekly-update".',
          },
        },
        required: ['slug'],
      },
    ],
  },
} as const;
const UpdateCustomPage = {
  body: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Title of the custom page.' },
      body: { type: 'string', description: 'Body formatted in Markdown (displayed by default).' },
      html: {
        type: 'string',
        description: 'Body formatted in HTML (sanitized, only displayed if `htmlmode` is **true**).',
      },
      htmlmode: {
        type: 'boolean',
        description: '**true** if `html` should be displayed, **false** if `body` should be displayed.',
        default: false,
      },
      hidden: { type: 'boolean', description: 'Visibility of the custom page.', default: true },
    },
    required: ['title'],
    $schema: 'http://json-schema.org/draft-04/schema#',
  },
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A URL-safe representation of the page title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the title "Getting Started", enter the slug "getting-started".',
          },
        },
        required: ['slug'],
      },
    ],
  },
  response: {
    '400': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'CUSTOMPAGE_INVALID',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '401': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_NOTFOUND',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '403': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_MISMATCH',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '404': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'CUSTOMPAGE_NOTFOUND',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const UpdateDoc = {
  body: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Title of the page.' },
      type: {
        type: 'string',
        description:
          'Type of the page. The available types all show up under the /docs/ URL path of your docs project (also known as the "guides" section). Can be "basic" (most common), "error" (page desribing an API error), or "link" (page that redirects to an external link).',
        enum: ['basic', 'error', 'link'],
      },
      body: {
        type: 'string',
        description:
          'Body content of the page, formatted in [ReadMe-flavored Markdown](https://docs.readme.com/rdmd/docs).',
      },
      category: {
        type: 'string',
        description:
          'Category ID of the page, which you can get through [the **Get all categories** endpoint](https://docs.readme.com/main/reference/getcategories).',
      },
      hidden: { type: 'boolean', description: 'Visibility of the page.' },
      order: {
        type: 'integer',
        description: 'The position of the page in your project sidebar.',
        examples: [999],
      },
      parentDoc: { type: 'string', description: "The parent doc's ID, if the page is a subpage." },
      error: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'The error code for docs with the "error" type.' },
        },
      },
      categorySlug: {
        type: 'string',
        description:
          'The slug of the category this page is associated with. You can get this through [the **Get all categories** endpoint](https://docs.readme.com/main/reference/getcategories). This field is an alternative to the `category` field.',
      },
      parentDocSlug: {
        type: 'string',
        description:
          'If this page is a subpage, this field will be the slug of the parent document. You can get this through https://docs.readme.com/main/reference/docs#getdoc. This field is an alternative to the `parentDoc` field.',
      },
    },
    additionalProperties: true,
    $schema: 'http://json-schema.org/draft-04/schema#',
  },
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A URL-safe representation of the page title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the title "Getting Started", enter the slug "getting-started".',
          },
        },
        required: ['slug'],
      },
      {
        type: 'object',
        properties: {
          'x-readme-version': {
            type: 'string',
            examples: ['v3.0'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the page.' },
        type: {
          type: 'string',
          description:
            'Type of the page. The available types all show up under the /docs/ URL path of your docs project (also known as the "guides" section). Can be "basic" (most common), "error" (page desribing an API error), or "link" (page that redirects to an external link).\n\n`basic` `error` `link`',
          enum: ['basic', 'error', 'link'],
        },
        body: {
          type: 'string',
          description:
            'Body content of the page, formatted in [ReadMe-flavored Markdown](https://docs.readme.com/rdmd/docs).',
        },
        category: {
          type: 'string',
          description:
            'Category ID of the page, which you can get through [the **Get all categories** endpoint](https://docs.readme.com/main/reference/getcategories).',
        },
        hidden: { type: 'boolean', description: 'Visibility of the page.' },
        order: {
          type: 'integer',
          description: 'The position of the page in your project sidebar.',
          examples: [999],
        },
        parentDoc: {
          type: 'string',
          description: "The parent doc's ID, if the page is a subpage.",
        },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'The error code for docs with the "error" type.' },
          },
        },
      },
      additionalProperties: true,
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'DOC_INVALID',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '401': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_NOTFOUND',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '403': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_MISMATCH',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '404': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'DOC_NOTFOUND',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const UpdateVersion = {
  body: {
    type: 'object',
    properties: {
      version: { type: 'string', description: 'Semantic Version' },
      codename: { type: 'string', description: 'Dubbed name of version.' },
      from: { type: 'string', description: 'Semantic Version to use as the base fork.' },
      is_stable: { type: 'boolean', description: 'Should this be the **main** version?' },
      is_beta: { type: 'boolean', default: true },
      is_hidden: { type: 'boolean', description: 'Should this be publically accessible?' },
      is_deprecated: {
        type: 'boolean',
        description: 'Should this be deprecated? Only allowed in PUT operations.',
      },
    },
    required: ['version', 'from'],
    $schema: 'http://json-schema.org/draft-04/schema#',
  },
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          versionId: {
            type: 'string',
            examples: ['v1.0.0'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Semver identifier for the project version. For best results, use the formatted `version_clean` value listed in the response from the [Get Versions endpoint](/reference/getversions).',
          },
        },
        required: ['versionId'],
      },
    ],
  },
  response: {
    '400': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'VERSION_CANT_DEMOTE_STABLE',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '401': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_NOTFOUND',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '403': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_MISMATCH',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '404': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'VERSION_NOTFOUND',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const UploadApiSpecification = {
  body: {
    type: 'object',
    properties: {
      spec: {
        description: 'OpenAPI/Swagger file. We accept JSON or YAML.',
        type: 'string',
        format: 'binary',
      },
    },
    $schema: 'http://json-schema.org/draft-04/schema#',
  },
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          'x-readme-version': {
            type: 'string',
            examples: ['v3.0'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '400': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'SPEC_FILE_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'SPEC_INVALID',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'SPEC_INVALID_SCHEMA',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'SPEC_VERSION_NOTFOUND',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '401': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_EMPTY',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_NOTFOUND',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '403': {
      oneOf: [
        {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'An error code unique to the error received.',
              default: 'APIKEY_MISMATCH',
            },
            message: { type: 'string', description: 'The reason why the error occured.' },
            suggestion: {
              type: 'string',
              description: 'A helpful suggestion for how to alleviate the error.',
            },
            docs: {
              type: 'string',
              format: 'url',
              description:
                'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
              examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
            },
            help: {
              type: 'string',
              description:
                'Information on where you can receive additional assistance from our wonderful support team.',
              examples: ['If you need help, email support@readme.io'],
            },
            poem: {
              type: 'array',
              description: 'A short poem we wrote you about your error.',
              items: { type: 'string' },
              examples: [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!",
              ],
            },
          },
        },
      ],
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '408': {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          description: 'An error code unique to the error received.',
          default: 'SPEC_TIMEOUT',
        },
        message: { type: 'string', description: 'The reason why the error occured.' },
        suggestion: {
          type: 'string',
          description: 'A helpful suggestion for how to alleviate the error.',
        },
        docs: {
          type: 'string',
          format: 'url',
          description:
            'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.',
          examples: ['https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'],
        },
        help: {
          type: 'string',
          description: 'Information on where you can receive additional assistance from our wonderful support team.',
          examples: ['If you need help, email support@readme.io'],
        },
        poem: {
          type: 'array',
          description: 'A short poem we wrote you about your error.',
          items: { type: 'string' },
          examples: [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!",
          ],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
export {
  ApplyToReadMe,
  CreateCategory,
  CreateChangelog,
  CreateCustomPage,
  CreateDoc,
  CreateVersion,
  DeleteApiSpecification,
  DeleteCategory,
  DeleteChangelog,
  DeleteCustomPage,
  DeleteDoc,
  DeleteVersion,
  GetApiRegistry,
  GetApiSchema,
  GetApiSpecification,
  GetCategories,
  GetCategory,
  GetCategoryDocs,
  GetChangelog,
  GetChangelogs,
  GetCustomPage,
  GetCustomPages,
  GetDoc,
  GetOpenRoles,
  GetProductionDoc,
  GetProject,
  GetVersion,
  GetVersions,
  SearchDocs,
  UpdateApiSpecification,
  UpdateCategory,
  UpdateChangelog,
  UpdateCustomPage,
  UpdateDoc,
  UpdateVersion,
  UploadApiSpecification,
};
