function startTutorial() {
    window.gamemode = "Tutorial";
    set_difficulty(0);
    window.tutorial = 1;
    window.locmode = false;
    window.distance = 500;
    window.startPos = new google.maps.LatLng(37.55196925392104, -115.62652230262756);
    window.goalPosition = new google.maps.LatLng(37.55267523449285, -115.62758445739746);
    // Make sure there is SV there, so for original location, and destined other one, get SV locations
    getClosestStreetView(window.startPos, function(latlng) {
        window.startPos = latlng;
    });
    getClosestStreetView(window.goalPosition, function(goalloc) {
        window.goalPosition = goalloc;
    });

    setLocation(window.startPos);
    window.panorama.getPov().heading = 315;
    // Start text sequence
    window.tutorialSequence = 0;
    window.sequenceStrings = ["This is the game's main screen<br/>If you have used<br/>Google Street View before<br/>It might look familiar..."+
        "", "Depending on the difficulty setting<br/>there are some additions..."+
        "", "In the bottom right corner<br/>is the Map where you can trace<br/>your location. When you're close,<br/>the Treasure will appear too..."+
        "", "In the top left corner, there's the<br/>Treasure Compass!<br/>It points in the general direction<br/>of the Treasure"+
        "", "On the bottom, there's the<br/>Progress Bar!<br/>It shows how much progress you're making.."+
        "", "In the top center, there's your most reliable Source of Information:<br/>The HEAT INDICATOR<br/>It gives you a clue of your general direction..."+
        "", "In the top right, just for fun is your<br/>Speed-O-Meter<br/>..."+
        "", "In contrast to GMaps, you're ways of moving around have been limited a bit..."+
        "", "To move around in the game, you can either click on the ARROWS on the ROAD,<br/>somewhere in the Panorama,<br/>or use your KEYBOARD'S ARROW KEYS..."+
        "", "...(when using the keyboard, make sure to click the panorama once first)..."+
        "", "Let's see if you got the hang of this.<br/>Go to the Treasure!"]
    
    $('pano_canvas').grab(new Element('div.notice', {
        id: 'tutorial_box',
        style: 'width: 400px; top: 25%',
        html: 'Welcome to FindTheTreasure!<br/>This tutorial will explain everything.<br/>Please click this box to continue..',
        events: {
            click: function() {
                $('tutorial_box').set('html', sequenceStrings[window.tutorialSequence])
                window.tutorialSequence += 1;
                if (window.tutorialSequence >= sequenceStrings.length) {
                    if (window.tutorial == 1) {
                        setGoalPosition(window.goalPosition);
                    } else {
                        resetGoalPosition(window.goalPosition);
                    }
                }

            }
        }
    }))
    
}

function startFreePlayGame() {
    window.gamemode = 'FreePlay';
    if (window.locmode) {
        // Check whether the user's location can be tracked, otherwise take the default location to start.
        $('status_bar').grab(new Element('div', {
            id: 'status',
            html: 'checking geoLocation...',
        }));
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
        } else {
            geoError('not supported');
        }
    } else {
        var startPos = new google.maps.LatLng(52.356056, 4.892968);
        initFreePlayLocations(startPos);
    }
}

function initFreePlayLocations(startPos) {
    // Set the current position to the nearest Street View to the Start Location
    getClosestStreetView(startPos, setLocation);
    // Set the Treasure location randomly within certain distance of the start
    // position, somewhere where there is Street View
    var goal = getRandomLoc(startPos, window.distance);
    getClosestStreetView(goal, setGoalPosition);
}

function setupMultiPlayerGame() {
    window.gamemode = 'MultiPlayer';
    
    if (window.locmode) {
        // Check whether the user's location can be tracked, otherwise take the default location to start.
        $('status_bar').grab(new Element('div', {
            id: 'status',
            html: 'checking geoLocation...',
        }));
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
        } else {
            geoError('not supported');
        }
    } else {
        var startPos = new google.maps.LatLng(52.356056, 4.892968);
        initMultiPlayerLocations(startPos);
    }
}

