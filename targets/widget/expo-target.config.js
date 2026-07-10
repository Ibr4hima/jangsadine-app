/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
    type: 'widget',
    name: 'Prieres',
    deploymentTarget: '17.0',
    entitlements: {
        'com.apple.security.application-groups': ['group.com.jangsadine.app'],
    },
}
