const Libp2p = require('libp2p')

const TCP = require('libp2p-tcp')
const WebSocket = require('libp2p-websockets')
const WebRTCStar = require('libp2p-webrtc-star')
const SignalingServer = require('libp2p-webrtc-star/src/sig-server')
const wrtc = require('wrtc')

const {NOISE} = require('libp2p-noise')
const MPLEX = require('libp2p-mplex')

const MDNS = require('libp2p-mdns')
const KadDHT = require('libp2p-kad-dht')
const Gossipsub = require('libp2p-gossipsub')

const process = require('process')

const PubsubComment = require('../util/CanvasOperator')

const PeerID = require('peer-id')
const ids = require('../id.json')

;(async()=>{

    const peerID = await PeerID.createFromJSON(ids)

    const signalingServer = await SignalingServer.start({
        port: 15555
    })

    const addrs = [
        '/ip4/0.0.0.0/tcp/63585',
        '/ip4/0.0.0.0/tcp/63586/ws'
    ]

    const ssAddr = `/ip4/${signalingServer.info.host}/tcp/${signalingServer.info.port}/ws/p2p-webrtc-star`
    console.info(`Signaling server running at ${ssAddr}`)
    addrs.push(ssAddr)

    const node = await createBootstrapNode(peerID,addrs)

    node.connectionManager.on('peer:connect',(con)=>{
        console.info(`Con to ${con.remotePeer.toB58String()}`)
    })

    await node.start()
    console.log("libp2p has started")

    console.log("listening on addresses:")
    node.multiaddrs.forEach(addr=>{
        console.log(`${addr.toString()}/p2p/${node.peerId.toB58String()}`)
    })

    const pubsubComment = new PubsubComment(node,PubsubComment.TOPIC,(data)=>{
        console.info(data)
    })

    const stop = async ()=>{
        pubsubComment.leave();
        await node.stop()
        console.log("libp2p has stopped")
        process.exit(1)
    }

    process.on('SIGTERM',stop)
    process.on('SIGINT',stop)

})().catch(e=>console.error(e));


const createBootstrapNode = (peerId,listenAddr)=>{
    return Libp2p.create({
        peerId,
        addresses:{
            listen: listenAddr
        },
        modules: {
            transport: [TCP,WebRTCStar,WebSocket],
            connEncryption: [NOISE],
            streamMuxer: [MPLEX],
            peerDiscovery: [MDNS],
            dht: KadDHT,
            pubsub: Gossipsub
        },
        config:{
            transport:{
                [WebRTCStar.prototype[Symbol.toStringTag]]:{
                    wrtc
                }
            },
            relay:{
                enabled: true,
                hop:{
                    enabled: true,
                    active: true
                }
            },
            dht:{
                enabled: true,
                randomWalk:{
                    enabled: true
                }
            }
        }
    })
}