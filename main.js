import "./style.css";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import { OSM, BingMaps, Vector as VectorSource, XYZ } from "ol/source";
import VectorLayer from "ol/layer/Vector";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import { Projection, fromLonLat, transform, useGeographic } from "ol/proj";
import Tile from "ol/layer/Tile";
import TileWMS from "ol/source/TileWMS.js";
import {
  Attribution,
  defaults,
  FullScreen,
  ZoomSlider,
  MousePosition,
  ScaleLine,
  OverviewMap,
  Rotate,
} from "ol/control";
import DragRotate from "ol/interaction/DragRotate";
import {
  click,
  altKeyOnly,
  platformModifierKeyOnly,
} from "ol/events/condition";
import { toStringXY } from "ol/coordinate";
import LayerSwitcher from "ol-ext/control/LayerSwitcher";
import LayerGroup from "ol/layer/Group";
import SearchNominatim from "ol-ext/control/SearchNominatim";
import Feature from "ol/Feature";
import { Point, LineString } from "ol/geom";
import Overlay from "ol/Overlay.js";
import {
  Style,
  Circle as CircleStyle,
  Fill,
  Stroke,
  Text,
  RegularShape,
} from "ol/style";
import { getLength, getArea } from "ol/sphere";
import { Modify, Draw } from "ol/interaction";
import Graticule from "ol/layer/Graticule.js";
import Geolocation from "ol/Geolocation.js";
import Popup from "ol-ext/overlay/Popup";
import Select from "ol/interaction/Select";
import { DragPan } from "ol/interaction";

proj4.defs(
  "EPSG:6870",
  "+proj=tmerc +lat_0=0 +lon_0=20 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"
);
register(proj4);

proj4.defs(
  "EPSG:32634",
  "+proj=utm +zone=34 +datum=WGS84 +units=m +no_defs +type=crs"
);

register(proj4);

const krgjshProjection = new Projection({
  code: "EPSG:6870",
  extent: [-2963585.56, 3639475.76, 2404277.44, 9525908.77],
  worldExtent: [-90, -90, 90, 90],
  units: "m",
});

const krgjshCenter = fromLonLat([19.818913, 41.328608], "EPSG:6870");

//creating attribution control for ol
const attributionControl = new Attribution({
  collapsible: true,
});

// Zoom Extent ol-Control
const zoomExtentBtn = document.getElementById("zoom-extent");

zoomExtentBtn.addEventListener("click", function () {
  map
    .getView()
    .fit([345385.09991, 4319495.500793, 609873.6757, 4758401.232114], {
      padding: [10, 10, 10, 10], // Optional padding around the extent
      maxZoom: 18, // Optional maximum zoom level
    });
  calculateScale();
});

//Full Screen COntrol
const fullScreenControl = new FullScreen({
  tipLabel: "Click to fullscreen the map",
  className: "ol-full-screen",
});

//Zoom Slider
// const zoomSlider = new ZoomSlider();

//MousePosition Coordinates
const mousePositionControl = new MousePosition({
  coordinateFormat: function (coordinate) {
    return "KRGJSH : " + toStringXY(coordinate, 2);
  },
  className: "custom-mouse-position",
});

//ScaleLine Control
const scaleLineControl = new ScaleLine({
  minWidth: 200,
  units: "metric",
  bar: true,
  steps: 6,
  // text: true,
  className: "ol-scale-bar",
});

//OverView Map Control
// const overViewMap = new OverviewMap({
//   collapsed: false,
//   collapsible: true,
//   rotateWithView: true,
//   view: new View({
//     center: krgjshCenter,
//     zoom: 16,
//     projection: "EPSG:6870",
//   }),
//   layers: [
//     new Tile({
//       source: new OSM(),
//     }),
//   ],
// });

// Create a container element for the static content
// const staticContent = document.createElement("div");
// staticContent.innerHTML = "Overview Map";

// // Style the container element with CSS
// staticContent.style.position = "absolute";
// staticContent.style.top = "10px";
// staticContent.style.left = "25px";
// staticContent.style.color = "Black";
// staticContent.style.fontSize = "16px";
// staticContent.style.backgroundColor = "white";

// Add the container element to the map's overlay container
// overViewMap.getOverviewMap().getOverlayContainer().appendChild(staticContent);

//Rotate COntrol
const rotate = new Rotate();

//DRAGPAN MAP

const dragPanBtn = document.getElementById("pan");

const dragPan = new DragPan({
  condition: function (event) {
    return platformModifierKeyOnly(event);
  },
});

