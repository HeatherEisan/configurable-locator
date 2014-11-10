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
    "esri/geometry/Point",
    "esri/SpatialReference",
    "esri/dijit/HomeButton",
    "dojo/Deferred",
    "dojo/DeferredList",
    "widgets/infoWindow/infoWindow",
    "dojo/text!../infoWindow/templates/infoWindow.html",
    "dojo/topic",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/ArcGISTiledMapServiceLayer",
    "esri/layers/OpenStreetMapLayer",
    "dojo/domReady!"
], function (declare, domConstruct, domStyle, lang, esriUtils, array, dom, domAttr, query, domClass, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, esriMap, ImageParameters, FeatureLayer, GraphicsLayer, SimpleLineSymbol, SimpleRenderer, Color, BaseMapGallery, Legends, GeometryExtent, Point, SpatialReference, HomeButton, Deferred, DeferredList, InfoWindow, template, topic, ArcGISDynamicMapServiceLayer, ArcGISTiledMapServiceLayer, OpenStreetMapLayer) {

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
        searchSettings: [],
        fetureLayerIndex: null,
        operationalLayers: [],

        /**
        * initialize map object
        *
        * @class
        * @name widgets/mapSettings/mapSettings
        */
        postCreate: function () {
            var mapDeferred, layer, i, infoWindowPoint, point;
            topic.subscribe("setInfoWindowOnMap", lang.hitch(this, function (infoTitle, screenPoint, infoPopupWidth, infoPopupHeight) {
                this._onSetInfoWindowPosition(infoTitle, screenPoint, infoPopupWidth, infoPopupHeight);
            }));

            topic.subscribe("hideInfoWindow", lang.hitch(this, function (result) {
                this.infoWindowPanel.hide();
                this.infoWindowPanel.InfoShow = true;
            }));
            /**
            * load map
            * @param {string} dojo.configData.BaseMapLayers Basemap settings specified in configuration file
            */
            dojo.selectedBasemapIndex = 0;
            if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length !== 0) {
                mapDeferred = esriUtils.createMap(dojo.configData.WebMapId, "esriCTParentDivContainer", {
                    mapOptions: {
                        slider: true
                    },
                    ignorePopups: true
                });
                mapDeferred.then(lang.hitch(this, function (response) {
                    this.map = response.map;
                    dojo.selectedBasemapIndex = null;
                    if (response.itemInfo.itemData.baseMap.baseMapLayers) {
                        this._setBasemapLayerId(response.itemInfo.itemData.baseMap.baseMapLayers);
                    }
                    topic.publish("filterRedundantBasemap", response.itemInfo);
                    this._generateLayerURL(response.itemInfo.itemData.operationalLayers);
                    this._fetchWebMapData(response);
                    topic.publish("setMap", this.map);
                    topic.publish("hideProgressIndicator");
                    this._mapOnLoad();
                    setTimeout(lang.hitch(this, function () {
                        if (window.location.toString().split("$address=").length > 1) {
                            topic.publish("addressSearch");
                        }
                        if (window.location.href.toString().split("$mapClickPoint=").length > 1) {
                            infoWindowPoint = window.location.href.toString().split("$mapClickPoint=")[1].split("$")[0].split(",");
                            point = new Point(infoWindowPoint[0], infoWindowPoint[1], this.map.spatialReference);
                            this._showInfoWindowOnMap(point);
                        }
                    }), 5000);
                    this._mapEvents();
                    if (dojo.configData.ShowLegend) {
                        setTimeout(lang.hitch(this, function () {
                            this._createWebmapLegendLayerList(response.itemInfo.itemData.operationalLayers);
                        }), 5000);
                    }
                    this.infoWindowPanel = new InfoWindow({ infoWindowWidth: dojo.configData.InfoPopupWidth, infoWindowHeight: dojo.configData.infoPopupHeight, map: this.map });
                }), function (err) {
                    domStyle.set(dom.byId("esriCTParentDivContainer"), "display", "none");
                    alert(err.message);
                });
            } else {
                this._generateLayerURL(dojo.configData.OperationalLayers);
                this.map = esriMap("esriCTParentDivContainer", {});
                dojo.selectedBasemapIndex = 0;

                if (!dojo.configData.BaseMapLayers[0].length) {
                    if (dojo.configData.BaseMapLayers[0].layerType === "OpenStreetMap") {
                        layer = new OpenStreetMapLayer({ id: "defaultBasemap", visible: true });
                    } else {
                        layer = new ArcGISTiledMapServiceLayer(dojo.configData.BaseMapLayers[0].MapURL, { id: "defaultBasemap", visible: true });
                    }
                    this.map.addLayer(layer, 0);
                } else {
                    for (i = 0; i < dojo.configData.BaseMapLayers[0].length; i++) {
                        layer = new ArcGISTiledMapServiceLayer(dojo.configData.BaseMapLayers[0][i].MapURL, { id: "defaultBasemap" + i, visible: true });
                        this.map.addLayer(layer, i);
                    }
                }
                this.map.on("load", lang.hitch(this, function () {
                    this._mapOnLoad();
                    if (dojo.configData.ShowLegend) {
                        setTimeout(lang.hitch(this, function () {
                            this._addLayerLegend();
                            if (window.location.toString().split("$address=").length > 1) {
                                topic.publish("addressSearch");
                            }
                            if (window.location.href.toString().split("$mapClickPoint=").length > 1) {
                                infoWindowPoint = window.location.href.toString().split("$mapClickPoint=")[1].split("$")[0].split(",");
                                point = new Point(infoWindowPoint[0], infoWindowPoint[1], this.map.spatialReference);
                                this._showInfoWindowOnMap(point);
                            }
                        }), 5000);

                    }
                }));
                this._mapEvents();
                this.infoWindowPanel = new InfoWindow({ infoWindowWidth: dojo.configData.InfoPopupWidth, infoWindowHeight: dojo.configData.infoPopupHeight, map: this.map });
            }

        },
        _createWebmapLegendLayerList: function (layers) {
            var i, webMapLayers = [], webmapLayerList = {}, hasLayers = false;
            for (i = 0; i < layers.length; i++) {
                if (layers[i].visibility) {
                    if (layers[i].layerDefinition && layers[i].layerDefinition.drawingInfo) {
                        webmapLayerList[layers[i].url] = layers[i];
                        hasLayers = true;
                    } else {
                        webMapLayers.push(layers[i]);
                    }
                }
            }
            if (!hasLayers) {
                webmapLayerList = null;
            }
            this._addLayerLegendWebmap(webMapLayers, webmapLayerList);
        },
        /**
        * set default id for basemaps
        * @memberOf widgets/mapSettings/mapSettings
        */
        _setBasemapLayerId: function (baseMapLayers) {
            var i = 0, defaultId = "defaultBasemap";
            if (baseMapLayers.length === 1) {
                this._setBasemapId(baseMapLayers[0], defaultId);
            } else {
                for (i = 0; i < baseMapLayers.length; i++) {
                    this._setBasemapId(baseMapLayers[i], defaultId + i);
                }
            }

        },

        /**
        * set default id for each basemap of webmap
        * @memberOf widgets/mapSettings/mapSettings
        */
        _setBasemapId: function (basmap, defaultId) {
            var layerIndex;
            this.map.getLayer(basmap.id).id = defaultId;
            this.map._layers[defaultId] = this.map.getLayer(basmap.id);
            layerIndex = array.indexOf(this.map.layerIds, basmap.id);
            if (defaultId !== basmap.id) {
                delete this.map._layers[basmap.id];
            }
            this.map.layerIds[layerIndex] = defaultId;
        },

        _fetchWebMapData: function (response) {
            var i, j, k, l, p, str, field, index, webMapDetails, operationalLayers, serviceTitle, operationalLayerId, lastIndex, layerInfo, webMapArrayData, webMapArrayDataDynamic, operationalLayerUrl, operationalLayerIndex;
            this.searchSettings.push(dojo.configData.ActivitySearchSettings);
            this.searchSettings.push(dojo.configData.EventSearchSettings);
            dojo.configData.InfoWindowSettings = [];
            webMapDetails = response.itemInfo.itemData;
            dojo.configData.OperationalLayers = [];
            operationalLayers = dojo.configData.OperationalLayers;
            this.operationalLayers = webMapDetails.operationalLayers;
            serviceTitle = [];
            p = 0;
            for (i = 0; i < webMapDetails.operationalLayers.length; i++) {
                operationalLayerId = lang.trim(webMapDetails.operationalLayers[i].title);
                str = webMapDetails.operationalLayers[i].url.split('/');
                lastIndex = str[str.length - 1];
                if (isNaN(lastIndex) || lastIndex === "") {
                    if (lastIndex === "") {
                        serviceTitle[operationalLayerId] = webMapDetails.operationalLayers[i].url;
                    } else {
                        serviceTitle[operationalLayerId] = webMapDetails.operationalLayers[i].url + "/";
                    }
                } else {
                    serviceTitle[operationalLayerId] = webMapDetails.operationalLayers[i].url.substring(0, webMapDetails.operationalLayers[i].url.lastIndexOf("/") + 1);
                }
            }

            for (index = 0; index < this.searchSettings.length; index++) {
                if (this.searchSettings[index][0].Title && this.searchSettings[index][0].QueryLayerId && serviceTitle[this.searchSettings[index][0].Title]) {
                    this.searchSettings[index][0].QueryURL = serviceTitle[this.searchSettings[index][0].Title] + this.searchSettings[index][0].QueryLayerId;
                    for (j = 0; j < webMapDetails.operationalLayers.length; j++) {
                        if (webMapDetails.operationalLayers[j].title && serviceTitle[webMapDetails.operationalLayers[j].title] && (webMapDetails.operationalLayers[j].title === this.searchSettings[index][0].Title)) {
                            if (webMapDetails.operationalLayers[j].layers) {
                                //Fetching infopopup data in case the layers are added as dynamic layers in the webmap
                                for (k = 0; k < webMapDetails.operationalLayers[j].layers.length; k++) {
                                    layerInfo = webMapDetails.operationalLayers[j].layers[k];
                                    if (Number(this.searchSettings[index][0].QueryLayerId) === layerInfo.id) {
                                        if (webMapDetails.operationalLayers[j].layers[k].popupInfo) {
                                            operationalLayers[p] = {};
                                            operationalLayers[p].ServiceURL = webMapDetails.operationalLayers[j].url + "/" + webMapDetails.operationalLayers[j].layers[k].id;
                                            operationalLayers[p].LoadAsServiceType = response.itemInfo.itemData.operationalLayers[j].layerType;
                                            p++;
                                            if (layerInfo.popupInfo.title.split("{").length > 1) {
                                                this.searchSettings[index][0].InfoWindowHeaderField = lang.trim(layerInfo.popupInfo.title.split("{")[0]) + " ";
                                                for (l = 1; l < layerInfo.popupInfo.title.split("{").length; l++) {
                                                    this.searchSettings[index][0].InfoWindowHeaderField += "${" + lang.trim(layerInfo.popupInfo.title.split("{")[l]);
                                                }
                                            } else {
                                                if (lang.trim(layerInfo.popupInfo.title) !== "") {
                                                    this.searchSettings[index][0].InfoWindowHeaderField = lang.trim(layerInfo.popupInfo.title);
                                                } else {
                                                    this.searchSettings[index][0].InfoWindowHeaderField = sharedNls.showNullValue;
                                                }
                                            }
                                            webMapArrayDataDynamic = [];
                                            for (field in layerInfo.popupInfo.fieldInfos) {
                                                if (layerInfo.popupInfo.fieldInfos.hasOwnProperty(field)) {
                                                    if (layerInfo.popupInfo.fieldInfos[field].visible) {
                                                        webMapArrayDataDynamic.push({
                                                            "DisplayText": layerInfo.popupInfo.fieldInfos[field].label + ":",
                                                            "FieldName": "${" + layerInfo.popupInfo.fieldInfos[field].fieldName + "}"
                                                        });

                                                    }
                                                }
                                            }
                                            operationalLayerUrl = webMapDetails.operationalLayers[j].url.split('/');
                                            operationalLayerIndex = operationalLayerUrl[operationalLayerUrl.length - 1];
                                            dojo.configData.InfoWindowSettings.push({
                                                "QueryLayerId": operationalLayerIndex,
                                                "Title": webMapDetails.operationalLayers[j].title,
                                                "InfoQueryURL": webMapDetails.operationalLayers[j].url,
                                                "InfoWindowData": webMapArrayDataDynamic
                                            });
                                        }
                                    }
                                }
                            } else if (webMapDetails.operationalLayers[j].popupInfo) {
                                //Fetching infopopup data in case the layers are added as feature layers in the webmap
                                operationalLayers[p] = {};
                                operationalLayers[p].ServiceURL = webMapDetails.operationalLayers[j].url;
                                p++;
                                if (webMapDetails.operationalLayers[j].popupInfo.title.split("{").length > 1) {
                                    this.searchSettings[index][0].InfoWindowHeaderField = lang.trim(webMapDetails.operationalLayers[j].popupInfo.title.split("{")[0]);
                                    for (l = 1; l < webMapDetails.operationalLayers[j].popupInfo.title.split("{").length; l++) {
                                        this.searchSettings[index][0].InfoWindowHeaderField += " ${" + lang.trim(webMapDetails.operationalLayers[j].popupInfo.title.split("{")[l]);
                                    }
                                } else {
                                    if (lang.trim(webMapDetails.operationalLayers[j].popupInfo.title) !== "") {
                                        this.searchSettings[index][0].InfoWindowHeaderField = lang.trim(webMapDetails.operationalLayers[j].popupInfo.title);
                                    } else {
                                        this.searchSettings[index][0].InfoWindowHeaderField = sharedNls.showNullValue;
                                    }
                                }
                                webMapArrayData = [];
                                for (field in webMapDetails.operationalLayers[j].popupInfo.fieldInfos) {
                                    if (webMapDetails.operationalLayers[j].popupInfo.fieldInfos.hasOwnProperty(field)) {
                                        if (webMapDetails.operationalLayers[j].popupInfo.fieldInfos[field].visible) {
                                            webMapArrayData.push({ "DisplayText": webMapDetails.operationalLayers[j].popupInfo.fieldInfos[field].label + ":", "FieldName": "${" + webMapDetails.operationalLayers[j].popupInfo.fieldInfos[field].fieldName + "}" });
                                        }
                                    }
                                }
                                operationalLayerUrl = webMapDetails.operationalLayers[j].url.split('/');
                                operationalLayerIndex = operationalLayerUrl[operationalLayerUrl.length - 1];
                                dojo.configData.InfoWindowSettings.push({
                                    "QueryLayerId": operationalLayerIndex,
                                    "Title": webMapDetails.operationalLayers[j].title,
                                    "InfoQueryURL": webMapDetails.operationalLayers[j].url,
                                    "InfoWindowData": webMapArrayData
                                });
                            }
                        }
                    }
                } else {
                    alert(sharedNls.appErrorMessage.webmapTitleError);
                }
            }
        },

        /**
        * map onclick event
        * @memberOf widgets/mapSettings/mapSettings
        */
        _mapEvents: function () {
            this.map.on("click", lang.hitch(this, function (evt) {
                if (evt.graphic) {
                    topic.publish("showProgressIndicator");
                    this._showInfoWindowOnMap(evt.mapPoint);
                }
            }));
            this.map.on("extent-change", lang.hitch(this, function (evt) {
                if (!this.infoWindowPanel.InfoShow) {
                    var infoPopupHeight, infoPopupWidth;
                    infoPopupHeight = dojo.configData.InfoPopupHeight;
                    infoPopupWidth = dojo.configData.InfoPopupWidth;
                    this._setInfoWindowHeightWidth(infoPopupWidth, infoPopupHeight);
                    topic.publish("setMapTipPosition", dojo.selectedMapPoint, this.map, this.infoWindowPanel);
                }
                topic.publish("updateLegends", evt.extent);
            }));
        },

        /**
        * Set info window height and width
        * @param{int} info popup width
        * @param{int} info popup Height
        * @memberOf widgets/mapSettings/mapSettings
        */
        _setInfoWindowHeightWidth: function (infoPopupWidth, infoPopupHeight) {
            this.infoWindowPanel.resize(infoPopupWidth, infoPopupHeight);
        },

        /**
        * initialize map object when map is loading
        * @memberOf widgets/mapSettings/mapSettings
        */
        _mapOnLoad: function () {
            var home, extentPoints, mapDefaultExtent, i, graphicsLayer, buffergraphicsLayer, extent, routegraphicsLayer, highlightfeature, imgSource, imgCustomLogo;
            extentPoints = dojo.configData && dojo.configData.DefaultExtent && dojo.configData.DefaultExtent.split(",");
            extent = this._getQueryString('extent');
            if (extent === "") {
                if (!dojo.configData.WebMapId) {
                    mapDefaultExtent = new GeometryExtent({ "xmin": parseFloat(extentPoints[0]), "ymin": parseFloat(extentPoints[1]), "xmax": parseFloat(extentPoints[2]), "ymax": parseFloat(extentPoints[3]), "spatialReference": { "wkid": this.map.spatialReference.wkid} });
                    this.map.setExtent(mapDefaultExtent);
                }
            } else {
                mapDefaultExtent = extent.split(',');
                mapDefaultExtent = new GeometryExtent({ "xmin": parseFloat(mapDefaultExtent[0]), "ymin": parseFloat(mapDefaultExtent[1]), "xmax": parseFloat(mapDefaultExtent[2]), "ymax": parseFloat(mapDefaultExtent[3]), "spatialReference": { "wkid": this.map.spatialReference.wkid} });
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
                if (dojo.configData.CustomLogoUrl.match("http:") || dojo.configData.CustomLogoUrl.match("https:")) {
                    imgSource = dojo.configData.CustomLogoUrl;
                } else {
                    imgSource = dojoConfig.baseURL + dojo.configData.CustomLogoUrl;
                }
                imgCustomLogo = domConstruct.create("img", { "src": imgSource, "class": "esriCTCustomMapLogo" }, dom.byId("esriCTParentDivContainer"));
                domClass.add(imgCustomLogo, "esriCTCustomMapLogoBottom");
            }
            if (!dojo.configData.WebMapId) {
                for (i in dojo.configData.OperationalLayers) {
                    if (dojo.configData.OperationalLayers.hasOwnProperty(i)) {
                        this._addOperationalLayerToMap(i, dojo.configData.OperationalLayers[i]);
                    }
                }
            }
            graphicsLayer = new GraphicsLayer();
            graphicsLayer.id = this.tempGraphicsLayerId;
            this.map.addLayer(graphicsLayer);
            buffergraphicsLayer = new GraphicsLayer();
            buffergraphicsLayer.id = this.tempBufferLayerId;
            this.map.addLayer(buffergraphicsLayer);
            routegraphicsLayer = new GraphicsLayer();
            routegraphicsLayer.id = this.routeLayerId;
            highlightfeature = new GraphicsLayer();
            highlightfeature.id = this.highlightLayerId;
            this.map.addLayer(highlightfeature);
            this.map.addLayer(routegraphicsLayer);
            if (dojo.configData.BaseMapLayers.length > 1) {
                this._showBasMapGallery();
            }
            graphicsLayer.on("graphic-add", lang.hitch(this, function (feature) {
                topic.publish("doBufferHandler", feature);
            }));
        },

        /**
        * set infowindow position
        * @memberOf widgets/mapSettings/mapSettings
        */
        _onSetInfoWindowPosition: function (infoTitle, screenPoint, infoPopupHeight, infoPopupWidth) {
            this.infoWindowPanel.resize(infoPopupHeight, infoPopupWidth);
            this.infoWindowPanel.hide();
            this.infoWindowPanel.show(screenPoint);
            dojo.infoWindowIsShowing = true;
            this.infoWindowPanel.setTitle(infoTitle);
        },

        /**
        * show infoWindow on Map
        * @param {Map point} mapPoint
        * @memberOf widgets/mapSettings/mapSettings
        */
        _showInfoWindowOnMap: function (mapPoint) {
            dojo.mapClickedPoint = mapPoint;
            var index, deferredListResult,
                onMapFeaturArray = [],
                featureArray = [];
            this.counter = 0;
            for (index = 0; index < dojo.configData.InfoWindowSettings.length; index++) {
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
                                        layerId: dojo.configData.InfoWindowSettings[j].QueryLayerId,
                                        layerTitle: dojo.configData.InfoWindowSettings[j].Title,
                                        fields: result[j][1].fields
                                    });
                                }
                            }
                        }
                    }
                    this._fetchQueryResults(featureArray, mapPoint);
                }
            }), function (err) {
                alert(err.message);
            });
        },

        /**
        * execute query for the layer
        * @param {number}index of feature layer
        * @param {Map point} mapPoint
        * @param {array} onMapFeaturArray Contains array of fearture layer URL
        * @memberOf widgets/mapSettings/mapSettings
        */
        _executeQueryTask: function (index, mapPoint, onMapFeaturArray) {
            var queryTask, queryLayer, isLayerVisible, currentDate = new Date().getTime().toString() + index, deferred;
            queryTask = new esri.tasks.QueryTask(dojo.configData.InfoWindowSettings[index].InfoQueryURL);
            if (this.operationalLayers[index].layerObject) {
                isLayerVisible = this.operationalLayers[index].layerObject.visibleAtMapScale;
            } else {
                isLayerVisible = this.operationalLayers[index].visibleAtMapScale;
            }

            queryLayer = new esri.tasks.Query();
            if (isLayerVisible) {
                queryLayer.where = currentDate + "=" + currentDate;
            } else {
                queryLayer.where = "1=2";
            }
            queryLayer.outSpatialReference = this.map.spatialReference;
            queryLayer.returnGeometry = true;
            queryLayer.maxAllowableOffset = 100;
            queryLayer.geometry = this._extentFromPoint(mapPoint);
            queryLayer.outFields = ["*"];
            deferred = new Deferred();
            queryTask.execute(queryLayer, lang.hitch(this, function (results) {
                deferred.resolve(results);
            }), function (err) {
                alert(err.message);
                deferred.reject();

            });
            onMapFeaturArray.push(deferred);
        },

        /**
        * set extent from mappoint
        * @param {Map point} mapPoint
        * @memberOf widgets/mapSettings/mapSettings
        */
        _extentFromPoint: function (point) {
            var tolerance, screenPoint, pnt1, pnt2, mapPoint1, mapPoint2;
            tolerance = 35;
            screenPoint = this.map.toScreen(point);
            pnt1 = new esri.geometry.Point(screenPoint.x - tolerance, screenPoint.y + tolerance);
            pnt2 = new esri.geometry.Point(screenPoint.x + tolerance, screenPoint.y - tolerance);
            mapPoint1 = this.map.toMap(pnt1);
            mapPoint2 = this.map.toMap(pnt2);
            return new esri.geometry.Extent(mapPoint1.x, mapPoint1.y, mapPoint2.x, mapPoint2.y, this.map.spatialReference);
        },

        /**
        * featch infowindow data from query task result
        * @param {Array} featureArray Contains features array on map
        * @param {Map point} mapPoint
        * @param {Object} map
        * @memberOf widgets/mapSettings/mapSettings
        */
        _fetchQueryResults: function (featureArray, mapPoint) {
            var point, featurePoint, infoWindowParameter;
            featureArray = this._getDateInFormat(featureArray);
            if (featureArray.length > 0) {
                if (featureArray.length === 1) {
                    featurePoint = featureArray[0].attr.geometry;
                    infoWindowParameter = {
                        "mapPoint": featurePoint,
                        "attribute": featureArray[0].attr.attributes,
                        "layerId": featureArray[0].layerId,
                        "layerTitle": featureArray[0].layerTitle,
                        "featureArray": featureArray,
                        "featureSet": featureArray[0].attr
                    };
                } else {
                    this.count = 0;
                    if (featureArray[this.count].attr.geometry.type === "polyline") {
                        point = featureArray[this.count].attr.geometry.getPoint(0, 0);
                        infoWindowParameter = {
                            "mapPoint": point,
                            "attribute": featureArray[0].attr.attributes,
                            "layerId": featureArray[0].layerId,
                            "layerTitle": featureArray[0].layerTitle,
                            "featureArray": featureArray,
                            "featureSet": featureArray[0].attr
                        };
                    } else {
                        point = featureArray[0].attr.geometry;
                        infoWindowParameter = {
                            "mapPoint": point,
                            "attribute": featureArray[0].attr.attributes,
                            "layerId": featureArray[0].layerId,
                            "layerTitle": featureArray[0].layerTitle,
                            "featureArray": featureArray,
                            "featureSet": featureArray[0].attr
                        };
                    }
                    topic.publish("hideProgressIndicator");
                }
                topic.publish("createInfoWindowContent", infoWindowParameter);
            } else {
                topic.publish("hideProgressIndicator");
            }
        },


        /**
        * format the date in pattern
        * @returns feature Array
        * @param {object} featureArray contains attributes, geometry, mapPoint
        * @memberOf widgets/mapSettings/mapSettings
        */
        _getDateInFormat: function (featureArray) {
            var attributeNames = [], i, key, e;
            if (featureArray.length > 0) {
                for (i = 0; i < featureArray[0].fields.length; i++) {
                    if (featureArray[0].fields[i].type === "esriFieldTypeDate") {
                        attributeNames.push(featureArray[0].fields[i].name);
                    }
                }
                for (key in featureArray[0].attr.attributes) {
                    if (featureArray[0].attr.attributes.hasOwnProperty(key)) {
                        for (e = 0; e < attributeNames.length; e++) {
                            if (attributeNames[e] === key) {
                                featureArray[0].attr.attributes[key] = dojo.date.locale.format(this.utcTimestampFromMs(featureArray[0].attr.attributes[key]), { datePattern: dojo.configData.EventSearchSettings[0].DisplayDateFormat, selector: "date" });
                            }
                        }
                    }
                }
            } else {
                topic.publish("hideProgressIndicator");
            }
            return featureArray;
        },

        /**
        * convert the UTC time stamp from Millisecond
        * @returns Date
        * @param {object} utcMilliseconds contains UTC millisecond
        * @memberOf widgets/mapSettings/mapSettings
        */
        utcTimestampFromMs: function (utcMilliseconds) {
            return this.localToUtc(new Date(utcMilliseconds));
        },

        /**
        * convert the local time to UTC
        * @param {object} localTimestamp contains Local time
        * @returns Date
        * @memberOf widgets/mapSettings/mapSettings
        */
        localToUtc: function (localTimestamp) {
            return new Date(localTimestamp.getTime() + (localTimestamp.getTimezoneOffset() * 60000));
        },

        /**
        * get the string of service URL using query operation
        * @param {number} key for service URL
        * @memberOf widgets/mapSettings/mapSettings
        */
        _getQueryString: function (key) {
            var extentValue = "", regex, qs;
            regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
            qs = regex.exec(window.location.href);
            if (qs && qs.length > 0) {
                extentValue = qs[1];
            }
            return extentValue;
        },

        /**
        * generate layer URL for infoWindow
        * @param {Layer} operationalLayers Contains service layer URL
        * @memberOf widgets/mapSettings/mapSettings
        */
        _generateLayerURL: function (operationalLayers) {
            var infoWindowSettings, searchSettings, i, str, layerTitle, layerId, index, infoIndex, commentLayerURL, eventIndex, eventSearchSettings;
            infoWindowSettings = dojo.configData.InfoWindowSettings;
            searchSettings = dojo.configData.ActivitySearchSettings;
            eventSearchSettings = dojo.configData.EventSearchSettings;
            for (i = 0; i < operationalLayers.length; i++) {
                if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length !== 0) {
                    str = operationalLayers[i].url.split('/');
                    layerTitle = operationalLayers[i].title;
                    layerId = str[str.length - 1];
                    for (index = 0; index < searchSettings.length; index++) {
                        if (searchSettings[index].Title && searchSettings[index].QueryLayerId) {
                            if (layerTitle === searchSettings[index].Title && layerId === searchSettings[index].QueryLayerId) {
                                searchSettings[index].QueryURL = str.join("/");
                                if (searchSettings[index].CommentsSettings && searchSettings[index].CommentsSettings.QueryLayerId) {
                                    commentLayerURL = searchSettings[index].QueryURL.split('/');
                                    commentLayerURL[commentLayerURL.length - 1] = searchSettings[index].CommentsSettings.QueryLayerId;
                                    searchSettings[index].CommentsSettings.QueryURL = commentLayerURL.join("/");
                                }
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
                    for (eventIndex = 0; eventIndex < eventSearchSettings.length; eventIndex++) {
                        if (eventSearchSettings[eventIndex].Title && eventSearchSettings[eventIndex].QueryLayerId) {
                            if (layerTitle === eventSearchSettings[eventIndex].Title && layerId === eventSearchSettings[eventIndex].QueryLayerId) {
                                eventSearchSettings[eventIndex].QueryURL = str.join("/");
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
                                    if (searchSettings[index].CommentsSettings && searchSettings[index].CommentsSettings.QueryLayerId) {
                                        commentLayerURL = searchSettings[index].QueryURL.split('/');
                                        commentLayerURL[commentLayerURL.length - 1] = searchSettings[index].CommentsSettings.QueryLayerId;
                                        searchSettings[index].CommentsSettings.QueryURL = commentLayerURL.join("/");
                                    }
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
                        for (eventIndex = 0; eventIndex < eventSearchSettings.length; eventIndex++) {
                            if (eventSearchSettings[eventIndex].Title && eventSearchSettings[eventIndex].QueryLayerId) {
                                if (layerTitle === eventSearchSettings[eventIndex].Title && layerId === eventSearchSettings[eventIndex].QueryLayerId) {
                                    eventSearchSettings[eventIndex].QueryURL = str.join("/");
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

        /**
        * Initialize the object of baseMapGallery
        * @return {object} basMapGallery widget
        * @memberOf widgets/mapSettings/mapSettings
        */
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
                    //                    id: "index",
                    mode: layerMode,
                    outFields: ["*"],
                    displayOnPan: false
                });
                this.map.addLayer(featureLayer);
                this.operationalLayers.push(featureLayer);
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

        /**
        * add service layer as dynamic service type
        * @param {number} layerId is a ID of service URL
        * @param {Layer} layerURL Contains service URL of feature layer
        * @memberOf widgets/mapSettings/mapSettings
        */
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

        /**
        * create dynamic service layer as dynamic service type
        * @param {Object} dynamicLayer is use for dynamic type of service URL
        * @param {Object} imageParams Contains the images used in service URL
        * @param {Number} layerId is Id for service URL
        * @memberOf widgets/mapSettings/mapSettings
        */
        _createDynamicServiceLayer: function (dynamicLayer, imageParams, layerId) {
            var dynamicMapService;
            dynamicMapService = new ArcGISDynamicMapServiceLayer(dynamicLayer, {
                imageParameters: imageParams,
                id: layerId,
                visible: true
            });
            this.map.addLayer(dynamicMapService);
            this.operationalLayers.push(dynamicMapService);
        },

        /**
        * initialize the object of legend box
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addLegendBox: function () {
            var mmap = this.map;
            this.legendObject = new Legends({
                map: mmap,
                isExtentBasedLegend: true
            }, domConstruct.create("div", {}, null));
            return this.legendObject;
        },

        /**
        * create collection for map /feature server for legend
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addLayerLegend: function () {
            var mapServerArray, legendObject, i;
            mapServerArray = [];
            for (i = 0; i < dojo.configData.OperationalLayers.length; i++) {
                if (dojo.configData.OperationalLayers[i]) {
                    if (dojo.configData.OperationalLayers[i].ServiceURL) {
                        mapServerArray.push(dojo.configData.OperationalLayers[i].ServiceURL);
                    }
                }
            }
            legendObject = this._addLegendBox();
            legendObject.startup(mapServerArray, null, this.map.extent);
        },

        /**
        * add legend for the web map
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addLayerLegendWebmap: function (webMapLayers, webmapLayerList) {
            var mapServerArray = [], i, j, legendObject, layer;
            for (j = 0; j < webMapLayers.length; j++) {
                if (webMapLayers[j].layerObject) {
                    if (webMapLayers[j].layerObject.layerInfos) {
                        for (i = 0; i < webMapLayers[j].layerObject.layerInfos.length; i++) {
                            layer = webMapLayers[j].url + "/" + webMapLayers[j].layerObject.layerInfos[i].id;
                            mapServerArray.push(layer);
                        }
                    } else {

                        mapServerArray.push(webMapLayers[j].url);
                    }
                } else {
                    mapServerArray.push(webMapLayers[j].url);
                }
            }
            legendObject = this._addLegendBox();
            legendObject.startup(mapServerArray, webmapLayerList, this.map.extent);
            topic.publish("setMaxLegendLength");
        },

        /**
        * return current map instance
        * @return {object} Current map instance
        * @memberOf widgets/mapSettings/mapSettings
        */
        getMapInstance: function () {
            return this.map;
        }
    });
});
