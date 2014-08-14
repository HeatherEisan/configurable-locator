/*global dojo,define,require,esri */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true,indent:4 */
/*
| Copyright 2013 Esri
|
| Licensed under the Apache License, Version 2.0 (the "License");
| you may not use this file except in compliance with the License.
| You may obtain a copy of the License at
|
|    http://www.apache.org/licenses/LICENSE-2.0
|
| Unless required by applicable law or agreed to in writing, software
| distributed under the License is distributed on an "AS IS" BASIS,
| WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
| See the License for the specific language governing permissions and
| limitations under the License.
*/
//============================================================================================================================//

require([
    "esri/map",
    "esri/layers/ImageServiceParameters",
    "esri/layers/ArcGISImageServiceLayer",
    "../../../../config.js",
    "esri/symbols/PictureMarkerSymbol",
    "esri/layers/FeatureLayer",
    "dojo/_base/Color",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/geometry/Polyline"

], function (esriMap, ImageServiceParameters, ArcGISImageServiceLayer, config, PictureMarkerSymbol, FeatureLayer, Color, SimpleLineSymbol, SimpleFillSymbol, Polyline) {
    /**
    * create print  widget
    *
    * @class
    * @name widgets/printMap/print
    */

    var window_opener = window.dialogArguments, tempBuffer = 'tempBuffer', printmap, params = dojo.byId("paramid"), GraphicLayer, bufferLayer, initialExtent, baseMapLayer, routeLayer, imageServiceLayer, highlightedLayer, highLightsymbol,
        gLayer, i, j, buffersymbol, polygon, geoLocationPushpin, locatorMarkupSymbol, graphic, layerMode, featureLayer, symbols, polyline;
    GraphicLayer = window_opener.GraphicLayer;
    bufferLayer = window_opener.Bufferlayer;
    baseMapLayer = window_opener.BaseMapLayer;
    initialExtent = window_opener.Extent;
    routeLayer = window_opener.RouteLayer;
    highlightedLayer = window_opener.HighlightedLayer;
    printmap = new esri.Map("mapPrint", { extent: initialExtent, slider: false });
    baseMapLayer = new esri.layers.ArcGISTiledMapServiceLayer(baseMapLayer.url);
    printmap.addLayer(baseMapLayer);
    params = new ImageServiceParameters();
    params.format = "PNG24";
    imageServiceLayer = new ArcGISImageServiceLayer(baseMapLayer.url, { imageServiceParameters: params });
    printmap.addLayer(imageServiceLayer);
    document.title = config.ApplicationName;
    /**
    routeLayer.graphics[0].geometry

    * function to add polygon and graphics in the print map window when it gets open
    * @memberOf widgets/printMap/print
    */
    dojo.connect(printmap, "onLoad", function () {

        printmap.disablePan();
        printmap.disableDoubleClickZoom();
        printmap.disableKeyboardNavigation();
        printmap.disableScrollWheelZoom();
        gLayer = new esri.layers.GraphicsLayer();
        gLayer.id = tempBuffer;
        for (i = 0; i < bufferLayer.graphics.length; i++) {
            buffersymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([parseInt(config.BufferSymbology.LineSymbolColor.split(",")[0], 10), parseInt(config.BufferSymbology.LineSymbolColor.split(",")[1], 10), parseInt(config.BufferSymbology.FillSymbolColor.split(",")[2], 10), parseFloat(config.BufferSymbology.FillSymbolTransparency.split(",")[0], 10)]), 2
                ),
                new Color([parseInt(config.BufferSymbology.FillSymbolColor.split(",")[0], 10), parseInt(config.BufferSymbology.FillSymbolColor.split(",")[1], 10), parseInt(config.BufferSymbology.LineSymbolColor.split(",")[2], 10), parseFloat(config.BufferSymbology.LineSymbolTransparency.split(",")[0], 10)])
                );
            polygon = new esri.geometry.Polygon(bufferLayer.graphics[i].geometry.toJson());
            gLayer.add(new esri.Graphic(polygon, buffersymbol));
        }
        geoLocationPushpin = window.dialogArguments.dojoConfig + config.LocatorSettings.DefaultLocatorSymbol;
        locatorMarkupSymbol = new PictureMarkerSymbol(geoLocationPushpin, config.LocatorSettings.MarkupSymbolSize.width, config.LocatorSettings.MarkupSymbolSize.height);
        graphic = new esri.Graphic(GraphicLayer.graphics[0].geometry, locatorMarkupSymbol, null, null);
        gLayer.add(graphic);
        highLightsymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, config.locatorRippleSize, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                            new dojo.Color(config.RippleColor), 4), new dojo.Color([0, 0, 0, 0]));
        gLayer.add(new esri.Graphic(highlightedLayer.graphics[0].geometry, highLightsymbol, {}, null));
        for (j = 0; j < config.OperationalLayers.length; j++) {
            layerMode = null;
            if (config.OperationalLayers[j].LoadAsServiceType.toLowerCase() === "feature") {
                /**
                * set layerMode of the operational layer if it's type is feature
                */
                switch (config.OperationalLayers[j].layermode && config.OperationalLayers[j].layermode.toLowerCase()) {
                case "ondemand":
                    layerMode = FeatureLayer.MODE_ONDEMAND;
                    break;
                case "selection":
                    layerMode = FeatureLayer.MODE_SELECTION;
                    break;
                default:
                    layerMode = FeatureLayer.MODE_SNAPSHOT;
                    break;
                }
                /**
                * load operational layer if it's type is feature along with its layer mode
                */
                featureLayer = new FeatureLayer(config.OperationalLayers[j].ServiceURL, {
                    id: "index",
                    mode: layerMode,
                    outFields: ["*"],
                    displayOnPan: false
                });
            }
        }
        printmap.addLayer(featureLayer);
        symbols = new SimpleLineSymbol().setColor(config.RouteColor).setWidth(config.RouteWidth);
        polyline = new Polyline(routeLayer.graphics[0].geometry.toJson());
        gLayer.add(new esri.Graphic(polyline, symbols));
        printmap.addLayer(gLayer);
        window.print();
    });
});