dragPanBtn.addEventListener("click", function () {
  map.addInteraction(dragPan);
});

// Adding controls in a variable
const mapControls = [
  attributionControl,
  fullScreenControl,
  // zoomSlider,
  mousePositionControl,
  scaleLineControl,
  // overViewMap,
  rotate,
  dragPan,
];

// Bing Maps Basemap Layer
const bingMaps = new TileLayer({
  source: new BingMaps({
    key: "AvHGkUYsgRR4sQJ1WmqJ879mN7gP-a59ExxkaD9KXDie-8nyYX4W9oSnG4ozmDXB",
    imagerySet: "AerialWithLabelsOnDemand", //'Aerial','RoadOnDemand','CanvasGray','AerialWithLabelsOnDemand','Aerial','Birdseye','BirdseyeV2WithLabels','CanvasDark','Road','CanvasGray'
  }),
  visible: false,
  title: "BingMaps",
  baseLayer: true,
  displayInLayerSwitcher: true,
});

const osmMap = new TileLayer({
  source: new OSM(),
  title: "OSM",
  visible: true,
  baseLayer: true,
  displayInLayerSwitcher: true,
});

//CartoDB BaseMap Layer
const cartoDBBaseLayer = new TileLayer({
  source: new XYZ({
    url: "https://{1-4}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    attributions: "© CARTO",
  }),
  visible: false,
  title: "CartoDarkAll",
  baseLayer: true,
  displayInLayerSwitcher: true,
});

const orthoPhoto = new Tile({
  source: new TileWMS({
    url: "http://localhost:8080/geoserver/my_workspace1/wms",
    params: { LAYERS: "my_workspace1:OrthoImagery_20cm" },
  }),

  visible: false,
  baseLayer: true,
  title: "Ortho_20cm",
  baseLayer: true,
  attributions:
    '<a href="https://asig.gov.al/copyright/">ASIG contributors</a>',
  displayInLayerSwitcher: true,
});

const albBorders = new Tile({
  source: new TileWMS({
    url: "https://geoportal.asig.gov.al/service/kufinjt_e_njesive_administrative/wms?request=GetCapabilities",
    params: {
      LAYERS: "rendi_1_kufi_shteteror",
      VERSION: "1.1.0",
    },
  }),
  visible: true,
  title: "Kufi Shteteror",
  information: "Kufiri i tokësor i republikës së Shqipërisë",
  displayInLayerSwitcher: true,
});

const albRegions = new Tile({
  source: new TileWMS({
    url: "https://geoportal.asig.gov.al/service/kufinjt_e_njesive_administrative/wms?request=GetCapabilities",
    params: {
      LAYERS: "rendi_2_kufi_qarku_vkm360",
      VERSION: "1.1.0",
    },
  }),
  visible: false,
  title: "Qark",
  information: "Kufiri i tokësor i republikës së Shqipërisë",
  displayInLayerSwitcher: true,
});

const municipalities = new Tile({
  source: new TileWMS({
    url: "https://geoportal.asig.gov.al/service/kufinjt_e_njesive_administrative/wms?request=GetCapabilities",
    params: {
      LAYERS: "rendi_3_kufi_bashki_vkm360_1",
      VERSION: "1.1.0",
    },
  }),
  visible: false,
  title: "Bashki",
  information: "Kufiri i tokësor i republikës së Shqipërisë",
  displayInLayerSwitcher: true,
});

const country = new Style({
  stroke: new Stroke({
    color: "gray",
    width: 1,
  }),
  fill: new Fill({
    color: "rgba(20,20,20,0.9)",
  }),
});

const municipalitiesLocal = new Tile({
  source: new TileWMS({
    url: "http://localhost:8080/geoserver/my_workspace1/wms",
    params: {
      LAYERS: "my_workspace1:adm_boundary",
      VERSION: "1.1.0",
    },
  }),
  visible: true,
  title: "Bashkite Local",
  information: "Kufiri i tokësor i republikës së Shqipërisë",
  displayInLayerSwitcher: true,
});
const zonaA = new Tile({
  source: new TileWMS({
    url: "http://localhost:8080/geoserver/my_workspace1/wms",
    params: {
      LAYERS: "my_workspace1:Zona_A",
      VERSION: "1.1.0",
    },
  }),
  visible: true,
  title: "Zona A",
  information: "Kufiri i tokësor i republikës së Shqipërisë",
  displayInLayerSwitcher: true,
});

