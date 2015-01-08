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
    "dijit/a11yclick"

], function (declare, domConstruct, domStyle, domAttr, lang, on, domGeom, dom, array, domClass, query, string, Locator, Query, QueryTask, Geometry, Graphic, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic, CarouselContainer, LocatorTool, esriRequest, Point, a11yclick) {
    // ========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,                 // Variable for template string
        sharedNls: sharedNls,                     // Variable for shared NLS

        /**
        * file for creating activity search panel and getting start point from geolocaiton and calculateing route for activity search.
        */

        /**
        * function for getting comment layer information like object id.
        * @memberOf widgets/searchSettings/activitySearch
        */
        getLayerInformaition: function () {
            var commentLayerRequestData;
            // Setting object id field for activity layer.
            this.objectIdForActivityLayer = dojo.configData.ActivitySearchSettings[0].ObjectID;
            // Calling query layer for activity search comment layer for getting object id field.
            commentLayerRequestData = this._queryLayerForLayerInformation(dojo.configData.ActivitySearchSettings[0].CommentsSettings.QueryURL);
            // If comment layer request data is found.
            if (commentLayerRequestData) {
                // If comment layer request data is found.
                commentLayerRequestData.then(lang.hitch(this, function (response) {
                    topic.publish("showProgressIndicator");
                    this.objectIdForCommentLayer = this._getObjectId(response);
                    topic.publish("hideProgressIndicator");
                }), function (error) {
                    console.log("Error: ", error.message);
                    topic.publish("hideProgressIndicator");
                });
            }
            // Calling function if geolocation is clicked from widget.
            this._geolocationClicked();
        },

        /**
        * fire when geolocation widget is clicked, show buffer and route and direction
        * @memberOf widgets/searchSettings/activitySearch
        */
        _geolocationClicked: function () {
            // If geolocation is click then this function will be called.
            if (dijit.registry.byId("geoLocation")) {
                // On complete of geolocation widget.
                dijit.registry.byId("geoLocation").onGeolocationComplete = lang.hitch(this, function (mapPoint, isPreLoaded) {
                    // If it is comming from geolocation widget then remove graphics and create buffer.
                    if (mapPoint && isPreLoaded) {
                        this.removeLocatorPushPin();
                        topic.publish("extentSetValue", true);
                        topic.publish("hideInfoWindow");
                        dojo.addressLocation = null;
                        dojo.doQuery = "false";
                        dojo.infowindowDirection = null;
                        dojo.searchFacilityIndex = -1;
                        dojo.addressLocationDirectionActivity = null;
                        dojo.addressLocation = null;
                        dojo.sharedGeolocation = mapPoint;
                        this.removeRouteGraphichOfDirectionWidget();
                        this.removeBuffer();
                        this.createBuffer(mapPoint, "geolocation");
                    }
                });
            }
            // If geolocation widget
            if (dijit.registry.byId("geoLocation")) {
                // If any error is got after clicking on geolocation widget, hide carausel container and remove all graphics.
                dijit.registry.byId("geoLocation").onGeolocationError = lang.hitch(this, function (error, isPreLoaded) {
                    if (!this.widgetName && isPreLoaded) {
                        topic.publish("extentSetValue", true);
                        topic.publish("hideInfoWindow");
                        this.removeHighlightedCircleGraphics();
                        this.removeBuffer();
                        this.removeLocatorPushPin();
                        this.carouselContainer.hideCarouselContainer();
                        this.carouselContainer._setLegendPositionDown();
                    }
                });
            }
        },

        /**
        * show Activity result tap
        * @memberOf widgets/searchSettings/activitySearch
        */
        _showActivityTab: function () {
            domStyle.set(this.divActivityContainer, "display", "block");
            domStyle.set(this.divSearchContent, "display", "none");
            domStyle.set(this.divEventContainer, "display", "none");
            domClass.replace(this.divActivityPanel, "esriCTActivityPanelSelected", "esriCTActivityPanel");
            domClass.replace(this.divActivityContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
            domClass.replace(this.divSearchPanel, "esriCTSearchPanelSelected", "esriCTDivSearchPanel");
            domClass.replace(this.divEventsPanel, "esriCTEventsPanel", "esriCTDivEventsPanelSelected");
        },

        /**
        * show/hide locator widget and set default search text
        * @memberOf widgets/searchSettings/activitySearch
        */
        _showLocateContainer: function () {
            if (domGeom.getMarginBox(this.divSearchContainer).h > 1) {
                /**
                * when user clicks on locator icon in header panel, close the search panel if it is open
                */
                domClass.replace(this.domNode, "esriCTHeaderSearch", "esriCTHeaderSearchSelected");
                domClass.replace(this.divSearchContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
            } else {
                /**
                * when user clicks on locator icon in header panel, open the search panel if it is closed
                */
                domClass.replace(this.domNode, "esriCTHeaderSearchSelected", "esriCTHeaderSearch");
                domClass.replace(this.divSearchContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
            }
        },

        /**
        * display search by address tab
        * @memberOf widgets/searchSettings/activitySearch
        */
        _showAddressSearchView: function () {
            if (domStyle.get(this.imgSearchLoader, "display") === "block") {
                return;
            }
        },

        /**
        * show search result tap
        * @memberOf widgets/searchSettings/activitySearch
        */
        _showSearchTab: function () {
            domStyle.set(this.divActivityContainer, "display", "none");
            domStyle.set(this.divEventContainer, "display", "none");
            domStyle.set(this.divSearchContent, "display", "block");
            domClass.replace(this.divActivityPanel, "esriCTActivityPanel", "esriCTActivityPanelSelected");
            domClass.replace(this.divEventsPanel, "esriCTEventsPanel", "esriCTEventsPanelSelected");
            domClass.replace(this.divSearchPanel, "esriCTDivSearchPanel", "esriCTSearchPanelSelected");
            domClass.replace(this.divActivityContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
        },

        /**
        * create activity search panel with selected activity
        * @memberOf widgets/searchSettings/activitySearch
        */
        _showActivitySearchContainer: function () {
            var activitySearchMainContainer, activitySearchContent = [], activityTickMark, activityImageDiv = [], i, activitySearchMainContent, activitySearchGoButton, SearchSettingsLayers, c, activityimgSpan = [];
            activitySearchMainContainer = domConstruct.create("div", { "class": "esriCTActivityMainContainer" }, this.divActivityContainer);
            activitySearchMainContent = domConstruct.create("div", { "class": "esriCTActivityTable" }, activitySearchMainContainer);
            SearchSettingsLayers = dojo.configData.ActivitySearchSettings[0];
            if (window.location.href.toString().split("$activitySearch=").length > 1) {
                // Looping for activity search setting for getting selected activity icon
                for (c = 0; c < SearchSettingsLayers.ActivityList.length; c++) {
                    SearchSettingsLayers.ActivityList[c].IsSelected = false;
                    // If comming from share app and found activity search then set selected icon from share url
                    if (window.location.href.toString().split("$activitySearch=")[1].split("$")[0].split(SearchSettingsLayers.ActivityList[c].FieldName.toString()).length > 1) {
                        SearchSettingsLayers.ActivityList[c].IsSelected = true;
                    }
                }
            }
            // Looping for activity list icon for showing image in div
            for (i = 0; i < SearchSettingsLayers.ActivityList.length; i++) {
                activitySearchContent[i] = domConstruct.create("div", { "class": "esriCTActivityRow", "index": i }, activitySearchMainContent);
                activityImageDiv[i] = domConstruct.create("div", { "class": "esriCTActivityImage" }, activitySearchContent[i]);
                activityimgSpan[i] = domConstruct.create("span", { "class": "esriCTActivitySpanImg" }, activityImageDiv[i]);
                domConstruct.create("img", { "src": SearchSettingsLayers.ActivityList[i].Image }, activityimgSpan[i]);
                activityTickMark = domConstruct.create("div", { "class": "esriCTActivityTextArea" }, activitySearchContent[i]);
                this.own(on(activitySearchContent[i], a11yclick, lang.hitch(this, this._selectActivity, activityTickMark, activityimgSpan[i])));
                // If Search setting layer's activity list is selected then set selected image in container.
                if (SearchSettingsLayers.ActivityList[i].IsSelected) {
                    // If in activity search found error then set selected icon disable.
                    if (window.location.href.toString().split("$activitySearch=").length > 1 && window.location.href.toString().split("$activitySearch=")[1].substring(0, 5) === "error") {
                        domClass.remove(activityTickMark, "esriCTTickMark");
                        domClass.remove(activityimgSpan[i], "esriCTUtilityImgSelect");
                    } else {
                        domClass.add(activityTickMark, "esriCTTickMark");
                        domClass.add(activityimgSpan[i], "esriCTUtilityImgSelect");
                    }
                } else {
                    domClass.remove(activityTickMark, "esriCTTickMark");
                    domClass.remove(activityimgSpan[i], "esriCTUtilityImgSelect");
                }
                domConstruct.create("div", { "class": "esriCTActivityText", "innerHTML": SearchSettingsLayers.ActivityList[i].Alias }, activityTickMark);
            }
            activitySearchGoButton = domConstruct.create("div", { "class": "esriCTActivitySearchGoButton", "innerHTML": sharedNls.titles.gobuttonText }, this.divActivityContainer);
            this.own(on(activitySearchGoButton, a11yclick, lang.hitch(this, this._queryForSelectedActivityInList)));
            // If in share url activity searh is clicked then query for layer
            if (window.location.href.toString().split("$activitySearch=").length > 1 && window.location.href.toString().split("$activitySearch=")[1].substring(0, 5) !== "false" && window.location.href.toString().split("$activitySearch=")[1].substring(0, 5) !== "error") {
                if (window.location.href.toString().split("$doQuery=")[1].split("$")[0] === "true") {
                    this._queryForSelectedActivityInList();
                }
                domClass.replace(this.domNode, "esriCTHeaderSearch", "esriCTHeaderSearchSelected");
                domClass.replace(this.divSearchContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
            }
        },

        /**
        * set the select and unselect in activity serach.
        * param {object} activityTickMark is domNode
        * param {object} activityimgSpan is domNode
        * @memberOf widgets/searchSettings/activitySearch
        */
        _selectActivity: function (activityTickMark, activityimgSpan) {
            // If activity tick mark is  found
            if (domClass.contains(activityTickMark, "esriCTTickMark")) {
                domClass.remove(activityTickMark, "esriCTTickMark");
                domClass.remove(activityimgSpan, "esriCTUtilityImgSelect");
            } else {
                domClass.add(activityTickMark, "esriCTTickMark");
                domClass.add(activityimgSpan, "esriCTUtilityImgSelect");
            }
        },

        /**
        * This funciton qurey for selected acitivity in list
        * @memberOf widgets/searchSettings/activitySearch
        */
        _queryForSelectedActivityInList: function () {
            var activityArray = [], infoActivity, selectedRow, j, i, selectedFeatureText, SearchSettingsLayers, selectedActivityArray = [];
            dojo.doQuery = "true";
            this.removeHighlightedCircleGraphics();
            this.removeBuffer();
            this._showLocateContainer();
            dojo.searchFacilityIndex = -1;
            topic.publish("hideInfoWindow");
            // removing carausel container
            this.carouselContainer.removeAllPod();
            // Setting carousel pod data
            this.carouselContainer.addPod(this.carouselPodData);
            this.locatorAddress = "";
            topic.publish("showProgressIndicator");
            domClass.replace(this.domNode, "esriCTHeaderSearch", "esriCTHeaderSearchSelected");
            //
            SearchSettingsLayers = dojo.configData.ActivitySearchSettings[0];
            infoActivity = SearchSettingsLayers.ActivityList;
            // Looping for info activity.
            for (i = 0; i < infoActivity.length; i++) {
                activityArray.push(infoActivity[i]);
            }
            // If activity array is grater then 0
            if (activityArray.length > 0) {
                selectedRow = query('.esriCTTickMark');
                // If row is selected
                if (selectedRow) {
                    // Loop through selected row
                    for (j = 0; j < selectedRow.length; j++) {
                        selectedFeatureText = selectedRow[j].textContent || selectedRow[j].innerText;
                        for (i = 0; i < activityArray.length; i++) {
                            if (selectedFeatureText === activityArray[i].Alias) {
                                domAttr.set(selectedRow[j], "activity", activityArray[i].FieldName);
                                domAttr.set(selectedRow[j], "index", i);
                                selectedActivityArray.push(activityArray[i].FieldName);
                            }
                        }
                    }
                    dojo.activitySearch = selectedActivityArray;
                    dojo.addressLocation = null;
                    this._queryForSelectedActivityInLayer(selectedRow);
                } else {
                    dojo.activitySearch = ["error"];
                    dojo.sharedGeolocation = null;
                    dojo.infowindowDirection = null;
                    alert(sharedNls.errorMessages.activityNotSelected);
                    this._clearGraphicsAndCarousel();
                    this.removeRouteGraphichOfDirectionWidget();
                    topic.publish("hideProgressIndicator");
                }
            }
        },

        /**
        * This funciton qurey for selected acitivity in Layer
        * @param{object}selectedRow contains the selected feature
        * @memberOf widgets/searchSettings/activitySearch
        */
        _queryForSelectedActivityInLayer: function (selectedRow) {
            var activityQueryString, queryTask, queryForActivity, i, activity, widgetName;
            activityQueryString = "";
            widgetName = "activitySearch";
            this.selectedActivities = selectedRow;
            // Looping for selected row for query on layer
            for (i = 0; i < selectedRow.length; i++) {
                activity = domAttr.get(selectedRow[i], "activity");
                // If selected icons are more then create query.
                if (i === selectedRow.length - 1) {
                    activityQueryString += activity + " = 'Yes'";
                } else {
                    activityQueryString += activity + " = 'Yes' AND ";
                }
            }
            // If query string is not found or created then show error message.
            if (activityQueryString === "") {
                dojo.activitySearch = ["error"];
                dojo.sharedGeolocation = null;
                alert(sharedNls.errorMessages.activityNotSelected);
                this._clearGraphicsAndCarousel();
                this.removeRouteGraphichOfDirectionWidget();
                dojo.infowindowDirection = null;
                topic.publish("hideProgressIndicator");
                return;
            }
            // creating query task for firing query on layer.
            queryTask = new esri.tasks.QueryTask(dojo.configData.ActivitySearchSettings[0].QueryURL);
            queryForActivity = new esri.tasks.Query();
            queryForActivity.where = activityQueryString;
            queryForActivity.outFields = ["*"];
            queryForActivity.returnGeometry = true;
            // Execute query on layer.
            queryTask.execute(queryForActivity, lang.hitch(this, function (relatedRecords) {
                // If related records are found then set date and time according to formate
                if (relatedRecords && relatedRecords.features && relatedRecords.features.length > 0) {
                    this.dateFieldArray = this._getDateField(relatedRecords);
                    // Call execute query on feature
                    this._executeQueryForFeatures(relatedRecords.features, dojo.configData.ActivitySearchSettings[0].QueryURL, widgetName);
                } else {
                    alert(sharedNls.errorMessages.invalidSearch);
                    dojo.activitySearch = ["error"];
                    dojo.infowindowDirection = null;
                    this._clearGraphicsAndCarousel();
                    this.removeRouteGraphichOfDirectionWidget();
                    topic.publish("hideProgressIndicator");
                }
            }), function (error) {
                dojo.activitySearch = ["error"];
                dojo.infowindowDirection = null;
                topic.publish("hideProgressIndicator");
                this.removeRouteGraphichOfDirectionWidget();
                alert(error);
            });
        },

        /**
        * Get date field from layer
        * @param {object} object of layer
        * @return array containing date attribute
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _getDateField: function (response) {
            var j, dateFieldArray = [], dateField;
            // Looping for response file for getting date field.
            for (j = 0; j < response.fields.length; j++) {
                if (response.fields[j].type === "esriFieldTypeDate") {
                    dateField = response.fields[j].name;
                    dateFieldArray.push(dateField);
                }
            }
            return dateFieldArray;
        },

        /**
        * change the date format
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _changeDateFormatForActivity: function (featureSet) {
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
        },

        /**
        * Function for clearing graphics and Carousel pod data.
        * @memberOf widgets/searchSettings/activitySearch
        */
        _clearGraphicsAndCarousel: function () {
            this.locatorAddress = "";
            this.removeHighlightedCircleGraphics();
            this.removeBuffer();
            this.removeGeolocationPushPin();
            this.removeLocatorPushPin();
            this.carouselContainer.hideCarouselContainer();
            this.carouselContainer._setLegendPositionDown();
        },

        /**
        * get the feature within buffer and sort it in ascending order.
        * @param {object} featureSetObject Contains Feature
        * @param {object} QueryURL Contains layer URL
        * @param {string} widgetName Contains name of widget
        * @memberOf widgets/searchSettings/activitySearch
        */
        _executeQueryForFeatures: function (featureSetObject, QueryURL, widgetName) {
            var featureSet, i, dist, isDistanceFound, isZoomToGeolocation;
            // Calling function for removing null value from feature
            this.featureSetWithoutNullValue = this.removeNullValue(featureSetObject);
            // Calling function to change date attribute formate
            this.featureSetWithoutNullValue = this._changeDateFormatForActivity(featureSetObject);
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
                            this.carouselContainer.hideCarouselContainer();
                            this.carouselContainer._setLegendPositionDown();
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
                    // calling error message when geoloation widget is not configured.
                    topic.publish("hideProgressIndicator");
                    alert(sharedNls.errorMessages.geolocationWidgetNotFoundMessage);
                }
            } else {
                // Calling error message when geolocation is not supported
                topic.publish("hideProgressIndicator");
                alert(sharedNls.errorMessages.activitySerachGeolocationText);
            }
        },

        /**
        * Execute when geolocaiton is not found.
        * @param {object} featureset Contains information of feature
        * @param {object} Query Url of the layer
        * @param {string} widget name
        * @memberOf widgets/searchSettings/activitySearch
        */
        executeWithoutGeolocation: function (featureSetWithoutNullValue, QueryURL, widgetName, index) {
            var facilityObject, resultcontent, queryObject, locatorParamsForEventContainer, divDirectioncontent, divHeader, eventMapPoint, routeObject, searchContenData;
            dojo.addressLocationDirectionActivity = null;
            // If qurey is comming from event layer
            if (widgetName.toLowerCase() === "event") {
                dojo.doQuery = "false";
                this.removeCommentPod();
                // Removing null value from features
                featureSetWithoutNullValue = this.removeNullValue(featureSetWithoutNullValue);
                this.removeHighlightedCircleGraphics();
                topic.publish("showProgressIndicator");
                this.carouselContainer.showCarouselContainer();
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
                    // Getting search display field from layer
                    searchContenData = this.getKeyValue(dojo.configData.EventSearchSettings[0].SearchDisplayFields);
                    divHeader = domConstruct.create("div", {}, divDirectioncontent);
                    domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": sharedNls.titles.directionText + " " + featureSetWithoutNullValue[0].attributes[searchContenData] }, divHeader);
                    locatorParamsForEventContainer = new LocatorTool(locatorParamsForEventContainer);
                    eventMapPoint = this.map.getLayer(locatorParamsForEventContainer.graphicsLayerId);
                    // Calling candidate click function for showing route and data in bottom pod
                    locatorParamsForEventContainer.candidateClicked = lang.hitch(this, function (graphic) {
                        dojo.addressLocationDirectionActivity = locatorParamsForEventContainer.selectedGraphic.geometry.x.toString() + "," + locatorParamsForEventContainer.selectedGraphic.geometry.y.toString();
                        if (graphic && graphic.attributes && graphic.attributes.address) {
                            this.locatorAddress = graphic.attributes.address;
                        }
                        dojo.doQuery = "false";
                        topic.publish("hideInfoWindow");
                        this.removeGeolocationPushPin();
                        routeObject = { "StartPoint": eventMapPoint.graphics[0], "EndPoint": featureSetWithoutNullValue, "Index": 0, "WidgetName": widgetName, "QueryURL": QueryURL };
                        this.showRoute(routeObject);
                    });
                }
                // Calling function for setting gallery
                this.setGallery(featureSetWithoutNullValue, resultcontent);
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
        },

        /**
        * call all the function when click on search result data
        * @param {object} searchedFacilityObject contains route result, features in buffer area, search address,mapPoint, comment layer info
        * @memberOf widgets/searchResult/activitySearch
        */
        _clickOnSearchedFacility: function (searchedFacilityObject, event) {
            var pushPinGemotery, widgetName, routeObject, queryObject, highlightedDiv, queryURL, rowIndex;
            topic.publish("extentSetValue", true);
            topic.publish("hideInfoWindow");
            // If feature data has some items
            if (searchedFacilityObject.FeatureData.length > 1) {
            // If event is available then get tuery URL and row index from event.
                if (event !== null) {
                    queryURL = domAttr.get(event.currentTarget, "QueryURL");
                    rowIndex = domAttr.get(event.currentTarget, "value");
                }
                // If event is not available then get tuery URL and row index from event.
                if (event === null) {
                    queryURL = searchedFacilityObject.QueryLayer;
                    rowIndex = searchedFacilityObject.searchedFacilityIndex;
                }
                // query for getting highlighed div
                highlightedDiv = query('.esriCTDivHighlightFacility')[0];
                domClass.replace(highlightedDiv, "esriCTSearchResultInfotext", "esriCTDivHighlightFacility");
                // If event is not available then change the selected row.
                if (event !== null) {
                    domClass.replace(event.currentTarget, "esriCTDivHighlightFacility", "esriCTSearchResultInfotext");
                }
                dojo.searchFacilityIndex = Number(rowIndex);
                // If it is comming from activity search pod then remove buffer layer.
                if (searchedFacilityObject.WidgetName.toLowerCase() === "activitysearch") {
                    this.removeBuffer();
                }
                widgetName = "SearchedFacility";
                topic.publish("showProgressIndicator");
                this.removeHighlightedCircleGraphics();
                // If any point is ther on map related to geolocation settings else it is locator settings.
                if (this.map.getLayer(this.geoLocationGraphicsLayerID).graphics.length > 0) {
                    pushPinGemotery = this.map.getLayer(this.geoLocationGraphicsLayerID).graphics;
                } else {
                    pushPinGemotery = this.map.getLayer(this.locatorGraphicsLayerID).graphics;
                }
                // If data is found then call show route function.
                if (pushPinGemotery[0]) {
                    routeObject = { "StartPoint": pushPinGemotery[0], "EndPoint": searchedFacilityObject.FeatureData, "Index": Number(rowIndex), "WidgetName": widgetName, "QueryURL": queryURL, "activityData": searchedFacilityObject.activityData };
                    this.showRoute(routeObject);
                } else {
                    // Else call query comment layer.
                    queryObject = { "FeatureData": searchedFacilityObject.FeatureData, "SolveRoute": null, "Index": Number(rowIndex), "QueryURL": queryURL, "WidgetName": widgetName, "Address": null, "IsRouteCreated": false };
                    topic.publish("showProgressIndicator");
                    this.queryCommentLayer(queryObject);
                }
            }
        },

        /**
        * Get the layer information after doing json call
        * @param {data} layer url
        * @return layer request
        * @memberOf widgets/activitySearch/activitySearch
        */
        _queryLayerForLayerInformation: function (QueryURL) {
            var layersRequest = esriRequest({
                url: QueryURL,
                content: { f: "json" },
                handleAs: "json"
            });
            return layersRequest;
        },

        /**
        * Get object id from the layer
        * @param {object} object of layer
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _getObjectId: function (response) {
            var objectId, j;
            // Looping through response for getting date field
            for (j = 0; j < response.fields.length; j++) {
                if (response.fields[j].type === "esriFieldTypeOID") {
                    objectId = response.fields[j].name;
                    break;
                }
            }
            return objectId;
        },

        /**
        * get the feature within buffer and sort it in ascending order.
        * @param {object} featureset Contains information of feature within buffer
        * @param {object} geometry Contains geometry service of route
        * @param {mapPoint} map point
        * @memberOf widgets/searchSettings/activitySearch
        */
        _executeQueryForEventForList: function (featureSetObject) {
            var isZoomToGeolocation;
            this.featureSetWithoutNullValue = this.removeNullValue(featureSetObject);
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
                            // If it is not comming from geolocation widget
                            if (!isPreLoaded) {
                                var routeObject = { "StartPoint": mapPoint, "EndPoint": this.featureSetWithoutNullValue, WidgetName: "routeForList" };
                                this._showRouteForList(routeObject);
                            } else {
                                // if it is comming from geolocation widget
                                topic.publish("hideProgressIndicator");
                                topic.publish("extentSetValue", true);
                                topic.publish("hideInfoWindow");
                                dojo.eventForListClicked = null;
                                this.removeRouteGraphichOfDirectionWidget();
                                dojo.searchFacilityIndex = -1;
                                this.createBuffer(mapPoint, "geolocation");
                                dojo.addressLocation = null;
                                dojo.sharedGeolocation = mapPoint;
                            }
                        }
                    });
                } else {
                    // when geolocation is not found
                    topic.publish("hideProgressIndicator");
                    alert(sharedNls.errorMessages.activitySerachGeolocationText);
                }
                // Call back when error is found after geolocation
                dijit.registry.byId("geoLocation").onGeolocationError = lang.hitch(this, function (error, isPreLoaded) {
                    if (isPreLoaded) {
                        topic.publish("extentSetValue", true);
                        topic.publish("hideInfoWindow");
                        this.removeHighlightedCircleGraphics();
                        this.removeLocatorPushPin();
                        this.removeBuffer();
                        this.carouselContainer.hideCarouselContainer();
                        this.carouselContainer._setLegendPositionDown();
                    }
                    // If it is not commign from geolocation
                    if (!isPreLoaded) {
                        this.removeLocatorPushPin();
                        topic.publish("hideInfoWindow");
                        topic.publish("hideProgressIndicator");
                    }
                });
            } else {
                // calling error message when geoloation widget is not configured.
                topic.publish("hideProgressIndicator");
                alert(sharedNls.errorMessages.geolocationWidgetNotFoundMessage);
            }
        }
    });
});
