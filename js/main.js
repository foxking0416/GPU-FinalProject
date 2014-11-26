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
var visualizationMesh;							

var mapUniforms;
var shaderMaterial_Globe;


var timeBins;

//	contains latlon data for each country
var latlonData;			    

//	contains above but organized as a mapped list via ['countryname'] = countryobject
//	each country object has data like center of country in 3d space, lat lon, country name, and country code
var countryData = new Object();		

//	contains a list of country code to country name for running lookups
var countryLookup;		    

var selectableYears = [];
var selectableCountries = [];			    


//	a list of weapon 'codes'
//	now they are just strings of categories
//	Category Name : Category Code
var weaponLookup = {
	'Military Weapons' 		: 'mil',
	'Civilian Weapons'		: 'civ',
	'Ammunition'			: 'ammo',
};

//	a list of the reverse for easy lookup
var reverseStatisticLookup = new Object();
for( var i in weaponLookup ){
	var name = i;
	var code = weaponLookup[i];
	reverseStatisticLookup[code] = name;
}	    	

var exportColor = 0xffff33;
var importColor = 0x9900cc;

//	the currently selected country
var selectedCountry = null;
var previouslySelectedCountry = null;

//	contains info about what year, what countries, categories, etc that's being visualized
var selectionData;


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
	this.selectedYear = '2010';
	this.selectedCountry = 'UNITED STATES';


	this.exportCategories = new Object();
	this.importCategories = new Object();
	for( var i in weaponLookup ){
		this.exportCategories[i] = true;
		this.importCategories[i] = true;
	}				

	this.getExportCategories = function(){
		var list = [];
		for( var i in this.exportCategories ){
			if( this.exportCategories[i] )
				list.push(i);
		}
		return list;
	}		

	this.getImportCategories = function(){
		var list = [];
		for( var i in this.importCategories ){
			if( this.importCategories[i] )
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
	scene.matrixAutoUpdate = false;		
	        		       	

	globeMesh = new THREE.Object3D();
	scene.add(globeMesh);

	countryMesh = new THREE.Object3D();
	scene.add(countryMesh);
	
	var flagSphereMesh = new THREE.Object3D();
	scene.add(flagSphereMesh);
	
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
	

	var shaderMaterial_Country = new THREE.ShaderMaterial( {

		vertexShader:   document.getElementById( 'countryVertexShader' ).textContent,
		fragmentShader: document.getElementById( 'countryFragmentShader' ).textContent,
		
	});
	
	var uniforms_InsideObj = {
		
	};
	var shaderMaterial_InsideObj = new THREE.ShaderMaterial( {

		//uniforms: 		uniforms_Country,

		vertexShader:   document.getElementById( 'insideObjVertexShader' ).textContent,
		fragmentShader: document.getElementById( 'insideObjFragmentShader' ).textContent,	
	});
	
	var uniforms_Flag = {
		'flag': { type: 't', value: THREE.ImageUtils.loadTexture( "images/Flag.png" )  },
	};
	var shaderMaterial_Flag = new THREE.ShaderMaterial( {

		uniforms: 		uniforms_Flag,

		vertexShader:   document.getElementById( 'FlagVertexShader' ).textContent,
		fragmentShader: document.getElementById( 'FlagFragmentShader' ).textContent,

		blending: 		THREE.MultiplyBlending,//MultiplyBlending
		depthTest: 		true,
		depthWrite: 	false,
		transparent:	true,
	});


						
	var sphere = new THREE.Mesh( new THREE.SphereGeometry( 100, 40, 40 ), shaderMaterial_Globe );	//100 is radius, 40 is segments in width, 40 is segments in height
	sphere.doubleSided = true;
	sphere.rotation.x = Math.PI;				
	sphere.rotation.y = -Math.PI/2;
	sphere.rotation.z = Math.PI;
	sphere.id = "base";	
	globeMesh.add( sphere );	
	
	
	var country2dPoints = getCountry2DPoints();
	for(var i = 0; i < country2dPoints.length; ++i){
		country2dPoints[i] = new THREE.Vector2 (country2dPoints[i].x - 40, 30 - country2dPoints[i].y);
	}
	
	
	var countryShape = new THREE.Shape( country2dPoints );
	var country3d = new THREE.ExtrudeGeometry( countryShape, { amount: 20, bevelEnabled: false} );
	var americanPoints = countryShape.createPointsGeometry();
	var mesh = THREE.SceneUtils.createMultiMaterialObject( country3d, [ new THREE.MeshLambertMaterial( { color: 0xffff00 } ), new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true, transparent: true } ) ] );
	var extrudeGeo = new THREE.Mesh( country3d, shaderMaterial_Country );
	countryMesh.add( extrudeGeo );
	
	var boundCube = new THREE.Mesh( new THREE.CubeGeometry( 100, 100, 100 ), shaderMaterial_Flag );
	flagSphereMesh.add( boundCube );	
	
	
	
	var manager = new THREE.LoadingManager();
		manager.onProgress = function ( item, loaded, total ) {
		console.log( item, loaded, total );
	};
				
	// model
	var loader = new THREE.OBJLoader( manager );
	loader.load( 'model/ship.obj', function ( object ) {

		object.traverse( function ( child ) {

			if ( child instanceof THREE.Mesh ) {

				//child.material.map = texture;
			}
		} );

		object.position.x = - 60;
		object.rotation.x = 20* Math.PI / 180;
		object.rotation.z = 20* Math.PI / 180;
		object.scale.x = 10;
		object.scale.y = 10;
		object.scale.z = 10;
		obj = object
		globeMesh.add( obj );

	} );
	
	var ambient = new THREE.AmbientLight( 0x101030 );
	scene.add( ambient );
	
	var directionalLight = new THREE.DirectionalLight( 0xffeedd );
				directionalLight.position.set( 0, 0, 1 );
				scene.add( directionalLight );

	
	
	/*var geometry = new THREE.CylinderGeometry( 50, 50, 20, 32 );
	var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
	var cylinder = new THREE.Mesh( geometry, material );
	globeMesh.add( cylinder );*/

	
	/*var linesGeo = new THREE.Geometry();
	linesGeo.vertices.push(
		new THREE.Vector3( 0, 0, 0 ),
		new THREE.Vector3( 0, 100, 0 ),
		new THREE.Vector3( 100, 100, 0 ),
		new THREE.Vector3( 100, 0, 0 )
	);
	var splineOutline = new THREE.Line( linesGeo, new THREE.LineBasicMaterial( {color: 0xff1100, linewidth: 10}));
	
	var linesGeo2 = new THREE.Geometry();
	linesGeo2.vertices.push(
		new THREE.Vector3( -10, 0, 0 ),
		new THREE.Vector3( -10, 100, 0 ),
		new THREE.Vector3( -110, 100, 0 ),
		new THREE.Vector3( -110, 0, 0 )
	);
	var splineOutline2 = new THREE.Line( linesGeo2, new THREE.LineBasicMaterial( {color: 0xff1100, linewidth: 10}));
	
	var test = new THREE.Geometry();
	THREE.GeometryUtils.merge(test, linesGeo);
	THREE.GeometryUtils.merge(test, linesGeo2);
	var splineOutline3 = new THREE.Line( test, new THREE.LineBasicMaterial( {color: 0xff1100, linewidth: 10}), THREE.LinePieces);
	
	globeMesh.add( splineOutline3 );*/
	
	
	
	//var face = new THREE.Face3();
	
	var cube = new THREE.Mesh( new THREE.CubeGeometry( 50, 50, 50 ), shaderMaterial_InsideObj );
	//globeMesh.add( cube );	

	
	
	for( var i in timeBins ){					
		var bin = timeBins[i].data;
		for( var s in bin ){
			var set = bin[s];

			var exporterName = set.e.toUpperCase();
			var importerName = set.i.toUpperCase();

			//	let's track a list of actual countries listed in this data set
			//	this is actually really slow... consider re-doing this with a map
			if( $.inArray(exporterName, selectableCountries) < 0 )
				selectableCountries.push( exporterName );

			if( $.inArray(importerName, selectableCountries) < 0 )
				selectableCountries.push( importerName );
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
	//'BOLIVIA, PLURINATIONAL STATE OF'
	//'UNITED STATES'
	selectVisualization( timeBins, '2013', ['UNITED STATES'], ['Military Weapons','Civilian Weapons', 'Ammunition'], ['Military Weapons','Civilian Weapons', 'Ammunition'] );					



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
    camera = new THREE.PerspectiveCamera( 12, window.innerWidth / window.innerHeight, 1, 20000 ); 		        
	camera.position.z = 1400;
	camera.position.y = 0;
	//camera.lookAt(scene.width/2, scene.height/2);	
	//scene.add( camera );	  

	var windowResize = THREEx.WindowResize(renderer, camera)		
}
	

function animate() {	

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

	//countryMesh.rotation.x = rotateX;
	countryMesh.rotation.y += 0.01;	
	
    render();	
    		        		       
    requestAnimationFrame( animate );	


	/*THREE.SceneUtils.traverseHierarchy( globeMesh, 
		function(mesh) {
			if (mesh.update !== undefined) {
				mesh.update();
			} 
		}
	);	*/


}

function render() {	
	renderer.clear();		    					
    renderer.render( scene, camera );				
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

	var exportCategories = selectionData.getExportCategories();
	var importCategories = selectionData.getImportCategories();

	for( var i in timeBins ){
		var yearBin = timeBins[i].data;		
		var value = {imports: 0, exports:0};
		for( var s in yearBin ){
			var set = yearBin[s];
			var categoryName = reverseStatisticLookup[set.wc];

			var exporterCountryName = set.e.toUpperCase();
			var importerCountryName = set.i.toUpperCase();			
			var relevantCategory = ( countryName == exporterCountryName && $.inArray(categoryName, exportCategories ) >= 0 ) || 
								   ( countryName == importerCountryName && $.inArray(categoryName, importCategories ) >= 0 );				

			if( relevantCategory == false )
				continue;

			//	ignore all unidentified country data
			if( countryData[exporterCountryName] === undefined || countryData[importerCountryName] === undefined )
				continue;
			
			if( exporterCountryName == countryName )
				value.exports += set.v;
			if( importerCountryName == countryName )
				value.imports += set.v;
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