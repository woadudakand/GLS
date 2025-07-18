var urlPath
var zzz

var view

var alerts = {}

var extent
var calibrationPoints = {};

var isSelectCalibration = false

//* Global Variable for Storing Draw Shape Type
var shapeType

//* Global Variable for Lucking Screen Movement
var lock = true

//* Global Variable for dash line state
var isDashLine

//* Global Variables for Actions
var actionOnMap
var modify

//* Global Variable for current selected item.
var selectedLayer = {}
var selectedFeature = {}

//* Zone Geo Json
var zoneGeoJson = {
  type: "FeatureCollection",
  features: [],
  image: "",
}

var imageName
var imageUrl
// cable
var alertList = {}

var addedCable = []

// image file name
var tempImageName = ""
// image files for copy
var tempImageInfo = {}
// image asset folder url
var imageAssetUrl = "assets/images/"

var map, vector

var container = document.getElementById("popup")
var source
var content = document.getElementById("popup-content")
var closer = document.getElementById("popup-closer")
var overlay = new ol.Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250,
  },
})

var tooltipContainer = document.getElementById("tooltip")
var tooltipContent = document.getElementById("tooltip-content")

var tooltip = new ol.Overlay({
  element: tooltipContainer,
  autoPan: true,
  autoPanAnimation: {
    duration: 500,
  },
})

closer.onclick = function () {
  overlay.setPosition(undefined)
  closer.blur()
  return false
}

//* Init For First Rendering
initShapeType()
init()

/********* upload external geojson file and display **********/
var imagePath = ""
//* Upload Image
document
  .querySelector('input[name="input_file"]')
  .addEventListener("change", function () {
    if (this.files && this.files[0]) {
      let fileName = this.files[0].name
      removeDivs()
      init(null, fileName, true)
    }
  })

//* Remove Extra Divs
function removeDivs() {
  $("div.ol-viewport").remove()
}

//* Set Draw Shape Type as "None"
function initShapeType() {
  setShapeType("None")
}

//* Set Current Selected Layer and Feature to empty Object
function initSelectedZone() {
  selectedLayer = {}
  selectedFeature = {}
}

//* Set Shape Type as type
function setShapeType(type) {
  shapeType = type
}

//* Get Current Shape Type
function getShapeType() {
  return shapeType
}

//* Set as DashLine
function setDashSize(size) {
  isDashLine = size
}

//* ******************** Lock or Unlock Screen ******************** *//
$(document).on("click", "#lock", null, function () {
  lock = !lock

  resetSideBar()
  $("#lock").parents("li:first").addClass("active")

  var dragPan
  map.getInteractions().forEach(function (interaction) {
    if (interaction instanceof ol.interaction.DragPan) {
      dragPan = interaction
    }
  }, this)
  zzz = dragPan
  map.removeInteraction(dragPan)
})

$(document).on("click", "#unlock", null, function () {
  resetSideBar()
  $("#unlock").parents("li:first").addClass("active")
  if (zzz) map.addInteraction(zzz)
})

//* ******************** Rotate ******************** *//
$(document).on("click", "#rotate-left", null, function () {
  view.animate({
    rotation: view.getRotation() - Math.PI / 2,
  })
  resetSideBar()
  $("#rotate-left").parents("li:first").addClass("active")
})

$(document).on("click", "#rotate-right", null, function () {
  view.animate({
    rotation: view.getRotation() + Math.PI / 2,
  })
  resetSideBar()
  $("#rotate-right").parents("li:first").addClass("active")
})

$(document).on("click", "#scaling", null, function () {
  resetSideBar()
  $("#scaling").parents("li:first").addClass("active")
  $("#scaleModel").modal()
})

function alertControl(start) {
  var alertValList = []
  var cableItemList = []
  let blink_color = undefined

  if (document.getElementById("txtblink").value) {
    cableItemList = document.getElementById("txtblink").value.split("$")
  } else {
    return
  }

  let blink_colorlist = $("#blinkColors").val().split(",")
  for (let i = 0; i < cableItemList.length; i++) {
    var alertList = cableItemList[i].split(",")
    for (let j = 0; j < alertList.length; j++) {
      if (j === 0) {
        if (alertList[0].split("/")[2] < 0) {
        } else {
          alertValList.push(alertList[0])
        }
      } else {
        var cableInfo = alertList[0].split("/")
        if (alertList[j] < 0) {
        } else {
          alertValList.push(`${cableInfo[0]}/${cableInfo[1]}/${alertList[j]}`)
        }
      }
    }
  }

  for (let i = 0; i < alertValList.length; i++) {
    var alert_val = alertValList[i]
    blink_colorlist.forEach((colorString) => {
      if (colorString.indexOf(alert_val) > -1) {
        blink_color = colorString.split("-")[3]
      }
    })
    if (!start && alerts[alert_val]) {
      deleteAlertPulse(alerts[alert_val])
      alerts[alert_val] = undefined
      return
    }

    var alert_split = alert_val.split("/")
    var sel_cable = alert_split[1]
    var sel_zone = alert_split[0]
    var alert_pos = alert_split[2] * 1
    var cableLength
    var zoneLength

    if (sel_cable.indexOf("Cable") > -1) {
      $("#cable_list option").each((index, element) => {
        if ($(element).val().split("/")[0] === sel_cable) {
          cableLength = $(element).val().split("/")[1]
        }
      })
    } else {
      continue
    }

    

    if (sel_zone.indexOf("Zone") > -1) {
      $("#zone_list option").each((index, element) => {
        if ($(element).val().split("/")[0] === sel_zone) {          
          zoneLength = $(element).val().split("/")
        }
      })
    } else {
      continue
    }
    
    if (cableLength < alert_pos && zoneLength < alert_pos) {
      alert("Alert position can't over total length of cable")
      continue
    }

    if (cableLength != undefined) {
      var selected_index = -1
      var pulseCoords
      let cableInfo
      zoneGeoJson.features.forEach((feature, featureIndex) => {
        if (feature.properties.id && feature.properties.id === sel_cable) {
          cableInfo = zoneGeoJson.features[featureIndex].properties.calibration
        }
      })

      if (!cableInfo) {
        continue
      }

      if (cableInfo.length) {
        for (let i = 0; i < cableInfo.length; i++) {
          const element = cableInfo[i]
          if (alert_pos > element.offset) {
            selected_index = i
          }
        }
      }
      if (selected_index > -1 && selected_index < cableInfo.length) {
        cableInfo[selected_index + 1] &&
          (pulseCoords = getBlinkCoords(
            sel_cable,
            cableInfo[selected_index],
            cableInfo[selected_index + 1],
            (alert_pos - cableInfo[selected_index]["offset"]) /
              (cableInfo[selected_index + 1]["offset"] -
                cableInfo[selected_index]["offset"])
          ))
  map.getView().setCenter(pulseCoords.geometry.coordinates, map.getView().getZoom());
      } else if (selected_index == -1) {
        pulseCoords = getBlinkCoords(
          sel_cable,
          null,
          cableInfo[0],
          alert_pos / cableInfo[0]["offset"]
        )
        map.getView().setCenter(pulseCoords.geometry.coordinates, map.getView().getZoom());
      } else if (selected_index == cableInfo.length) {
        pulseCoords = getBlinkCoords(
          sel_cable,
          cableInfo[cableInfo.length - 1],
          null,
          0.5
        )
      }
      if (alerts[alert_val]) {
        continue
      }

      if (pulseCoords) {
        var alert = showAlertPulse(
          pulseCoords["geometry"]["coordinates"][0],
          pulseCoords["geometry"]["coordinates"][1],
          blink_color
        )
        alerts[alert_val] = alert
      }
    } else {
      // return true
    }

    if (zoneLength != undefined) {
      var selected_index = -1
      var pulseCoords
      let zoneInfo
      zoneGeoJson.features.forEach((feature, featureIndex) => {
        
        if (feature.properties.id && feature.properties.id === sel_zone) {
          zoneInfo = zoneGeoJson.features[featureIndex].properties.calibration
        }
      })
      if (!zoneInfo) {
        continue
      }

      if (zoneInfo.length) {
        for (let i = 0; i < zoneInfo.length; i++) {
          const element = zoneInfo[i]
          if (alert_pos >= element.offset) {
            selected_index = i
          }
        }
      }
      if (selected_index > -1 && selected_index < zoneInfo.length) {
        zoneInfo[selected_index + 1] &&
          (pulseCoords = getBlinkCoords(
            sel_zone,
            zoneInfo[selected_index],
            zoneInfo[selected_index + 1],
            (alert_pos - zoneInfo[selected_index]["offset"]) /
              (zoneInfo[selected_index + 1]["offset"] -
                zoneInfo[selected_index]["offset"])
          ))
      } else if (selected_index == -1) {
        pulseCoords = getBlinkCoords(
          sel_zone,
          null,
          zoneInfo[0],
          alert_pos / zoneInfo[0]["offset"]
        )
      } else if (selected_index == zoneInfo.length) {
        pulseCoords = getBlinkCoords(
          sel_zone,
          zoneInfo[zoneInfo.length - 1],
          null,
          0.5
        )
      }
      if (alerts[alert_val]) {
        continue
      }

      if (pulseCoords) {
        var alert = showAlertPulse(
          pulseCoords["geometry"]["coordinates"][0],
          pulseCoords["geometry"]["coordinates"][1],
          blink_color
        )
        alerts[alert_val] = alert
      }
    }
    
  }
}

