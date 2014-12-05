var masterContainer = document.getElementById('visualization');

var overlay = document.getElementById('visualization');

//	where in html to hold all our things
var glContainer = document.getElementById( 'glContainer' );

//	contains a list of country codes with their matching country names
var isoFile = 'country_iso3166.json';
var latlonFile = 'country_lat_lon.json'

var camera, scene, renderer, controls;

var pinsBase, pinsBaseMat;
var lookupCanvas
var lookupTexture;
var globeMesh;
var countryMesh;
var flagBoxMesh;
var visualizationMesh;
var objectMesh;							

var mapUniforms;
var shaderMaterial_Globe;
//var attributes_Particle_Buddha;
//var uniforms_Particle_Buddha;
//var attributes_Particle_Digger;
//var uniforms_Particle_Digger;
//var buddhaMesh;
//var diggerMesh;
//var dollarMesh;

var clock = new THREE.Clock();
var timeBins;
var timePass = 0.0;


//	contains latlon data for each country
var latlonData;			    

//	contains above but organized as a mapped list via ['countryname'] = countryobject
//	each country object has data like center of country in 3d space, lat lon, country name, and country code
var countryData = new Object();		

//	contains a list of country code to country name for running lookups
var countryLookup;		    

var selectableYears = [];
var selectableCountries = [];			    


var drop = 0;

var stats;


var StudyAreaLookup = {
	'Business_Management' 	: 'bsmg',
	'Engineer'	           	: 'engr',
	'Design_and_Fine_Arts'	: 'dart',
	'Total'                 : 'total',
};

//	a list of the reverse for easy lookup
var reverseStatisticLookup = new Object();
for( var i in StudyAreaLookup ){
	var name = i;
	var code = StudyAreaLookup[i];
	reverseStatisticLookup[code] = name;
}	    	

var exportColor = 0xffff33;
var importColor = 0x9900cc;

//	the currently selected country
var selectedCountry = null;
var previouslySelectedCountry = null;

//	contains info about what year, what countries, categories, etc that's being visualized
var selectionData;

//var cameraCube, sceneCube;
var skyboxMesh;

/*
var manager = new THREE.LoadingManager();
manager.onProgress = function ( item, loaded, total ) {
      //  console.log( item, loaded, total );
};
var loader = new THREE.OBJLoader( manager );
*/

function start( e ){	
	//	detect for webgl and reject everything else
	if ( ! Detector.webgl ) {
		Detector.addGetWebGLMessage();
	}
	else{
		loadCountryCodes(
			function(){
				loadWorldPins(
					function(){										
						loadContentData(								
							function(){																	
								initScene();
								animate();		
							}
						);														
					}
				);
			}
		);
	};
}			



var Selection = function(){
	this.selectedYear = '2013';
	this.selectedCountry = 'UNITED STATES';


	//this.exportCategories = new Object();
	//this.importCategories = new Object();

	this.outboundCategories = new Object();
	this.inboundCategories = new Object();

	for( var i in StudyAreaLookup ){
		this.outboundCategories[i] = true;
		this.inboundCategories[i] = true;
	}				

	this.getOutboundCategories = function(){
		var list = [];
		for( var i in this.outboundCategories ){
			if( this.outboundCategories[i] )
				list.push(i);
		}
		return list;
	}		

	this.getInboundCategories = function(){
		var list = [];
		for( var i in this.inboundCategories ){
			if( this.inboundCategories[i] )
				list.push(i);
		}
		return list;
	}
};

