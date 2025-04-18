var map, drawnItems

function init() { 
  
  var center = [46.165164, 15.750443];

    // Create the map
    map = L.map('leaflet').setView(center, 15);
    var imageUrl = 'assets/images/Dubai Mall LEAK DETECTION SYSTEM LAYOUT.png',
    imageBounds = [[center[0] + 3, center[1] + 3], [center[0] - 3, center[1] - 3]]

    L.imageOverlay(imageUrl, imageBounds).addTo(map);


    drawnItems = L.featureGroup().addTo(map);
   
    map.addControl(new L.Control.Draw({
        edit: {
            featureGroup: drawnItems,
            poly: {
                allowIntersection: false
            }
        },
        draw: {
            polygon: {
                allowIntersection: false,
                showArea: true
            }
        }
    }));

    map.on('draw:created', function (event) {
        var layer = event.layer;
        drawnItems.addLayer(layer);
    });

}

init()

drawnItems.on('click', function(e){
  
  const line = turf.lineString(
    e.layer.toGeoJSON().geometry.coordinates
  );
 
  const current = [e.latlng.lng, e.latlng.lat];
  
  const currentpt = turf.point(current)
  
  var sliced = turf.lineSplit(line, currentpt)["features"][0]
  
  var len0 = turf.length(turf.toWgs84(line))
  var len1 = turf.length(turf.toWgs84(sliced))

  var offset = 1 * 1
  var endpoint = 900 * 1
  offset = Math.floor(offset + ((endpoint - offset) * len1) / len0)

  console.log(offset)
})
