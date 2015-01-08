/*global define,dojo,dojoConfig:true,alert,console,esri,Modernizr,dijit */
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
    "esri/tasks/QueryTask",
    "esri/geometry",
    "esri/graphic",
    "dojo/text!./templates/searchSettingTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/topic",
    "../carouselContainer/carouselContainer",
    "widgets/locator/locator",
    "esri/request",
    "esri/geometry/Point",
    "dijit/a11yclick",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "dojo/_base/Color",
    "dojo/Deferred",
    "dojo/DeferredList"

], function (declare, domConstruct, domStyle, domAttr, lang, on, domGeom, dom, array, domClass, query, string, Locator, Query, QueryTask, Geometry, Graphic, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic, CarouselContainer, LocatorTool, esriRequest, Point, a11yclick, SimpleLineSymbol, SimpleMarkerSymbol, Color, Deferred, DeferredList) {
    // ========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,                        // Variable for template string
        sharedNls: sharedNls,                            // Variable for shared NLS

        /**
        * remove highlighted symbol graphics from map
        * @memberOf widgets/searchSettings/searchSettings
        */
        removeHighlightedCircleGraphics: function () {
            // Check the highlighted symbol layer id and graphics for removing graphics from map
            if (this.map.getLayer("highlightLayerId") && this.map.getLayer("highlightLayerId").graphics.length > 0) {
                this.map.getLayer("highlightLayerId").clear();
            }
        },

        /**
        * remove buffer graphics from map
        * @memberOf widgets/searchSettings/commonHelper
        */
        removeBuffer: function () {
            // Check the buffer graphics layer and graphics for removing graphics from map
            if (this.map.getLayer("tempBufferLayer") && this.map.getLayer("tempBufferLayer").graphics.length > 0) {
                this.map.getLayer("tempBufferLayer").clear();
            }
        },

        /**
        * remove geolocation graphics from map
        * @memberOf widgets/searchSettings/commonHelper
        */
        removeGeolocationPushPin: function () {
            // Check the geolocation layer and graphics  for removing graphics from map
            if (this.map.getLayer(this.geoLocationGraphicsLayerID) && this.map.getLayer(this.geoLocationGraphicsLayerID).graphics.length > 0) {
                this.map.getLayer(this.geoLocationGraphicsLayerID).clear();
            }
        },

        /**
        * remove Locator's layer graphics from map
        * @memberOf widgets/searchSettings/commonHelper
        */
        removeLocatorPushPin: function () {
            // Check the locator's layer and graphics  for removing graphics from map
            if (this.map.getLayer(this.locatorGraphicsLayerID) && this.map.getLayer(this.locatorGraphicsLayerID).graphics.length > 0) {
                this.map.getLayer(this.locatorGraphicsLayerID).clear();
            }
        },

        /**
        * Remove Graphics of Direction widget
        * @memberOf widgets/searchResult/commonHelper
        */
        removeRouteGraphichOfDirectionWidget: function () {
            this._esriDirectionsWidget._clearRouteGraphics();
            this._esriDirectionsWidget.removeStops();
            this._esriDirectionsWidget._clearStopGraphics();
        },

        /**
        * Disable InfoPopup Of DirectionWidget
        * @memberOf widgets/searchResult/commonHelper
        */
        disableInfoPopupOfDirectionWidget: function (dirctionWidgetObject) {
            var i;
            // checking the direction widget's stop graphics
            if (dirctionWidgetObject.stopGraphics) {
                // Looping for direction widget stop graphich for disabaling info window
                for (i = 0; i < dirctionWidgetObject.stopGraphics.length; i++) {
                    dirctionWidgetObject.stopGraphics[i].infoTemplate = null;
                }
            }
        },

        /**
        * Remove null value from the attribute.
        * @param {object} featureObject is object for feature
        * @return {object} feature set after removing null value
        * @memberOf widgets/searchSettings/commonHelper
        */
        removeNullValue: function (featureObject) {
            var i, j;
            // Checking the feature object
            if (featureObject) {
                // Looping feature object setting null value to N\A(Taking from NLS file)
                for (i = 0; i < featureObject.length; i++) {
                    for (j in featureObject[i].attributes) {
                        if (featureObject[i].attributes.hasOwnProperty(j)) {
                            if (!featureObject[i].attributes[j]) {
                                featureObject[i].attributes[j] = sharedNls.showNullValue;
                            }
                            // Checking the null value in feature layer data
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
        * Remove comment pod from container for event layer
        * @memberOf widgets/searchResult/commonHelper
        */
        removeCommentPod: function () {
            var selectedPodName, eventPodData = [], i;
            this.carouselContainer.removeAllPod();
            // Looping for carousel pod data for removing comment pod from container
            for (i = 0; i < this.carouselPodData.length; i++) {
                selectedPodName = domAttr.get(this.carouselPodData[i], "CarouselPodName");
                if (selectedPodName !== "CommentsPod") {
                    eventPodData.push(this.carouselPodData[i]);
                }
            }
            this.carouselContainer.addPod(eventPodData);
        },

        /**
        * Add comment pod from container for event layer
        * @memberOf widgets/searchResult/commonHelper
        */
        addCommentPod: function () {
            var selectedPodName, eventPodData = [], i;
            // Looping for carousel pod data for adding comment pod from container
            for (i = 0; i < this.carouselPodData.length; i++) {
                selectedPodName = domAttr.get(this.carouselPodData[i], "CarouselPodName");
                if (selectedPodName === "CommentsPod") {
                    eventPodData.push(this.carouselPodData[i]);
                }
            }
            this.carouselContainer.addPod(eventPodData);
        },

        /**
        * hide Carousel Container
        * @memberOf widgets/searchResult/searchResult
        */
        hideCarouselContainer: function () {
            this.carouselContainer.collapseDown();
        },

        /**
        * log error message
        * @param{error} error contains error message
        * @memberOf widgets/searchResult/commonHelper
        */
        showError: function (error) {
            console.log("Error: ", error.message);
            topic.publish("hideProgressIndicator");
        },

        /**
        * highlight the nearest feature on the amp
        * @param{object} featureGeometry contains feature
        * @memberOf widgets/searchResult/searchResult
        */
        highlightFeature: function (featureGeometry) {
            var symbol;
            // Clear the previous highlighted layer graphics
            this.removeHighlightedCircleGraphics();
            // Checks the geometry and setting highlighted symbol on map
            if (featureGeometry) {
                symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, dojo.configData.LocatorRippleSize, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([parseInt(dojo.configData.RippleColor.split(",")[0], 10), parseInt(dojo.configData.RippleColor.split(",")[1], 10), parseInt(dojo.configData.RippleColor.split(",")[2], 10)]), 4), new dojo.Color([0, 0, 0, 0]));
                this.map.getLayer("highlightLayerId").add(new esri.Graphic(featureGeometry, symbol, {}, null));
            }
        },

        /**
        * Highlight multiple features
        * @param {object} featureGeometry contains the feature geometry
        * @memberOf widgets/searchResult/commonHelper
        */
        highlightMultipleFeatures: function (featureGeometry) {
            var symbol;
            if (featureGeometry) {
                symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, dojo.configData.LocatorRippleSize, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([parseInt(dojo.configData.RippleColor.split(",")[0], 10), parseInt(dojo.configData.RippleColor.split(",")[1], 10), parseInt(dojo.configData.RippleColor.split(",")[2], 10)]), 4), new dojo.Color([0, 0, 0, 0]));
                this.map.getLayer("highlightLayerId").add(new esri.Graphic(featureGeometry, symbol, {}, null));
            }
        },

        /**
        * Setting extent for gemetry on center
        * @memberOf widgets/searchResult/commonHelper
        */
        setCenterAt: function (gemetry) {
            // checking if application in share url, If it is a share url then do not set extent, else set extent
            if (window.location.href.toString().split("$extentChanged=").length > 1) {
                // checking if application in share url, If it is a share url then do not set extent, else set extent
                if (this.isExtentSet) {
                    this.map.centerAt(gemetry);
                }
            } else {
                this.map.centerAt(gemetry);
            }
        },

        /**
        * Setting extent for gemetry on center
        * @memberOf widgets/searchResult/commonHelper
        */
        setZoomAndCenterAt: function (gemetry) {
            // checking if application in share url, If it is a share url then do not set extent, else set extent
            if (window.location.href.toString().split("$extentChanged=").length > 1) {
                // checking if application in share url, If it is a share url then do not set extent, else set extent
                if (this.isExtentSet) {
                    this.map.centerAndZoom(gemetry, dojo.configData.ZoomLevel);
                }
            } else {
                this.map.centerAndZoom(gemetry, dojo.configData.ZoomLevel);
            }
        },

        /**
        * Setting value to change for extent
        * @memberOf widgets/searchResult/commonHelper
        */
        setZoomForGeolocation: function () {
            var isZoomToLocation = false;
            // checking if application in share url, If it is a share url then do not set extent, else set extent
            if (window.location.href.toString().split("$extentChanged=").length > 1) {
                // checking if application in share url, If it is a share url then do not set extent, else set extent
                if (this.isExtentSet) {
                    isZoomToLocation = true;
                } else {
                    isZoomToLocation = false;
                }
            } else {
                isZoomToLocation = true;
            }
            return isZoomToLocation;
        },

        /**
        * calculate the distance between the puspin(start point) and nearest feature(end point)
        * @param {object} startPoint is pushpin on map
        * @param {object} endPoint is search result
        * @memberOf widgets/searchSettings/commonHelper
        */
        getDistance: function (startPoint, endPoint) {
            var startPointGeometry, unitName, endPointGeometry, startPointlong, startPointlat, endPointlong, endPointlat, theta, dist;
            startPointGeometry = esri.geometry.webMercatorToGeographic(startPoint);
            endPointGeometry = esri.geometry.webMercatorToGeographic(endPoint);
            startPointlong = startPointGeometry.x;
            startPointlat = startPointGeometry.y;
            endPointlong = endPointGeometry.x;
            endPointlat = endPointGeometry.y;
            theta = startPointlong - endPointlong;
            dist = Math.sin(this.deg2Rad(startPointlat)) * Math.sin(this.deg2Rad(endPointlat)) + Math.cos(this.deg2Rad(startPointlat)) * Math.cos(this.deg2Rad(endPointlat)) * Math.cos(this.deg2Rad(theta));
            dist = Math.acos(dist);
            dist = this.rad2Deg(dist);
            dist = dist * 60 * 1.1515;
            // Getting unit name from config file and setting according to direction widget
            unitName = this._getSubStringUnitData();
            // switching unit name to calculate distance from start point to end point
            switch (unitName) {
            case " Miles":
                dist = (dist * 10) / 10;
                break;
            case " Meters":
                dist = dist / 0.00062137;
                break;
            case " Kilometers":
                dist = dist / 0.62137;
                break;
            case " Nautical Miles":
                dist = dist * 0.86898;
                break;
            }
            return (dist * 10) / 10;
        },

        /**
        * Convert the  degrees  to radians
        * @param {object} deg is degree which converts to radians
        * @return radians value
        * @memberOf widgets/searchSettings/commonHelper
        */
        deg2Rad: function (deg) {
            return (deg * Math.PI) / 180.0;
        },

        /**
        * Convert the radians to degrees
        * @param {object} rad is radians which converts to degree
        * @return degree value
        * @memberOf widgets/searchSettings/commonHelper
        */
        rad2Deg: function (rad) {
            return (rad / Math.PI) * 180.0;
        },
        /**
        * convert the UTC time stamp from Millisecond
        * @param {object} utcMilliseconds contains UTC millisecond
        * @returns Date
        * @memberOf widgets/searchResult/commonHelper
        */
        utcTimestampFromMs: function (utcMilliseconds) {
            return this.localToUtc(new Date(utcMilliseconds));
        },

        /**
        * convert the local time to UTC
        * @param {object} localTimestamp contains Local time
        * @returns Date
        * @memberOf widgets/searchResult/commonHelper
        */
        localToUtc: function (localTimestamp) {
            return new Date(localTimestamp.getTime());
        },

        /**
        * Get the key field value from the config file
        * @param {data} keyField value with $ sign
        * @memberOf widgets/searchResult/commonHelper
        */
        getKeyValue: function (data) {
            var firstPlace, secondPlace, keyValue;
            firstPlace = data.indexOf("{");
            secondPlace = data.indexOf("}");
            keyValue = data.substring(Number(firstPlace) + 1, secondPlace);
            return keyValue;
        },

        /**
        * Returns the pod enabled status from config file.
        * @param {string} Key name mensioned in config file
        * @memberOf widgets/searchSettings/commonHelper
        */
        getPodStatus: function (keyValue) {
            var isEnabled, i, key;
            isEnabled = false;
            // looping the podSetting in config file
            for (i = 0; i < dojo.configData.PodSettings.length; i++) {
                for (key in dojo.configData.PodSettings[i]) {
                    if (dojo.configData.PodSettings[i].hasOwnProperty(key)) {
                        // Checking the pod setting variable, if it is set true then show pod
                        if (key === keyValue && dojo.configData.PodSettings[i][key].Enabled) {
                            isEnabled = true;
                            break;
                        }
                    }
                }
            }
            return isEnabled;
        },

        /**
        * Converts min to hour
        * @param {string} string contains the minute
        * @memberOf widgets/searchResult/commonHelper
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
        * Click on previous button of pagination
        * @param {featureCount} number of feature selected
        * @memberOf widgets/SearchSetting/commonHelper
        */
        previousButtonClick: function (featureCount) {
            var rowNumber, infoWindowParameter;
            if (Number(this.divPaginationCount.innerHTML.split("/")[0]) > 1) {
                this.divPaginationCount.innerHTML = Number(this.divPaginationCount.innerHTML.split("/")[0]) - 1 + "/" + featureCount;
                rowNumber = Number(this.divPaginationCount.innerHTML.split("/")[0]) - 1;
                // Setting info window parameter for showing info window on map
                infoWindowParameter = {
                    "mapPoint": this.infoWindowFeatureData[rowNumber].attr.geometry,
                    "attribute": this.infoWindowFeatureData[rowNumber].attr.attributes,
                    "layerId": this.infoWindowFeatureData[rowNumber].layerId,
                    "layerTitle": this.infoWindowFeatureData[rowNumber].layerTitle,
                    "featureArray": this.infoWindowFeatureData,
                    "featureSet": this.infoWindowFeatureData[rowNumber].attr,
                    "IndexNumber": Number(Number(this.divPaginationCount.innerHTML.split("/")[0]))
                };
                this._createInfoWindowContent(infoWindowParameter);
            } else {
                domClass.replace(this.previousButton, "esriCTTPaginationDisPrev", "esriCTTPaginationPrev");
            }
        },

        /**
        * Click on next button of pagination
        * @param {featureCount} number of feature selected
        * @memberOf widgets/SearchSetting/commonHelper
        */
        nextButtonClick: function (featureCount) {
            var rowNumber, infoWindowParameter;
            if (Number(this.divPaginationCount.innerHTML.split("/")[0]) < featureCount) {
                this.divPaginationCount.innerHTML = Number(this.divPaginationCount.innerHTML.split("/")[0]) + 1 + "/" + featureCount;
                rowNumber = Number(this.divPaginationCount.innerHTML.split("/")[0]) - 1;
                // Setting info window parameter for showing info window on map
                infoWindowParameter = {
                    "mapPoint": this.infoWindowFeatureData[rowNumber].attr.geometry,
                    "attribute": this.infoWindowFeatureData[rowNumber].attr.attributes,
                    "layerId": this.infoWindowFeatureData[rowNumber].layerId,
                    "layerTitle": this.infoWindowFeatureData[rowNumber].layerTitle,
                    "featureArray": this.infoWindowFeatureData,
                    "featureSet": this.infoWindowFeatureData[rowNumber].attr,
                    "IndexNumber": Number(Number(this.divPaginationCount.innerHTML.split("/")[0]))
                };
                this._createInfoWindowContent(infoWindowParameter);
            } else {
                domClass.replace(this.nextButton, "esriCTTPaginationDisNext", "esriCTTPaginationNext");
            }
        },

        /**
        * create route for two points
        * @param {object} routeObject contains Start point, End point, widget name and query URL
        * @memberOf widgets/searchSettings/commonHelper
        */
        showRoute: function (routeObject) {
            topic.publish("showProgressIndicator");
            this.removeHighlightedCircleGraphics();
            this.removeRouteGraphichOfDirectionWidget();
            var geoArray;
            geoArray = [];
            geoArray.push(routeObject.StartPoint.geometry);
            geoArray.push(routeObject.EndPoint[routeObject.Index].geometry);
            this.routeObject = routeObject;
            // Updating two stops for direction widget.
            this._esriDirectionsWidget.updateStops(geoArray).then(lang.hitch(this, function () {
                this._esriDirectionsWidget.getDirections();
            }),
                function (err) {
                    alert(err);
                    topic.publish("hideProgressIndicator");
                });
        },

        /**
        * query on Comment Layer
        * @param {object} queryObject Contains FeatureData, Index, Layer URL, WidgetName, Address, IsRouteCreated{boolean}
        * @memberOf widgets/searcSettings/commonHelper
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
                                    if (window.location.href.toString().split("$isShowPod=").length > 1) {
                                        if (window.location.href.toString().split("$isShowPod=")[1].split("$")[0].toString() === "false") {
                                            this.carouselContainer.collapseDown();
                                        }
                                    } else {
                                        this.carouselContainer.collapseUP();
                                    }

                                    this._createCommonPods(queryObject, commentArray, resultcontent);
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
                            // If it is in share app then maintain the bottom pod status.
                            if (window.location.href.toString().split("$isShowPod=").length > 1) {
                                if (window.location.href.toString().split("$isShowPod=")[1].split("$")[0].toString() === "false") {
                                    this.carouselContainer.collapseDown();
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
        * set the content in (Comments) carousel pod when error found
        * @memberOf widgets/searchResult/commonHelper
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
        }
    });
});