$(document).on("click", "#alertStart", null, function () {
  alertControl(true)
})

$(document).on("click", "#alertStop", null, function () {
  alertControl(false)
})

//* ******************** Create Cable ******************** *//
$(document).on("click", "#btn_add_cable", null, function () {
  // Data to draw on the map
  var $cableElem = $("#cable_list")

  var cableId = $cableElem.val().split("/")[0]
  var cableLength = $cableElem.val().split("/")[1]
  const offset = cableLength.split("-")[0] * 1
  const endpoint = cableLength.split("-")[1] * 1

  if (cableId === "Cable-0") {
    alert("Please select cable type!")
    return
  }

  if (Object.values(selectedFeature).length === 0) {
    alert("Select a valid line first.")
    return
  }

  if (selectedFeature.getGeometry().getType() !== "LineString" && selectedFeature.getGeometry().getType() !== "Circle") {
    alert("Sorry, Only LineStrings Or Circle can assign as section.")
    return
  } else if (selectedFeature.getGeometry().getType() === "Circle") {
    var coordinatesArray = selectedFeature.getGeometry().flatCoordinates;
    var coordinates = [[coordinatesArray[0], coordinatesArray[1]], [coordinatesArray[2], coordinatesArray[3]]]
  
    var radius = selectedFeature.getGeometry().getRadius();

    var calibration = [
      {
        offset,
        coordinates: coordinates[0],
        
      },
    ]
    calibration.push({
      offset: endpoint,
      coordinates: coordinates[coordinates.length - 1],
      
    })
  
    var currentCable = {
      type: "Feature",
      properties: {
        id: cableId,
        text: $("#cable_list option:selected").html(),
        calibration,
      },
      geometry: {
        type: "Circle",
        coordinates: coordinates,
        radius: radius,
      },
    }
    
    var isAdded = zoneGeoJson.features.find((item) => {    
      return item.properties.id === currentCable.properties.id
    });
  
    if (isAdded) {
      alert(`${currentCable.properties.text} Already Added`)
      return
    }
  
    // removeDrawingFromLayer(selectedFeature, getLayer(selectedFeature));  
    var isCalibration = selectedFeature.values_ && calibrationPoints[selectedFeature.values_.id] && calibrationPoints[selectedFeature.values_.id].length;
    if(isCalibration) {
      alert(`Calibration Exists! Please Remove the Calibration`)
      return
    } 
  
    if (Object.values(selectedFeature).length) {
      var selectedZone = selectedFeature.getProperties()
      var newFeatures = []
      var isSelected
      //* Remove deleted item from zoneGeoJson feature list
      if (Object.values(selectedZone).length !== 0) {
        if (selectedZone.features) {
          isSelected = zoneGeoJson.features.find(function (item) {
            return (
              item.properties.text ===
              selectedZone.features[0].getProperties().text
            )
          })
        } else {
          isSelected = zoneGeoJson.features.find(function (item) {
            return item.properties.text === selectedZone.text
          })
        }
  
        zoneGeoJson.features.map((feature, index) => {
          if (feature !== isSelected) {
            newFeatures.push(feature)
          }
        })
  
        zoneGeoJson.features = newFeatures
      }
  
       
      if (isSelected && isSelected.properties && selectedZone.text) {
      
        removeLayersFromMap(getSelectedLayer(isSelected.properties))
      } else {
        if (selectedFeature && selectedFeature.getProperties().layer) {
          removeDrawingFromLayer(selectedFeature, getLayer(selectedFeature))
        }
        removeDrawingFromLayer(selectedFeature, getLayer(selectedFeature))
      }
  
      initSelectedZone()
    } else {
      alert("Nothing to be deleted!")
    }
  
    zoneGeoJson.features.push(currentCable); 
    drawCircle(currentCable, radius);

    document.querySelectorAll(`#cable_list option`).forEach(option => {
      if(option.value.indexOf(removeId) === 0) {      
        option.classList.remove('active')
      }
      if(option.value.indexOf(cableId) === 0) {      
        option.classList.add('active');     
      }
    })
    
  } else {
    
    var coordinates = selectedFeature.getGeometry().getCoordinates()
    
    var calibration = [
      {
        offset,
        coordinates: coordinates[0],
      },
    ]
    calibration.push({
      offset: endpoint,
      coordinates: coordinates[coordinates.length - 1],
    })

  var currentCable = {
    type: "Feature",
    properties: {
      id: cableId,
      text: $("#cable_list option:selected").html(),
      calibration,
    },
    geometry: {
      type: "LineString",
      coordinates,
    },
  }

    var isAdded = zoneGeoJson.features.find((item) => {    
      return item.properties.id === currentCable.properties.id
    });

    if (isAdded) {
      alert(`${currentCable.properties.text} Already Added`)
      return
    }

    // removeDrawingFromLayer(selectedFeature, getLayer(selectedFeature));  
    var isCalibration = selectedFeature.values_ && calibrationPoints[selectedFeature.values_.id] && calibrationPoints[selectedFeature.values_.id].length;
    if(isCalibration) {
      alert(`Calibration Exists! Please Remove the Calibration`)
      return
    } 

    if (Object.values(selectedFeature).length) {
      var selectedZone = selectedFeature.getProperties()
      var newFeatures = []
      var isSelected
      //* Remove deleted item from zoneGeoJson feature list
      if (Object.values(selectedZone).length !== 0) {
        if (selectedZone.features) {
          isSelected = zoneGeoJson.features.find(function (item) {
            return (
              item.properties.text ===
              selectedZone.features[0].getProperties().text
            )
          })
        } else {
          isSelected = zoneGeoJson.features.find(function (item) {
            return item.properties.text === selectedZone.text
          })
        }

        zoneGeoJson.features.map((feature, index) => {
          if (feature !== isSelected) {
            newFeatures.push(feature)
          }
        })

        zoneGeoJson.features = newFeatures
      }

      if (isSelected && isSelected.properties && selectedZone.text) {
        
        removeLayersFromMap(getSelectedLayer(isSelected.properties))
      } else {
        if (selectedFeature && selectedFeature.getProperties().layer) {
          removeDrawingFromLayer(selectedFeature, getLayer(selectedFeature))
        }
        removeDrawingFromLayer(selectedFeature, getLayer(selectedFeature))
      }

      initSelectedZone()
    } else {
      alert("Nothing to be deleted!")
    }

    zoneGeoJson.features.push(currentCable);  
    drawCable(currentCable);
    
    document.querySelectorAll(`#cable_list option`).forEach(option => {
      if(option.value.indexOf(removeId) === 0) {      
        option.classList.remove('active')
      }
      if(option.value.indexOf(cableId) === 0) {      
        option.classList.add('active');     
      }
    })
  }
})

