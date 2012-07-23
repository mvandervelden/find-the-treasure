function initProgressBar(init_dist) {
    if ($('status') != undefined) {
        $('status').dispose();
    }
    window.initialDistance = init_dist;
    // Make a table with 31 cells: the first 5 are when you go negative, the 6th is 0, the rest for progress towards the goal
    $('status_bar').grab(new Element('table', {
        id: 'progress_bar',
        style: 'border-width: 1px; border-color:#000000; border-style: solid; position: relative; width:80%; height:40%; top:10px; left:10%;',
        border: "0",
        html: "<tr><td></td><td></td><td></td><td></td><td id='first_cell'>0</td>"+
            "<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td>"+
            "</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>"+
            "<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td>"+
            "</td><td></td><td id='last_cell'>"+init_dist.toFixed(1)+"</td></tr>"
    }));
}

function updateProgressBar(dist) {
    if (dist > window.intialDistance) {
        // Negative progress
        //TODO make progress bar updates
        $$('td')
    } else {
        var progressCells = Math.round(25*dist/window.initialDistance);
        // positive progress
    }
}

function updateOpponentProgressBar(dist) {
    
}

function updateHeatOMeter(dist) {
    if (dist < window.previousDistance) {
        $('heatometer').set('html', 'Warmer!');
        $('heat_box').highlight('#f88', '#fff');
    } else {
        $('heatometer').set('html', 'Colder!');
        $('heat_box').highlight('#88f', '#fff');
    }
}

function updateSpeedOMeter(currentLocation) {
    // Calculate Speed
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
    
    $('speedometer').set('html', Math.round(total * 10) / 10 + ' km/h');
    
    window.previousLocation = currentLocation;
    window.previousTime = time;
}

function initMap(latlng) {
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
    if (window.gamemode == "MultiPlayer") {
        var opp_peg = new google.maps.MarkerImage('peggie_opp.png');
        opp_peg.anchor = new google.maps.Point(6,16);
        opp_peg.size = new google.maps.Size(24,47);
        opp_peg.scaledSize = new google.maps.Size(2,23);
        window.opp_peg = new google.maps.Marker({
            position: window.opponentPos,
            map: window.map,
            icon: opp_peg,
            clickable: false,
        });
    }
}

function updateMap(currentLocation) {
    window.peg.setPosition(currentLocation);
    window.map.setCenter(currentLocation);
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