const protectedAreas = new Tile({
  source: new TileWMS({
    url: "https://geoportal.asig.gov.al/service/akzm/wms",
    params: {
      LAYERS: "zonat_e_mbrojtura_natyrore_06042023",
      VERSION: "1.1.0",
    },
  }),
  visible: false,
  title: "Zonat e Mbrojtura",
  information: "Kufiri i tokësor i republikës së Shqipërisë",
  displayInLayerSwitcher: true,
});

const naturalMonuments = new Tile({
  source: new TileWMS({
    url: "https://geoportal.asig.gov.al/service/akzm/wms",
    params: {
      LAYERS: "monumentet_natyrore_07032023",
      VERSION: "1.1.0",
    },
  }),
  visible: false,
  title: "Monumente Natyrore",
  information: "Kufiri i tokësor i republikës së Shqipërisë",
  displayInLayerSwitcher: true,
});

const roadNetwork = new Tile({
  source: new TileWMS({
    url: "https://geoportal.asig.gov.al/service/instituti_transportiti/wms",
    params: {
      LAYERS: "infrastruktura_rrugore_utm",
      VERSION: "1.1.0",
    },
  }),
  visible: false,
  title: "Rrjeti Rrugor",
  information: "Kufiri i tokësor i republikës së Shqipërisë",
  displayInLayerSwitcher: true,
});

const buildingsAdr = new Tile({
  source: new TileWMS({
    url: "https://geoportal.asig.gov.al/service/adresar/wms",
    params: {
      LAYERS: "adr_ndertese",
      VERSION: "1.1.0",
    },
  }),
  visible: false,
  title: "Ndërtesa",
  information: "Kufiri i tokësor i republikës së Shqipërisë",
  displayInLayerSwitcher: true,
});

const enumerationAdr = new Tile({
  source: new TileWMS({
    url: "https://geoportal.asig.gov.al/service/adresar/wms",
    params: {
      LAYERS: "adr_numertim",
      VERSION: "1.1.0",
    },
  }),
  visible: false,
  title: "Numërtim",
  information: "Kufiri i tokësor i republikës së Shqipërisë",
  displayInLayerSwitcher: true,
});

const roadsAdr = new Tile({
  source: new TileWMS({
    url: "https://geoportal.asig.gov.al/service/adresar/wms",
    params: {
      LAYERS: "adr_rruge",
      VERSION: "1.1.0",
    },
  }),
  visible: false,
  title: "Rrugët",
  information: "Kufiri i tokësor i republikës së Shqipërisë",
  displayInLayerSwitcher: true,
});

const baseLayerGroup = new LayerGroup({
  layers: [orthoPhoto, cartoDBBaseLayer, bingMaps, osmMap],
  title: "Base Layers",
  information:
    "Këto shtresa shtresat bazë të hartës të cilat mund të aktivizohen veç e veç",
  displayInLayerSwitcher: true,
});
const asigLayers = new LayerGroup({
  layers: [
    albBorders,
    albRegions,
    municipalities,
    protectedAreas,
    naturalMonuments,
    roadNetwork,
  ],
  title: "ASIG Layers",
  information:
    "Këto shtresa shtresat bazë të hartës të cilat mund të aktivizohen veç e veç",
  displayInLayerSwitcher: true,
});

const addressSystem = new LayerGroup({
  layers: [buildingsAdr, enumerationAdr, roadsAdr],
  title: "Sistemi i Adresave",
  information: "Sistemi i Adresave",
  displayInLayerSwitcher: true,
});

const localData = new LayerGroup({
  layers: [municipalitiesLocal, zonaA],
  title: "Local Data",
  displayInLayerSwitcher: true,
});

const map = new Map({
  target: "map",
  controls: defaults({ attribution: false }).extend(mapControls),
  layers: [baseLayerGroup, asigLayers, addressSystem, localData],
  view: new View({
    projection: krgjshProjection,
    center: krgjshCenter,
    zoom: 5,
  }),
});

// Creating vectorSource to store layers
const vectorSource = new VectorSource();

//DragRotate Interaction
const dragRotateInteraction = new DragRotate({
  condition: altKeyOnly,
});

map.addInteraction(dragRotateInteraction);

//__________________________________________________________________________________________
//GeoLocation Search
const geoSearch = new SearchNominatim({
  placeholder: "Kërko qytet/fshat...",
  collapsed: false,
  collapsible: false,
  url: "https://nominatim.openstreetmap.org/search?format=json&q={s}",
});

map.addControl(geoSearch);

