/*global define,dojo,dojoConfig:true,alert,esri,console */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true,indent:4 */
/*global define,dojo,dojoConfig:true,alert,esri,console */
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
    "esri/urlUtils",
    "../carouselContainer/carouselContainer",
    "../searchSetting/activitySearch",
    "../searchSetting/locatorHelper",
    "widgets/geoLocation/geoLocation",
    "esri/tasks/RouteParameters",
    "esri/tasks/FeatureSet",
    "esri/SpatialReference",
    "esri/tasks/RouteTask",
    "esri/symbols/SimpleLineSymbol",
    "esri/units",
    "dojo/store/Memory",
    "../searchSetting/infoWindowHelper",
    "widgets/locator/locator",
    "../searchSetting/carouselContainerHelper",
    "esri/dijit/Directions",
    "dojo/_base/Color"

], function (declare, domConstruct, domStyle, domAttr, lang, on, domGeom, dom, array, domClass, query, string, Locator, Query, Deferred, DeferredList, QueryTask, Geometry, Graphic, Point, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic, urlUtils, CarouselContainer, ActivitySearch, LocatorHelper, GeoLocation, RouteParameters, FeatureSet, SpatialReference, RouteTask, SimpleLineSymbol, units, Memory, InfoWindowHelper, LocatorTool, CarouselContainerHelper, Directions, Color) {
    // ========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, ActivitySearch, InfoWindowHelper, LocatorHelper, CarouselContainerHelper], {
        templateString: template,
        sharedNls: sharedNls,
        carouselPodData: [],
        isRouteCreated: false,
        featureSetWithoutNullValue: null,
        objectIdForCommentLayer: "",
        objectIdForActivityLayer: "",
        objectIdForEventLayer: "",
        myListStoreData: new Memory(),
        acitivityListDiv: null,
        locatorAddress: "",

        /**
        * display locator widget
        *
        * @class
        * @name widgets/locator/locator
        */
        postCreate: function () {
            var contHeight, locatorParams, locatorObject, mapPoint, geoLocatorSymbol, geoLocationPushpin, graphic;
            /**
            * close locator widget if any other widget is opened
            * @param {string} widget Key of the newly opened widget
            */
            topic.subscribe("toggleWidget", lang.hitch(this, function (widget) {
                if (widget !== "searchSetting") {
                    if (domGeom.getMarginBox(this.divSearchContainer).h > 0) {
                        domClass.replace(this.domNode, "esriCTHeaderSearch", "esriCTHeaderSearchSelected");
                        domClass.replace(this.divSearchContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                    }
                } else {
                    if (domClass.contains(this.divSearchContainer, "esriCTHideContainerHeight")) {
                        contHeight = domStyle.get(this.divSearchResultContent, "height");
                        domStyle.set(this.divSearchContainer, "height", contHeight + 2 + "px");
                    }
                }
            }));
            this.domNode = domConstruct.create("div", { "title": sharedNls.tooltips.search, "class": "esriCTHeaderSearch" }, null);
            domConstruct.place(this.divSearchContainer, dom.byId("esriCTParentDivContainer"));
            this.own(on(this.domNode, "click", lang.hitch(this, function () {
                /**
                * minimize other open header panel widgets and show locator widget
                */
                topic.publish("toggleWidget", "searchSetting");
                this._showLocateContainer();
            })));
            topic.subscribe("getExecuteQueryForFeatures", lang.hitch(this, function (featureSetObject, QueryURL, widgetName) {
                this._executeQueryForFeatures(featureSetObject, QueryURL, widgetName);
            }));
            domAttr.set(this.divSearchContainer, "title", "");
            this.own(on(this.divActivityPanel, "click", lang.hitch(this, function () {
                this._showActivityTab();
            })));
            this._createCarouselContainer();
            this.createCarouselPod();
            this._showActivitySearchContainer();

            this.own(on(this.divSearchPanel, "click", lang.hitch(this, function () {
                this._showSearchTab();
            })));
            topic.subscribe("createInfoWindowContent", lang.hitch(this, function (infoWindowParameter) {
                this._createInfoWindowContent(infoWindowParameter);
            }));
            topic.subscribe("setMapTipPosition", this._onSetMapTipPosition);
            urlUtils.addProxyRule({
                urlPrefix: dojo.configData.DrivingDirectionSettings.RouteServiceURL,
                proxyUrl: dojo.configData.ProxyUrl
            });
            this._showSearchTab();
            dojo.configData.SearchSettings = [];
            this._addSearchSettings(dojo.configData.ActivitySearchSettings);
            this._addSearchSettings(dojo.configData.EventSearchSettings);
            locatorParams = {
                defaultAddress: dojo.configData.LocatorSettings.LocatorDefaultAddress,
                preLoaded: false,
                parentDomNode: this.divSearchContent,
                map: this.map,
                graphicsLayerId: "esriGraphicsLayerMapSettings",
                locatorSettings: dojo.configData.LocatorSettings,
                configSearchSettings: dojo.configData.SearchSettings
            };
            locatorObject = new LocatorTool(locatorParams);
            locatorObject.onGraphicAdd = lang.hitch(this, function () {
                dojo.addressLocation = locatorObject.selectedGraphic.geometry.x.toString() + "," + locatorObject.selectedGraphic.geometry.y.toString(); //locatorObject.selectedGraphic;
                dojo.activitySearch = null;
                this.createBuffer(locatorObject.selectedGraphic);
            });
            locatorObject.candidateClicked = lang.hitch(this, function (candidate) {
                if (candidate && candidate.attributes && candidate.attributes.address) {
                    this.locatorAddress = candidate.attributes.address;
                }
                this._showLocateContainer();
                this.removeGeolocationPushPin();
                if (candidate.geometry) {
                    locatorObject._toggleTexBoxControls(false);
                    locatorObject._locateAddressOnMap(candidate.geometry);
                }
            });
            topic.subscribe("getMyListStoreData", lang.hitch(this, function (value) {
                this.myListStoreData = value;
            }));
            topic.subscribe("getAcitivityListDiv", lang.hitch(this, function (value) {
                this.acitivityListDiv = value;
            }));
            topic.subscribe("eventForListClick", lang.hitch(this, function (featureSetObject) {
                this._executeQueryForEventForList(featureSetObject);
            }));
            this._getLayerInformaiton();
            this._createDirectionWidget();
            topic.subscribe("addressSearch", lang.hitch(this, function () {
                if (window.location.toString().split("$address=").length > 1) {
                    mapPoint = new Point(window.location.toString().split("$address=")[1].split("$")[0].split(",")[0], window.location.toString().split("$address=")[1].split("$")[0].split(",")[1], this.map.spatialReference);
                    dojo.addressLocation = window.location.toString().split("$address=")[1].split("$")[0];
                    setTimeout(lang.hitch(this, function () {
                        this.sharedGraphic = true;
                        locatorObject._locateAddressOnMap(mapPoint, this.sharedGraphic);
                    }, 5000));
                }
            }));
            setTimeout(lang.hitch(this, function () {
                if (window.location.toString().split("$sharedGeolocation=").length > 1) {
                    mapPoint = new Point(window.location.toString().split("$sharedGeolocation=")[1].split("$")[0].split(",")[0], window.location.toString().split("$sharedGeolocation=")[1].split("$")[0].split(",")[1], this.map.spatialReference);
                    dojo.sharedGeolocation = mapPoint;
                    geoLocationPushpin = dojoConfig.baseURL + dojo.configData.LocatorSettings.DefaultLocatorSymbol;
                    geoLocatorSymbol = new esri.symbol.PictureMarkerSymbol(geoLocationPushpin, dojo.configData.LocatorSettings.MarkupSymbolSize.width, dojo.configData.LocatorSettings.MarkupSymbolSize.height);
                    graphic = new esri.Graphic(mapPoint, geoLocatorSymbol, {}, null);
                    this.map.getLayer("tempBufferLayer").add(graphic);
                    if (mapPoint) {
                        this.createBuffer(mapPoint);
                    }
                }
            }, 20000));
        },

        /**
        * address search setting
        * @memberOf widgets/searchSettings/searchSettings
        */
        _addSearchSettings: function (layerSetting) {
            var i;
            for (i = 0; i < layerSetting.length; i++) {
                dojo.configData.SearchSettings.push(layerSetting[i]);
            }
        },

        /**
        * create carousel Container
        * @memberOf widgets/searchSettings/searchSettings
        */
        _createCarouselContainer: function () {
            this.carouselContainer = new CarouselContainer();
            this.carouselContainer.createPod(dom.byId("esriCTParentDivContainer"), "Result");
        },

        /**
        * remove graphics from map
        * @memberOf widgets/searchSettings/searchSettings
        */
        removeGraphics: function () {
            if (this.map.getLayer("highlightLayerId") && this.map.getLayer("highlightLayerId").graphics.length > 0) {
                this.map.getLayer("highlightLayerId").clear();
            }
        },

        /**
        * remove graphics from map
        * @memberOf widgets/searchSettings/searchSettings
        */
        removeBuffer: function () {
            if (this.map.getLayer("tempBufferLayer") && this.map.getLayer("tempBufferLayer").graphics.length > 0) {
                this.map.getLayer("tempBufferLayer").clear();
            }
        },

        /**
        * remove geolocation graphics from map
        * @memberOf widgets/searchSettings/searchSettings
        */
        removeGeolocationPushPin: function () {
            if (this.map.getLayer("geoLocationGraphicsLayer") && this.map.getLayer("geoLocationGraphicsLayer").graphics.length > 0) {
                this.map.getLayer("geoLocationGraphicsLayer").clear();
            }
        },

        /**
        * remove Locator graphics from map
        * @memberOf widgets/searchSettings/searchSettings
        */
        removeLocatorPushPin: function () {
            if (this.map.getLayer("esriGraphicsLayerMapSettings") && this.map.getLayer("esriGraphicsLayerMapSettings").graphics.length > 0) {
                this.map.getLayer("esriGraphicsLayerMapSettings").clear();
            }
        },

        /**
        * clear the  graphic on the map
        * @memberOf widgets/searchSettings/searchSettings
        */
        removeRouteAndGraphics: function () {
            if (this.map.getLayer("highlightLayerId") && this.map.getLayer("highlightLayerId").graphics.length > 0) {
                this.map.getLayer("highlightLayerId").clear();
            }
        },

        /**
        * Remove null value from the attribute.
        * @param {object} featureObject is object for feature
        * @return {object} feature set after removing null value
        * @memberOf widgets/searchSettings/searchSettings
        */
        removeNullValue: function (featureObject) {
            var i, j;
            if (featureObject) {
                for (i = 0; i < featureObject.length; i++) {
                    for (j in featureObject[i].attributes) {
                        if (featureObject[i].attributes.hasOwnProperty(j)) {
                            if (!featureObject[i].attributes[j]) {
                                featureObject[i].attributes[j] = sharedNls.showNullValue;
                            }
                            if (dojo.isString(featureObject[i].attributes[j]) && lang.trim(featureObject[i].attributes[j]) === "") {
                                featureObject[i].attributes[j] = sharedNls.showNullValue;
                            }
                        }
                    }
                }
            }
            return featureObject;
        },

        /**
        * calculate the distance between the puspin(start point) and nearest feature(end point)
        * @param {object} startPoint is pushpin on map
        * @param {object} endPoint is search result
        * @memberOf widgets/searchSettings/searchSettings
        */
        getDistance: function (startPoint, endPoint) {
            var sPoint, ePoint, lon1, lat1, lon2, lat2, theta, dist;
            sPoint = esri.geometry.webMercatorToGeographic(startPoint);
            ePoint = esri.geometry.webMercatorToGeographic(endPoint);
            lon1 = sPoint.x;
            lat1 = sPoint.y;
            lon2 = ePoint.x;
            lat2 = ePoint.y;
            theta = lon1 - lon2;
            dist = Math.sin(this.deg2Rad(lat1)) * Math.sin(this.deg2Rad(lat2)) + Math.cos(this.deg2Rad(lat1)) * Math.cos(this.deg2Rad(lat2)) * Math.cos(this.deg2Rad(theta));
            dist = Math.acos(dist);
            dist = this.rad2Deg(dist);
            dist = dist * 60 * 1.1515;
            return (dist * 10) / 10;
        },

        /**
        * Convert the  degrees  to radians
        * @param {object} deg is degree which converts to radians
        * @return radians value
        * @memberOf widgets/searchSettings/searchSettings
        */
        deg2Rad: function (deg) {
            return (deg * Math.PI) / 180.0;
        },

        /**
        * Convert the radians to degrees
        * @param {object} rad is radians which converts to degree
        * @return degree value
        * @memberOf widgets/searchSettings/searchSettings
        */
        rad2Deg: function (rad) {
            return (rad / Math.PI) * 180.0;
        },

        /**
        * create route for two points
        * @param {object} routeObject contains Start point, End point, widget name and query URL
        * @memberOf widgets/searchSettings/searchSettings
        */
        showRoute: function (routeObject) {
            dojo.sharedGeolocation = null;
            topic.publish("showProgressIndicator");
            this.removeRouteAndGraphics();
            this.removeRouteGraphichOfDirectionWidget();
            var geoArray;
            geoArray = [];
            geoArray.push(routeObject.StartPoint.geometry);
            geoArray.push(routeObject.EndPoint[routeObject.Index].geometry);
            this.routeObject = routeObject;
            this._esriDirectionsWidget.updateStops(geoArray).then(lang.hitch(this, function () {
                this._esriDirectionsWidget.getDirections();
            }),
                function (err) {
                    alert(err);
                    topic.publish("hideProgressIndicator");
                });
        },

        /**
        * execute this function when route is not calculated due to any error
        * @param{object} routeObject contains route information
        * @memberOf widgets/searchResult/searchResult
        */
        _executeWhenRouteNotCalculated: function (routeObject) {
            if (routeObject.WidgetName.toLowerCase() === "activitysearch") {
                this.removeBuffer();
                this.executeWithoutGeolocation(this.featureSetWithoutNullValue, routeObject.QueryURL, routeObject.WidgetName, 0);
            }
            if (routeObject.WidgetName.toLowerCase() === "searchedfacility") {
                this.removeBuffer();
                this.executeWithoutGeolocation(this.featureSetWithoutNullValue, routeObject.QueryURL, routeObject.WidgetName, routeObject.Index);
            }
            if (routeObject.WidgetName.toLowerCase() === "event") {
                this.removeBuffer();
                this.executeWithoutGeolocation(this.featureSetWithoutNullValue, routeObject.QueryURL, routeObject.WidgetName, routeObject.Index);
            }
        },

        /**
        * highlight the nearest feature on the amp
        * @param{object} featureGeometry contains feature
        * @memberOf widgets/searchResult/searchResult
        */
        highlightFeature: function (featureGeometry) {
            var symbol;
            this.clearHighlightFeature();
            if (featureGeometry) {
                symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, dojo.configData.LocatorRippleSize, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([parseInt(dojo.configData.RippleColor.split(",")[0], 10), parseInt(dojo.configData.RippleColor.split(",")[1], 10), parseInt(dojo.configData.RippleColor.split(",")[2], 10)]), 4), new dojo.Color([0, 0, 0, 0]));
                this.map.getLayer("highlightLayerId").add(new esri.Graphic(featureGeometry, symbol, {}, null));
            }
        },

        /**
        * clear the highlight feature graphic on the map
        * @memberOf widgets/searcSettings/searcSettings
        */
        clearHighlightFeature: function () {
            this.map.getLayer("highlightLayerId").clear();
        },

        /**
        * clear the clear Locator Graphics on the map
        * @memberOf widgets/searcSettings/searcSettings
        */
        clearLocatorGraphics: function () {
            this.map.getLayer("esriGraphicsLayerMapSettings").clear();
        },

        /**
        * query on Comment Layer
        * @param {object} queryObject Contains FeatureData, Index, Layer URL, WidgetName, Address, IsRouteCreated{boolean}
        * @memberOf widgets/searcSettings/searcSettings
        */
        queryCommentLayer: function (queryObject) {
            var queryTask, esriQuery, deferredArray = [], deferredListResult, commentArray, k, j, resultcontent, featureId;
            try {
                array.forEach(dojo.configData.ActivitySearchSettings, (lang.hitch(this, function (activitySearchSettings) {
                    queryTask = new esri.tasks.QueryTask(activitySearchSettings.CommentsSettings.QueryURL);
                    esriQuery = new esri.tasks.Query();
                    esriQuery.outFields = ["*"];
                    esriQuery.returnGeometry = true;
                    if (queryObject.FeatureData) {
                        if (queryObject.WidgetName.toLowerCase() === "infoactivity") {
                            esriQuery.where = dojo.configData.ActivitySearchSettings[0].CommentsSettings.ForeignKeyFieldForActivity + "=" + queryObject.FeatureData[this.objectIdForActivityLayer];
                            featureId = queryObject.FeatureData[this.objectIdForActivityLayer];
                        } else {
                            esriQuery.where = dojo.configData.ActivitySearchSettings[0].CommentsSettings.ForeignKeyFieldForActivity + "=" + queryObject.FeatureData[queryObject.Index].attributes[this.objectIdForActivityLayer];
                        }
                        deferredArray.push(queryTask.execute(esriQuery, lang.hitch(this, this._executeQueryTask)));
                        deferredListResult = new DeferredList(deferredArray);
                        deferredListResult.then(lang.hitch(this, function (result) {
                            commentArray = [];
                            if (result.length > 0) {
                                for (j = 0; j < result.length; j++) {
                                    if (result[j][0] && result[j][1].features) {
                                        for (k = 0; k < result[j][1].features.length; k++) {
                                            commentArray.push(result[j][1].features[k]);
                                        }
                                    }
                                }
                                if (commentArray) {
                                    commentArray.sort(lang.hitch(this, function (a, b) {
                                        return b.attributes[this.objectIdForCommentLayer] - a.attributes[this.objectIdForCommentLayer];
                                    }));
                                }
                                switch (queryObject.WidgetName.toLowerCase()) {
                                case "activitysearch":
                                    topic.publish("showProgressIndicator");
                                    resultcontent = { "value": 0 };
                                    this.carouselContainer.showCarouselContainer();
                                    this.carouselContainer.show();
                                    this.highlightFeature(queryObject.FeatureData[0].geometry);
                                    if (!queryObject.IsRouteCreated) {
                                        this.map.centerAt(queryObject.FeatureData[0].geometry);
                                    }
                                    this.setSearchContent(queryObject.FeatureData, false, queryObject.QueryURL, queryObject.WidgetName);
                                    this._createCommonPods(queryObject, commentArray, resultcontent);
                                    topic.publish("hideProgressIndicator");
                                    break;
                                case "searchedfacility":
                                    topic.publish("showProgressIndicator");
                                    this.highlightFeature(queryObject.FeatureData[queryObject.Index].geometry);
                                    if (!queryObject.IsRouteCreated) {
                                        this.map.centerAt(queryObject.FeatureData[queryObject.Index].geometry);
                                    }
                                    resultcontent = { "value": queryObject.Index };
                                    this._createCommonPods(queryObject, commentArray, resultcontent);
                                    topic.publish("hideProgressIndicator");
                                    break;
                                case "unifiedsearch":
                                    topic.publish("showProgressIndicator");
                                    resultcontent = { "value": 0 };
                                    this.carouselContainer.showCarouselContainer();
                                    this.carouselContainer.show();
                                    this.highlightFeature(queryObject.FeatureData[0].geometry);
                                    if (!queryObject.IsRouteCreated) {
                                        this.map.centerAt(queryObject.FeatureData[queryObject.Index].geometry);
                                    }
                                    this.setSearchContent(queryObject.FeatureData, false, queryObject.QueryURL, queryObject.WidgetName);
                                    this._createCommonPods(queryObject, commentArray, resultcontent);
                                    topic.publish("hideProgressIndicator");
                                    break;
                                case "infoactivity":
                                    resultcontent = { "value": 0 };
                                    if (commentArray !== null) {
                                        this._setInfoWindowComment(commentArray, resultcontent, featureId);
                                    }
                                    topic.publish("hideProgressIndicator");
                                    break;
                                case "default":
                                    break;
                                }
                            }
                            if (window.location.href.toString().split("$isShowPod=").length > 1) {
                                if (window.location.href.toString().split("$isShowPod=")[1].split("$")[0].toString() === "false") {
                                    this.carouselContainer.hide();
                                }
                            }
                        }), function (err) {
                            this._createPodWithoutCommentLayer(queryObject);
                            topic.publish("hideProgressIndicator");
                        });
                    }
                })));
            } catch (error) {
                this._createPodWithoutCommentLayer(queryObject);
                topic.publish("hideProgressIndicator");
            }
        },

        /**
        * Common bottom pod creation
        * @param {object} queryObject contails  feature imformation
        * @param {object} commentArray contails  feature imformation
        * @param {object} resultcontent contails  information about the selected row
        * @memberOf widgets/searchSettings/searchSettings
        */
        _createCommonPods: function (queryObject, commentArray, resultcontent) {
            var directionObject, facilityObject, locatorParamsForCarouselContainer, locatorObjectForCarouselContainer, divDirectioncontent, activityMapPoint, routeObject, divHeader, searchContenData, mapPoint;
            facilityObject = { "Feature": queryObject.FeatureData, "SelectedItem": resultcontent, "QueryURL": queryObject.QueryURL, "WidgetName": queryObject.WidgetName };
            this.setFacility(facilityObject);
            if (queryObject.SolveRoute === null) {
                divDirectioncontent = query(".esriCTDivDirectioncontent")[0];
                if (divDirectioncontent) {
                    domConstruct.empty(divDirectioncontent);

                    locatorParamsForCarouselContainer = {
                        defaultAddress: dojo.configData.LocatorSettings.LocatorDefaultAddress,
                        preLoaded: false,
                        parentDomNode: divDirectioncontent,
                        map: this.map,
                        graphicsLayerId: "esriGraphicsLayerMapSettings",
                        locatorSettings: dojo.configData.LocatorSettings,
                        configSearchSettings: dojo.configData.SearchSettings
                    };
                    searchContenData = this.getKeyValue(dojo.configData.ActivitySearchSettings[0].SearchDisplayFields);
                    divHeader = domConstruct.create("div", {}, divDirectioncontent);
                    domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": sharedNls.titles.directionText + " " + queryObject.FeatureData[resultcontent.value].attributes[searchContenData] }, divHeader);
                    activityMapPoint = this.map.getLayer(locatorParamsForCarouselContainer.graphicsLayerId);
                    locatorObjectForCarouselContainer = new LocatorTool(locatorParamsForCarouselContainer);
                    locatorObjectForCarouselContainer.candidateClicked = lang.hitch(this, function (graphic) {
                        dojo.addressLocationDirectionActivity = locatorObjectForCarouselContainer.selectedGraphic.geometry.x.toString() + "," + locatorObjectForCarouselContainer.selectedGraphic.geometry.y.toString();
                        if (graphic && graphic.attributes && graphic.attributes.address) {
                            this.locatorAddress = graphic.attributes.address;
                        }
                        if (!this.sharedGraphic) {
                            topic.publish("hideInfoWindow");
                        }
                        this._clearBuffer();
                        this.removeGeolocationPushPin();
                        routeObject = { "StartPoint": activityMapPoint.graphics[0], "EndPoint": queryObject.FeatureData, "Index": 0, "WidgetName": queryObject.WidgetName, "QueryURL": queryObject.QueryURL };
                        this.showRoute(routeObject);
                    });
                }
            } else {
                directionObject = { "Feature": queryObject.FeatureData, "SelectedItem": resultcontent, "SolveRoute": queryObject.SolveRoute, "Address": queryObject.Address, "WidgetName": queryObject.WidgetName };
                this.setDirection(directionObject);
            }
            this.setGallery(queryObject.FeatureData, resultcontent);
            if (commentArray !== null) {
                this.setComment(queryObject.FeatureData, commentArray, resultcontent);
            }
            if (window.location.href.toString().split("$addressLocationDirectionActivity=").length > 1) {
                mapPoint = new Point(window.location.href.toString().split("$addressLocationDirectionActivity=")[1].split("$")[0].split(",")[0], window.location.href.toString().split("$addressLocationDirectionActivity=")[1].split("$")[0].split(",")[1], this.map.spatialReference);
                locatorObjectForCarouselContainer._locateAddressOnMap(mapPoint, true);
                routeObject = { "StartPoint": activityMapPoint.graphics[0], "EndPoint": queryObject.FeatureData, "Index": 0, "WidgetName": queryObject.WidgetName, "QueryURL": queryObject.QueryURL };
                this.showRoute(routeObject);
            }
        },

        /**
        * Create pod when comment layer fires some error
        * @param {object} queryObject contails  feature imformation
        * @memberOf widgets/searchSettings/searchSettings
        */
        _createPodWithoutCommentLayer: function (queryObject) {
            var resultcontent;
            if (queryObject.WidgetName.toLowerCase() === "activitysearch") {
                topic.publish("showProgressIndicator");
                resultcontent = { "value": 0 };
                this.carouselContainer.showCarouselContainer();
                this.carouselContainer.show();
                this.highlightFeature(queryObject.FeatureData[0].geometry);
                this.map.centerAt(queryObject.FeatureData[0].geometry);
                this.setSearchContent(queryObject.FeatureData, false, queryObject.QueryURL, queryObject.WidgetName);
                this._createCommonPods(queryObject, null, resultcontent);
                this.setCommentForError();
                topic.publish("hideProgressIndicator");
            }
            if (queryObject.WidgetName.toLowerCase() === "searchedfacility") {
                topic.publish("showProgressIndicator");
                this.highlightFeature(queryObject.FeatureData[queryObject.Index].geometry);
                this.map.centerAt(queryObject.FeatureData[queryObject.Index].geometry);
                resultcontent = { "value": queryObject.Index };
                this._createCommonPods(queryObject, null, resultcontent);
                this.setCommentForError();
                topic.publish("hideProgressIndicator");
            }
        },

        /**
        * execute query task for Comment Layer
        * @param {object} relatedRecords Contains Comment layer URL
        * @memberOf widgets/searcSettings/searcSettings
        */
        _executeQueryTask: function (relatedRecords) {
            var featureSet, i, deferred, features = [];
            deferred = new Deferred();
            featureSet = new esri.tasks.FeatureSet();
            if (relatedRecords.features.length > 0) {
                for (i = 0; i < relatedRecords.features.length; i++) {
                    if (relatedRecords.features.hasOwnProperty(i)) {
                        features.push(relatedRecords.features[i]);
                    }
                }
                featureSet.features = features;
            }
            deferred.resolve(relatedRecords);
        },

        /**
        * initialize the object of printMap Widget
        * @param {object} directions contains solve route result
        * @memberOf widgets/searchResult/searchResult
        */
        print: function (directions) {
            topic.publish("showProgressIndicator");
            this._esriDirectionsWidget._printDirections();
            topic.publish("hideProgressIndicator");
        },

        /**
        * convert the UTC time stamp from Millisecond
        * @param {object} utcMilliseconds contains UTC millisecond
        * @returns Date
        * @memberOf widgets/searchResult/searchResult
        */
        utcTimestampFromMs: function (utcMilliseconds) {
            return this.localToUtc(new Date(utcMilliseconds));
        },

        /**
        * convert the local time to UTC
        * @param {object} localTimestamp contains Local time
        * @returns Date
        * @memberOf widgets/searchResult/searchResult
        */
        localToUtc: function (localTimestamp) {
            return new Date(localTimestamp.getTime() + (localTimestamp.getTimezoneOffset() * 60000));
        },

        /**
        * Get the key field value from the config file
        * @param {data} keyField value with $ sign
        * @memberOf widgets/searchResult/searchResult
        */
        getKeyValue: function (data) {
            var firstPlace, secondPlace, keyValue;
            firstPlace = data.indexOf("{");
            secondPlace = data.indexOf("}");
            keyValue = data.substring(Number(firstPlace) + 1, secondPlace);
            return keyValue;
        },

        /**
        * create route for multiple points
        * @param {object} contains Start point, End point, widget name and query URL
        * @memberOf widgets/searchResult/searchResult
        */
        _showRouteForList: function (routeObject) {
            var geoArray, i;
            topic.publish("showProgressIndicator");
            this._clearGraphicsAndCarousel();
            this.removeRouteGraphichOfDirectionWidget();
            this.routeObject = routeObject;
            geoArray = [];
            geoArray.push(routeObject.StartPoint.geometry);
            for (i = 0; i < routeObject.EndPoint.length; i++) {
                geoArray.push(routeObject.EndPoint[i].geometry);
            }
            this._esriDirectionsWidget.updateStops(geoArray).then(lang.hitch(this, function () {
                this._esriDirectionsWidget.getDirections();
            }),
                function (err) {
                    alert(err);
                    topic.publish("hideProgressIndicator");
                });
        },

        /**
        * Highlight multiple features
        * @param {object} featureGeometry contains the feature geometry
        * @memberOf widgets/searchResult/searchResult
        */
        highlightMultipleFeatures: function (featureGeometry) {
            var symbol;
            if (featureGeometry) {
                symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, dojo.configData.LocatorRippleSize, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([parseInt(dojo.configData.RippleColor.split(",")[0], 10), parseInt(dojo.configData.RippleColor.split(",")[1], 10), parseInt(dojo.configData.RippleColor.split(",")[2], 10)]), 4), new dojo.Color([0, 0, 0, 0]));
                this.map.getLayer("highlightLayerId").add(new esri.Graphic(featureGeometry, symbol, {}, null));
            }
        },

        /**
        * Converts min to hour
        * @param {string} string contains the minute
        * @memberOf widgets/searchResult/searchResult
        */
        convertMinToHr: function (minutes) {
            var hours, convertMinutes, displayTime;
            hours = Math.floor(Math.abs(minutes) / 60);
            convertMinutes = Math.round((Math.abs(minutes) % 60));
            if (hours === 0) {
                displayTime = convertMinutes + 'min';
            } else if (convertMinutes === 0) {
                displayTime = hours + 'hrs';
            } else {
                displayTime = hours + 'hrs' + ":" + convertMinutes + 'min';
            }
            return displayTime;
        },

        /**
        * Remove Graphics of Direction widget
        * @memberOf widgets/searchResult/searchResult
        */
        removeRouteGraphichOfDirectionWidget: function () {
            this._esriDirectionsWidget._clearRouteGraphics();
            this._esriDirectionsWidget.removeStops();
            this._esriDirectionsWidget._clearStopGraphics();
        },

        /**
        * Create Direction widget
        * @memberOf widgets/searchResult/searchResult
        */
        _createDirectionWidget: function () {
            var address, queryObject, resultcontent, facilityObject, directionObject;
            try {
                urlUtils.addProxyRule({
                    urlPrefix: dojo.configData.DrivingDirectionSettings.RouteServiceURL,
                    proxyUrl: dojo.configData.ProxyUrl
                });
                urlUtils.addProxyRule({
                    urlPrefix: dojo.configData.GeometryService,
                    proxyUrl: dojo.configData.ProxyUrl
                });
                this._esriDirectionsWidget = new Directions({
                    map: this.map,
                    directionsLengthUnits: units[dojo.configData.DrivingDirectionSettings.RouteUnit],
                    showTrafficOption: false,
                    dragging: false,
                    routeTaskUrl: dojo.configData.DrivingDirectionSettings.RouteServiceURL
                });
                this._esriDirectionsWidget.options.geocoderOptions.autoComplete = true;
                this._esriDirectionsWidget.autoSolve = false;
                this._esriDirectionsWidget.startup();
                this._esriDirectionsWidget.options.routeSymbol.color = new Color([parseInt(dojo.configData.DrivingDirectionSettings.RouteColor.split(",")[0], 10), parseInt(dojo.configData.DrivingDirectionSettings.RouteColor.split(",")[1], 10), parseInt(dojo.configData.DrivingDirectionSettings.RouteColor.split(",")[2], 10), parseFloat(dojo.configData.DrivingDirectionSettings.Transparency.split(",")[0], 10)]);
                this._esriDirectionsWidget.options.routeSymbol.width = parseInt(dojo.configData.DrivingDirectionSettings.RouteWidth, 10);
                this.own(on(this._esriDirectionsWidget, "directions-finish", lang.hitch(this, function (a) {
                    if (this.locatorAddress !== "") {
                        address = this.locatorAddress;
                    } else if (this.routeObject.StartPoint) {
                        address = sharedNls.titles.directionCurrentLocationText;
                    }
                    if (this._esriDirectionsWidget.directions !== null) {
                        if (!this.sharedGraphic) {
                            this._esriDirectionsWidget.zoomToFullRoute();
                        } else {
                            this.sharedGraphic = false;
                        }
                        switch (this.routeObject.WidgetName.toLowerCase()) {
                        case "activitysearch":
                            queryObject = { "FeatureData": this.routeObject.EndPoint, "SolveRoute": a.result.routeResults, "Index": this.routeObject.Index, "QueryURL": this.routeObject.QueryURL, "WidgetName": this.routeObject.WidgetName, "Address": address, "IsRouteCreated": true };
                            topic.publish("showProgressIndicator");
                            this.removeBuffer();
                            this.queryCommentLayer(queryObject);
                            break;
                        case "searchedfacility":
                            queryObject = { "FeatureData": this.routeObject.EndPoint, "SolveRoute": a.result.routeResults, "Index": this.routeObject.Index, "QueryURL": this.routeObject.QueryURL, "WidgetName": this.routeObject.WidgetName, "Address": address, "IsRouteCreated": true };
                            topic.publish("showProgressIndicator");
                            this.queryCommentLayer(queryObject);
                            break;
                        case "event":
                            this.removeCommentPod();
                            this.removeBuffer();
                            this.routeObject.EndPoint = this.removeEmptyValue(this.routeObject.EndPoint);
                            queryObject = { "FeatureData": this.routeObject.EndPoint, "SolveRoute": a.result.routeResults, "Index": this.routeObject.Index, "QueryURL": this.routeObject.QueryURL, "WidgetName": this.routeObject.WidgetName, "Address": address };
                            topic.publish("showProgressIndicator");
                            this.carouselContainer.showCarouselContainer();
                            this.carouselContainer.show();
                            this.setSearchContent(this.routeObject.EndPoint, false, this.routeObject.QueryURL, this.routeObject.WidgetName);
                            this.highlightFeature(this.routeObject.EndPoint[this.routeObject.Index].geometry);
                            this.map.centerAt(this.routeObject.EndPoint[this.routeObject.Index].geometry);
                            resultcontent = { "value": this.routeObject.Index };
                            facilityObject = { "Feature": this.routeObject.EndPoint, "SelectedItem": resultcontent, "QueryURL": this.routeObject.QueryURL, "WidgetName": this.routeObject.WidgetName };
                            this.setFacility(facilityObject);
                            directionObject = { "Feature": this.routeObject.EndPoint, "SelectedItem": resultcontent, "SolveRoute": a.result.routeResults, "Address": address, "WidgetName": this.routeObject.WidgetName };
                            this.setDirection(directionObject);
                            this.setGallery(this.routeObject.EndPoint, resultcontent);
                            topic.publish("hideProgressIndicator");
                            break;
                        case "unifiedsearch":
                            queryObject = { "FeatureData": this.routeObject.EndPoint, "SolveRoute": a.result.routeResults, "Index": this.routeObject.Index, "QueryURL": this.routeObject.QueryURL, "WidgetName": this.routeObject.WidgetName, "Address": address, "IsRouteCreated": true };
                            topic.publish("showProgressIndicator");
                            this.queryCommentLayer(queryObject);
                            break;
                        case "infoevent":
                            resultcontent = { "value": 0 };
                            this.removeBuffer();
                            directionObject = { "Feature": this.routeObject.EndPoint, "SelectedItem": resultcontent, "SolveRoute": a.result.routeResults, "Address": address, "WidgetName": this.routeObject.WidgetName };
                            this.setDirection(directionObject, true);
                            break;
                        case "infoactivity":
                            resultcontent = { "value": 0 };
                            this.removeBuffer();
                            directionObject = { "Feature": this.routeObject.EndPoint, "SelectedItem": resultcontent, "SolveRoute": a.result.routeResults, "Address": address, "WidgetName": this.routeObject.WidgetName };
                            this.setDirection(directionObject, true);
                            break;
                        case "routeforlist":
                            setTimeout(lang.hitch(this, function () {
                                this._esriDirectionsWidget._printDirections();
                            }), 2000);
                            break;
                        case "default":
                            break;
                        }
                        topic.publish("hideProgressIndicator");
                    } else {
                        if (this.routeObject.WidgetName.toLowerCase() === "routeforlist") {
                            alert(sharedNls.errorMessages.routeComment);
                            topic.publish("hideProgressIndicator");
                            this.isRouteCreated = false;
                        } else {
                            alert(sharedNls.errorMessages.routeComment);
                            this._executeWhenRouteNotCalculated(this.routeObject);
                            topic.publish("hideProgressIndicator");
                            this.isRouteCreated = false;
                        }
                        topic.publish("hideProgressIndicator");
                    }
                })));
                topic.publish("hideProgressIndicator");
            } catch (error) {
                alert(error);
                topic.publish("hideProgressIndicator");
            }
        }
    });
});