//	-----------------------------------------------------------------------------
//	All the initialization stuff for THREE
function initScene() {

	//	-----------------------------------------------------------------------------
    //	Let's make a scene		
	scene = new THREE.Scene();
//	sceneCube = new THREE.Scene();
	scene.matrixAutoUpdate = false;		
	        		       	

	globeMesh = new THREE.Object3D();
	scene.add(globeMesh);

	countryMesh = new THREE.Object3D();
	scene.add(countryMesh);
	
	flagBoxMesh = new THREE.Object3D();
	scene.add(flagBoxMesh);
	
	objectMesh = new THREE.Object3D();
	scene.add(objectMesh);
	
	lookupCanvas = document.createElement('canvas');	
	lookupCanvas.width = 256;
	lookupCanvas.height = 1;
	
	lookupTexture = new THREE.Texture( lookupCanvas );
	lookupTexture.magFilter = THREE.NearestFilter;
	lookupTexture.minFilter = THREE.NearestFilter;
	lookupTexture.needsUpdate = true;

	var mapIndexTexture = THREE.ImageUtils.loadTexture( "images/map_indexed.png" );
	mapIndexTexture.magFilter = THREE.NearestFilter;
	mapIndexTexture.minFilter = THREE.NearestFilter;

	var uniforms_Globe = {
		'mapIndex': { type: 't', value: mapIndexTexture },		
		'lookup': { type: 't', value: lookupTexture },
		'outline': { type: 't', value: THREE.ImageUtils.loadTexture( "images/map_outline.png" ) },
		'earthMap': { type: 't', value: THREE.ImageUtils.loadTexture( "images/earthmap1024Tran.png" ) },
		'earthLight': { type: 't', value: THREE.ImageUtils.loadTexture( "images/earthlight1024Tran.png" ) },
		'earthBump': { type: 't', value: THREE.ImageUtils.loadTexture( "images/earthbump1024Tran.png" ) },
		'earthSpec': { type: 't', value: THREE.ImageUtils.loadTexture( "images/earthspec1024Tran.png" ) },
		'outlineLevel': {type: 'f', value: 1 },
	};
	mapUniforms = uniforms_Globe;
	
	shaderMaterial_Globe = new THREE.ShaderMaterial( {

		uniforms: 		uniforms_Globe,
		vertexShader:   document.getElementById( 'globeVertexShader' ).textContent,
		fragmentShader: document.getElementById( 'globeFragmentShader' ).textContent,

		
		blending: 		THREE.AdditiveBlending, 
		depthWrite: 	false,
		transparent:	true,
		side:           THREE.DoubleSide,
	});
		

	var globeSphere = new THREE.Mesh( new THREE.SphereGeometry( 100, 40, 40 ), shaderMaterial_Globe );	//100 is radius, 40 is segments in width, 40 is segments in height
	globeSphere.rotation.x = Math.PI;				
	globeSphere.rotation.y = -Math.PI/2;
	globeSphere.rotation.z = Math.PI;
	globeSphere.id = "base";	
	globeMesh.add( globeSphere );	

	
	var manager = new THREE.LoadingManager();
		manager.onProgress = function ( item, loaded, total ) {
		console.log( item, loaded, total );
	};


	// model
	var loader = new THREE.OBJLoader( manager );
	loader.load( 'model/buddha.obj', function ( object ) {
		
		////// buddha parameters ////////
		createObjectMesh( object, 0, 60, 0.0, 0.0, 0.0, 2.0, //scale, x, y, z, blowOffsetX, blowOffsetZ, blowStrength
					0x00ff44, 3.0, 50, 140, 180); //color, drop acceleration, ring radius, ring rising height, ring rising velocity
	} );

	loader.load( 'model/digger.obj', function ( object ) {
		
		////// digger parameters ////////
		createObjectMesh( object, 1, 0.35, 5.0, -59, 0.0, 340.0, 
					0xff0044, 500.0, 100, 92, 180);
	} );
	
	loader.load( 'model/dollar.obj', function ( object ) {
		
		////// dollar parameters ////////
		createObjectMesh( object, 2, 0.05, 0.0, -57, 0.0, 2400.0, 
					0xff0044, 2700.0, 30, 87, 140);
	} );

	createRingMesh();
	
	/*var ambient = new THREE.AmbientLight( 0x101030 );
	//scene.add( ambient );
	
	var directionalLight = new THREE.DirectionalLight( 0x505050 );
	directionalLight.position.set( 0, 0, 1 );
	scene.add( directionalLight );*/

	//ra, skybox
	//ra, skybox, http://learningthreejs.com/blog/2011/08/15/lets-do-a-sky/
	var sky_urlPrefix = "texture/";
	var sky_urlarea = "n_";
	var sky_urlPostfix = ".png";
	var sky_urls = [ sky_urlPrefix + sky_urlarea + "left" + sky_urlPostfix, sky_urlPrefix + sky_urlarea + "right" + sky_urlPostfix,
    sky_urlPrefix + sky_urlarea + "up" + sky_urlPostfix, sky_urlPrefix + sky_urlarea + "down" + sky_urlPostfix,
    sky_urlPrefix + sky_urlarea + "front" + sky_urlPostfix, sky_urlPrefix + sky_urlarea + "back" + sky_urlPostfix ];

	var skyGeometry = new THREE.BoxGeometry(800, 800, 800);

	var materialArray = [];

	for (var i = 0; i<6; i++)
	{
		materialArray.push(new THREE.MeshBasicMaterial({
			map: THREE.ImageUtils.loadTexture(sky_urls[i]),
			side: THREE.BackSide
		}));
	}
	var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
	// build the skybox Mesh 
	skyboxMesh = new THREE.Mesh( skyGeometry, skyMaterial );
	// add it to the scene
	scene.add( skyboxMesh );

	
	
	
	for( var i in timeBins ){					
		var bin = timeBins[i].data;
		for( var s in bin ){
			var set = bin[s];

			var outCountryName = set.e.toUpperCase();
			var inCountryName = set.i.toUpperCase();

			//	let's track a list of actual countries listed in this data set
			//	this is actually really slow... consider re-doing this with a map
			if( $.inArray(outCountryName, selectableCountries) < 0 )
				selectableCountries.push( outCountryName );

			if( $.inArray(inCountryName, selectableCountries) < 0 )
				selectableCountries.push( inCountryName );
		}
	}

	console.log( selectableCountries );
	
	// load geo data (country lat lons in this case)
	console.time('loadGeoData');
	loadGeoData( latlonData );				
	console.timeEnd('loadGeoData');				

	console.time('buildDataVizGeometries');
	var vizilines = buildDataVizGeometries(timeBins);
	console.timeEnd('buildDataVizGeometries');

	visualizationMesh = new THREE.Object3D();
	globeMesh.add(visualizationMesh);	

	buildGUI();
	selectVisualization( timeBins, '2013', ['UNITED STATES'], [ 'Total','Business_Management','Engineer', 'Design_and_Fine_Arts'], [ 'Total','Business_Management','Engineer', 'Design_and_Fine_Arts'] );					
	selectCountryLand(['UNITED STATES']);
	selectCountryFlag(['UNITED STATES']);


    //	-----------------------------------------------------------------------------
    //	Setup our renderer
	renderer = new THREE.WebGLRenderer({antialias:false});
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.autoClear = false;
	
	renderer.sortObjects = false;		
	renderer.generateMipmaps = false;					

	glContainer.appendChild( renderer.domElement );									


    //	-----------------------------------------------------------------------------
    //	Event listeners
	document.addEventListener( 'mousemove', onDocumentMouseMove, true );
	document.addEventListener( 'windowResize', onDocumentResize, false );

	document.addEventListener( 'mousedown', onDocumentMouseDown, true );	
	document.addEventListener( 'mouseup', onDocumentMouseUp, false );	
	
	masterContainer.addEventListener( 'click', onClick, true );	
	masterContainer.addEventListener( 'mousewheel', onMouseWheel, false );
	
	//	firefox	
	masterContainer.addEventListener( 'DOMMouseScroll', function(e){
		    var evt=window.event || e; //equalize event object
    		onMouseWheel(evt);
	}, false );

	document.addEventListener( 'keydown', onKeyDown, false);												    			    	

    //	-----------------------------------------------------------------------------
    //	Setup our camera
    camera = new THREE.PerspectiveCamera( 12, window.innerWidth / window.innerHeight, 1, 10000 ); 		        
	camera.position.z = 1400;
	camera.position.y = 0;
	stats = initStats();

}

