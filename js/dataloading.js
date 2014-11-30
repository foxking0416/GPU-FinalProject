function loadWorldPins( callback ){							
	// We're going to ask a file for the JSON data.
	xhr = new XMLHttpRequest();

	// Where do we get the data?
	xhr.open( 'GET', latlonFile, true );

	//ra
	xhr.overrideMimeType("application/json");

	// What do we do when we have it?
	xhr.onreadystatechange = function() {
	  // If we've received the data
	  //if ( xhr.readyState === 4 && xhr.status === 200 ) {
	      // Parse the JSON
	    if ( xhr.readyState === 4){
	      latlonData = JSON.parse( xhr.responseText );
	      if( callback )
	      	callback();				     
	    }
	};

	// Begin request
	xhr.send( null );			    	
}

function loadContentData(callback){	
	var filePath = "categories/All-test2.json";
	filePath = encodeURI( filePath );
	// console.log(filePath);
			
	xhr = new XMLHttpRequest();
	xhr.open( 'GET', filePath, true );

	//ra
	xhr.overrideMimeType("application/json");

	xhr.onreadystatechange = function() {
		if(xhr.readyState === 4){
		//if ( xhr.readyState === 4 && xhr.status === 200 ) {
	    	timeBins = JSON.parse( xhr.responseText ).timeBins;
		
			maxValue = 0;
			// console.log(timeBins);

			startTime = timeBins[0].t;
	    	endTime = timeBins[timeBins.length-1].t;
	    	timeLength = endTime - startTime;				    											    	

			if(callback)
				callback();				
	    	console.log("finished read data file");	   	
	    }
	};
	xhr.send( null );					    	
}

function loadCountryCodes( callback ){
	cxhr = new XMLHttpRequest();
	cxhr.open( 'GET', isoFile, true );

	//ra
	cxhr.overrideMimeType("application/json");

	cxhr.onreadystatechange = function() {
	if(cxhr.readyState === 4){
	//	if ( cxhr.readyState === 4 && cxhr.status === 200 ) {
	    	countryLookup = JSON.parse( cxhr.responseText );	
	    	console.log("loaded country codes");
	    	callback();
	    }
	};
	cxhr.send( null );
}