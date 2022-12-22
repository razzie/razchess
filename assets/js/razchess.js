class RPC {
    constructor() {
        var jrpc = new simple_jsonrpc();
        var room = $('#roomID').val()
        var socket = new WebSocket((window.location.protocol == 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host + '/ws/' + room);
        socket.onmessage = function(event) {
            jrpc.messageHandler(event.data);
        };
        jrpc.toStream = function(_msg){
            socket.send(_msg);
        };
        socket.onerror = function(error) {
            console.error("Error: " + error.message);
        };
        socket.onclose = function(event) {
            console.info('close code : ' + event.code + ' reason: ' + event.reason + ' clean: ' + event.wasClean);
        };
        this.jrpc = jrpc;
    }

    sendMove(san) {
        var serverResponse = null;
        this.jrpc.call('Session.Move', [san]).then(function(response) {
            serverResponse = response;
        });
        return serverResponse;
    }

    onUpdate(func) {
        this.jrpc.on('Session.Update', function(update) {
            func(update)
            return true
        })
    }
}

class InfoBar {
    constructor() {
        $('#infoBtn').click(function() {
            $('#infoBar').toggle();
        });        
    }

    update(status, wm, bm, fen) {
        var html = '<span>FEN: ' + fen + '</span><br />' + status;
        if (wm && wm[0].length > 0) {
            html += ' | ⚪ ' + wm[0] + '→' + wm[1];
        }
        if (bm && bm[0].length > 0) {
            html += ' | ⚫ ' + bm[0] + '→' + bm[1];
        }
        html += ' | <a href="/puzzle" target="_blank">Play a puzzle?</a>'
        $('#infoBar').html(html);
        document.title = status + ' - RazChess'
    }
}

class Game {
    constructor(rpc) {
        this.rpc = rpc;
        this.logic = new Chess();
        this.board = Chessboard('board', this.getBoardConfig());
        this.wm = null;
        this.bm = null;
        var instance = this;
        rpc.onUpdate(function(update) {
            instance.update(update);
        })
        $(window).resize(this.board.resize);
    }

    getBoardConfig() {
        var instance = this;
        var config = {
            draggable: true,
            onDragStart: function(source, piece, position, orientation) {
                return instance.onDragStart(source, piece, position, orientation);
            },
            onDrop: function(source, target) {
                return instance.onDrop(source, target);
            }
        }
        return config;
    }

    update(update) {
        this.logic = new Chess(update.fen);
        this.board.position(update.fen);
        this.wm = update.wm;
        this.bm = update.bm;
        this.colorLastMoves();
        if (this.onUpdateCallback) {
            this.onUpdateCallback(this.getStatus(), update.wm, update.bm, update.fen)
        }
    }

    onUpdate(func) {
        this.onUpdateCallback = func;
    }

    resize() {
        this.board.resize();
        this.colorLastMoves();
    }

    getStatus() {
        var moveColor = (this.logic.turn() === 'w' ? 'White' : 'Black')
        if (this.logic.in_checkmate()) {
          return 'Game over, ' + moveColor + ' is in checkmate.'
        }
        else if (this.logic.in_draw()) {
          return 'Game over, drawn position'
        }
        else {
          var status = moveColor + ' to move'
          if (this.logic.in_check()) {
            status += ', ' + moveColor + ' is in check'
          }
          return status
        }
    }
    
    colorLastMoves() {
        const squareClass = 'square-55d63'
        var $board = $('#board');
        $board.find('.' + squareClass).removeClass('highlight-white')
        $board.find('.square-' + this.wm[0]).addClass('highlight-white')
        $board.find('.square-' + this.wm[1]).addClass('highlight-white')
        $board.find('.' + squareClass).removeClass('highlight-black')
        $board.find('.square-' + this.bm[0]).addClass('highlight-black')
        $board.find('.square-' + this.bm[1]).addClass('highlight-black')
    }

    onDragStart(source, piece, position, orientation) {
        if (this.logic.game_over()) return false;
        if ((this.logic.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (this.logic.turn() === 'b' && piece.search(/^w/) !== -1)) {
            return false;
        }
    }
    
    onDrop(source, target) {
        var move = this.logic.move({
            from: source,
            to: target,
            promotion: 'q'
        });
        if (move === null) return 'snapback';
        if (this.rpc.sendMove(move.san) == false) return 'snapback';
    }
}

var rpc = new RPC();
var infoBar = new InfoBar();
var game = null;

rpc.onUpdate(function(update) {
    $('#loading').hide();
    $('#board').show();
    game = new Game(rpc, update);
    game.onUpdate(infoBar.update);
    game.update(update);
})