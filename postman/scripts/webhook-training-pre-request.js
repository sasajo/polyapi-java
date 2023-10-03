const postmanCollection = require('postman-collection');

const templateBodyParts = pm.request.body.raw.split('{');

templateBodyParts[1] = `"templateBody": "${btoa(pm.request.body.raw)}", ${templateBodyParts[1]}`

pm.request.update({
    body: new postmanCollection.RequestBody({
        mode: 'raw',
        raw: templateBodyParts.join('{'),
        options: {
            raw: {
                language: 'json'
            }
        }
    })
})