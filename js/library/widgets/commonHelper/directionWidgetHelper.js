/*global define,dojo,dojoConfig:true,alert,esri,Modernizr,dijit */
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
    "dijit/_WidgetBase",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/topic",
    "esri/tasks/BufferParameters",
    "dojo/_base/Color",
    "esri/tasks/GeometryService",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/dijit/Directions",
    "esri/urlUtils",
    "esri/units",
    "widgets/locator/locator"

], function (declare, domConstruct, domStyle, domAttr, lang, on, array, domClass, query, string, Locator, Query, Deferred, DeferredList, QueryTask, Geometry, Graphic, Point, _WidgetBase, sharedNls, topic, BufferParameters, Color, GeometryService, SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, Directions, urlUtils, units, LocatorTool) {
    // ========================================================================================================================//

    return declare([_WidgetBase], {
        sharedNls: sharedNls,                                       // Variable for shared NLS
        _esriDirectionsWidget: null,                                // Variable for Direction widget
        featureSetWithoutNullValue: null,                           // Variable for store the featureSet Without NullValue

        /**
        * Create Direction widget
        * @memberOf widgets/commonHelper/directionWidgetHelper
        */
        _createDirectionWidget: function () {
            var address, queryObject, resultcontent, facilityObject, directionObject;
            try {
                //proxy setting for routeService
                urlUtils.addProxyRule({
                    urlPrefix: dojo.configData.DrivingDirectionSettings.RouteServiceURL,
                    proxyUrl: dojo.configData.ProxyUrl
                });
                //proxy setting for GeometryService
                urlUtils.addProxyRule({
                    urlPrefix: dojo.configData.GeometryService,
                    proxyUrl: dojo.configData.ProxyUrl
                });
                //creating esriDirection widget.
                this._esriDirectionsWidget = new Directions({
                    map: this.map,
                    directionsLengthUnits: units[dojo.configData.DrivingDirectionSettings.RouteUnit.toUpperCase()],
                    showTrafficOption: false,
                    dragging: false,
                    routeTaskUrl: dojo.configData.DrivingDirectionSettings.RouteServiceURL
                });
                //set geocoderOptions is autoComplete for ersiDirection widget
                this._esriDirectionsWidget.options.geocoderOptions.autoComplete = true;
                this._esriDirectionsWidget.autoSolve = false;
                this._esriDirectionsWidget.deactivate();
                //calling esriDirection widget
                this._esriDirectionsWidget.startup();
                // set the color of route in direction widget
                this._esriDirectionsWidget.options.routeSymbol.color = new Color([parseInt(dojo.configData.DrivingDirectionSettings.RouteColor.split(",")[0], 10), parseInt(dojo.configData.DrivingDirectionSettings.RouteColor.split(",")[1], 10), parseInt(dojo.configData.DrivingDirectionSettings.RouteColor.split(",")[2], 10), parseFloat(dojo.configData.DrivingDirectionSettings.Transparency.split(",")[0], 10)]);
                //set the width of route in direction widget
                this._esriDirectionsWidget.options.routeSymbol.width = parseInt(dojo.configData.DrivingDirectionSettings.RouteWidth, 10);
                // callback function for direction widget when route is started
                this.own(on(this._esriDirectionsWidget, "directions-start", lang.hitch(this, function (a) {
                    // setting length of geocoders to 0
                    if (!Modernizr.geolocation) {
                        a.target.geocoders.length = 0;
                    }
                })));
                // callback function for direction widget when route is finish
                this.own(on(this._esriDirectionsWidget, "directions-finish", lang.hitch(this, function (a) {
                    this.disableInfoPopupOfDirectionWidget(this._esriDirectionsWidget);
                    if (this.locatorAddress !== "") {
                        address = this.locatorAddress;
                        //check is startpoint is there then set title
                    } else if (this.routeObject.StartPoint) {
                        address = sharedNls.titles.directionCurrentLocationText;
                    }
                    //check if direction not null or null then set zoom level of route in share URL
                    if (this._esriDirectionsWidget.directions !== null) {
                        if (window.location.href.toString().split("$extentChanged=").length > 1) {
                            if (this.isExtentSet) {
                                this._esriDirectionsWidget.zoomToFullRoute();
                            }
                        } else {
                            this._esriDirectionsWidget.zoomToFullRoute();
                        }
                        //swich case for widget name
                        switch (this.routeObject.WidgetName.toLowerCase()) {
                        case "activitysearch":
                            dojo.sharedGeolocation = null;
                            dojo.eventForListClicked = null;
                            dojo.infowindowDirection = null;
                            dojo.eventInfoWindowData = null;
                            dojo.eventRoutePoint = null;
                            dojo.eventForListClicked = null;
                            dojo.infoRoutePoint = null;
                            queryObject = { "FeatureData": this.routeObject.EndPoint, "SolveRoute": a.result.routeResults, "Index": this.routeObject.Index, "QueryURL": this.routeObject.QueryURL, "WidgetName": this.routeObject.WidgetName, "Address": address, "IsRouteCreated": true };
                            topic.publish("showProgressIndicator");
                            this.removeBuffer();
                            this.queryCommentLayer(queryObject);
                            break;
                        case "searchedfacility":
                            dojo.infowindowDirection = null;
                            dojo.eventForListClicked = null;
                            queryObject = { "FeatureData": this.routeObject.EndPoint, "SolveRoute": a.result.routeResults, "Index": this.routeObject.Index, "QueryURL": this.routeObject.QueryURL, "WidgetName": this.routeObject.WidgetName, "Address": address, "IsRouteCreated": true, "activityData": this.routeObject.activityData };
                            topic.publish("showProgressIndicator");
                            this.queryCommentLayer(queryObject);
                            break;
                        case "event":
                            dojo.infowindowDirection = null;
                            dojo.doQuery = "false";
                            dojo.sharedGeolocation = "false";
                            this.removeCommentPod();
                            this.removeBuffer();
                            this.routeObject.EndPoint = this.removeNullValue(this.routeObject.EndPoint);
                            queryObject = { "FeatureData": this.routeObject.EndPoint, "SolveRoute": a.result.routeResults, "Index": this.routeObject.Index, "QueryURL": this.routeObject.QueryURL, "WidgetName": this.routeObject.WidgetName, "Address": address };
                            topic.publish("showProgressIndicator");
                            this.carouselContainer.showCarouselContainer();
                            this.setSearchContent(this.routeObject.EndPoint, false, this.routeObject.QueryURL, this.routeObject.WidgetName, this.routeObject.activityData);
                            this.highlightFeature(this.routeObject.EndPoint[this.routeObject.Index].geometry);
                            this.setCenterAt(this.routeObject.EndPoint[this.routeObject.Index].geometry);
                            resultcontent = { "value": this.routeObject.Index };
                            facilityObject = { "Feature": this.routeObject.EndPoint, "SelectedItem": resultcontent, "QueryURL": this.routeObject.QueryURL, "WidgetName": this.routeObject.WidgetName };
                            this.setFacility(facilityObject);
                            directionObject = { "Feature": this.routeObject.EndPoint, "SelectedItem": resultcontent, "SolveRoute": a.result.routeResults, "Address": address, "WidgetName": this.routeObject.WidgetName, "QueryURL": this.routeObject.QueryURL };
                            this.setDirection(directionObject);
                            queryObject = { "FeatureData": this.routeObject.EndPoint, "QueryURL": this.routeObject.QueryURL, "WidgetName": this.routeObject.WidgetName, "activityData": this.routeObject.activityData };
                            this.setGallery(queryObject, resultcontent);
                            topic.publish("hideProgressIndicator");
                            break;
                        case "unifiedsearch":
                            dojo.infowindowDirection = null;
                            dojo.eventForListClicked = null;
                            dojo.addressLocationDirectionActivity = null;
                            queryObject = { "FeatureData": this.routeObject.EndPoint, "SolveRoute": a.result.routeResults, "Index": this.routeObject.Index, "QueryURL": this.routeObject.QueryURL, "WidgetName": this.routeObject.WidgetName, "Address": address, "IsRouteCreated": true, "activityData": this.routeObject.activityData };
                            topic.publish("showProgressIndicator");
                            this.queryCommentLayer(queryObject);
                            dojo.sharedGeolocation = null;
                            break;
                        case "geolocation":
                            dojo.addressLocationDirectionActivity = null;
                            dojo.eventForListClicked = null;
                            dojo.eventInfoWindowData = null;
                            dojo.infoRoutePoint = null;
                            queryObject = { "FeatureData": this.routeObject.EndPoint, "SolveRoute": a.result.routeResults, "Index": this.routeObject.Index, "QueryURL": this.routeObject.QueryURL, "WidgetName": this.routeObject.WidgetName, "Address": address, "IsRouteCreated": true, "activityData": this.routeObject.activityData };
                            topic.publish("showProgressIndicator");
                            this.queryCommentLayer(queryObject);
                            break;
                        case "infoevent":
                            resultcontent = { "value": 0 };
                            this.removeBuffer();
                            dojo.addressLocation = null;
                            dojo.eventForListClicked = null;
                            dojo.doQuery = "false";
                            dojo.eventPlannerQuery = null;
                            directionObject = { "Feature": this.routeObject.EndPoint, "SelectedItem": resultcontent, "SolveRoute": a.result.routeResults, "Address": address, "WidgetName": this.routeObject.WidgetName, "QueryURL": this.routeObject.QueryURL };
                            this.setDirection(directionObject, true);
                            break;
                        case "infoactivity":
                            resultcontent = { "value": 0 };
                            this.removeBuffer();
                            dojo.addressLocation = null;
                            dojo.eventForListClicked = null;
                            dojo.doQuery = "false";
                            directionObject = { "Feature": this.routeObject.EndPoint, "SelectedItem": resultcontent, "SolveRoute": a.result.routeResults, "Address": address, "WidgetName": this.routeObject.WidgetName, "QueryURL": this.routeObject.QueryURL };
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
                            dojo.eventForListClicked = null;
                            alert(sharedNls.errorMessages.routeComment);
                            this._executeWhenRouteNotCalculated(this.routeObject);
                            topic.publish("hideProgressIndicator");
                            this.isRouteCreated = false;
                        }
                        topic.publish("hideProgressIndicator");
                    }
                    this._setCrouselContainerInSharedCase();
                })));
                topic.publish("hideProgressIndicator");
            } catch (error) {
                alert(error);
                topic.publish("hideProgressIndicator");
            }
        },

        /**
        * create route for two points
        * @param {object} routeObject contains Start point, End point, widget name and query URL
        * @memberOf widgets/commonHelper/directionWidgetHelper
        */
        showRoute: function (routeObject) {
            var endPointGeometery, startPointGeometery, geoArray, queryObject;
            // if variable is set to false directions cannot be enabled
            topic.publish("showProgressIndicator");
            // Remove ripple only when routeObject's widgetName is neither InfoActivity nor InfoEvent
            if (routeObject.WidgetName !== "InfoActivity" && routeObject.WidgetName !== "InfoEvent") {
                this.removeHighlightedCircleGraphics();
            }
            this.removeRouteGraphichOfDirectionWidget();
            geoArray = [];
            // Creating new point with start point geometry
            startPointGeometery = new Point(parseFloat(routeObject.StartPoint.geometry.x), parseFloat(routeObject.StartPoint.geometry.y), this.map.spatialReference);
            geoArray.push(startPointGeometery);
            // Creating new point with end point geometry
            endPointGeometery = new Point(parseFloat(routeObject.EndPoint[routeObject.Index].geometry.x), parseFloat(routeObject.EndPoint[routeObject.Index].geometry.y), this.map.spatialReference);
            geoArray.push(endPointGeometery);
            this.routeObject = routeObject;
            // Updating two stops for direction widget.
            if (dojo.configData.DrivingDirectionSettings.GetDirections) {
                // For clearing the direction from map and div.
                this._esriDirectionsWidget.clearDirections();
                this._esriDirectionsWidget.updateStops(geoArray).then(lang.hitch(this, function () {
                    this._esriDirectionsWidget.getDirections();
                }), function (err) {
                    alert(sharedNls.errorMessages.routeDoesNotCreate);
                    topic.publish("hideProgressIndicator");
                });
            } else {
                queryObject = { "FeatureData": this.routeObject.EndPoint, "Index": this.routeObject.Index, "QueryURL": this.routeObject.QueryURL, "WidgetName": this.routeObject.WidgetName, "activityData": this.routeObject.activityData };
                this.queryCommentLayer(queryObject);
                topic.publish("hideProgressIndicator");
            }
        },

        /**
        * query on Comment Layer
        * @param {object} queryObject Contains FeatureData, Index, Layer URL, WidgetName, Address, IsRouteCreated{boolean}
        * @memberOf widgets/commonHelper/directionWidgetHelper
        */
        queryCommentLayer: function (queryObject) {
            var queryTask, esriQuery, deferredArray = [], deferredListResult, commentArray, k, j, resultcontent, featureId;
            try {
                // looping activity search setting for getting comments
                array.forEach(dojo.configData.ActivitySearchSettings, (lang.hitch(this, function (activitySearchSettings) {
                    queryTask = new esri.tasks.QueryTask(activitySearchSettings.CommentsSettings.QueryURL);
                    esriQuery = new esri.tasks.Query();
                    esriQuery.outFields = ["*"];
                    esriQuery.returnGeometry = true;
                    // Checking if queryObject has feature data
                    if (queryObject.FeatureData) {
                        if (queryObject.WidgetName.toLowerCase() === "infoactivity") {
                            esriQuery.where = dojo.configData.ActivitySearchSettings[0].CommentsSettings.ForeignKeyFieldForActivity + "=" + queryObject.FeatureData[this.objectIdForActivityLayer];
                            featureId = queryObject.FeatureData[this.objectIdForActivityLayer];
                        } else {
                            esriQuery.where = dojo.configData.ActivitySearchSettings[0].CommentsSettings.ForeignKeyFieldForActivity + "=" + queryObject.FeatureData[queryObject.Index].attributes[this.objectIdForActivityLayer];
                        }
                        // Setting deferred array
                        deferredArray.push(queryTask.execute(esriQuery, lang.hitch(this, this._executeQueryTask)));
                        deferredListResult = new DeferredList(deferredArray);
                        // Calling deferred array then to do further query.
                        deferredListResult.then(lang.hitch(this, function (result) {
                            commentArray = [];
                            // If result is got from service call then push data in array for further query.
                            if (result.length > 0) {
                                for (j = 0; j < result.length; j++) {
                                    if (result[j][0] && result[j][1].features) {
                                        for (k = 0; k < result[j][1].features.length; k++) {
                                            commentArray.push(result[j][1].features[k]);
                                        }
                                    }
                                }
                                // If comment array is created then sort data
                                if (commentArray) {
                                    commentArray.sort(lang.hitch(this, function (a, b) {
                                        return b.attributes[this.objectIdForCommentLayer] - a.attributes[this.objectIdForCommentLayer];
                                    }));
                                }
                                // Switching for functionality name for doing further query,
                                switch (queryObject.WidgetName.toLowerCase()) {
                                    // If it is comming from activity search then set bottom pod's data
                                case "activitysearch":
                                    topic.publish("showProgressIndicator");
                                    resultcontent = { "value": queryObject.Index };
                                    this.carouselContainer.removeAllPod();
                                    this.carouselContainer.addPod(this.carouselPodData);
                                    this.carouselContainer.showCarouselContainer();
                                    this.carouselContainer.collapseUP();
                                    this.highlightFeature(queryObject.FeatureData[0].geometry);
                                    if (!queryObject.IsRouteCreated) {
                                        this.setCenterAt(queryObject.FeatureData[0].geometry);
                                    }
                                    this.setSearchContent(queryObject.FeatureData, false, queryObject.QueryURL, queryObject.WidgetName);
                                    this._createCommonPods(queryObject, commentArray, resultcontent);
                                    this._setCrouselContainerInSharedCase();
                                    topic.publish("hideProgressIndicator");
                                    break;
                                case "searchedfacility":
                                    // If it is comming from click on search pod item then set bottom pod's data
                                    topic.publish("showProgressIndicator");
                                    this.highlightFeature(queryObject.FeatureData[queryObject.Index].geometry);
                                    if (!queryObject.IsRouteCreated) {
                                        this.setCenterAt(queryObject.FeatureData[queryObject.Index].geometry);
                                    }
                                    resultcontent = { "value": queryObject.Index };
                                    this._createCommonPods(queryObject, commentArray, resultcontent, queryObject.activityData);
                                    this._setCrouselContainerInSharedCase();
                                    topic.publish("hideProgressIndicator");
                                    break;
                                case "unifiedsearch":
                                    // If it is comming from unified search then set bottom pod's data
                                    topic.publish("showProgressIndicator");
                                    resultcontent = { "value": 0 };
                                    this.carouselContainer.showCarouselContainer();
                                    this.carouselContainer.collapseUP();
                                    this.highlightFeature(queryObject.FeatureData[0].geometry);
                                    if (!queryObject.IsRouteCreated) {
                                        this.setCenterAt(queryObject.FeatureData[queryObject.Index].geometry);
                                    }
                                    this.setSearchContent(queryObject.FeatureData, false, queryObject.QueryURL, queryObject.WidgetName, queryObject.activityData);
                                    this._createCommonPods(queryObject, commentArray, resultcontent, queryObject.activityData);
                                    this._setCrouselContainerInSharedCase();
                                    topic.publish("hideProgressIndicator");
                                    this.widgetName = true;
                                    break;
                                case "geolocation":
                                    // If it is comming from geolaction search widget then set bottom pod's data
                                    topic.publish("showProgressIndicator");
                                    resultcontent = { "value": 0 };
                                    this.carouselContainer.showCarouselContainer();
                                    this.carouselContainer.collapseUP();
                                    this.highlightFeature(queryObject.FeatureData[0].geometry);
                                    if (!queryObject.IsRouteCreated) {
                                        this.setCenterAt(queryObject.FeatureData[queryObject.Index].geometry);
                                    }
                                    this.setSearchContent(queryObject.FeatureData, false, queryObject.QueryURL, queryObject.WidgetName, queryObject.activityData);
                                    this._createCommonPods(queryObject, commentArray, resultcontent, queryObject.activityData);
                                    this._setCrouselContainerInSharedCase();
                                    topic.publish("hideProgressIndicator");
                                    break;
                                case "infoactivity":
                                    // If it is comming from info window's direction widget  search then set bottom pod's data
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
                        }), function (err) {
                            // Creating other pod if comment is unable to get, due to some issue.
                            this._createPodWithoutCommentLayer(queryObject);
                            topic.publish("hideProgressIndicator");
                        });
                    }
                })));
            } catch (error) {
                // Creating other pod if comment is unable to get, due to some issue.
                this._createPodWithoutCommentLayer(queryObject);
                topic.publish("hideProgressIndicator");
            }
        },


        /**
        * set the crousel container state (hide/show) in share case.
        * @memberOf widgets/commonHelper/directionWidgetHelper
        */
        _setCrouselContainerInSharedCase: function () {
        // Checking for bottom pod's status in the case of share
            if (window.location.href.toString().split("$isShowPod=").length > 1) {
                if (window.location.href.toString().split("$isShowPod=")[1].split("$")[0].toString() === "false") {
                // collapsing down the carousel container
                    if (this.carouselContainer) {
                        this.carouselContainer.collapseDown();
                    }
                }
                if (this.isExtentSet && this.carouselContainer) {
                // Checking  for the widget name if it is not comming from info window direction
                    if (this.routeObject.WidgetName.toLowerCase() !== "infoactivity" && this.routeObject.WidgetName.toLowerCase() !== "infoevent") {
                        this.carouselContainer.collapseUP();
                    }
                }
            }
        },

        /**
        * execute query task for Comment Layer
        * @param {object} relatedRecords Contains Comment layer URL
        * @memberOf widgets/commonHelper/directionWidgetHelper
        */
        _executeQueryTask: function (relatedRecords) {
            var featureSet, i, deferred, features = [];
            deferred = new Deferred();
            featureSet = new esri.tasks.FeatureSet();
            //check relatedRecords contain features or not
            if (relatedRecords.features.length > 0) {
                //loop for the features of comment layer and push the data into features
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
        * set the content in (Comments) carousel pod when error found
        * @memberOf widgets/commonHelper/directionWidgetHelper
        */
        setCommentForError: function () {
            var isPodEnabled = this.getPodStatus("CommentsPod"), divHeaderContent, divCommentRow;
            // If pod setting is true then remove div's item and set error message in pod.
            if (isPodEnabled) {
                divHeaderContent = query('.esriCTDivCommentContent');
                if (divHeaderContent[0]) {
                    domConstruct.empty(divHeaderContent[0]);
                }
                divCommentRow = domConstruct.create("div", { "class": "esriCTDivCommentRow" }, divHeaderContent[0]);
                domConstruct.create("div", { "class": "esriCTInfotextRownoComment", "innerHTML": sharedNls.errorMessages.errorInQueringLayer }, divCommentRow);
            }
        },

        /**
        * execute this function when route is not calculated due to any error
        * @param{object} routeObject contains route information
        * @memberOf widgets/commonHelper/directionWidgetHelper
        */
        _executeWhenRouteNotCalculated: function (routeObject) {
            //check widgetName is activitysearch
            if (routeObject.WidgetName.toLowerCase() === "activitysearch") {
                this.removeBuffer();
                this.executeWithoutGeolocation(this.featureSetWithoutNullValue, routeObject.QueryURL, routeObject.WidgetName, 0);
            }
            //check widgetName is searchedfacility
            if (routeObject.WidgetName.toLowerCase() === "searchedfacility") {
                this.removeBuffer();
                this.executeWithoutGeolocation(this.featureSetWithoutNullValue, routeObject.QueryURL, routeObject.WidgetName, routeObject.Index);
            }
            //check widgetName is event
            if (routeObject.WidgetName.toLowerCase() === "event") {
                this.removeBuffer();
                this.executeWithoutGeolocation(this.featureSetWithoutNullValue, routeObject.QueryURL, routeObject.WidgetName, routeObject.Index);
            }
        },

        /**
        * Common bottom pod creation
        * @param {object} queryObject contails  feature imformation
        * @param {object} commentArray contails  feature imformation
        * @param {object} resultcontent contails  information about the selected row
        * @memberOf widgets/commonHelper/directionWidgetHelper
        */
        _createCommonPods: function (queryObject, commentArray, resultcontent) {
            var directionObject, facilityObject, locatorParamsForCarouselContainer, locatorObjectForCarouselContainer, divDirectioncontent, activityMapPoint, routeObject, divHeader, searchContenData, mapPoint;
            facilityObject = { "Feature": queryObject.FeatureData, "SelectedItem": resultcontent, "QueryURL": queryObject.QueryURL, "WidgetName": queryObject.WidgetName, "activityData": queryObject.activityData };
            this.setFacility(facilityObject);
            //check whether the solve route is null
            if (queryObject.SolveRoute === null) {
                divDirectioncontent = query(".esriCTDivDirectioncontent")[0];
                if (divDirectioncontent) {
                    domConstruct.empty(divDirectioncontent);
                    locatorParamsForCarouselContainer = {
                        defaultAddress: dojo.configData.LocatorSettings.LocatorDefaultAddress,
                        preLoaded: false,
                        parentDomNode: divDirectioncontent,
                        map: this.map,
                        graphicsLayerId: this.locatorGraphicsLayerID,
                        locatorSettings: dojo.configData.LocatorSettings,
                        configSearchSettings: dojo.configData.SearchSettings
                    };
                    searchContenData = this.getKeyValue(dojo.configData.ActivitySearchSettings[0].SearchDisplayFields);
                    divHeader = domConstruct.create("div", {}, divDirectioncontent);
                    domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": sharedNls.titles.directionText + " " + queryObject.FeatureData[resultcontent.value].attributes[searchContenData] }, divHeader);
                    activityMapPoint = this.map.getLayer(locatorParamsForCarouselContainer.graphicsLayerId);
                    locatorObjectForCarouselContainer = new LocatorTool(locatorParamsForCarouselContainer);
                    locatorObjectForCarouselContainer.candidateClicked = lang.hitch(this, function (graphic) {
                        if (locatorObjectForCarouselContainer && locatorObjectForCarouselContainer.selectedGraphic) {
                            dojo.addressLocationDirectionActivity = locatorObjectForCarouselContainer.selectedGraphic.geometry.x.toString() + "," + locatorObjectForCarouselContainer.selectedGraphic.geometry.y.toString();
                        }
                        // check grapic address
                        if (graphic && graphic.attributes && graphic.attributes.address) {
                            this.locatorAddress = graphic.attributes.address;
                        }
                        if (graphic && graphic.layer) {
                            this.selectedLayerTitle = graphic.layer.SearchDisplayTitle;
                        }
                        this._clearBuffer();
                        this.removeGeolocationPushPin();
                        if (graphic && graphic.layer) {
                            this.selectedGraphic = graphic;
                            routeObject = { "StartPoint": graphic, "EndPoint": queryObject.FeatureData, "Index": queryObject.Index, "WidgetName": queryObject.WidgetName, "QueryURL": queryObject.QueryURL };
                            this.showRoute(routeObject);
                            if (locatorObjectForCarouselContainer && locatorObjectForCarouselContainer.selectedGraphic === null) {
                                dojo.addressLocationDirectionActivity = graphic.geometry.x.toString() + "," + graphic.geometry.y.toString();
                            }
                        } else {
                            routeObject = { "StartPoint": activityMapPoint.graphics[0], "EndPoint": queryObject.FeatureData, "Index": queryObject.Index, "WidgetName": queryObject.WidgetName, "QueryURL": queryObject.QueryURL };
                            this.showRoute(routeObject);
                        }
                    });
                }
            } else {
                directionObject = { "Feature": queryObject.FeatureData, "SelectedItem": resultcontent, "SolveRoute": queryObject.SolveRoute, "Address": queryObject.Address, "WidgetName": queryObject.WidgetName, "activityData": queryObject.activityData, "QueryURL": queryObject.QueryURL };
                this.setDirection(directionObject);
            }
            this.setGallery(queryObject, resultcontent);
            //check if commnet is not null the calling the comment function
            if (commentArray !== null) {
                this.setComment(queryObject.FeatureData, commentArray, resultcontent);
            }
            //check if "addressLocationDirectionActivity" is there in share URL or not.
            if (window.location.href.toString().split("$addressLocationDirectionActivity=").length > 1) {
                mapPoint = new Point(window.location.href.toString().split("$addressLocationDirectionActivity=")[1].split("$")[0].split(",")[0], window.location.href.toString().split("$addressLocationDirectionActivity=")[1].split("$")[0].split(",")[1], this.map.spatialReference);
                locatorObjectForCarouselContainer._locateAddressOnMap(mapPoint);
                routeObject = { "StartPoint": activityMapPoint.graphics[0], "EndPoint": queryObject.FeatureData, "Index": queryObject.Index, "WidgetName": queryObject.WidgetName, "QueryURL": queryObject.QueryURL };
                this.showRoute(routeObject);
            }
        },

        /**
        * Create pod when comment layer fires some error
        * @param {object} queryObject contails  feature imformation
        * @memberOf widgets/commonHelper/directionWidgetHelper
        */
        _createPodWithoutCommentLayer: function (queryObject) {
            var resultcontent;
            //check if widgetName is activitysearch.
            if (queryObject.WidgetName.toLowerCase() === "activitysearch") {
                topic.publish("showProgressIndicator");
                resultcontent = { "value": 0 };
                this.carouselContainer.removeAllPod();
                this.carouselContainer.addPod(this.carouselPodData);
                this.carouselContainer.showCarouselContainer();
                this.carouselContainer.collapseUP();
                this.highlightFeature(queryObject.FeatureData[0].geometry);
                this.setCenterAt(queryObject.FeatureData[0].geometry);
                this.setSearchContent(queryObject.FeatureData, false, queryObject.QueryURL, queryObject.WidgetName);
                this._createCommonPods(queryObject, null, resultcontent);
                this.setCommentForError();
                topic.publish("hideProgressIndicator");
            }
            //check if widgetName is searchedfacility.
            if (queryObject.WidgetName.toLowerCase() === "searchedfacility") {
                topic.publish("showProgressIndicator");
                this.highlightFeature(queryObject.FeatureData[queryObject.Index].geometry);
                this.setCenterAt(queryObject.FeatureData[queryObject.Index].geometry);
                resultcontent = { "value": queryObject.Index };
                this._createCommonPods(queryObject, null, resultcontent);
                this.setCommentForError();
                topic.publish("hideProgressIndicator");
            }
        },

        /**
        * create route for multiple points
        * @param {object} contains Start point, End point, widget name and query URL
        * @memberOf widgets/commonHelper/directionWidgetHelper
        */
        _showRouteForList: function (routeObject) {
            var geoArray, i;
            topic.publish("showProgressIndicator");
            this.clearGraphicsAndCarousel();
            this.removeRouteGraphichOfDirectionWidget();
            this.routeObject = routeObject;
            topic.publish("routeObject", this.routeObject);
            geoArray = [];
            geoArray.push(routeObject.StartPoint.geometry);
            // Looping for route object for pushing points.
            for (i = 0; i < routeObject.EndPoint.length; i++) {
                geoArray.push(routeObject.EndPoint[i].geometry);
            }
            // Calling update stops function for showing points on map and calculating direction
            this._esriDirectionsWidget.updateStops(geoArray).then(lang.hitch(this, function () {
                this._esriDirectionsWidget.getDirections();
            }),
                function (err) {
                    alert(err);
                    topic.publish("hideProgressIndicator");
                });
        },

        /**
        * get the feature within buffer and sort it in ascending order.
        * @param {object} featureSetObject Contains Feature
        * @param {object} QueryURL Contains layer URL
        * @param {string} widgetName Contains name of widget
        * @memberOf widgets/commonHelper/directionWidgetHelper
        */
        _executeQueryForFeatures: function (featureSetObject, QueryURL, widgetName) {
            var featureSet, i, dist, isDistanceFound, isZoomToGeolocation;
            // Calling function for removing null value from feature
            this.featureSetWithoutNullValue = this.removeNullValue(featureSetObject);
            // Calling function to change date attribute formate
            this.featureSetWithoutNullValue = this.changeDateFormatForActivity(featureSetObject);
            featureSet = [];
            isDistanceFound = false;
            isZoomToGeolocation = this.setZoomForGeolocation();
            // If modrnizr is  supporting geolocation then procced other wise show message.
            if (Modernizr.geolocation) {
                // If geolocation widget is configured
                if (dijit.registry.byId("geoLocation")) {
                    // Call show current location.
                    dijit.registry.byId("geoLocation").showCurrentLocation(false, isZoomToGeolocation);
                    // Call back of geolocation complete
                    dijit.registry.byId("geoLocation").onGeolocationComplete = lang.hitch(this, function (mapPoint, isPreLoaded) {
                        // If mappoint is found then clean graphics
                        if (mapPoint) {
                            this._clearBuffer();
                            this.removeLocatorPushPin();
                            // If it is not comming from geolocation widget
                            if (!isPreLoaded) {
                                // Looping for features
                                for (i = 0; i < this.featureSetWithoutNullValue.length; i++) {
                                    // If mapoint has geometry calculate distance
                                    if (mapPoint.geometry) {
                                        dist = this.getDistance(mapPoint.geometry, this.featureSetWithoutNullValue[i].geometry);
                                        isDistanceFound = true;
                                    }
                                    try {
                                        featureSet[i] = this.featureSetWithoutNullValue[i];
                                        this.featureSetWithoutNullValue[i].distance = dist.toString();
                                    } catch (err) {
                                        alert(sharedNls.errorMessages.falseConfigParams);
                                    }
                                }
                                // If distance is found then sort feature basic of distance
                                if (isDistanceFound) {
                                    featureSet.sort(function (a, b) {
                                        return parseFloat(a.distance) - parseFloat(b.distance);
                                    });
                                    this.featureSetWithoutNullValue = featureSet;
                                    this.highlightFeature(featureSet[0].geometry);
                                    var routeObject = { "StartPoint": mapPoint, "EndPoint": this.featureSetWithoutNullValue, "Index": 0, "WidgetName": widgetName, "QueryURL": QueryURL };
                                    this.showRoute(routeObject);
                                } else {
                                    // If point is not found then show message
                                    alert(sharedNls.errorMessages.invalidProjection);
                                    // Function for creating bottom pod without geolocation point, setting first feature in bottom pod as selected and others in search pod
                                    this.executeWithoutGeolocation(this.featureSetWithoutNullValue, QueryURL, widgetName, 0);
                                }
                            } else {
                                // if it is comming from geolocation widget
                                dojo.doQuery = "false";
                                dojo.addressLocationDirectionActivity = null;
                                dojo.searchFacilityIndex = -1;
                                dojo.addressLocation = null;
                                dojo.sharedGeolocation = mapPoint;
                                topic.publish("extentSetValue", true);
                                topic.publish("hideInfoWindow");
                                dojo.eventRoutePoint = null;
                                this.removeRouteGraphichOfDirectionWidget();
                                this.createBuffer(mapPoint, "geolocation");
                            }
                        } else {
                            // Function for creating bottom pod without geolocation point, setting first feature in bottom pod as selected and others in search pod
                            this.removeLocatorPushPin();
                            this.executeWithoutGeolocation(this.featureSetWithoutNullValue, QueryURL, widgetName, 0);
                        }
                    });
                    dijit.registry.byId("geoLocation").onGeolocationError = lang.hitch(this, function (error, isPreLoaded) {
                        if (isPreLoaded) {
                            dojo.eventRoutePoint = null;
                            topic.publish("extentSetValue", true);
                            topic.publish("hideInfoWindow");
                            this.removeHighlightedCircleGraphics();
                            this.removeLocatorPushPin();
                            this.removeBuffer();
                            // Checking for cauousel container for hiding carousel container and setting legend position
                            if (this.carouselContainer) {
                                this.carouselContainer.hideCarouselContainer();
                                this.carouselContainer._setLegendPositionDown();
                            }
                        }
                        if (!isPreLoaded) {
                            dojo.eventRoutePoint = null;
                            this.removeLocatorPushPin();
                            topic.publish("hideProgressIndicator");
                            topic.publish("hideInfoWindow");
                            this.executeWithoutGeolocation(this.featureSetWithoutNullValue, QueryURL, widgetName, 0);
                        }
                    });
                } else {
                    //calling error message when geoloation widget is not configured.
                    topic.publish("hideProgressIndicator");
                    alert(sharedNls.errorMessages.geolocationWidgetNotFoundMessage);
                }
            } else {
                //calling error message when geolocation is not supported
                topic.publish("hideProgressIndicator");
                alert(sharedNls.errorMessages.activitySerachGeolocationText);
            }
        },

        /**
        * Execute when geolocaiton is not found.
        * @param {object} featureset Contains information of feature
        * @param {object} Query Url of the layer
        * @param {string} widget name
        * @memberOf widgets/commonHelper/directionWidgetHelper
        */
        executeWithoutGeolocation: function (featureSetWithoutNullValue, QueryURL, widgetName, index) {
            var facilityObject, resultcontent, queryObject, searchSetting, locatorParamsForEventContainer, divDirectioncontent, divHeader, eventMapPoint, routeObject, searchContenData;
            dojo.addressLocationDirectionActivity = null;
            // If qurey is comming from event layer
            if (widgetName.toLowerCase() === "event") {
                dojo.doQuery = "false";
                this.removeCommentPod();
                // Removing null value from features
                featureSetWithoutNullValue = this.removeNullValue(featureSetWithoutNullValue);
                this.removeHighlightedCircleGraphics();
                topic.publish("showProgressIndicator");
                if (this.carouselContainer) {
                    this.carouselContainer.showCarouselContainer();
                }
                // If it is comming from share url then maintain the pod state.
                if (window.location.toString().split("isShowPod=").length > 1 && window.location.toString().split("isShowPod=")[1].toString().split("$")[0] === "false") {
                    this.carouselContainer.collapseDown();
                } else {
                    this.carouselContainer.collapseUP();
                }
                // Highligh feature
                this.highlightFeature(featureSetWithoutNullValue[index].geometry);
                // Set it in center
                this.setCenterAt(featureSetWithoutNullValue[index].geometry);
                // Creating search content box
                this.setSearchContent(featureSetWithoutNullValue, false, QueryURL, widgetName);
                dojo.sharedGeolocation = "false";
                resultcontent = { "value": index };
                facilityObject = { "Feature": featureSetWithoutNullValue, "SelectedItem": resultcontent, "QueryURL": QueryURL, "WidgetName": widgetName };
                // Setting facility pod in bootom pod
                this.setFacility(facilityObject);
                divDirectioncontent = query(".esriCTDivDirectioncontent")[0];
                // If direction pod is not created then show direction tab
                if (divDirectioncontent) {
                    domConstruct.empty(divDirectioncontent);
                    locatorParamsForEventContainer = {
                        defaultAddress: dojo.configData.LocatorSettings.LocatorDefaultAddress,
                        preLoaded: false,
                        parentDomNode: divDirectioncontent,
                        map: this.map,
                        graphicsLayerId: this.locatorGraphicsLayerID,
                        locatorSettings: dojo.configData.LocatorSettings,
                        configSearchSettings: dojo.configData.SearchSettings
                    };
                    //Getting search display field from layer
                    searchSetting = this.getSearchSetting(QueryURL);
                    searchContenData = this.getKeyValue(searchSetting.SearchDisplayFields);
                    divHeader = domConstruct.create("div", {}, divDirectioncontent);
                    domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": sharedNls.titles.directionText + " " + featureSetWithoutNullValue[0].attributes[searchContenData] }, divHeader);
                    locatorParamsForEventContainer = new LocatorTool(locatorParamsForEventContainer);
                    eventMapPoint = this.map.getLayer(locatorParamsForEventContainer.graphicsLayerId);
                    //Calling candidate click function for showing route and data in bottom pod
                    locatorParamsForEventContainer.candidateClicked = lang.hitch(this, function (graphic) {
                        if (locatorParamsForEventContainer && locatorParamsForEventContainer.selectedGraphic) {
                            dojo.addressLocationDirectionActivity = locatorParamsForEventContainer.selectedGraphic.geometry.x.toString() + "," + locatorParamsForEventContainer.selectedGraphic.geometry.y.toString();
                        }
                        if (graphic && graphic.attributes && graphic.attributes.address) {
                            this.locatorAddress = graphic.attributes.address;
                        }
                        if (graphic && graphic.layer) {
                            this.selectedLayerTitle = graphic.layer.SearchDisplayTitle;
                        }
                        dojo.doQuery = "false";
                        topic.publish("hideInfoWindow");
                        this.removeGeolocationPushPin();
                        // Checking for graphics for showing route
                        if (graphic && graphic.layer) {
                            routeObject = { "StartPoint": graphic, "EndPoint": featureSetWithoutNullValue, "Index": 0, "WidgetName": widgetName, "QueryURL": QueryURL };
                            this.showRoute(routeObject);
                            this.selectedEventGraphic = graphic;
                            if (locatorParamsForEventContainer && locatorParamsForEventContainer.selectedGraphic === null) {
                                dojo.addressLocationDirectionActivity = graphic.geometry.x.toString() + "," + graphic.geometry.y.toString();
                            }
                        } else {
                            routeObject = { "StartPoint": eventMapPoint.graphics[0], "EndPoint": featureSetWithoutNullValue, "Index": 0, "WidgetName": widgetName, "QueryURL": QueryURL };
                            this.showRoute(routeObject);
                        }
                    });
                }
                // Calling function for setting gallery
                queryObject = { "FeatureData": featureSetWithoutNullValue, "WidgetName": widgetName, "QueryURL": QueryURL, "activityData": null };
                this.setGallery(queryObject, resultcontent);
                setTimeout(lang.hitch(this, function () {
                    // If it is a share url and direction is calcualted from bottom pod then show route for the same.
                    if (window.location.href.toString().split("$addressLocationDirectionActivity=").length > 1 && window.location.href.toString().split("$addressLocationDirectionActivity=")[1].substring(0, 18) !== "$sharedGeolocation") {
                        var mapPoint = new Point(window.location.href.toString().split("$addressLocationDirectionActivity=")[1].split("$")[0].split(",")[0], window.location.href.toString().split("$addressLocationDirectionActivity=")[1].split("$")[0].split(",")[1], this.map.spatialReference);
                        locatorParamsForEventContainer._locateAddressOnMap(mapPoint, true);
                        routeObject = { "StartPoint": eventMapPoint.graphics[0], "EndPoint": featureSetWithoutNullValue, "Index": 0, "WidgetName": widgetName, "QueryURL": QueryURL };
                        this.showRoute(routeObject);
                    }
                }, 20000));
                topic.publish("hideProgressIndicator");
            } else {
                // If it comming from other then event layer then query comment layer, becaue in event layer we do not have comment layer settings.
                dojo.eventRoutePoint = null;
                dojo.sharedGeolocation = null;
                queryObject = { "FeatureData": featureSetWithoutNullValue, "SolveRoute": null, "Index": index, "QueryURL": QueryURL, "WidgetName": widgetName, "Address": null, "IsRouteCreated": false };
                topic.publish("showProgressIndicator");
                this.queryCommentLayer(queryObject);
            }
        }
    });
});
