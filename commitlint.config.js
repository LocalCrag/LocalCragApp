module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'scope-enum': [2, 'always', ['account', 'ascents', 'changelog', 'core', 'gallery', 'gym', 'maps', 'menu', 'menu-pages', 'news', 'ranking', 'scales', 'search', 'todos', 'topo', 'users']],
    },
};