var objectMeshArray = [];
var attributesObjectParticleArray = [];
var uniformsObjectParticleArray = [];

var ringMeshArray = [];
var attributesRingParticleArray = [];
var uniformsRingParticleArray = [];

var radiusArray = [];
var heightArray = [];
var ringRisingVelArray = [];
var ringMesh;
var currentModelIndex = 0;
var changeModelIndex = 0;


var realTimePass = 0.0
var isBlow = false;
var blowDir = new THREE.Vector3(0.0, 0.0, 0.0 );

function createObjectMesh(originalGeometry, modelIndex, scale, x, y, z, blowStrength, color, acceleration, ringRadius, ringRisingHeight, ringRisingVelocity ) {

	var attributes_Particle = {
		blow:                  { type: 'f', value: []},
		blowTime:              { type: 'f', value: []},
		requireTimeToDrop:     { type: 'f', value: []},
		customColor:		   { type: 'v3', value: []},
	};
	
	var uniforms_Particle = {
		time:         { type: "f", value: 1.0 },
		size:	      { type: "f", value: 1.0 },
		lowestY:      { type: 'f', value: 1.0},
		acceleration: { type: 'f', value: acceleration},
		realTime: 	  { type: 'f', value: 0.0},
		blowStrength: { type: 'f', value: blowStrength},
		//color:      { type: 'v3', value: new THREE.Vector3(0.0, 1.0, 0.0 )},
		offset:    	  { type: 'v3', value: new THREE.Vector3( 900, 0, 0 )},
		blowDirection:{ type: 'v3', value: new THREE.Vector3( 0, 0, 0 )},
		drop:         { type: 'i', value: drop},
		

	};
	var shaderMaterial_Particle = new THREE.ShaderMaterial( {

		uniforms: 		uniforms_Particle,
		attributes:     attributes_Particle,
		vertexShader:   document.getElementById( 'objectPointVertexshader' ).textContent,
		fragmentShader: document.getElementById( 'objectPointFragmentshader' ).textContent,
		
	});
	attributesObjectParticleArray[modelIndex] = attributes_Particle;
	uniformsObjectParticleArray[modelIndex] = uniforms_Particle;

	var bufferGeometry = originalGeometry.children[0].geometry;
	var customColor = [];
	var blow = [];
	var blowTime = [];
	var requireTimeToDrop = [];

	
	var lowest;
	
	for(var i = 0; i < bufferGeometry.attributes.position.length; i+=3){
		
		if(i === 0){
			lowest = bufferGeometry.attributes.position.array[1];
		}
		else{
			if(bufferGeometry.attributes.position.array[i+1] < lowest)
				lowest = bufferGeometry.attributes.position.array[i+1];	
		}	
		
		customColor[i] = 1.0;
		customColor[i+1] = 0.0;
		customColor[i+2] = 1.0;		
		
		blow[i/3] = 0.0;
		blowTime[i/3] = 0.0;
		
		requireTimeToDrop[i/3] = Math.sqrt((bufferGeometry.attributes.position.array[i+1] - lowest + 0.001)/ acceleration);	
	}
	uniforms_Particle.lowestY.value = lowest;
	
	bufferGeometry.addAttribute( 'customColor', new THREE.BufferAttribute( new Float32Array( customColor ), 3 ) );
	bufferGeometry.attributes.customColor.needsUpdate = true;
	
	
	bufferGeometry.addAttribute( 'blow', new THREE.BufferAttribute( new Float32Array( blow ), 1 ) );
	bufferGeometry.attributes.blow.needsUpdate = true;
	
	bufferGeometry.addAttribute( 'blowTime', new THREE.BufferAttribute( new Float32Array( blowTime ), 1 ) );
	bufferGeometry.attributes.blowTime.needsUpdate = true;
	
	bufferGeometry.addAttribute( 'requireTimeToDrop', new THREE.BufferAttribute( new Float32Array( requireTimeToDrop ), 1 ) );
	bufferGeometry.attributes.requireTimeToDrop.needsUpdate = true;
		
	/*if(modelIndex === 0)
		uniforms_Particle.lowestY.value = -0.975;//Budha 
	else if(modelIndex === 1)
		uniforms_Particle.lowestY.value = -0.355;
	else if(modelIndex === 2)
		uniforms_Particle.lowestY.value = 0.0;*/
		
	//uniforms_Particle_Buddha.color.value = new THREE.Vector3(0.0, 1.0, 0.0 );
	var mesh = new THREE.PointCloud( bufferGeometry, shaderMaterial_Particle );
	mesh.scale.x = mesh.scale.y = mesh.scale.z = scale;

	mesh.position.x = x;
	mesh.position.y = y;
	mesh.position.z = z;
	
	objectMeshArray[modelIndex] = mesh;
	radiusArray[modelIndex] = ringRadius;
	heightArray[modelIndex] = ringRisingHeight;
	ringRisingVelArray[modelIndex] = ringRisingVelocity;
	if(modelIndex === 0)//buddha
		objectMesh.add( mesh );

	/*}
	else if(modelIndex === 1){//digger
	
		radiusArray[modelIndex] = 100;
		heightArray[modelIndex] = 92;
		ringRisingVelArray[modelIndex] = 180;
	}
	else if(modelIndex === 2){//dollar
	
		radiusArray[modelIndex] = 30;
		heightArray[modelIndex] = 87;
		ringRisingVelArray[modelIndex] = 140;
	}*/
}