function initMultiPlayerLocations(startPos) {
    // Make sure there is SV there, so for original location, and destined other one, get SV locations
    getClosestStreetView(startPos, function(latlng) {
        window.startPos = latlng;
        getClosestStreetView(getRandomLoc(latlng, window.distance), function(goalloc) {
            window.goalPosition = goalloc;
            window.opponentPos = new google.maps.LatLng(goalloc.lat(), goalloc.lng());
        });
    });
}

function startMultiPlayerGame() {
    window.gamemode = 'MultiPlayer';
    // Closest SV already done: set Location and GoalPosition immediately
    setLocation(window.startPos);
    setGoalPosition(window.goalPosition);
    window.socket.send(window.uid+':Ready');
}

function gameFinished() {
    if (!window.gamemode == "Tutorial") {
        $('pano_canvas').grab(new Element('div.notice', {
            id: 'gameover',
            html: 'Congrats!! <br/> You found the treasure! <br/> Click to play again!',
            events: {
                click: reloadGame,
            }
        }));
        $('gameover').highlight('#f88', '#fff');
        if (window.gamemode == "MultiPlayer") {
            window.socket.send(window.uid,':Finish');
        }
    } else if (window.tutorial == 1){
        // if tutorial, there's a box to add text to:
        $('tutorial_box').set('html','Congrats!<br/>You found your first treasure!<br/>Click to continue...')
        window.tutorialSequence = 0;
        window.sequenceStrings = ["Now, let's make this a bit more entertaining..."+
            "", "...Remember that the Treasure Compass and HEAT Indicator only give general directions..."+
            "", "...Street View, however, is limited to where the streets are, which makes Treasure Finding harder than it looks..."+
            "", "...So watch your Progress Meter or map!<br/>Try to find this one..."]
        window.startPos = new google.maps.LatLng(40.706283, -74.009444);
        window.goalPosition = new google.maps.LatLng(40.707748, -74.011729);
        // Make sure there is SV there, so for original location, and destined other one, get SV locations
        getClosestStreetView(window.startPos, function(latlng) {
            window.startPos = latlng;
        });
        getClosestStreetView(window.goalPosition, function(goalloc) {
            window.goalPosition = goalloc;
        });

        resetLocation(window.startPos);
        window.panorama.getPov().heading = 300;
        
        window.tutorial += 1;
    } else if (window.tutorial == 2) {
        // if tutorial, there's a box to add text to:
        $('tutorial_box').set('html','You found it!<br/>Sometimes, the ideal route is not available, but you managed anyway!<br/>Click to continue...')
        window.tutorialSequence = 0;
        window.sequenceStrings = ["To finish up, Find the San Pietro, here in Rome,<br/>..."+
        "", "...But take care!<br/>Sometimes gaps appear in Street View<br/>Clicking in the panorama can solve this...<br/>"+
        "", "But also take care because Street View might be confused on which road you mean.<br/>In this case, there's a chance you end up in one of the tunnels underneath the visible roads..."+
        "", "See for yourself and try to get to the San Pietro square!<br/>(hint, try to go right first)"]
        window.startPos = new google.maps.LatLng(41.89972967568921, 12.462868094444275);
        window.goalPosition = new google.maps.LatLng(41.902267, 12.458411);
        // Make sure there is SV there, so for original location, and destined other one, get SV locations
        getClosestStreetView(window.startPos, function(latlng) {
            window.startPos = latlng;
        });
        getClosestStreetView(window.goalPosition, function(goalloc) {
            window.goalPosition = goalloc;
        });
 
        resetLocation(window.startPos);
        window.panorama.getPov().heading = 270;
        
        window.tutorial += 1;
        
    } else if (window.tutorial == 3) {
        $('tutorial_box').set('html','Cheers! Now prepare yourself for the real deal. Click to return to the main screen...')
        $('tutorial_box').removeEvents('click');
        $('tutorial_box').addEvent('click', reloadGame);
    }
 
}

