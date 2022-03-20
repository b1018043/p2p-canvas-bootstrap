const PeerId = require('peer-id')

async function main(){
    const id = await PeerId.create({ bits: 1024, keyType: 'RSA' })
    console.log(JSON.stringify(id.toJSON(), null, 2))
}

main()