function createRingMesh(){
	var attributes_Particle_Ring = {
		customColor:		   { type: 'v3', value: []},
	};
	
	var uniforms_Particle_Ring = {
		offset:    { type: 'v3', value: new THREE.Vector3( 900, 0, 0 )},		
		time:      { type: "f", value: 1.0 },
		texture:   { type: "t", value: THREE.ImageUtils.loadTexture( "images/particleA.png" ) },
	};
	
	var shaderMaterial_Particle_Ring = new THREE.ShaderMaterial( {

		uniforms: 		uniforms_Particle_Ring,
		attributes:     attributes_Particle_Ring,
		vertexShader:   document.getElementById( 'ringPointVertexshader' ).textContent,
		fragmentShader: document.getElementById( 'ringPointFragmentshader' ).textContent,
		
		blending: 		THREE.AdditiveBlending,
		transparent:	true,
		depthWrite: 	false,
		depthTest: 		true,
	});

	var ringPt = [];
	var customColor = [];
	
	for(var i = 0; i < 36; i++){
		ringPt[i * 3] = 0;
		ringPt[i * 3 + 1] = 0;
		ringPt[i * 3 + 2] = 0;
		
		customColor[i * 3] = 0;
		customColor[i * 3 + 1] = 1 * i / 35; 
		customColor[i * 3 + 2] = 1 - i / 35;
	}
	var ringBufferGeometry = new THREE.BufferGeometry();
	ringBufferGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( ringPt ), 3 ) );
	ringBufferGeometry.addAttribute( 'customColor', new THREE.BufferAttribute( new Float32Array( customColor ), 3 ) );
	
	
	ringMesh = new THREE.PointCloud( ringBufferGeometry, shaderMaterial_Particle_Ring );
	ringMesh.position.y = -59;
	//objectMesh.add( ringMesh );
}



