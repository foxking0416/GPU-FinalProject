/**
ui.control.js
Created by Pitch Interactive
Created on 6/26/2012
This code will control the primary functions of the UI in the ArmsGlobe app
**/
//d3.selection.prototype.moveToFront = function() { 

var moveToFront = function() {
  this.parentNode.appendChild(this); 
}; 

var currentYear;
 var acdData2 = [];

var d3Graphs = {
    barGraphWidth: 500,
	barGraphHeight: 600,
    barWidth: 14,
	barGraphTopPadding: 20,
	barGraphBottomPadding: 50,
	histogramWidth: 686,
	histogramHeight: 160,
	histogramLeftPadding:31,
	histogramRightPadding: 31,
	histogramVertPadding:20,
	barGraphSVG: d3.select("#wrapper").append("svg").attr('id','barGraph'),
	histogramSVG: null,
    //radar chart added
    radarChartSVG: d3.select("#wrapper2").append("svg").attr('id','radarChart'),
	histogramYScale: null,
	histogramXScale: null,
	cumImportY: 0,cumExportY: 0,
    cumImportLblY: 0,cumExportLblY: 0,
    inited: false,
    histogramOpen: false,
    handleLeftOffset: 12,
    handleInterval: 35,
    windowResizeTimeout: -1,
    histogramImports: null,
    histogramExports: null,
    histogramAbsMax: 0,
    previousImportLabelTranslateY: -1,
    previousExportLabelTranslateY: -1,
    zoomBtnInterval: -1,


    setCountry: function(country) {
        $("#hudButtons .countryTextInput").val(country);
        d3Graphs.updateViz();
    },
    initGraphs: function() {
        this.showHud();
        this.drawBarGraph();
        this.drawHistogram();
        this.drawRadarChart();
        if(currentMode == 0)
        {
            $("#barGraph").hide();
            $("#checkSwitch2").hide();
        }
    },
    showHud: function() {
        if(this.inited) return;
        this.inited = true;
        d3Graphs.windowResize();
        $("#hudHeader, #hudSwitch").show();
        $("#history").show();
        $("#graphIcon").show();
        //$("#importExportBtns").show();
        $("#graphIcon").click(d3Graphs.graphIconClick);
        $("#history .close").click(d3Graphs.closeHistogram);
        $("#history ul li").click(d3Graphs.clickTimeline);
        $("#handle").draggable({axis: 'x',containment: "parent",grid:[this.handleInterval, this.handleInterval],  stop: d3Graphs.dropHandle, drag: d3Graphs.dropHandle });
        $("#hudButtons .searchBtn").click(d3Graphs.updateViz);
        $("#importExportBtns .imex>div").not(".label").click(d3Graphs.importExportBtnClick);
        $("#importExportBtns .imex .label").click(d3Graphs.importExportLabelClick);
        $("#hudButtons .countryTextInput").autocomplete({ source:selectableCountries, autoFocus: true });
        $("#hudButtons .countryTextInput").keyup(d3Graphs.countryKeyUp);
        $("#hudButtons .countryTextInput").focus(d3Graphs.countryFocus);
        $("#hudButtons .aboutBtn").click(d3Graphs.toggleAboutBox);
        $("#hudButtons .dartBtn").click(d3Graphs.showDart);
        $("#hudButtons .bsmgBtn").click(d3Graphs.showBsmg);
        $("#hudButtons .engrBtn").click(d3Graphs.showEngr);
        $("#hudSwitch .gnlBtn").click(d3Graphs.modeGeneral);
        $("#hudSwitch .fosBtn").click(d3Graphs.modeFOS);
        $(document).on("click",".ui-autocomplete li",d3Graphs.menuItemClick);
        $(window).resize(d3Graphs.windowResizeCB);
        $(".zoomBtn").mousedown(d3Graphs.zoomBtnClick);
        $(".zoomBtn").mouseup(d3Graphs.zoomBtnMouseup);
        
    },
    zoomBtnMouseup: function() {
        clearInterval(d3Graphs.zoomBtnInterval);
    },
    zoomBtnClick:function() {
        var delta;
        if($(this).hasClass('zoomOutBtn')) {
            delta = -0.5;
        } else {
            delta = 0.5;
        }
        d3Graphs.doZoom(delta);
        d3Graphs.zoomBtnInterval = setInterval(d3Graphs.doZoom,50,delta);
    },
    doZoom:function(delta) {
        camera.scale.z += delta * 0.1;
        camera.scale.z = constrain( camera.scale.z, 0.8, 5.0 );
    },
    toggleAboutBox:function() {
        
        $("#aboutContainer").toggle();
    },
    showDart:function() {      
        currentFieldint = 2; //0: general, 1: bsmg, 2: dart, 3: engr

		if(changeModelIndex === 0 && !isBlow)
			return;
	
		if(isBlow)
			timePass = 1.0;

		changeModelIndex = 0;
		if(drop === 2)
			timePass = 0.0;
		
		drop = 1;
		var selection = selectionData;
		
		selection.inboundCategories.Fine_Arts = true;
		selection.outboundCategories.Fine_Arts = true;
		selection.inboundCategories.Business = false;
		selection.outboundCategories.Business = false;
		selection.inboundCategories.Engineer = false;
		selection.outboundCategories.Engineer = false;
		selection.inboundCategories.Total = false;
		selection.outboundCategories.Total = false;
		selectVisualization( timeBins, selection.selectedYear, [selection.selectedCountry], selection.getOutboundCategories(), selection.getInboundCategories() );	
		selectVisualization( timeBins, selection.selectedYear, [selection.selectedCountry], selection.getOutboundCategories(), selection.getInboundCategories() );	

    },
    showEngr:function() {  
         currentFieldint = 3; //0: general, 1: bsmg, 2: dart, 3: engr

		if(changeModelIndex === 1 && !isBlow)
			return;	
		if(isBlow)
			timePass = 1.0;
			
		changeModelIndex = 1;
		if(drop === 2)
			timePass = 0.0;
		
		drop = 1;
		
		var selection = selectionData;
		selection.inboundCategories.Fine_Arts = false;
		selection.outboundCategories.Fine_Arts = false;
		selection.inboundCategories.Business = false;
		selection.outboundCategories.Business = false;
		selection.inboundCategories.Engineer = true;
		selection.outboundCategories.Engineer = true;
		selection.inboundCategories.Total = false;
		selection.outboundCategories.Total = false;
		selectVisualization( timeBins, selection.selectedYear, [selection.selectedCountry], selection.getOutboundCategories(), selection.getInboundCategories() );	
		selectVisualization( timeBins, selection.selectedYear, [selection.selectedCountry], selection.getOutboundCategories(), selection.getInboundCategories() );	
    },
     showBsmg:function() {
         currentFieldint = 1; //0: general, 1: bsmg, 2: dart, 3: engr
         //updatTexture(currentFieldint);

		if(changeModelIndex === 2 && !isBlow)
			return;
		if(isBlow)
			timePass = 1.0;
			
		changeModelIndex = 2;
		if(drop === 2)
			timePass = 0.0;
		
		drop = 1;  
		
		var selection = selectionData;	
		selection.inboundCategories.Fine_Arts = false;
		selection.outboundCategories.Fine_Arts = false;
		selection.inboundCategories.Business = true;
		selection.outboundCategories.Business = true;
		selection.inboundCategories.Engineer = false;
		selection.outboundCategories.Engineer = false;
		selection.inboundCategories.Total = false;
		selection.outboundCategories.Total = false;
		selectVisualization( timeBins, selection.selectedYear, [selection.selectedCountry], selection.getOutboundCategories(), selection.getInboundCategories() );	
		selectVisualization( timeBins, selection.selectedYear, [selection.selectedCountry], selection.getOutboundCategories(), selection.getInboundCategories() );	
    },
    modeGeneral:function() {
       currentMode = 0;
       $("#hudButtons").hide();
       $("#barGraph").hide();
       $("#wrapper2").show();
       $("#checkSwitch2").hide();
       $("#checkSwitch").show();
    },
    modeFOS:function() {
       currentMode = 1;
       $("#hudButtons").show();
       $("#barGraph").show();
       $("#wrapper2").hide();
       $("#checkSwitch2").show();
       $("#checkSwitch").hide();
    },
    clickTimeline:function() {
        var year = $(this).html();
        if(year < 10) {
            year = (year * 1) + 2000;
        }
        if(year < 100) {
            year = (year * 1) + 1900
        }
        var index = year - 1995;
        var leftPos = d3Graphs.handleLeftOffset + d3Graphs.handleInterval * index;
        $("#handle").css('left',leftPos+"px");
        d3Graphs.updateViz();
    },
    windowResizeCB:function() {
        clearTimeout(d3Graphs.windowResizeTimeout);
        d3Graphs.windowResizeTimeout = setTimeout(d3Graphs.windowResize, 50);
    },
    windowResize: function() {
        var windowWidth = $(window).width();
        var windowHeight = $(window).height();
        d3Graphs.positionHistory(windowWidth);
        var minWidth = 1280;
        var minHeight = 860;
        var w = windowWidth < minWidth ? minWidth : windowWidth;
        var hudButtonWidth = 489;
        $('#hudButtons').css('left',w - hudButtonWidth-20);        
        var importExportButtonWidth = $("#importExportBtns").width();
        $("#importExportBtns").css('left',50);
        var barGraphHeight = 500;
        var barGraphBottomPadding = 10;
        console.log(windowHeight+ " " + barGraphHeight + " " + barGraphBottomPadding);
        var barGraphTopPos = (windowHeight < minHeight ? minHeight : windowHeight) - barGraphHeight - barGraphBottomPadding;
        console.log(barGraphTopPos);
        
        $("#barGraph").css('top',barGraphTopPos+'px');
        /*
        var hudHeaderLeft = $("#hudHeader").css('left');
        hudHeaderLeft = hudHeaderLeft.substr(0,hudHeaderLeft.length-2)
        console.log(hudHeaderLeft);
        var hudPaddingRight = 30;
        $("#hudHeader").width(w-hudHeaderLeft - hudPaddingRight);
        */
    },
    positionHistory: function(windowWidth) {
        var graphIconPadding = 20;
        var historyWidth = $("#history").width();
        var totalWidth = historyWidth + $("#graphIcon").width() + graphIconPadding;
//        var windowWidth = $(window).width();
        var historyLeftPos = (windowWidth - totalWidth) / 2.0;
        var minLeftPos = 280;
        if(historyLeftPos < minLeftPos) {
            historyLeftPos = minLeftPos;
        }
        $("#history").css('left',historyLeftPos+"px");
        $("#graphIcon").css('left',historyLeftPos + historyWidth + graphIconPadding+'px');
    },
    countryFocus:function(event) {
        //console.log("focus");
        setTimeout(function() { $('#hudButtons .countryTextInput').select() },50);
    },
    menuItemClick:function(event) {
        d3Graphs.updateViz();
    },
    countryKeyUp: function(event) {
        if(event.keyCode == 13 /*ENTER */) {
            d3Graphs.updateViz();
        }
    },
    
    updateViz:function() {
        var yearOffset = $("#handle").css('left');
        yearOffset = yearOffset.substr(0,yearOffset.length-2);
        yearOffset -= d3Graphs.handleLeftOffset;
        yearOffset /= d3Graphs.handleInterval;
        var year = yearOffset + 1995;
        
        //var country = "UNITED STATES";
		//var test = $("#country_name .innerHTML");
		var pos = document.getElementById( 'country_name' );
		var country = pos.innerHTML;
        /*var country = $("#hudButtons .countryTextInput").val().toUpperCase();
        if(typeof countryData[country] == 'undefined') {
            return;
        }*/
        
        //exports first
        var exportArray = []
        var exportBtns = $("#importExportBtns .exports>div").not(".label");
        for(var i = 0; i < exportBtns.length; i++) {
            var btn = $(exportBtns[i]);
            var studyAreaTypeKey = btn.attr('class');
            var studyAreaName = reverseStatisticLookup[studyAreaTypeKey];

            if(btn.find('.inactive').length == 0) {
                exportArray.push(studyAreaName);
               // selectionData.exportCategories[studyAreaName] = true;
                selectionData.outboundCategories[studyAreaName] = true;
            } else {
               // selectionData.exportCategories[studyAreaName] = false;
                selectionData.outboundCategories[studyAreaName] = false;
            }
        }
        //imports esecond
        var importArray = []
        var importBtns = $("#importExportBtns .imports>div").not(".label");
        for(var i = 0; i < importBtns.length; i++) {
            var btn = $(importBtns[i]);
            var studyAreaTypeKey = btn.attr('class');
            var studyAreaName = reverseStatisticLookup[studyAreaTypeKey];
            if(btn.find('.inactive').length == 0) {
                importArray.push(studyAreaName);
                //selectionData.importCategories[weaponName] = true;
                selectionData.inboundCategories[studyAreaName] = true;
            } else {
                //selectionData.importCategories[studyAreaName] = false;
                selectionData.inboundCategories[studyAreaName] = false;
            }
        }
        selectionData.selectedYear = year;
        selectionData.selectedCountry = country;
        selectVisualization(timeBins, year,[country],exportArray, importArray);

        currentYear = year;
    },
    dropHandle:function() {
        d3Graphs.updateViz();
    },
    importExportLabelClick: function() {
        var btns = $(this).prevAll();
        var numInactive = 0;
        for(var i = 0; i < btns.length; i++) {
            if($(btns[i]).find('.inactive').length > 0) {
                numInactive++;
            }
        }
        if(numInactive <= 1) {
            //add inactive
            $(btns).find('.check').addClass('inactive');
        } else {
            //remove inactive
            $(btns).find('.check').removeClass('inactive');
        }
        d3Graphs.updateViz();
    },
    importExportBtnClick:function() { 
        var check = $(this).find('.check');
        if(check.hasClass('inactive')) {
            check.removeClass('inactive');
        } else {
            check.addClass('inactive');
        }
        d3Graphs.updateViz();
    },
    graphIconClick: function() {
        if(!d3Graphs.histogramOpen) {
            d3Graphs.histogramOpen = true;
            $("#history .graph").slideDown();
        } else {
            d3Graphs.closeHistogram();
        }
    },
    closeHistogram: function() {
        d3Graphs.histogramOpen = false;
        $("#history .graph").slideUp();
    },
    line: d3.svg.line()
        // assign the X function to plot our line as we wish
    .x(function(d,i) { 
        if(d == null) {
            return null;
        }
        return d3Graphs.histogramXScale(d.x) + d3Graphs.histogramLeftPadding; 
     })
    .y(function(d) { 
        if(d == null) {
            return null;
        }
        return d3Graphs.histogramYScale(d.y) + d3Graphs.histogramVertPadding; 
    }),
    setHistogramData:function() {
        var importArray = [];
        var exportArray = [];
        var historical = selectedCountry.summary.historical;
        var numHistory = historical.length;
        var absMax = 0;
        var startingImportIndex = 0;
        var startingExportIndex = 0;
        
        while(startingImportIndex < historical.length && historical[startingImportIndex].inbound == 0) {
            startingImportIndex++;
        }
        while(startingExportIndex < historical.length && historical[startingExportIndex].outbound == 0) {
            startingExportIndex++;
        }
        for(var i = 0; i < startingImportIndex; i++) {
//            importArray.push({x:i, y:null});
        }
        if(startingImportIndex != numHistory) {
            importArray.push({x: startingImportIndex, y:0});
        }
        for(var i = startingImportIndex + 1; i < numHistory; i++) {
            var importPrev = historical[startingImportIndex].inbound;
            var importCur = historical[i].inbound;
            var importDiff = (importCur - importPrev) / importPrev * 100;
            importArray.push({x:i, y:importDiff});
            if(Math.abs(importDiff) > absMax) {
                absMax = Math.abs(importDiff);
            }
            
        }
        for(var i = 0; i < startingExportIndex; i++) {
        //    exportArray.push(null);
        }
        if(startingExportIndex != numHistory) {
            exportArray.push({x: startingExportIndex, y: 0});
        }
        for(var i = startingExportIndex + 1; i < numHistory; i++) {    
            var exportPrev = historical[startingExportIndex].outbound;
            var exportCur = historical[i].outbound;
            var exportDiff = (exportCur - exportPrev) / exportPrev * 100;
            exportArray.push({x: i, y: exportDiff}); 
            if(Math.abs(exportDiff) > absMax) {
                absMax = Math.abs(exportDiff);
            }
            
        }
        this.histogramImportArray = importArray;
        this.histogramExportArray = exportArray;
        this.histogramAbsMax = absMax;
    },
    drawHistogram:function() {
        if(this.histogramSVG == null) {
            this.histogramSVG = d3.select('#history .container').append('svg');
            this.histogramSVG.attr('id','histogram').attr('width',this.histogramWidth).attr('height',this.histogramHeight);
        }
        this.setHistogramData();
        
        this.histogramYScale = d3.scale.linear().domain([this.histogramAbsMax,-this.histogramAbsMax]).range([0, this.histogramHeight - this.histogramVertPadding*2]);
        var maxX = selectedCountry.summary.historical.length - 1;
        this.histogramXScale = d3.scale.linear().domain([0,maxX]).range([0, this.histogramWidth - this.histogramLeftPadding - this.histogramRightPadding]);
        
        var tickData = this.histogramYScale.ticks(4);
        var containsZero = false;
        var numTicks = tickData.length;
        for(var i = 0; i < numTicks; i++) {
            if(tickData[i] == 0) {
                containsZero = true;
                break;
            }
        }
        if(!containsZero && numTicks != 0) {
            tickData.push(0);
        }
        //tick lines
        var ticks = this.histogramSVG.selectAll('line.tick').data(tickData);
        ticks.enter().append('svg:line').attr('class','tick');
        ticks.attr('y1',function(d) {
            return d3Graphs.histogramYScale(d) + d3Graphs.histogramVertPadding;
        }).attr('y2', function(d) {
            return d3Graphs.histogramYScale(d) + d3Graphs.histogramVertPadding;
        }).attr('x1',this.histogramLeftPadding).attr('x2',this.histogramWidth - this.histogramRightPadding)
        .attr('stroke-dasharray',function(d) {
            if(d == 0) {
              return null;
            }
            return '3,1';
        }).attr('stroke-width',function(d) {
            if(d == 0) {
                return 2;
            }
            return 1;
        });
		ticks.exit().remove();
        //tick labels
       /* var tickLabels = this.histogramSVG.selectAll("text.tickLblLeft").data(tickData);
        tickLabels.enter().append('svg:text').attr('class','tickLbl tickLblLeft').attr('text-anchor','end');
        tickLabels.attr('x', d3Graphs.histogramLeftPadding-3).attr('y',function(d) {
            return d3Graphs.histogramYScale(d) + d3Graphs.histogramVertPadding + 4;
        }).text(function(d) { return Math.abs(d); }).attr('display', function(d) {
            if(d == 0) { return 'none'; }
            return null;
        });*/
        /*var tickLabelsRight = this.histogramSVG.selectAll("text.tickLblRight").data(tickData);
        tickLabelsRight.enter().append('svg:text').attr('class','tickLbl tickLblRight');
        tickLabelsRight.attr('x', d3Graphs.histogramWidth - d3Graphs.histogramRightPadding+3).attr('y',function(d) {
            return d3Graphs.histogramYScale(d) + d3Graphs.histogramVertPadding + 4;
        }).text(function(d) { return Math.abs(d); }).attr('display', function(d) {
            if(d == 0) { return 'none'; }
            return null;
        });*/
        
        //tickLabels.exit().remove();
        //tickLabelsRight.exit().remove();
        //+ and -
        /*var plusMinus = this.histogramSVG.selectAll("text.plusMinus").data(["+","—","+","—"]); //those are &mdash;s
        plusMinus.enter().append('svg:text').attr('class','plusMinus').attr('text-anchor',function(d,i) {
            if(i < 2) return 'end';
            return null;
        }).attr('x',function(d,i) {
            var plusOffset = 3;
            if(i < 2) return d3Graphs.histogramLeftPadding + (d == '+' ? -plusOffset : 0) -2;
            return d3Graphs.histogramWidth - d3Graphs.histogramRightPadding + (d == '+' ? plusOffset : 0)+2;
        }).attr('y',function(d,i) {
            var yOffset = 10;
            return d3Graphs.histogramYScale(0) + d3Graphs.histogramVertPadding +  6 + (d == '+' ? -yOffset : yOffset); 
        }).text(String);*/
        //lines
        var importsVisible = $("#importExportBtns .imports .check").not(".inactive").length != 0;
        var exportsVisible = $("#importExportBtns .exports .check").not(".inactive").length != 0;
        $("#history .labels .outbound").css('display', exportsVisible ? 'block' : 'none');
        $("#history .labels .inbound").css('display', importsVisible ? 'block' : 'none');
        
    
        var importLine = this.histogramSVG.selectAll("path.import").data([1]);
        importLine.enter().append('svg:path').attr('class','import');
        importLine.attr('d',
        function(){
            if(d3Graphs.histogramImportArray.length == 0) {
                return 'M 0 0';
            } else {
                return d3Graphs.line(d3Graphs.histogramImportArray);
            }
        }).attr('visibility',importsVisible ? 'visible' : 'hidden');
		//importLine.moveToFront();
        d3.select(this).node(moveToFront);
		
        var exportLine = this.histogramSVG.selectAll("path.export").data([1]);
        exportLine.enter().append('svg:path').attr('class','export');
        exportLine.attr('d',function() {
            if(d3Graphs.histogramExportArray.length == 0) {
                return 'M 0 0';
            } else {
                return d3Graphs.line(d3Graphs.histogramExportArray);
            }
        }).attr('visibility', exportsVisible ? 'visible' : 'hidden');
        d3.select(this).node(moveToFront);
        
        //exportLine.moveToFront();
        //active year labels
        var yearOffset = $("#handle").css('left');
        yearOffset = yearOffset.substr(0,yearOffset.length-2);
        yearOffset -= d3Graphs.handleLeftOffset;
        yearOffset /= d3Graphs.handleInterval;
        var activeYearImports = null;
        for(var i = 0; i < this.histogramImportArray.length; i++) {
            var curYearData = this.histogramImportArray[i];
            if(curYearData.x == yearOffset) {
                activeYearImports = curYearData;
                break;
            }
        }
        var activeYearExports = null;
        for(var i = 0; i < this.histogramExportArray.length; i++) {
            var curYearData = this.histogramExportArray[i];
            if(curYearData.x == yearOffset) {
                activeYearExports = curYearData;
                break;
            }
        }
        var maxVal;
        if(activeYearImports != null && activeYearExports!= null) {
            maxVal = activeYearImports.y > activeYearExports.y ? activeYearImports.y : activeYearExports.y;
        } else if(activeYearImports != null) {
            maxVal = activeYearImports.y;
        } else if(activeYearExports != null) {
            maxVal = activeYearExports.y;
        } else {
            maxVal = -1;
        }

        var activeYearData = [{x:yearOffset, y: activeYearImports != null ? activeYearImports.y : -1, max: maxVal, show: activeYearImports!=null, type:"inbound"},
            {x: yearOffset, y: activeYearExports != null ? activeYearExports.y : -1, max: maxVal, show:activeYearExports!=null, type:'outbound'}];
        var yearDots = this.histogramSVG.selectAll("ellipse.year").data(activeYearData);
        var yearDotLabels = this.histogramSVG.selectAll("text.yearLabel").data(activeYearData);
        yearDots.enter().append('ellipse').attr('class','year').attr('rx',4).attr('ry',4)
            .attr('cx',function(d) { return d3Graphs.histogramLeftPadding + d3Graphs.histogramXScale(d.x); })
            .attr('cy',function(d) { return d3Graphs.histogramVertPadding + d3Graphs.histogramYScale(d.y); });
        yearDotLabels.enter().append('text').attr('class','yearLabel').attr('text-anchor','middle');
        var importsVisible = $("#importExportBtns .imports .check").not(".inactive").length != 0;
        var exportsVisible = $("#importExportBtns .exports .check").not(".inactive").length != 0;
        
        yearDots.attr('cx', function(d) { return d3Graphs.histogramLeftPadding + d3Graphs.histogramXScale(d.x); })
            .attr('cy',function(d) { return d3Graphs.histogramVertPadding + d3Graphs.histogramYScale(d.y); } )
            .attr('visibility', function(d) {
                if(d.show == false) {
                    return 'hidden';
                }
                if(d.type == "inbound") {
                    return importsVisible ? 'visible' : 'hidden';
                } else if(d.type == "outbound") {
                    return exportsVisible ? 'visible' : 'hidden';
                }
            });
        yearDotLabels.attr('x',function(d) { return d3Graphs.histogramLeftPadding + d3Graphs.histogramXScale(d.x); })
        .attr('y',function(d) {
            var yVal = d3Graphs.histogramYScale(d.y) + d3Graphs.histogramVertPadding;
            if(d.y == maxVal) {
                yVal -= 7;  
            } else {
                yVal += 19;
            }
            if(yVal > d3Graphs.histogramHeight + d3Graphs.histogramVertPadding) {
                yVal -= 26;
            }
            return yVal;
            
        }).text(function(d) {
            var numlbl = Math.round(d.y*10)/10;
            var lbl = "";
            if(d.y > 0) {
                lbl = "+";
            }
            lbl += ""+numlbl+"%";
            return lbl;

        }).attr('visibility', function(d) {
            if(d.show == false) {
                return 'hidden';
            }
            if(d.type == "inbound") {
                return importsVisible ? 'visible' : 'hidden';
            } else if(d.type == "outbound") {
                return exportsVisible ? 'visible' : 'hidden';
            }
        });
        d3.select(this).node(moveToFront);
       // yearDots.moveToFront();
       // yearDotLabels.moveToFront();

    },
    drawBarGraph: function() {
        this.barGraphSVG.attr('id','barGraph').attr('width',d3Graphs.barGraphWidth).attr('height',d3Graphs.barGraphHeight).attr('class','overlayCountries noPointer');
    /*    var importArray = [];
        var exportArray = [];
        var importTotal = selectedCountry.summary.imported.total;
        var exportTotal = selectedCountry.summary.exported.total;
        var minImExAmount = Number.MAX_VALUE;
        var maxImExAmount = Number.MIN_VALUE;
        */
        var outboundArray = [];  //outbound: study abroad
        var inboundArray = [];  //inbound: international student
        var inboundTotal = selectedCountry.summary.imported["total"];
        var outboundTotal = selectedCountry.summary.exported["total"];
        var minImExAmount = Number.MAX_VALUE;
        var maxImExAmount = Number.MIN_VALUE;
        for(var type in reverseStatisticLookup) {
		
			var selection = selectionData;
		
			if(type === 'bsmg' && !selection.outboundCategories.Business)
				continue;
			else if(type === 'dart' && !selection.inboundCategories.Fine_Arts)
				continue;
			else if(type === 'engr' && !selection.inboundCategories.Engineer)
				continue;
			else if(type === 'total' && !selection.inboundCategories.Total)
				continue;
			/*selection.inboundCategories.Fine_Arts = true;
			selection.outboundCategories.Fine_Arts = true;
			selection.inboundCategories.Business = false;
			selection.outboundCategories.Business = false;
			selection.inboundCategories.Engineer = false;
			selection.outboundCategories.Engineer = false;
			selection.inboundCategories.Total = false;
			selection.outboundCategories.Total = false;*/
		
            var imAmnt = selectedCountry.summary.imported[type];
            var exAmnt = selectedCountry.summary.exported[type];
            if(imAmnt < minImExAmount) {
                minImExAmount = imAmnt;
            }
            if(imAmnt > maxImExAmount) {
                maxImExAmount = imAmnt;
            }
            if(exAmnt < minImExAmount) {
                minImExAmount = exAmnt;
            }
            if(exAmnt > maxImExAmount) {
                maxImExAmount = exAmnt;
            }
            inboundArray.push({"type":type, "amount": imAmnt});
            outboundArray.push({"type":type, "amount": exAmnt});
        }
        var max = inboundTotal > outboundTotal ? inboundTotal : outboundTotal;
        var yScale = d3.scale.linear().domain([0,max]).range([0,this.barGraphHeight - this.barGraphBottomPadding - this.barGraphTopPadding]);
        var xScale = d3.scale.linear().domain([max,0]).range([this.barGraphWidth - this.barGraphBottomPadding,0]);
        var inboundRects = this.barGraphSVG.selectAll("rect.import").data(inboundArray);
        var midX = this.barGraphWidth / 2;
		var midY = this.barGraphHeight / 2;
        this.cumImportY = this.cumExportY = 0;
        this.cumImportX = this.cumExportX = 0;
        
        inboundRects.enter().append('rect').attr('class', function(d) {
            return 'import '+d.type;
        //}).attr('x',midX - this.barWidth).attr('width',this.barWidth);
        });


        inboundRects.attr('y', function(d){
            d3Graphs.cumImportY += 30;
            var value = d3Graphs.barGraphHeight - (midY + d3Graphs.cumImportY);

            return value; }).attr('height',this.barWidth);
        
        inboundRects.attr('x', function(d) {
            /*//var value = d3Graphs.barGraphWidth - d3Graphs.barGraphBottomPadding - d3Graphs.cumImportX - xScale(d.amount) ;
            var offsetX = 0;
            if(d.type == 'total') 
                {offsetX = 0}
            else {offsetX = xScale(d.amount)}
            var value = d3Graphs.barGraphBottomPadding + d3Graphs.cumImportX;
            d3Graphs.cumImportX += xScale(d.amount);

            console.Log("value: " + value);*/
            return d3Graphs.barGraphBottomPadding;

           // return 200.0;
        }).attr('width',function(d) { return xScale(d.amount); });

       
        var outboundRects = this.barGraphSVG.selectAll('rect.export').data(outboundArray);
        outboundRects.enter().append('rect').attr('class',function(d) {
            return 'export '+ d.type;
        });

        outboundRects.attr('y', function(d){
            d3Graphs.cumImportY += 30;
            var value = d3Graphs.barGraphHeight - (midY + d3Graphs.cumImportY);

            return value; }).attr('height',this.barWidth);
        
        
        outboundRects.attr('x',function(d) {
           /* var value = d3Graphs.barGraphWidth - d3Graphs.barGraphBottomPadding - d3Graphs.cumExportY - yScale(d.amount);
            d3Graphs.cumExportX += xScale(d.amount);
            return value;*/
            return d3Graphs.barGraphBottomPadding;
        }).attr('width',function(d) { return xScale(d.amount); }); 
		
		
		
		//******************Test*********************//
		/*
        inboundRects.enter().append('rect').attr('class', function(d) {
            return 'import '+ d.type;
        }).attr('y',midY ).attr('width',this.barWidth);
        
        
        //inboundRects.attr('x',10.0).attr('width',this.barGraphWidth);
        
		
	


        var data2 = [{"qw": 70}];
        var testRects = this.barGraphSVG.selectAll('rect.import').data(data2);
        
        testRects.enter().append('rect');

        testRects.attr('y', 60).attr('height',100);
        testRects.attr('x', 60).attr('width',100);*/
            //******************Test*********************//
		
        //bar graph labels
        this.cumImportLblY = 0;
        this.cumExportLblY = 0;
        this.previousImportLabelTranslateY = 0;
        this.previousExportLabelTranslateY = 0;
        var paddingFromBottomOfGraph = 00;
        var heightPerLabel = 25;
        var fontSizeInterpolater = d3.interpolateRound(10,28);
        var smallLabelSize = 22;
        var mediumLabelSize = 40;
        //import labels
        
        var importLabelBGs = this.barGraphSVG.selectAll("rect.barGraphLabelBG").data(inboundArray);
        importLabelBGs.enter().append('rect').attr('class',function(d) {
            return 'barGraphLabelBG ' + d.type; });
        var importLabels = this.barGraphSVG.selectAll("g.importLabel").data(inboundArray);
        importLabels.enter().append("g").attr('class',function(d) {
            return 'importLabel '+d.type;
        });
        importLabels.attr('transform',function(d) { 
            var translate = 'translate('+(d3Graphs.barGraphWidth / 2 - 25)+",";
            var valueX;
            if(xScale(d.amount) > d3Graphs.barGraphWidth - 100)
                valueX = d3Graphs.barGraphWidth - d3Graphs.barGraphBottomPadding - xScale(d.amount)/2;
            else
                valueX =  d3Graphs.barGraphBottomPadding + xScale(d.amount) + 80;
           // d3Graphs.cumImportLblY += yScale(d.amount);
           d3Graphs.cumImportLblY += 30;
           var valueY = d3Graphs.barGraphHeight - (d3Graphs.barGraphHeight /2 + d3Graphs.cumImportLblY);
            translate = 'translate('+valueX+","+ valueY+")";
            this.previousImportLabelTranslateY = valueX;
            return translate;
        }).attr('display',function(d) {
            if(d.amount == 0) { return 'none';}
            return null;
        });
        importLabels.selectAll("*").remove();
        var importLabelArray = importLabels[0];
        var importLabelBGArray = importLabelBGs[0];
        
        
        for(var i = 0; i < importLabelArray.length; i++) {
            var importLabelE = importLabelArray[i];
            var importLabel = d3.select(importLabelE);
            var data = inboundArray[i];
            importLabel.data(data);
            //var pieceHeight = yScale(data.amount);
            var pieceHeight = xScale(data.amount);
            var labelHeight = -1;
            var labelBGYPos = -1;
            var labelWidth = -1;
            var importLabelBG = d3.select(importLabelBGArray[i]);
            if(pieceHeight < smallLabelSize) {
                //just add number
                //console.log("small label");
                var numericLabel = importLabel.append('text').text(function(d) {
                    return abbreviateNumber(d.amount);
                }).attr('text-anchor','end').attr('alignment-baseline','central')
                .attr('font-size',function(d) {
                    return fontSizeInterpolater((d.amount-minImExAmount)/(maxImExAmount - minImExAmount));
                });
                labelHeight = fontSizeInterpolater((data.amount-minImExAmount)/(maxImExAmount-minImExAmount));
                labelBGYPos = - labelHeight / 2;
                var numericLabelEle = numericLabel[0][0];
                labelWidth = numericLabelEle.getComputedTextLength();
            } else if(pieceHeight < mediumLabelSize || data.type == 'bsmg') {
                //number and type
                //console.log('medium label');
                var numericLabel = importLabel.append('text').text(function(d) {
                    return abbreviateNumber(d.amount);
                }).attr('text-anchor','end').attr('font-size',function(d) {
                    return fontSizeInterpolater((d.amount-minImExAmount)/(maxImExAmount - minImExAmount));
                });
                var textLabel = importLabel.append('text').text(function(d) {
                    return reverseStatisticLookup[d.type].split(' ')[0].toUpperCase();
                }).attr('text-anchor','end').attr('y',15).attr('class',function(d) { return 'import '+d.type});
                labelHeight = fontSizeInterpolater((data.amount-minImExAmount)/(maxImExAmount-minImExAmount));
                labelBGYPos = -labelHeight;
                labelHeight += 16;
                var numericLabelEle = numericLabel[0][0];
                var textLabelEle = textLabel[0][0];
                labelWidth = numericLabelEle.getComputedTextLength() > textLabelEle.getComputedTextLength() ? numericLabelEle.getComputedTextLength() : textLabelEle.getComputedTextLength();
            } else {
                //number type and 'weapons'
                //console.log('large label');
                var numericLabel = importLabel.append('text').text(function(d) {
                    return abbreviateNumber(d.amount);
                }).attr('text-anchor','end').attr('font-size',function(d) {
                    return fontSizeInterpolater((d.amount-minImExAmount)/(maxImExAmount - minImExAmount));
                }).attr('y',-7);
                var textLabel = importLabel.append('text').text(function(d) {
                    return reverseStatisticLookup[d.type].split(' ')[0].toUpperCase();
                }).attr('text-anchor','end').attr('y',8).attr('class',function(d) { return 'import '+d.type});
                var weaponLabel  =importLabel.append('text').text('Major').attr('text-anchor','end').attr('y',21)
                    .attr('class',function(d) { return'import '+d.type} );
                labelHeight = fontSizeInterpolater((data.amount-minImExAmount)/(maxImExAmount-minImExAmount));
                labelBGYPos = -labelHeight - 7;
                labelHeight += 16 +14;
                var numericLabelEle = numericLabel[0][0];
                var textLabelEle = textLabel[0][0];
                var weaponLabelEle = weaponLabel[0][0];
                labelWidth = numericLabelEle.getComputedTextLength() > textLabelEle.getComputedTextLength() ? numericLabelEle.getComputedTextLength() : textLabelEle.getComputedTextLength();
                if(weaponLabelEle.getComputedTextLength() > labelWidth) {
                    labelWidth = weaponLabelEle.getComputedTextLength();
                }
            }
            if(labelHeight != -1 && labelBGYPos != -1 && labelWidth != -1) {
                importLabelBG.attr('x',-labelWidth).attr('y',labelBGYPos).attr('width',labelWidth).attr('height',labelHeight)
                    .attr('transform',importLabel.attr('transform'));
            }
            
        }
        //export labels
        var exportLabelBGs = this.barGraphSVG.selectAll("rect.barGraphLabelBG.exportBG").data(outboundArray);
        exportLabelBGs.enter().append('rect').attr('class',function(d) {
            return 'barGraphLabelBG exportBG ' + d.type; });
        var exportLabels = this.barGraphSVG.selectAll("g.exportLabel").data(outboundArray);
        exportLabels.enter().append("g").attr('class',function(d) {
            return 'exportLabel '+d.type;
        });

        exportLabels.attr('transform',function(d) { 
            var translate = 'translate('+(d3Graphs.barGraphWidth / 2 - 25)+",";
            if(xScale(d.amount) > d3Graphs.barGraphWidth - 100)
                valueX = d3Graphs.barGraphWidth - d3Graphs.barGraphBottomPadding - xScale(d.amount)/2;
            else
                valueX =  d3Graphs.barGraphBottomPadding + xScale(d.amount) + 30;
          //  var valueX = d3Graphs.barGraphBottomPadding + xScale(d.amount) + 60;
           // d3Graphs.cumImportLblY += yScale(d.amount);
           d3Graphs.cumImportLblY += 30;
           var valueY = d3Graphs.barGraphHeight - (d3Graphs.barGraphHeight /2 + d3Graphs.cumImportLblY);
            translate = 'translate('+valueX+","+ valueY+")";
            this.previousImportLabelTranslateY = valueX;
            return translate;
        }).attr('display',function(d) {
            if(d.amount == 0) { return 'none';}
            return null;
        });
        exportLabels.selectAll("*").remove();
        var exportLabelArray = exportLabels[0];
        var exportLabelBGArray = exportLabelBGs[0];
        for(var i = 0; i < exportLabelArray.length; i++) {
            var exportLabelE = exportLabelArray[i];
            var exportLabel = d3.select(exportLabelE);
            var data = outboundArray[i];
            exportLabel.data(data);
            var pieceHeight = yScale(data.amount);
            var labelHeight = -1;
            var labelBGYPos = -1;
            var labelWidth = -1;
            var exportLabelBG = d3.select(exportLabelBGArray[i]);
            if(pieceHeight < smallLabelSize) {
                //just add number
                //console.log("small label");
                var numericLabel = exportLabel.append('text').text(function(d) {
                    return abbreviateNumber(d.amount);
                }).attr('text-anchor','start').attr('alignment-baseline','central')
                .attr('font-size',function(d) {
                    return fontSizeInterpolater((d.amount-minImExAmount)/(maxImExAmount - minImExAmount));
                });
                labelHeight = fontSizeInterpolater((data.amount-minImExAmount)/(maxImExAmount-minImExAmount));
                labelBGYPos = - labelHeight / 2;
                var numericLabelEle = numericLabel[0][0];
                labelWidth = numericLabelEle.getComputedTextLength();
            } else if(pieceHeight < mediumLabelSize || data.type == 'bsmg') {
                //number and type
                var numericLabel = exportLabel.append('text').text(function(d) {
                    return abbreviateNumber(d.amount);
                }).attr('text-anchor','start').attr('font-size',function(d) {
                    return fontSizeInterpolater((d.amount-minImExAmount)/(maxImExAmount - minImExAmount));
                });
                var textLabel = exportLabel.append('text').text(function(d) {
                    return reverseStatisticLookup[d.type].split(' ')[0].toUpperCase();
                }).attr('text-anchor','start').attr('y',15).attr('class',function(d) { return 'export '+d.type});
                labelHeight = fontSizeInterpolater((data.amount-minImExAmount)/(maxImExAmount-minImExAmount));
                labelBGYPos = -labelHeight;
                labelHeight += 16;
                var numericLabelEle = numericLabel[0][0];
                var textLabelEle = textLabel[0][0];
                labelWidth = numericLabelEle.getComputedTextLength() > textLabelEle.getComputedTextLength() ? numericLabelEle.getComputedTextLength() : textLabelEle.getComputedTextLength();
            } else {
                //number type and 'weapons'
                var numericLabel = exportLabel.append('text').text(function(d) {
                    return abbreviateNumber(d.amount);
                }).attr('text-anchor','start').attr('font-size',function(d) {
                    return fontSizeInterpolater((d.amount-minImExAmount)/(maxImExAmount - minImExAmount));
                }).attr('y',-7);
                var textLabel = exportLabel.append('text').text(function(d) {
                    return reverseStatisticLookup[d.type].split(' ')[0].toUpperCase();
                }).attr('text-anchor','start').attr('y',8).attr('class',function(d) { return 'export '+d.type});
                var weaponLabel  =exportLabel.append('text').text('MAJOR').attr('text-anchor','start').attr('y',21)
                    .attr('class',function(d) { return'export '+d.type} );
                labelHeight = fontSizeInterpolater((data.amount-minImExAmount)/(maxImExAmount-minImExAmount));
                labelBGYPos = -labelHeight - 7;
                labelHeight += 16 +14;
                var numericLabelEle = numericLabel[0][0];
                var textLabelEle = textLabel[0][0];
                var weaponLabelEle = weaponLabel[0][0];
                labelWidth = numericLabelEle.getComputedTextLength() > textLabelEle.getComputedTextLength() ? numericLabelEle.getComputedTextLength() : textLabelEle.getComputedTextLength();
                if(weaponLabelEle.getComputedTextLength() > labelWidth) {
                    labelWidth = weaponLabelEle.getComputedTextLength();
                }
            }
            if(labelHeight != -1 && labelBGYPos != -1 && labelWidth != -1) {
                exportLabelBG.attr('x',0).attr('y',labelBGYPos).attr('width',labelWidth).attr('height',labelHeight)
                    .attr('transform',exportLabel.attr('transform'));
              //       exportLabelBG.attr('x',-labelWidth).attr('y',labelBGYPos).attr('width',labelWidth).attr('height',labelHeight)
             //       .attr('transform',exportLabel.attr('transform'));
            }
        }
       
        //over all numeric Total Import/Export labels
   /*     var importsVisible = $("#importExportBtns .imports .check").not(".inactive").length != 0;
        var exportsVisible = $("#importExportBtns .exports .check").not(".inactive").length != 0;
        var importTotalLabel = this.barGraphSVG.selectAll('text.totalLabel').data([1]);
        importTotalLabel.enter().append('text').attr('x',midX).attr('text-anchor','end')
            .attr('class','totalLabel').attr('y',this.barGraphHeight- this.barGraphBottomPadding + 25);
        importTotalLabel.text(abbreviateNumber(inboundTotal)).attr('visibility',importsVisible ? "visible":"hidden");
        var exportTotalLabel = this.barGraphSVG.selectAll('text.totalLabel.totalLabel2').data([1]);
        exportTotalLabel.enter().append('text').attr('x',midX+10).attr('class','totalLabel totalLabel2').attr('y', this.barGraphHeight - this.barGraphBottomPadding+25);
        exportTotalLabel.text(abbreviateNumber(outboundTotal)).attr('visibility',exportsVisible ? "visible":"hidden");
        //Import label at bottom
        var importLabel = this.barGraphSVG.selectAll('text.importLabel').data([1]);
        importLabel.enter().append('text').attr('x',midX).attr('text-anchor','end').text('IMPORTS')
            .attr('class','importLabel').attr('y', this.barGraphHeight - this.barGraphBottomPadding + 45);
        importLabel.attr('visibility',importsVisible ? "visible":"hidden");
        //Export label at bottom
        var exportLabel = this.barGraphSVG.selectAll('text.exportLabel').data([1]);
        exportLabel.enter().append('text').attr('x',midX+10).text('EXPORTS')
            .attr('class','exportLabel').attr('y', this.barGraphHeight - this.barGraphBottomPadding + 45);
        exportLabel.attr('visibility',exportsVisible ? "visible":"hidden")    */
         
            
    },
    dragHandleStart: function(event) {
        console.log('start');
        event.dataTransfer.setData('text/uri-list','yearHandle.png');
        event.dataTransfer.setDragImage(document.getElementById('handle'),0,0);
        event.dataTransfer.effectAllowed='move';
    },
    drawRadarChart: function(){
        
        for( var i in acdLevel ){
            acdData2[i] = Math.ceil(Math.random() * 10) + 5;
        } 
        d3.select("#wrapper2").select('svg').remove();
        this.radarChartSVG.attr('id','radarChart').attr('width',d3Graphs.barGraphWidth).attr('height',d3Graphs.barGraphHeight).attr('class','overlayCountries noPointer');
        var acdData = [];
        if (currentYear == null) currentYear = 2013;
        for( var i in acdLevel ){
            var myacd = acdLevel[i];
            if(myacd.t == currentYear)
            {
                acdData.push(myacd.v);
            }
        }
        

        var data = [
          {
            className: 'inbound', // optional can be used for styling
            axes: [
              {axis: "Undergrad", value: (acdData[0] - 160000) * 0.0002}, 
              {axis: "Graduate", value: (acdData[1] - 200000) * 0.0002}, 
              {axis: "Non-Degree", value: (acdData[2] - 20000) * 0.0002},  
              {axis: "OPT", value: (acdData[3] - 20000) * 0.0002}
            ]
          },
          {
            className: 'outbound',
            axes: [
              {axis: "Undergrad", value: acdData2[0]}, 
              {axis: "Graduate", value: acdData2[1]}, 
              {axis: "Non-Degree", value: acdData2[2]},  
              {axis: "OPT", value: 2}
            ]
          }
        ];

   /* var data = [
          {
            className: 'inbound', // optional can be used for styling
            axes: [
              {axis: "Undergrad", value: 1},
              {axis: "Graduate", value: 2}, 
              {axis: "Non-Degree", value: 3},  
              {axis: "OPT", value: 4}
            ]
          },
          {
            className: 'outbound',
            axes: [
              {axis: "Undergrad", value: 0}, 
              {axis: "Graduate", value: 1}, 
              {axis: "Non-Degree", value: 2},  
              {axis: "OPT", value: acdData2[3]}
            ]
          }
        ];*/
    var chart = RadarChart.chart();
    var cfg = chart.config(); // retrieve default config
    
    var svg =  d3.select("#wrapper2").append("svg").attr('id','radarChart')
      .attr('width', cfg.w)
      .attr('height', cfg.h + cfg.h / 4);
    svg.append('g').classed('single', 1).datum(data).call(chart);
    }

}

/*
This is going to be a number formatter. Example of use:

var bigNumber = 57028715;
var formated = abbreviateNumber(57028715);
return formated; //should show 57B for 57 Billion

*/
function abbreviateNumber(value) {
    
    var newValue = value;
    if (value >= 1000) {
        var suffixes = ["", "K", "M", "B","T"];
        var suffixNum = Math.floor( (""+value).length/3 );
        var shortValue = '';
        for (var precision = 3; precision >= 1; precision--) {
            shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum) ) : value).toPrecision(precision));
            var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
            if (dotLessShortValue.length <= 3) { break; }
        }
        if (shortValue % 1 != 0)  shortNum = shortValue.toFixed(1);
        newValue = shortValue+suffixes[suffixNum];
    }
    return newValue;
}