geoSearch.on("select", function (event) {
  const selectedResultCoordinates = event.coordinate;

  // Create a temporary point feature
  const pointFeature = new Feature({
    geometry: new Point(selectedResultCoordinates),
  });

  // Add the point feature to a vector layer
  const vectorSource = new VectorSource({
    features: [pointFeature],
  });

  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: new Style({
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({
          color: "red",
        }),
        stroke: new Stroke({
          color: "white",
          width: 2,
        }),
      }),
    }),
  });

  // Add the vector layer to the map
  map.addLayer(vectorLayer);
  // Remove the point feature after 1000 ms (1 second)
  setTimeout(() => {
    vectorSource.removeFeature(pointFeature);
  }, 2000);
  // Set the map view to the specified center coordinates and zoom level
  map.getView().setCenter(selectedResultCoordinates);
  map.getView().setZoom(12);
  calculateScale();

  geoSearch.clearHistory();
});

//________________________________________________________________________________________________________
//Show/Hide graticule
const toggleButton = document.getElementById("graticuleButton");

let graticule; // Declare the graticule variable outside the click event listener

toggleButton.addEventListener("click", function () {
  if (graticule) {
    // Graticule already exists, remove it from the map
    map.removeControl(graticule);
    graticule = undefined; // Set graticule variable to undefined
  } else {
    // Graticule doesn't exist, create and add it to the map
    graticule = new Graticule({
      strokeStyle: new Stroke({
        color: "rgba(255, 120, 0, 0.9)",
        width: 2,
        lineDash: [0.5, 4],
      }),
      showLabels: true,
    });
    map.addControl(graticule);
  }
});
//________________________________________________________________________________________________________
//Geolocation API
const geolocationButton = document.getElementById("getGeolocation");
let isTracking = false; // Track the current state of geolocation tracking
const geolocation = new Geolocation(); // Declare geolocation variable
let currentPositionLayer; // Declare currentPositionLayer variable
const originalButtonHTML = geolocationButton.innerHTML;

geolocationButton.addEventListener("click", function () {
  if (isTracking) {
    stopGeolocationTracking();
  } else {
    startGeolocationTracking();
  }
});

function startGeolocationTracking() {
  const viewProjection = map.getView().getProjection();

  geolocation.setTrackingOptions({
    enableHighAccuracy: true,
  });

  geolocation.setProjection(viewProjection);

  const accuracyFeature = new Feature();
  geolocation.on("change:accuracyGeometry", function () {
    accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
  });

  const currentPositionFeature = new Feature();

  geolocation.on("change:position", function () {
    let currentPosition = geolocation.getPosition();
    map.getView().setCenter(currentPosition);
    map.getView().setZoom(18);

    currentPositionFeature.setGeometry(new Point(currentPosition));
    calculateScale();
  });

  // Trigger the geolocation to start tracking
  geolocation.setTracking(true);

  // Create a vector layer to display the current position
  currentPositionLayer = new VectorLayer({
    source: new VectorSource({
      features: [currentPositionFeature, accuracyFeature],
    }),
  });

  // Add the layer to the map
  map.addLayer(currentPositionLayer);

  // Update the tracking state
  isTracking = true;
  geolocationButton.textContent = "Stop Geolocation";
}

function stopGeolocationTracking() {
  // Stop the geolocation tracking
  geolocation.setTracking(false);

  // Remove the current position layer from the map
  map.removeLayer(currentPositionLayer);

  // Update the tracking state
  isTracking = false;
  geolocationButton.innerHTML = originalButtonHTML;
}

//_________________________________________________________________________________________
// Measure and show labels
const measureLine = document.getElementById("measure-length");
const measurePolygon = document.getElementById("measure-area");
const showSegments = document.getElementById("segments");
const clearPrevious = document.getElementById("clear");

const style = new Style({
  fill: new Fill({
    color: "rgba(255, 255, 255, 0.2)",
  }),
  stroke: new Stroke({
    color: "rgba(0, 0, 0, 0.5)",
    lineDash: [10, 10],
    width: 2,
  }),
  image: new CircleStyle({
    //This is for circle style
    radius: 5,
    stroke: new Stroke({
      color: "rgba(0, 0, 0, 0.7)",
    }),
    fill: new Fill({
      color: "rgba(255, 255, 255, 0.2)",
    }),
  }),
});

const labelStyle = new Style({
  text: new Text({
    font: "14px Calibri,sans-serif",
    fill: new Fill({
      color: "rgba(255, 255, 255, 1)",
    }),
    backgroundFill: new Fill({
      color: "rgba(0, 0, 0, 0.7)",
    }),
    padding: [3, 3, 3, 3],
    textBaseline: "bottom",
    offsetY: -15,
  }),
  image: new RegularShape({
    radius: 8,
    points: 3,
    angle: Math.PI,
    displacement: [0, 10],
    fill: new Fill({
      color: "rgba(0, 0, 0, 0.7)",
    }),
  }),
});

