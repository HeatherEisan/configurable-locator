/*global define,dojo,dojoConfig:true,alert,esri,console,Modernizr,dijit */
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
    "esri/geometry/Extent",
    "dijit/_WidgetBase",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/topic",
    "dojo/date",
    "dojo/date/locale",
    "widgets/locator/locator",
    "dijit/a11yclick",
    "widgets/commonHelper/commonHelper",
    "widgets/commonHelper/locatorHelper",
    "widgets/commonHelper/carouselContainerHelper",
    "widgets/commonHelper/directionWidgetHelper",
    "widgets/commonHelper/infoWindowCommentPod",
    "widgets/geoLocation/geoLocation",
    "esri/request",
    "dojo/NodeList-manipulate"

], function (declare, domConstruct, domStyle, domAttr, lang, on, domGeom, dom, array, domClass, query, string, Locator, Query, Deferred, DeferredList, QueryTask, Geometry, Graphic, Point, GeometryExtent, _WidgetBase, sharedNls, topic, date, locale, LocatorTool, a11yclick, CommonHelper, LocatorHelper, CarouselContainerHelper, DirectionWidgetHelper, InfoWindowCommentPod, GeoLocation, esriRequest) {
    //========================================================================================================================//

    return declare([_WidgetBase, CommonHelper, LocatorHelper, CarouselContainerHelper, DirectionWidgetHelper, InfoWindowCommentPod], {
        sharedNls: sharedNls,                                   // Variable for shared NLS
        featureArrayInfoWindow: null,                           // Variable store the feature in infowindow
        rankValue: null,                                        // Variable for the rank value in post commnet tab
        isDirectionCalculated: false,                           // Variable for Direction calculate
        infoWindowFeatureData: [],                              // array to store for feature data of infoWindow
        objectIdForCommentLayer: "",                            // Variable to store the objectId for comment layer
        objectIdForActivityLayer: "",                           // Variable to store the objectId for activity layer
        carouselPodData: [],                                    // Array to store carouselPod data
        myListStore: [],                                        // Array to store myList data
        addToListFeatures: [],                                  // Array to store feature added to mylist from info window or infow pod
        /**
        * display info window widget
        *
        * @class
        * @name widgets/locator/locator
        */
        postCreate: function () {
            // appending ActivitySearchSettings and EventSearchSettings into SearchSettings
            dojo.configData.SearchSettings = [];
            this._addSearchSettings(dojo.configData.ActivitySearchSettings);
            this._addSearchSettings(dojo.configData.EventSearchSettings);
            // calling function for create direction widget.
            this._createDirectionWidget();
            // calling function for create carousel container
            this._createCarouselContainer();
            // calling function for craete carousel pod
            this.createCarouselPod();
            // calling function for get the layer information.
            this.getLayerInformaition();
            // Calling function if geolocation is clicked from widget.
            this._geolocationClicked();
            /** Subscribe functions for calling them from other widget
            *  subscribing to create infoWindow content
            */
            topic.publish("getCarouselContainer", this.carouselContainer, this.carouselPodData);
            this.callSubscribeFunctions();
            topic.subscribe("createInfoWindowContent", lang.hitch(this, function (infoWindowParameter) {
                this._createInfoWindowContent(infoWindowParameter);
            }));
        },

        /**
        * subscribed function call
        * @memberOf widgets/commonHelper/InfoWindowHelper
        */
        callSubscribeFunctions: function () {
            topic.subscribe("setMapTipPosition", this._onSetMapTipPosition);
            // get widgetName from other widget
            topic.subscribe("getInfowWindowWidgetName", lang.hitch(this, function (LayerTitle, LayerId) {
                var widgetName;
                widgetName = this.getInfowWindowWidgetName(LayerTitle, LayerId);
                topic.publish("showWidgetName", widgetName);
            }));
            // subscribing fuction for infoWindow direction tab
            topic.subscribe("showDirection", lang.hitch(this, function (directionObject) {
                this._infoWindowDirectionTab(directionObject);
            }));
            // subscribing fuction for hide carosuel pod
            topic.subscribe("hideCarouselContainer", lang.hitch(this, function () {
                this.hideCarouselContainer();
            }));
            // subscribing fuction for setting myListStoreData
            topic.subscribe("getMyListStoreData", lang.hitch(this, function (value) {
                this.myListStore = value;
            }));
            // subscribing fuction setting id for layers
            topic.subscribe("setLayerId", lang.hitch(this, function (geoLocationGraphicsLayerID, locatorGraphicsLayerID) {
                this.geoLocationGraphicsLayerID = geoLocationGraphicsLayerID;
                this.locatorGraphicsLayerID = locatorGraphicsLayerID;
            }));
            // subscribing fuction for route Object
            topic.subscribe("routeObject", lang.hitch(this, function (value) {
                this.routeObject = value;
            }));
            // subscribing to store value for extent from other widget.
            topic.subscribe("extentSetValue", lang.hitch(this, function (value) {
                this.isExtentSet = value;
            }));
            topic.subscribe("getCarouselContainerData", lang.hitch(this, function () {
                topic.publish("getCarouselContainer", this.carouselContainer, this.carouselPodData);
            }));
            // subscribing to store value of sortedList
            topic.subscribe("sortMyListData", lang.hitch(this, function (value) {
                this.sortedList = value;
            }));
            // subscribing to remove Highlighted CircleGraphics
            topic.subscribe("removeHighlightedCircleGraphics", lang.hitch(this, function () {
                this.removeHighlightedCircleGraphics();
            }));
            // subscribing to remove Buffer
            topic.subscribe("removeBuffer", lang.hitch(this, function () {
                this.removeBuffer();
            }));
            // subscribing to remove Geolocation PushPin
            topic.subscribe("removeGeolocationPushPin", lang.hitch(this, function () {
                this.removeGeolocationPushPin();
            }));
            // subscribing to remove Geolocation PushPin
            topic.subscribe("routeForListFunction", lang.hitch(this, function (routeObject) {
                this._showRouteForList(routeObject);
            }));
            // subscribing to remove remove Locator PushPin
            topic.subscribe("removeLocatorPushPin", lang.hitch(this, function () {
                this.removeLocatorPushPin();
            }));
            // subscribing to remove Route Graphich Of Direction Widget
            topic.subscribe("removeRouteGraphichOfDirectionWidget", lang.hitch(this, function () {
                this.removeRouteGraphichOfDirectionWidget();
            }));
            // subscribing to _clear Graphics And Carousel
            topic.subscribe("clearGraphicsAndCarousel", lang.hitch(this, function () {
                this.clearGraphicsAndCarousel();
            }));
            // subscribing to set Zoom And CenterAt
            topic.subscribe("setZoomAndCenterAt", lang.hitch(this, function (value) {
                this.setZoomAndCenterAt(value);
            }));
            // subscribing to createing Buffer
            topic.subscribe("createBuffer", lang.hitch(this, function (value, widgetName) {
                this.createBuffer(value, widgetName);
            }));
            // subscribing to createing Buffer
            topic.subscribe("executeQueryForFeatures", lang.hitch(this, function (records, queryURL, widgetName) {
                this._executeQueryForFeatures(records, queryURL, widgetName);
            }));
            // subscribing to createing Buffer
            topic.subscribe("addtoMyListFunction", lang.hitch(this, function (eventDataObject, widgetName) {
                this.addtoMyList(eventDataObject, widgetName);
            }));
            // subscribing to store feature set searched from event search in eventPlannerHelper.js file.
            topic.subscribe("setEventFeatrueSet", lang.hitch(this, function (value) {
                this.featureSet = value;
            }));
            topic.subscribe("addToListFeaturesUpdate", lang.hitch(this, function (value) {
                this.addToListFeatures = value;
            }));

            // subscribing calling add to list from info window click
            topic.subscribe("addToListFromInfoWindow", lang.hitch(this, function (addToListObject) {
                this.clickOnAddToList(addToListObject);
            }));

            // subscribing function _queryLayer calling from another widget
            topic.subscribe("queryLayer", lang.hitch(this, function (geometry, mapPoint, widget) {
                this._queryLayer(geometry, mapPoint, widget);
            }));

            topic.subscribe("addToMyList", lang.hitch(this, function (featureArray, widgetName, layerId, layerTitle) {
                var isExtentSet = true, infoWindowClick = true, addToListEventFeature = [], addToListActivityFeature = [], i, eventDataObject, objectIDField, startDateField, splitedField, startDateFeild, settingsName, settingsIndex, eventSettingsObject, j;
                topic.publish("extentSetValue", isExtentSet);
                array.forEach(dojo.configData.EventSearchSettings, lang.hitch(this, function (settings, eventSettingIndex) {
                    if (settings.QueryLayerId === layerId && settings.Title === layerTitle) {
                        objectIDField = settings.ObjectID;
                        splitedField = settings.SearchDisplaySubFields.split(',');
                        startDateFeild = splitedField[0];
                        startDateField = this.getKeyValue(startDateFeild);
                        settingsName = "eventsettings";
                        settingsIndex = eventSettingIndex;
                    }
                }));
                array.forEach(dojo.configData.ActivitySearchSettings, lang.hitch(this, function (settings, activitySettingIndex) {
                    if (settings.QueryLayerId === layerId && settings.Title === layerTitle) {
                        objectIDField = settings.ObjectID;
                        startDateField = "";
                        settingsName = "activitysettings";
                        settingsIndex = activitySettingIndex;
                    }
                }));
                this.featureSetOfInfoWindow = featureArray;
                //variable is store the infowindow geometry.
                dojo.eventInfoWindowData = featureArray.geometry;
                eventSettingsObject = { "settingsName": settingsName, "settingsIndex": settingsIndex, "value": this.featureSetOfInfoWindow };
                this.addToListFeatures.push(eventSettingsObject);
                topic.publish("addToListFeaturesData", this.addToListFeatures);
                //check if widgetName if "infoevent" or not.
                if (this.addToListFeatures.length > 0) {
                    for (i = 0; i < this.addToListFeatures.length; i++) {
                        if (this.addToListFeatures[i].settingsName === "eventsettings") {
                            addToListEventFeature.push(this.addToListFeatures[i].value.attributes[objectIDField]);
                            dojo.eventInfoWindowAttribute = addToListEventFeature.join(",");
                        }
                    }
                }
                //check if widgetName if "infoactivity" or not.
                if (this.addToListFeatures.length > 0) {
                    for (j = 0; j < this.addToListFeatures.length; j++) {
                        if (this.addToListFeatures[j].settingsName === "activitysettings") {
                            addToListActivityFeature.push(this.addToListFeatures[j].value.attributes[objectIDField]);
                            dojo.eventInfoWindowIdActivity = addToListActivityFeature.join(",");
                        }
                    }
                }
                eventDataObject = { "eventDetails": featureArray.attributes, "featureSet": this.featureSetOfInfoWindow, "infoWindowClick": infoWindowClick, "layerId": layerId, "layerTitle": layerTitle, "ObjectIDField": objectIDField, "StartDateField": startDateField };
                this.addtoMyList(eventDataObject, widgetName);
            }));
        },

        /**
        * address search setting
        * @memberOf widgets/commonHelper/InfoWindowHelper
        */
        _addSearchSettings: function (layerSetting) {
            var i;
            //loop for the layer and push the layer in dojo.configData.SearchSettings
            for (i = 0; i < layerSetting.length; i++) {
                dojo.configData.SearchSettings.push(layerSetting[i]);
            }
        },
        /**
        * function for getting comment layer information like object id.
        * @memberOf widgets/commonHelper/InfoWindowHelper
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
                    this.objectIdForCommentLayer = this.getObjectId(response.fields);
                    topic.publish("hideProgressIndicator");
                }), function (error) {
                    console.log("Error: ", error.message);
                    topic.publish("hideProgressIndicator");
                });
            }
        },

        /**
        * Get the layer information after doing json call
        * @param {data} layer url
        * @return {object} layer request
        * @memberOf widgets/commonHelper/InfoWindowHelper
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
        * fire when geolocation widget is clicked, show buffer and route and direction
        * @memberOf widgets/commonHelper/InfoWindowHelper
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
                        if (this.carouselContainer) {
                            this.carouselContainer.hideCarouselContainer();
                            this.carouselContainer._setLegendPositionDown();
                        }
                    }
                });
            }
        },

        /**
        * positioning the infoWindow on extent change
        * @param {object} selectedPoint contains feature
        * @param {object} map
        * @param {object} infoWindow
        * @memberOf widgets/commonHelper/infoWindowHelper
        */
        _onSetMapTipPosition: function (selectedPoint, map, infoWindow) {
            // check if faeture is contain
            if (selectedPoint) {
                var screenPoint = map.toScreen(selectedPoint);
                screenPoint.y = map.height - screenPoint.y;
                infoWindow.setLocation(screenPoint);
            }
        },

        /**
        *set the zoom level an screen point and infowindow
        * @param {object} infoWindowZoomLevelObject contain featurePoint,attribute, layerId, layerTitle,featureSet
        * @memberOf widgets/commonHelper/infoWindowHelper
        */
        _setInfoWindowZoomLevel: function (infoWindowZoomLevelObject) {
            var extentChanged, screenPoint, zoomDeferred;
            dojo.selectedMapPoint = infoWindowZoomLevelObject.Mappoint;
            //check the zoomlevel of map and set infowindow zoom level according to it
            if (this.map.getLevel() !== dojo.configData.ZoomLevel && infoWindowZoomLevelObject.InfoWindowParameter) {
                zoomDeferred = this.map.setLevel(dojo.configData.ZoomLevel);
                zoomDeferred.then(lang.hitch(this, function () {
                    // check if "$extentChanged=" is present in url
                    if (window.location.href.toString().split("$extentChanged=").length > 1) {
                        if (this.isExtentSet) {
                            extentChanged = this.map.setExtent(this.calculateCustomMapExtent(infoWindowZoomLevelObject.mapPoint));
                        } else {
                            topic.publish("hideProgressIndicator");
                            screenPoint = this.map.toScreen(dojo.selectedMapPoint);
                            screenPoint.y = this.map.height - screenPoint.y;
                            topic.publish("setInfoWindowOnMap", infoWindowZoomLevelObject.MobileTitle, screenPoint, infoWindowZoomLevelObject.InfoPopupWidth, infoWindowZoomLevelObject.InfoPopupHeight);
                        }
                    } else {
                        extentChanged = this.map.setExtent(this.calculateCustomMapExtent(dojo.selectedMapPoint));
                    }
                    if (extentChanged) {
                        extentChanged.then(lang.hitch(this, function () {
                            topic.publish("hideProgressIndicator");
                            screenPoint = this.map.toScreen(dojo.selectedMapPoint);
                            screenPoint.y = this.map.height - screenPoint.y;
                            topic.publish("setInfoWindowOnMap", infoWindowZoomLevelObject.MobileTitle, screenPoint, infoWindowZoomLevelObject.InfoPopupWidth, infoWindowZoomLevelObject.InfoPopupHeight);
                        }));
                    }
                }));
            } else {
                // check if "$extentChanged=" is present in url
                if (window.location.href.toString().split("$extentChanged=").length > 1) {
                    if (this.isExtentSet) {
                        extentChanged = this.map.setExtent(this.calculateCustomMapExtent(dojo.selectedMapPoint));
                    } else {
                        topic.publish("hideProgressIndicator");
                        screenPoint = this.map.toScreen(dojo.selectedMapPoint);
                        screenPoint.y = this.map.height - screenPoint.y;
                        topic.publish("setInfoWindowOnMap", infoWindowZoomLevelObject.MobileTitle, screenPoint, infoWindowZoomLevelObject.InfoPopupWidth, infoWindowZoomLevelObject.InfoPopupHeight);
                    }
                } else {
                    extentChanged = this.map.setExtent(this.calculateCustomMapExtent(dojo.selectedMapPoint));
                }
                if (extentChanged) {
                    extentChanged.then(lang.hitch(this, function () {
                        topic.publish("hideProgressIndicator");
                        screenPoint = this.map.toScreen(dojo.selectedMapPoint);
                        screenPoint.y = this.map.height - screenPoint.y;
                        topic.publish("setInfoWindowOnMap", infoWindowZoomLevelObject.MobileTitle, screenPoint, infoWindowZoomLevelObject.InfoPopupWidth, infoWindowZoomLevelObject.InfoPopupHeight);
                    }));
                }
            }
        },

        /**
        * Create info window on map and populate the result
        * @param {object} infoWindowParameter  contains the mapPoint,attribute,layerId, featureArray, featureCount
        * @memberOf widgets/commonHelper/infoWindowHelper
        */
        _createInfoWindowContent: function (infoWindowParameter) {
            var infoPopupHeight, queryURL, serchSetting, infoWindowZoomLevelObject, galaryObject, featureSet = [], index, infoPopupWidth, infoTitle, widgetName, commentObject, directionObject;
            featureSet.push(infoWindowParameter.featureSet);
            this.infoWindowFeatureData = infoWindowParameter.featureArray;
            index = this.getInfowWindowIndex(infoWindowParameter.layerTitle, infoWindowParameter.layerId);
            queryURL = this.getQueryUrl(infoWindowParameter.layerId, infoWindowParameter.layerTitle);
            serchSetting = this.getSearchSetting(queryURL);
            widgetName = this.getInfowWindowWidgetName(infoWindowParameter.layerTitle, infoWindowParameter.layerId);
            topic.publish("getInfoWidgetName", widgetName);
            // To know the click of feature in Event plannner.
            this.getMapPoint(infoWindowParameter.mapPoint);
            this.highlightFeature(infoWindowParameter.mapPoint);
            infoPopupHeight = dojo.configData.InfoPopupHeight;
            infoPopupWidth = dojo.configData.InfoPopupWidth;
            this._infoWindowInformationTab(infoWindowParameter.attribute, index, widgetName, featureSet, Number(infoWindowParameter.IndexNumber), infoWindowParameter.featureArray.length, infoWindowParameter.widgetName, infoWindowParameter.layerId, infoWindowParameter.layerTitle);
            galaryObject = { "attribute": infoWindowParameter.attribute, "widgetName": widgetName };
            topic.publish("galaryObject", galaryObject);
            this._infoWindowGalleryTab(galaryObject);
            commentObject = { "attribute": infoWindowParameter.attribute, "widgetName": widgetName, "index": index };
            topic.publish("commentObject", commentObject);
            this._infoWindowCommentTab(commentObject);
            /*direction tab*/
            directionObject = { "attribute": infoWindowParameter.attribute, "widgetName": widgetName, "featureSet": infoWindowParameter.featureSet, "QueryURL": queryURL };
            topic.publish("directionObject", directionObject);
            //Check if InfowindowContent available if not then showing infp title as mobile title.
            //In WebMap case infowindow contents will be not available
            if (dojo.configData.InfoWindowSettings[index].MobileCalloutField) {
                infoTitle = string.substitute(dojo.configData.InfoWindowSettings[index].MobileCalloutField, infoWindowParameter.attribute);
            } else {
                infoTitle = string.substitute(serchSetting.SearchDisplayFields, infoWindowParameter.attribute);
            }
            infoWindowZoomLevelObject = { "Mappoint": infoWindowParameter.mapPoint, "MobileTitle": infoTitle, "InfoPopupWidth": infoPopupWidth, "InfoPopupHeight": infoPopupHeight, "InfoWindowParameter": infoWindowParameter.featureCount };
            dojo.selectedMapPoint = infoWindowParameter.mapPoint;
            this._setInfoWindowZoomLevel(infoWindowZoomLevelObject);
            topic.publish("hideProgressIndicator");
        },

        /**
        * infoWindow Direction tab
        * @param {object} directionObject contains attributes, featureSet, QueryURL and widgetName
        * @memberOf widgets/commonHelper/infoWindowHelper
        */
        _infoWindowDirectionTab: function (directionObject) {
            var directionMainContainer, serchSetting, locatorInfoWindowObject, locatorInfoWindowParams, searchContentData, divHeader, infoWindowMapPoint, routeObject, mapLogoPostionDown, imgCustomLogo, pushPinGemotery;
            //check direction container is present
            if (dojo.byId("getDirContainer")) {
                domConstruct.empty(dojo.byId("getDirContainer"));
            }
            directionMainContainer = domConstruct.create("div", { "class": "esriCTDirectionMainContainer" }, dojo.byId("getDirContainer"));
            serchSetting = this.getSearchSetting(directionObject.QueryURL);
            searchContentData = string.substitute(serchSetting.SearchDisplayFields, directionObject.attribute);
            divHeader = domConstruct.create("div", {}, directionMainContainer);
            domConstruct.create("div", { "class": "esriCTSpanHeaderInfoWindow", "innerHTML": sharedNls.titles.directionText + " " + searchContentData }, divHeader);
            //check if it is geolocation graphic or address search graphic
            if (this.map.getLayer(this.geoLocationGraphicsLayerID) && this.map.getLayer(this.geoLocationGraphicsLayerID).graphics.length > 0) {
                pushPinGemotery = this.map.getLayer(this.geoLocationGraphicsLayerID).graphics;
            } else if (this.map.getLayer(this.locatorGraphicsLayerID).graphics.length > 0) {
                pushPinGemotery = this.map.getLayer(this.locatorGraphicsLayerID).graphics;
            } else {
                pushPinGemotery = [this.selectedGraphicInfowindow];
            }
            if (pushPinGemotery && pushPinGemotery[0]) {
                // For hiding carousel container when direction is calculated.
                if (this.carouselContainer) {
                    this.carouselContainer.hideCarouselContainer();
                }
                dojo.infowindowDirection = directionObject.featureSet.geometry.x.toString() + "," + directionObject.featureSet.geometry.y.toString();
                dojo.infowindowDirection = dojo.infowindowDirection + "," + pushPinGemotery[0].geometry.x.toString() + "," + pushPinGemotery[0].geometry.y.toString();
                routeObject = { "StartPoint": pushPinGemotery[0], "EndPoint": [directionObject.featureSet], "Index": 0, "WidgetName": directionObject.widgetName, "QueryURL": directionObject.QueryURL };
                this.showRoute(routeObject);
            } else if (this.selectedGraphic) {
                if (this.carouselContainer) {
                    this.carouselContainer.hideCarouselContainer();
                }
                routeObject = { "StartPoint": this.selectedGraphic, "EndPoint": [directionObject.featureSet], "Index": 0, "WidgetName": directionObject.widgetName, "QueryURL": directionObject.QueryURL };
                this.showRoute(routeObject);
                dojo.infowindowDirection = directionObject.featureSet.geometry.x.toString() + "," + directionObject.featureSet.geometry.y.toString();
                dojo.infowindowDirection = dojo.infowindowDirection + "," + this.selectedGraphic.geometry.x.toString() + "," + this.selectedGraphic.geometry.y.toString();
            } else if (this.selectedEventGraphic) {
                if (this.carouselContainer) {
                    this.carouselContainer.hideCarouselContainer();
                }
                routeObject = { "StartPoint": this.selectedEventGraphic, "EndPoint": [directionObject.featureSet], "Index": 0, "WidgetName": directionObject.widgetName, "QueryURL": directionObject.QueryURL };
                this.showRoute(routeObject);
                dojo.infowindowDirection = directionObject.featureSet.geometry.x.toString() + "," + directionObject.featureSet.geometry.y.toString();
                dojo.infowindowDirection = dojo.infowindowDirection + "," + this.selectedEventGraphic.geometry.x.toString() + "," + this.selectedEventGraphic.geometry.y.toString();
            }
            //locatorInfoWindowParams is the object of locator.js created for unified search
            locatorInfoWindowParams = {
                defaultAddress: dojo.configData.LocatorSettings.LocatorDefaultAddress,
                preLoaded: false,
                parentDomNode: directionMainContainer,
                map: this.map,
                graphicsLayerId: this.locatorGraphicsLayerID,
                locatorSettings: dojo.configData.LocatorSettings,
                configSearchSettings: dojo.configData.SearchSettings
            };
            infoWindowMapPoint = this.map.getLayer(locatorInfoWindowParams.graphicsLayerId);
            locatorInfoWindowObject = new LocatorTool(locatorInfoWindowParams);
            locatorInfoWindowObject.candidateClicked = lang.hitch(this, function (graphic) {
                //set variable for infowindow direction in case of share
                dojo.infowindowDirection = directionObject.featureSet.geometry.x.toString() + "," + directionObject.featureSet.geometry.y.toString();
                if (locatorInfoWindowObject && locatorInfoWindowObject.selectedGraphic) {
                    dojo.infowindowDirection = dojo.infowindowDirection + "," + locatorInfoWindowObject.selectedGraphic.geometry.x.toString() + "," + locatorInfoWindowObject.selectedGraphic.geometry.y.toString();
                }
                if (graphic && graphic.attributes && graphic.attributes.address) {
                    this.locatorAddress = graphic.attributes.address;
                }
                //check if the layer information is in the graphic
                if (graphic && graphic.layer) {
                    this.selectedLayerTitle = graphic.layer.SearchDisplayTitle;
                }
                dojo.eventInfoWindowData = null;
                dojo.sharedGeolocation = null;
                dojo.infoRoutePoint = null;
                topic.publish("showProgressIndicator");
                this.removeGeolocationPushPin();
                if (this.carouselContainer) {
                    this.carouselContainer.hideCarouselContainer();
                }
                if (dojo.configData.CustomLogoUrl) {
                    // if ShowLegend is 'True' then set Legend Poition Down and place the customLogo image at the bottom of screen
                    if (dojo.configData.ShowLegend) {
                        imgCustomLogo = query('.esriCTCustomMapLogo')[0];
                        if (this.carouselContainer) {
                            this.carouselContainer._setLegendPositionDown();
                        }
                        domClass.replace(imgCustomLogo, "esriCTCustomMapLogoBottom", "esriCTCustomMapLogoPostionChange");
                    } else {
                        mapLogoPostionDown = query('.esriControlsBR')[0];
                        imgCustomLogo = query('.esriCTCustomMapLogo')[0];
                        // if ShowLegend is 'False' then remove all classess which holds esriLogo and customLogo position above the bottom of screen
                        if (query('.esriCTDivMapPositionTop')[0]) {
                            domClass.remove(mapLogoPostionDown, "esriCTDivMapPositionTop");
                        }
                        if (query('.esriCTDivMapPositionUp')[0]) {
                            domClass.remove(mapLogoPostionDown, "esriCTDivMapPositionUp");
                        }
                        if (query('.esriCTCustomMapLogoPostion')[0]) {
                            domClass.remove(imgCustomLogo, "esriCTCustomMapLogoPostion");
                        }
                    }
                }
                //if layer informnation contains in graphic
                if (graphic && graphic.layer) {
                    if (this.carouselContainer) {
                        this.carouselContainer.hideCarouselContainer();
                    }
                    routeObject = { "StartPoint": graphic, "EndPoint": [directionObject.featureSet], "Index": 0, "WidgetName": directionObject.widgetName, "QueryURL": directionObject.QueryURL };
                    this.showRoute(routeObject);
                    this.selectedGraphicInfowindow = graphic;
                    if (locatorInfoWindowObject && locatorInfoWindowObject.selectedGraphic === null) {
                        topic.publish("extentSetValue", false);
                        dojo.selectedMapPoint = directionObject.featureSet.geometry;
                        dojo.infowindowDirection = dojo.infowindowDirection + "," + graphic.geometry.x.toString() + "," + graphic.geometry.y.toString();
                    }
                    //if address is locate then pass startPoint and endPoint to showroute function
                } else {
                    if (this.carouselContainer) {
                        this.carouselContainer.hideCarouselContainer();
                    }
                    routeObject = { "StartPoint": infoWindowMapPoint.graphics[0], "EndPoint": [directionObject.featureSet], "Index": 0, "WidgetName": directionObject.widgetName, "QueryURL": directionObject.QueryURL };
                    this.showRoute(routeObject);
                }
            });
            setTimeout(lang.hitch(this, function () {
                if (window.location.href.toString().split("$infowindowDirection=").length > 1 && !this.isDirectionCalculated) {
                    this.isDirectionCalculated = true;
                    var mapPoint = new Point(window.location.href.toString().split("$infowindowDirection=")[1].split("$")[0].split(",")[2], window.location.href.toString().split("$infowindowDirection=")[1].split("$")[0].split(",")[3], this.map.spatialReference);
                    dojo.infowindowDirection = window.location.href.toString().split("$infowindowDirection=")[1].split("$")[0];
                    locatorInfoWindowObject._locateAddressOnMap(mapPoint, true);
                    routeObject = { "StartPoint": infoWindowMapPoint.graphics[0], "EndPoint": [directionObject.featureSet], "Index": 0, "WidgetName": directionObject.widgetName, "QueryURL": directionObject.QueryURL };
                    this.showRoute(routeObject);
                }
            }), 1000);
        },

        /**
        * Information Tab for InfoWindow
        * @param {field} attributes is the field of feature
        * @param {number} InfoIndex is the faeture layer id
        * @param {string} widgetName is name of widget
        * @param {object} featureSet Contain set of features
        * @param {number} index
        * @param {number} featureCount Contain no.of feature
        * @param {string} featureClickName Contain name of feature
        * @param {number} layerId Contain layer id
        * @param {string} layerTitle Contain layer Title
        * @memberOf widgets/commonHelper/InfoWindowHelper
        */
        _infoWindowInformationTab: function (attributes, infoIndex, widgetName, featureSet, index, featureCount, featureClickName, layerId, layerTitle) {
            var divInfoRow, divInformationContent, queryURLData, serchSetting, divHeader, contentDiv, divFacilityContent, divPaginationPrevNext, divPaginationContainer, facilityDiv, addToListObject,
                divAccessfee, SearchSettingsLayers, activityImageDiv, i, j, key, k, value;
            //if information tap container is present
            if (dojo.byId("informationTabContainer")) {
                domConstruct.empty(dojo.byId("informationTabContainer"));
            }
            if (featureClickName === "listclick") {
                featureCount = 1;
            }
            divInfoRow = domConstruct.create("div", { "class": "esriCTInfoWindoContainerOuter" }, dojo.byId("informationTabContainer"));
            divInformationContent = domConstruct.create("div", { "class": "esriCTInfoWindoContainer" }, divInfoRow);
            divHeader = domConstruct.create("div", { "class": "esriCTDivHeadercontainerInfo" }, divInformationContent);
            domConstruct.create("div", { "class": "esriCTheadText", "innerHTML": sharedNls.titles.facilityInfo }, divHeader);
            divPaginationContainer = domConstruct.create("div", { "class": "esriCTPaginationContainer" }, divHeader);
            this.divPaginationCount = domConstruct.create("div", { "class": "esriCTTPaginationList", "innerHTML": index + "/" + featureCount }, divPaginationContainer);
            divPaginationPrevNext = domConstruct.create("div", { "class": "esriCTTPaginationPrevNext" }, divPaginationContainer);
            this.previousButton = domConstruct.create("div", { "class": "esriCTTPaginationPrev" }, divPaginationPrevNext);
            this.nextButton = domConstruct.create("div", { "class": "esriCTTPaginationNext" }, divPaginationPrevNext);
            contentDiv = domConstruct.create("div", { "class": "esriCTDivClear" }, divInformationContent);
            divFacilityContent = domConstruct.create("div", { "class": "esriCTUtilityImgContainer" }, divInformationContent);
            if (featureCount === 1) {
                domClass.replace(divPaginationContainer, "esriCTPaginationDisContainer", "esriCTPaginationContainer");
                domClass.replace(this.previousButton, "esriCTTPaginationDisPrev", "esriCTTPaginationPrev");
                domClass.replace(this.nextButton, "esriCTTPaginationDisNext", "esriCTTPaginationNext");
            } else if (index === 1) {
                domClass.replace(this.previousButton, "esriCTTPaginationDisPrev", "esriCTTPaginationPrev");
            } else if (featureCount === index) {
                domClass.replace(this.nextButton, "esriCTTPaginationDisNext", "esriCTTPaginationNext");
            }
            this.own(on(this.previousButton, a11yclick, lang.hitch(this, this.previousButtonClick, featureCount)));
            this.own(on(this.nextButton, a11yclick, lang.hitch(this, this.nextButtonClick, featureCount)));
            queryURLData = this.getQueryUrl(layerId, layerTitle);
            serchSetting = this.getSearchSetting(queryURLData);
            //looping for attributes of feature and if it is null the show N/A
            for (i in attributes) {
                if (attributes.hasOwnProperty(i)) {
                    if (!attributes[i] || attributes[i] === " ") {
                        attributes[i] = sharedNls.showNullValue;
                    }
                }
            }
            if (dojo.configData.InfoWindowSettings[infoIndex].ShowAllFields === false) {
                for (j = 0; j < dojo.configData.InfoWindowSettings[infoIndex].InfoWindowData.length; j++) {
                    divAccessfee = domConstruct.create("div", { "class": "esriCTInfofacility" }, contentDiv);
                    domConstruct.create("div", { "class": "esriCTFirstChild", "innerHTML": dojo.configData.InfoWindowSettings[infoIndex].InfoWindowData[j].DisplayText }, divAccessfee);
                    domConstruct.create("div", { "class": "esriCTSecondChild", "innerHTML": string.substitute(dojo.configData.InfoWindowSettings[infoIndex].InfoWindowData[j].FieldName, attributes) }, divAccessfee);
                }
            } else if (dojo.configData.InfoWindowSettings[infoIndex].ShowAllFields === true) {
                for (key in attributes) {
                    if (attributes.hasOwnProperty(key)) {
                        if (key !== serchSetting.ObjectID) {
                            value = attributes[key];
                            divAccessfee = domConstruct.create("div", { "class": "esriCTInfofacility" }, contentDiv);
                            domConstruct.create("div", { "class": "esriCTFirstChild", "innerHTML": key }, divAccessfee);
                            domConstruct.create("div", { "class": "esriCTSecondChild", "innerHTML": value }, divAccessfee);
                        }
                    }
                }
            } else {
                for (k = 0; k < dojo.configData.InfoWindowSettings[infoIndex].InfoWindowData.length; k++) {
                    divAccessfee = domConstruct.create("div", { "class": "esriCTInfofacility" }, contentDiv);
                    domConstruct.create("div", { "class": "esriCTFirstChild", "innerHTML": dojo.configData.InfoWindowSettings[infoIndex].InfoWindowData[k].DisplayText }, divAccessfee);
                    facilityDiv = domConstruct.create("div", { "class": "esriCTSecondChild" }, divAccessfee);
                    if (string.substitute(dojo.configData.InfoWindowSettings[infoIndex].InfoWindowData[k].FieldName, attributes).substring(0, 4) === "http") {
                        domConstruct.create("a", { "class": "esriCTinfoWindowHyperlink", "href": string.substitute(dojo.configData.InfoWindowSettings[infoIndex].InfoWindowData[k].FieldName, attributes), "title": string.substitute(dojo.configData.InfoWindowSettings[infoIndex].InfoWindowData[k].FieldName, attributes), "innerHTML": sharedNls.titles.infoWindowTextURL, "target": "_blank" }, facilityDiv);
                        domClass.add(facilityDiv, "esriCTWordBreak");
                    } else if (string.substitute(dojo.configData.InfoWindowSettings[infoIndex].InfoWindowData[k].FieldName, attributes).substring(0, 3) === "www") {
                        domConstruct.create("a", { "class": "esriCTinfoWindowHyperlink", "href": "http://" + string.substitute(dojo.configData.InfoWindowSettings[infoIndex].InfoWindowData[k].FieldName, attributes), "title": "http://" + string.substitute(dojo.configData.InfoWindowSettings[infoIndex].InfoWindowData[k].FieldName, attributes), "innerHTML": sharedNls.titles.infoWindowTextURL, "target": "_blank" }, facilityDiv);
                    } else {
                        facilityDiv.innerHTML = string.substitute(dojo.configData.InfoWindowSettings[infoIndex].InfoWindowData[k].FieldName, attributes);
                    }
                }
            }
            // if widgetName is "infoactivity" and ActivitySearchSettings is enable from config
            if (widgetName.toLowerCase() === "infoactivity" && dojo.configData.ActivitySearchSettings[0].Enable) {
                for (j = 0; j < dojo.configData.ActivitySearchSettings.length; j++) {
                    SearchSettingsLayers = dojo.configData.ActivitySearchSettings[j];
                    //looping for ActivityList to show the activity images in infowindow
                    for (i = 0; i < SearchSettingsLayers.ActivityList.length; i++) {
                        if (dojo.string.substitute(SearchSettingsLayers.ActivityList[i].FieldName, attributes)) {
                            if (attributes[dojo.string.substitute(SearchSettingsLayers.ActivityList[i].FieldName, attributes)] === "Yes") {
                                activityImageDiv = domConstruct.create("div", { "class": "esriCTActivityImage" }, divFacilityContent);
                                domConstruct.create("img", { "src": SearchSettingsLayers.ActivityList[i].Image, "title": SearchSettingsLayers.ActivityList[i].Alias }, activityImageDiv);
                            }
                        }
                    }
                }
            }
            addToListObject = { "featureSet": featureSet[0], "widgetName": widgetName, "layerId": layerId, "layerTitle": layerTitle };
            topic.publish("addToListObject", addToListObject);
        },

        /**
        * click to add a facility into my list
        * @param {object} featureSet contains featureSet, widgetName, LayerId and LayerTitle
        * @memberOf widgets/commonHelper/InfoWindowHelper
        */
        clickOnAddToList: function (addToListObject) {
            var isAlreadyAdded, objectIDField, listData;
            array.forEach(dojo.configData.EventSearchSettings, lang.hitch(this, function (settings) {
                //check the layerId and layerTitle object
                if (settings.QueryLayerId === addToListObject.layerId && settings.Title === addToListObject.layerTitle) {
                    objectIDField = settings.ObjectID;
                }
            }));
            array.forEach(dojo.configData.ActivitySearchSettings, lang.hitch(this, function (settings) {
                if (settings.QueryLayerId === addToListObject.layerId && settings.Title === addToListObject.layerTitle) {
                    objectIDField = settings.ObjectID;
                }
            }));
            isAlreadyAdded = false;
            //check MylistData length
            if (this.myListStore.length > 0) {
                for (listData = 0; listData < this.myListStore.length; listData++) {
                    if (this.myListStore[listData].value[this.myListStore[listData].key] === addToListObject.featureSet.attributes[objectIDField]) {
                        alert(sharedNls.errorMessages.activityAlreadyadded);
                        isAlreadyAdded = true;
                        break;
                    }
                }
            }
            //check if feature is not added in myList
            if (!isAlreadyAdded) {
                if (query(".esriCTEventsImg")[0]) {
                    topic.publish("toggleWidget", "myList");
                    topic.publish("showActivityPlannerContainer");
                }
                topic.publish("addToMyList", addToListObject.featureSet, addToListObject.widgetName, addToListObject.layerId, addToListObject.layerTitle);
            }
        },


        /**
        * Gallery Tab for InfoWindow
        * @param {object} galaryObject contain attribute, index, featureLayer, widget name, attachment
        * @memberOf widgets/commonHelper/InfoWindowHelper
        */
        _infoWindowGalleryTab: function (galaryObject) {
            var hasLayerAttachments;
            //check the node "this.galleryContainer"
            if (this.galleryContainer) {
                domConstruct.destroy(this.galleryContainer);
            }
            this.galleryContainer = domConstruct.create("div", { "class": "esriCTGalleryInfoContainer" }, dojo.byId("galleryTabContainer"));
            if (galaryObject.attribute) {
                hasLayerAttachments = this._setGallaryForInfoWindow(galaryObject.attribute, galaryObject.widgetName);
            }
            //if attachment is not on the layer
            if (!hasLayerAttachments) {
                domConstruct.create("div", { "class": "esriCTGalleryBox", "innerHTML": sharedNls.errorMessages.imageDoesNotFound }, this.galleryContainer);
            }
        },

        /**
        * Set Gallary For InfoWindow
        * @param {field} attribute is the field of feature
        * @param {field} widgetName is the name of the widget
        * @memberOf widgets/commonHelper/InfoWindowHelper
        */
        _setGallaryForInfoWindow: function (attribute, widgetName) {
            var layerIndex, layerID, searchSettingsData, hasLayerAttachments = false;
            //check widgetName is "infoactivity"
            if (widgetName.toLowerCase() === "infoactivity") {
                searchSettingsData = dojo.configData.ActivitySearchSettings;
                //check widgetName is "infoevent"
            } else if (widgetName.toLowerCase() === "infoevent") {
                searchSettingsData = dojo.configData.EventSearchSettings;
            }
            //check map
            if (this.map._layers) {
                for (layerIndex = 0; layerIndex < searchSettingsData.length; layerIndex++) {
                    for (layerID in this.map._layers) {
                        if (this.map._layers.hasOwnProperty(layerID)) {
                            if (this.map._layers[layerID].url && this.map._layers[layerID].hasAttachments && (this.map._layers[layerID].url === searchSettingsData[layerIndex].QueryURL)) {
                                hasLayerAttachments = true;
                                this.map._layers[layerID].queryAttachmentInfos(attribute[this.map._layers[layerID].objectIdField], lang.hitch(this, this.getAttachments), this._errorLog);
                                break;
                            }
                        }
                    }
                }
            }
            return hasLayerAttachments;
        },

        /**
        * change the image when click on previous arrow of image
        * @param {object} response contain the images which are in the feature layer
        * @param {node} divAttchmentInfo is domNode
        * @memberOf widgets/commonHelper/InfoWindowHelper
        */
        _previousImageInfo: function (response, divAttchmentInfo) {
            this.imageCountInfo--;
            // if the image count value is -1 then set the image count value is 0
            if (this.imageCountInfo < 0) {
                this.imageCountInfo = response.length - 1;
            }
            domAttr.set(divAttchmentInfo, "src", response[this.imageCountInfo].url);
        },

        /**
        * change the image when click on next arrow of image
        * @param {object} response contain the images which are in the feature layer
        * @param {node} divAttchmentInfo is domNode
        * @memberOf widgets/commonHelper/InfoWindowHelper
        */
        _nextImageInfo: function (response, divAttchmentInfo) {
            this.imageCountInfo++;
            // check if image is found then change the sorce of that image
            if (this.imageCountInfo === response.length) {
                this.imageCountInfo = 0;
            }
            domAttr.set(divAttchmentInfo, "src", response[this.imageCountInfo].url);
        },

        /**
        * change the image when click on next arrow of image
        * @param {object} error contain the error string
        * @memberOf widgets/commonHelper/InfoWindowHelper
        */
        _errorLog: function (error) {
            console.log(error);
        }
    });
});
