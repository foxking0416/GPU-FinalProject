var vec3_origin = new THREE.Vector3(0,0,0);

function makeConnectionLineGeometry( exporter, importer, value, type ){
	if( exporter.countryName == undefined || importer.countryName == undefined )
		return undefined;


	//	start of the line
	var start = exporter.center;
	//	end of the line
	var end = importer.center;
	
	var distanceBetweenCountryCenter = end.clone().subSelf(start).length();		
	//var distanceBetweenCountryCenter = start.distanceTo(end);
	var distanceHalf = distanceBetweenCountryCenter * 0.5;
	
	//	midpoint for the curve
	var mid = start.clone().lerpSelf(end, 0.5);	
	//var mid = start.clone().lerp(end,0.5);	
	var midLength = mid.length()
	mid.normalize();
	mid.multiplyScalar( midLength + distanceBetweenCountryCenter * 0.7 );			

	//	the normal from start to end
	var normal = (new THREE.Vector3()).sub(end, start);
	normal.normalize();

	/*				     
				The curve looks like this:
				
				midStartAnchor---- mid ----- midEndAnchor
			  /											  \
			 /											   \
			/												\
	start/anchor 										 end/anchor

		splineCurveA							splineCurveB
	*/



	var startAnchor = start;
	var midStartAnchor = mid.clone().addSelf( normal.clone().multiplyScalar( -distanceHalf ) );					
	var midEndAnchor = mid.clone().addSelf( normal.clone().multiplyScalar( distanceHalf ) );
	//var midStartAnchor = mid.clone().add( normal.clone().multiplyScalar( -distanceHalf ) );					
	//var midEndAnchor = mid.clone().add( normal.clone().multiplyScalar( distanceHalf ) );
	
	var endAnchor = end;

	//	now make a bezier curve out of the above like so in the diagram
	var splineCurveA = new THREE.CubicBezierCurve3( start, startAnchor, midStartAnchor, mid);											
	var splineCurveB = new THREE.CubicBezierCurve3( mid, midEndAnchor, endAnchor, end);

	//	how many vertices do we want on this guy? this is for *each* side
	var vertexCountDesired = Math.floor( /*splineCurveA.getLength()*/ distanceBetweenCountryCenter * 0.02 + 6 ) * 2;	
	//var vertexCountDesired = 3;
	//	collect the vertices
	var points = splineCurveA.getPoints( vertexCountDesired );

	//	remove the very last point since it will be duplicated on the next half of the curve
	points = points.splice(0,points.length-1);
	points = points.concat( splineCurveB.getPoints( vertexCountDesired ) );


	var curveDir = (new THREE.Vector3()).sub(points[1], points[0]);
	var tangent = normal.clone().crossSelf(curveDir.clone());
	tangent.normalize();
	var spiralRadius = 2;
	var spiralPoints = [];
	var circularSeg = 6;
	

	
	
	//Create tube surface points
	/*var tubePoints = [];
	var lineGeometry = new THREE.Geometry();
	for(var i = 0; i < points.length; ++i){
		lineGeometry.vertices.push( new THREE.Vertex( points[i] ) );
	
	
		var eachCurveDir;
	
		if(i === points.length-1)
			eachCurveDir = (new THREE.Vector3()).sub(points[i], points[i-1]);
		else
			eachCurveDir = (new THREE.Vector3()).sub(points[i+1], points[i]);
		var segmentDis = eachCurveDir.length();
		eachCurveDir.normalize();
		var lat = eachCurveDir.clone().crossSelf(tangent.clone());
		
		
		for(var j = 0; j < circularSeg; ++j){
			var pTan = tangent.clone().multiplyScalar(spiralRadius * Math.cos(2 * Math.PI / circularSeg * j));
			var pLat = lat.clone().multiplyScalar(spiralRadius * Math.sin(2 * Math.PI / circularSeg * j));
			var p = points[i].clone().addSelf(pTan).clone().addSelf(pLat);
			tubePoints.push( p );
		}
	}*/
	
	//spiralPoints.push( vec3_origin );
	//points.push( vec3_origin );


	/*var splineOutline = THREE.Curve.Utils.createLineGeometry( spiralPoints );
	splineOutline.size = 10;
	return splineOutline;*/
	
	
	//	create a line geometry out of these
	var curveGeometry = THREE.Curve.Utils.createLineGeometry( points );
	curveGeometry.size = 25;
	return curveGeometry;

}

function constrain(v, min, max){
	if( v < min )
		v = min;
	else
	if( v > max )
		v = max;
	return v;
}