//* ******************** Create Menu Scaling Handler ******************** *//
$(document).on("click", "#displayScaling", null, function () {
  var $dist = $("#distUnit")
  var $distance = $("#distance").val()
  var text = $distance + " " + $("#distUnit option:selected").html()

  if (!$distance) {
    alert("DISTANCE value is empty!")
    return false
  }

  var selectedUnit = {
    type: "Feature",
    properties: {
      id: $distance,
      text: text,
    },
    geometry: {
      type: "LineString",
      coordinates: [
        [500, 900],
        [1300, 900],
      ],
    },
  }

  zoneGeoJson.features.push(selectedUnit)
  drawScaling(selectedUnit)

  $("#distance").val("")
})

//* ******************** Create Menu Click Handler ******************** *//
$(document).on("click", "#rectangle-click", null, function () {
  setDashSize(0)
  setShapeType("Box")
  addDrawAction()
  resetSideBar()
  $("#rectangle-click").parents("li:first").addClass("active")
})

$(document).on("click", "#square-click", null, function () {
  setDashSize(0)
  setShapeType("Square")
  addDrawAction()
  resetSideBar()
  $("#square-click").parents("li:first").addClass("active")
})

$(document).on("click", "#star-click", null, function () {
  setDashSize(0)
  setShapeType("Star")
  addDrawAction()
  resetSideBar()
  $("#star-click").parents("li:first").addClass("active")
})

$(document).on("click", "#line-click", null, function () {
  setDashSize(0)
  setShapeType("LineString")
  addDrawAction()
  resetSideBar()
  $("#line-click").parents("li:first").addClass("active")
})

$(document).on("click", "#dotted-click", null, function () {
  setDashSize(4)
  setShapeType("LineString")
  addDrawAction()
  resetSideBar()
  $("#dotted-click").parents("li:first").addClass("active")
})

$(document).on("click", "#polygon-click", null, function () {
  setDashSize(0)
  setShapeType("Polygon")
  addDrawAction()
  resetSideBar()
  $("#polygon-click").parents("li:first").addClass("active")
})

$(document).on("click", "#circle-click", null, function () {
  setDashSize(0)
  setShapeType("Circle")
  addDrawAction()
  resetSideBar()
  $("#circle-click").parents("li:first").addClass("active")
})

$(document).on("click", "#calibration-click", null, function () {
  addSelectAction()
  resetSideBar()
  isSelectCalibration = true
  $("#calibration-click").parents("li:first").addClass("active")
})

$(document).on("click", "#none-click", null, function () {
  addSelectAction()
  resetSideBar()
  $("#none-click").parents("li:first").addClass("active")
})

//* ******************** Create for Delete and Move Event ******************** *//
$(document).on("click", "#translateFeature", null, function () {
  addTransformAction()
  resetSideBar()
  $("#translateFeature").parents("li:first").addClass("active")
})

$(document).on("click", "#btnDelete", null, function () {
  addTransformAction()
  $("ul.components li").removeClass("active")
  $("#translateFeature").parents("li:first").addClass("active")

  if (Object.values(selectedFeature).length) {
    var selectedZone = selectedFeature.getProperties()
    var newFeatures = []
    var isSelected
    //* Remove deleted item from zoneGeoJson feature list
    if (Object.values(selectedZone).length !== 0) {
      if (selectedZone.features) {
        isSelected = zoneGeoJson.features.find(function (item) {
          return (
            item.properties.text ===
            selectedZone.features[0].getProperties().text
          )
        })
      } else {
        isSelected = zoneGeoJson.features.find(function (item) {
          return item.properties.text === selectedZone.text
        })
      }

      zoneGeoJson.features.map((feature, index) => {
        if (feature !== isSelected) {
          newFeatures.push(feature)
        }
      })

      zoneGeoJson.features = newFeatures
    }

    if (isSelected && isSelected.properties && selectedZone.text) {
      removeLayersFromMap(getSelectedLayer(isSelected.properties))
    } else {
      if (selectedFeature && selectedFeature.getProperties().layer) {
        removeDrawingFromLayer(selectedFeature, getLayer(selectedFeature))
      }
      removeDrawingFromLayer(selectedFeature, getDrawingLayer().getSource())
    }

    initSelectedZone()
  }
})

function getLayer(selectedFeature) {
  var layer_
  var sameFeature = (comparer, comparee) => {
    return comparer === comparee ? true : false
  }
  map.getLayers().forEach(function (layer) {
    var source = layer.getSource()
    if (source instanceof ol.source.Vector) {
      var features = source.getFeatures()
      if (features.length > 0) {
        features.forEach((feature) => {
          if (sameFeature(feature, selectedFeature)) {
            layer_ = layer
          }
        })
      }
    }
  })

  return layer_ ? layer_.getSource() : null
}

/*****select polygon***/
$("#colorPicker").change(function () {
  let userColor = $(this).val()

  $("#none-click").trigger("click")

  var fill = new ol.interaction.FillAttribute(
    {},
    {
      color: userColor,
    }
  )
  map.addInteraction(fill)
})

function getDrawingLayer() {
  var drawingLayer
  map.getLayers().forEach(function (layer) {
    if (layer.getClassName() === "draw-layer") {
      drawingLayer = layer
    }
  })

  return drawingLayer
}

function getSelectedLayer(selectedZone) {
  var selectedLayer = []

  if (map.getLayers().getLength() > 2) {
    for (let i = 2; i < map.getLayers().getLength(); i++) {
      var layer = map.getLayers().getArray()[i]
      var features = layer.getSource().getFeatures()

      for (var feature of features) {
        if (
          feature.getProperties().text &&
          feature.getProperties().text === selectedZone.text
        ) {
          selectedLayer.push(layer)
        }
      }
    }
  }

  return selectedLayer
}

function removeDrawingFromLayer(feature, layer) {
  if (layer) {
    layer.removeFeature(feature)
  }
}

function removeLayersFromMap(layers) {
  layers.forEach((layer) => {
    map.removeLayer(layer)
  })
}

const blinkAnimation = (width) => {
  return new ol.style.Style({
    
    fill: new ol.style.Fill({
      color: hexToRGB('#FF0000', 1),
      // color: '#000000'
    }),    
    stroke: new ol.style.Stroke({
      // color: hexToRGB(zone.properties.color, 0),
      color: hexToRGB('#FF0000', 0.3),
      width: width,
    }),          
  })
 
}