function blowParticle(){
	
	var blowTime = realTimePass; 
	
	uniformsObjectParticleArray[currentModelIndex].blowDirection.value = blowDir;
	
	for(var i = 0; i < objectMeshArray[currentModelIndex].geometry.attributes.blowTime.length; i++){
		objectMeshArray[currentModelIndex].geometry.attributes.blow.setX(i, 1.0);
		objectMeshArray[currentModelIndex].geometry.attributes.blowTime.setX(i, blowTime);

	}
	objectMeshArray[currentModelIndex].geometry.attributes.blow.needsUpdate = true;
	objectMeshArray[currentModelIndex].geometry.attributes.blowTime.needsUpdate = true;
	isBlow = true;
}

function transformObject(modelIndex){
	if(uniformsObjectParticleArray[0] === undefined || uniformsObjectParticleArray[1] === undefined|| uniformsObjectParticleArray[2] === undefined)
		return;

	if(timePass >= 2.0){
		timePass = 0.0;
		
		if(drop === 1){
			while( objectMesh.children.length > 0 ){
				var c = objectMesh.children[0];
				objectMesh.remove(c);
			}
			if(isBlow){
			
				for(var i = 0; i < objectMeshArray[currentModelIndex].geometry.attributes.blow.length; i++){
					objectMeshArray[currentModelIndex].geometry.attributes.blow.setX(i, 0.0);
				}
				objectMeshArray[currentModelIndex].geometry.attributes.blow.needsUpdate = true;

				isBlow = false;
			}
			objectMesh.add( ringMesh );
			objectMesh.add( objectMeshArray[modelIndex] );
			drop = 2;
			currentModelIndex = modelIndex;
		}
		else if(drop === 2){
			var c = objectMesh.children[0];
			objectMesh.remove(c);
			drop = 0;
		}
	}
	
	
	if(drop === 0){//nothing
		uniformsObjectParticleArray[modelIndex].drop.value = 0;
	}
	else if(drop === 1){//dropping
		timePass += 0.005;
		uniformsObjectParticleArray[currentModelIndex].drop.value = 1;
		uniformsObjectParticleArray[currentModelIndex].time.value = timePass;
		
	}
	else if(drop === 2){//rising
		timePass += 0.005;
		uniformsObjectParticleArray[modelIndex].drop.value = 2;
		uniformsObjectParticleArray[modelIndex].time.value = timePass;
		
		
		if(timePass < 1.0){
			var particleLength = ringMesh.geometry.attributes.position.length / 3;
			for(var i = 0; i < particleLength; i++){
				ringMesh.geometry.attributes.position.setXYZ(i, timePass * radiusArray[modelIndex] * Math.cos(2 * Math.PI / particleLength * i + timePass * Math.PI / 2),
																0,
																timePass * radiusArray[modelIndex] * Math.sin(2 * Math.PI / particleLength * i + timePass * Math.PI / 2));
			}
			ringMesh.geometry.attributes.position.needsUpdate = true;
		}
		else{
			var particleLength = ringMesh.geometry.attributes.position.length / 3;
			for(var i = 0; i < particleLength; i++){
				if((timePass - 1) * (timePass - 1) * ringRisingVelArray[modelIndex] < heightArray[modelIndex])
					ringMesh.geometry.attributes.position.setXYZ(i, radiusArray[modelIndex] * Math.cos(2 * Math.PI / particleLength * i + timePass * Math.PI / 2),
																	(timePass - 1) * (timePass - 1) * ringRisingVelArray[modelIndex],
																	radiusArray[modelIndex] * Math.sin(2 * Math.PI / particleLength * i + timePass * Math.PI / 2));
				else
					ringMesh.geometry.attributes.position.setXYZ(i, radiusArray[modelIndex] * Math.cos(2 * Math.PI / particleLength * i + timePass * Math.PI / 2),
																	heightArray[modelIndex],
																	radiusArray[modelIndex] * Math.sin(2 * Math.PI / particleLength * i + timePass * Math.PI / 2));
			}
			ringMesh.geometry.attributes.position.needsUpdate = true;
		}
	}
}

