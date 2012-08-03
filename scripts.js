function geoSuccess(position) {
    var status = document.querySelector('#status');

    if (status.className == 'success') {
        // not sure why we're hitting this twice in FF, I think it's to do with
        //a cached result coming back
        return;
    }

    status.innerHTML = "found you!";
    status.className = 'success';
    window.startPos = new google.maps.LatLng(position.coords.latitude, 
        position.coords.longitude);
    if (window.gamemode == "FreePlay") {
        initFreePlayLocations(window.startPos);
    } else if (window.gamemode == "MultiPlayer") {
        initMultiPlayerLocations(window.startPos);
    }
}

function geoError(msg) {
    var status = document.querySelector('#status');
    status.innerHTML = typeof msg == 'string' ? msg: "failed";
    status.className = 'fail';

    window.startPos = new google.maps.LatLng(52.356056, 4.892968);
    if (window.gamemode == "FreePlay") {
        initFreePlayLocations(window.startPos);
    } else if (window.gamemode == "MultiPlayer") {
        initMultiPlayerLocations(window.startPos);
    }
}


function getRandomLoc(latlng, distance) {
    // max distance is euclidean, get difference only in lat and lon, so convert to the max dist of both lat and lon for the diagonal
    distance = Math.sqrt(Math.pow(distance,2)/2)
    var diffLat = Math.abs(google.maps.geometry.spherical.computeOffset(
        latlng, distance, 0).lat() - google.maps.geometry.spherical.computeOffset(
            latlng, distance, 180).lat());
    var diffLng = Math.abs(google.maps.geometry.spherical.computeOffset(latlng, 
        distance, 90).lng() - google.maps.geometry.spherical.computeOffset(
            latlng, distance, 270).lng());
    // console.log('Set diffLat at: ');
    // console.log(diffLat);
    // console.log('this equals distance ');
    // console.log(distance)
    return new google.maps.LatLng(latlng.lat() + (Math.random()-.5) * 2*diffLat, 
        latlng.lng() + (Math.random()-.5) * 2 * diffLng);
}

function getStreetName(latlng, callback) {
    var geocoder = new google.maps.Geocoder()
    geocoder.geocode({
        'location': latlng
    },
    function(result, status) {
        if (result !== null) {
            //console.log(result)
            callback(result[0].address_components[1].short_name);
        } else {
            console.log(status)
            callback('Unknown');
        }
    }
    );
}

function getClosestStreetView(latlng, callback) {
    var svs = new google.maps.StreetViewService();
    svs.getPanoramaByLocation(latlng, 200, function(data, status) {
        if (status == "ZERO_RESULTS") {
            getClosestStreetView(getRandomLoc(latlng, window.distance), callback);
        } else {
            callback(data.location.latLng);
        }
    });
}

function setGoalPosition(latlng) {
    window.goalPosition = latlng;
    window.previousDistance = Infinity;
    window.previousTime = new Date().getTime();
    window.speeds = [];
    getStreetName(latlng,
    function(streetname) {
        window.goalStreet = streetname;
        if (window.viewstreet) {
            $('streetizer').set('html', 'at: ' + streetname);
        }
    });
    var dist = google.maps.geometry.spherical.computeDistanceBetween( window.startPos, window.goalPosition);
    initProgressBar(dist);
    
    var names = ['egg1.gif', 'egg2.gif', 'egg3.gif'];
    var xes = [102, 108, 112];
    var yes = [163, 120, 134];
    var rnd = Math.floor(Math.random() * 3);

    var markerImage = new google.maps.MarkerImage(names[rnd]);
    markerImage.size = new google.maps.Size(xes[rnd], yes[rnd]);
    markerImage.scaledSize = new google.maps.Size(xes[rnd], yes[rnd]);

    window.goal = new google.maps.Marker({
        position: latlng,
        map: window.panorama,
        icon: markerImage,
        title: 'Congrats!'
    });

    if (window.viewmap) {
        window.goalOnMap = new google.maps.Marker({
            position: latlng,
            map: window.map,
            clickable: false
        });
    }
    if (window.viewlocs) {
        $('goalizer').set('html', 'Goal: ' + latlng);
    }
    if (window.viewdist) {
        $('distizer').set('html', Math.round(dist) + 'm to go');
    }
}

function playerMoved() {
    if (!window.hasMoved || window.goalPosition == undefined) {
        window.hasMoved = true
        return
    }
    var currentLocation = window.panorama.getPosition()
    // calculate distance to goal
    var dist = google.maps.geometry.spherical.computeDistanceBetween(
        currentLocation, window.goalPosition);
    
    updateProgressBar(dist);
    updateHeatOMeter(dist);
    if (window.viewspeed) {
        updateSpeedOMeter(currentLocation);
    }
    if (window.viewmap) {
        updateMap(currentLocation);
    }
    
    if (window.gamemode == "MultiPlayer") {
        // Send location to opponent
        window.socket.send(window.uid+':Location:'+currentLocation.lat()+','+currentLocation.lng()+','+dist);
    }

    // Show goal marker if close enough
    if (dist > 100 && dist < 400) {
        getStreetName(window.panorama.getPosition(), function(streetname) {
            if (streetname != 'Unknown') {
                window.goal.setVisible((streetname == window.goalStreet))
            }
        });
    } else if (dist <= 100) {
        window.goal.setVisible(true);
    }
    if (dist < 30) {
        // Closer than 30m means reached the goal
        gameFinished();
    }
    
    window.previousDistance = dist;
}

