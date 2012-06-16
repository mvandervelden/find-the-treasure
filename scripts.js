function geoSuccess(position) {
    var s = document.querySelector('#status');

    if (s.className == 'success') {
        // not sure why we're hitting this twice in FF, I think it's to do with
        //a cached result coming back
        return;
    }

    s.innerHTML = "found you!";
    s.className = 'success';
    var myLoc = new google.maps.LatLng(position.coords.latitude, 
        position.coords.longitude);
    window.myLoc = myLoc;
    if (window.viewlocs) {
        $('localizer').set('html', myLoc);
    }
    initLocations(myLoc);
}

function geoError(msg) {
    var s = document.querySelector('#status');
    s.innerHTML = typeof msg == 'string' ? msg: "failed";
    s.className = 'fail';

    var startPos = new google.maps.LatLng(52.356056, 4.892968);
    window.myLoc = startPos;
    if (window.viewlocs) {
        $('localizer').set('html', startPos);
    }
    initLocations(startPos);
    // console.log(arguments);
}


function getRandomLoc(latlng, distance) {
    var diffLat = Math.abs(google.maps.geometry.spherical.computeOffset(
        latlng, distance, 0).lat() - google.maps.geometry.spherical.computeOffset(
            latlng, distance, 180).lat());
    var diffLng = Math.abs(google.maps.geometry.spherical.computeOffset(latlng, 
        distance, 90).lng() - google.maps.geometry.spherical.computeOffset(
            latlng, distance, 270).lng());
    return new google.maps.LatLng(latlng.lat() + Math.random() * diffLat, 
        latlng.lng() + Math.random() * diffLng);
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
    var svs = new google.maps.StreetViewService()
    svs.getPanoramaByLocation(latlng, 200,
    function(data, status) {
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
    if (window.viewdist) {
        var dist = google.maps.geometry.spherical.computeDistanceBetween(
                window.panorama.getPosition(), latlng);
    }
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
        console.log(window.hasMoved);
        console.log(window.goalPosition);
        window.hasMoved = true
        return
    }
    var currentLocation = window.panorama.getPosition()
    var dist = google.maps.geometry.spherical.computeDistanceBetween(
        currentLocation, window.goalPosition);
    //console.log(dist)
    if (dist > 50 && dist < 400) {
        getStreetName(window.panorama.getPosition(),
        function(streetname) {
            if (streetname != 'Unknown') {
                window.goal.setVisible((streetname == window.goalStreet))
            }
        });
    } else if (dist <= 50) {
        window.goal.setVisible(true);
    }
    if (dist < window.previousDistance) {
        $('text_box').set('html', 'Warmer!');
        $('text_box').highlight('#f88', '#fff');
    } else {
        $('text_box').set('html', 'Colder!');
        $('text_box').highlight('#88f', '#fff');
    }
    if (dist < 30) {
        $('text_box').set('html', 
            'Congratulations!! <br/> You found the treasure! <br/> Refresh to play again with a new treasure!');
        $('text_box').highlight('#f88', '#fff');
        $('bottom_box').fade('in');

    }
    var diff = google.maps.geometry.spherical.computeDistanceBetween(
        currentLocation, window.previousLocation);
    var time = new Date().getTime() / 1000;
    var timePassed = (time - window.previousTime);
    window.speeds.push((diff / 1000) / (timePassed / 3600));
    if (speeds.length > 6) {
        speeds.shift();
    }
    var total = 0;
    for (var i = 0; i < window.speeds.length; i++) {
        total += window.speeds[i];
    }
    total = total / window.speeds.length;

    if (window.viewlocs) {
        $('localizer').set('html', currentLocation);
    }
    if (window.viewspeed) {
        $('speedometer').set('html', Math.round(total * 100) / 100 + ' km/h');
    }
    if (window.viewdist) {
        $('distizer').set('html', Math.round(dist) + 'm to go');
    }
    if (window.viewmap) {
        window.peg.setPosition(currentLocation);
        window.map.setCenter(currentLocation);
    }

    window.previousDistance = dist;
    window.previousTime = time;
    window.previousLocation = currentLocation;
    console.log('moved');
}

function compassChanged() {
    var panoheading = window.panorama.getPov().heading;
    panoheading = ((panoheading + 180) % 360) - 180;
    var curlocation = window.panorama.getPosition();
    var goalheading = google.maps.geometry.spherical.computeHeading(
        curlocation, window.goal.position);

    var heading = ((goalheading - panoheading + 180) % 360) - 180;

    if (heading < -180 || heading > 180) {
        console.log('diff: ' + (goalheading - panoheading));
        console.log('head: ' + (((goalheading - panoheading + 180) % 360) - 180));
    }
    if (heading < 0) {
        var l_r = 'left';
    } else {
        var l_r = 'right';
    }
    $('compass-txt').set('html', 'Goal ' + Math.abs(Math.round(heading)) + '&deg; to the ' + l_r);
    var img = document.getElementById('cps_im');
    //[-180 -135 -90 -45 0]
    //[-157.5 112.5 67.5 22.5]
    if (heading < -157.5 || heading > 157.5) {
        $('cps_im').set('src', "compass180.png");
    } else if (heading < -112.5) {
        $('cps_im').set('src', "compass225.png");
    } else if (heading < -67.5) {
        $('cps_im').set('src', "compass270.png");
    } else if (heading < -22.5) {
        $('cps_im').set('src', "compass315.png");
    } else if (heading < 22.5) {
        $('cps_im').set('src', "compass0.png");
    } else if (heading < 67.5) {
        $('cps_im').set('src', "compass45.png");
    } else if (heading < 112.5) {
        $('cps_im').set('src', "compass90.png");
    } else if (heading < 157.5) {
        $('cps_im').set('src', "compass135.png");
    }
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
        var peg = new google.maps.MarkerImage('peggie.png');
        peg.anchor = new google.maps.Point(6, 16);
        peg.size = new google.maps.Size(24, 47);
        peg.scaledSize = new google.maps.Size(12, 23);
        window.peg = new google.maps.Marker({
            position: latlng,
            map: window.map,
            icon: peg,
            clickable: false,
        });
    }

    // Set some global variables
    window.previousLocation = latlng;
    window.hasMoved = false;

    // Add a listener to check whether the player is moving around SV
    google.maps.event.addListener(window.panorama, 'position_changed',
    function() {
        console.log('moved?');
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

function initLocations(startPos) {
    // Set the current position to the nearest Street View to the Start Location
    console.log(startPos);
    getClosestStreetView(startPos, setLocation);
    // Set the Treasure location randomly within certain distance of the start
    // position, somewhere where there is Street View
    var goal = getRandomLoc(startPos, window.distance);
    getClosestStreetView(goal, setGoalPosition);
}

function startGame() {
    if (window.lmode) {
        // Check whether the user's location can be tracked, otherwise take the default location to start.
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
        } else {
            geoError('not supported');
        }
    } else {
        var startPos = new google.maps.LatLng(52.356056, 4.892968);
        window.myLoc = startPos;
        if (window.viewlocs) {
            $('localizer').set('html', startPos);
        }
        initLocations(startPos);
    }
    $('hud').fade();
    $('gamemenu').set('html', 'Starting...');
}

function optionManager() {
    window.distance = 500;
    window.lmode = true;
    window.viewdist = true;
    window.viewmap = true;
    window.viewlocs = false;
    window.viewstreet = true;
    window.viewcompass = true;
    window.viewspeed = true;
    var d = Math.round(Math.sqrt(2 * Math.pow(window.distance, 2)));

    $('dmode').set('html', 'Max dist = ' + d + 'm');

    $('dmode').addEvent('click',
    function() {
        if (window.distance == 500) {
            window.distance = 1000;
        } else {
            window.distance = 500;
        }
        var d = Math.round(Math.sqrt(2 * Math.pow(window.distance, 2)));
        $('dmode').set('html', 'Max dist = ' + d + 'm');
    });

    $('lmode').addEvent('click',
    function() {
        if (window.lmode) {
            window.lmode = false;
            $('lmode').set('html', 'Using default location');
        } else {
            window.lmode = true;
            $('lmode').set('html', 'Using current location');
        }
    });

    $('showdist').addEvent('click',
    function() {
        if (window.viewdist) {
            window.viewdist = false;
            $('showdist').set('html', 'Distance invisible');
        } else {
            window.viewdist = true;
            $('showdist').set('html', 'Distance visible');
        }
    });
    $('showmap').addEvent('click',
    function() {
        if (window.viewmap) {
            window.viewmap = false;
            $('showmap').set('html', 'Map invisible');
        } else {
            window.viewmap = true;
            $('showmap').set('html', 'Map visible');
        }
    });
    $('showlocs').addEvent('click',
    function() {
        if (window.viewlocs) {
            window.viewlocs = false;
            $('showlocs').set('html', 'Coordinates invisible');
        } else {
            window.viewlocs = true;
            $('showlocs').set('html', 'Coordinates visible');
        }
    });
    $('showstreet').addEvent('click',
    function() {
        if (window.viewstreet) {
            window.viewstreet = false;
            $('showstreet').set('html', 'Goal street invisible');
        } else {
            window.viewstreet = true;
            $('showstreet').set('html', 'Goal street visible');
        }
    });

    $('tutorial').addEvent('click', startGame);

    $('start').addEvent('click', startGame);
}

function initialize() {
    optionManager();
}