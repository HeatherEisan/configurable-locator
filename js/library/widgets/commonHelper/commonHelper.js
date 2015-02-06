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
    "dijit/_WidgetBase",
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

], function (declare, domConstruct, domStyle, domAttr, lang, on, domGeom, dom, array, domClass, query, string, Locator, Query, QueryTask, Geometry, Graphic, _WidgetBase, sharedNls, topic, CarouselContainer, LocatorTool, esriRequest, Point, a11yclick, SimpleLineSymbol, SimpleMarkerSymbol, Color, Deferred, DeferredList) {
    // ========================================================================================================================//

    return declare([_WidgetBase], {
        sharedNls: sharedNls,                            // Variable for shared NLS

        /**
        * remove highlighted symbol graphics from map
        * @memberOf widgets/commonHelper/commonHelper
        */
        removeHighlightedCircleGraphics: function () {
            // Check the highlighted symbol layer id and graphics for removing graphics from map
            if (this.map.getLayer("highlightLayerId") && this.map.getLayer("highlightLayerId").graphics.length > 0) {
                this.map.getLayer("highlightLayerId").clear();
            }
        },

        /**
        * remove buffer graphics from map
        * @memberOf widgets/commonHelper/commonHelper
        */
        removeBuffer: function () {
            // Check the buffer graphics layer and graphics for removing graphics from map
            if (this.map.getLayer("tempBufferLayer") && this.map.getLayer("tempBufferLayer").graphics.length > 0) {
                this.map.getLayer("tempBufferLayer").clear();
            }
        },

        /**
        * remove geolocation graphics from map
        * @memberOf widgets/commonHelper/commonHelper
        */
        removeGeolocationPushPin: function () {
            // Check the geolocation layer and graphics  for removing graphics from map
            if (this.map.getLayer(this.geoLocationGraphicsLayerID) && this.map.getLayer(this.geoLocationGraphicsLayerID).graphics.length > 0) {
                this.map.getLayer(this.geoLocationGraphicsLayerID).clear();
            }
        },

        /**
        * remove Locator's layer graphics from map
        * @memberOf widgets/commonHelper/commonHelper
        */
        removeLocatorPushPin: function () {
            // Check the locator's layer and graphics  for removing graphics from map
            if (this.map.getLayer(this.locatorGraphicsLayerID) && this.map.getLayer(this.locatorGraphicsLayerID).graphics.length > 0) {
                this.map.getLayer(this.locatorGraphicsLayerID).clear();
            }
        },

        /**
        * Remove Graphics of Direction widget
        * @memberOf widgets/commonHelper/commonHelper
        */
        removeRouteGraphichOfDirectionWidget: function () {
            this._esriDirectionsWidget._clearRouteGraphics();
            this._esriDirectionsWidget.removeStops();
            this._esriDirectionsWidget._clearStopGraphics();
        },

        /**
        * Disable InfoPopup Of DirectionWidget
        * @memberOf widgets/commonHelper/commonHelper
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
        * Function for clearing graphics and Carousel pod data.
        * @memberOf widgets/commonHelper/commonHelper
        */
        clearGraphicsAndCarousel: function () {
            this.locatorAddress = "";
            this.removeHighlightedCircleGraphics();
            this.removeBuffer();
            this.removeGeolocationPushPin();
            this.removeLocatorPushPin();
            this.carouselContainer.hideCarouselContainer();
            this.carouselContainer._setLegendPositionDown();
        },

        /**
        * Remove null value from the attribute.
        * @param {object} featureObject is object for feature
        * @return {object} feature set after removing null value
        * @memberOf widgets/commonHelper/commonHelper
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
        * hide Carousel Container
        * @memberOf widgets/commonHelper/commonHelper
        */
        hideCarouselContainer: function () {
            // If  Carousel Container is created then collapse it down
            if (this.carouselContainer) {
                this.carouselContainer.collapseDown();
            }
        },

        /**
        * log error message
        * @param{error} error contains error message
        * @memberOf widgets/commonHelper/commonHelper
        */
        showError: function (error) {
            console.log("Error: ", error.message);
            topic.publish("hideProgressIndicator");
        },

        /**
        * highlight the nearest feature on the amp
        * @param{object} featureGeometry contains feature
        * @memberOf widgets/commonHelper/commonHelper
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
        * Setting extent for gemetry on center
        * @memberOf widgets/commonHelper/commonHelper
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
        * @memberOf widgets/commonHelper/commonHelper
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
        * calculate the distance between the puspin(start point) and nearest feature(end point)
        * @param {object} startPoint is pushpin on map
        * @param {object} endPoint is search result
        * @memberOf widgets/commonHelper/commonHelper
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
        * @memberOf widgets/commonHelper/commonHelper
        */
        deg2Rad: function (deg) {
            return (deg * Math.PI) / 180.0;
        },

        /**
        * Convert the radians to degrees
        * @param {object} rad is radians which converts to degree
        * @return degree value
        * @memberOf widgets/commonHelper/commonHelper
        */
        rad2Deg: function (rad) {
            return (rad / Math.PI) * 180.0;
        },
        /**
        * convert the UTC time stamp from Millisecond
        * @param {object} utcMilliseconds contains UTC millisecond
        * @returns Date
        * @memberOf widgets/commonHelper/commonHelper
        */
        utcTimestampFromMs: function (utcMilliseconds) {
            return this.localToUtc(new Date(utcMilliseconds));
        },

        /**
        * convert the local time to UTC
        * @param {object} localTimestamp contains Local time
        * @returns Date
        * @memberOf widgets/commonHelper/commonHelper
        */
        localToUtc: function (localTimestamp) {
            return new Date(localTimestamp.getTime() + (localTimestamp.getTimezoneOffset() * 60000));
        },

        /**
        * Returns the pod enabled status from config file.
        * @param {string} Key name mensioned in config file
        * @memberOf widgets/commonHelper/commonHelper
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
        * @memberOf widgets/commonHelper/commonHelper
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
        * @memberOf widgets/commonHelper/commonHelper
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
        * @memberOf widgets/commonHelper/commonHelper
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
        * get the setting name by passing query layer
        * @ return search setting Data
        * @memberOf widgets/commonHelper/commonHelper
        */
        getSearchSetting: function (queryURL) {
            var settingData;
            // Looping for getting object id from event search.
            array.forEach(dojo.configData.EventSearchSettings, lang.hitch(this, function (settings, eventSettingIndex) {
                if (settings.QueryURL === queryURL) {
                    settingData = settings;
                }
            }));
            // Looping for getting object id from activity search.
            array.forEach(dojo.configData.ActivitySearchSettings, lang.hitch(this, function (settings, activitySettingIndex) {
                if (settings.QueryURL === queryURL) {
                    settingData = settings;
                }
            }));
            return settingData;
        },

        /**
        * Remove comment pod from container for event layer
        * @memberOf widgets/commonHelper/commonHelper
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
        * @memberOf widgets/commonHelper/commonHelper
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
        * Setting value to change for extent
        * @memberOf widgets/commonHelper/commonHelper
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
        * Calculate offset point to show infow window
        * @param {mapPoint}
        * @memberOf widgets/commonHelper/commonHelper
        */
        calculateCustomMapExtent: function (mapPoint) {
            var width, infoWidth, height, diff, ratioHeight, ratioWidth, totalYPoint, xmin,
                ymin, xmax, ymax;
            width = this.map.extent.getWidth();
            infoWidth = (this.map.width / 2) + dojo.configData.InfoPopupWidth / 2 + 400;
            height = this.map.extent.getHeight();
            //check if infoWindow width is grether than map width
            if (infoWidth > this.map.width) {
                diff = infoWidth - this.map.width;
            } else {
                diff = 0;
            }
            ratioHeight = height / this.map.height;
            ratioWidth = width / this.map.width;
            totalYPoint = dojo.configData.InfoPopupHeight + 30 + 61;
            xmin = mapPoint.x - (width / 2);
            //validate the width of window
            if (dojo.window.getBox().w >= 680) {
                ymin = mapPoint.y - height + (ratioHeight * totalYPoint);
                xmax = xmin + width + diff * ratioWidth;
            } else {
                ymin = mapPoint.y - (height / 2);
                xmax = xmin + width;
            }
            ymax = ymin + height;
            return new esri.geometry.Extent(xmin, ymin, xmax, ymax, this.map.spatialReference);
        },

        /**
        * It gets the info window index from info window settings of selected feature
        * @param {layerTitle} layerTitle of feature
        * @param {layerId} layerID of feature
        * return index of the infoWindow feature
        * @memberOf widgets/commonHelper/commonHelper
        */
        getInfowWindowIndex: function (layerTitle, layerId) {
            var index, i;
            // looping for getting the feture Title and Layerid
            for (i = 0; i < dojo.configData.InfoWindowSettings.length; i++) {
                if (layerTitle === dojo.configData.InfoWindowSettings[i].Title && layerId === dojo.configData.InfoWindowSettings[i].QueryLayerId) {
                    index = i;
                    break;
                }
            }
            return index;
        },

        /**
        * Get object id from the layer
        * @param {object} object of layer
        * @return {objectId} returns the objectId
        * @memberOf widgets/commonHelper/commonHelper
        */
        getObjectId: function (response) {
            var objectId, j;
            //loop for the json response and store the objectId in esriFieldTypeOID
            for (j = 0; j < response.length; j++) {
                //check whether objectId type feild from layer is equal to "esriFieldTypeOID"
                if (response[j].type === "esriFieldTypeOID") {
                    objectId = response[j].name;
                    break;
                }
            }
            return objectId;
        },

        /**
        * Get the key field value from the config file
        * @param {data} keyField value with $ sign
        * @memberOf widgets/commonHelper/commonHelper
        */
        getKeyValue: function (data) {
            var firstPlace, secondPlace, keyValue;
            firstPlace = data.indexOf("{");
            secondPlace = data.indexOf("}");
            keyValue = data.substring(Number(firstPlace) + 1, secondPlace);
            return keyValue;
        },

        /**
        * Function get object id on the basic of setting name
        * @param {LayerId} layer id value
        * @param {LayerTitle} layer title value
        * return a URL on which query is performed
        * @memberOf widgets/commonHelper/commonHelper
        */
        getQueryUrl: function (LayerId, LayerTitle) {
            var queryURL;
            // Looping for getting object id from event search.
            array.forEach(dojo.configData.EventSearchSettings, lang.hitch(this, function (settings, eventSettingIndex) {
                if (settings.QueryLayerId === LayerId && settings.Title === LayerTitle) {
                    queryURL = settings.QueryURL;
                }
            }));
            // Looping for getting object id from activity search.
            array.forEach(dojo.configData.ActivitySearchSettings, lang.hitch(this, function (settings, activitySettingIndex) {
                if (settings.QueryLayerId === LayerId && settings.Title === LayerTitle) {
                    queryURL = settings.QueryURL;
                }
            }));
            return queryURL;
        },

        /**
        * It gets the feature type from  selected feature
        * @param {layerTitle} layerTitle of feature
        * @param {layerId} layerID of feature
        * return the name of the widget
        * @memberOf widgets/commonHelper/commonHelper
        */
        getInfowWindowWidgetName: function (layerTitle, layerId) {
            var widgetName = "", key, j;
            for (key in dojo.configData) {
                if (dojo.configData.hasOwnProperty(key)) {
                    if (key === "ActivitySearchSettings" || key === "EventSearchSettings") {
                        if (dojo.configData.ActivitySearchSettings[0].Title === layerTitle && dojo.configData.ActivitySearchSettings[0].QueryLayerId === layerId) {
                            widgetName = "InfoActivity";
                            break;
                        }
                        for (j = 0; j < dojo.configData.EventSearchSettings.length; j++) {
                            if (dojo.configData.EventSearchSettings[j].Title === layerTitle && dojo.configData.EventSearchSettings[j].QueryLayerId === layerId) {
                                widgetName = "InfoEvent";
                                break;
                            }
                        }
                    }
                }
            }
            return widgetName;
        },

        /**
        * Get Attachments For InfoWindow
        * @param {object} response is the information about the attachment
        * @memberOf widgets/commonHelper/commonHelper
        */
        getAttachments: function (response) {
            var divAttchmentInfo, divPreviousImgInfo, divNextImgInfo;
            this.imageCountInfo = 0;
            //check response length which contain the information of attachment
            if (response.length > 1) {
                divPreviousImgInfo = domConstruct.create("div", { "class": "esriCTImgPrev" }, this.galleryContainer);
                divNextImgInfo = domConstruct.create("div", { "class": "esriCTImgNext" }, this.galleryContainer);
                divAttchmentInfo = domConstruct.create("img", { "class": "esriCTDivAttchmentInfo" }, this.galleryContainer);
                domAttr.set(divAttchmentInfo, "src", response[0].url);
                this.own(on(divPreviousImgInfo, a11yclick, lang.hitch(this, this._previousImageInfo, response, divAttchmentInfo)));
                this.own(on(divNextImgInfo, a11yclick, lang.hitch(this, this._nextImageInfo, response, divAttchmentInfo)));
                // check if response(attchment) length is only 1
            } else if (response.length === 1) {
                divAttchmentInfo = domConstruct.create("img", { "class": "esriCTDivAttchmentInfo" }, this.galleryContainer);
                domAttr.set(divAttchmentInfo, "src", response[0].url);
            } else {
                domConstruct.create("div", { "class": "esriCTGalleryBox", "innerHTML": sharedNls.errorMessages.imageDoesNotFound }, this.galleryContainer);
            }
        },

        /**
        *Fetch the geometry type of the mapPoint
        * @param {object} geometry Contains the geometry service
        * return selected MapPoint
        * @memberOf widgets/commonHelper/commonHelper
        */
        getMapPoint: function (geometry) {
            var selectedMapPoint, mapPoint, rings, points;
            //if geometry type is point
            if (geometry.type === "point") {
                selectedMapPoint = geometry;
                //if geometry type is polyline
            } else if (geometry.type === "polyline") {
                selectedMapPoint = geometry.getPoint(0, 0);
            } else if (geometry.type === "polygon") {
                mapPoint = geometry.getExtent().getCenter();
                if (!geometry.contains(mapPoint)) {
                    //if the center of the polygon does not lie within the polygon
                    rings = Math.floor(geometry.rings.length / 2);
                    points = Math.floor(geometry.rings[rings].length / 2);
                    selectedMapPoint = geometry.getPoint(rings, points);
                } else {
                    //if the center of the polygon lies within the polygon
                    selectedMapPoint = geometry.getExtent().getCenter();
                }
            }
            return selectedMapPoint;
        },

        /**
        * Get date field from layer
        * @param {object} object of layer
        * @memberOf widgets/commonHelper/commonHelper
        */
        getDateField: function (response) {
            var j, dateFieldArray = [], dateField;
            for (j = 0; j < response.fields.length; j++) {
                if (response.fields[j].type === "esriFieldTypeDate") {
                    dateField = response.fields[j].name;
                    dateFieldArray.push(dateField);
                }
            }
            return dateFieldArray;
        },

        /**
        * function for adding item in my list panel
        * @param {eventDataObject} contains the event object information
        * @return {widgetName} contains the widget name
        * @memberOf widgets/commonHelper/commonHelper
        */
        addtoMyList: function (eventDataObject, widgetName) {
            topic.publish("showProgressIndicator");
            var sortedMyList, eventObject, l, eventSearchSettingsIndex, listObject, settingName, order, sortedMyListData;
            listObject = {};
            // Looping event search setting for getting event index, and event setting name for further query
            array.forEach(dojo.configData.EventSearchSettings, lang.hitch(this, function (settings, eventSettingIndex) {
                if (settings.QueryLayerId === eventDataObject.layerId && settings.Title === eventDataObject.layerTitle) {
                    eventSearchSettingsIndex = eventSettingIndex;
                    settingName = "eventsettings";
                }
            }));
            // Looping activity search setting for getting event index, and event setting name for further query
            array.forEach(dojo.configData.ActivitySearchSettings, lang.hitch(this, function (settings, activitySettingIndex) {
                if (settings.QueryLayerId === eventDataObject.layerId && settings.Title === eventDataObject.layerTitle) {
                    eventSearchSettingsIndex = activitySettingIndex;
                    settingName = "activitysettings";
                }
            }));

            //add the selected event object to the memory store
            listObject = { "key": eventDataObject.ObjectIDField, "value": eventDataObject.eventDetails, "featureSet": eventDataObject.featureSet, "startDateField": eventDataObject.StartDateField, "eventSettingsIndex": eventSearchSettingsIndex, "settingsName": settingName };
            this.myListStore.push(listObject);
            topic.publish("getMyListData", this.myListStore);
            if (this.myListStore.length > 0) {
                topic.publish("replaceClassForMyList");
            }
            //sort with ascending order of date
            topic.publish("sortMyList", true, this.featureSet);
            if (widgetName.toLowerCase() === "infoevent" || "event") {
                sortedMyList = this.sortedList;
                if (!eventDataObject.infoWindowClick) {
                    eventObject = { "EventDeatils": eventDataObject.eventDetails, "SortedData": sortedMyList, "InfowindowClick": eventDataObject.infoWindowClick, "layerId": eventDataObject.layerId, "layerTitle": eventDataObject.layerTitle, "settingsName": settingName, "key": eventDataObject.ObjectIDField, "startDateField": eventDataObject.StartDateField };
                } else {
                    eventObject = { "EventDeatils": eventDataObject.eventDetails, "SortedData": sortedMyList, "InfowindowClick": eventDataObject.infoWindowClick, "layerId": eventDataObject.layerId, "layerTitle": eventDataObject.layerTitle, "settingsName": settingName, "key": eventDataObject.ObjectIDField, "startDateField": eventDataObject.StartDateField };
                }
            } else {
                eventObject = { "EventDeatils": eventDataObject.eventDetails, "SortedData": this.sortedList, "InfowindowClick": eventDataObject.infoWindowClick, "layerId": eventDataObject.layerId, "layerTitle": eventDataObject.layerTitle, "settingsName": settingName, "key": eventDataObject.ObjectIDField, "startDateField": eventDataObject.StartDateField };
            }
            topic.publish("refreshMyList", eventObject, widgetName);
            if (!eventDataObject.infoWindowClick) {
                dojo.eventIndex = null;
            }
            // Looping my list store for adding object id in an array for share application
            for (l = 0; l < this.myListStore.length; l++) {
                // check if event added from event search
                if (!eventDataObject.infoWindowClick) {
                    if (dojo.eventIndex) {
                        dojo.eventIndex += "," + this.myListStore[l].value[this.myListStore[l].key].toString();
                    } else {
                        dojo.eventIndex = this.myListStore[l].value[this.myListStore[l].key].toString();
                    }
                }
            }
            if (window.location.toString().split("$eventOrderInMyList=").length > 1) {
                if (this.myListStore.length === Number(window.location.toString().split("$eventOrderInMyList=")[1].split(",")[1].split("$")[0])) {
                    order = Boolean(window.location.toString().split("$eventOrderInMyList=")[1].split(",")[0]);
                    sortedMyListData = this._sortDate(order);
                    eventObject = { "EventDeatils": null, "SortedData": sortedMyListData, "InfowindowClick": false, "eventForOrder": true };
                    // show data in mylist panel after order by list.
                    topic.publish("refreshMyList", eventObject, widgetName);
                }
            }
            topic.publish("hideProgressIndicator");
        },

        /**
        * sort date by order
        * @param string startDate contains date attribute
        * @param string ascendingFlag contains boolean flag for ascending value
        * @memberOf widgets/myList/myList
        */
        _sortDate: function (ascendingFlag) {
            var sortResult = [], sortedEventData = [], sortedActivityData = [], t, startDateFound, p, q, sortedDataKey, sortedDateArray, nameValue, nameData;
            // Checking for order of data and sorting.
            if (ascendingFlag) {
                sortResult = this.myListStore.sort(lang.hitch(this, function (a, b) {
                    if (b.value[b.startDateField] && a.value[a.startDateField]) {
                        sortedDateArray = new Date(b.value[b.startDateField]).getTime() - new Date(a.value[a.startDateField]).getTime();
                    } else {
                        sortedDateArray = 1;
                    }
                    return sortedDateArray;
                }));
            } else {
                sortResult = this.myListStore.sort(lang.hitch(this, function (a, b) {
                    if (a.value[a.startDateField] && b.value[b.startDateField]) {
                        sortedDateArray = new Date(a.value[a.startDateField]).getTime() - new Date(b.value[b.startDateField]).getTime();
                    } else {
                        sortedDateArray = 1;
                    }
                    return sortedDateArray;
                }));
            }
            // Looping sorted data for finding start date field to store event and activity data seperatly
            for (t = 0; t < sortResult.length; t++) {
                startDateFound = false;
                for (sortedDataKey in sortResult[t].value) {
                    if (sortResult[t].value.hasOwnProperty(sortedDataKey)) {
                        if (sortedDataKey === sortResult[t].startDateField) {
                            startDateFound = true;
                            break;
                        }
                    }
                }
                if (startDateFound) {
                    sortedEventData.push(sortResult[t]);
                } else {
                    sortedActivityData.push(sortResult[t]);
                }
            }
            sortedActivityData = sortedActivityData.sort(function (a, b) {
                nameValue = a.value.NAME.toLowerCase();
                nameData = b.value.NAME.toLowerCase();
                if (nameValue < nameData) { //sort string ascending
                    return -1;
                }
                if (nameValue > nameData) {
                    return 1;
                }
                return 0; //default return value (no sorting)
            });
            sortResult.length = 0;
            for (p = 0; p < sortedEventData.length; p++) {
                sortResult.push(sortedEventData[p]);
            }
            for (q = 0; q < sortedActivityData.length; q++) {
                sortResult.push(sortedActivityData[q]);
            }
            return sortResult;
        },

        /**
        * change the date format
        * @return {object} feature object
        * @memberOf widgets/commonHelper/commonHelper
        */
        changeDateFormatForActivity: function (featureSet) {
            var displayDateFormat = dojo.configData.ActivitySearchSettings[0].DisplayDateFormat, i, key, k;
            // If feature set is found and date and time field array is found.
            if (featureSet && this.dateFieldArray) {
                // Looping for date field array
                for (i = 0; i < this.dateFieldArray.length; i++) {
                    // Looping for feature set for changing date value formate.
                    for (k = 0; k < featureSet.length; k++) {
                        for (key in featureSet[k].attributes) {
                            if (featureSet[k].attributes.hasOwnProperty(key)) {
                                // If key is mached with date attribute
                                if (key === this.dateFieldArray[i]) {
                                    if (featureSet[k].attributes[key] !== sharedNls.showNullValue) {
                                        featureSet[k].attributes[key] = dojo.date.locale.format(this.utcTimestampFromMs(featureSet[k].attributes[key]), { datePattern: displayDateFormat, selector: "date" });
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return featureSet;
        }
    });
});
