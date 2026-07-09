export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', [
      'auth', 'activities', 'kanban', 'panel',
      'comments', 'evidence', 'roles', 'ui',
      'db', 'api', 'setup', 'deps', 'docs', 'ci'
    ]],
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style',
      'refactor', 'test', 'chore', 'ci'
    ]]
  }
}