function animate() {	
	if(stats != undefined)
		stats.update();

	transformObject(changeModelIndex);
	
	var check = true;
	for(var i = 0; i <uniformsObjectParticleArray.length; ++i){
		if(uniformsObjectParticleArray[i] === undefined){
			check = false;
			break;
		}
	}
	if(check){
		realTimePass += 0.005;
		for(var i = 0; i <uniformsObjectParticleArray.length; ++i){
			uniformsObjectParticleArray[i].realTime.value = realTimePass;
		}		
	}
	
	
	if( rotateTargetX !== undefined && rotateTargetY !== undefined ){

		rotateVX += (rotateTargetX - rotateX) * 0.012;
		rotateVY += (rotateTargetY - rotateY) * 0.012;
	

		if( Math.abs(rotateTargetX - rotateX) < 0.1 && Math.abs(rotateTargetY - rotateY) < 0.1 ){
			rotateTargetX = undefined;
			rotateTargetY = undefined;
		}
	}
	
	rotateX += rotateVX;
	rotateY += rotateVY;

	//rotateY = wrap( rotateY, -Math.PI, Math.PI );

	rotateVX *= 0.98;
	rotateVY *= 0.98;

	if(dragging || rotateTargetX !== undefined ){
		rotateVX *= 0.6;
		rotateVY *= 0.6;
	}	     

	rotateY += controllers.spin * 0.01;

	//	constrain the pivot up/down to the poles
	//	force a bit of bounce back action when hitting the poles
	if(rotateX < -rotateXMax){
		rotateX = -rotateXMax;
		rotateVX *= -0.95;
	}
	if(rotateX > rotateXMax){
		rotateX = rotateXMax;
		rotateVX *= -0.95;
	}		    			    		   

	TWEEN.update();		

	globeMesh.rotation.x = rotateX;
	globeMesh.rotation.y = rotateY;	

	skyboxMesh.rotation.x = rotateX;
	skyboxMesh.rotation.y = rotateY;

	//console.log("x:" + globeMesh.rotation.x + "  y:"+globeMesh.rotation.y);
	//countryMesh.rotation.x = rotateX;
	countryMesh.rotation.y += 0.01;	
	//objectMesh.rotation.y += 0.01;	
	objectMesh.rotation.x = rotateX;
	objectMesh.rotation.y = rotateY;	
	blowDir = new THREE.Vector3(Math.sin(-rotateY), 0.0, Math.cos(-rotateY) );
	
    render();	
    		        		       
    requestAnimationFrame( animate );	

	globeMesh.traverse(
		function(child) {
			if (child.update !== undefined) {
				child.update();
			} 
		}
	);
}