function drawZone(zone) {
  initSelectedZone();

  var geojsonObject = {}
  var zones = document.getElementById('zoneblink').value.split('$');
  
  

  if (zone.type.toLowerCase() === "feature") {
    geojsonObject = {
      type: "FeatureCollection",
      features: [zone],
    }
  }
  if (zone.type.toLowerCase() === "featurecollection") {
    geojsonObject = zone
  }

  var features = new ol.format.GeoJSON().readFeatures(geojsonObject)

  
  // New vector layer
  

  var vector = (color) => {
    return new ol.layer.Vector({
      source: new ol.source.Vector({
        features,
        wrapX: false,
      }),
      style: function (feature) {     
         return [
          
          new ol.style.Style({
            image: new ol.style.RegularShape({
              fill: new ol.style.Fill({
                color: hexToRGB(zone.properties.color, 0.1),
              }),
              stroke: new ol.style.Stroke({
                color: "#109eff",
                width: 2,
              }),
              radius: 10,
              points: 3,
              angle: feature.get("angle") || 0,
            }),
            fill: new ol.style.Fill({
              color: hexToRGB(zone.properties.color, 0.1)              
            }),
            stroke: new ol.style.Stroke({
              color: hexToRGB(color, 1),              
              width: 10,
            }),
            text: new ol.style.Text({
              text: feature.get("text"),
              scale: 1.3,
              offsetY: 15,
              fill: new ol.style.Fill({
                color: "green",
              }),
              stroke: new ol.style.Stroke({
                color: "#FFFF99",
                width: 3,
              }),
            }),
          }),        
        ]
      },
      title: "zoneLayer",
    })
  }

  if(zones.includes(zone.properties.id)){
    var count = 0;

  setInterval(() => {
    count++;
    if(count % 2 === 0) {
      removeLayersFromMap(getSelectedLayer(zone.properties))      
      map.addLayer(vector('#FF0000'));
    } else {      
      removeLayersFromMap(getSelectedLayer(zone.properties))      
      map.addLayer(vector('#0000FF'));
    }
    
  }, 500)
  } else {
    map.addLayer(vector('#FF0000'));
  }
  
  
}

function drawCable(currentCable) {
  initSelectedZone()
  var coordinates = currentCable.geometry.coordinates

  var lineStringFeatures = new ol.Collection()
  lineStringFeatures.push(
    new ol.Feature({
      geometry: new ol.geom.LineString(coordinates),
      text: currentCable.properties.text,
      id: currentCable.properties.id,
    })
  )

  var lineStringVector = new ol.layer.Vector({
    name: "section-layer",
    source: new ol.source.Vector({
      features: lineStringFeatures,
    }),
    title: currentCable.properties.id,
    style: function (f) {
      var opt = {
        tension: Number($("#tension").val()),
        pointsPerSeg: 2,
        normalize: $("#normalize").prop("checked"),
      }
      var csp = f.getGeometry().cspline(opt)
      return [
        new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: "#557ef8",
            width: 6,
          }),
          geometry: $("#cspline").prop("#557ef8") ? csp : null,
          text: new ol.style.Text({
            text: currentCable.properties.text,
            overflow: true,
            offsetY: 15,
            scale: 1.3,
            fill: new ol.style.Fill({
              color: "green",
            }),
            stroke: new ol.style.Stroke({
              color: "#FFFF99",
              width: 3,
            }),
          }),
        }),
      ]
    },
  })

  map.addLayer(lineStringVector)

  var points = currentCable.properties.calibration
  var pointsCoordinates = []
  var calibrationCoordinates = []
  points &&
    points.map((point, index) => {
      if (index == 0 && index === points.length - 1) {
        pointsCoordinates.push(point.coordinates)
      } else {
        calibrationCoordinates.push({
          coordinates: point.coordinates,
          value: point.offset,
        })
      }
    })

  calibrationCoordinates.map((calibration) => {
    const calibrationPoint = new ol.Feature({
      geometry: new ol.geom.Point(calibration.coordinates),
      text: "calibration",
      layer: currentCable.properties.text,
      value: calibration.value,
    })
    calibrationPoint.setStyle(
      new ol.style.Style({
        image: new ol.style.Circle({
          stroke: new ol.style.Stroke({
            color: "#f26552",
            width: 5,
          }),
          radius: 4,
        }),
      })
    )

    lineStringVector.getSource().addFeatures([calibrationPoint])
  })

  var multiPointFeatures = new ol.Collection()
  multiPointFeatures.push(
    new ol.Feature({
      geometry: new ol.geom.MultiPoint(pointsCoordinates),
      text: currentCable.properties.text,
      id: currentCable.properties.id,
    })
  )

  var multiPointVector = new ol.layer.Vector({
    name: "section-layer",
    source: new ol.source.Vector({
      features: multiPointFeatures,
    }),
    title: currentCable.properties.id,
    style: function (f) {
      return [
        new ol.style.Style({
          image: new ol.style.Circle({
            stroke: new ol.style.Stroke({
              color: "#557ef8",
              width: 5,
            }),
            radius: 3,
          }),
        }),
      ]
    },
  })

  map.addLayer(multiPointVector)

  var totalFeatures = new ol.Collection()
  lineStringFeatures.forEach((feature) => {
    totalFeatures.push(feature)
  })
  multiPointFeatures.forEach((feature) => {
    totalFeatures.push(feature)
  })

  addModifyAction(totalFeatures)
}

function drawCircle(currentCable, radius) {
  initSelectedZone()
  var coordinates = currentCable.geometry.coordinates
  
  var lineStringFeatures = new ol.Collection()
  lineStringFeatures.push(
    new ol.Feature({
      geometry: new ol.geom.Circle(coordinates[0], radius),
      text: currentCable.properties.text,
      id: currentCable.properties.id,
    })
  )

  var lineStringVector = new ol.layer.Vector({
    name: "section-layer",
    source: new ol.source.Vector({
      features: lineStringFeatures,
    }),
    title: currentCable.properties.id,
    style: function (f) {
      var opt = {
        tension: Number($("#tension").val()),
        pointsPerSeg: 2,
        normalize: $("#normalize").prop("checked"),
      }
      var csp = f.getGeometry().cspline(opt)
      
      return [
        new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: "#557ef8",
            width: 16,
          }),
          geometry: $("#cspline").prop("#557ef8") ? csp : null,
          text: new ol.style.Text({
            text: currentCable.properties.text,
            overflow: true,
            offsetY: 15,
            scale: 1.3,
            fill: new ol.style.Fill({
              color: "green",
            }),
            stroke: new ol.style.Stroke({
              color: "#FFFF99",
              width: 3,
            }),
          }),
        }),
      ]
    },
  })

  map.addLayer(lineStringVector)

}

function addModifyAction(features) {
  modify = new ol.interaction.Modify({
    features,
    pixelTolerance: 1,
    deleteCondition: (evt) => {
      return false
    },
    insertVertexCondition: (event) => {
      if (isSelectCalibration) {
        const coordinates = map.getEventPixel(event.originalEvent)
        const realCoordinate = event.coordinate
        const layerTitle = map.forEachFeatureAtPixel(
          coordinates,
          (feature, layer) => {
            if (
              layer &&
              layer.get("title") &&
              layer.get("title").indexOf("Cable") > -1
            ) {
              return layer.get("title")
            }
          }
        )
        const layers = event.target.getLayers().getArray()
        layers.forEach((layer) => {
          if (
            layer.getProperties().name === "section-layer" &&
            layer.getSource().getFeatures()[0].getGeometry().getType() ===
              "MultiPoint" &&
            layer.get("title") &&
            layer.get("title") === layerTitle
          ) {
            const layerSource = layer.getSource()

            const calibrationPoint = new ol.Feature({
              geometry: new ol.geom.Point(realCoordinate),
              text: "calibration",
              layer: layerTitle,
            })
            calibrationPoint.setStyle(
              new ol.style.Style({
                image: new ol.style.Circle({
                  stroke: new ol.style.Stroke({
                    color: "#f26552",
                    width: 10,
                  }),
                  radius: 8,
                }),
              })
            )
            layerSource.addFeatures([calibrationPoint])
          }
        })

        return false
      }
    },
  })

  modify.on("modifyend", (event) => {
    event.stopPropagation()

    var featureText = features.getArray()[1].getProperties().id
    zoneGeoJson.features.map((feature, featureIndex) => {
      if (feature.properties.id === featureText) {
        features
          .getArray()[1]
          .getGeometry()
          .getCoordinates()
          .forEach((item, index) => {
            return (zoneGeoJson.features[featureIndex].properties.calibration[
              index
            ].coordinates = item)
          })
      }
    })
  })
  modify.on()
  map.addInteraction(modify)
}