const tipStyle = new Style({
  text: new Text({
    font: "12px Calibri,sans-serif",
    fill: new Fill({
      color: "rgba(255, 255, 255, 1)",
    }),
    backgroundFill: new Fill({
      color: "rgba(0, 0, 0, 0.4)",
    }),
    padding: [2, 2, 2, 2],
    textAlign: "left",
    offsetX: 15,
  }),
});

const modifyStyle = new Style({
  image: new CircleStyle({
    //This is for CircleStyle
    radius: 5,
    stroke: new Stroke({
      color: "rgba(0, 0, 0, 0.7)",
    }),
    fill: new Fill({
      color: "rgba(0, 0, 0, 0.4)",
    }),
  }),
  text: new Text({
    text: "Drag to modify",
    font: "12px Calibri,sans-serif",
    fill: new Fill({
      color: "rgba(255, 255, 255, 1)",
    }),
    backgroundFill: new Fill({
      color: "rgba(0, 0, 0, 0.7)",
    }),
    padding: [2, 2, 2, 2],
    textAlign: "left",
    offsetX: 15,
  }),
});

const segmentStyle = new Style({
  text: new Text({
    font: "12px Calibri,sans-serif",
    fill: new Fill({
      color: "rgba(255, 255, 255, 1)",
    }),
    backgroundFill: new Fill({
      color: "rgba(0, 0, 0, 0.4)",
    }),
    padding: [2, 2, 2, 2],
    textBaseline: "bottom",
    offsetY: -12,
  }),
  image: new RegularShape({
    radius: 6,
    points: 3,
    angle: Math.PI,
    displacement: [0, 8],
    fill: new Fill({
      color: "rgba(0, 0, 0, 0.4)",
    }),
  }),
});

const segmentStyles = [segmentStyle];

const formatLength = function (line) {
  const length = getLength(line);
  let output;
  if (length > 100) {
    output = Math.round((length / 1000) * 100) / 100 + " km";
  } else {
    output = Math.round(length * 100) / 100 + " m";
  }
  return output;
};

const formatArea = function (polygon) {
  const area = getArea(polygon);
  let output;
  if (area > 10000) {
    output = Math.round((area / 1000000) * 100) / 100 + " km\xB2";
  } else {
    output = Math.round(area * 100) / 100 + " m\xB2";
  }
  return output;
};

const modify = new Modify({
  source: vectorSource,
  style: modifyStyle,
});

let tipPoint;

function styleFunction(feature, segments, drawType, tip) {
  const styles = [style];
  const geometry = feature.getGeometry();
  const type = geometry.getType();
  let point, label, line;
  if (!drawType || drawType === type) {
    if (type === "Polygon") {
      point = geometry.getInteriorPoint();
      label = formatArea(geometry);
      line = new LineString(geometry.getCoordinates()[0]);
    } else if (type === "LineString") {
      point = new Point(geometry.getLastCoordinate());
      label = formatLength(geometry);
      line = geometry;
    }
  }
  if (segments && line) {
    let count = 0;
    line.forEachSegment(function (a, b) {
      const segment = new LineString([a, b]);
      const label = formatLength(segment);
      if (segmentStyles.length - 1 < count) {
        segmentStyles.push(segmentStyle.clone());
      }
      const segmentPoint = new Point(segment.getCoordinateAt(0.5));
      segmentStyles[count].setGeometry(segmentPoint);
      segmentStyles[count].getText().setText(label);
      styles.push(segmentStyles[count]);
      count++;
    });
  }
  if (label) {
    labelStyle.setGeometry(point);
    labelStyle.getText().setText(label);
    styles.push(labelStyle);
  }
  if (
    tip &&
    type === "Point" &&
    !modify.getOverlay().getSource().getFeatures().length
  ) {
    tipPoint = geometry;
    tipStyle.getText().setText(tip);
    styles.push(tipStyle);
  }
  return styles;
}

const vectorLayer = new VectorLayer({
  source: vectorSource,
  style: function (feature) {
    return styleFunction(feature, showSegments.checked);
  },
});

map.addInteraction(modify);

let drawLine;
let drawPoly;