function render() {	
	renderer.clear();		    					
    renderer.render( scene, camera );				
//    renderer.render( sceneCube, cameraCube );
}		   

function findCode(countryName){
	countryName = countryName.toUpperCase();
	for( var i in countryLookup ){
		if( countryLookup[i] === countryName )
			return i;
	}
	return 'not found';
}

//	ordered lookup list for country color index
//	used for GLSL to find which country needs to be highlighted
var countryColorMap = {'PE':1,
'BF':2,'FR':3,'LY':4,'BY':5,'PK':6,'ID':7,'YE':8,'MG':9,'BO':10,'CI':11,'DZ':12,'CH':13,'CM':14,'MK':15,'BW':16,'UA':17,
'KE':18,'TW':19,'JO':20,'MX':21,'AE':22,'BZ':23,'BR':24,'SL':25,'ML':26,'CD':27,'IT':28,'SO':29,'AF':30,'BD':31,'DO':32,'GW':33,
'GH':34,'AT':35,'SE':36,'TR':37,'UG':38,'MZ':39,'JP':40,'NZ':41,'CU':42,'VE':43,'PT':44,'CO':45,'MR':46,'AO':47,'DE':48,'SD':49,
'TH':50,'AU':51,'PG':52,'IQ':53,'HR':54,'GL':55,'NE':56,'DK':57,'LV':58,'RO':59,'ZM':60,'IR':61,'MM':62,'ET':63,'GT':64,'SR':65,
'EH':66,'CZ':67,'TD':68,'AL':69,'FI':70,'SY':71,'KG':72,'SB':73,'OM':74,'PA':75,'AR':76,'GB':77,'CR':78,'PY':79,'GN':80,'IE':81,
'NG':82,'TN':83,'PL':84,'NA':85,'ZA':86,'EG':87,'TZ':88,'GE':89,'SA':90,'VN':91,'RU':92,'HT':93,'BA':94,'IN':95,'CN':96,'CA':97,
'SV':98,'GY':99,'BE':100,'GQ':101,'LS':102,'BG':103,'BI':104,'DJ':105,'AZ':106,'MY':107,'PH':108,'UY':109,'CG':110,'RS':111,'ME':112,'EE':113,
'RW':114,'AM':115,'SN':116,'TG':117,'ES':118,'GA':119,'HU':120,'MW':121,'TJ':122,'KH':123,'KR':124,'HN':125,'IS':126,'NI':127,'CL':128,'MA':129,
'LR':130,'NL':131,'CF':132,'SK':133,'LT':134,'ZW':135,'LK':136,'IL':137,'LA':138,'KP':139,'GR':140,'TM':141,'EC':142,'BJ':143,'SI':144,'NO':145,
'MD':146,'LB':147,'NP':148,'ER':149,'US':150,'KZ':151,'AQ':152,'SZ':153,'UZ':154,'MN':155,'BT':156,'NC':157,'FJ':158,'KW':159,'TL':160,'BS':161,
'VU':162,'FK':163,'GM':164,'QA':165,'JM':166,'CY':167,'PR':168,'PS':169,'BN':170,'TT':171,'CV':172,'PF':173,'WS':174,'LU':175,'KM':176,'MU':177,
'FO':178,'ST':179,'AN':180,'DM':181,'TO':182,'KI':183,'FM':184,'BH':185,'AD':186,'MP':187,'PW':188,'SC':189,'AG':190,'BB':191,'TC':192,'VC':193,
'LC':194,'YT':195,'VI':196,'GD':197,'MT':198,'MV':199,'KY':200,'KN':201,'MS':202,'BL':203,'NU':204,'PM':205,'CK':206,'WF':207,'AS':208,'MH':209,
'AW':210,'LI':211,'VG':212,'SH':213,'JE':214,'AI':215,'MF_1_':216,'GG':217,'SM':218,'BM':219,'TV':220,'NR':221,'GI':222,'PN':223,'MC':224,'VA':225,
'IM':226,'GU':227,'SG':228};

