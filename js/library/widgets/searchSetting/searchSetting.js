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
    "widgets/print/printMap"

], function (declare, domConstruct, domStyle, domAttr, lang, on, domGeom, dom, array, domClass, query, string, Locator, Query, Deferred, DeferredList, QueryTask, Geometry, Graphic, GraphicsLayer, PictureMarkerSymbol, Point, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic, urlUtils, CarouselContainer, ActivitySearch, LocatorHelper, GeoLocation, RouteParameters, FeatureSet, SpatialReference, RouteTask, SimpleLineSymbol, units, Memory, InfoWindowHelper, LocatorTool, PrintMap) {
    // ========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, ActivitySearch, InfoWindowHelper, LocatorHelper], {
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
            var contHeight, locatorParams, locatorObject;
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
            this._createCarouselPod();
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
                this.createBuffer(locatorObject.selectedGraphic);
            });
            locatorObject.candidateClicked = lang.hitch(this, function (candidate) {
                if (candidate && candidate.attributes && candidate.attributes.address) {
                    this.locatorAddress = candidate.attributes.address;
                }
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
            this._getLayerInformaiton();
        },

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
        * create carousel pod and set it content
        * @memberOf widgets/searchSettings/searchSettings
        */
        _createCarouselPod: function () {
            var divCarouselPod, divGallerycontent, divPodInfoContainer, divcommentcontent, divHeader, divsearchcontent, i, key, carouselPodKey;
            for (i = 0; i < dojo.configData.BottomPanelInfoPodSettings.length; i++) {
                for (key in dojo.configData.BottomPanelInfoPodSettings[i]) {
                    if (dojo.configData.BottomPanelInfoPodSettings[i].hasOwnProperty(key)) {
                        if (dojo.configData.BottomPanelInfoPodSettings && dojo.configData.BottomPanelInfoPodSettings[i][key].Enabled) {
                            divCarouselPod = domConstruct.create("div", { "class": "esriCTBoxContainer" });
                            divPodInfoContainer = domConstruct.create("div", { "class": "esriCTInfoContainer" }, divCarouselPod);
                            carouselPodKey = key;
                            if (!dojo.configData.ActivitySearchSettings[0].CommentsSettings.Enabled) {
                                if (carouselPodKey.toLowerCase() === "commentspod") {
                                    carouselPodKey = "default";
                                }
                            }
                        } else {
                            domClass.replace(this.resultboxPanelContent, "esriCTresultboxPanelContentNotComment");
                            carouselPodKey = "default";
                        }
                        switch (carouselPodKey.toLowerCase()) {
                        case "searchresultpod":
                            divHeader = domConstruct.create("div", { "class": "esriCTDivHeadercontainer" }, divPodInfoContainer);
                            domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": sharedNls.titles.serchResultText }, divHeader);
                            divsearchcontent = domConstruct.create("div", { "class": "esriCTResultContent" }, divHeader);
                            domConstruct.create("div", { "class": "esriCTDivSearchResulContent" }, divsearchcontent);
                            break;
                        case "facilityinformationpod":
                            this.facilityContainer = domConstruct.create("div", { "class": "esriCTDivHeadercontainer" }, divPodInfoContainer);
                            this.divfacilitycontent = domConstruct.create("div", {}, this.facilityContainer);
                            domConstruct.create("div", { "class": "esriCTdivFacilityContent" }, this.divfacilitycontent);
                            break;
                        case "directionspod":
                            this.directionContainer = domConstruct.create("div", { "class": "esriCTDivHeadercontainer" }, divPodInfoContainer);
                            domConstruct.create("div", { "class": "esriCTDivDirectioncontent" }, this.directionContainer);
                            break;
                        case "gallerypod":
                            divHeader = domConstruct.create("div", { "class": "esriCTDivHeadercontainer" }, divPodInfoContainer);
                            domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": sharedNls.titles.galleryText }, divHeader);
                            divGallerycontent = domConstruct.create("div", { "class": "esriCTResultContent" }, divHeader);
                            domConstruct.create("div", { "class": "esriCTDivGalleryContent" }, divGallerycontent);
                            break;
                        case "commentspod":
                            divHeader = domConstruct.create("div", { "class": "esriCTDivHeadercontainer" }, divPodInfoContainer);
                            domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": sharedNls.titles.commentText }, divHeader);
                            divcommentcontent = domConstruct.create("div", { "class": "esriCTResultContent" }, divHeader);
                            domConstruct.create("div", { "class": "esriCTDivCommentContent" }, divcommentcontent);
                            break;
                        case "default":
                            break;
                        }
                        domAttr.set(divCarouselPod, "CarouselPodName", carouselPodKey);
                        this.carouselPodData.push(divCarouselPod);
                    }
                }
            }
        },

        /**
        * remove graphics from map
        * @memberOf widgets/searchSettings/searchSettings
        */
        removeGraphics: function () {
            this.clearRoute();
            this.map.getLayer("highlightLayerId").clear();
        },

        /**
        * remove graphics from map
        * @memberOf widgets/searchSettings/searchSettings
        */
        removeBuffer: function () {
            this.map.getLayer("tempBufferLayer").clear();
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
            this.clearRoute();
            this.map.getLayer("highlightLayerId").clear();
        },

        /**
        * clear the route graphic on the map
        * @memberOf widgets/searchSettings/searchSettings
        */
        clearRoute: function () {
            this.map.getLayer("routeLayerId").clear();
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
                                featureObject[i].attributes[j] = "";
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
            topic.publish("showProgressIndicator");
            this.removeRouteAndGraphics();
            var routeTask, address, routeParams, routeGraphic, symbols, directions, queryObject, directionObject, resultcontent, facilityObject;
            routeParams = new RouteParameters();
            routeParams.stops = new FeatureSet();
            routeParams.returnRoutes = true;
            routeParams.returnDirections = true;
            routeParams.directionsLengthUnits = dojo.configData.DrivingDirectionSettings.RouteUnit;
            routeParams.outSpatialReference = new SpatialReference({ wkid: 102100 });
            routeParams.stops.features.push(routeObject.StartPoint);
            routeParams.stops.features.push(routeObject.EndPoint[routeObject.Index]);
            routeTask = new RouteTask(dojo.configData.DrivingDirectionSettings.RouteServiceURL);
            if (this.locatorAddress !== "") {
                address = this.locatorAddress;
            } else if (routeObject.StartPoint) {
                address = sharedNls.titles.directionCurrentLocationText;
            }
            this.clearRoute();
            routeTask.solve(routeParams).then(lang.hitch(this, function (result) {
                this.isRouteCreated = true;
                directions = result.routeResults[0].directions;
                symbols = new SimpleLineSymbol().setColor(dojo.configData.DrivingDirectionSettings.RouteColor).setWidth(dojo.configData.DrivingDirectionSettings.RouteWidth);
                routeGraphic = new esri.Graphic(directions.mergedGeometry, symbols, null, null);
                this.map.getLayer("routeLayerId").add(routeGraphic);
                this.map.getLayer("routeLayerId").show();
                if (routeObject.WidgetName.toLowerCase() === "activitysearch") {
                    queryObject = { "FeatureData": routeObject.EndPoint, "SolveRoute": result.routeResults, "Index": routeObject.Index, "QueryURL": routeObject.QueryURL, "WidgetName": routeObject.WidgetName, "Address": address, "IsRouteCreated": true };
                    topic.publish("showProgressIndicator");
                    this.removeBuffer();
                    this.queryCommentLayer(queryObject);
                }
                if (routeObject.WidgetName.toLowerCase() === "searchedfacility") {
                    queryObject = { "FeatureData": routeObject.EndPoint, "SolveRoute": result.routeResults, "Index": routeObject.Index, "QueryURL": routeObject.QueryURL, "WidgetName": routeObject.WidgetName, "Address": address, "IsRouteCreated": true };
                    topic.publish("showProgressIndicator");
                    this.queryCommentLayer(queryObject);
                }
                if (routeObject.WidgetName.toLowerCase() === "event") {
                    this.removeCommentPod();
                    this.removeBuffer();
                    routeObject.EndPoint = this.removeEmptyValue(routeObject.EndPoint);
                    queryObject = { "FeatureData": routeObject.EndPoint, "SolveRoute": result.routeResults, "Index": routeObject.Index, "QueryURL": routeObject.QueryURL, "WidgetName": routeObject.WidgetName, "Address": address };
                    topic.publish("showProgressIndicator");
                    this.carouselContainer.showCarouselContainer();
                    this.carouselContainer.show();
                    this._setSearchContent(routeObject.EndPoint, false, routeObject.QueryURL, routeObject.WidgetName);
                    this.highlightFeature(routeObject.EndPoint[routeObject.Index].geometry);
                    this.map.centerAt(routeObject.EndPoint[routeObject.Index].geometry);
                    resultcontent = { "value": routeObject.Index };
                    facilityObject = { "Feature": routeObject.EndPoint, "SelectedItem": resultcontent, "QueryURL": routeObject.QueryURL, "WidgetName": routeObject.WidgetName };
                    this._setFacility(facilityObject);
                    directionObject = { "Feature": routeObject.EndPoint, "SelectedItem": resultcontent, "SolveRoute": result.routeResults, "Address": address, "WidgetName": routeObject.WidgetName };
                    this._setDirection(directionObject);
                    this._setGallery(routeObject.EndPoint, resultcontent);
                    topic.publish("hideProgressIndicator");
                }
                if (routeObject.WidgetName.toLowerCase() === "unifiedsearch") {
                    queryObject = { "FeatureData": routeObject.EndPoint, "SolveRoute": result.routeResults, "Index": routeObject.Index, "QueryURL": routeObject.QueryURL, "WidgetName": routeObject.WidgetName, "Address": address, "IsRouteCreated": true };
                    topic.publish("showProgressIndicator");
                    this.queryCommentLayer(queryObject);
                }
                if (routeObject.WidgetName.toLowerCase() === "infoevent" || routeObject.WidgetName.toLowerCase() === "infoactivity") {
                    resultcontent = { "value": 0 };
                    this.removeBuffer();
                    directionObject = { "Feature": routeObject.EndPoint, "SelectedItem": resultcontent, "SolveRoute": result.routeResults, "Address": address, "WidgetName": routeObject.WidgetName };
                    this._setDirection(directionObject, true);
                }
                this.map.setExtent(result.routeResults[0].directions.mergedGeometry.getExtent(), true);
                topic.publish("hideProgressIndicator");
            }), lang.hitch(this, function (error) {
                alert(sharedNls.errorMessages.routeComment);
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
                topic.publish("hideProgressIndicator");
                this.isRouteCreated = false;
            }), lang.hitch(this, function (error) {
                alert(sharedNls.errorMessages.routeComment);
                if (routeObject.WidgetName.toLowerCase() === "activitysearch") {
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
                topic.publish("hideProgressIndicator");
                this.isRouteCreated = false;
            }));
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
                symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, dojo.configData.LocatorRippleSize, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color(dojo.configData.RippleColor), 4), new dojo.Color([0, 0, 0, 0]));
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
                                if (queryObject.WidgetName.toLowerCase() === "activitysearch") {
                                    topic.publish("showProgressIndicator");
                                    resultcontent = { "value": 0 };
                                    this.carouselContainer.showCarouselContainer();
                                    this.carouselContainer.show();
                                    this.highlightFeature(queryObject.FeatureData[0].geometry);
                                    if (!queryObject.IsRouteCreated) {
                                        this.map.centerAt(queryObject.FeatureData[0].geometry);
                                    }
                                    this._setSearchContent(queryObject.FeatureData, false, queryObject.QueryURL, queryObject.WidgetName);
                                    this._createCommonPods(queryObject, commentArray, resultcontent);
                                    topic.publish("hideProgressIndicator");
                                }
                                if (queryObject.WidgetName.toLowerCase() === "searchedfacility") {
                                    topic.publish("showProgressIndicator");
                                    this.highlightFeature(queryObject.FeatureData[queryObject.Index].geometry);
                                    if (!queryObject.IsRouteCreated) {
                                        this.map.centerAt(queryObject.FeatureData[queryObject.Index].geometry);
                                    }
                                    resultcontent = { "value": queryObject.Index };
                                    this._createCommonPods(queryObject, commentArray, resultcontent);
                                    topic.publish("hideProgressIndicator");
                                }
                                if (queryObject.WidgetName.toLowerCase() === "unifiedsearch") {
                                    topic.publish("showProgressIndicator");
                                    resultcontent = { "value": 0 };
                                    this.carouselContainer.showCarouselContainer();
                                    this.carouselContainer.show();
                                    this.highlightFeature(queryObject.FeatureData[0].geometry);
                                    if (!queryObject.IsRouteCreated) {
                                        this.map.centerAt(queryObject.FeatureData[queryObject.Index].geometry);
                                    }
                                    this._setSearchContent(queryObject.FeatureData, false, queryObject.QueryURL, queryObject.WidgetName);
                                    this._createCommonPods(queryObject, commentArray, resultcontent);
                                    topic.publish("hideProgressIndicator");
                                }
                                if (queryObject.WidgetName.toLowerCase() === "infoactivity") {
                                    resultcontent = { "value": 0 };
                                    if (commentArray !== null) {
                                        this._setInfoWindowComment(commentArray, resultcontent, featureId);
                                    }
                                    topic.publish("hideProgressIndicator");
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
            var directionObject, facilityObject, locatorParamsForCarouselContainer, locatorObjectForCarouselContainer, divDirectioncontent, activityMapPoint, routeObject, divHeader, searchContenData;
            facilityObject = { "Feature": queryObject.FeatureData, "SelectedItem": resultcontent, "QueryURL": queryObject.QueryURL, "WidgetName": queryObject.WidgetName };
            this._setFacility(facilityObject);
            if (queryObject.SolveRoute === null) {
                divDirectioncontent = query(".esriCTDivDirectioncontent")[0];
                if (divDirectioncontent) {
                    domConstruct.empty(divDirectioncontent);
                }
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
                    if (graphic && graphic.attributes && graphic.attributes.address) {
                        this.locatorAddress = graphic.attributes.address;
                    }
                    this.removeGeolocationPushPin();
                    routeObject = { "StartPoint": activityMapPoint.graphics[0], "EndPoint": queryObject.FeatureData, "Index": 0, "WidgetName": queryObject.WidgetName, "QueryURL": queryObject.QueryURL };
                    this.showRoute(routeObject);
                });
            } else {
                directionObject = { "Feature": queryObject.FeatureData, "SelectedItem": resultcontent, "SolveRoute": queryObject.SolveRoute, "Address": queryObject.Address, "WidgetName": queryObject.WidgetName };
                this._setDirection(directionObject);
            }
            this._setGallery(queryObject.FeatureData, resultcontent);
            if (commentArray !== null) {
                this._setComment(queryObject.FeatureData, commentArray, resultcontent);
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
                this._setSearchContent(queryObject.FeatureData, false, queryObject.QueryURL, queryObject.WidgetName);
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
        * set the content in (Search result) carousel pod
        * @param {object} result contains features
        * @param {boolean} isBufferNeeded
        * @param {object} queryURL contains Layer URL
        * @param {string} widgetName contains name of widgets
        * @memberOf widgets/searchResult/searchResult
        */
        _setSearchContent: function (result, isBufferNeeded, queryURL, widgetName) {
            var isPodEnabled = this.getPodStatus("SearchResultPod"), searchContenTitle, searchedFacilityObject, divHeaderContent, i, resultcontent = [], milesCalulatedData, searchContenData;
            if (isPodEnabled) {
                if (widgetName.toLowerCase() === "unifiedsearch") {
                    searchContenTitle = sharedNls.titles.numberOfFeaturesFoundNearAddress;
                    searchContenData = this.getKeyValue(dojo.configData.ActivitySearchSettings[0].SearchDisplayFields);
                } else if (widgetName.toLowerCase() === "activitysearch") {
                    searchContenTitle = sharedNls.titles.numberOfFoundFeatureNearAddress;
                    searchContenData = this.getKeyValue(dojo.configData.ActivitySearchSettings[0].SearchDisplayFields);
                } else if (widgetName.toLowerCase() === "event") {
                    searchContenTitle = sharedNls.titles.numberOfFoundEventsNearAddress;
                    searchContenData = this.getKeyValue(dojo.configData.EventSearchSettings[0].SearchDisplayFields);
                }
                divHeaderContent = query('.esriCTDivSearchResulContent');
                if (divHeaderContent.length > 0) {
                    domConstruct.empty(divHeaderContent[0]);
                    this.spanFeatureListContainer = domConstruct.create("div", { "class": "esriCTSpanFeatureListContainer", "innerHTML": string.substitute(searchContenTitle, [result.length]) }, divHeaderContent[0]);
                    for (i = 0; i < result.length; i++) {
                        if (!isBufferNeeded && result[i].distance) {
                            milesCalulatedData = "(" + parseFloat(result[i].distance).toFixed(2) + "miles" + ")";
                        } else {
                            milesCalulatedData = "";
                        }
                        if (widgetName.toLowerCase() !== "event") {
                            resultcontent[i] = domConstruct.create("div", { "class": "esriCTSearchResultInfotext", "innerHTML": result[i].attributes[searchContenData] + milesCalulatedData }, divHeaderContent[0]);
                            domClass.add(resultcontent[0], "esriCTDivHighlightFacility");
                            domAttr.set(resultcontent[i], "value", i);
                            searchedFacilityObject = { "FeatureData": result, "SelectedRow": resultcontent[i], "IsBufferNeeded": isBufferNeeded, "QueryLayer": queryURL, "WidgetName": widgetName };
                            this.own(on(resultcontent[i], "click", lang.hitch(this, this._clickOnSearchedFacility, searchedFacilityObject)));
                        } else {
                            resultcontent[i] = domConstruct.create("div", { "class": "esriCTSearchResultInfotext", "innerHTML": result[i].attributes[searchContenData] + milesCalulatedData }, divHeaderContent[0]);
                        }
                    }
                }
            }
        },

        /**
        * set the content in (Facility) carousel pod if user click on search result data
        * @param {object} facilityObject contans feature, widget name, selected facility, Layer URL
        * @memberOf widgets/searchResult/searchResult
        */
        _setFacility: function (facilityObject) {
            var divHeaderContent, facilityContenTitle, infowWindowData, divHeader, divFacilityContainer, divFacilityContent, k, j, m, p, activityImageDiv, SearchSettingsLayers, isPodEnabled, divFacilityImages;
            isPodEnabled = this.getPodStatus("FacilityInformationPod");
            if (isPodEnabled) {
                divHeaderContent = query('.esriCTdivFacilityContent');
                if (divHeaderContent.length > 0) {
                    domConstruct.empty(divHeaderContent[0]);
                    divHeader = domConstruct.create("div", {}, divHeaderContent[0]);
                    if (facilityObject.WidgetName.toLowerCase() === "unifiedsearch") {
                        facilityContenTitle = this.getKeyValue(dojo.configData.ActivitySearchSettings[0].SearchDisplayFields);
                    } else if (facilityObject.WidgetName.toLowerCase() === "activitysearch") {
                        facilityContenTitle = this.getKeyValue(dojo.configData.ActivitySearchSettings[0].SearchDisplayFields);
                    } else if (facilityObject.WidgetName.toLowerCase() === "event") {
                        facilityContenTitle = this.getKeyValue(dojo.configData.EventSearchSettings[0].SearchDisplayFields);
                    } else if (facilityObject.WidgetName.toLowerCase() === "searchedfacility") {
                        facilityContenTitle = this.getKeyValue(dojo.configData.ActivitySearchSettings[0].SearchDisplayFields);
                    }
                    facilityObject.Feature = this.removeNullValue(facilityObject.Feature);
                    for (p = 0; p < dojo.configData.InfoWindowSettings.length; p++) {
                        if (facilityObject.QueryURL === dojo.configData.InfoWindowSettings[p].InfoQueryURL) {
                            infowWindowData = dojo.configData.InfoWindowSettings[p].InfoWindowData;
                            break;
                        }
                    }
                    if (facilityObject.SelectedItem && facilityObject.Feature) {
                        domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": facilityObject.Feature[facilityObject.SelectedItem.value].attributes[facilityContenTitle] }, divHeader);
                        divFacilityContainer = domConstruct.create("div", { "class": "esriCTResultContent" }, divHeaderContent[0]);
                        divFacilityContent = domConstruct.create("div", {}, divFacilityContainer);
                        if (infowWindowData.length === 0) {
                            domConstruct.create("div", { "class": "esriCTInfoText", "innerHTML": "Feilds are not configured." }, divFacilityContent);
                        }
                        for (j = 0; j < infowWindowData.length; j++) {
                            domConstruct.create("div", { "class": "esriCTInfoText", "innerHTML": infowWindowData[j].DisplayText + " " + string.substitute(infowWindowData[j].FieldName, facilityObject.Feature[facilityObject.SelectedItem.value].attributes) }, divFacilityContent);
                        }
                        if (facilityObject.WidgetName.toLowerCase() !== "event") {
                            domConstruct.create("div", { "class": "esriCTCarouselUtilitiesHeader", "innerHTML": sharedNls.titles.carouselUtilitiesText }, divFacilityContent);
                            divFacilityImages = domConstruct.create("div", { "class": "esriCTDivFacilityImages" }, divFacilityContent);
                            if (facilityObject.Feature) {
                                for (m = 0; m < dojo.configData.ActivitySearchSettings.length; m++) {
                                    SearchSettingsLayers = dojo.configData.ActivitySearchSettings[m];
                                }
                                for (k = 0; k < SearchSettingsLayers.ActivityList.length; k++) {
                                    if (dojo.string.substitute(SearchSettingsLayers.ActivityList[k].FieldName, facilityObject.Feature[facilityObject.SelectedItem.value].attributes)) {
                                        if (facilityObject.Feature[facilityObject.SelectedItem.value].attributes[dojo.string.substitute(SearchSettingsLayers.ActivityList[k].FieldName, facilityObject.Feature[facilityObject.SelectedItem.value].attributes)] === "Yes") {
                                            activityImageDiv = domConstruct.create("div", { "class": "esriCTActivityImage" }, divFacilityImages);
                                            domConstruct.create("img", { "src": SearchSettingsLayers.ActivityList[k].Image }, activityImageDiv);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },

        /**
        * set the content in (Direction) carousel pod if user click on search result data
        * @param {object} directionObject contains widget name, solve route results, selected facility
        * @param {boolean} isInfoWindowClick
        * @memberOf widgets/searchResult/searchResult
        */
        _setDirection: function (directionObject, isInfoWindowClick) {
            var isPodEnabled = this.getPodStatus("DirectionsPod"), divHeaderContent, directionTitle, divHeader, divDirectionContainer, divDrectionContent, distanceAndDuration, printButton, j, divDrectionList, printmapData;
            if (isInfoWindowClick) {
                isPodEnabled = true;
                divHeaderContent = query('.esriCTDirectionMainContainer');
            } else {
                divHeaderContent = query('.esriCTDivDirectioncontent');
            }
            if (isPodEnabled) {
                if (divHeaderContent.length > 0) {
                    domConstruct.empty(divHeaderContent[0]);
                    if (directionObject.WidgetName.toLowerCase() === "unifiedsearch") {
                        directionTitle = this.getKeyValue(dojo.configData.ActivitySearchSettings[0].SearchDisplayFields);
                    } else if (directionObject.WidgetName.toLowerCase() === "activitysearch") {
                        directionTitle = this.getKeyValue(dojo.configData.ActivitySearchSettings[0].SearchDisplayFields);
                    } else if (directionObject.WidgetName.toLowerCase() === "event") {
                        directionTitle = this.getKeyValue(dojo.configData.EventSearchSettings[0].SearchDisplayFields);
                    } else {
                        directionTitle = this.getKeyValue(dojo.configData.ActivitySearchSettings[0].SearchDisplayFields);
                    }
                    divHeader = domConstruct.create("div", {}, divHeaderContent[0]);
                    if (directionObject.SelectedItem) {
                        domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": sharedNls.titles.directionText + " " + directionObject.Feature[directionObject.SelectedItem.value].attributes[directionTitle] }, divHeader);
                        //set start location text
                        directionObject.SolveRoute[0].directions.features[0].attributes.text = directionObject.SolveRoute[0].directions.features[0].attributes.text.replace('Location 1', directionObject.Address);
                        if (directionObject.WidgetName.toLowerCase() !== "infoactivity" && directionObject.WidgetName.toLowerCase() !== "infoevent") {
                            printButton = domConstruct.create("div", { "class": "esriCTDivPrint", "title": sharedNls.tooltips.printButtonooltips }, divHeader);
                            printmapData = {
                                "Features": directionObject.SolveRoute[0].directions.features,
                                "Title": sharedNls.titles.directionText + " " + directionObject.Feature[directionObject.SelectedItem.value].attributes[directionTitle],
                                "Distance": sharedNls.titles.directionTextDistance + parseFloat(directionObject.SolveRoute[0].directions.totalLength).toFixed(2) + "mi",
                                "Time": sharedNls.titles.directionTextTime + parseFloat(directionObject.SolveRoute[0].directions.totalDriveTime).toFixed(2) + "min"
                            };
                            this.own(on(printButton, "click", lang.hitch(this, this._printMap, printmapData)));
                        }
                        divDirectionContainer = domConstruct.create("div", { "class": "esriCTDirectionResultContent" }, divHeaderContent[0]);
                        distanceAndDuration = domConstruct.create("div", { "class": "esriCTDistanceAndDuration" }, divHeader);
                        domConstruct.create("div", { "class": "esriCTDivDistance", "innerHTML": sharedNls.titles.directionTextDistance + parseFloat(directionObject.SolveRoute[0].directions.totalLength).toFixed(2) + "mi" }, distanceAndDuration);
                        domConstruct.create("div", { "class": "esriCTDivTime", "innerHTML": sharedNls.titles.directionTextTime + parseFloat(directionObject.SolveRoute[0].directions.totalDriveTime).toFixed(2) + "min" }, distanceAndDuration);
                        divDrectionContent = domConstruct.create("div", { "class": "esriCTDirectionRow" }, divDirectionContainer);
                        divDrectionList = domConstruct.create("ol", {}, divDrectionContent);
                        domConstruct.create("li", { "class": "esriCTInfotextDirection", "innerHTML": directionObject.SolveRoute[0].directions.features[0].attributes.text }, divDrectionList);
                        for (j = 1; j < directionObject.SolveRoute[0].directions.features.length; j++) {
                            domConstruct.create("li", { "class": "esriCTInfotextDirection", "innerHTML": directionObject.SolveRoute[0].directions.features[j].attributes.text + "(" + parseFloat(directionObject.SolveRoute[0].directions.features[j].attributes.length).toFixed(2) + "miles" + ")" }, divDrectionList);
                        }
                    }
                }
            }
        },

        /**
        * initialize the object of printMap Widget
        * @param {object} directions contains solve route result
        * @memberOf widgets/searchResult/searchResult
        */
        _printMap: function (directions) {
            topic.publish("showProgressIndicator");
            this.printMap = new PrintMap({ map: this.map, "directions": directions });
            topic.publish("hideProgressIndicator");
        },


        /**
        * set the images in (Gallery) carousel pod
        * @param {object} selectedFeature contains the information of search result
        * @param {object} resultcontent store the value of the click of search result
        * @memberOf widgets/searchResult/searchResult
        */
        _setGallery: function (selectedFeature, resultcontent) {
            var isPodEnabled = this.getPodStatus("GalleryPod"), divHeaderContent, layerID;
            if (isPodEnabled) {
                divHeaderContent = query('.esriCTDivGalleryContent');
                if (divHeaderContent.length > 0) {
                    domConstruct.empty(divHeaderContent[0]);
                }
                if (this.map._layers) {
                    for (layerID in this.map._layers) {
                        if (this.map._layers.hasOwnProperty(layerID)) {
                            if (this.map._layers[layerID].url && this.map._layers[layerID].hasAttachments && (this.map._layers[layerID].url === dojo.configData.ActivitySearchSettings[0].QueryURL)) {
                                this.map._layers[layerID].queryAttachmentInfos(selectedFeature[resultcontent.value].attributes[this.map._layers[layerID].objectIdField], lang.hitch(this, this._setAttachments), this._logError);
                                break;
                            }
                        }
                    }
                }
            }
        },

        /**
        * query on attachment and show the images on carousel pod
        * @param {object} response contain the images which are in the feature layer
        * @memberOf widgets/searchResult/searchResult
        */
        _setAttachments: function (response) {
            topic.publish("showProgressIndicator");
            var divAttchment, divHeaderContent, divPreviousImg, divNextImg;
            this.imageCount = 0;
            divHeaderContent = query('.esriCTDivGalleryContent');
            if (divHeaderContent) {
                domConstruct.empty(divHeaderContent[0]);
            }
            if (response.length > 1) {
                divPreviousImg = domConstruct.create("div", { "class": "esriCTImgPrev" }, divHeaderContent[0]);
                divNextImg = domConstruct.create("div", { "class": "esriCTImgNext" }, divHeaderContent[0]);
                divAttchment = domConstruct.create("img", { "class": "esriCTDivAttchment" }, divHeaderContent[0]);
                domAttr.set(divAttchment, "src", response[0].url);
                this.own(on(divPreviousImg, "click", lang.hitch(this, this._previousImage, response, divAttchment)));
                this.own(on(divNextImg, "click", lang.hitch(this, this._nextImage, response, divAttchment)));

            } else if (response.length === 1) {
                divAttchment = domConstruct.create("img", { "class": "esriCTDivAttchment" }, divHeaderContent[0]);
                domAttr.set(divAttchment, "src", response[0].url);
            } else {
                domConstruct.create("div", { "class": "esriCTGalleryBox", "innerHTML": sharedNls.errorMessages.imageDoesNotFound }, divHeaderContent[0]);
            }
            topic.publish("hideProgressIndicator");
        },

        /**
        * change the image when click on previous arrow of image
        * @param {object} response contain the images which are in the feature layer
        * @param {node} divAttchmentInfo is domNode
        * @memberOf widgets/searchResult/searchResult
        */
        _previousImage: function (response, divAttchment) {
            this.imageCount--;
            if (this.imageCount < 0) {
                this.imageCount = response.length - 1;
            }
            domAttr.set(divAttchment, "src", response[this.imageCount].url);
        },

        /**
        * change the image when click on next arrow of image
        * @param {object} response contain the images which are in the feature layer
        * @param {node} divAttchmentInfo is domNode
        * @memberOf widgets/searchResult/searchResult
        */
        _nextImage: function (response, divAttchment) {
            this.imageCount++;
            if (this.imageCount === response.length) {
                this.imageCount = 0;
            }
            domAttr.set(divAttchment, "src", response[this.imageCount].url);
        },

        /**
        * show error in console
        * @memberOf widgets/searchResult/searchResult
        */
        _logError: function (error) {
            console.log(error);
        },
        /**
        * set the content in (Comments) carousel pod
        * @param {object} feature contains feature
        * @param {object} result contains features array
        * @param {object} resultcontent store the value of the click of search result
        * @memberOf widgets/searchResult/searchResult
        */
        _setComment: function (feature, result, resultcontent) {
            var isPodEnabled = this.getPodStatus("CommentsPod"), divHeaderContent, j, index, divHeaderStar, divStar, commentAttribute, utcMilliseconds, l, isCommentFound, rankFieldAttribute, esriCTCommentDateStar, divCommentRow;
            if (isPodEnabled) {
                for (index = 0; index < dojo.configData.ActivitySearchSettings.length; index++) {
                    if (dojo.configData.ActivitySearchSettings[index].CommentsSettings.Enabled) {
                        divHeaderContent = query('.esriCTDivCommentContent');
                        if (result.length === 0) {
                            if (divHeaderContent[0]) {
                                domConstruct.empty(divHeaderContent[0]);
                            }
                            divCommentRow = domConstruct.create("div", { "class": "esriCTRowNoComment" }, divHeaderContent[0]);
                            domConstruct.create("div", { "class": "esriCTInfotextRownoComment", "innerHTML": sharedNls.errorMessages.noCommentAvaiable }, divCommentRow);
                            return;
                        }
                        result = this.removeNullValue(result);
                        isCommentFound = false;
                        if (result.length !== 0) {
                            divHeaderContent = query('.esriCTDivCommentContent');
                            if (divHeaderContent[0]) {
                                domConstruct.empty(divHeaderContent[0]);
                            }
                            for (l = 0; l < result.length; l++) {
                                rankFieldAttribute = string.substitute(dojo.configData.ActivitySearchSettings[index].CommentsSettings.RankField, result[l].attributes);
                                commentAttribute = string.substitute(dojo.configData.ActivitySearchSettings[index].CommentsSettings.CommentField, result[l].attributes);
                                if (feature[resultcontent.value].attributes[this.objectIdForCommentLayer] === Number(result[l].attributes.id)) {
                                    if (commentAttribute) {
                                        divCommentRow = domConstruct.create("div", { "class": "esriCTDivCommentRow" }, divHeaderContent[0]);
                                        isCommentFound = true;
                                        esriCTCommentDateStar = domConstruct.create("div", { "class": "esriCTCommentDateStar" }, divCommentRow);
                                        divHeaderStar = domConstruct.create("div", { "class": "esriCTHeaderRatingStar" }, esriCTCommentDateStar);
                                        for (j = 0; j < 5; j++) {
                                            divStar = domConstruct.create("span", { "class": "esriCTRatingStar" }, divHeaderStar);
                                            if (j < rankFieldAttribute) {
                                                domClass.add(divStar, "esriCTRatingStarChecked");
                                            }
                                        }
                                        if (string.substitute(dojo.configData.ActivitySearchSettings[index].CommentsSettings.SubmissionDateField, result[l].attributes) === null) {
                                            utcMilliseconds = 0;
                                        } else {
                                            utcMilliseconds = Number(dojo.string.substitute(dojo.configData.ActivitySearchSettings[index].CommentsSettings.SubmissionDateField, result[l].attributes));
                                        }
                                        domConstruct.create("div", { "class": "esriCTCommentText", "innerHTML": commentAttribute }, divCommentRow);
                                        domConstruct.create("div", { "class": "esriCTCommentDate", "innerHTML": dojo.date.locale.format(this.utcTimestampFromMs(utcMilliseconds), { datePattern: dojo.configData.ActivitySearchSettings[index].CommentsSettings.DisplayDateFormat, selector: "date" }) }, esriCTCommentDateStar);
                                    }
                                }
                            }
                        }
                        if (!isCommentFound) {
                            divCommentRow = domConstruct.create("div", { "class": "esriCTDivCommentRow" }, divHeaderContent[0]);
                            domConstruct.create("div", { "class": "esriCTInfotextRownoComment", "innerHTML": sharedNls.errorMessages.noCommentAvaiable }, divCommentRow);
                        }
                    }
                }
            }
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
        }
    });
});
