function initProgressBar(init_dist) {
    if ($('status') != undefined) {
        $('status').dispose();
    }
    if ($('progress_bar') != undefined) {
        $('progress_bar').dispose();
    }
    window.initialDistance = init_dist;
    // Make a table with 31 cells: the first 5 are when you go negative, the 6th is 0, the rest for progress towards the goal
    $('status_bar').grab(new Element('table', {
        id: 'progress_bar',
        style: 'border-collapse:collapse;border-width: 1px; border-color:#000000; border-style: solid; position: relative; width:80%; height:40%; top:10px; left:10%;',
        border: "0",
        html: "<tr><td></td><td></td><td></td><td></td><td></td><td id='pl_first_cell'>0</td>"+
            "<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td>"+
            "</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>"+
            "<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td>"+
            "</td><td id='pl_last_cell'>"+init_dist.toFixed(0)+"</td></tr>"
    }));
    $('pl_first_cell').setStyle('border','1px solid black');
    $('pl_first_cell').setStyle('width','30px');
    $('pl_first_cell').setStyle('backgroundColor','yellow');
    $('pl_last_cell').setStyle('border','1px solid black');
    $('pl_last_cell').setStyle('width','60px');
    
    if (window.gamemode == 'MultiPlayer') {
        // Init opponent bar too
        if ($('opp_progress_bar') != undefined) {
            $('opp_progress_bar').dispose();
        }
        window.initialDistance = init_dist;
        // Make a table with 31 cells: the first 5 are when you go negative, the 6th is 0, the rest for progress towards the goal
        $('status_bar').grab(new Element('table', {
            id: 'opp_progress_bar',
            style: 'border-collapse:collapse;border-width: 1px; border-color:#000000; border-style: solid; position: relative; width:80%; height:40%; top:18px; left:10%;',
            border: "0",
            html: "<tr><td></td><td></td><td></td><td></td><td></td><td id='opp_first_cell'>0</td>"+
                "<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td>"+
                "</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>"+
                "<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td>"+
                "</td><td id='opp_last_cell'>"+init_dist.toFixed(0)+"</td></tr>"
        }));
        $('opp_first_cell').setStyle('border','1px solid black');
        $('opp_first_cell').setStyle('width','30px');
        $('opp_first_cell').setStyle('backgroundColor','yellow');
        $('opp_last_cell').setStyle('border','1px solid black');
        $('opp_last_cell').setStyle('width','60px');
    }
}

function updateProgressBar(dist) {
    var table_cells = $('progress_bar').getElements('td');
    
    if (dist > window.initialDistance) {
        // indicate your progress
        table_cells[4].setStyle('backgroundColor','red');
        
        // Negative progress
        var no_blocks = Math.min(Math.round(10.0*(dist - window.initialDistance)/window.initialDistance),4);
        for (var i=3;i>=0;i--) {
            if (i>=(4-no_blocks)) {
                table_cells[i].setStyle('backgroundColor','red');
            } else {
                table_cells[i].setStyle('backgroundColor','white');
            }
        }
        for (var i=6;i<=30;i++) {
            table_cells[i].setStyle('backgroundColor','white');
        }
    } else {
        // positive progress
        table_cells[6].setStyle('backgroundColor','green');
        
        var no_blocks = Math.round(24.0*(1-(dist/window.initialDistance)));

        for (var i=7;i<=30;i++) {
            if (i<no_blocks+7) {
                table_cells[i].setStyle('backgroundColor','green');
            } else {
                table_cells[i].setStyle('backgroundColor','white');
            }
        }
        for (var i=4;i>=0;i--) {
            table_cells[i].setStyle('backgroundColor','white');
        }
    }
}

function updateOpponentProgressBar(dist) {
    var table_cells = $('opp_progress_bar').getElements('td');

    if (dist > window.initialDistance) {
        // indicate your progress
        table_cells[4].setStyle('backgroundColor','red');
        
        // Negative progress
        var no_blocks = Math.min(Math.round(10.0*(dist - window.initialDistance)/window.initialDistance),4);
        for (var i=3;i>=0;i--) {
            if (i>=(4-no_blocks)) {
                table_cells[i].setStyle('backgroundColor','red');
            } else {
                table_cells[i].setStyle('backgroundColor','white');
            }
        }
        for (var i=6;i<=30;i++) {
            table_cells[i].setStyle('backgroundColor','white');
        }
    } else {
        // positive progress
        table_cells[6].setStyle('backgroundColor','green');
        
        var no_blocks = Math.round(24.0*(1-(dist/window.initialDistance)));

        for (var i=7;i<=30;i++) {
            if (i<no_blocks+7) {
                table_cells[i].setStyle('backgroundColor','green');
            } else {
                table_cells[i].setStyle('backgroundColor','white');
            }
        }
        for (var i=4;i>=0;i--) {
            table_cells[i].setStyle('backgroundColor','white');
        }
    }
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
        opp_peg.scaledSize = new google.maps.Size(12,23);
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
        curlocation, window.goalPosition);

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