//Measure Line
const drawnLineSource = new VectorSource();
measureLine.addEventListener("click", function () {
  map.removeInteraction(drawPoly);

  drawnPolygonSource.clear();
  const drawType = "LineString";
  const activeTip =
    "Click to continue drawing the " +
    (drawType === "Polygon" ? "polygon" : "line");
  const idleTip = "Click to start measuring";
  let tip = idleTip;
  drawLine = new Draw({
    source: vectorSource,
    type: drawType,
    style: function (feature) {
      return styleFunction(feature, showSegments.checked, drawType, tip);
    },
  });
  drawLine.on("drawstart", function () {
    if (clearPrevious.checked) {
      vectorSource.clear();
      drawnLineSource.clear();
    }
    modify.setActive(false);
    tip = activeTip;
  });
  drawLine.on("drawend", function (event) {
    const drawnLine = event.feature;
    drawnLineSource.addFeature(drawnLine);
    modifyStyle.setGeometry(tipPoint);
    modify.setActive(true);
    map.once("pointermove", function () {
      modifyStyle.setGeometry();
    });
    tip = idleTip;
  });
  modify.setActive(true);
  map.addInteraction(drawLine);
});

// Create a vector layer for displaying the drawn polygons
const drawnLineLayer = new VectorLayer({
  title: "Measure Line ",
  source: drawnLineSource,
  style: styleFunction,
});
map.addLayer(drawnLineLayer);

//Measure Polygon
const drawnPolygonSource = new VectorSource();
measurePolygon.addEventListener("click", function () {
  map.removeInteraction(drawLine);

  drawnLineSource.clear();
  const drawType = "Polygon";
  const activeTip =
    "Click to continue drawing the " +
    (drawType === "Polygon" ? "polygon" : "line");
  const idleTip = "Click to start measuring";
  let tip = idleTip;
  drawPoly = new Draw({
    source: vectorSource,
    type: drawType,
    style: function (feature) {
      return styleFunction(feature, showSegments.checked, drawType, tip);
    },
  });
  drawPoly.on("drawstart", function () {
    if (clearPrevious.checked) {
      vectorSource.clear();
      drawnPolygonSource.clear();
    }
    modify.setActive(false);
    tip = activeTip;
  });
  drawPoly.on("drawend", function (event) {
    const drawnPolygon = event.feature;
    drawnPolygonSource.addFeature(drawnPolygon);
    modifyStyle.setGeometry(tipPoint);
    modify.setActive(true);
    map.once("pointermove", function () {
      modifyStyle.setGeometry();
    });
    tip = idleTip;
  });
  modify.setActive(true);
  map.addInteraction(drawPoly);
});

// Create a vector layer for displaying the drawn polygons
const drawnPolygonLayer = new VectorLayer({
  title: "Measure Polygon",
  source: drawnPolygonSource,
  style: styleFunction,
  displayInLayerSwitcher: false,
});

// The displayInLayerSwitcher function
const displayInLayerSwitcher = (layer) => {
  // Check if the layer has the displayInLayerSwitcher attribute and it's set to true
  return layer.get("displayInLayerSwitcher") === true;
};

map.addLayer(drawnPolygonLayer);

//__________________________________________________________________________________________
// Create the LayerSwitcherImage control
//Switching layers on/off regarding to LayerGroup status
const onChangeCheck = function (evt) {
  const layer = evt;

  const baseLayer = layer.get("title") === "Base Layers";
  try {
    const layers = evt.getLayers().getArray();
    layers.forEach((subLayer) => {
      console.log();
      if (
        layer instanceof LayerGroup &&
        layer.values_.visible === true &&
        !baseLayer
      ) {
        subLayer.setVisible(true);
      } else {
        subLayer.setVisible(false);
      }
    });
  } catch (error) {}
};

const layerSwitcher = new LayerSwitcher({
  displayInLayerSwitcher: displayInLayerSwitcher,
  trash: true,
  onchangeCheck: onChangeCheck,
  show_proress: true,
  mouseover: true,
  collapsed: false,
  extent: false,
  onextent: (e) => {
    console.log(e);
  },
  noScroll: true,
  oninfo: (e) => {
    alert(e.values_.information);
  },
});

// // Add the LayerSwitcherImage control to the map
map.addControl(layerSwitcher);

const treePanelHeader = document.createElement("header");
treePanelHeader.innerHTML = "PANELI I SHTRESAVE";

layerSwitcher.setHeader(treePanelHeader);

// Position the LayerSwitcherImage control on the top-right corner of the map
const layerSwitcherElement = layerSwitcher.element;
layerSwitcherElement.style.position = "absolute";
layerSwitcherElement.style.top = "50px";
layerSwitcherElement.style.right = "10px";

