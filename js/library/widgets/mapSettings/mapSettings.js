/*global define,dojo,dojoConfig,alert,esri,window,setTimeout,clearTimeout */
/*jslint sloppy:true,nomen:true,plusplus:true,unparam:true */  //
/** @license
| Version 10.2
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
    "dojo/_base/lang",
    "esri/arcgis/utils",
    "dojo/_base/array",
    "dojo/dom",
    "dojo/dom-attr",
    "dojo/query",
    "dojo/dom-class",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "esri/map",
    "esri/layers/ImageParameters",
    "esri/layers/FeatureLayer",
    "esri/layers/GraphicsLayer",
    "esri/symbols/SimpleLineSymbol",
    "esri/renderers/SimpleRenderer",
    "dojo/_base/Color",
    "widgets/baseMapGallery/baseMapGallery",
    "widgets/legends/legends",
    "esri/geometry/Extent",
    "esri/dijit/HomeButton",
    "dojo/Deferred",
    "dojo/DeferredList",
    "widgets/infoWindow/infoWindow",
    "dojo/text!../infoWindow/templates/infoWindow.html",
    "dojo/topic",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "dojo/domReady!"
], function (declare, domConstruct, domStyle, lang, esriUtils, array, dom, domAttr, query, domClass, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, esriMap, ImageParameters, FeatureLayer, GraphicsLayer, SimpleLineSymbol, SimpleRenderer, Color, BaseMapGallery, Legends, GeometryExtent, HomeButton, Deferred, DeferredList, InfoWindow, template, topic, ArcGISDynamicMapServiceLayer) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        map: null,
        templateString: template,
        tempGraphicsLayerId: "esriGraphicsLayerMapSettings",
        sharedNls: sharedNls,
        stagedSearch: null,
        infoWindowPanel: null,
        tempBufferLayerId: "tempBufferLayer",
        highlightLayerId: "highlightLayerId",
        routeLayerId: "routeLayerId",
        featureLayerId: "index",



        /**
        * initialize map object
        *
        * @class
        * @name widgets/mapSettings/mapSettings
        */
        postCreate: function () {
            var mapDeferred, layer;
            topic.subscribe("setInfoWindowOnMap", lang.hitch(this, function (infoTitle, mobTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight, count) {
                this._onSetInfoWindowPosition(infoTitle, mobTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight, count);
            }));

            /**
            * load map
            * @param {string} dojo.configData.BaseMapLayers Basemap settings specified in configuration file
            */
            this.infoWindowPanel = new InfoWindow({ infoWindowWidth: dojo.configData.InfoPopupWidth, infoWindowHeight: dojo.configData.InfoPopupHeight });

            if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length !== 0) {
                mapDeferred = esriUtils.createMap(dojo.configData.WebMapId, "esriCTParentDivContainer", {
                    mapOptions: {
                        slider: true
                    },
                    ignorePopups: true
                });
                mapDeferred.then(lang.hitch(this, function (response) {
                    this.map = response.map;
                    if (response.itemInfo.itemData.baseMap.baseMapLayers && response.itemInfo.itemData.baseMap.baseMapLayers[0].id) {
                        if (response.itemInfo.itemData.baseMap.baseMapLayers[0].id !== "defaultBasemap") {
                            this.map.getLayer(response.itemInfo.itemData.baseMap.baseMapLayers[0].id).id = "defaultBasemap";
                            this.map._layers.defaultBasemap = this.map.getLayer(response.itemInfo.itemData.baseMap.baseMapLayers[0].id);
                            delete this.map._layers[response.itemInfo.itemData.baseMap.baseMapLayers[0].id];
                            this.map.layerIds[0] = "defaultBasemap";
                        }
                    }
                    topic.publish("setMap", this.map);
                    topic.publish("hideProgressIndicator");
                    this._generateLayerURL(response.itemInfo.itemData.operationalLayers);
                    this._addLayerLegend();
                    this._mapOnLoad();
                    this._mapEvents();
                    this.stagedSearch = setTimeout(lang.hitch(this, function () {
                        this._addLayerLegendWebmap(response);
                    }), 3000);

                }));
            } else {
                this._generateLayerURL(dojo.configData.OperationalLayers);
                this.map = esriMap("esriCTParentDivContainer", {
                });
                if (dojo.configData.BaseMapLayers[0].length > 1) {
                    array.forEach(dojo.configData.BaseMapLayers[0], lang.hitch(this, function (basemapLayer, index) {
                        layer = new esri.layers.ArcGISTiledMapServiceLayer(basemapLayer.MapURL, { id: "defaultBasemap" + index, visible: true });
                        this.map.addLayer(layer);
                    }));
                } else {
                    layer = new esri.layers.ArcGISTiledMapServiceLayer(dojo.configData.BaseMapLayers[0].MapURL, { id: "defaultBasemap", visible: true });
                    this.map.addLayer(layer, 0);
                }

                this.map.on("load", lang.hitch(this, function () {

                    this._mapOnLoad();
                }));
                this._mapEvents();
            }
        },

        _mapEvents: function () {
            this.map.on("extent-change", lang.hitch(this, function () {
                topic.publish("setMapTipPosition", dojo.selectedMapPoint, this.map, this.infoWindowPanel);
            }));
        },

        /**
        * initialize map object when map is loading
        * @memberOf widgets/mapSettings/mapSettings
        */
        _mapOnLoad: function () {
            var home, extentPoints, mapDefaultExtent, i, graphicsLayer, buffergraphicsLayer, extent, routegraphicsLayer;
            extentPoints = dojo.configData && dojo.configData.DefaultExtent && dojo.configData.DefaultExtent.split(",");
            extent = this._getQueryString('extent');
            if (extent === "") {
                if (!dojo.configData.WebMapId) {
                    mapDefaultExtent = new GeometryExtent({ "xmin": parseFloat(extentPoints[0]), "ymin": parseFloat(extentPoints[1]), "xmax": parseFloat(extentPoints[2]), "ymax": parseFloat(extentPoints[3]), "spatialReference": { "wkid": this.map.spatialReference.wkid } });
                    this.map.setExtent(mapDefaultExtent);
                }
            } else {
                mapDefaultExtent = extent.split(',');
                mapDefaultExtent = new GeometryExtent({ "xmin": parseFloat(mapDefaultExtent[0]), "ymin": parseFloat(mapDefaultExtent[1]), "xmax": parseFloat(mapDefaultExtent[2]), "ymax": parseFloat(mapDefaultExtent[3]), "spatialReference": { "wkid": this.map.spatialReference.wkid } });
                this.map.setExtent(mapDefaultExtent);
            }
            /**
            * load esri 'Home Button' widget
            */
            home = this._addHomeButton();
            home.extent = mapDefaultExtent;
            domConstruct.place(home.domNode, query(".esriSimpleSliderIncrementButton")[0], "after");
            home.startup();

            if (dojo.configData.CustomLogoUrl && lang.trim(dojo.configData.CustomLogoUrl).length !== 0) {
                domConstruct.create("img", { "src": dojoConfig.baseURL + dojo.configData.CustomLogoUrl, "class": "esriCTMapLogo" }, dom.byId("esriCTParentDivContainer"));
            }
            if (!dojo.configData.WebMapId) {
                for (i in dojo.configData.OperationalLayers) {
                    if (dojo.configData.OperationalLayers.hasOwnProperty(i)) {
                        this._addOperationalLayerToMap(i, dojo.configData.OperationalLayers[i]);
                    }
                }

                if (dojo.configData.BaseMapLayers.length > 1) {
                    this._showBasMapGallery();
                }
            }
            graphicsLayer = new GraphicsLayer();
            graphicsLayer.id = this.tempGraphicsLayerId;
            this.map.addLayer(graphicsLayer);
            buffergraphicsLayer = new GraphicsLayer();
            buffergraphicsLayer.id = this.tempBufferLayerId;
            this.map.addLayer(buffergraphicsLayer);
            this._addLayerLegend();
            routegraphicsLayer = new GraphicsLayer();
            routegraphicsLayer.id = this.routeLayerId;
            this.map.addLayer(routegraphicsLayer);
            this._showBasMapGallery();

            graphicsLayer.on("graphic-add", lang.hitch(this, function (feature) {
                topic.publish("doBufferHandler", feature);
            }));
        },

        /**
        * set infowindow position
        * @memberOf widgets/mapSettings/mapSettings
        */
        _onSetInfoWindowPosition: function (infoTitle, mobTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight) {
            this.infoWindowPanel.resize(infoPopupWidth, infoPopupHeight);
            this.infoWindowPanel.hide();
            this.infoWindowPanel.setTitle(infoTitle);
            this.infoWindowPanel.show(divInfoDetailsTab, screenPoint);
        },

        _showInfoWindowOnMap: function (mapPoint) {
            var index, deferredListResult,
                onMapFeaturArray = [],
                featureArray = [];

            this.counter = 0;
            for (index = 0; index < dojo.configData.SearchSettings.length; index++) {
                this._executeQueryTask(index, mapPoint, onMapFeaturArray);
            }
            deferredListResult = new DeferredList(onMapFeaturArray);
            deferredListResult.then(lang.hitch(this, function (result) {
                var j, i;

                if (result) {
                    for (j = 0; j < result.length; j++) {
                        if (result[j][0] === true) {
                            if (result[j][1].features.length > 0) {
                                for (i = 0; i < result[j][1].features.length; i++) {
                                    featureArray.push({
                                        attr: result[j][1].features[i],
                                        layerId: j,
                                        fields: result[j][1].fields
                                    });
                                }
                            }
                        }
                    }
                    this._fetchQueryResults(featureArray);
                }
            }), function (err) {
                alert(err.message);
            });
        },

        /**
        * execute query for the layer
        * @memberOf widgets/mapSettings/mapSettings
        */
        _executeQueryTask: function (index, mapPoint, onMapFeaturArray) {
            var queryTask, queryLayer, queryOnRouteTask;
            queryTask = new esri.tasks.QueryTask(dojo.configData.SearchSettings[index].QueryURL);
            queryLayer = new esri.tasks.Query();
            queryLayer.outSpatialReference = this.map.spatialReference;
            queryLayer.returnGeometry = true;
            queryLayer.maxAllowableOffset = 100;
            queryLayer.geometry = this._extentFromPoint(mapPoint);
            queryLayer.outFields = ["*"];
            queryOnRouteTask = queryTask.execute(queryLayer, lang.hitch(this, function (results) {
                var deferred = new Deferred();
                deferred.resolve(results);
                return deferred.promise;
            }), function (err) {
                alert(err.message);
            });
            onMapFeaturArray.push(queryOnRouteTask);
        },

        _extentFromPoint: function (point) {
            var tolerance, screenPoint, pnt1, pnt2, mapPoint1, mapPoint2;
            tolerance = 3;
            screenPoint = this.map.toScreen(point);
            pnt1 = new esri.geometry.Point(screenPoint.x - tolerance, screenPoint.y + tolerance);
            pnt2 = new esri.geometry.Point(screenPoint.x + tolerance, screenPoint.y - tolerance);
            mapPoint1 = this.map.toMap(pnt1);
            mapPoint2 = this.map.toMap(pnt2);
            return new esri.geometry.Extent(mapPoint1.x, mapPoint1.y, mapPoint2.x, mapPoint2.y, this.map.spatialReference);
        },

        _fetchQueryResults: function (featureArray) {
            var _this = this;

            if (featureArray.length > 0) {
                if (featureArray.length === 1) {
                    domClass.remove(query(".esriCTInfoWindowRightArrow")[0], "esriCTShowInfoRightArrow");
                    topic.publish("createInfoWindowContent", featureArray[0].attr.geometry, featureArray[0].attr.attributes, featureArray[0].fields, featureArray[0].layerId, null, null, false);
                } else {
                    this.count = 0;
                    domAttr.set(query(".esriCTdivInfoTotalFeatureCount")[0], "innerHTML", '/' + featureArray.length);
                    topic.publish("createInfoWindowContent", featureArray[0].attr.geometry, featureArray[0].attr.attributes, featureArray[0].fields, featureArray[0].layerId, featureArray, this.count, false);
                    topic.publish("hideProgressIndicator");
                    query(".esriCTInfoWindowRightArrow")[0].onclick = function () {
                        _this._nextInfoContent(featureArray);
                    };
                    query(".esriCTInfoWindowLeftArrow")[0].onclick = function () {
                        _this._previousInfoContent(featureArray);
                    };
                }
            } else {
                topic.publish("hideProgressIndicator");
            }
        },

        _nextInfoContent: function (featureArray) {
            if (this.count < featureArray.length) {
                this.count++;
            }
            if (featureArray[this.count]) {
                topic.publish("createInfoWindowContent", featureArray[0].attr.geometry, featureArray[this.count].attr.attributes, featureArray[this.count].fields, featureArray[this.count].layerId, featureArray, this.count, false);
            }
        },

        _previousInfoContent: function (featureArray) {
            if (this.count !== 0 && this.count < featureArray.length) {
                this.count--;
            }
            if (featureArray[this.count]) {
                topic.publish("createInfoWindowContent", featureArray[0].attr.geometry, featureArray[this.count].attr.attributes, featureArray[this.count].fields, featureArray[this.count].layerId, featureArray, this.count, false);
            }
        },

        _getQueryString: function (key) {
            var extentValue = "", regex, qs;
            regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
            qs = regex.exec(window.location.href);
            if (qs && qs.length > 0) {
                extentValue = qs[1];
            }
            return extentValue;
        },

        _generateLayerURL: function (operationalLayers) {
            var infoWindowSettings, searchSettings, i, str, layerTitle, layerId, index, infoIndex;

            infoWindowSettings = dojo.configData.InfoWindowSettings;
            searchSettings = dojo.configData.SearchSettings;
            for (i = 0; i < operationalLayers.length; i++) {
                if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length !== 0) {
                    str = operationalLayers[i].url.split('/');
                    layerTitle = str[str.length - 3];
                    layerId = str[str.length - 1];
                    for (index = 0; index < searchSettings.length; index++) {
                        if (searchSettings[index].Title && searchSettings[index].QueryLayerId) {
                            if (layerTitle === searchSettings[index].Title && layerId === searchSettings[index].QueryLayerId) {
                                searchSettings[index].QueryURL = str.join("/");
                            }
                        }
                    }
                    for (infoIndex = 0; infoIndex < infoWindowSettings.length; infoIndex++) {
                        if (infoWindowSettings[infoIndex].Title && infoWindowSettings[infoIndex].QueryLayerId) {
                            if (layerTitle === infoWindowSettings[infoIndex].Title && layerId === infoWindowSettings[infoIndex].QueryLayerId) {
                                infoWindowSettings[infoIndex].InfoQueryURL = str.join("/");
                            }
                        }
                    }
                } else {
                    if (operationalLayers[i].ServiceURL) {
                        str = operationalLayers[i].ServiceURL.split('/');
                        layerTitle = str[str.length - 3];
                        layerId = str[str.length - 1];
                        for (index = 0; index < searchSettings.length; index++) {
                            if (searchSettings[index].Title && searchSettings[index].QueryLayerId) {
                                if (layerTitle === searchSettings[index].Title && layerId === searchSettings[index].QueryLayerId) {
                                    searchSettings[index].QueryURL = str.join("/");
                                }
                            }
                        }
                        for (infoIndex = 0; infoIndex < infoWindowSettings.length; infoIndex++) {
                            if (infoWindowSettings[infoIndex].Title && infoWindowSettings[infoIndex].QueryLayerId) {
                                if (layerTitle === infoWindowSettings[infoIndex].Title && layerId === infoWindowSettings[infoIndex].QueryLayerId) {
                                    infoWindowSettings[infoIndex].InfoQueryURL = str.join("/");
                                }
                            }
                        }
                    }
                }
            }
        },

        /**
        * load esri 'Home Button' widget which sets map extent to default extent
        * @return {object} Home button widget
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addHomeButton: function () {
            var home;
            home = new HomeButton({
                map: this.map
            }, domConstruct.create("div", {}, null));
            return home;
        },

        _showBasMapGallery: function () {
            var basMapGallery = new BaseMapGallery({
                map: this.map
            }, domConstruct.create("div", {}, null));
            return basMapGallery;
        },

        /**
        * load and add operational layers depending on their LoadAsServiceType specified in configuration file
        * @param {int} index Layer order specified in configuration file
        * @param {object} layerInfo Layer settings specified in configuration file
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addOperationalLayerToMap: function (index, layerInfo) {
            var layerMode, featureLayer;
            layerMode = null;
            if (layerInfo.LoadAsServiceType.toLowerCase() === "feature") {

                /**
                * set layerMode of the operational layer if it's type is feature
                */
                switch (layerInfo.layermode && layerInfo.layermode.toLowerCase()) {
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
                featureLayer = new FeatureLayer(layerInfo.ServiceURL, {
                    id: "index",
                    mode: layerMode,
                    outFields: ["*"],
                    displayOnPan: false
                });
                this.map.addLayer(featureLayer);
            } else if (layerInfo.LoadAsServiceType.toLowerCase() === "dynamic") {
                this._addDynamicLayerService(layerInfo);
            }
        },

        /**
        * load the layer as dynamic service type
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addDynamicLayerService: function (layerInfo) {
            var str, lastIndex, layerTitle;

            clearTimeout(this.stagedSearch);
            str = layerInfo.ServiceURL.split('/');
            lastIndex = str[str.length - 1];
            if (isNaN(lastIndex) || lastIndex === "") {
                if (lastIndex === "") {
                    layerTitle = str[str.length - 3];
                } else {
                    layerTitle = str[str.length - 2];
                }
            } else {
                layerTitle = str[str.length - 3];
            }
            this.stagedSearch = setTimeout(lang.hitch(this, function () {
                this._addServiceLayers(layerTitle, layerInfo.ServiceURL);
            }), 500);
        },

        _addServiceLayers: function (layerId, layerURL) {
            var dynamicLayer, imageParams, lastIndex, dynamicLayerId;
            imageParams = new ImageParameters();
            lastIndex = layerURL.lastIndexOf('/');
            dynamicLayerId = layerURL.substr(lastIndex + 1);
            if (isNaN(dynamicLayerId) || dynamicLayerId === "") {
                if (isNaN(dynamicLayerId)) {
                    dynamicLayer = layerURL + "/";
                } else if (dynamicLayerId === "") {
                    dynamicLayer = layerURL;
                }
                this._createDynamicServiceLayer(dynamicLayer, imageParams, layerId);
            } else {
                imageParams.layerIds = [dynamicLayerId];
                dynamicLayer = layerURL.substring(0, lastIndex);
                this._createDynamicServiceLayer(dynamicLayer, imageParams, layerId);
            }
        },

        _createDynamicServiceLayer: function (dynamicLayer, imageParams, layerId) {
            var dynamicMapService;
            dynamicMapService = new ArcGISDynamicMapServiceLayer(dynamicLayer, {
                imageParameters: imageParams,
                id: layerId,
                visible: true
            });
            this.map.addLayer(dynamicMapService);
        },

        _addLegendBox: function () {
            var mmap = this.map;
            this.legendObject = new Legends({
                map: mmap,
                isExtentBasedLegend: true
            }, domConstruct.create("div", {}, null));
            return this.legendObject;
        },

        _addLayerLegend: function () {
            var mapServerArray, legendObject;
            mapServerArray = [];

            if (dojo.configData.OperationalLayers[0]) {
                if (dojo.configData.OperationalLayers[0].ServiceURL) {
                    mapServerArray.push(dojo.configData.OperationalLayers[0].ServiceURL);
                }
            }
            legendObject = this._addLegendBox();
            legendObject.startup(mapServerArray);
        },

        _addLayerLegendWebmap: function (response) {
            var mapServerArray = [], i, j, legendObject, webMapDetails, layer;
            webMapDetails = response.itemInfo.itemData;
            for (j = 0; j < webMapDetails.operationalLayers.length; j++) {
                if (webMapDetails.operationalLayers[j].layerObject.layerInfos) {
                    for (i = 0; i < webMapDetails.operationalLayers[j].layerObject.layerInfos.length; i++) {
                        layer = webMapDetails.operationalLayers[j].url + "/" + webMapDetails.operationalLayers[j].layerObject.layerInfos[i].id;
                        mapServerArray.push(layer);
                    }
                } else {
                    mapServerArray.push(webMapDetails.operationalLayers[j].url);
                }
            }
            legendObject = this._addLegendBox();
            legendObject.startup(mapServerArray);
        },
        /**
        * return current map instance
        * @return {object} Current map instance
        * @memberOf wid
        s/mapSettings/mapSettings
        */
        getMapInstance: function () {
            return this.map;
        }
    });
});
