module.exports = {
  "root": true,
  "ignorePatterns": [
    "debian/**/*",
    "docker/**/*",
    "ports/**/*",
    "scripts/**/*",
    "tests/**/*",
    "node_modules/**/*",
  ],
  "overrides": [
    {
      "files": ["*.ts"],
      "parser": "@typescript-eslint/parser",
      "parserOptions": {
        "createDefaultProgram": true,
        "tsconfigRootDir": __dirname,
        "project": ["./tsconfig.json"],
      },
      "extends": [
        "airbnb-typescript/base",
        "plugin:@angular-eslint/recommended"
      ],
      "plugins": [
        "rxjs",
        "rxjs-angular",
        "unicorn"
      ],
      "rules": {
        // TODO: Conflicts with ngx-translate-extract
        "prefer-template": "off",

        // Consciously altered from Airbnb
        "no-return-assign": "off",
        "no-empty": ["error", { "allowEmptyCatch": true }],
        "arrow-body-style": "off",
        "max-len": ["error", 120, 2, {
          "ignoreUrls": true,
          "ignoreComments": false,
          "ignoreRegExpLiterals": true,
          "ignoreStrings": true, // TODO: Consider enabling later.
          "ignoreTemplateLiterals": true
        }],
        "no-console": ["error", { allow: ["warn", "error", "info"] }],
        "import/order": ["error", {
          "groups": ["builtin", "external", ["internal", "parent", "sibling", "index"]],
          "pathGroups": [
            {
              "pattern": "app/**",
              "group": "parent",
              "position": "before",
            }
          ],
          "pathGroupsExcludedImportTypes": ["builtin", "internal"],
          "newlines-between": "never",
          "alphabetize": {
            "order": "asc",
            "caseInsensitive": false
          }
         }],
        "import/no-duplicates": ["error", {"considerQueryString": true}],
        "import/extensions": ["error", "ignorePackages", {
          "js": "never",
          "jsx": "never",
          "ts": "never",
          "tsx": "never"
        }],

        // TODO: Aibnb rules that are disabled for now as they cannot be fixed automatically
        "no-underscore-dangle": "off",
        "@typescript-eslint/naming-convention": "off",
        "class-methods-use-this": "off",
        "eqeqeq": "off",
        "import/prefer-default-export": "off",
        "consistent-return": "off",
        "no-plusplus": "off",
        "no-restricted-syntax": "off",
        "guard-for-in": "off",
        "no-param-reassign": "off",
        "@typescript-eslint/no-unused-expressions": "off",
        "prefer-destructuring": "off",
        "radix": "off",
        "@typescript-eslint/no-loop-func": "off",
        "no-await-in-loop": "off",
        "no-nested-ternary": "off",
        "implicit-arrow-linebreak": "off",
        "@typescript-eslint/no-shadow": "off",
        "no-restricted-globals": "off",
        "no-case-declarations": "off",
        "no-multi-str": "off",
        "max-classes-per-file": "off",
        "array-callback-return": "off",
        "@typescript-eslint/no-use-before-define": "off",
        "func-names": "off",
        "vars-on-top": "off",
        "no-useless-escape": "off",
        "no-cond-assign": "off",
        "no-mixed-operators": "off",
        "default-case": "off",
        "no-prototype-builtins": "off",
        "prefer-promise-reject-errors": "off",
        "operator-assignment": "off",
        "no-continue": "off",
        "import/no-cycle": "off",
        "no-multi-assign": "off",
        "no-self-assign": "off",
        "no-async-promise-executor": "off",
        "no-bitwise": "off",
        "import/no-mutable-exports": "off",
        "@typescript-eslint/member-ordering": "off",

        // Other temporary disables
        "@angular-eslint/component-class-suffix": "off",
        "@angular-eslint/no-input-rename": "off",
        "@typescript-eslint/dot-notation": "off",

        // Other overwrites
        "@typescript-eslint/lines-between-class-members": "off",
        "@angular-eslint/use-lifecycle-interface": ["error"],

        // Extra rules
        "@typescript-eslint/array-type": "error",
        "@typescript-eslint/explicit-member-accessibility": ["error", { accessibility: "no-public" }],
        "@typescript-eslint/no-inferrable-types": "error",
        "@typescript-eslint/ban-tslint-comment": "error",
        "@typescript-eslint/member-delimiter-style": "error",
        "@typescript-eslint/type-annotation-spacing": "error",
        "@typescript-eslint/ban-ts-comment": "error",
        "@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true }],
        "@typescript-eslint/no-unused-vars": "off",
        "unused-imports/no-unused-imports": "error",
        "unused-imports/no-unused-vars": ["error", {
          vars: "local",
          args: "after-used",
          argsIgnorePattern: "^_$"
        }],
        "@typescript-eslint/ban-types": ["error"],
        "unicorn/filename-case": ["error", { case: "kebabCase"}],

        // RxJS rules
        "rxjs/no-unsafe-takeuntil": ["error", {
          "alias": ["untilDestroyed"]
        }],
        "rxjs-angular/prefer-takeuntil": ["error", {
          "alias": ["untilDestroyed"],
          "checkComplete": false,
          "checkDecorators": ["Component"], // default
          "checkDestroy": false
        }],
        "rxjs/finnish": ["error", {
          "parameters": true,
          "properties": false, // TODO: Should be true, hard to implement now.
          "variables": true,
          "functions": false,
          "methods": false,
        }],
      }
    },
    {
      "files": ["*.html"],
      "parser": "@angular-eslint/template-parser",
      "plugins": [
        "@angular-eslint/template",
        "unused-imports",
      ],
      "rules": {}
    }
  ]
}