function highlightCountry( countries ){	
	var countryCodes = [];
	for( var i in countries ){
		var code = findCode(countries[i]);
		countryCodes.push(code);
	}

	var ctx = lookupCanvas.getContext('2d');	
	ctx.clearRect(0,0,256,1);

	//	color index 0 is the ocean, leave it something neutral
	
	//	this fixes a bug where the fill for ocean was being applied during pick
	//	all non-countries were being pointed to 10 - bolivia
	//	the fact that it didn't select was because bolivia shows up as an invalid country due to country name mismatch
	//	...
	ctx.fillStyle = 'rgb(' + 0 + ',' + 0 + ',' + 0 +')';
	ctx.fillRect( 0, 0, 1, 1 );



	var selectedCountryCode = selectedCountry.countryCode;
	
	for( var i in countryCodes ){
		var countryCode = countryCodes[i];
		var colorIndex = countryColorMap[ countryCode ];

		var mapColor = countryData[countries[i]].mapColor;
		var fillCSS = '#333366';
		if( countryCode === selectedCountryCode )
			fillCSS = '#cc0033'

		ctx.fillStyle = fillCSS;
		ctx.fillRect( colorIndex, 0, 1, 1 );
	}
	
	lookupTexture.needsUpdate = true;
}

function getHistoricalData( country ){
	var history = [];	

	var countryName = country.countryName;

	var outboundCategories = selectionData.getOutboundCategories();
	var inboundCategories = selectionData.getInboundCategories();

	for( var i in timeBins ){
		var yearBin = timeBins[i].data;		
		//var value = {imports: 0, exports:0};
		var value = {inbound: 0, outbound: 0};
		for( var s in yearBin ){
			var set = yearBin[s];
			var categoryName = reverseStatisticLookup[set.wc];

			var exporterCountryName = set.e.toUpperCase();
			var importerCountryName = set.i.toUpperCase();			
			var relevantCategory = ( countryName == exporterCountryName && $.inArray(categoryName, outboundCategories ) >= 0 ) || 
								   ( countryName == importerCountryName && $.inArray(categoryName, inboundCategories ) >= 0 );				

			if( relevantCategory == false )
				continue;

			//	ignore all unidentified country data
			if( countryData[exporterCountryName] === undefined || countryData[importerCountryName] === undefined )
				continue;
			
			if( exporterCountryName == countryName )
				value.outbound += set.v;
			if( importerCountryName == countryName )
				value.inbound += set.v;
		}
		history.push(value);
	}

	return history;
}

function getPickColor(){
	var affectedCountries = undefined;
	if( visualizationMesh.children[0] !== undefined )
		affectedCountries = visualizationMesh.children[0].affectedCountries;

	highlightCountry([]);
	globeMesh.remove(visualizationMesh);
	mapUniforms['outlineLevel'].value = 0;
	
	shaderMaterial_Globe.transparent = false;
	shaderMaterial_Globe.depthWrite = true;
	lookupTexture.needsUpdate = true;

	renderer.autoClear = false;
	renderer.autoClearColor = false;
	renderer.autoClearDepth = false;
	renderer.autoClearStencil = false;	
	renderer.preserve

    renderer.clear();
    renderer.render(scene,camera);

    var gl = renderer.context;
    gl.preserveDrawingBuffer = true;

	var mx = ( mouseX + renderer.context.canvas.width/2 );
	var my = ( -mouseY + renderer.context.canvas.height/2 );
	mx = Math.floor( mx );
	my = Math.floor( my );

	var buf = new Uint8Array( 4 );		    	
	gl.readPixels( mx, my, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf );		

	renderer.autoClear = true;
	renderer.autoClearColor = true;
	renderer.autoClearDepth = true;
	renderer.autoClearStencil = true;

	gl.preserveDrawingBuffer = false;	

	mapUniforms['outlineLevel'].value = 1;
	shaderMaterial_Globe.transparent = true;
	shaderMaterial_Globe.depthWrite = false;
	globeMesh.add(visualizationMesh);


	if( affectedCountries !== undefined ){
		highlightCountry(affectedCountries);
	}
	return buf[0]; 	
}

function initStats() {
	stats = new Stats();
	stats.setMode(0); // 0: fps, 1: ms

	// Align top-left
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.left = '0px';
	stats.domElement.style.top = '0px';

	document.body.appendChild( stats.domElement );


	return stats;
}