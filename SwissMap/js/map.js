var sptv = sptv || {};
 
$(document).ready(function(){
    sptv.map.draw();
    $('#toggleLakes').click(function(){
        sptv.helpers.toggleHide($('.lake'));
    });
    
    $('#toggleCantons').click(function(){
        sptv.helpers.toggleHide($('.canton-boundaries'));
    });
    
    $('#key').draggable({
        containment: "parent",
        handle: ".panel-heading"
    });
    
    sptv.constants.mode.set('avgMunicipalities', 'time');
    sptv.constants.mode.set('cantons', 'time');
    sptv.constants.mode.set('lastMunicipalities', 'time');
    sptv.constants.mode.set('countMunicipalities', 'log');
    sptv.constants.mode.set('departuresPerPerson', 'density');
    
     $('input[type=radio][name=show]').change(function() {        
         sptv.helpers.showLayer(this.value);
         sptv.helpers.labelKey(sptv.constants.mode.get(this.value));
     });
    
    sptv.helpers.positionKey();
    
    $( window ).resize(function() {
        sptv.helpers.resize();   
    });
});

sptv.constants = {
    layers: ['avgMunicipalities', 'cantons', 'lastMunicipalities', 'countMunicipalities', 'departuresPerPerson'],
    mode: d3.map()
};


sptv.map = {
    
    draw: function() {    
        var width = $('#map').width(), height = 500;
        var country = d3.geo.path().projection(null);
        var path = d3.geo.path().projection(null);
        var svg = d3.select("#map").append("svg").attr("width", width).attr("height", height).attr("class", "svg");

        var rateMunicipality = d3.map();
        var rateLastMunicipality = d3.map();
        var rateCanton = d3.map();

        var municipalityName = d3.map();
        var municipalityArea = d3.map();
        var municipalityPopulation = d3.map();
        var municipalityCountDepartures = d3.map();

        var quantizeTime = d3.scale.quantize()
            .domain([1000, 2800])
            .range(d3.range(9).map(function(i) { return "q" + i + "-9";}));

        var quantizeCount = d3.scale.quantize()
            .domain([1, 13.5])
            .range(d3.range(9).map(function(i) { return "q" + i + "-9";}));
        
        var quantizeDensity = d3.scale.quantize()
            .domain([0, 1.6])
            .range(d3.range(9).map(function(i) { return "q" + i + "-9";}));


        d3.json("data/municipalities.json", function(d) { 
            for(var i = 0; i<d.length; i++){
                rateMunicipality.set(d[i].id, +d[i].avg);
                rateLastMunicipality.set(d[i].id, +d[i].max);
                municipalityArea.set(d[i].id, +d[i].area);
                municipalityPopulation.set(d[i].id, +d[i].population);
                municipalityCountDepartures.set(d[i].id, +d[i].count_departures);
                municipalityName.set(d[i].id, d[i].name);
            }
        });

        d3.json("data/canton_avg.json", function(d) { 
            for(var i = 0; i<d.length; i++){
                rateCanton.set(d[i].id, +d[i].avg);
            }
        });


        d3.json("data/ch.json", function(error, ch) {        
            drawCountry(ch);        
            drawMunicipalities(ch);
            drawLastMunicipality(ch);
            drawCountMunicipality(ch);
            drawDeparturesPerPersonMunicipality(ch);
            drawCantons(ch);                
            drawLakes(ch);   
            drawCantonBorders(ch);
        }); 

        function drawCountry(ch){
            svg.append("path").datum(topojson.feature(ch, ch.objects.country))
                .attr("class", "country").attr("d", country);
        }

        function drawMunicipalities(ch){
            svg .append("g")
                .attr("class", "avgMunicipalities highlight")
                .selectAll("path")
                .data(topojson.feature(ch, ch.objects.municipalities).features)
                .enter().append("path")
                .attr("class", function(d) { return quantizeTime(rateMunicipality.get(d.id)); })
                .attr("d", path)
                .append("title")
                .text(function(d){return municipalityName.get(d.id) + ': ' + sptv.helpers.showTime(rateMunicipality.get(d.id));});
        }

        function drawLastMunicipality(ch){
            svg .append("g")
                .attr("class", "lastMunicipalities highlight")
                .attr("display", "none")
                .selectAll("path")
                .data(topojson.feature(ch, ch.objects.municipalities).features)
                .enter().append("path")
                .attr("class", function(d) { return quantizeTime(rateLastMunicipality.get(d.id)); })
                .attr("d", path)
                .append("title")
                .text(function(d){return municipalityName.get(d.id) + ': ' + sptv.helpers.showTime(rateLastMunicipality.get(d.id));});
        }

        function drawCountMunicipality(ch){
            svg .append("g")
                .attr("class", "countMunicipalities highlight")
                .attr("display", "none")
                .selectAll("path")
                .data(topojson.feature(ch, ch.objects.municipalities).features)
                .enter().append("path")
                .attr("class", function(d) { return quantizeCount(Math.log(municipalityCountDepartures.get(d.id))); })
                .attr("d", path)
                .append("title")
                .text(function(d){return municipalityName.get(d.id) + ': ' + municipalityCountDepartures.get(d.id);});
        }
        
        function drawDeparturesPerPersonMunicipality(ch){
            svg .append("g")
                .attr("class", "departuresPerPerson highlight")
                .attr("display", "none")
                .selectAll("path")
                .data(topojson.feature(ch, ch.objects.municipalities).features)
                .enter().append("path")
                .attr("class", function(d) { return quantizeDensity( (municipalityCountDepartures.get(d.id)/municipalityPopulation.get(d.id) )); })
                .attr("d", path)
                .append("title")
                .text(function(d){return municipalityName.get(d.id) + ': ' +    (municipalityCountDepartures.get(d.id)/municipalityPopulation.get(d.id));});
        }

        function drawCantons(ch){
            svg .append("g")
                .attr("class", "cantons highlight")
                .attr("display", "none")
                .selectAll("path")
                .data(topojson.feature(ch, ch.objects.cantons).features)
                .enter().append("path")
                .attr("class", function(d) { return quantizeTime(rateCanton.get(d.id)); })
                .attr("d", path)
                .append("title")
                .text(function(d){return sptv.helpers.showTime(rateCanton.get(d.id));});
        }

        function drawLakes(ch){
            svg.append("path").datum(topojson.feature(ch, ch.objects.lakes))
                .attr("class", "lake").attr("d", path);     
        }

        function drawCantonBorders(ch){
            svg.append("path")
                .datum(topojson.mesh(ch, ch.objects.cantons, function(a, b) { return a !== b; }))
                .attr("class", "canton-boundaries").attr("d", path);   
        }
    }
};

