$(document).ready(function() {

    var clock_ = false;
    var scale_ = false;
    var playing = false;
    var map_type = 0;
    var time_var = 0;
    var max_val = 0;
    var data_min = [], data_hour= [], data_day=[], data_month=[], data_year=[], data_static=[];
    var selected_pos = [];
    var data_table = [];
    var marker_color = "images/mm_20_red.png";
    var checkMenu;
    var timeLayerValue;
    var valueSlider;
    var maxSlider;
    var interval;
    var infowindows = [];
    var clustListener;


    $("#slider").slider();
    $( "#slider" ).css('background', 'rgb(58,51,64)');

    $('#check_label').hide();

    $("#slider").hide();
    $("#playSlider").hide();
    $("#layer-clk").hide();
    $("#timeLayer").hide();

    /* ================================================= */
    /* Method to initiate the map generation             */
    /* ================================================= */

    $('#gen_map').click(function(){
        $("#loading").fadeIn("slow", function(){updateMap(time_var);});
        $("#mapType").css("visibility", "visible");
        $("#analysis").css("visibility", "visible");
        if(time_var != 0) $("#slider").slider("value", $("#slider").slider("value"));
        selected_pos = data_static[0];
    });

    function updateMap( time_var ){
        switch (time_var) {
            case 0:
                populate_data();
                analyzeData(data_static);
                break;
            case 1:
                generate_slider(data_min);
                break;
            case 2:
                generate_slider(data_hour)
                break;
            case 3:
                generate_slider(data_day)
                break;
            case 4:
                generate_slider(data_month)
                break;
            case 5:
                generate_slider(data_year)
                break;
        }
        $("#loading").fadeOut("slow");
    }

    /* ================================================= */
    /* Method for dealing with the slide change event    */
    /* ================================================= */

    $("#slider").slider({
        change: function(event, ui){
            // =====================================================
            // Erase any data of the heatmap, marker or cluster map
            // =====================================================

            while(heatmap_data.length > 0){ // Loop to erase data from the heatmap vector
                heatmap_data.pop();
            }
            pointArray = new google.maps.MVCArray(heatmap_data);
            heatmap.setData(pointArray);
            for(var j = 0; j < markers.length; j++){ // Loop to erase markers vector
                markers[j].setMap(null);
            }
            markerCluster.clearMarkers();
            markers = [];
            infowindows = [];
            // =====================================================

            selected_pos = data_table[ui.value]; //Get the correct array of elements within the correct timestamp

            analyzeData(selected_pos);

            // =====================================================
            // Display the correct value on the Time Layer
            // =====================================================
            switch(time_var){
                case 1:
                    var aux = selected_pos[0].time.split(":");
                    timeLayerValue = "" + aux[0] + ":" + aux[1];
                    $("#timeLayer").val(timeLayerValue);
                    break;
                case 2:
                    var aux = selected_pos[0].time.split(":");
                    timeLayerValue = "" + aux[0] + ":" + aux[1];
                    $("#timeLayer").val(timeLayerValue);
                    break;
                case 3:
                    timeLayerValue = selected_pos[0].date;
                    $("#timeLayer").val(timeLayerValue);
                    break;
                case 4:
                    var aux = selected_pos[0].date.split("/");
                    timeLayerValue = "" + aux[0] + "/" + aux[2];
                    $("#timeLayer").val(timeLayerValue);
                    break;
                case 5:
                    var aux = selected_pos[0].date.split("/");
                    timeLayerValue = aux[2];
                    $("#timeLayer").val(timeLayerValue);
                    break;
            }

            if(map_type == 0){
                for(var i=0; i < selected_pos.length; i++){
                    var latLng = new google.maps.LatLng( selected_pos[i].lat, selected_pos[i].lon);
                    markers[i] = new google.maps.Marker({
                        position: latLng,
                        map: map,
                        icon: marker_color,
                        title: "Name: " + selected_pos[i].name + "\nLat: " + selected_pos[i].lat + "\nLon: " + selected_pos[i].lon + "\nDate: " + selected_pos[i].date +
                        "\nTime: " + selected_pos[i].time + "\n" + "Load: " + selected_pos[i].num,
                        index: i
                    });

                    infowindows[i] = new google.maps.InfoWindow({
                        content: "Name: " + selected_pos[i].name + "<br/>Lat: " + selected_pos[i].lat + "<br/>Lon: " + selected_pos[i].lon + "<br/>Date: " + selected_pos[i].date +
                        "<br/>Time: " + selected_pos[i].time + "<br/>" + "Load: " + selected_pos[i].num
                    });

                    google.maps.event.addListener(markers[i],'click', function(){
                        infowindows[this.index].open(map, markers[this.index]);
                    });

                }
            }
            if(map_type == 1){
                for (var i = 0; i < selected_pos.length; i++) {
                    var latLng = new google.maps.LatLng(selected_pos[i].lat, selected_pos[i].lon);
                    for( var j = 0; j < selected_pos[i].num; j++ ){
                        var marker = new google.maps.Marker({
                            position: latLng,
                            map: map,
                            icon: marker_color,
                            title: "Name: " + selected_pos[i].name + " \nLat: " + selected_pos[i].lat + " \nLon: " + selected_pos[i].lon + " \nDate: " + selected_pos[i].date +
                            " \nTime: " + selected_pos[i].time + " \nLoad: " + selected_pos[i].num
                        });

                        marker.info = new google.maps.InfoWindow({
                            content: "Name: " + data_static[i].name + "<br/>Lat: " + data_static[i].lat + "<br/>Lon: " + data_static[i].lon + "<br/>Date: " + data_static[i].date +
                            "<br/>Time: " + data_static[i].time + "<br/>" + "Load: " + data_static[i].num
                        });

                        google.maps.event.addListener(marker, 'click', function(){
                            marker.info.open(map, this);
                        });

                        markerCluster.addMarker(marker);
                    }
                }

                google.maps.event.removeListener( clustListener );
                clustListener = google.maps.event.addListener( markerCluster, 'clusterclick', function(cluster){
                    var markersOnCluster = cluster.getMarkers();
                    var content = "";
                    var str_title = [];
                    var name_marker = "";
                    content+=("Markers / Loads");
                    content+=("<br>");
                    for (var i=0; i < markersOnCluster.length; i++){
                        var mark_pos = markersOnCluster[i];
                        str_title = mark_pos.title.toString().split(" ");
                        if(name_marker != str_title[1] ){
                            name_marker = str_title[1];
                            content+=(name_marker + " =  " + str_title[11]);
                            content+=("<br>");
                        }
                    }
                    var infowindow = new google.maps.InfoWindow();
                    infowindow.setPosition(cluster.getCenter());
                    infowindow.close();
                    infowindow.setContent(content);
                    infowindow.open(map);

                    google.maps.event.addListener(map, 'zoom_changed', function() {
                        infowindow.close();
                    });
                });
                }

            if(map_type == 2){
                for (var i = 0; i < selected_pos.length; i++) {
                    for(var j = 0; j < selected_pos[i].num; j++ ) heatmap_data.push( new google.maps.LatLng(selected_pos[i].lat,selected_pos[i].lon) );
                }
                for(var x = 0; x < max_val; x++){ heatmap_data.push(new google.maps.LatLng(0,0)); }
                pointArray = new google.maps.MVCArray(heatmap_data);
                heatmap.setData(pointArray);
            }
        }
    });

    /* ================================================= */
    /* Method to stop playing if the slider is clicked   */
    /* ================================================= */

    $("#slider").click(function(){
        resetInterval();
    });


    /* =========================================== */
    /* Method for dealing with the Slider Player   */
    /* =========================================== */

    $("#playSlider").click(function(){
        valueSlider = $("#slider").slider("value");
        if( playing ){
            playing = false;
            $("#playSlider").attr("src", "images/playButton.png");
            clearInterval(interval);
        } else{
            $("#playSlider").attr("src", "images/pauseButton.png");
            playing = true;
            interval = setInterval(function(){
                if( valueSlider <= maxSlider ){
                    $("#slider").slider("value", valueSlider++);
                    $("#slider").slider("value", $("#slider").slider("value"));
                }
                else resetInterval();
            },1000);
//            playSlider();
        }
    });


    /* ===================================================== */
    /* Default method to reset the Player or stop playing   */
    /* ===================================================== */
    function resetInterval(){
        playing = false;
        $("#playSlider").attr("src", "images/playButton.png");
        clearInterval(interval);
    }

    /* ================================ */
    /* Method to hide or display Meny   */
    /* ================================ */
    $('#hideMenu').click(function(){
        checkMenu = $("#hideMenu").is(":checked");
        if( checkMenu ){
            $('.control').hide();
        }
        else{ $('.control').show(); }
    });


    /* ================================ */
    /* Method to add some customization to the menu bar */
    /* ================================ */
    $('#cssmenu').prepend('<div id="bg-one"></div><div id="bg-two"></div><div id="bg-three"></div><div id="bg-four"></div>');
    $('#panel-gradient').hide();
    $('#panel-opacity').hide();
    $('#panel-radius').hide();
    $('#layer-scale').hide();


    /* ================================ */
    /* Methods for Scale Layer Insertion */
    /* ================================ */

    $("#scale-y").click( function() {
        $("#layer-scale label").each(function(){ $(this).removeClass("selected")});
        $("#scale-opt1").addClass("selected");
        scale_ = true;
    });
    $("#scale-n").click( function() {
        $("#layer-scale label").each(function(){ $(this).removeClass("selected")});
        $("#scale-opt2").addClass("selected");
        scale_ = false;
    });

    /* ================================ */
    /* Methods for Clock Layer Insertion */
    /* ================================ */

    $("#clk-y").click( function() {
        $("#layer-clk label").each(function(){ $(this).removeClass("selected")});
        $("#clk-opt1").addClass("selected");
        $("#timeLayer").show();
        clock_ = true;
    });
    $("#clk-n").click( function() {
        $("#layer-clk label").each(function(){ $(this).removeClass("selected")});
        $("#clk-opt2").addClass("selected");
        $("#timeLayer").hide();
        clock_ = false;
    });


    /* ================================ */
    /* Methods for Time Variation Selection */
    /* ================================ */

    $("#var-min").click( function() {
        $("#time-variation label").each(function(){ $(this).removeClass("selected")});
        $("#min").addClass("selected");
        time_var = 1;
        $("#layer-clk").show();
        $("#loading").fadeIn("slow", function(){
            updateMap(time_var);
            $("#slider").slider("value", 0);
            $("#slider").slider("value", $("#slider").slider("value"));
        });
        resetInterval();
    });
    $("#var-hour").click( function() {
        $("#time-variation label").each(function(){ $(this).removeClass("selected")});
        $("#hour").addClass("selected");
        time_var = 2;
        $("#layer-clk").show();
        $("#loading").fadeIn("slow", function(){
            updateMap(time_var);
            $("#slider").slider("value", 0);
            $("#slider").slider("value", $("#slider").slider("value"));
        });
        resetInterval();
    });
    $("#var-day").click( function() {
        $("#time-variation label").each(function(){ $(this).removeClass("selected")});
        $("#day").addClass("selected");
        time_var = 3;
        $("#layer-clk").show();
        $("#loading").fadeIn("slow", function(){
            updateMap(time_var);
            $("#slider").slider("value", 0);
            $("#slider").slider("value", $("#slider").slider("value"));
        });
        resetInterval();
    });
    $("#var-month").click( function() {
        $("#time-variation label").each(function(){ $(this).removeClass("selected")});
        $("#month").addClass("selected");
        time_var = 4;
        $("#layer-clk").show();
        $("#loading").fadeIn("slow", function(){
            updateMap(time_var);
            $("#slider").slider("value", 0);
            $("#slider").slider("value", $("#slider").slider("value"));
        });
        resetInterval();
    });
    $("#var-year").click( function() {
        $("#time-variation label").each(function(){ $(this).removeClass("selected")});
        $("#year").addClass("selected");
        time_var = 5;
        $("#layer-clk").show();
        $("#loading").fadeIn("slow", function(){
            updateMap(time_var);
            $("#slider").slider("value", 0);
            $("#slider").slider("value", $("#slider").slider("value"));
        });
        resetInterval();
    });
    $("#var-static").click( function() {
        $("#time-variation label").each(function(){ $(this).removeClass("selected")});
        resetInterval();
        $("#static").addClass("selected");
        $("#slider").hide();
        $("#playSlider").hide();
        $("#layer-clk").hide();
        $("#timeLayer").hide();
        time_var = 0;
        $("#loading").fadeIn("slow", function(){updateMap(time_var);});
    });

    /* ================================ */
    /* Methods for Marker Color Selection */
    /* ================================ */

    $('#color-opt1').click(function(){
        $('#panel-marker-color label').each(function(){ $(this).removeClass('selectedColor'); });
        $('#col1').addClass('selectedColor');
        marker_color = "images/mm_20_red.png";
        updateMarkerColor();
    });
    $('#color-opt2').click(function(){
        $('#panel-marker-color label').each(function(){ $(this).removeClass('selectedColor'); });
        $('#col2').addClass('selectedColor');
        marker_color = "images/mm_20_green.png";
        updateMarkerColor();
    });
    $('#color-opt3').click(function(){
        $('#panel-marker-color label').each(function(){ $(this).removeClass('selectedColor'); });
        $('#col3').addClass('selectedColor');
        marker_color = "images/mm_20_purple.png";
        updateMarkerColor();
    });
    $('#color-opt4').click(function(){
        $('#panel-marker-color label').each(function(){ $(this).removeClass('selectedColor'); });
        $('#col4').addClass('selectedColor');
        marker_color = "images/mm_20_blue.png";
        updateMarkerColor();
    });
    $('#color-opt5').click(function(){
        $('#panel-marker-color label').each(function(){ $(this).removeClass('selectedColor'); });
        $('#col5').addClass('selectedColor');
        marker_color = "images/mm_20_gray.png";
        updateMarkerColor();
    });
    $('#color-opt6').click(function(){
        $('#panel-marker-color label').each(function(){ $(this).removeClass('selectedColor'); });
        $('#col6').addClass('selectedColor');
        marker_color = "images/mm_20_black.png";
        updateMarkerColor();
    });


    /* ================================ */
    /* Methods for Map Type Selection */
    /* ================================ */

    $('#marker-btn').click(function(){
        $('#panel-type label').each(function(){ $(this).removeClass('selected');});
        $('#marker').addClass('selected');
        $('#panel-gradient').hide();
        $('#panel-opacity').hide();
        $('#panel-radius').hide();
        $('#panel-marker-color').show();
        $('#layer-scale').hide();
        map_type = 0;
        $("#loading").fadeIn("slow", function(){updateMap(time_var);});
        if(time_var != 0) $("#slider").slider("value", $("#slider").slider("value"));
        resetInterval();
    });
    $('#cluster-btn').click(function(){
        $('#panel-type label').each(function(){ $(this).removeClass('selected');});
        $('#cluster').addClass('selected');
        $('#panel-gradient').hide();
        $('#panel-opacity').hide();
        $('#panel-radius').hide();
        $('#panel-marker-color').hide();
        $('#layer-scale').hide();
        map_type = 1;
        $("#loading").fadeIn("slow", function(){updateMap(time_var);});
        if(time_var != 0) $("#slider").slider("value", $("#slider").slider("value"));
        resetInterval();
    });
    $('#heatmap-btn').click(function(){
        $('#panel-type label').each(function(){ $(this).removeClass('selected');});
        $('#heatmap').addClass('selected');
        $('#panel-gradient').show();
        $('#panel-opacity').show();
        $('#panel-radius').show();
        $('#panel-marker-color').hide();
        $('#layer-scale').show();
        map_type = 2;
        $("#loading").fadeIn("slow", function(){updateMap(time_var);});
        if(time_var != 0) $("#slider").slider("value", $("#slider").slider("value"));
        resetInterval();
    });


    /* ================================ */
    /* Methods for Showing/Hiding the divs tabs */
    /* ================================ */

    $('.panel').slideUp();
    $('#mapType').click( function() {
        $('#dataTypeDiv').slideUp( );
        $('#analysisDiv').slideUp("fast");
        $('#mapTypeDiv').slideToggle("fast");
    });
    $('#dataType').click( function() {
        $('#analysisDiv').slideUp();
        $('#mapTypeDiv').slideUp("fast");
        $('#dataTypeDiv').slideToggle("fast");
    });
    $('#analysis').click( function() {
        $('#dataTypeDiv').slideUp();
        $('#mapTypeDiv').slideUp("fast");
        $('#analysisDiv').slideToggle("fast");
    });

    /* ================================ */
    /* Method for changing the Map Style*/
    /* ================================ */

    $("#radio1").click( function() {
        $("#panel-mapStyle label").each(function(){ $(this).removeClass("selected")});
        $("#default").addClass("selected");
        map.setOptions({styles: null});
        map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
    });
    $("#radio2").click( function() {
        $("#panel-mapStyle label").each(function(){ $(this).removeClass("selected")});
        $("#satellite").addClass("selected");
        map.setOptions({styles: null});
        map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
    });
    $("#radio3").click( function() {
        $("#panel-mapStyle label").each(function(){ $(this).removeClass("selected")});
        $("#dark").addClass("selected");
        map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
        map.setOptions({styles: styleGrey});
    });
    $("#radio4").click( function() {
        $("#panel-mapStyle label").each(function(){ $(this).removeClass("selected")});
        $("#light").addClass("selected");
        map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
        map.setOptions({styles: styleligth});

    });
    $("#radio5").click( function() {
        $("#panel-mapStyle label").each(function(){ $(this).removeClass("selected")});
        $("#road").addClass("selected");
        map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
        map.setOptions({styles: styleRoad});
    });


    /* =================================================== */
    /* Method for changing the Gradient Color for Heatmaps */
    /* =================================================== */

    $("#radio6").click(function() {
        $("#panel-gradient label").each(function() { $(this).removeClass("selectedColor")});
        $("#grad1").addClass("selectedColor");
        heatmap.set('gradient', null);
    });
    $("#radio7").click(function() {
        $("#panel-gradient label").each(function() { $(this).removeClass("selectedColor")});
        $("#grad2").addClass("selectedColor");
        heatmap.set('gradient', gradient2);
    });
    $("#radio8").click(function() {
        $("#panel-gradient label").each(function() { $(this).removeClass("selectedColor")});
        $("#grad3").addClass("selectedColor");
        heatmap.set('gradient', gradient3);
    });

    /* ================================ */
    /* Method for changing the Heatmap Radius */
    /* ================================ */
    $("#radio9").click(function() {
        $("#panel-radius label").each(function() { $(this).removeClass("selected")});
        $("#rad0").addClass("selected");
        heatmap.set('radius', 0);
    });
    $("#radio10").click(function() {
        $("#panel-radius label").each(function() { $(this).removeClass("selected")});
        $("#rad20").addClass("selected");
        heatmap.set('radius', 10);
    });
    $("#radio11").click(function() {
        $("#panel-radius label").each(function() { $(this).removeClass("selected")});
        $("#rad40").addClass("selected");
        heatmap.set('radius', 15);
    });
    $("#radio12").click(function() {
        $("#panel-radius label").each(function() { $(this).removeClass("selected")});
        $("#rad60").addClass("selected");
        heatmap.set('radius', 20);
    });
    $("#radio13").click(function() {
        $("#panel-radius label").each(function() { $(this).removeClass("selected")});
        $("#rad80").addClass("selected");
        heatmap.set('radius', 25);
    });
    $("#radio14").click(function() {
        $("#panel-radius label").each(function() { $(this).removeClass("selected")});
        $("#rad100").addClass("selected");
        heatmap.set('radius', 30);
    });

    /* ================================ */
    /* Method for changing the Heatmap Opacity */
    /* ================================ */

    $("#radio15").click(function() {
        $("#panel-opacity label").each(function() { $(this).removeClass("selected")});
        $("#opct0").addClass("selected");
        heatmap.set('opacity', 0);
    });
    $("#radio16").click(function() {
        $("#panel-opacity label").each(function() { $(this).removeClass("selected")});
        $("#opct20").addClass("selected");
        heatmap.set('opacity', 0.2);
    });
    $("#radio17").click(function() {
        $("#panel-opacity label").each(function() { $(this).removeClass("selected")});
        $("#opct40").addClass("selected");
        heatmap.set('opacity', 0.4);
    });
    $("#radio18").click(function() {
        $("#panel-opacity label").each(function() { $(this).removeClass("selected")});
        $("#opct60").addClass("selected");
        heatmap.set('opacity', 0.6);
    });
    $("#radio19").click(function() {
        $("#panel-opacity label").each(function() { $(this).removeClass("selected")});
        $("#opct80").addClass("selected");
        heatmap.set('opacity', 0.8);
    });
    $("#radio20").click(function() {
        $("#panel-opacity label").each(function() { $(this).removeClass("selected")});
        $("#opct100").addClass("selected");
        heatmap.set('opacity', 1);
    });

    /* ================================ */
    /* Method used to update the color of the markers */
    /* ================================ */
    function updateMarkerColor(){
        $("#loading").fadeIn("slow");
        for(var i=0; i< markers.length; i++){
            markers[i].setIcon(marker_color);
        }
        $("#loading").fadeOut("slow");
    }

    /* ================================ */
    /* Method for reading the input file */
    /* ================================ */

    $('#input-file').change(function() {
        if(window.File && window.FileReader && window.FileList && window.Blob){
            var file = this.files[0];
            data_day = [];
            data_hour = [];
            data_min = [];
            data_month = [];
            data_year = [];
            data_static = [];
            data_table = [];
            var ext = (file.name).split('.').pop();
            if(ext == 'csv'){
                if(!window.openDatabase){
                    alert('Your browser doesn\'t support a stable version of WebSQL. Try with a different browser.');
                }else{
                    $("#loading").fadeIn("slow");
                    $('#name-file').text(file.name);
                    $('#check_label').show();
                    var reader = new FileReader();
                    reader.onerror = errorHandler;
                    reader.onload = loadHandler;
                    reader.readAsText(file);
                    $("#loading").fadeOut("slow");
                    $("#gen_map").css("visibility", "visible");
                    $("#dataTypeDiv").css("height", "120px");
                }
            }else alert('The File extension is not supported.');
        }else alert('The File API is not fully supported in this browser.');
    });

    function loadHandler(evt) {
        var csv = evt.target.result;
        processData(csv);
    }

    function processData(csv) {
        try{
            var allTextLines = csv.split(/\r\n|\n/);
            var my_data;
            var aux_min=[], aux_hour=[], aux_day=[], aux_month=[], aux_year=[];
            var next_min, next_hour, next_day, next_month, next_year;
            var current_min = allTextLines[1].split(',')[4].split(':')[1];
            var current_hour = allTextLines[1].split(',')[4].split(':')[0];
            var current_day = allTextLines[1].split(',')[3].split('/')[1];
            var current_month = allTextLines[1].split(',')[3].split('/')[0];
            var current_year = allTextLines[1].split(',')[3].split('/')[2];
            for(var i=1; i < allTextLines.length-1; i++){
                var data = allTextLines[i].split(',');
                my_data = new geo_data(data[0],data[1],data[2],data[3],data[4], data[5]);
                data_static[i-1] = my_data;
                data_table[i-1] = my_data;
                // ===========================================================================================
                // This module deals with the management of the minutes into the correct position of the array
                // ===========================================================================================
                next_min = data[4].split(':')[1];
                if( current_min == next_min ){
                    aux_min.push(my_data);
                } else{
                    data_min.push(aux_min);
                    aux_min = [];
                    aux_min.push(my_data);
                    current_min = next_min;
                }
                // ===========================================================================================
                // This module deals with the management of the hours into the correct position of the array
                // ===========================================================================================
                next_hour = data[4].split(':')[0];
                if( current_hour == next_hour ){
                    aux_hour.push(my_data);
                } else{
                    data_hour.push(aux_hour);
                    aux_hour = [];
                    aux_hour.push(my_data);
                    current_hour = next_hour;
                }
                // ===========================================================================================
                // This module deals with the management of the days into the correct position of the array
                // ===========================================================================================
                next_day = data[3].split('/')[1];
                if( current_day == next_day ){
                    aux_day.push(my_data);
                } else{
                    data_day.push(aux_day);
                    aux_day = [];
                    aux_day.push(my_data);
                    current_day = next_day;
                }
                // ===========================================================================================
                // This module deals with the management of the months into the correct position of the array
                // ===========================================================================================
                next_month = data[3].split('/')[0];
                if( current_month == next_month ){
                    aux_month.push(my_data);
                } else{
                    data_month.push(aux_month);
                    aux_month = [];
                    aux_month.push(my_data);
                    current_month = next_month;
                }
                // ===========================================================================================
                // This module deals with the management of the years into the correct position of the array
                // ===========================================================================================
                next_year = data[3].split('/')[2];
                if( current_year == next_year ){
                    aux_year.push(my_data);
                } else{
                    data_year.push(aux_year);
                    aux_year = [];
                    aux_year.push(my_data);
                    current_year = next_year;
                }
            }
            data_min.push(aux_min);
            data_hour.push(aux_hour);
            data_day.push(aux_day);
            data_month.push(aux_month);
            data_year.push(aux_year);
            data_table = data_static;
        }
        catch(err){
            alert("O arquivo selecionado contém erros." + err.toString);
        }
    }

    function errorHandler(evt) {
        if(evt.target.error.name == "NotReadableError") {
            alert("File not readable!!");
        }
    }

    function geo_data(name, lat, lon, date, time, num){
        this.name = name;
        this.lat = lat;
        this.lon = lon;
        this.date = date;
        this.time = time;
        this.num = num;
    }

    /* ======================================= */
    /* Method for dealing with the static data */
    /* ======================================= */

    function populate_data(){
        // =====================================================
        // Erase any data of the heatmap, marker or cluster map
        // =====================================================
        while(heatmap_data.length > 0){ // Loop to erase data from the heatmap vector
            heatmap_data.pop();
        }
        pointArray = new google.maps.MVCArray(heatmap_data);
        heatmap.setData(pointArray);
        for(var j = 0; j < markers.length; j++){ // Loop to erase markers vector
            markers[j].setMap(null);
        }
        markerCluster.clearMarkers();
        markers = [];
        infowindows = [];
        // =====================================================


        // =====================================================
        // Create markers with the current data for the markers map
        // =====================================================
        if(map_type == 0){
            for(var i = 0; i < data_static.length; i++){
                var latLng = new google.maps.LatLng(data_static[i].lat, data_static[i].lon);
                markers[i] = new google.maps.Marker({
                    position: latLng,
                    map: map,
                    icon: marker_color,
                    title: "Name: " + data_static[i].name + "\nLat: " + data_static[i].lat + "\nLon: " + data_static[i].lon + "\nDate: " + data_static[i].date +
                    "\nTime: " + data_static[i].time + "\n" + "Load: " + data_static[i].num,
                    index: i
                });

                infowindows[i] = new google.maps.InfoWindow({
                    content: "Name: " + data_static[i].name + "<br/>Lat: " + data_static[i].lat + "<br/>Lon: " + data_static[i].lon + "<br/>Date: " + data_static[i].date +
                    "<br/>Time: " + data_static[i].time + "<br/>" + "Load: " + data_static[i].num
                });


                google.maps.event.addListener(markers[i],'click', function(){
                    infowindows[this.index].open(map, markers[this.index]);
                });

            }
        }

        // =====================================================
        // Create markers with the current data for the cluster map
        // =====================================================
        else if(map_type == 1) {
            for (var i = 0; i < data_static.length; i++) {
                var latLng = new google.maps.LatLng(data_static[i].lat, data_static[i].lon);
                for( var j = 0; j < data_static[i].num; j++ ){
                    var marker = new google.maps.Marker({
                        position: latLng,
                        map: map,
                        icon: marker_color,
                        title: "Name: " + data_static[i].name + " \nLat: " + data_static[i].lat + " \nLon: " + data_static[i].lon + " \nDate: " + data_static[i].date +
                        " \nTime: " + data_static[i].time + " \nLoad: " + data_static[i].num
                    });

                    marker.info = new google.maps.InfoWindow({
                        content: "Name: " + data_static[i].name + "<br/>Lat: " + data_static[i].lat + "<br/>Lon: " + data_static[i].lon + "<br/>Date: " + data_static[i].date +
                        "<br/>Time: " + data_static[i].time + "<br/>" + "Load: " + data_static[i].num
                    });

                    google.maps.event.addListener(marker, 'click', function(){
                        marker.info.open(map, this);
                    });

                    markerCluster.addMarker(marker);
                }

            }
            google.maps.event.removeListener(clustListener);
            clustListener = google.maps.event.addListener( markerCluster, 'clusterclick', function(cluster){
                var markersOnCluster = cluster.getMarkers();
                var content = "";
                var str_title = [];
                var name_marker = "";
                content+=("Markers / Loads");
                content+=("<br>");
                for (var i=0; i < markersOnCluster.length; i++){
                    var mark_pos = markersOnCluster[i];
                    str_title = mark_pos.title.toString().split(" ");
                    if(name_marker != str_title[1] ){
                        name_marker = str_title[1];
                        content+=(name_marker + " =  " + str_title[11]);
                        content+=("<br>");
                    }
                }
                var infowindow = new google.maps.InfoWindow();
                infowindow.setPosition(cluster.getCenter());
                infowindow.close();
                infowindow.setContent(content);
                infowindow.open(map);

                google.maps.event.addListener(map, 'zoom_changed', function() {
                    infowindow.close();
                });

            })

        }

        // =====================================================
        // Create the heatmap with the current data
        // =====================================================
        else if(map_type == 2) {
            for (var i = 0; i < data_static.length; i++) {
                for(var j = 0; j < data_static[i].num; j++ ) heatmap_data.push( new google.maps.LatLng(data_static[i].lat,data_static[i].lon) );
            }
            pointArray = new google.maps.MVCArray(heatmap_data);
            heatmap.setData(pointArray);
        }
    }

    /* ======================================= */
    /* Method for generating slider            */
    /* ======================================= */

    function generate_slider(vector){
        maxSlider = vector.length-1;
        $("#slider").slider("option","max",maxSlider);
        $("#slider").show();
        $("#playSlider").show();
        data_table = vector;
        max_val = 0;
        for( var x = 0; x < data_table.length; x++){
            selected_pos = data_table[x];
            for( var y = 0; y < data_table[x].length; y++){
                if( selected_pos[y].num > max_val ){
                    max_val = selected_pos[y].num;
                }
            }
        }
        max_val--;
    }

    /* ======================================================= */
    /* Method for statystical analyzis of the current data     */
    /* ======================================================= */

    function analyzeData( vector ){
        var valuesVector = [];
        var sum = 0, mode, max= 0, freq= 0, mean, median, variance = 0, geoMean = 1, standDev, skewness = 0, stquart, ndquart, interquart, outliers = "", maximum = 0, minimum = 0;
        for( var i=0; i<vector.length; i++){
            if(vector[i].num == ""){
                valuesVector.push("0");
                geoMean = geoMean * parseFloat(vector[i].num);
            }else{
                valuesVector.push(vector[i].num);
                sum+=parseFloat(vector[i].num);
                geoMean = geoMean * parseFloat(vector[i].num);
            }
        }
        // Sort Vector Values
        valuesVector.sort(function(a,b) {return a-b;});

        // Calculating Mean =========================/
        mean = sum/valuesVector.length;

        // Calculating median =========================/
        median = interpolation(valuesVector);

        // Calculating Quartiles =========================/
        if( valuesVector.length % 2 == 0){
            stquart = interpolation( valuesVector.slice(0, (valuesVector.length/2)) );
            ndquart = interpolation( valuesVector.slice(valuesVector.length/2, valuesVector.length ) );
        }else{
            if( valuesVector.length > 1 ){
                stquart = interpolation( valuesVector.slice(0, Math.floor(valuesVector.length/2) ) );
                ndquart = interpolation( valuesVector.slice(Math.round(valuesVector.length/2) , valuesVector.length ) );
            }
        }

        // Calculating Mode/Variance =========================/
        interquart = ndquart - stquart;

        // Calculating Mode/Variance =========================/
        for( var i=0; i < valuesVector.length; i++){
            //Calculating Outliers ===============================/
            if( valuesVector[i] < (stquart- 1.5*interquart) ){
                outliers+=valuesVector[i]+ ", ";
            }
            else if( valuesVector[i] > (ndquart + 1.5*interquart) ){
                outliers+=valuesVector[i]+ ", ";
            }

            //Calculating Variance ===============================/
            variance+= Math.pow( (valuesVector[i] - mean ), 2);
            //Calculating Mode ===================================/
            if( valuesVector[i] == valuesVector[i+1] ) freq++;
            else freq = 0;
            if (freq > max) {max = freq; mode = valuesVector[i];}
        }

        // Calculating Geometric Mean =========================/
        geoMean = Math.pow(geoMean, 1/valuesVector.length );
        variance = variance/(valuesVector.length-1);

        // Calculating Standard Deviation =========================/
        standDev = Math.sqrt(variance);

        for( var i=0; i < valuesVector.length; i++){
            skewness+= Math.pow((mean-parseFloat(valuesVector[i])),3);
        }
        skewness = Math.abs(skewness/ ((valuesVector.length-1) * Math.pow(standDev, 3)));

        // Calculating Maximum Value =========================/
        maximum = valuesVector[valuesVector.length-1];

        // Calculating Minimum Value =========================/
        minimum = valuesVector[0];

        // Update the Values Texts =========================/
        $("#population").val(valuesVector.length);
        $("#sum").val(sum);
        $("#maximum").val(maximum);
        $("#minimum").val(minimum);
        $("#mean").val(mean);
        $("#median").val(median);
        $("#mode").val(mode);
        $("#range").val( valuesVector[valuesVector.length-1] - valuesVector[0] );
        $("#skewness").val(skewness);
        $("#1quart").val(stquart);
        $("#3quart").val(ndquart);
        $("#interquart").val(interquart);
        $("#outliers").val(outliers);
        $("#geomean").val(geoMean);
        $("#quartdev").val((ndquart-stquart)/2);
        $("#variance").val(variance);
        $("#standardDev").val(standDev);
        $("#coefVar").val(standDev/mean);
        $("#coefRange").val((maximum-minimum)/(maximum+minimum));
    }

    function interpolation( array ){
        if( array.length % 2 == 0){
            return ( parseFloat(array[array.length/2]) + parseFloat(array[(array.length/2)-1]) )/2;
        }else {
            return array[Math.floor(array.length/2)];
        }
    }
    /* ====================================================*/

    var markers = [];
    var heatmap_data = [];

    var mapOptions = {
        center: new google.maps.LatLng(-0.288931, -6.818572),
        zoom: 2,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        zoomControl: true,
    };

    var map = new google.maps.Map(document.getElementById("map_canvas"),
        mapOptions);

    var pointArray = new google.maps.MVCArray(heatmap_data);
    var heatmap = new google.maps.visualization.HeatmapLayer({
        data: pointArray
    });

    var optionsCluster = {
        imagePath: 'images/m',
        zoomOnClick: false
    };

    var markerCluster = new MarkerClusterer(map, markers, optionsCluster);
    heatmap.setMap(map);


    /* ======================================= */
    /*               Map Styles                */
    /* ======================================= */
    var styleGrey = [{"featureType":"all","elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#000000"},{"lightness":40}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#000000"},{"lightness":16}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":17},{"weight":1.2}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":21}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":16}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":19}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":17}]}];
    var styleligth = [{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#444444"}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2f2f2"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#46bcec"},{"visibility":"on"}]}];
    var styleRoad = [{"featureType":"all","elementType":"all","stylers":[{"saturation":"-100"}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"visibility":"on"}]},{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"lightness":"-62"}]},{"featureType":"administrative","elementType":"labels.text.stroke","stylers":[{"visibility":"on"}]},{"featureType":"administrative.province","elementType":"labels.text.stroke","stylers":[{"visibility":"off"}]},{"featureType":"landscape","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"lightness":"100"},{"gamma":"10.00"},{"saturation":"-100"}]},{"featureType":"landscape","elementType":"geometry.stroke","stylers":[{"visibility":"off"}]},{"featureType":"landscape","elementType":"labels.text.stroke","stylers":[{"visibility":"off"}]},{"featureType":"landscape.natural","elementType":"labels.text.stroke","stylers":[{"visibility":"on"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"poi","elementType":"geometry.fill","stylers":[{"lightness":"70"}]},{"featureType":"poi","elementType":"labels.icon","stylers":[{"lightness":"-100"}]},{"featureType":"poi.attraction","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.attraction","elementType":"labels.icon","stylers":[{"visibility":"on"}]},{"featureType":"poi.business","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.government","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"poi.medical","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.park","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.place_of_worship","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.school","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.sports_complex","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"geometry.fill","stylers":[{"lightness":"-100"}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"visibility":"on"},{"weight":"0.1"},{"lightness":"-100"}]},{"featureType":"road","elementType":"labels.text.stroke","stylers":[{"visibility":"off"}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"weight":"1"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"visibility":"off"}]},{"featureType":"road.highway","elementType":"labels.text.stroke","stylers":[{"visibility":"off"}]},{"featureType":"road.highway.controlled_access","elementType":"labels.text.stroke","stylers":[{"visibility":"off"}]},{"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"weight":"0.60"},{"lightness":"26"}]},{"featureType":"road.arterial","elementType":"geometry.stroke","stylers":[{"visibility":"off"}]},{"featureType":"road.arterial","elementType":"labels.text.stroke","stylers":[{"visibility":"off"}]},{"featureType":"road.local","elementType":"geometry.fill","stylers":[{"weight":"0.38"},{"saturation":"0"},{"lightness":"75"},{"gamma":"0.92"},{"visibility":"on"}]},{"featureType":"road.local","elementType":"geometry.stroke","stylers":[{"visibility":"off"}]},{"featureType":"road.local","elementType":"labels.text","stylers":[{"visibility":"off"},{"weight":"1"}]},{"featureType":"road.local","elementType":"labels.text.stroke","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"labels.text","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"labels.text.fill","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"labels.text.stroke","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"labels.icon","stylers":[{"visibility":"on"}]},{"featureType":"transit.line","elementType":"geometry.stroke","stylers":[{"visibility":"on"}]},{"featureType":"transit.station","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"water","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"saturation":"-100"},{"lightness":"71"}]}];

    var gradient2 = [
        'rgba(0, 255, 255, 0)',
        'rgba(0, 255, 255, 1)',
        'rgba(0, 191, 255, 1)',
        'rgba(0, 127, 255, 1)',
        'rgba(0, 63, 255, 1)',
        'rgba(0, 0, 255, 1)',
        'rgba(0, 0, 223, 1)',
        'rgba(0, 0, 191, 1)',
        'rgba(0, 0, 159, 1)',
        'rgba(0, 0, 127, 1)',
        'rgba(63, 0, 91, 1)',
        'rgba(127, 0, 63, 1)',
        'rgba(191, 0, 31, 1)',
        'rgba(255, 0, 0, 1)'
    ]

    var gradient3 = [
        'rgba(251,222,131, 0)',
        'rgba(249,185,68, 1)',
        'rgba(252,134,28, 1)',
        'rgba(226,93,14, 1)',
        'rgba(113,32,6, 1)'
    ]


    /* ====================================================*/

    $("#loading").fadeOut("slow");

    /* ====================================================*/

});