function drawScaling(selectedUnit) {
  initSelectedZone()
  let coordinates = selectedUnit.geometry.coordinates
  // Data to draw on the map
  var features = new ol.Collection()
  features.push(
    new ol.Feature({
      geometry: new ol.geom.LineString(coordinates),
      text: selectedUnit.properties.text,
      id: selectedUnit.properties.id,
    })
  )

  var vector = new ol.layer.Vector({
    name: "addDottedLinesLayers",
    source: new ol.source.Vector({
      features: features,
    }),
    style: function (f) {
      return [
        new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: "green",
            width: 3,
          }),
          text: new ol.style.Text({
            text: selectedUnit.properties.text,
            offsetY: -10,
            scale: 1.5,
            fill: new ol.style.Fill({
              color: "green",
            }),
            stroke: new ol.style.Stroke({
              color: "green",
              width: 0.5,
            }),
          }),
        }),
      ]
    },
  })
  map.addLayer(vector)

  var mod = new ol.interaction.Modify({
    features: features,
    deleteCondition: (evt) => {
      return false
    },
    insertVertexCondition: (e) => {
      return false
    },
  })
  map.addInteraction(mod)
}

function generateFeaturesInGeoJson(zoneGeoJson) {
  let featureList = zoneGeoJson.features

  featureList.forEach((feature) => {
    let featureLevel = feature.type
    let type = feature.geometry.type;

    if (featureLevel === "Feature") {
      if (feature.properties.id.indexOf("Zone") !== -1) {
        drawZone(feature)
      } else if (
        feature.properties.text.indexOf("Feet") !== -1 ||
        feature.properties.text.indexOf("Meter") !== -1
      ) {
        drawScaling(feature)
      }else if(type === "Circle") {
        drawCircle(feature, feature.geometry.coordinates[1]);
      } else {
        drawCable(feature);
      }
    } else if (featureLevel === "Drawing") {
    } else {
      alert("File is broken! Please upload right geojson file!")
    }
  })
}

function getDrawingFeatureList(drawingList) {
  let featureList = []
  drawingList.forEach((drawing) => {
    let feature

    switch (drawing.geometry.type) {
      case "Polygon":
        feature = new ol.Feature({
          geometry: new ol.geom.Polygon(drawing.geometry.coordinates),
        })
        featureList.push(feature)
        break
      case "Circle":
        const [center, radius] = drawing.geometry.coordinates
        feature = new ol.Feature({
          geometry: new ol.geom.Circle(center, radius),
        })
        featureList.push(feature)
        break
      case "LineString":
        feature = new ol.Feature({
          geometry: new ol.geom.LineString(drawing.geometry.coordinates),
        })
        featureList.push(feature)
        break
      default:
        break
    }
  })

  return featureList
}

function addDrawAction() {
  var shape = getShapeType()

  if (shape === "None") {
    return
  }

  actionOnMap = changeActionAs("Draw", shape)
  setActionOnMap(actionOnMap)
}

function getLineStringForCable(sourceFeature) {
  const sourceCableText = sourceFeature.getProperties().text
  map.getLayers().forEach((layer) => {
    if (layer.getSource() instanceof ol.source.Vector) {
      let features = source.getFeatures()
      if (features.length) {
        features.forEach((feature) => {
          if (
            feature &&
            feature !== sourceFeature &&
            feature.getProperties().text === sourceCableText &&
            feature.getGeometry().getType() === "LineString"
          ) {
            return feature
          }
        })
      }
    }
  })

  return null
}

function syncWith(event) {
  const eventType = event.type
  const delta = event.delta
  const sourceFeature = event.feature
  const geometry = sourceFeature.getGeometry()
  const geoType = geometry.getType()
  const coordinates = sourceFeature.getGeometry().getCoordinates()
  const featureText = sourceFeature.getProperties().id

  if (eventType === "translating" && coordinates && geoType === "LineString") {
    if (map.getLayers().getLength() > 2) {
      for (let i = 2; i < map.getLayers().getLength(); i++) {
        const layer = map.getLayers().getArray()[i]
        const features = layer.getSource().getFeatures()

        for (const feature of features) {
          if (
            feature.getProperties().id &&
            feature.getProperties().id === featureText &&
            sourceFeature !== feature
          ) {
            const oldPoints = feature.getGeometry().getCoordinates()

            let newPoints = []
            oldPoints.forEach((point) => {
              newPoints.push([point[0] + delta[0], point[1] + delta[1]])
            })

            feature.getGeometry().setCoordinates(newPoints)

            zoneGeoJson.features.map((zoneFeature, featureIndex) => {
              if (zoneFeature.properties.id === featureText) {
                newPoints.forEach((item, index) => {
                  return (zoneGeoJson.features[
                    featureIndex
                  ].properties.calibration[index].coordinates =
                    newPoints[index])
                })
              }
            })
          }
        }
      }
    }
  }
}

function addTransformAction() {
  actionOnMap = changeActionAs("Transform")
  actionOnMap.on("select", (event) => {
    let property

    if (!event.feature) {
      return
    }

    if (event.feature.getProperties().features) {
      property = event.feature.getProperties().features[0].getProperties()
    } else {
      property = event.feature.getProperties()
    }

    if (property.text && property.text.indexOf("Cable") > -1) {
      addTransformNonScaleAction()
    }
  })

  setActionOnMap(actionOnMap)
}

function addTransformNonScaleAction() {
  actionOnMap = changeActionAs("Transform-nonScale")
  actionOnMap.on("select", (event) => {
    let property

    if (!event.feature) {
      return
    }

    if (event.feature && event.feature.getProperties().features) {
      property = event.feature.getProperties().features[0].getProperties()
    } else {
      property = event.feature.getProperties()
    }

    if (property.text && property.text.indexOf("Zone") > -1) {
      addTransformAction()
    }
  })
  actionOnMap.on("translateend", (event) => {
    syncWith(event)
  })
  actionOnMap.on("rotating", (event) => {
    syncWith(event)
  })
  actionOnMap.on("translating", (event) => {
    syncWith(event)
  })
  actionOnMap.on("scaling", (event) => {
    syncWith(event)
  })

  setActionOnMap(actionOnMap)
}

