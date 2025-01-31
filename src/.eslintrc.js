module.exports = {
    root: true,
    extends: ['scratch', 'scratch/es6'],
    env: {
        browser: true
    },
    rules: {
        'valid-jsdoc': 'off',
        'max-len': ['error', {code: 200}]
    }
};