function opponentMoved() {
    window.opponent.setPosition(window.opponentPos);
    if (window.viewmap) {
        window.opp_peg.setPosition(window.opponentPos);
    }
    updateOpponentProgressBar(window.opponentDist);
}

function setLocation(latlng) {
    // Set up the map
    var mapOptions = {
        center: latlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        zoom: 14,
        minZoom: 14,
        maxZoom: 14,
        disableDefaultUI: true,
        disableDoubleClickZoom: true,
        draggable: false,
        keyboardShortcuts: false
    };
    window.map = new google.maps.Map(document.getElementById('map_canvas'),
    mapOptions);

    if (window.viewmap) {
        $('map_box').fade();
    }
    if (window.viewcompass) {
        $('compass_box').fade();
    }
    $('speed_box').fade();
    $('heat_box').fade();
    $('info_box').fade();
    var menu = $('text_box').dispose();
    var menu = $('disclaimer').dispose();
    // Set up the Street View Panorama
    //window.panorama = window.map.getStreetView();
    window.panorama = new google.maps.StreetViewPanorama(
        document.getElementById('pano_canvas'));
    window.panorama.setPosition(latlng);
    window.panorama.setPov({
        heading: 265,
        zoom: 1,
        pitch: 0
    });
    window.panorama.setVisible(true);
    window.panorama.enableCloseButton = false;
    window.panorama.panControl = false;
    window.panorama.zoomControl = false;
    window.panorama.addressControl = false;
    window.map.setStreetView(window.panorama);
    if (window.viewmap) {
        initMap(latlng);
    }
    
    if (window.gamemode == "MultiPlayer") {
        // View Opponent in Street View
        var markerImage = new google.maps.MarkerImage('peggie_opp.png');
        markerImage.size = new google.maps.Size(300, 450);
        markerImage.scaledSize = new google.maps.Size(300, 450);

        window.opponent = new google.maps.Marker({
            position: window.opponentPos,
            map: window.panorama,
            icon: markerImage,
            title: 'Your Opponent'
        });
        
    }
    // Set some global variables
    window.previousLocation = latlng;
    window.hasMoved = false;

    // Add a listener to check whether the player is moving around SV
    google.maps.event.addListener(window.panorama, 'position_changed',
    function() {
        playerMoved();
        if (window.viewcompass) {
            compassChanged;
        }
    });

    if (window.viewcompass) {
        google.maps.event.addListener(window.panorama, 'pov_changed', 
            compassChanged);
    }

    document.getElementById("pano_canvas").focus();
}

function resetLocation(latlng) {
    window.panorama.setPosition(latlng);
    if (window.viewmap) {
        window.peg.setPosition(latlng);
    }
    // Set some global variables
    window.previousLocation = latlng;
    window.hasMoved = true;
}
function resetGoalPosition(latlng) {
    window.goalPosition = latlng;
    window.previousDistance = Infinity;
    window.previousTime = new Date().getTime();
    window.speeds = [];
    getStreetName(latlng,
    function(streetname) {
        window.goalStreet = streetname;
        if (window.viewstreet) {
            $('streetizer').set('html', 'at: ' + streetname);
        }
    });

    if (window.viewdist) {
        var dist = google.maps.geometry.spherical.computeDistanceBetween(
                window.panorama.getPosition(), latlng);
    }
    window.goal.setPosition(latlng);
    
    if (window.viewmap) {
        window.goalOnMap.setPosition(latlng);
    }
    if (window.viewlocs) {
        $('goalizer').set('html', 'Goal: ' + latlng);
    }
    if (window.viewdist) {
        $('distizer').set('html', Math.round(dist) + 'm to go');
    }
    var dist = google.maps.geometry.spherical.computeDistanceBetween(
                window.startPos, latlng);
    initProgressBar(dist);
    window.previousDistance = dist;
    updateSpeedOMeter(window.startPos);
    updateHeatOMeter(0);
}

function set_difficulty(diff) {
    //difficulty settings
    //  easy     0: heat_indicator + compass +  + map
    // normal    1: heat_indicator + compass
    // original  3: heat_indicator
    // With progress bar, distance is irrelevant: leave off, removed very easy setting
    if (diff == 0) {
        window.difficulty = 0;
        window.viewcompass = true;
        window.viewmap = true;
        return 'Easy';
    } else if (diff == 1) {
        window.difficulty = 1;
        window.viewcompass = true;
        window.viewmap = false;
        return 'Normal';
    } else if (diff == 2) {
        window.difficulty = 2;
        window.viewcompass = false;
        window.viewmap = false;
        return 'Original';
    } else {
        console.log("Something's wrong, not good diff setting" + diff);
        return 'None';
    }
}