//_____________________________________________________________________________________________
// Display data from WMS Layer
const getInfoBtn = document.getElementById("identify");

function getInfo(event) {
  // Get the clicked coordinate
  const pixel = event.pixel;
  var coordinate = map.getCoordinateFromPixel(pixel);

  // Get all visible layers
  const visibleLayers = map
    .getLayers()
    .getArray()
    .filter((layer) => layer.getVisible());

  const maxPropertiesToShow = 5;

  visibleLayers.forEach((layer) => {
    // Send a request to the server to get the feature information
    const url = municipalitiesLocal
      .getSource()
      .getFeatureInfoUrl(
        coordinate,
        map.getView().getResolution(),
        map.getView().getProjection(),
        { INFO_FORMAT: "application/json" }
      );

    if (url) {
      fetch(url)
        .then(function (response) {
          return response.json();
        })
        .then(function (data) {
          var features = data.features;

          features.forEach((feature) => {
            var properties = feature.properties;

            // Create the form container
            var formContainer = document.createElement("div");
            formContainer.classList.add("form-container");
            // Add the header with its value to the form container
            var headerProperty = "emri";
            var headerElement = document.createElement("div");
            headerElement.classList.add("form-header");
            headerElement.textContent = properties[headerProperty];
            formContainer.appendChild(headerElement);

            // Add a line (horizontal rule) below the header
            var hrElement = document.createElement("hr");
            formContainer.appendChild(hrElement);

            // Limit the number of properties to show
            var propertiesToShow = Object.keys(properties).slice(
              0,
              maxPropertiesToShow
            );

            // Iterate over the properties and add them to the form
            propertiesToShow.forEach(function (prop) {
              var labelElement = document.createElement("label");
              labelElement.textContent = prop;
              var inputElement = document.createElement("input");
              inputElement.setAttribute("readonly", "readonly");
              inputElement.value = properties[prop];
              // Add the label and input elements to the form container
              formContainer.appendChild(labelElement);
              formContainer.appendChild(inputElement);

              // Add a <br> element after the input element
              // var brElement = document.createElement("br");
              // formContainer.appendChild(brElement);
            });

            var existingFormContainer =
              document.querySelector(".form-container");
            existingFormContainer.innerHTML = "";
            existingFormContainer.appendChild(formContainer);
          });
        })
        .catch(function (error) {
          console.error("Error:", error);
        });
    }
  });
}
getInfoBtn.addEventListener("click", function () {
  map.on("click", function (event) {
    // if (!municipalitiesLocal.getVisible()) {
    //   return;
    // }
    getInfo(event);
    const hitTolerance = 10; // Set the hit-detection tolerance in pixels
    const options = {
      hitTolerance: hitTolerance,
      layerFilter: function (layer) {
        // Layer filter function to include only visible layers
        return layer.getVisible();
      },
      checkWrapped: true, // Check for wrapped geometries
    };
    const features = map.getFeaturesAtPixel(event.pixel, options);
    // Assuming you have the form container element
    const formContainer = document.querySelector(".form-container");
    // Set the display property to "block" to show the form
    formContainer.style.display = "block";
  });
});

//MORE RIGHT/LEFT BUTTONS
const rightBtn = document.getElementById("move-right");
const leftBtn = document.getElementById("move-left");

function moveButton(value1, value2, value3) {
  const currentCenter = map.getView().getCenter();

  if (map.getView().getZoom() < 5) {
    // Calculate the new center by moving 1000 meters to the right (east)
    const newCenter = [currentCenter[0] + value1, currentCenter[1]];
    // Set the new center to the map view
    map.getView().setCenter(newCenter);
  } else if (map.getView().getZoom() >= 5 && map.getView().getZoom() < 10) {
    // Calculate the new center by moving 1000 meters to the right (east)
    const newCenter = [currentCenter[0] + value2, currentCenter[1]];
    // Set the new center to the map view
    map.getView().setCenter(newCenter);
  } else if (map.getView().getZoom() >= 10) {
    // Calculate the new center by moving 1000 meters to the right (east)
    const newCenter = [currentCenter[0] + value3, currentCenter[1]];
    // Set the new center to the map view
    map.getView().setCenter(newCenter);
  }
}

rightBtn.addEventListener("click", function () {
  moveButton(100000, 10000, 100);
});

leftBtn.addEventListener("click", function () {
  moveButton(-100000, -10000, -100);
});

//ZOOM-IN/OUT BUTTONS
const zoomInBtn = document.getElementById("zoom-in");
const zoomOutBtn = document.getElementById("zoom-out");

