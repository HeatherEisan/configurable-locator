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
    "../searchSetting/eventPlannerHelper",
    "esri/dijit/Directions",
    "dojo/_base/Color",
    "esri/geometry/Extent",
    "dijit/a11yclick",
    "dojo/date/locale",
    "../searchSetting/commonHelper"

], function (declare, domConstruct, domStyle, domAttr, lang, on, domGeom, dom, array, domClass, query, string, Locator, Query, Deferred, DeferredList, QueryTask, Geometry, Graphic, Point, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic, urlUtils, CarouselContainer, ActivitySearch, LocatorHelper, GeoLocation, RouteParameters, FeatureSet, SpatialReference, RouteTask, SimpleLineSymbol, units, Memory, InfoWindowHelper, LocatorTool, CarouselContainerHelper, EventPlannerHelper, Directions, Color, GeometryExtent, a11yclick, locale, CommonHelper) {
    // ========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, ActivitySearch, InfoWindowHelper, LocatorHelper, CarouselContainerHelper, EventPlannerHelper, CommonHelper], {
        templateString: template,                                         // Variable for template string
        sharedNls: sharedNls,                                             // Variable for shared NLS
        carouselPodData: [],                                              // Array to store carouselPod data
        isRouteCreated: false,                                            // Variable for route is created or not
        featureSetWithoutNullValue: null,                                 // Variable for store the featureSet Without NullValue
        objectIdForCommentLayer: "",                                      // Variable to store the objectId for comment layer
        objectIdForActivityLayer: "",                                     // Variable to store the objectId for activity layer
        acitivityListDiv: null,                                           // Variable store the activity list div
        locatorAddress: "",                                               // Variable for locator address
        isExtentSet: false,                                               // Variable for set the extent in share case
        todayDate: new Date(),                                            // Variable for geting today's date
        widgetName: null,                                                 // Variable to store the widget name
        selectedLayerTitle: null,                                         // Variable for selected layer title
        myListStoreData: [],                                              // Array to store myList data
        geoLocationGraphicsLayerID: "geoLocationGraphicsLayer",           // Geolocation graphics layer id
        locatorGraphicsLayerID: "esriGraphicsLayerMapSettings",           // Locator graphics layer id

        /**
        * display locator widget
        *
        * @class
        * @name widgets/locator/locator
        */
        postCreate: function () {
            var contHeight, locatorParams, locatorObject, mapPoint, isTrue = false;
            this.myFromDate.constraints.min = this.todayDate;
            this.myToDate.constraints.min = this.todayDate;
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
            array.forEach(dojo.configData.EventSearchSettings, lang.hitch(this, function (EventSearchSetting) {
                if (!EventSearchSetting.Enable) {
                    domStyle.set(this.divEventsPanel, "display", "none");
                } else {
                    domStyle.set(this.divEventsPanel, "display", "block");
                    isTrue = true;
                }
            }));
            if (!dojo.configData.ActivitySearchSettings[0].Enable) {
                domStyle.set(this.divActivityPanel, "display", "none");
                if (!dojo.configData.ActivitySearchSettings[0].Enable && !isTrue) {
                    domClass.replace(this.divSearchPanel, "esriCTDivSearch", "esriCTDivSearchPanel");
                }
            }
            domConstruct.place(this.divSearchContainer, dom.byId("esriCTParentDivContainer"));
            this.own(on(this.domNode, a11yclick, lang.hitch(this, function () {
                /**
                * minimize other open header panel widgets and show locator widget
                */
                this.isExtentSet = true;
                this.isInfowindowHide = true;
                topic.publish("extentSetValue", true);
                topic.publish("toggleWidget", "searchSetting");
                this._showLocateContainer();
                if (this.featureSet && this.featureSet.length > 0) {
                    this._showActivitiesList();
                }
            })));

            // subscribing to store value for extent from other widget.
            topic.subscribe("extentSetValue", lang.hitch(this, function (value) {
                this.isExtentSet = value;
            }));

            /** Subscribe functions for calling them from other widget
            * subscribing to execute for features and perform operation
            */
            topic.subscribe("getExecuteQueryForFeatures", lang.hitch(this, function (featureSetObject, QueryURL, widgetName) {
                this._executeQueryForFeatures(featureSetObject, QueryURL, widgetName);
            }));
            domAttr.set(this.divSearchContainer, "title", "");
            // click for activity tab in search header panel
            this.own(on(this.divActivityPanel, a11yclick, lang.hitch(this, function () {
                this._showActivityTab();
            })));
            // calling function for get the layer information.
            this.getLayerInformaition();
            // calling function for create direction widget.
            this._createDirectionWidget();
            // calling function for create carousel container
            this._createCarouselContainer();
            // calling function for craete carousel pod
            this.createCarouselPod();
            // calling function for craete carousel pod is ActivitySearchSettings is enable
            if (dojo.configData.ActivitySearchSettings[0].Enable) {
                this._showActivitySearchContainer();
            }
            // click for unified search tab in search header panel
            this.own(on(this.divSearchPanel, a11yclick, lang.hitch(this, function () {
                this._showSearchTab();
            })));
            // click for event tab in search header panel
            this.own(on(this.divEventsPanel, a11yclick, lang.hitch(this, function () {
                this._showEventTab();
            })));
            /** Subscribe functions for calling them from other widget
            *  subscribing to create infoWindow content
            */
            topic.subscribe("createInfoWindowContent", lang.hitch(this, function (infoWindowParameter) {
                this._createInfoWindowContent(infoWindowParameter);
            }));
            /** Subscribe functions for calling them from other widget
            *  subscribing to set the map tip postion
            */
            topic.subscribe("setMapTipPosition", this._onSetMapTipPosition);
            // proxy setting for route services
            urlUtils.addProxyRule({
                urlPrefix: dojo.configData.DrivingDirectionSettings.RouteServiceURL,
                proxyUrl: dojo.configData.ProxyUrl
            });
            // calling function to showing the search tab
            this._showSearchTab();
            // appending ActivitySearchSettings and EventSearchSettings into SearchSettings
            dojo.configData.SearchSettings = [];
            this._addSearchSettings(dojo.configData.ActivitySearchSettings);
            this._addSearchSettings(dojo.configData.EventSearchSettings);
            //locator object for unifeid search
            locatorParams = {
                defaultAddress: dojo.configData.LocatorSettings.LocatorDefaultAddress,
                preLoaded: false,
                parentDomNode: this.divSearchContent,
                map: this.map,
                graphicsLayerId: this.locatorGraphicsLayerID,
                locatorSettings: dojo.configData.LocatorSettings,
                configSearchSettings: dojo.configData.SearchSettings
            };
            locatorObject = new LocatorTool(locatorParams);
            locatorObject.onGraphicAdd = lang.hitch(this, function () {
                dojo.addressLocation = locatorObject.selectedGraphic.geometry.x.toString() + "," + locatorObject.selectedGraphic.geometry.y.toString();
                dojo.doQuery = "false";
                this.createBuffer(locatorObject.selectedGraphic);
            });
            //locator candidate click for unifeid search
            locatorObject.candidateClicked = lang.hitch(this, function (candidate) {
                this.selectedLayerTitle = null;
                if (candidate && candidate.attributes && candidate.attributes.address) {
                    this.locatorAddress = candidate.attributes.address;
                }
                //calling function for locate container
                this._showLocateContainer();
                //calling function to remove the gelocation pushpin
                this.removeGeolocationPushPin();
                if (candidate.geometry) {
                    locatorObject._toggleTexBoxControls(false);
                    locatorObject._locateAddressOnMap(candidate.geometry);
                }
                if (candidate && candidate.layer) {
                    this.selectedLayerTitle = candidate.layer.SearchDisplayTitle;
                }
            });

            topic.subscribe("getMyListStoreData", lang.hitch(this, function (value) {
                this.myListStoreData = value;
            }));

            // subscribing to store value of myList data.
            topic.subscribe("getAcitivityListDiv", lang.hitch(this, function (value) {
                this.acitivityListDiv = value;
            }));
            /** Subscribe functions for calling them from other widget
            *  subscribing to execute query for event for list.
            */
            topic.subscribe("eventForListClick", lang.hitch(this, function (featureSetObject) {
                this._executeQueryForEventForList(featureSetObject);
            }));
            //click on "GO" button in activity search
            this.own(on(this.bottonGo, a11yclick, lang.hitch(this, function () {
                topic.publish("hideInfoWindow");
                topic.publish("extentSetValue", true);
                this.featureSet.length = 0;
                this._activityPlannerDateValidation();
            })));
            // subscribing to store value of sortedList
            topic.subscribe("sortMyListData", lang.hitch(this, function (value) {
                this.sortedList = value;
            }));
            // subscribing "addressSearch" in share URL
            topic.subscribe("addressSearch", lang.hitch(this, function () {
                // check "address" is there in share URL
                if (window.location.toString().split("$address=").length > 1) {
                    mapPoint = new Point(window.location.toString().split("$address=")[1].split("$")[0].split(",")[0], window.location.toString().split("$address=")[1].split("$")[0].split(",")[1], this.map.spatialReference);
                    dojo.addressLocation = window.location.toString().split("$address=")[1].split("$")[0];
                    setTimeout(lang.hitch(this, function () {
                        locatorObject._locateAddressOnMap(mapPoint);
                    }, 5000));
                }
            }));
            setTimeout(lang.hitch(this, function () {
                if (window.location.toString().split("$sharedGeolocation=").length > 1 && window.location.toString().split("$sharedGeolocation=")[1].substring(0, 5) !== "false") {
                    var isZoomToGeolocation = this.setZoomForGeolocation();
                    // check  if  required fields in browsers that support for geolocation or not
                    if (Modernizr.geolocation) {
                        // dijit.registry stores a collection of all the geoLocation widgets within a page
                        dijit.registry.byId("geoLocation").showCurrentLocation(true, isZoomToGeolocation);
                        dijit.registry.byId("geoLocation").onGeolocationComplete = lang.hitch(this, function (mapPoint, isPreLoaded) {
                            //variable to stored the gelocation point for share URL
                            dojo.sharedGeolocation = mapPoint;
                            if (mapPoint) {
                                if (isPreLoaded) {
                                    dojo.doQuery = "false";
                                    this.createBuffer(mapPoint, "geolocation");
                                }
                            }
                        });
                        // dijit.registry stores a collection of all the geoLocation widgets within a page
                        dijit.registry.byId("geoLocation").onGeolocationError = lang.hitch(this, function (error, isPreLoaded) {
                            if (isPreLoaded) {
                                topic.publish("hideInfoWindow");
                                alert(error);
                            }
                        });
                    } else {
                        topic.publish("hideProgressIndicator");
                        alert(sharedNls.errorMessages.activitySerachGeolocationText);
                    }
                }
            }, 5000));
            setTimeout(lang.hitch(this, function () {
                var startDate, endDate, formatedStartDate, formatedEndDate, eventObjectId, activityObjectId;
                //check if eventplanner is there in share URL or not.
                if (window.location.toString().split("$eventplanner=").length > 1) {
                    startDate = window.location.toString().split("$startDate=")[1].split("$endDate=")[0].replace(new RegExp(",", 'g'), " ");
                    endDate = window.location.toString().split("$startDate=")[1].split("$endDate=")[1].split("$")[0].replace(new RegExp(",", 'g'), " ");
                    formatedStartDate = locale.format(new Date(startDate), { datePattern: "MM/dd/yyyy", selector: "date" });
                    formatedEndDate = locale.format(new Date(endDate), {datePattern: "MM/dd/yyyy", selector: "date" });
                    this._queryForActivity(formatedStartDate, formatedEndDate);
                    this.myFromDate.value = this.utcTimestampFromMs(startDate);
                    this.myToDate.value = this.utcTimestampFromMs(endDate);
                    this.myToDate.textbox.value = formatedEndDate;
                    this.myFromDate.textbox.value = formatedStartDate;
                    dojo.eventPlannerQuery = this.myFromDate.value.toString() + "," + this.myToDate.value.toString();
                    topic.publish("toggleWidget", "myList");
                    topic.publish("showActivityPlannerContainer");
                    this.isEventShared = true;
                }
                //check if eventInfoWindowAttribute is there in share URL or not.Its store the event layer objectID.
                if (window.location.toString().split("$eventInfoWindowAttribute=").length > 1) {
                    eventObjectId = window.location.toString().split("eventInfoWindowAttribute=")[1].split("$")[0];
                    this._queryForEventShare(eventObjectId);
                }
                //check if eventInfoWindowIdActivity is there in share URL or not.Its store the activity layer objectID.
                if (window.location.toString().split("$eventInfoWindowIdActivity=").length > 1) {
                    activityObjectId = window.location.toString().split("eventInfoWindowIdActivity=")[1].split("$")[0];
                    this._queryForActivityShare(activityObjectId);
                }
            }), 3000);
            // change event for date in event planner
            this.own(on(this.myFromDate, "change", lang.hitch(this, function () {
                this.myToDate.reset();
                this.myToDate.constraints.min = this.myFromDate.value;
            })));
            // get widgetName from other widget
            topic.subscribe("getInfowWindowWidgetName", lang.hitch(this, function (LayerTitle, LayerId) {
                var widgetName;
                widgetName = this._getInfowWindowWidgetName(LayerTitle, LayerId);
                topic.publish("showWidgetName", widgetName);
            }));
            // get "StartDate" and "ObjectId" from evevnt and activity layer from layerId and Layertitle
            topic.subscribe("addToMyList", lang.hitch(this, function (featureArray, widgetName, layerId, layerTitle) {
                var isExtentSet = true, infoWindowClick = true, addToListEventFeature = [], addToListActivityFeature = [], i, eventDataObject, objectIDField, startDateField, splitedField, startDateFeild, settingsName, settingsIndex, eventSettingsObject, j;
                topic.publish("extentSetValue", isExtentSet);
                array.forEach(dojo.configData.EventSearchSettings, lang.hitch(this, function (settings, eventSettingIndex) {
                    if (settings.QueryLayerId === layerId && settings.Title === layerTitle) {
                        objectIDField = settings.ObjectID;
                        splitedField = settings.SearchDisplaySubFields.split(',');
                        startDateFeild = splitedField[0];
                        startDateField = this._getKeyValue(startDateFeild);
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
                this._addtoMyList(eventDataObject, widgetName);
            }));
            // subscribing fuction for hide carosuel pod
            topic.subscribe("hideCarouselContainer", lang.hitch(this, function () {
                this.hideCarouselContainer();
            }));
            // subscribing fuction for infoWindow direction tab
            topic.subscribe("showDirection", lang.hitch(this, function (directionObject) {
                this._infoWindowDirectionTab(directionObject);
            }));
        },


        /**
        * address search setting
        * @memberOf widgets/searchSettings/searchSettings
        */
        _addSearchSettings: function (layerSetting) {
            var i;
            //loop for the layer and push the layer in dojo.configData.SearchSettings
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
            this.carouselContainer.createPod(dom.byId("esriCTParentDivContainer"), sharedNls.titles.carouselPodToggleButtonText);
        },

        /**
        * execute this function when route is not calculated due to any error
        * @param{object} routeObject contains route information
        * @memberOf widgets/searchSettings/searchSettings
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
        * @memberOf widgets/searchSettings/searchSettings
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
                        dojo.addressLocationDirectionActivity = locatorObjectForCarouselContainer.selectedGraphic.geometry.x.toString() + "," + locatorObjectForCarouselContainer.selectedGraphic.geometry.y.toString();
                        // check grapic address
                        if (graphic && graphic.attributes && graphic.attributes.address) {
                            this.locatorAddress = graphic.attributes.address;
                        }
                        this._clearBuffer();
                        this.removeGeolocationPushPin();
                        routeObject = { "StartPoint": activityMapPoint.graphics[0], "EndPoint": queryObject.FeatureData, "Index": queryObject.Index, "WidgetName": queryObject.WidgetName, "QueryURL": queryObject.QueryURL };
                        this.showRoute(routeObject);
                    });
                }
            } else {
                directionObject = { "Feature": queryObject.FeatureData, "SelectedItem": resultcontent, "SolveRoute": queryObject.SolveRoute, "Address": queryObject.Address, "WidgetName": queryObject.WidgetName, "activityData": queryObject.activityData, "QueryURL": queryObject.QueryURL};
                this.setDirection(directionObject);
            }
            this.setGallery(queryObject.FeatureData, resultcontent);
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
        * @memberOf widgets/searchSettings/searchSettings
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
        * execute query task for Comment Layer
        * @param {object} relatedRecords Contains Comment layer URL
        * @memberOf widgets/searchSettings/searchSettings
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
        * create route for multiple points
        * @param {object} contains Start point, End point, widget name and query URL
        * @memberOf widgets/searchSettings/searchSettings
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
        * Create Direction widget
        * @memberOf widgets/searchSettings/searchSettings
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
                //calling esriDirection widget
                this._esriDirectionsWidget.startup();
                // set the color of route in direction widget
                this._esriDirectionsWidget.options.routeSymbol.color = new Color([parseInt(dojo.configData.DrivingDirectionSettings.RouteColor.split(",")[0], 10), parseInt(dojo.configData.DrivingDirectionSettings.RouteColor.split(",")[1], 10), parseInt(dojo.configData.DrivingDirectionSettings.RouteColor.split(",")[2], 10), parseFloat(dojo.configData.DrivingDirectionSettings.Transparency.split(",")[0], 10)]);
                //set the width of route in direction widget
                this._esriDirectionsWidget.options.routeSymbol.width = parseInt(dojo.configData.DrivingDirectionSettings.RouteWidth, 10);
                // callback function for direction widget
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
                            dojo.infoRoutePoint = null;
                            dojo.eventRoutePoint = null;
                            dojo.eventForListClicked = null;
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
                            if (window.location.href.toString().split("$isShowPod=").length > 1) {
                                if (window.location.href.toString().split("$isShowPod=")[1].split("$")[0].toString() === "false") {
                                    this.carouselContainer.collapseDown();
                                }
                            } else {
                                this.carouselContainer.collapseUP();
                            }
                            this.setSearchContent(this.routeObject.EndPoint, false, this.routeObject.QueryURL, this.routeObject.WidgetName, this.routeObject.activityData);
                            this.highlightFeature(this.routeObject.EndPoint[this.routeObject.Index].geometry);
                            this.setCenterAt(this.routeObject.EndPoint[this.routeObject.Index].geometry);
                            resultcontent = { "value": this.routeObject.Index };
                            facilityObject = { "Feature": this.routeObject.EndPoint, "SelectedItem": resultcontent, "QueryURL": this.routeObject.QueryURL, "WidgetName": this.routeObject.WidgetName };
                            this.setFacility(facilityObject);
                            directionObject = { "Feature": this.routeObject.EndPoint, "SelectedItem": resultcontent, "SolveRoute": a.result.routeResults, "Address": address, "WidgetName": this.routeObject.WidgetName, "QueryURL": this.routeObject.QueryURL };
                            this.setDirection(directionObject);
                            this.setGallery(this.routeObject.EndPoint, resultcontent);
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
                })));
                topic.publish("hideProgressIndicator");
            } catch (error) {
                alert(error);
                topic.publish("hideProgressIndicator");
            }
        }
    });
});