function set_location(mode) {
    
    if (mode == 0) {
        window.locmode = 0;
        return 'At Yours! (use local data)';
    } else if (mode == 1) {
        window.locmode = 1;
        return 'Amsterdam';
    } else if (mode == 2) {
        window.locmode = 2;
        return 'New York';
    } else if (mode == 3) {
        window.locmode = 3;
        return 'Tokyo';
    } else {
        console.log("locmode too high?")
        console.log(mode);
        return 'None';
    }
}


function optionManager() {
    // distance default = 1000
    window.distance = 1000;
    // set default difficulty
    set_difficulty(1);
    
    // Default: no custum locations
    window.locmode = 3;
    
    // Speed always visible
    window.viewspeed = true;
    
    $('tutorial').addEvent('click', startTutorial);
    
    // $('campaign').addEvent('click', function() {
    //     $('tutorial').dispose();
    //     $('freeplay').dispose();
    //     $('multiplay').dispose();
    //     $('campaign').removeEvents('click');
    //     $('campaign').addEvent('click', reloadGame);
    //     
    //     // If campaign: get buttons to choose a level
    //     $('gamemenu').grab(new Element('div.menu-item', {id:'level1', html:'Under Construction...'}));
    //     // $('gamemenu').grab(new Element('div.menu-item', {id:'level2', html:'Level 2'}));
    //     // TODO Add levels
    // });
    
    $('freeplay').addEvent('click', function() {
        $('tutorial').dispose();
        // $('campaign').dispose();
        $('multiplay').dispose();
        $('freeplay').removeEvents('click');
        $('freeplay').addEvent('click', reloadGame);
        // If free play: get buttons to choose settings
        addSettingsButtons();
        
        $('gamemenu').grab(new Element('div.menu-item', {
            id:'start',
            html:'START GAME',
            events: {
               click: startFreePlayGame, 
            }
        }));
        
    });
    
    $('multiplay').addEvent('click', function() {
        set_difficulty(0);
        $('tutorial').dispose();
        // $('campaign').dispose();
        $('freeplay').dispose();
        $('multiplay').removeEvents('click');
        $('multiplay').addEvent('click', reloadGame);
        // If multiplayer: get buttons to choose settings
        addSettingsButtons();
        $('gamemenu').grab(new Element('div.menu-item', {
            id:'retrieve_url',
            html:"Retrieve this game's url",
            events: {
                click: function() {
                    $('locmode').dispose();
                    $('diffmode').dispose();
                    $('distmode').dispose();
                    $('retrieve_url').dispose();
                    // Setup details for the socketservice to exchange: Game id
                    var game_id = Number.random(0,9999999999999999).toString();
                    var url = window.location.href + "#" + game_id.toString();
        
                    setupMultiPlayerGame();
        
                    // TODO Make this look nice
                    $('gamemenu').grab(new Element('div.menu_message', {
                        html: "Send the following link to your opponent, and click it yourself"
                    }));
                    $('gamemenu').grab(new Element('a.menu_message', {
                        id: 'mgame_url',
                        href: "#"+game_id.toString(),
                        html: url
                    }));
                    
                }
            }
        }))
        
    });
}

function addSettingsButtons() {
    // If free play: get buttons to choose settings
    $('gamemenu').grab(new Element('div.menu-item', {
        id:'locmode',
        html:'Location: '+ set_location(window.locmode),
        events: {
            click: function() {
                var loc = set_location((window.locmode+1)%4);
                $('locmode').set('html', 'Location: ' + loc);
            }
        }
    }));
    $('gamemenu').grab(new Element('div.menu-item', {
        id:'diffmode', 
        html:'Difficulty: ' +set_difficulty(window.difficulty),
        events: {
            click: function() {
                var s = set_difficulty((window.difficulty+1)%3);
                $('diffmode').set('html', 'Difficulty: ' + s);
            }
        }
    }));
    $('gamemenu').grab(new Element('div.menu-item', {
        id:'distmode', 
        html:'Distance: 1000m',
        events: {
            click: function() {
                if (window.distance == 1000) {
                    window.distance = 2000;
                } else if (window.distance == 2000){
                    window.distance = 500;
                } else {
                    window.distance = 1000;
                }
                
                $('distmode').set('html', 'Distance:  ' + window.distance + 'm');
            }
        }
    }));
}

function initialize() {
    // Create user ID
    window.uid = Number.random(0,9999999999999999).toString();
    window.gid = undefined;
    console.log('uid: '+ window.uid);
    // Look for location hash: it defines the game ID
    if (window.location.hash != "") {
        check_for_multiplayergame();
    }
    // Add listener for hashtag in url -> if so, you're in a multiplayer game
    function locationHashChanged() {
        // Should happen when clicking the multiplayer start button
        console.log('hashchanged')
        if (!window.gid) {
            init_multiplayergame();
        } else {
            console.log("Changing hash! warning! Will not do anything!")
            // TODO
        }
    }
    window.onhashchange = locationHashChanged;
    // Set all options in the menu
    optionManager();
}

function reloadGame() {
    window.location.reload();
}
