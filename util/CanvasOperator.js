const protons = require("protons");

const uint8arrayToString =  require('uint8arrays/to-string');

/**
 * @typedef {import('libp2p')} Libp2p
 */

const { Request } = protons(`
message Request{
    enum Type{
        DRAW_CANVAS_OPERATE = 0;
    }

    required Type type = 1;
    optional DrawCanvasOperate drawCanvasOperate = 2;
}

message DrawCanvasOperate{
    required int64 oldX = 1;
    required int64 oldY = 2;
    required int64 nextX = 3;
    required int64 nextY = 4;
    required bytes color = 5;
    required int64 bold = 6;
}
`);

class CanvasOperator{
    /**
     * 
     * @param {Libp2p} node 通信に使うためのlibp2pのnode
     * @param {string} topic pubsubで利用するtopic
     * @param {function} mesHandler
     */
    constructor(node,topic,mesHandler){

        this.node = node;
        this.topic = topic;

        this.mesHandler = mesHandler;

        this.connectedPeers = new Set();

        this.node.connectionManager.on('peer:connect',(conn)=>{
            const remotePeerInfo = conn.remotePeer.toB58String();
            if(this.connectedPeers.has(remotePeerInfo)) return;
            console.log('connected to', remotePeerInfo);
            this.connectedPeers.add(remotePeerInfo);
        });

        this.node.connectionManager.on('peer:disconnect',(conn)=>{
            const remotePeerInfo = conn.remotePeer.toB58String();
            console.log('disconnected from',remotePeerInfo);
            this.connectedPeers.delete(remotePeerInfo);
        })

        this._onMessage = this._onMessage.bind(this);

        if(this.node.isStarted()) this.join();
    }

    join(){
        this.node.pubsub.on(this.topic,this._onMessage);
        this.node.pubsub.subscribe(this.topic);
    }

    leave(){
        this.node.pubsub.removeListener(this.topic,this._onMessage);
        this.node.pubsub.unsubscribe(this.topic);
    }
    
    _onMessage(mes){
        try {
            const request = Request.decode(mes.data);
            switch(request.type){
                case Request.Type.DRAW_CANVAS_OPERATE:
                    this.mesHandler(`from: ${mes.from}, oldX: ${request.drawCanvasOperate.oldX}, oldY: ${request.drawCanvasOperate.oldY}, nextX: ${request.drawCanvasOperate.nextX},nextY: ${request.drawCanvasOperate.nextY} ,color: ${uint8arrayToString(request.drawCanvasOperate.color)}, bold: ${request.drawCanvasOperate.bold}`)
                    break;
                default:
                    break;
            }
        } catch (err) {
            console.error(err);
        }
    }
}


module.exports = CanvasOperator;
module.exports.TOPIC = 'osslab/demo/canvas/1.0.0';
module.exports.CLEARLINE = '\033[1A'