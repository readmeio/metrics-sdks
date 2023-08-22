declare const ApplyToReadMe: {
  readonly body: {
    readonly type: 'object';
    readonly properties: {
      readonly name: {
        readonly type: 'string';
        readonly minLength: 1;
        readonly description: 'Your full name';
        readonly default: 'Your Name';
      };
      readonly email: {
        readonly type: 'string';
        readonly format: 'email';
        readonly description: 'A valid email we can reach you at.';
        readonly default: 'you@example.com';
      };
      readonly job: {
        readonly type: 'string';
        readonly description: "The job you're looking to apply for (https://readme.com/careers).\n\nDefault: `Product Designer`";
        readonly enum: readonly ['Product Designer'];
        readonly default: 'Product Designer';
      };
      readonly pronouns: {
        readonly type: 'string';
        readonly description: 'Learn more at https://lgbtlifecenter.org/pronouns/';
      };
      readonly linkedin: {
        readonly type: 'string';
        readonly format: 'url';
        readonly description: 'What have you been up to the past few years?';
      };
      readonly github: {
        readonly type: 'string';
        readonly description: 'Or Bitbucket, Gitlab or anywhere else your code is hosted!';
        readonly format: 'url';
      };
      readonly coverLetter: {
        readonly type: 'string';
        readonly format: 'blob';
        readonly description: 'What should we know about you?';
      };
      readonly dontReallyApply: {
        readonly type: 'boolean';
        readonly description: 'Want to play with the API but not actually apply? Set this to true.';
        readonly default: false;
      };
    };
    readonly required: readonly ['name', 'email', 'job'];
    readonly $schema: 'http://json-schema.org/draft-04/schema#';
  };
};
declare const CreateCategory: {
  readonly body: {
    readonly type: 'object';
    readonly required: readonly ['title'];
    readonly properties: {
      readonly title: {
        readonly type: 'string';
        readonly description: 'A short title for the category. This is what will show in the sidebar.';
      };
      readonly type: {
        readonly type: 'string';
        readonly enum: readonly ['reference', 'guide'];
        readonly default: 'guide';
        readonly description: 'A category can be part of your reference or guide documentation, which is determined by this field.\n\nDefault: `guide`';
      };
    };
    readonly $schema: 'http://json-schema.org/draft-04/schema#';
  };
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly 'x-readme-version': {
            readonly type: 'string';
            readonly examples: readonly ['v3.0'];
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.';
          };
        };
        readonly required: readonly [];
      }
    ];
  };
  readonly response: {
    readonly '400': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'CATEGORY_INVALID';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const CreateChangelog: {
  readonly body: {
    readonly type: 'object';
    readonly properties: {
      readonly title: {
        readonly type: 'string';
        readonly description: 'Title of the changelog.';
      };
      readonly type: {
        readonly type: 'string';
        readonly enum: readonly ['', 'added', 'fixed', 'improved', 'deprecated', 'removed'];
        readonly description: 'Default: ';
      };
      readonly body: {
        readonly type: 'string';
        readonly description: 'Body content of the changelog.';
      };
      readonly hidden: {
        readonly type: 'boolean';
        readonly description: 'Visibility of the changelog.';
        readonly default: true;
      };
    };
    readonly required: readonly ['title', 'body'];
    readonly $schema: 'http://json-schema.org/draft-04/schema#';
  };
};
declare const CreateCustomPage: {
  readonly body: {
    readonly type: 'object';
    readonly properties: {
      readonly title: {
        readonly type: 'string';
        readonly description: 'Title of the custom page.';
      };
      readonly body: {
        readonly type: 'string';
        readonly description: 'Body formatted in Markdown (displayed by default).';
      };
      readonly html: {
        readonly type: 'string';
        readonly description: 'Body formatted in HTML (sanitized, only displayed if `htmlmode` is **true**).';
      };
      readonly htmlmode: {
        readonly type: 'boolean';
        readonly description: '**true** if `html` should be displayed, **false** if `body` should be displayed.';
        readonly default: false;
      };
      readonly hidden: {
        readonly type: 'boolean';
        readonly description: 'Visibility of the custom page.';
        readonly default: true;
      };
    };
    readonly required: readonly ['title'];
    readonly $schema: 'http://json-schema.org/draft-04/schema#';
  };
  readonly response: {
    readonly '400': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'CUSTOMPAGE_INVALID';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '401': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_NOTFOUND';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '403': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_MISMATCH';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const CreateDoc: {
  readonly body: {
    readonly type: 'object';
    readonly oneOf: readonly [
      {
        readonly required: readonly ['title', 'category'];
        readonly title: '`category` Parameter';
        readonly properties: {
          readonly title: {
            readonly type: 'string';
            readonly description: 'Title of the page.';
          };
          readonly type: {
            readonly type: 'string';
            readonly description: 'Type of the page. The available types all show up under the /docs/ URL path of your docs project (also known as the "guides" section). Can be "basic" (most common), "error" (page desribing an API error), or "link" (page that redirects to an external link).';
            readonly enum: readonly ['basic', 'error', 'link'];
          };
          readonly body: {
            readonly type: 'string';
            readonly description: 'Body content of the page, formatted in [ReadMe-flavored Markdown](https://docs.readme.com/rdmd/docs).';
          };
          readonly category: {
            readonly type: 'string';
            readonly description: 'Category ID of the page, which you can get through [the **Get all categories** endpoint](https://docs.readme.com/main/reference/getcategories).';
          };
          readonly hidden: {
            readonly type: 'boolean';
            readonly description: 'Visibility of the page.';
          };
          readonly order: {
            readonly type: 'integer';
            readonly description: 'The position of the page in your project sidebar.';
            readonly examples: readonly [999];
          };
          readonly parentDoc: {
            readonly type: 'string';
            readonly description: "The parent doc's ID, if the page is a subpage.";
          };
          readonly error: {
            readonly type: 'object';
            readonly properties: {
              readonly code: {
                readonly type: 'string';
                readonly description: 'The error code for docs with the "error" type.';
              };
            };
          };
          readonly categorySlug: {
            readonly type: 'string';
            readonly description: 'The slug of the category this page is associated with. You can get this through [the **Get all categories** endpoint](https://docs.readme.com/main/reference/getcategories). This field is an alternative to the `category` field.';
          };
          readonly parentDocSlug: {
            readonly type: 'string';
            readonly description: 'If this page is a subpage, this field will be the slug of the parent document. You can get this through https://docs.readme.com/main/reference/docs#getdoc. This field is an alternative to the `parentDoc` field.';
          };
        };
        readonly type: 'object';
      },
      {
        readonly required: readonly ['title', 'categorySlug'];
        readonly title: '`categorySlug` Parameter';
        readonly properties: {
          readonly title: {
            readonly type: 'string';
            readonly description: 'Title of the page.';
          };
          readonly type: {
            readonly type: 'string';
            readonly description: 'Type of the page. The available types all show up under the /docs/ URL path of your docs project (also known as the "guides" section). Can be "basic" (most common), "error" (page desribing an API error), or "link" (page that redirects to an external link).';
            readonly enum: readonly ['basic', 'error', 'link'];
          };
          readonly body: {
            readonly type: 'string';
            readonly description: 'Body content of the page, formatted in [ReadMe-flavored Markdown](https://docs.readme.com/rdmd/docs).';
          };
          readonly category: {
            readonly type: 'string';
            readonly description: 'Category ID of the page, which you can get through [the **Get all categories** endpoint](https://docs.readme.com/main/reference/getcategories).';
          };
          readonly hidden: {
            readonly type: 'boolean';
            readonly description: 'Visibility of the page.';
          };
          readonly order: {
            readonly type: 'integer';
            readonly description: 'The position of the page in your project sidebar.';
            readonly examples: readonly [999];
          };
          readonly parentDoc: {
            readonly type: 'string';
            readonly description: "The parent doc's ID, if the page is a subpage.";
          };
          readonly error: {
            readonly type: 'object';
            readonly properties: {
              readonly code: {
                readonly type: 'string';
                readonly description: 'The error code for docs with the "error" type.';
              };
            };
          };
          readonly categorySlug: {
            readonly type: 'string';
            readonly description: 'The slug of the category this page is associated with. You can get this through [the **Get all categories** endpoint](https://docs.readme.com/main/reference/getcategories). This field is an alternative to the `category` field.';
          };
          readonly parentDocSlug: {
            readonly type: 'string';
            readonly description: 'If this page is a subpage, this field will be the slug of the parent document. You can get this through https://docs.readme.com/main/reference/docs#getdoc. This field is an alternative to the `parentDoc` field.';
          };
        };
        readonly type: 'object';
      }
    ];
    readonly additionalProperties: true;
    readonly $schema: 'http://json-schema.org/draft-04/schema#';
  };
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly 'x-readme-version': {
            readonly type: 'string';
            readonly examples: readonly ['v3.0'];
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.';
          };
        };
        readonly required: readonly [];
      }
    ];
  };
  readonly response: {
    readonly '201': {
      readonly type: 'object';
      readonly properties: {
        readonly title: {
          readonly type: 'string';
          readonly description: 'Title of the page.';
        };
        readonly type: {
          readonly type: 'string';
          readonly description: 'Type of the page. The available types all show up under the /docs/ URL path of your docs project (also known as the "guides" section). Can be "basic" (most common), "error" (page desribing an API error), or "link" (page that redirects to an external link).\n\n`basic` `error` `link`';
          readonly enum: readonly ['basic', 'error', 'link'];
        };
        readonly body: {
          readonly type: 'string';
          readonly description: 'Body content of the page, formatted in [ReadMe-flavored Markdown](https://docs.readme.com/rdmd/docs).';
        };
        readonly category: {
          readonly type: 'string';
          readonly description: 'Category ID of the page, which you can get through [the **Get all categories** endpoint](https://docs.readme.com/main/reference/getcategories).';
        };
        readonly hidden: {
          readonly type: 'boolean';
          readonly description: 'Visibility of the page.';
        };
        readonly order: {
          readonly type: 'integer';
          readonly description: 'The position of the page in your project sidebar.';
          readonly examples: readonly [999];
        };
        readonly parentDoc: {
          readonly type: 'string';
          readonly description: "The parent doc's ID, if the page is a subpage.";
        };
        readonly error: {
          readonly type: 'object';
          readonly properties: {
            readonly code: {
              readonly type: 'string';
              readonly description: 'The error code for docs with the "error" type.';
            };
          };
        };
      };
      readonly additionalProperties: true;
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '400': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'DOC_INVALID';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '401': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_NOTFOUND';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '403': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_MISMATCH';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const CreateVersion: {
  readonly body: {
    readonly type: 'object';
    readonly properties: {
      readonly version: {
        readonly type: 'string';
        readonly description: 'Semantic Version';
      };
      readonly codename: {
        readonly type: 'string';
        readonly description: 'Dubbed name of version.';
      };
      readonly from: {
        readonly type: 'string';
        readonly description: 'Semantic Version to use as the base fork.';
      };
      readonly is_stable: {
        readonly type: 'boolean';
        readonly description: 'Should this be the **main** version?';
      };
      readonly is_beta: {
        readonly type: 'boolean';
        readonly default: true;
      };
      readonly is_hidden: {
        readonly type: 'boolean';
        readonly description: 'Should this be publically accessible?';
      };
      readonly is_deprecated: {
        readonly type: 'boolean';
        readonly description: 'Should this be deprecated? Only allowed in PUT operations.';
      };
    };
    readonly required: readonly ['version', 'from'];
    readonly $schema: 'http://json-schema.org/draft-04/schema#';
  };
  readonly response: {
    readonly '400': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'VERSION_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'VERSION_DUPLICATE';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'VERSION_FORK_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '401': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_NOTFOUND';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '403': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_MISMATCH';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '404': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'VERSION_FORK_NOTFOUND';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const DeleteApiSpecification: {
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly id: {
            readonly type: 'string';
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'ID of the API specification. The unique ID for each API can be found by navigating to your **API Definitions** page.';
          };
        };
        readonly required: readonly ['id'];
      }
    ];
  };
  readonly response: {
    readonly '400': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'SPEC_ID_INVALID';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '401': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_NOTFOUND';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '403': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_MISMATCH';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '404': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'SPEC_NOTFOUND';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const DeleteCategory: {
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly slug: {
            readonly type: 'string';
            readonly examples: readonly ['getting-started'];
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'A URL-safe representation of the category title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the category "Getting Started", enter the slug "getting-started".';
          };
        };
        readonly required: readonly ['slug'];
      },
      {
        readonly type: 'object';
        readonly properties: {
          readonly 'x-readme-version': {
            readonly type: 'string';
            readonly examples: readonly ['v3.0'];
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.';
          };
        };
        readonly required: readonly [];
      }
    ];
  };
  readonly response: {
    readonly '404': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'CATEGORY_NOTFOUND';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const DeleteChangelog: {
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly slug: {
            readonly type: 'string';
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'A URL-safe representation of the changelog title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the changelog "Owlet Weekly Update", enter the slug "owlet-weekly-update".';
          };
        };
        readonly required: readonly ['slug'];
      }
    ];
  };
};
declare const DeleteCustomPage: {
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly slug: {
            readonly type: 'string';
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'A URL-safe representation of the page title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the title "Getting Started", enter the slug "getting-started".';
          };
        };
        readonly required: readonly ['slug'];
      }
    ];
  };
  readonly response: {
    readonly '401': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_NOTFOUND';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '403': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_MISMATCH';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '404': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'CUSTOMPAGE_NOTFOUND';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const DeleteDoc: {
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly slug: {
            readonly type: 'string';
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'A URL-safe representation of the page title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the title "Getting Started", enter the slug "getting-started".';
          };
        };
        readonly required: readonly ['slug'];
      },
      {
        readonly type: 'object';
        readonly properties: {
          readonly 'x-readme-version': {
            readonly type: 'string';
            readonly examples: readonly ['v3.0'];
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.';
          };
        };
        readonly required: readonly [];
      }
    ];
  };
  readonly response: {
    readonly '401': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_NOTFOUND';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '403': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_MISMATCH';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '404': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'DOC_NOTFOUND';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const DeleteVersion: {
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly versionId: {
            readonly type: 'string';
            readonly examples: readonly ['v1.0.0'];
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Semver identifier for the project version. For best results, use the formatted `version_clean` value listed in the response from the [Get Versions endpoint](/reference/getversions).';
          };
        };
        readonly required: readonly ['versionId'];
      }
    ];
  };
  readonly response: {
    readonly '400': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'VERSION_CANT_REMOVE_STABLE';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '401': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_NOTFOUND';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '403': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_MISMATCH';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '404': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'VERSION_NOTFOUND';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const GetApiRegistry: {
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly uuid: {
            readonly type: 'string';
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'An API Registry UUID. This can be found by navigating to your API Reference page and viewing code snippets for Node with the `api` library.';
          };
        };
        readonly required: readonly ['uuid'];
      }
    ];
  };
  readonly response: {
    readonly '200': {
      readonly type: 'object';
      readonly additionalProperties: true;
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '404': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'REGISTRY_NOTFOUND';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const GetApiSchema: {
  readonly response: {
    readonly '200': {
      readonly type: 'object';
      readonly additionalProperties: true;
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const GetApiSpecification: {
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly perPage: {
            readonly type: 'integer';
            readonly default: 10;
            readonly minimum: 1;
            readonly maximum: 100;
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Number of items to include in pagination (up to 100, defaults to 10).';
          };
          readonly page: {
            readonly type: 'integer';
            readonly default: 1;
            readonly minimum: 1;
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Used to specify further pages (starts at 1).';
          };
        };
        readonly required: readonly [];
      },
      {
        readonly type: 'object';
        readonly properties: {
          readonly 'x-readme-version': {
            readonly type: 'string';
            readonly examples: readonly ['v3.0'];
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.';
          };
        };
        readonly required: readonly [];
      }
    ];
  };
  readonly response: {
    readonly '200': {
      readonly type: 'object';
      readonly properties: {
        readonly Link: {
          readonly type: 'string';
          readonly description: 'Pagination information. See https://docs.readme.com/main/reference/pagination for more information.';
        };
        readonly 'x-total-count': {
          readonly type: 'string';
          readonly description: 'The total amount of results, ignoring pagination. See https://docs.readme.com/main/reference/pagination for more information about pagination.';
        };
      };
    };
    readonly '400': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'VERSION_EMPTY';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '401': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_NOTFOUND';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '403': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_MISMATCH';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '404': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'VERSION_NOTFOUND';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const GetCategories: {
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly perPage: {
            readonly type: 'integer';
            readonly default: 10;
            readonly minimum: 1;
            readonly maximum: 100;
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Number of items to include in pagination (up to 100, defaults to 10).';
          };
          readonly page: {
            readonly type: 'integer';
            readonly default: 1;
            readonly minimum: 1;
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Used to specify further pages (starts at 1).';
          };
        };
        readonly required: readonly [];
      },
      {
        readonly type: 'object';
        readonly properties: {
          readonly 'x-readme-version': {
            readonly type: 'string';
            readonly examples: readonly ['v3.0'];
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.';
          };
        };
        readonly required: readonly [];
      }
    ];
  };
  readonly response: {
    readonly '200': {
      readonly type: 'object';
      readonly properties: {
        readonly Link: {
          readonly type: 'string';
          readonly description: 'Pagination information. See https://docs.readme.com/main/reference/pagination for more information.';
        };
        readonly 'x-total-count': {
          readonly type: 'string';
          readonly description: 'The total amount of results, ignoring pagination. See https://docs.readme.com/main/reference/pagination for more information about pagination.';
        };
      };
    };
  };
};
declare const GetCategory: {
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly slug: {
            readonly type: 'string';
            readonly examples: readonly ['getting-started'];
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'A URL-safe representation of the category title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the category "Getting Started", enter the slug "getting-started".';
          };
        };
        readonly required: readonly ['slug'];
      },
      {
        readonly type: 'object';
        readonly properties: {
          readonly 'x-readme-version': {
            readonly type: 'string';
            readonly examples: readonly ['v3.0'];
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.';
          };
        };
        readonly required: readonly [];
      }
    ];
  };
  readonly response: {
    readonly '404': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'CATEGORY_NOTFOUND';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const GetCategoryDocs: {
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly slug: {
            readonly type: 'string';
            readonly examples: readonly ['getting-started'];
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'A URL-safe representation of the category title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the category "Getting Started", enter the slug "getting-started".';
          };
        };
        readonly required: readonly ['slug'];
      },
      {
        readonly type: 'object';
        readonly properties: {
          readonly 'x-readme-version': {
            readonly type: 'string';
            readonly examples: readonly ['v3.0'];
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.';
          };
        };
        readonly required: readonly [];
      }
    ];
  };
  readonly response: {
    readonly '404': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'CATEGORY_NOTFOUND';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const GetChangelog: {
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly slug: {
            readonly type: 'string';
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'A URL-safe representation of the changelog title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the changelog "Owlet Update", enter the slug "owlet-update".';
          };
        };
        readonly required: readonly ['slug'];
      }
    ];
  };
};
declare const GetChangelogs: {
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly perPage: {
            readonly type: 'integer';
            readonly default: 10;
            readonly minimum: 1;
            readonly maximum: 100;
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Number of items to include in pagination (up to 100, defaults to 10).';
          };
          readonly page: {
            readonly type: 'integer';
            readonly default: 1;
            readonly minimum: 1;
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Used to specify further pages (starts at 1).';
          };
        };
        readonly required: readonly [];
      }
    ];
  };
  readonly response: {
    readonly '200': {
      readonly type: 'object';
      readonly properties: {
        readonly Link: {
          readonly type: 'string';
          readonly description: 'Pagination information. See https://docs.readme.com/main/reference/pagination for more information.';
        };
        readonly 'x-total-count': {
          readonly type: 'string';
          readonly description: 'The total amount of results, ignoring pagination. See https://docs.readme.com/main/reference/pagination for more information about pagination.';
        };
      };
    };
  };
};
declare const GetCustomPage: {
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly slug: {
            readonly type: 'string';
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'A URL-safe representation of the page title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the title "Getting Started", enter the slug "getting-started".';
          };
        };
        readonly required: readonly ['slug'];
      }
    ];
  };
  readonly response: {
    readonly '401': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_NOTFOUND';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '403': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_MISMATCH';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '404': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'CUSTOMPAGE_NOTFOUND';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const GetCustomPages: {
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly perPage: {
            readonly type: 'integer';
            readonly default: 10;
            readonly minimum: 1;
            readonly maximum: 100;
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Number of items to include in pagination (up to 100, defaults to 10).';
          };
          readonly page: {
            readonly type: 'integer';
            readonly default: 1;
            readonly minimum: 1;
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Used to specify further pages (starts at 1).';
          };
        };
        readonly required: readonly [];
      }
    ];
  };
  readonly response: {
    readonly '200': {
      readonly type: 'object';
      readonly properties: {
        readonly Link: {
          readonly type: 'string';
          readonly description: 'Pagination information. See https://docs.readme.com/main/reference/pagination for more information.';
        };
        readonly 'x-total-count': {
          readonly type: 'string';
          readonly description: 'The total amount of results, ignoring pagination. See https://docs.readme.com/main/reference/pagination for more information about pagination.';
        };
      };
    };
    readonly '401': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_NOTFOUND';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '403': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_MISMATCH';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const GetDoc: {
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly slug: {
            readonly type: 'string';
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'A URL-safe representation of the page title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the title "Getting Started", enter the slug "getting-started".';
          };
        };
        readonly required: readonly ['slug'];
      },
      {
        readonly type: 'object';
        readonly properties: {
          readonly 'x-readme-version': {
            readonly type: 'string';
            readonly examples: readonly ['v3.0'];
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.';
          };
        };
        readonly required: readonly [];
      }
    ];
  };
  readonly response: {
    readonly '200': {
      readonly type: 'object';
      readonly properties: {
        readonly title: {
          readonly type: 'string';
          readonly description: 'Title of the page.';
        };
        readonly type: {
          readonly type: 'string';
          readonly description: 'Type of the page. The available types all show up under the /docs/ URL path of your docs project (also known as the "guides" section). Can be "basic" (most common), "error" (page desribing an API error), or "link" (page that redirects to an external link).\n\n`basic` `error` `link`';
          readonly enum: readonly ['basic', 'error', 'link'];
        };
        readonly body: {
          readonly type: 'string';
          readonly description: 'Body content of the page, formatted in [ReadMe-flavored Markdown](https://docs.readme.com/rdmd/docs).';
        };
        readonly category: {
          readonly type: 'string';
          readonly description: 'Category ID of the page, which you can get through [the **Get all categories** endpoint](https://docs.readme.com/main/reference/getcategories).';
        };
        readonly hidden: {
          readonly type: 'boolean';
          readonly description: 'Visibility of the page.';
        };
        readonly order: {
          readonly type: 'integer';
          readonly description: 'The position of the page in your project sidebar.';
          readonly examples: readonly [999];
        };
        readonly parentDoc: {
          readonly type: 'string';
          readonly description: "The parent doc's ID, if the page is a subpage.";
        };
        readonly error: {
          readonly type: 'object';
          readonly properties: {
            readonly code: {
              readonly type: 'string';
              readonly description: 'The error code for docs with the "error" type.';
            };
          };
        };
      };
      readonly additionalProperties: true;
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '401': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_NOTFOUND';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '403': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_MISMATCH';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '404': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'DOC_NOTFOUND';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const GetOpenRoles: {
  readonly response: {
    readonly '200': {
      readonly type: 'array';
      readonly items: {
        readonly type: 'object';
        readonly properties: {
          readonly slug: {
            readonly type: 'string';
            readonly description: 'A slugified version of the job opening title.';
            readonly examples: readonly ['api-engineer'];
          };
          readonly title: {
            readonly type: 'string';
            readonly description: 'The job opening position.';
            readonly examples: readonly ['API Engineer'];
          };
          readonly description: {
            readonly type: 'string';
            readonly description: 'The description for this open position. This content is formatted as HTML.';
          };
          readonly pullquote: {
            readonly type: 'string';
            readonly description: 'A short pullquote for the open position.';
            readonly examples: readonly [
              'Deeply knowledgeable of the web, HTTP, and the API space.'
            ];
          };
          readonly location: {
            readonly type: 'string';
            readonly description: 'Where this position is located at.';
            readonly examples: readonly ['Remote'];
          };
          readonly department: {
            readonly type: 'string';
            readonly description: "The internal organization you'll be working in.";
            readonly examples: readonly ['Engineering'];
          };
          readonly url: {
            readonly type: 'string';
            readonly format: 'url';
            readonly description: 'The place where you can apply for the position!';
          };
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const GetProductionDoc: {
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly slug: {
            readonly type: 'string';
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'A URL-safe representation of the page title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the title "Getting Started", enter the slug "getting-started".';
          };
        };
        readonly required: readonly ['slug'];
      },
      {
        readonly type: 'object';
        readonly properties: {
          readonly 'x-readme-version': {
            readonly type: 'string';
            readonly examples: readonly ['v3.0'];
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.';
          };
        };
        readonly required: readonly [];
      }
    ];
  };
  readonly response: {
    readonly '200': {
      readonly type: 'object';
      readonly properties: {
        readonly title: {
          readonly type: 'string';
          readonly description: 'Title of the page.';
        };
        readonly type: {
          readonly type: 'string';
          readonly description: 'Type of the page. The available types all show up under the /docs/ URL path of your docs project (also known as the "guides" section). Can be "basic" (most common), "error" (page desribing an API error), or "link" (page that redirects to an external link).\n\n`basic` `error` `link`';
          readonly enum: readonly ['basic', 'error', 'link'];
        };
        readonly body: {
          readonly type: 'string';
          readonly description: 'Body content of the page, formatted in [ReadMe-flavored Markdown](https://docs.readme.com/rdmd/docs).';
        };
        readonly category: {
          readonly type: 'string';
          readonly description: 'Category ID of the page, which you can get through [the **Get all categories** endpoint](https://docs.readme.com/main/reference/getcategories).';
        };
        readonly hidden: {
          readonly type: 'boolean';
          readonly description: 'Visibility of the page.';
        };
        readonly order: {
          readonly type: 'integer';
          readonly description: 'The position of the page in your project sidebar.';
          readonly examples: readonly [999];
        };
        readonly parentDoc: {
          readonly type: 'string';
          readonly description: "The parent doc's ID, if the page is a subpage.";
        };
        readonly error: {
          readonly type: 'object';
          readonly properties: {
            readonly code: {
              readonly type: 'string';
              readonly description: 'The error code for docs with the "error" type.';
            };
          };
        };
      };
      readonly additionalProperties: true;
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '401': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_NOTFOUND';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '403': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_MISMATCH';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '404': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'DOC_NOTFOUND';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const GetProject: {
  readonly response: {
    readonly '200': {
      readonly type: 'object';
      readonly properties: {
        readonly name: {
          readonly type: 'string';
        };
        readonly subdomain: {
          readonly type: 'string';
        };
        readonly jwtSecret: {
          readonly type: 'string';
        };
        readonly baseUrl: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'The base URL for the project. If the project is not running under a custom domain, it will be `https://projectSubdomain.readme.io`, otherwise it can either be or `https://example.com` or, in the case of an enterprise child project `https://example.com/projectSubdomain`.';
        };
        readonly plan: {
          readonly type: 'string';
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '401': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_NOTFOUND';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '403': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_MISMATCH';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const GetVersion: {
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly versionId: {
            readonly type: 'string';
            readonly examples: readonly ['v1.0.0'];
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Semver identifier for the project version. For best results, use the formatted `version_clean` value listed in the response from the [Get Versions endpoint](/reference/getversions).';
          };
        };
        readonly required: readonly ['versionId'];
      }
    ];
  };
  readonly response: {
    readonly '401': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_NOTFOUND';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '403': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_MISMATCH';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '404': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'VERSION_NOTFOUND';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const GetVersions: {
  readonly response: {
    readonly '401': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_NOTFOUND';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '403': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_MISMATCH';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const SearchDocs: {
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly search: {
            readonly type: 'string';
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Search string to look for.';
          };
        };
        readonly required: readonly ['search'];
      },
      {
        readonly type: 'object';
        readonly properties: {
          readonly 'x-readme-version': {
            readonly type: 'string';
            readonly examples: readonly ['v3.0'];
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.';
          };
        };
        readonly required: readonly [];
      }
    ];
  };
  readonly response: {
    readonly '401': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_NOTFOUND';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '403': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_MISMATCH';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const UpdateApiSpecification: {
  readonly body: {
    readonly type: 'object';
    readonly properties: {
      readonly spec: {
        readonly description: 'OpenAPI/Swagger file. We accept JSON or YAML.';
        readonly type: 'string';
        readonly format: 'binary';
      };
    };
    readonly $schema: 'http://json-schema.org/draft-04/schema#';
  };
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly id: {
            readonly type: 'string';
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'ID of the API specification. The unique ID for each API can be found by navigating to your **API Definitions** page.';
          };
        };
        readonly required: readonly ['id'];
      }
    ];
  };
  readonly response: {
    readonly '400': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'SPEC_FILE_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'SPEC_ID_DUPLICATE';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'SPEC_ID_INVALID';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'SPEC_INVALID';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'SPEC_INVALID_SCHEMA';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'SPEC_VERSION_NOTFOUND';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '401': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_NOTFOUND';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '403': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_MISMATCH';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '408': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'SPEC_TIMEOUT';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const UpdateCategory: {
  readonly body: {
    readonly type: 'object';
    readonly properties: {
      readonly title: {
        readonly type: 'string';
        readonly description: 'A short title for the category. This is what will show in the sidebar.';
      };
      readonly type: {
        readonly type: 'string';
        readonly enum: readonly ['reference', 'guide'];
        readonly default: 'guide';
        readonly description: 'A category can be part of your reference or guide documentation, which is determined by this field.\n\nDefault: `guide`';
      };
    };
    readonly $schema: 'http://json-schema.org/draft-04/schema#';
  };
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly slug: {
            readonly type: 'string';
            readonly examples: readonly ['getting-started'];
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'A URL-safe representation of the category title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the category "Getting Started", enter the slug "getting-started".';
          };
        };
        readonly required: readonly ['slug'];
      },
      {
        readonly type: 'object';
        readonly properties: {
          readonly 'x-readme-version': {
            readonly type: 'string';
            readonly examples: readonly ['v3.0'];
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.';
          };
        };
        readonly required: readonly [];
      }
    ];
  };
  readonly response: {
    readonly '400': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'CATEGORY_INVALID';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '404': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'CATEGORY_NOTFOUND';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const UpdateChangelog: {
  readonly body: {
    readonly type: 'object';
    readonly properties: {
      readonly title: {
        readonly type: 'string';
        readonly description: 'Title of the changelog.';
      };
      readonly type: {
        readonly type: 'string';
        readonly enum: readonly ['', 'added', 'fixed', 'improved', 'deprecated', 'removed'];
        readonly description: 'Default: ';
      };
      readonly body: {
        readonly type: 'string';
        readonly description: 'Body content of the changelog.';
      };
      readonly hidden: {
        readonly type: 'boolean';
        readonly description: 'Visibility of the changelog.';
        readonly default: true;
      };
    };
    readonly required: readonly ['title', 'body'];
    readonly $schema: 'http://json-schema.org/draft-04/schema#';
  };
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly slug: {
            readonly type: 'string';
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'A URL-safe representation of the changelog title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the changelog "Owlet Weekly Update", enter the slug "owlet-weekly-update".';
          };
        };
        readonly required: readonly ['slug'];
      }
    ];
  };
};
declare const UpdateCustomPage: {
  readonly body: {
    readonly type: 'object';
    readonly properties: {
      readonly title: {
        readonly type: 'string';
        readonly description: 'Title of the custom page.';
      };
      readonly body: {
        readonly type: 'string';
        readonly description: 'Body formatted in Markdown (displayed by default).';
      };
      readonly html: {
        readonly type: 'string';
        readonly description: 'Body formatted in HTML (sanitized, only displayed if `htmlmode` is **true**).';
      };
      readonly htmlmode: {
        readonly type: 'boolean';
        readonly description: '**true** if `html` should be displayed, **false** if `body` should be displayed.';
        readonly default: false;
      };
      readonly hidden: {
        readonly type: 'boolean';
        readonly description: 'Visibility of the custom page.';
        readonly default: true;
      };
    };
    readonly required: readonly ['title'];
    readonly $schema: 'http://json-schema.org/draft-04/schema#';
  };
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly slug: {
            readonly type: 'string';
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'A URL-safe representation of the page title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the title "Getting Started", enter the slug "getting-started".';
          };
        };
        readonly required: readonly ['slug'];
      }
    ];
  };
  readonly response: {
    readonly '400': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'CUSTOMPAGE_INVALID';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '401': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_NOTFOUND';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '403': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_MISMATCH';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '404': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'CUSTOMPAGE_NOTFOUND';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const UpdateDoc: {
  readonly body: {
    readonly type: 'object';
    readonly properties: {
      readonly title: {
        readonly type: 'string';
        readonly description: 'Title of the page.';
      };
      readonly type: {
        readonly type: 'string';
        readonly description: 'Type of the page. The available types all show up under the /docs/ URL path of your docs project (also known as the "guides" section). Can be "basic" (most common), "error" (page desribing an API error), or "link" (page that redirects to an external link).';
        readonly enum: readonly ['basic', 'error', 'link'];
      };
      readonly body: {
        readonly type: 'string';
        readonly description: 'Body content of the page, formatted in [ReadMe-flavored Markdown](https://docs.readme.com/rdmd/docs).';
      };
      readonly category: {
        readonly type: 'string';
        readonly description: 'Category ID of the page, which you can get through [the **Get all categories** endpoint](https://docs.readme.com/main/reference/getcategories).';
      };
      readonly hidden: {
        readonly type: 'boolean';
        readonly description: 'Visibility of the page.';
      };
      readonly order: {
        readonly type: 'integer';
        readonly description: 'The position of the page in your project sidebar.';
        readonly examples: readonly [999];
      };
      readonly parentDoc: {
        readonly type: 'string';
        readonly description: "The parent doc's ID, if the page is a subpage.";
      };
      readonly error: {
        readonly type: 'object';
        readonly properties: {
          readonly code: {
            readonly type: 'string';
            readonly description: 'The error code for docs with the "error" type.';
          };
        };
      };
      readonly categorySlug: {
        readonly type: 'string';
        readonly description: 'The slug of the category this page is associated with. You can get this through [the **Get all categories** endpoint](https://docs.readme.com/main/reference/getcategories). This field is an alternative to the `category` field.';
      };
      readonly parentDocSlug: {
        readonly type: 'string';
        readonly description: 'If this page is a subpage, this field will be the slug of the parent document. You can get this through https://docs.readme.com/main/reference/docs#getdoc. This field is an alternative to the `parentDoc` field.';
      };
    };
    readonly additionalProperties: true;
    readonly $schema: 'http://json-schema.org/draft-04/schema#';
  };
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly slug: {
            readonly type: 'string';
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'A URL-safe representation of the page title. Slugs must be all lowercase, and replace spaces with hyphens. For example, for the title "Getting Started", enter the slug "getting-started".';
          };
        };
        readonly required: readonly ['slug'];
      },
      {
        readonly type: 'object';
        readonly properties: {
          readonly 'x-readme-version': {
            readonly type: 'string';
            readonly examples: readonly ['v3.0'];
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.';
          };
        };
        readonly required: readonly [];
      }
    ];
  };
  readonly response: {
    readonly '200': {
      readonly type: 'object';
      readonly properties: {
        readonly title: {
          readonly type: 'string';
          readonly description: 'Title of the page.';
        };
        readonly type: {
          readonly type: 'string';
          readonly description: 'Type of the page. The available types all show up under the /docs/ URL path of your docs project (also known as the "guides" section). Can be "basic" (most common), "error" (page desribing an API error), or "link" (page that redirects to an external link).\n\n`basic` `error` `link`';
          readonly enum: readonly ['basic', 'error', 'link'];
        };
        readonly body: {
          readonly type: 'string';
          readonly description: 'Body content of the page, formatted in [ReadMe-flavored Markdown](https://docs.readme.com/rdmd/docs).';
        };
        readonly category: {
          readonly type: 'string';
          readonly description: 'Category ID of the page, which you can get through [the **Get all categories** endpoint](https://docs.readme.com/main/reference/getcategories).';
        };
        readonly hidden: {
          readonly type: 'boolean';
          readonly description: 'Visibility of the page.';
        };
        readonly order: {
          readonly type: 'integer';
          readonly description: 'The position of the page in your project sidebar.';
          readonly examples: readonly [999];
        };
        readonly parentDoc: {
          readonly type: 'string';
          readonly description: "The parent doc's ID, if the page is a subpage.";
        };
        readonly error: {
          readonly type: 'object';
          readonly properties: {
            readonly code: {
              readonly type: 'string';
              readonly description: 'The error code for docs with the "error" type.';
            };
          };
        };
      };
      readonly additionalProperties: true;
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '400': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'DOC_INVALID';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '401': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_NOTFOUND';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '403': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_MISMATCH';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '404': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'DOC_NOTFOUND';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const UpdateVersion: {
  readonly body: {
    readonly type: 'object';
    readonly properties: {
      readonly version: {
        readonly type: 'string';
        readonly description: 'Semantic Version';
      };
      readonly codename: {
        readonly type: 'string';
        readonly description: 'Dubbed name of version.';
      };
      readonly from: {
        readonly type: 'string';
        readonly description: 'Semantic Version to use as the base fork.';
      };
      readonly is_stable: {
        readonly type: 'boolean';
        readonly description: 'Should this be the **main** version?';
      };
      readonly is_beta: {
        readonly type: 'boolean';
        readonly default: true;
      };
      readonly is_hidden: {
        readonly type: 'boolean';
        readonly description: 'Should this be publically accessible?';
      };
      readonly is_deprecated: {
        readonly type: 'boolean';
        readonly description: 'Should this be deprecated? Only allowed in PUT operations.';
      };
    };
    readonly required: readonly ['version', 'from'];
    readonly $schema: 'http://json-schema.org/draft-04/schema#';
  };
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly versionId: {
            readonly type: 'string';
            readonly examples: readonly ['v1.0.0'];
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Semver identifier for the project version. For best results, use the formatted `version_clean` value listed in the response from the [Get Versions endpoint](/reference/getversions).';
          };
        };
        readonly required: readonly ['versionId'];
      }
    ];
  };
  readonly response: {
    readonly '400': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'VERSION_CANT_DEMOTE_STABLE';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '401': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_NOTFOUND';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '403': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_MISMATCH';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '404': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'VERSION_NOTFOUND';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
declare const UploadApiSpecification: {
  readonly body: {
    readonly type: 'object';
    readonly properties: {
      readonly spec: {
        readonly description: 'OpenAPI/Swagger file. We accept JSON or YAML.';
        readonly type: 'string';
        readonly format: 'binary';
      };
    };
    readonly $schema: 'http://json-schema.org/draft-04/schema#';
  };
  readonly metadata: {
    readonly allOf: readonly [
      {
        readonly type: 'object';
        readonly properties: {
          readonly 'x-readme-version': {
            readonly type: 'string';
            readonly examples: readonly ['v3.0'];
            readonly $schema: 'http://json-schema.org/draft-04/schema#';
            readonly description: 'Version number of your docs project, for example, v3.0. By default the main project version is used. To see all valid versions for your docs project call https://docs.readme.com/main/reference/version#getversions.';
          };
        };
        readonly required: readonly [];
      }
    ];
  };
  readonly response: {
    readonly '400': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'SPEC_FILE_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'SPEC_INVALID';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'SPEC_INVALID_SCHEMA';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'SPEC_VERSION_NOTFOUND';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '401': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_EMPTY';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        },
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_NOTFOUND';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '403': {
      readonly oneOf: readonly [
        {
          readonly type: 'object';
          readonly properties: {
            readonly error: {
              readonly type: 'string';
              readonly description: 'An error code unique to the error received.';
              readonly default: 'APIKEY_MISMATCH';
            };
            readonly message: {
              readonly type: 'string';
              readonly description: 'The reason why the error occured.';
            };
            readonly suggestion: {
              readonly type: 'string';
              readonly description: 'A helpful suggestion for how to alleviate the error.';
            };
            readonly docs: {
              readonly type: 'string';
              readonly format: 'url';
              readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
              readonly examples: readonly [
                'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
              ];
            };
            readonly help: {
              readonly type: 'string';
              readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
              readonly examples: readonly ['If you need help, email support@readme.io'];
            };
            readonly poem: {
              readonly type: 'array';
              readonly description: 'A short poem we wrote you about your error.';
              readonly items: {
                readonly type: 'string';
              };
              readonly examples: readonly [
                "If you're seeing this error,",
                "Things didn't quite go the way we hoped.",
                'When we tried to process your request,',
                "Maybe trying again it'll work—who knows!"
              ];
            };
          };
        }
      ];
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
    readonly '408': {
      readonly type: 'object';
      readonly properties: {
        readonly error: {
          readonly type: 'string';
          readonly description: 'An error code unique to the error received.';
          readonly default: 'SPEC_TIMEOUT';
        };
        readonly message: {
          readonly type: 'string';
          readonly description: 'The reason why the error occured.';
        };
        readonly suggestion: {
          readonly type: 'string';
          readonly description: 'A helpful suggestion for how to alleviate the error.';
        };
        readonly docs: {
          readonly type: 'string';
          readonly format: 'url';
          readonly description: 'A [ReadMe Metrics](https://readme.com/metrics/) log URL where you can see more information the request that you made. If we have metrics URLs unavailable for your request, this URL will be a URL to our API Reference.';
          readonly examples: readonly [
            'https://docs.readme.com/logs/6883d0ee-cf79-447a-826f-a48f7d5bdf5f'
          ];
        };
        readonly help: {
          readonly type: 'string';
          readonly description: 'Information on where you can receive additional assistance from our wonderful support team.';
          readonly examples: readonly ['If you need help, email support@readme.io'];
        };
        readonly poem: {
          readonly type: 'array';
          readonly description: 'A short poem we wrote you about your error.';
          readonly items: {
            readonly type: 'string';
          };
          readonly examples: readonly [
            "If you're seeing this error,",
            "Things didn't quite go the way we hoped.",
            'When we tried to process your request,',
            "Maybe trying again it'll work—who knows!"
          ];
        };
      };
      readonly $schema: 'http://json-schema.org/draft-04/schema#';
    };
  };
};
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