sptv.helpers = {

    toggleHide: function(cl){    
        if (cl.attr('display'))
            cl.removeAttr('display');
        else cl.attr('display', 'none');
    },

    showLayer: function (layer){
        for(var i = 0, len = sptv.constants.layers.length; i < len; i++){
            if (sptv.constants.layers[i] != layer){
                this.hide($('.'+ sptv.constants.layers[i]));   
            } else {
                this.unhide($('.'+ sptv.constants.layers[i]));
            }
        }
    },

    hide: function (cl){    
        cl.attr('display', 'none');
    }, 

    unhide: function (cl){    
        if (cl.attr('display'))
            cl.removeAttr('display');
    },

    resize: function (){
        $('svg').width($('#map').width());
        this.positionKey();
    },

    positionKey: function (){
        var p = $('#map').position();
        $('#key').css({
            top : p.top+5, 
            left: p.left+5
        });
    },

    labelKey: function (mode){
        var time = ['10:00-11:59', '12:00-13:59', '14:00-15:59', '16:00-17:59', '18:00-19:59', '20:00-21:59','22:00-23:59', '00:00-01:59', '02:00-03:59'];
        var log = [1,4,16,65,260,1043,4188,16815,67508];
        var density = ['0-0.2','0.21-0.4','0.41-0.6','0.61-0.8','0.81-1','1.01-1.2','1.21-1.4','1.41-1.6','>1.6'];

        var keys = $('#key > .panel > .panel-body > p > small');

        for(var i=0; i<keys.length;i++){
            if(mode=='log'){
                $(keys[i]).text(log[i]);   
            } else if (mode == 'time') {
                $(keys[i]).text(time[i]); 
            } else {
                $(keys[i]).text(density[i]); 
            }
        }
    },

    showTime: function (time){
        if(isNaN(time)){
            return 'No Departures';   
        }

        time = Math.round(time);
        var h = Math.floor(time/100);    
        var m = time-(h*100);
        time = h * 3600 + m * 60;

        var hours   = Math.floor(time / 3600);
        var minutes = Math.floor((time - (hours * 3600)) / 60);
        var seconds = time - (hours * 3600) - (minutes * 60);

        if (hours >= 24) { hours-= 24;}
        if (hours   < 10) { hours   = "0"+hours; }
        if (minutes < 10) { minutes = "0"+minutes; }
        var t = hours + ':' + minutes;
        return t;
    }
};