function onCalibrationSave() {
  const offset = $("#calibrationInfo").val()
  let maxValue

  if (!offset) {
    return
  }

  zoneGeoJson.features.forEach((feature, featureIndex) => {
    if (feature.properties.id === selectedFeature.getProperties().layer) {
      const calibrationArray =
        zoneGeoJson.features[featureIndex].properties.calibration
      maxValue = calibrationArray[calibrationArray.length - 1]
    }
  })

  if (offset >= maxValue.offset) {
    alert("Calibration value can't have value over endpoint")
    return
  }

  zoneGeoJson.features.forEach((feature, featureIndex) => {
    if (feature.properties.id === selectedFeature.getProperties().layer) {
      zoneGeoJson.features[featureIndex].properties.calibration.push({
        offset: parseInt(offset),
        coordinates: selectedFeature.getGeometry().getCoordinates(),
      })
      zoneGeoJson.features[featureIndex].properties.calibration.sort(
        (a, b) => a.offset - b.offset
      )
    }
  })

  const oldProperties = selectedFeature.getProperties()
  selectedFeature.setProperties({
    ...oldProperties,
    value: offset,
  })

  overlay.setPosition(undefined)
}

function onCalibrationDelete() {
  const offset = $("#calibrationInfo").val() * 1
  let newCalibration = []
  zoneGeoJson.features.forEach((feature, featureIndex) => {
    if (feature.properties.id === selectedFeature.getProperties().layer) {
      zoneGeoJson.features[featureIndex].properties.calibration.forEach(
        (item, index) => {
          if (item.offset !== offset) {
            newCalibration.push(item)
          }
        }
      )
      zoneGeoJson.features[featureIndex].properties.calibration = newCalibration
      zoneGeoJson.features[featureIndex].properties.calibration.sort(
        (a, b) => a.offset - b.offset
      )
    }
  })

  overlay.setPosition(undefined)
  $("#btnDelete").trigger("click")
}

function showCalibrationTooltip(feature) {
  map.addOverlay(overlay)
  if (selectedFeature) {
    if (selectedFeature.getProperties().value) {
      $("#calibrationInfo").val(selectedFeature.getProperties().value)
    } else {
      $("#calibrationInfo").val("")
    }
  }
  overlay.setPosition(feature.getGeometry().getCoordinates())
}

function addSelectAction() {
  actionOnMap = changeActionAs("Select")
  actionOnMap.on("select", function (event) {
    event.selected.forEach((each) => {
      selectedFeature = each
      if (each.getProperties().text === "calibration") {
        showCalibrationTooltip(each)
        return
      }
      each.setStyle(
        new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: "#f26552",
            width: 3,
          }),
          text: new ol.style.Text({
            text: each.getProperties().text,
            offsetY: 15,
            scale: 1.3,
            fill: new ol.style.Fill({
              color: "#f26552",
            }),
            stroke: new ol.style.Stroke({
              color: "#f26552",
            }),
          }),
          fill: new ol.style.Fill({
            color: "#f2655250",
          }),
          image: new ol.style.Circle({
            stroke: new ol.style.Stroke({
              color: "#f26552",
              width: 6,
            }),
            radius: 3,
          }),
        })
      )
    })

    return
  })
  actionOnMap.on("deselect", function (event) {
    event.deselected.forEach((each) => {
      if (selectedFeature.getGeometry().text === "calibration") {
        each.setStyle(
          new ol.style.Style({
            image: new ol.style.Circle({
              stroke: new ol.style.Stroke({
                color: "#f26552",
                width: 6,
              }),
              radius: 3,
            }),
          })
        ) // more likely you want to restore the original style
      }
      each.setStyle(null) // more likely you want to restore the original style
    })
  })

  setActionOnMap(actionOnMap)
}

function changeActionAs(actionType, shape = "None") {
  map.removeInteraction(actionOnMap)
  if (actionOnMap) {
    actionOnMap = undefined
  }

  if (actionType !== "Draw") {
    initShapeType()
  }

  var newAction
  switch (actionType) {
    case "Select":
      newAction = new ol.interaction.Select({
        filter: function (layer) {
          return !isSelectCalibration
        },
      })
      break
    case "Draw":
      newAction = new ol.interaction.Draw({
        source: source,
        type: getGeometryFunction(shape)[0],
        geometryFunction: getGeometryFunction(shape)[1],
      })
      break
    case "Transform":
      newAction = new ol.interaction.Transform({
        enableRotatedTransform: false,
        addCondition: ol.events.condition.shiftKeyOnly,
        hitTolerance: 1,
        scale: true,
        stretch: false,
        translate: true,
        rotate: false,
      })
      break
    case "Transform-nonScale":
      newAction = new ol.interaction.Transform({
        enableRotatedTransform: false,
        addCondition: ol.events.condition.shiftKeyOnly,
        hitTolerance: 1,
        scale: false,
        stretch: false,
        translate: true,
        rotate: false,
      })
      break
    default:
      break
  }

  return newAction
}

function setActionOnMap(action) {
  map.addInteraction(action)
}

function getGeometryFunction(geometryType) {
  var type = geometryType
  var geometryFunction = undefined

  if (type === "Square") {
    type = "Circle"
    geometryFunction = ol.interaction.Draw.createRegularPolygon(4)
  } else if (type === "Box") {
    type = "Circle"
    geometryFunction = ol.interaction.Draw.createBox()
  } else if (type === "Star") {
    type = "Circle"
    geometryFunction = function (coordinates, geometry) {
      var center = coordinates[0]
      var last = coordinates[coordinates.length - 1]
      var dx = center[0] - last[0]
      var dy = center[1] - last[1]
      var radius = Math.sqrt(dx * dx + dy * dy)
      var rotation = Math.atan2(dy, dx)
      var newCoordinates = []
      var numPoints = 12

      for (var i = 0; i < numPoints; ++i) {
        var angle = rotation + (i * 2 * Math.PI) / numPoints
        var fraction = i % 2 === 0 ? 1 : 0.5
        var offsetX = radius * fraction * Math.cos(angle)
        var offsetY = radius * fraction * Math.sin(angle)
        newCoordinates.push([center[0] + offsetX, center[1] + offsetY])
      }
      newCoordinates.push(newCoordinates[0].slice())
      if (!geometry) {
        geometry = new ol.geom.Polygon([newCoordinates])
      } else {
        geometry.setCoordinates([newCoordinates])
      }
      return geometry
    }
  }

  return [type, geometryFunction]
}

//* ******************** Create Zone ******************** *//
$(document).on("click", "#btn_add_zone", null, function () {
  var $zoneElem = $("#zone_list")
  if (Object.values(selectedFeature).length === 0) {
    alert("Select a valid zone first.")
    return
  }
  if (selectedFeature.getGeometry().getType() === "Circle") {
    alert("Sorry. Circles cannot assign as Zone")
    return
  }
  if (selectedFeature.getGeometry().getType() === "Line") {
    alert("Sorry. Lines cannot assign as Zone")
    return
  }
  if (selectedFeature.getGeometry().getType() === "MultiPolygon") {
    alert("Sorry. MultiPolygon cannot assign as Zone")
    return
  }
  var selectedZone = {
    type: "Feature",
    properties: {
      id: "Zone-" + $zoneElem.val(),
      text: $("#zone_list option:selected").html(),
    },
    geometry: {
      type: "Polygon",
      coordinates: selectedFeature.getGeometry().getCoordinates(),
    },
  }

  var isAdded = zoneGeoJson.features.find(function (item) {
    return item.properties.id === selectedZone.properties.id
  })

  if (isAdded) {
    alert(`${selectedZone.properties.text} Already Added`)
    return
  }

  zoneGeoJson.features.push(selectedZone)

  removeDrawingFromLayer(selectedFeature, getDrawingLayer().getSource())
  drawZone(selectedZone)

  $("#translateFeature").trigger("click")
})

function resetSideBar() {
  initSelectedZone()
  isSelectCalibration = false
  $(".app-sidebar-components li").removeClass("active")
}

