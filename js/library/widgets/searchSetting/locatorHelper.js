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
    "dojo/_base/array",
    "dojo/dom-class",
    "dojo/query",
    "dojo/string",
    "esri/tasks/locator",
    "esri/tasks/query",
    "dojo/Deferred",
    "dojo/DeferredList",
    "esri/tasks/QueryTask",
    "esri/geometry",
    "esri/graphic",
    "esri/geometry/Point",
    "dojo/text!./templates/searchSettingTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/topic",
    "esri/tasks/BufferParameters",
    "dojo/_base/Color",
    "esri/tasks/GeometryService",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "../carouselContainer/carouselContainer"

], function (declare, domConstruct, domStyle, domAttr, lang, on, array, domClass, query, string, Locator, Query, Deferred, DeferredList, QueryTask, Geometry, Graphic, Point, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic, BufferParameters, Color, GeometryService, SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, CarouselContainer) {
    // ========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,                                  // Variable for template string
        sharedNls: sharedNls,                                      // Variable for shared NLS

        /**
        * careate buffer around pushpin
        * @param {map point}mapPoint Contains the map point on map
        * @param {widgetName}widgetName Contains the name of the functionality from where buffer is created.
        * @memberOf widgets/searchResult/locatorHelper
        */
        createBuffer: function (mapPoint, widgetName) {
            var params, geometryService;
            this.carouselContainer.removeAllPod();
            this.carouselContainer.addPod(this.carouselPodData);
            this.removeBuffer();
            geometryService = new GeometryService(dojo.configData.GeometryService);
            // checking the map point or map point is having geometry and if config data has buffer distance.
            if ((mapPoint || mapPoint.geometry) && dojo.configData.BufferDistance) {
                params = new BufferParameters();
                params.distances = [dojo.configData.BufferDistance];
                params.unit = GeometryService.UNIT_STATUTE_MILE;
                params.bufferSpatialReference = this.map.spatialReference;
                params.outSpatialReference = this.map.spatialReference;
                // checking the geometry
                if (mapPoint.geometry) {
                    params.geometries = [mapPoint.geometry];
                } else {
                    params.geometries = [mapPoint];
                }
                // creating buffer and calling show buffer function.
                geometryService.buffer(params, lang.hitch(this, function (geometries) {
                    this.showBuffer(geometries, mapPoint, widgetName);
                }));
            }
        },

        /**
        * show buffer on map
        * @param {object} geometries of mapPoint
        * @param {map point}mapPoint Contains the map point
        * @memberOf widgets/searchResult/locatorHelper
        */
        showBuffer: function (geometries, mapPoint, widgetName) {
            var bufferSymbol;
            // checking the geolocation variable in the case of share app.
            if (!dojo.sharedGeolocation) {
                this._clearBuffer();
            }
            bufferSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([parseInt(dojo.configData.BufferSymbology.LineSymbolColor.split(",")[0], 10), parseInt(dojo.configData.BufferSymbology.LineSymbolColor.split(",")[1], 10), parseInt(dojo.configData.BufferSymbology.FillSymbolColor.split(",")[2], 10), parseFloat(dojo.configData.BufferSymbology.LineSymbolTransparency.split(",")[0], 10)]), 2
                        ),
                        new Color([parseInt(dojo.configData.BufferSymbology.FillSymbolColor.split(",")[0], 10), parseInt(dojo.configData.BufferSymbology.FillSymbolColor.split(",")[1], 10), parseInt(dojo.configData.BufferSymbology.LineSymbolColor.split(",")[2], 10), parseFloat(dojo.configData.BufferSymbology.FillSymbolTransparency.split(",")[0], 10)])
                        );
            // Adding graphic on map
            this._addGraphic(this.map.getLayer("tempBufferLayer"), bufferSymbol, geometries[0]);
            topic.publish("showProgressIndicator");
            // Querying for layer to find features.
            this._queryLayer(geometries[0], mapPoint, widgetName);
        },

        /**
        * clear buffer from map
        * @memberOf widgets/searchResult/locatorHelper
        */
        _clearBuffer: function () {
            this.map.getLayer("tempBufferLayer").clear();
            topic.publish("hideInfoWindow");
            this.isInfowindowHide = true;
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
            //checking the extenct changed variable in the case of shared app to maintain extent on map
            if (window.location.href.toString().split("$extentChanged=").length > 1) {
                // if extent change variable set to be true then set the extent other wise don't do any thing.
                if (this.isExtentSet) {
                    this.map.setExtent(point.getExtent().expand(1.6));
                }
            } else {
                // In normal scenario set extent when graphics is added.
                this.map.setExtent(point.getExtent().expand(1.6));
            }

        },

        /**
        * query layer URL
        * create an object of graphic
        * @param {object} geometry of graphic
        * @param {map point}mapPoint Contains the map point
        * @param {widget}name of the functionality from query layer is called.
        * @memberOf widgets/searchResult/locatorHelper
        */
        _queryLayer: function (geometry, mapPoint, widget) {
            var layerobject, i, deferredArray = [], result = [];
            // validate selectedLayerTitle for querying on each layer configured, for finding facility within the buffer.
            if (this.selectedLayerTitle) {
                // Looping each layer for query
                array.forEach(dojo.configData.SearchSettings, lang.hitch(this, function (SearchSettings) {
                    // Checking search display title for getting layer.
                    if (SearchSettings.SearchDisplayTitle === this.selectedLayerTitle) {
                        layerobject = SearchSettings;
                        // Query on layer for facility.
                        this._queryLayerForFacility(layerobject, widget, geometry, deferredArray, mapPoint, result);
                    }
                }));
            } else {
                // Looping on each layer for finding facility within the buffer.
                for (i = 0; i < dojo.configData.SearchSettings.length; i++) {
                    layerobject = dojo.configData.SearchSettings[i];
                    this._queryLayerForFacility(layerobject, widget, geometry, deferredArray, mapPoint, result);
                }
            }
        },

        /**
        * query layer URL for facilty
        * finding route from start point to the nearest feature
        * @param {layerobject} contains the layer information
        * @param {widget} contains name of the functionality from query is called.
        * @param {geometry} contains the geometry
        * @param {deferredArray} contains deffered array for further operation
        * @param {map point}mapPoint Contains the map point
        * @param {result} result array to contain feature data
        * @memberOf widgets/searchResult/locatorHelper
        */
        _queryLayerForFacility: function (layerobject, widget, geometry, deferredArray, mapPoint, result) {
            var queryTask, queryLayer, featuresWithinBuffer = [], dist, featureSet, i, widgetName, deferredListResult, isDistanceFound, layerObject, j, k, routeObject;
            featureSet = [];
            isDistanceFound = false;
            // Check the functionality name from query is called, if not available the set default name for further operation
            if (widget) {
                widgetName = widget;
            } else {
                widgetName = "unifiedSearch";
            }
            // Checking the query url availablity
            if (layerobject.QueryURL) {
                queryTask = new esri.tasks.QueryTask(layerobject.QueryURL);
                queryLayer = new esri.tasks.Query();
                queryLayer.outFields = ["*"];
                queryLayer.returnGeometry = true;
                // Checking the geometry
                if (geometry) {
                    queryLayer.geometry = geometry;
                }
                layerObject = {};
                // Pushing the query task in deferred array for further query
                deferredArray.push(queryTask.execute(queryLayer, lang.hitch(this, function (records) {
                    layerObject = { "queryURL": layerobject.QueryURL, "records": records };
                    // If feature is available the push data in result.
                    if (records.features.length > 0) {
                        result.push(layerObject);
                    }
                })));
                // creating deferred list
                deferredListResult = new DeferredList(deferredArray);
                // Calling deferred list when all query is completed.
                deferredListResult.then(lang.hitch(this, function (relatedRecords) {
                    // loopint the result for getting records and pusing it in a variable for further query
                    for (j = 0; j < result.length; j++) {
                        if (result.length > 0) {
                            this.dateFieldArray = this._getDateField(result[j].records);
                            for (k = 0; k < result[j].records.features.length; k++) {
                                featuresWithinBuffer.push(result[j].records.features[k]);
                            }
                        }
                    }
                    // Loopint final array for finding distance from start point and calculating route.
                    for (i = 0; i < featuresWithinBuffer.length; i++) {
                        // Checking the geometry
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
                    // If distance is calculated from the start point
                    if (isDistanceFound) {
                        featureSet.sort(function (a, b) {
                            return parseFloat(a.distance) - parseFloat(b.distance);
                        });
                        // loopint the result data for sorting data by distance
                        array.forEach(result, lang.hitch(this, function (resultSet) {
                            resultSet.records.features.sort(function (a, b) {
                                return parseFloat(a.distance) - parseFloat(b.distance);
                            });
                        }));
                        this.highlightFeature(featureSet[0].geometry);
                        // Changing date formate for feature if date field is available.
                        featureSet = this._changeDateFormatForActivity(featureSet);
                        routeObject = { "StartPoint": mapPoint, "EndPoint": featureSet, "Index": 0, "WidgetName": widgetName, "QueryURL": layerobject.QueryURL, "activityData": result };
                        //Calling route function to create route
                        this.showRoute(routeObject);
                    }
                    // Checking result array length, if it is 0 then show message and hide carousel container and remove graphics
                    if (result.length === 0) {
                        alert(sharedNls.errorMessages.facilitydoestfound);
                        dojo.eventInfoWindowData = null;
                        dojo.infoRoutePoint = null;
                        this.removeHighlightedCircleGraphics();
                        if (widgetName !== "unifiedSearch") {
                            this.removeLocatorPushPin();
                        }
                        this.carouselContainer.hideCarouselContainer();
                        this.carouselContainer._setLegendPositionDown();
                    }

                }));
                topic.publish("hideProgressIndicator");
            }
        }
    });
});
