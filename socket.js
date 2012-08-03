function check_for_multiplayergame() {
    // Receiver of the game runs this function
    window.gid = window.location.hash;
    var url = window.location.href;
    window.socket = new EasyWebSocket(url);
    window.socket.onopen = function(){
        window.socket.send(window.uid+':LoggedIn');
    }
    window.socket.onmessage = function(event){
        console.log("received "+ event.data);
        var message = event.data.split(':');
        var uid = message[0];
        var status = message[1];
        if (uid != window.uid && window.opponentUid == undefined) {
            // If another user has send the message, check it out
            if (status == 'LoggedIn') {
                // add user as opponent, usually not needed, this function run only when being second player
                window.opponentUid = uid;
            } else if (status == 'Settings') {
                console.log('receiving settings:', message);
                window.opponentUid = uid;
                var opponent_loc = message[2].split(',');
                var own_loc = message[3].split(',');
                window.startPos = new google.maps.LatLng(own_loc[0], own_loc[1]);
                window.goalPosition = new google.maps.LatLng(opponent_loc[0], opponent_loc[1]);
                window.opponentPos = new google.maps.LatLng(opponent_loc[0], opponent_loc[1]);
                set_difficulty(parseInt(message[4]));
                // setup game
                // start game, and send 'Ready' if ready
                startMultiPlayerGame();
            }
        } else if (uid == window.opponentUid) {
            if (status == 'Location') {
                var loc = message[2].split(',');
                window.opponentPos = new google.maps.LatLng(loc[0], loc[1]);
                window.opponentDist = loc[2];
                opponentMoved();
            } else if (status == 'Finish') {
                //finish game, you've probably lost it
                $('pano_canvas').grab(new Element('div.notice', {
                    id: 'gameover',
                    html: 'Aww!!<br/>You Lost! Your opponent has captured your flag!<br/>Refresh to play again!',
                }));
                $('gameover').highlight('#f88', '#fff');
            }
        }
    }
}

function init_multiplayergame() {
    // Owner of the game runs this function
    
    // setup game: open Socket w/ listeners, and setup own game (not start yet..
    
    window.gid = window.location.hash;
    var url = window.location.href;
    window.socket = new EasyWebSocket(url);
    window.socket.onopen = function(){
        window.socket.send(window.uid+':LoggedIn');
    }
    window.socket.onmessage = function(event){
        console.log("received "+ event.data);
        var message = event.data.split(':');
        var uid = message[0];
        var status = message[1];
        if (uid != window.uid && window.opponentUid == undefined) {
            // If another user has send the message, check it out
            if (status == 'LoggedIn') {
                // add user as opponent
                window.opponentUid = uid;
                // Send opponent Settings: both locations
                window.socket.send(window.uid+':Settings:' + 
                    window.startPos.lat()+','+window.startPos.lng()+':' +
                    window.goalPosition.lat()+','+window.goalPosition.lng()+':' +
                    window.difficulty);
            }
        } else if (uid == window.opponentUid) {
            if (status == 'Ready') {
                // start_game
                $('waiting_msg').dispose();
                startMultiPlayerGame();
            } else if (status == 'Location') {
                var loc = message[2].split(',');
                window.opponentPos = new google.maps.LatLng(loc[0], loc[1]);
                window.opponentDist = loc[2];
                opponentMoved();
            } else if (status == 'Finish') {
                //finish game, you've probably lost it
                $('pano_canvas').grab(new Element('div.notice', {
                    id: 'gameover',
                    html: 'Aww!!<br/>You Lost! Your opponent has captured your flag!<br/>Refresh to play again!',
                }));
                $('gameover').highlight('#f88', '#fff');
            }
        }
    }
    // Display Waiting message
    $('text_box').set('opacity', 0);
    $('disclaimer').set('opacity', 0);
    $('pano_canvas').grab(new Element('div.notice', {
        id: 'waiting_msg',
        html: 'Waiting for opponent to connect...'
    }));
}




