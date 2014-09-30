/*global define,dojo,dojoConfig:true,alert,esri,Modernizr */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true,indent:4 */
/** @license
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
define([
    "dojo/_base/declare",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/dom-geometry",
    "dojo/dom",
    "dojo/_base/array",
    "dojo/dom-class",
    "dojo/query",
    "dojo/string",
    "esri/tasks/locator",
    "esri/tasks/query",
    "../scrollBar/scrollBar",
    "dojo/Deferred",
    "dojo/DeferredList",
    "esri/tasks/QueryTask",
    "esri/geometry",
    "esri/graphic",
    "esri/layers/GraphicsLayer",
    "esri/symbols/PictureMarkerSymbol",
    "esri/geometry/Point",
    "dojo/text!./templates/searchSettingTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/topic",
    "esri/urlUtils",
    "esri/SpatialReference",
    "esri/tasks/BufferParameters",
    "dojo/_base/Color",
    "esri/tasks/GeometryService",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/units",
    "../carouselContainer/carouselContainer"

], function (declare, domConstruct, domStyle, domAttr, lang, on, domGeom, dom, array, domClass, query, string, Locator, Query, ScrollBar, Deferred, DeferredList, QueryTask, Geometry, Graphic, GraphicsLayer, PictureMarkerSymbol, Point, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic, urlUtils, SpatialReference, BufferParameters, Color, GeometryService, SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, units, CarouselContainer) {
    // ========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,

        /**
        * careate buffer around pushpin
        * @param {map point}mapPoint Contains the map point
        * @memberOf widgets/searchResult/locatorHelper
        */
        createBuffer: function (mapPoint) {
            var params, geometryService;
            this.carouselContainer.removeAllPod();
            this.carouselContainer.addPod(this.carouselPodData);
            geometryService = new GeometryService(dojo.configData.GeometryService);
            if (mapPoint.geometry && dojo.configData.BufferDistance) {
                params = new BufferParameters();
                params.distances = [dojo.configData.BufferDistance];
                params.unit = GeometryService.UNIT_STATUTE_MILE;
                params.bufferSpatialReference = this.map.spatialReference;
                params.outSpatialReference = this.map.spatialReference;
                params.geometries = [mapPoint.geometry];
                geometryService.buffer(params, lang.hitch(this, function (geometries) {
                    this.showBuffer(geometries, mapPoint);
                }));
            }
        },

        /**
        * show buffer on map
        * @param {object} geometries of mapPoint
        * @param {map point}mapPoint Contains the map point
        * @memberOf widgets/searchResult/locatorHelper
        */
        showBuffer: function (geometries, mapPoint) {
            var bufferSymbol;
            this._clearBuffer();
            bufferSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([parseInt(dojo.configData.BufferSymbology.LineSymbolColor.split(",")[0], 10), parseInt(dojo.configData.BufferSymbology.LineSymbolColor.split(",")[1], 10), parseInt(dojo.configData.BufferSymbology.FillSymbolColor.split(",")[2], 10), parseFloat(dojo.configData.BufferSymbology.LineSymbolTransparency.split(",")[0], 10)]), 2
                        ),
                        new Color([parseInt(dojo.configData.BufferSymbology.FillSymbolColor.split(",")[0], 10), parseInt(dojo.configData.BufferSymbology.FillSymbolColor.split(",")[1], 10), parseInt(dojo.configData.BufferSymbology.LineSymbolColor.split(",")[2], 10), parseFloat(dojo.configData.BufferSymbology.FillSymbolTransparency.split(",")[0], 10)])
                        );
            this._addGraphic(this.map.getLayer("tempBufferLayer"), bufferSymbol, geometries[0]);
            topic.publish("showProgressIndicator");
            this._queryLayer(geometries[0], mapPoint);
        },

        /**
        * clear buffer from map
        * @memberOf widgets/searchResult/locatorHelper
        */
        _clearBuffer: function () {
            this.map.getLayer("tempBufferLayer").clear();
        },

        /**
        * add graphic layer on map of buffer and set expand
        * @param {object} layer Contains feature layer
        * @param {object} symbol Contains graphic
        * @param {map point}point Contains the map point
        * @memberOf widgets/searchResult/locatorHelper
        */
        _addGraphic: function (layer, symbol, point) {
            var graphic;
            graphic = new Graphic(point, symbol);
            layer.add(graphic);
            this.map.setExtent(point.getExtent().expand(1.6));
        },

        /**
        * query layer URL
        * create an object of graphic
        * @param {object} geometry of graphic
        * @param {map point}mapPoint Contains the map point
        * @memberOf widgets/searchResult/locatorHelper
        */
        _queryLayer: function (geometry, mapPoint) {
            var queryTask, queryLayer, routeObject, featuresWithinBuffer, layerobject, dist, featureSet, isDistanceFound, widgetName, i;
            featureSet = [];
            isDistanceFound = false;
            widgetName = "unifiedSearch";
            layerobject = dojo.configData.ActivitySearchSettings;
            array.forEach(dojo.configData.ActivitySearchSettings, lang.hitch(this, function (activitySearchSettings) {
                layerobject = activitySearchSettings;
                if (layerobject.QueryURL) {
                    queryTask = new esri.tasks.QueryTask(layerobject.QueryURL);
                    queryLayer = new esri.tasks.Query();
                    queryLayer.outFields = ["*"];
                    queryLayer.returnGeometry = true;
                    if (geometry) {
                        queryLayer.geometry = geometry;
                    }
                    queryTask.execute(queryLayer, lang.hitch(this, function (relatedRecords) {
                        if (relatedRecords.features.length !== 0) {
                            featuresWithinBuffer = relatedRecords.features;
                            for (i = 0; i < featuresWithinBuffer.length; i++) {
                                if (mapPoint.geometry) {
                                    dist = this.getDistance(mapPoint.geometry, featuresWithinBuffer[i].geometry);
                                    isDistanceFound = true;
                                }
                                try {
                                    featureSet[i] = featuresWithinBuffer[i];
                                    featuresWithinBuffer[i].distance = dist.toString();
                                } catch (err) {
                                    alert(sharedNls.errorMessages.falseConfigParams);
                                }
                            }
                            if (isDistanceFound) {
                                featureSet.sort(function (a, b) {
                                    return parseFloat(a.distance) - parseFloat(b.distance);
                                });
                                this.highlightFeature(featureSet[0].geometry);
                                routeObject = { "StartPoint": mapPoint, "EndPoint": featureSet, "Index": 0, "WidgetName": widgetName, "QueryURL": layerobject.QueryURL };
                                this.showRoute(routeObject);
                            }
                        } else {
                            alert(sharedNls.errorMessages.facilitydoestfound);
                            this.removeGraphics();
                            if (widgetName !== "unifiedSearch") {
                                this.removeLocatorPushPin();
                            }
                            this.carouselContainer.hideCarouselContainer();
                            this.carouselContainer._setLegendPositionDown();
                        }
                        topic.publish("hideProgressIndicator");
                    }));
                }
            }));
        }
    });
});