function zoomFunc(value) {
  const view = map.getView();
  const currentZoom = view.getZoom();
  const newZoom = currentZoom + value;
  view.setZoom(newZoom);
  calculateScale();
}

zoomInBtn.addEventListener("click", function () {
  zoomFunc(1);
});
zoomOutBtn.addEventListener("click", function () {
  zoomFunc(-1);
});

//GET XY COORDINATES
const getXYCoordsBtn = document.getElementById("coords");
const coordsModal = document.getElementById("myModal");
const closeModal = document.getElementsByClassName("close")[0];

function decimalToDMS(decimal) {
  const degrees = Math.floor(decimal);
  const minutesDecimal = (decimal - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = (minutesDecimal - minutes) * 60;
  return degrees + "° " + minutes + "' " + seconds.toFixed(2) + "''";
}

function getXY() {
  map.on("click", function (event) {
    const krgjshCoords = event.coordinate;
    // Convert the clicked coordinate to the desired projection (e.g., EPSG:4326)
    const wgs84 = "EPSG:4326";
    const utm34N = "EPSG:32634";

    const transformedCoordinate = transform(
      krgjshCoords,
      map.getView().getProjection(),
      wgs84
    );
    const latitudeDMS = decimalToDMS(transformedCoordinate[0]);
    const longitudeDMS = decimalToDMS(transformedCoordinate[1]);
    const transformedCoordinate2 = transform(
      krgjshCoords,
      map.getView().getProjection(),
      utm34N
    );

    document.getElementById("easting").textContent = krgjshCoords[0].toFixed(2);
    document.getElementById("northing").textContent =
      krgjshCoords[1].toFixed(2);
    document.getElementById("easting1").textContent = latitudeDMS;
    document.getElementById("northing1").textContent = longitudeDMS;
    document.getElementById("easting2").textContent =
      transformedCoordinate2[0].toFixed(2);
    document.getElementById("northing2").textContent =
      transformedCoordinate2[1].toFixed(2);
    // Show the modal
    coordsModal.style.display = "block";
  });
}

closeModal.addEventListener("click", function () {
  coordsModal.style.display = "none";
});

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == coordsModal) {
    coordsModal.style.display = "none";
  }
};
getXYCoordsBtn.addEventListener("click", function () {
  getXY();
});

// Function to calculate and log the scale
function calculateScale() {
  // Get the map's view
  const view = map.getView();
  // Get the resolution of the view (units per pixel)
  const resolution = view.getResolution();

  // Get the units used in the map (e.g., meters, feet)
  const units = view.getProjection().getUnits();

  // Define the number of inches per unit based on your map's projection
  const inchesPerUnit = {
    m: 39.37007874, // Inches per meter
    ft: 12, // Inches per foot
    // Add more conversions as needed for other units
  };

  // Get the dots per inch of your display (e.g., standard is 96 dpi)
  const dpi = 96;

  // Calculate the scale
  const scale = resolution * inchesPerUnit[units] * dpi;
  // Update the input value with the calculated scale
  const scaleInput = document.getElementById("scaleInput");
  scaleInput.value = "1:" + scale.toFixed(0);
}

// Function to set the map scale based on user input
function setMapScale() {
  const inputElement = document.getElementById("scaleInput");
  const scaleValue = inputElement.value.trim();

  // Check if the scaleValue has the correct format "1:xxxxx"
  const scaleRegex = /^1:(\d+)$/;
  const scaleMatch = scaleValue.match(scaleRegex);

  if (scaleMatch) {
    const scaleNumber = parseInt(scaleMatch[1]);

    // Calculate the resolution using the inverse of the formula in calculateScale()
    const view = map.getView();
    const units = view.getProjection().getUnits();
    const inchesPerUnit = {
      m: 39.3701,
      ft: 12,
    };
    const dpi = 96;
    const resolution = scaleNumber / (inchesPerUnit[units] * dpi);

    // Set the calculated resolution to the map view
    view.setResolution(resolution);
  } else {
    console.error("Invalid scale format. Please use the format '1:xxxxx'.");
  }
}

// Add event listener to the input field to set the map scale
const inputElement = document.getElementById("scaleInput");
inputElement.addEventListener("keyup", function (event) {
  if (event.key === "Enter") {
    setMapScale();
  }
});

// Add event listener to the map view to update scale on change
const view = map.getView();
view.on("change", function () {
  calculateScale(); // Call the calculateScale() function to update the scale input
});

calculateScale();