function showAlertPulse(xPos, yPos, color) {
  let node = createAlertDot(color)
  let alert = new ol.Overlay({
    element: node,
  })

  map.addOverlay(alert)
  alert.setPosition([xPos, yPos])

  return alert
}

function deleteAlertPulse(alert) {
  alert.setPosition(undefined)
}

function createAlertDot(color) {
  let node = document.createElement("div")
  let attr = document.createAttribute("class")
  let style = document.createAttribute("style")
  const className = `pulse-alert${(Math.random() + "").slice(3, 6)}`
  attr.value = className
  node.setAttributeNode(attr)
  node.setAttributeNode(style)
  if (color) {
    style.value = `
      position: absolute;
      top: -8px;
      left: -8px;
      width: 16px;
      height: 16px;
      color: red;
      background-color: ${hexToRGB(color)};
      border-radius: 50%;
    `
  }

  $.keyframe.define([
    {
      name: className,
      from: { "box-shadow": `0 0 0 0px ${hexToRGB(color, 0.8)}` },
      to: { "box-shadow": `0 0 0 18px ${hexToRGB(color, 0.1)}` },
    },
  ])

  document.getElementById("alert").appendChild(node)
  $(`.${className}`).playKeyframe({
    name: className,
    duration: "1s",
    iterationCount: "infinite",
    timingFunction: "ease-out",
  })

  return node
}

function updateGeoJson() {
  tempZoneGeoJson = {
    type: "FeatureCollection",
    features: [],
    image: imageName,
  }

  const generateFeatureJson = (level, id, text, type, coordinates) => {
    return {
      type: level,
      properties: {
        id,
        text,
      },
      geometry: {
        type,
        coordinates,
      },
    }
  }

  const generateFeatureJsonWithCalibration = (
    level,
    id,
    text,
    calibration,
    type,
    coordinates
  ) => {
    return {
      type: level,
      properties: {
        id,
        text,
        calibration,
      },
      geometry: {
        type,
        coordinates,
      },
    }
  }

  var tempCalibration = []

  zoneGeoJson.features.forEach((feature, featureIndex) => {
    var temp_key = feature.properties.id
    if (temp_key && temp_key.indexOf("Cable") > -1) {
      tempCalibration[temp_key] = feature.properties.calibration
    }
  })

  var layerNameList = []
  map.getLayers().forEach((layer) => {
    let source = layer.getSource()
    if (source instanceof ol.source.Vector) {
      let features = source.getFeatures()
      if (features.length) {
        features.forEach((feature) => {
          const featureGeometry = feature.getGeometry()
          const featureProperties = feature.getProperties()
          let featureLevel
          let featureId
          let featureText
          let featureType
          let featureCoordinates

          if (featureGeometry) {
            featureType = featureGeometry.getType()
            if (featureGeometry.getCoordinates()) {
              featureCoordinates = featureGeometry.getCoordinates()
            } else {
              featureCoordinates = [
                featureGeometry.getCenter(),
                featureGeometry.getRadius(),
              ]
            }
          } else {
            return
          }

          if (featureProperties) {
            featureId = featureProperties.id
            featureText = featureProperties.text

            if (featureText == "calibration") return

            if (featureId || featureText) {
              featureLevel = "Feature"
            } else {
              featureLevel = "Drawing"
            }
          } else {
            return
          }

          if (!layerNameList.includes(featureText)) {
            if (featureText) {
              layerNameList.push(featureText)
            }
            tempZoneGeoJson.features.push(
              featureId && featureId.indexOf("Cable") > -1
                ? generateFeatureJsonWithCalibration(
                    featureLevel,
                    featureId,
                    featureText,
                    tempCalibration[featureId],
                    featureType,
                    featureCoordinates
                  )
                : generateFeatureJson(
                    featureLevel,
                    featureId,
                    featureText,
                    featureType,
                    featureCoordinates
                  )
            )
          }
        })
      }
    }
  })
  addedCable = []
  tempZoneGeoJson.features.map((feature) => {
    const featureProperties = feature.properties
    if (
      featureProperties &&
      featureProperties.id &&
      featureProperties.id.indexOf("Cable") > -1
    ) {
      addedCable.push(featureProperties.id)
    }
  })
  zoneGeoJson = tempZoneGeoJson
}

$(document).on("click", "#btnSave", null, function (e) {
  updateGeoJson()
  let usedCables = ""
  addedCable.map((cableId, index) => {
    if (index === addedCable.length - 1) {
      usedCables += cableId
    } else {
      usedCables += cableId + ","
    }
  })

  let isZoneCreated = false

  for (let i = 0; i < zoneGeoJson.features.length; i++) {
    const feature = zoneGeoJson.features[i]
    if (
      feature.properties &&
      feature.properties.id &&
      feature.properties.id.indexOf("Zone") > -1
    ) {
      isZoneCreated = true
    }
  }

  // * Ajax call to localhost. Address is changeable
  if (!isZoneCreated) {
    alert("No zone selected!")
    return
  }

  // * Ajax call to localhost. Address is changeable
  $.post("http://10.10.10.11", {
    data: JSON.stringify({
      ...zoneGeoJson,
      "File Name": $("#txtfnam").val(),
      "All Cable Id": `${usedCables}`,
    }),
  })
    .done(function (data) {
      alert("GeoJson file has successfully transferred")
    })
    .fail(function (err) {
      alert("Sorry, there is an error")
    })
})
function imageSize(imageUrl) {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image()
        img.src = imageUrl

        img.onload = () => {
          resolve({ width: img.width, height: img.height })
        }
      } catch (e) {
        reject(e)
      }
    })
  }
