const Libp2p = require('libp2p')

const TCP = require('libp2p-tcp')
const WebSocket = require('libp2p-websockets')
const WebRTCStar = require('libp2p-webrtc-star')
const wrtc = require('wrtc')

const {NOISE} = require('libp2p-noise')
const MPLEX = require('libp2p-mplex')

const Bootstrap = require('libp2p-bootstrap')
const MDNS = require('libp2p-mdns')
const KadDHT = require('libp2p-kad-dht')
const Gossipsub = require('libp2p-gossipsub')
const PubsubComment = require('../util/Comment')

const process = require('process')

;(async()=>{
    const node = await Libp2p.create({
        addresses:{
            listen: [
                '/ip4/0.0.0.0/tcp/0',
                '/ip4/0.0.0.0/tcp/0/ws'
            ]
        },
        modules: {
            transport: [TCP,WebRTCStar,WebSocket],
            connEncryption: [NOISE],
            streamMuxer: [MPLEX],
            peerDiscovery: [Bootstrap,MDNS],
            dht: KadDHT,
            pubsub: Gossipsub
        },
        config:{
            transport:{
                [WebRTCStar.prototype[Symbol.toStringTag]]:{
                    wrtc
                }
            },
            peerDiscovery:{
                bootstrap:{
                    list: ['/ip4/127.0.0.1/tcp/63785/ipfs/QmUBwCedZr52pm1mWEyqYDHr6NHdSaXqnKq1Z8W8T6ytpd']
                }
            },
            dht:{
                enabled: true,
                randomWalk: {
                    enabled: true
                }
            }
        }
    })

    node.connectionManager.on('peer:connect',(con)=>{
        console.info(`Con to ${con.remotePeer.toB58String()}`)
    })

    await node.start()
    console.log("libp2p has started")

    const pubsubComment = new PubsubComment(node,PubsubComment.TOPIC,({data})=>{
        console.log(data)
    })

    process.stdin.on('data',async(comment)=>{
        comment = comment.slice(0,-1)

        try{
            await pubsubComment.send(comment)
        }catch(err){
            console.error(err)
        }
    })

    const stop = async ()=>{
        await node.stop()
        console.log("libp2p has stopped")
        process.exit(1)
    }

    process.on('SIGTERM',stop)
    process.on('SIGINT',stop)

})()