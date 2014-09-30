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
    "esri/units",
    "../carouselContainer/carouselContainer",
    "widgets/locator/locator",
    "esri/request"

], function (declare, domConstruct, domStyle, domAttr, lang, on, domGeom, dom, array, domClass, query, string, Locator, Query, ScrollBar, Deferred, DeferredList, QueryTask, Geometry, Graphic, GraphicsLayer, PictureMarkerSymbol, Point, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic, urlUtils, units, CarouselContainer, LocatorTool, esriRequest) {
    // ========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,

        /**
        * create activity search panel
        * @memberOf widgets/searchSettings/activitySearch
        */
        _getLayerInformaiton: function () {
            var activityLayerRequestData, eventLayerRequestData, commentLayerRequestData;
            activityLayerRequestData = this._getLayerInformation(dojo.configData.ActivitySearchSettings[0].QueryURL);
            activityLayerRequestData.then(lang.hitch(this, function (response) {
                topic.publish("showProgressIndicator");
                this.objectIdForActivityLayer = this._getObjectId(response);
                topic.publish("hideProgressIndicator");
            }), function (error) {
                console.log("Error: ", error.message);
                topic.publish("hideProgressIndicator");
            });
            eventLayerRequestData = this._getLayerInformation(dojo.configData.EventSearchSettings[0].QueryURL);
            eventLayerRequestData.then(lang.hitch(this, function (response) {
                topic.publish("showProgressIndicator");
                this.objectIdForEventLayer = this._getObjectId(response);
                topic.publish("hideProgressIndicator");
            }), function (error) {
                console.log("Error: ", error.message);
                topic.publish("hideProgressIndicator");
            });
            commentLayerRequestData = this._getLayerInformation(dojo.configData.ActivitySearchSettings[0].CommentsSettings.QueryURL);
            commentLayerRequestData.then(lang.hitch(this, function (response) {
                topic.publish("showProgressIndicator");
                this.objectIdForCommentLayer = this._getObjectId(response);
                topic.publish("hideProgressIndicator");
            }), function (error) {
                console.log("Error: ", error.message);
                topic.publish("hideProgressIndicator");
            });
            dijit.registry.byId("geoLocation").onGeolocationComplete = lang.hitch(this, function (mapPoint, isPreLoaded) {
                if (mapPoint && isPreLoaded) {
                    this.createBuffer(mapPoint);
                }
            });
            dijit.registry.byId("geoLocation").onGeolocationError = lang.hitch(this, function (error, isPreLoaded) {
                if (isPreLoaded) {
                    this.removeGraphics();
                    this.removeBuffer();
                    this.removeLocatorPushPin();
                    this.carouselContainer.hideCarouselContainer();
                    this.carouselContainer._setLegendPositionDown();
                }
            });
        },

        /**
        * show Activity result tap
        * @memberOf widgets/searchSettings/activitySearch
        */
        _showActivityTab: function () {
            domStyle.set(this.divActivityContainer, "display", "block");
            domStyle.set(this.divSearchContent, "display", "none");
            domClass.replace(this.divActivityPanel, "esriCTActivityPanelSelected", "esriCTActivityPanel");
            domClass.replace(this.divActivityContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
            domClass.replace(this.divSearchPanel, "esriCTSearchPanelSelected", "esriCTDivSearchPanel");
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
            domStyle.set(this.divSearchContent, "display", "block");
            domClass.replace(this.divActivityPanel, "esriCTActivityPanel", "esriCTActivityPanelSelected");
            domClass.replace(this.divSearchPanel, "esriCTDivSearchPanel", "esriCTSearchPanelSelected");
            domClass.replace(this.divActivityContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
        },

        /**
        * Remove null value from the attribute.
        * @param {object} featureObject object for feature
        * @return {object} feature set after removing null value
        * @memberOf widgets/searchSettings/activitySearch
        */
        removeEmptyValue: function (featureObject) {
            var i, j;
            if (featureObject) {
                for (i = 0; i < featureObject.length; i++) {
                    for (j in featureObject[i].attributes) {
                        if (featureObject[i].attributes.hasOwnProperty(j)) {
                            if (!featureObject[i].attributes[j]) {
                                featureObject[i].attributes[j] = "N/A";
                            }
                        }
                    }
                }
            }
            return featureObject;
        },

        /**
        * create activity search panel
        * @memberOf widgets/searchSettings/activitySearch
        */
        _showActivitySearchContainer: function () {
            var activitySearchMainContainer, activitySearchContent = [], activityTickMark, activityImageDiv, i, activitySearchMainContent, k, activitySearchGoButton, SearchSettingsLayers;
            activitySearchMainContainer = domConstruct.create("div", { "class": "esriCTActivityMainContainer" }, this.divActivityContainer);
            activitySearchMainContent = domConstruct.create("div", { "class": "esriCTActivityTable" }, activitySearchMainContainer);
            for (k = 0; k < dojo.configData.ActivitySearchSettings.length; k++) {
                SearchSettingsLayers = dojo.configData.ActivitySearchSettings[k];
                for (i = 0; i < SearchSettingsLayers.ActivityList.length; i++) {
                    activitySearchContent[i] = domConstruct.create("div", { "class": "esriCTActivityRow", "index": i }, activitySearchMainContent);
                    activityImageDiv = domConstruct.create("div", { "class": "esriCTActivityImage" }, activitySearchContent[i]);
                    domConstruct.create("img", { "src": SearchSettingsLayers.ActivityList[i].Image }, activityImageDiv);
                    activityTickMark = domConstruct.create("div", { "class": "esriCTActivityTextArea" }, activitySearchContent[i]);
                    this.own(on(activitySearchContent[i], "click", lang.hitch(this, this._selectActivity, activityTickMark)));
                    if (SearchSettingsLayers.ActivityList[i].IsSelected) {
                        domClass.add(activityTickMark, "esriCTTickMark");
                    } else {
                        domClass.remove(activityTickMark, "esriCTTickMark");
                    }
                    domConstruct.create("div", { "class": "esriCTActivityText", "innerHTML": SearchSettingsLayers.ActivityList[i].Alias }, activityTickMark);
                }
            }
            activitySearchGoButton = domConstruct.create("div", { "class": "esriCTActivitySearchGoButton", "innerHTML": "GO" }, this.divActivityContainer);
            this.own(on(activitySearchGoButton, "click", lang.hitch(this, this._queryForSelectedActivityInList)));
        },

        /**
        * set the select and unselect in activity serach.
        * param {object} activityTickMark is domNode
        * @memberOf widgets/searchSettings/activitySearch
        */
        _selectActivity: function (activityTickMark) {
            if (domClass.contains(activityTickMark, "esriCTTickMark")) {
                domClass.remove(activityTickMark, "esriCTTickMark");
            } else {
                domClass.add(activityTickMark, "esriCTTickMark");
            }
        },

        /**
        * This funciton qurey for selected acitivity in list
        * @memberOf widgets/searchSettings/activitySearch
        */
        _queryForSelectedActivityInList: function () {
            this.carouselContainer.removeAllPod();
            this.carouselContainer.addPod(this.carouselPodData);
            this.locatorAddress = "";
            var activityArray = [], infoActivity, selectedRow, j, i, k, selectedFeatureText, SearchSettingsLayers;
            topic.publish("showProgressIndicator");
            domClass.replace(this.domNode, "esriCTHeaderSearch", "esriCTHeaderSearchSelected");
            for (k = 0; k < dojo.configData.ActivitySearchSettings.length; k++) {
                SearchSettingsLayers = dojo.configData.ActivitySearchSettings[k];
                infoActivity = SearchSettingsLayers.ActivityList;
                for (i = 0; i < infoActivity.length; i++) {
                    activityArray.push(infoActivity[i]);
                }
            }
            if (activityArray.length > 0) {
                selectedRow = query('.esriCTTickMark');
                if (selectedRow) {
                    for (j = 0; j < selectedRow.length; j++) {
                        selectedFeatureText = selectedRow[j].textContent;
                        for (i = 0; i < activityArray.length; i++) {
                            if (selectedFeatureText === activityArray[i].Alias) {
                                domAttr.set(selectedRow[j], "activity", activityArray[i].FieldName);
                                domAttr.set(selectedRow[j], "index", i);
                            }
                        }
                    }
                    this._queryForSelectedActivityInLayer(selectedRow);
                } else {
                    alert(sharedNls.errorMessages.activityNotSelected);
                    this._clearGraphicsAndCarousel();
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
            for (i = 0; i < selectedRow.length; i++) {
                activity = domAttr.get(selectedRow[i], "activity");
                if (i === selectedRow.length - 1) {
                    activityQueryString += activity + " = 'Yes'";
                } else {
                    activityQueryString += activity + " = 'Yes' AND ";
                }
            }
            if (activityQueryString === "") {
                alert(sharedNls.errorMessages.activityNotSelected);
                this._clearGraphicsAndCarousel();
                topic.publish("hideProgressIndicator");
                return;
            }
            array.forEach(dojo.configData.ActivitySearchSettings, lang.hitch(this, function (activitySearchSettings) {
                queryTask = new esri.tasks.QueryTask(activitySearchSettings.QueryURL);
                queryForActivity = new esri.tasks.Query();
                queryForActivity.where = activityQueryString;
                queryForActivity.outFields = ["*"];
                queryForActivity.returnGeometry = true;
                queryTask.execute(queryForActivity, lang.hitch(this, function (relatedRecords) {
                    if (relatedRecords && relatedRecords.features && relatedRecords.features.length > 0) {
                        this._executeQueryForFeatures(relatedRecords.features, activitySearchSettings.QueryURL, widgetName);
                    } else {
                        alert(sharedNls.errorMessages.invalidSearch);
                        this._clearGraphicsAndCarousel();
                        topic.publish("hideProgressIndicator");
                    }
                }));
            }));
        },

        /**
        * Function for clearing graphics and Carousel pod data.
        * @memberOf widgets/searchSettings/activitySearch
        */
        _clearGraphicsAndCarousel: function () {
            this.locatorAddress = "";
            this.removeGraphics();
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
            var featureSet, i, dist, isDistanceFound;
            this.featureSetWithoutNullValue = this.removeNullValue(featureSetObject);
            featureSet = [];
            isDistanceFound = false;
            if (Modernizr.geolocation) {
                dijit.registry.byId("geoLocation").showCurrentLocation(false);
                dijit.registry.byId("geoLocation").onGeolocationComplete = lang.hitch(this, function (mapPoint, isPreLoaded) {
                    if (mapPoint) {
                        this.clearLocatorGraphics();
                        if (!isPreLoaded) {
                            for (i = 0; i < this.featureSetWithoutNullValue.length; i++) {
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
                            if (isDistanceFound) {
                                featureSet.sort(function (a, b) {
                                    return parseFloat(a.distance) - parseFloat(b.distance);
                                });
                                this.highlightFeature(featureSet[0].geometry);
                                var routeObject = { "StartPoint": mapPoint, "EndPoint": featureSet, "Index": 0, "WidgetName": widgetName, "QueryURL": QueryURL };
                                this.showRoute(routeObject);
                            } else {
                                alert(sharedNls.errorMessages.invalidProjection);
                                this.executeWithoutGeolocation(this.featureSetWithoutNullValue, QueryURL, widgetName, 0);
                            }
                        } else {
                            this.createBuffer(mapPoint);
                        }
                    } else {
                        this.clearLocatorGraphics();
                        this.executeWithoutGeolocation(this.featureSetWithoutNullValue, QueryURL, widgetName, 0);
                    }
                });

                dijit.registry.byId("geoLocation").onGeolocationError = lang.hitch(this, function (error, isPreLoaded) {
                    if (isPreLoaded) {
                        this.removeGraphics();
                        this.clearLocatorGraphics();
                        this.removeBuffer();
                        this.carouselContainer.hideCarouselContainer();
                        this.carouselContainer._setLegendPositionDown();
                    }
                    if (!isPreLoaded) {
                        this.clearLocatorGraphics();
                        topic.publish("hideProgressIndicator");
                        this.executeWithoutGeolocation(this.featureSetWithoutNullValue, QueryURL, widgetName, 0);
                    }
                });
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
            if (widgetName.toLowerCase() === "event") {
                this.removeCommentPod();
                featureSetWithoutNullValue = this.removeEmptyValue(featureSetWithoutNullValue);
                this.removeGraphics();
                topic.publish("showProgressIndicator");
                this.carouselContainer.showCarouselContainer();
                this.carouselContainer.show();
                this.highlightFeature(featureSetWithoutNullValue[index].geometry);
                this.map.centerAt(featureSetWithoutNullValue[index].geometry);
                this._setSearchContent(featureSetWithoutNullValue, false, QueryURL, widgetName);
                resultcontent = { "value": index };
                facilityObject = { "Feature": featureSetWithoutNullValue, "SelectedItem": resultcontent, "QueryURL": QueryURL, "WidgetName": widgetName };
                this._setFacility(facilityObject);
                divDirectioncontent = query(".esriCTDivDirectioncontent")[0];
                if (divDirectioncontent) {
                    domConstruct.empty(divDirectioncontent);
                }
                locatorParamsForEventContainer = {
                    defaultAddress: dojo.configData.LocatorSettings.LocatorDefaultAddress,
                    preLoaded: false,
                    parentDomNode: divDirectioncontent,
                    map: this.map,
                    graphicsLayerId: "esriGraphicsLayerMapSettings",
                    locatorSettings: dojo.configData.LocatorSettings,
                    configSearchSettings: dojo.configData.SearchSettings
                };
                searchContenData = this.getKeyValue(dojo.configData.EventSearchSettings[0].SearchDisplayFields);
                divHeader = domConstruct.create("div", {}, divDirectioncontent);
                domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": sharedNls.titles.directionText + " " + featureSetWithoutNullValue[0].attributes[searchContenData] }, divHeader);
                locatorParamsForEventContainer = new LocatorTool(locatorParamsForEventContainer);
                eventMapPoint = this.map.getLayer(locatorParamsForEventContainer.graphicsLayerId);
                locatorParamsForEventContainer.candidateClicked = lang.hitch(this, function (graphic) {
                    if (graphic && graphic.attributes && graphic.attributes.address) {
                        this.locatorAddress = graphic.attributes.address;
                    }
                    this.removeGeolocationPushPin();
                    routeObject = { "StartPoint": eventMapPoint.graphics[0], "EndPoint": featureSetWithoutNullValue, "Index": 0, "WidgetName": widgetName, "QueryURL": QueryURL };
                    this.showRoute(routeObject);
                });
                this._setGallery(featureSetWithoutNullValue, resultcontent);
                topic.publish("hideProgressIndicator");
            } else {
                queryObject = { "FeatureData": featureSetWithoutNullValue, "SolveRoute": null, "Index": index, "QueryURL": QueryURL, "WidgetName": widgetName, "Address": null, "IsRouteCreated": false };
                topic.publish("showProgressIndicator");
                this.queryCommentLayer(queryObject);
            }
        },

        /**
        * Returns the pod enabled status from config file.
        * @param {string} Key name mensioned in config file
        * @memberOf widgets/searchSettings/activitySearch
        */
        getPodStatus: function (keyValue) {
            var isEnabled, i, key;
            isEnabled = false;
            for (i = 0; i < dojo.configData.BottomPanelInfoPodSettings.length; i++) {
                for (key in dojo.configData.BottomPanelInfoPodSettings[i]) {
                    if (dojo.configData.BottomPanelInfoPodSettings[i].hasOwnProperty(key)) {
                        if (key === keyValue) {
                            isEnabled = true;
                            break;
                        }
                    }
                }
            }
            return isEnabled;
        },

        /**
        * call all the function when click on search result data
        * @param {object} searchedFacilityObject contains route result, features in buffer area, search address,mapPoint, comment layer info
        * @memberOf widgets/searchResult/activitySearch
        */
        _clickOnSearchedFacility: function (searchedFacilityObject) {
            var pushPinGemotery, widgetName, routeObject, queryObject, highlightedDiv;
            highlightedDiv = query('.esriCTDivHighlightFacility')[0];
            domClass.replace(highlightedDiv, "esriCTSearchResultInfotext", "esriCTDivHighlightFacility");
            domClass.replace(searchedFacilityObject.SelectedRow, "esriCTDivHighlightFacility", "esriCTSearchResultInfotext");
            if (searchedFacilityObject.WidgetName.toLowerCase() === "activitysearch") {
                this.removeBuffer();
            }
            widgetName = "SearchedFacility";
            topic.publish("showProgressIndicator");
            this.removeGraphics();
            if (this.map.getLayer("geoLocationGraphicsLayer").graphics.length > 0) {
                pushPinGemotery = this.map.getLayer("geoLocationGraphicsLayer").graphics;
            } else {
                pushPinGemotery = this.map.getLayer("esriGraphicsLayerMapSettings").graphics;
            }
            if (pushPinGemotery[0]) {
                routeObject = { "StartPoint": pushPinGemotery[0], "EndPoint": searchedFacilityObject.FeatureData, "Index": searchedFacilityObject.SelectedRow.value, "WidgetName": widgetName, "QueryURL": searchedFacilityObject.QueryLayer };
                this.showRoute(routeObject);
            } else {
                queryObject = { "FeatureData": searchedFacilityObject.FeatureData, "SolveRoute": null, "Index": searchedFacilityObject.SelectedRow.value, "QueryURL": searchedFacilityObject.QueryLayer, "WidgetName": widgetName, "Address": null, "IsRouteCreated": false };
                topic.publish("showProgressIndicator");
                this.queryCommentLayer(queryObject);
            }
        },

        /**
        * Remove comment pod from container for event layer
        * @memberOf widgets/searchResult/activitySearch
        */
        removeCommentPod: function () {
            var selectedPodName, eventPodData = [], i;
            this.carouselContainer.removeAllPod();
            for (i = 0; i < this.carouselPodData.length; i++) {
                selectedPodName = domAttr.get(this.carouselPodData[i], "CarouselPodName");
                if (selectedPodName !== "CommentsPod") {
                    eventPodData.push(this.carouselPodData[i]);
                }
            }
            this.carouselContainer.addPod(eventPodData);
        },
        /**
        * set the content in (Comments) carousel pod when error found
        * @memberOf widgets/searchResult/activitySearch
        */
        setCommentForError: function () {
            var isPodEnabled = this.getPodStatus("CommentsPod"), divHeaderContent, divCommentRow;
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
        * Get the layer information after doing json call
        * @param {data} layer url
        * @return layer request
        * @memberOf widgets/activitySearch/activitySearch
        */
        _getLayerInformation: function (QueryURL) {
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
            for (j = 0; j < response.fields.length; j++) {
                if (response.fields[j].type === "esriFieldTypeOID") {
                    objectId = response.fields[j].name;
                    break;
                }
            }
            return objectId;
        }
    });
});