async function init(
  geoJson = null,
  imageFileName = tempImageName,
  updateMap = false
) {
  imageName = imageFileName

  imageUrl = imageAssetUrl + imageName

  let layers

  if (map) {
    map = undefined
  }

  await initMap()

  if (geoJson) {
    let drawingList = []
    geoJson.features.forEach((feature) => {
      const newCalArray = [];
      if(feature.properties.calibration) {

        feature.properties.calibration.map((item, key) => {
          return key >= 2 && newCalArray.push(true);
        });
        calibrationPoints[feature.properties.id] = newCalArray;

        document.querySelectorAll(`#cable_list option`).forEach(option => {
          
          if(option.value.indexOf(feature.properties.id) === 0) {
            option.classList.add('active');     
          }
        })
      }
      if (feature.type === "Drawing") {
        drawingList.push(feature);
      } else {

      }
    });
    if (drawingList.length) {
      source.addFeatures(getDrawingFeatureList(drawingList));
    }
    
    zoneGeoJson = geoJson;
    
    generateFeaturesInGeoJson(zoneGeoJson);
  }

  async function initMap() {
    if (!geoJson) {
      source = new ol.source.Vector({
        wrapX: false,
        title: "source",
      })
    }
    const result = await imageSize(imageUrl)

    const realWidth = result["width"]
    const realHeight = result["height"]
    const viewerWidth = document.getElementById("map").clientWidth
    const viewerHeight = document.getElementById("map").clientHeight
    extent = [0, 0, realWidth, realHeight]

    var projection = new ol.proj.Projection({
      code: "xkcd-image",
      units: "pixels",
      extent: extent,
    })

    let zoomValue = viewerWidth / realWidth
    if (zoomValue < 1) {
      zoomValue =
        (viewerHeight / realHeight) * (1 + (realHeight / viewerHeight) ** 2)
    }

    view = new ol.View({
      projection: projection,
      center: ol.extent.getCenter(extent),
      zoom: zoomValue,
      maxZoom: 5,
    })

    var imgLayer = new ol.layer.Image({
      source: new ol.source.ImageStatic({
        attributions: '© <a href="http://xkcd.com/license.html">xkcd</a>',
        url: imageUrl,
        projection: projection,
        imageExtent: extent,
      }),
    })

    vector = new ol.layer.Vector({
      className: "draw-layer",
      source: source,
      title: "default",
      zIndex: 1000,
      style: (f) => {
        return new ol.style.Style({
          image: new ol.style.Circle({
            radius: 5,
            stroke: new ol.style.Stroke({
              width: 16,
              color: f.get("color") || [255, 128, 0],
            }),
            fill: new ol.style.Fill({
              color: (f.get("color") || [255, 128, 0]).concat([0.3]),
            }),
          }),
          fill: new ol.style.Fill({
            color: f.get("color") || "rgba(255, 255, 255, 0.2)",
          }),
          stroke: new ol.style.Stroke({
            width: 16,
            lineDash: [isDashLine],
            color: f.get("color") || [255, 128, 0],
          }),
        })
      },
    })

    if (map) {
      map = undefined
    }
    map = new ol.Map({
      layers: [imgLayer, vector],
      target: "map",
      interactions: ol.interaction.defaults({
        dragPan: lock,
      }),
      loadTilesWhileAnimating: true,
      view: view,
    })

    if (modify) {
      map.removeInteraction(modify)
    }
  }

  // Event Handler when hover
  map.addOverlay(tooltip)
  map.on("pointermove", function (evt) {
    var featureText = ""
    var coordinates
    var hit = this.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
      var selectedZone = feature.getProperties()
      if (
        selectedZone.features != undefined &&
        selectedZone.features.length &&
        selectedZone.features[0].getProperties() != undefined &&
        selectedZone.features[0].getProperties().id != undefined &&
        selectedZone.features[0].getProperties().id.indexOf("Cable") > -1
      ) {
        featureText = selectedZone.features[0].getProperties().id
        coordinates = feature.getGeometry().getCoordinates()
        return true
      } else {
        return false
      }
    })

    let calibrations = []
    ;(() => {
      const features = zoneGeoJson.features
      features.map((feature) => {
        if (
          feature.type === "Feature" &&
          feature.geometry.type === "LineString" &&
          feature.properties.id === featureText
        ) {
          calibrations = feature.properties.calibration
        }
      })
    })()

    if (hit && calibrations.length) {
      let tooltipInfoArray = []
      calibrations.map((element, elementIndex) => {
        var isSame = true
        element.coordinates.map((coordinateItem, index) => {
          if (coordinateItem.toFixed(0) !== coordinates[index].toFixed(0)) {
            isSame = false
          }
        })

        if (isSame && tooltipInfoArray.length === 0) {
          tooltipInfoArray = [elementIndex, element]
        }
      })

      if (tooltipInfoArray.length !== 0) {
        const calibration = tooltipInfoArray[1]
        tooltipContent.innerHTML =
          "<p>" + calibration.offset.toFixed(0).toString() + "</p>"
        tooltip.setPosition(calibration.coordinates)
      }
    } else {
      tooltip.setPosition(undefined)
    }
  })
}
// Modify callibration points to be settled just on cables.
function modifyCalibrations(zoneGeoJson) {
  let featureList = zoneGeoJson.features
  let i = 0
  for (; i < featureList.length; i++) {
    let feature = featureList[i]
    let featureLevel = feature.type
    if (feature.properties.id && feature.properties.id.indexOf("Cable") != -1) {
      var coordinates = zoneGeoJson.features[i].geometry.coordinates
      const lines = new ol.geom.LineString(coordinates)
      let closest
      for (
        let j = 0;
        j < zoneGeoJson.features[i].properties.calibration.length;
        j++
      ) {
        closest = lines.getClosestPoint([
          zoneGeoJson.features[i].properties.calibration[j].coordinates[0],
          zoneGeoJson.features[i].properties.calibration[j].coordinates[1],
        ])
        zoneGeoJson.features[i].properties.calibration[j].coordinates = closest
      }
    }
  }
}

function getBlinkCoords(sel_cable, startpt, endpt, ratio) {
  let featureList = zoneGeoJson.features
  let i = 0
  for (; i < featureList.length; i++) {
    let feature = featureList[i]
    if (feature.properties.id == sel_cable) break
  }
  if (i == featureList.length) return

  if(zoneGeoJson.features[i].geometry.type === 'Circle') {
    
    var coordinates = zoneGeoJson.features[i].geometry.coordinates;
  
  const lines = new ol.geom.LineString(coordinates)

  let firstpt = lines.getFirstCoordinate()

  if (startpt == null) {
    startpt = lines.getFirstCoordinate()
  } else startpt = startpt["coordinates"]
  if (endpt == null) endpt = lines.getLastCoordinate()
  else endpt = endpt["coordinates"]
  var line = turf.lineString([zoneGeoJson.features[i].geometry.coordinates[0], zoneGeoJson.features[i].geometry.coordinates[0]])

  firstpt = turf.point(firstpt)
  var start = turf.point(startpt)
  var end = turf.point(endpt);
  
  var sliced1 = turf.lineSplit(line, start)["features"][0]
  
  var len1 = 0
  
  if (
    start["geometry"]["coordinates"][0] == lines.getFirstCoordinate()[0] &&
    start["geometry"]["coordinates"][1] == lines.getFirstCoordinate()[1]
  ) {
    len1 = 0
  }

  var sliced2 = turf.lineSplit(line, end)["features"][0]
  var len2 = turf.length(turf.toWgs84(sliced2))
  
  return turf.toMercator(
    turf.along(turf.toWgs84(line), len1 + (len2 - len1) * ratio)
  )
    
  }
  var coordinates = zoneGeoJson.features[i].geometry.coordinates;
  
  const lines = new ol.geom.LineString(coordinates)

  let firstpt = lines.getFirstCoordinate()

  if (startpt == null) {
    startpt = lines.getFirstCoordinate()
  } else startpt = startpt["coordinates"]
  if (endpt == null) endpt = lines.getLastCoordinate()
  else endpt = endpt["coordinates"]
  var line = turf.lineString(zoneGeoJson.features[i].geometry.coordinates)
  
  firstpt = turf.point(firstpt)
  var start = turf.point(startpt)
  var end = turf.point(endpt);
  
  var sliced1 = turf.lineSplit(line, start)["features"][0]
  
  var len1 = turf.length(turf.toWgs84(sliced1))
  
  if (
    start["geometry"]["coordinates"][0] == lines.getFirstCoordinate()[0] &&
    start["geometry"]["coordinates"][1] == lines.getFirstCoordinate()[1]
  ) {
    len1 = 0
  }

  var sliced2 = turf.lineSplit(line, end)["features"][0]
  var len2 = turf.length(turf.toWgs84(sliced2))
  
  return turf.toMercator(
    turf.along(turf.toWgs84(line), len1 + (len2 - len1) * ratio)
  )
}
function hexToRGB(hex, alpha = 1) {
  if (hex.indexOf("#") > -1) {
    hex = hex.slice(1)
  }

  var r = parseInt(hex.slice(0, 2), 16),
    g = parseInt(hex.slice(2, 4), 16),
    b = parseInt(hex.slice(4, 6), 16)

  if (alpha) {
    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")"
  } else {
    return "rgb(" + r + ", " + g + ", " + b + ")"
  }
}

zoneGeoJson = JSON.parse($("#txtgeojson").val())
setTimeout(async () => {
  removeDivs()
  modifyCalibrations(zoneGeoJson)
  await init(zoneGeoJson, zoneGeoJson.image, true)
  alertControl(true)
}, 1000)
