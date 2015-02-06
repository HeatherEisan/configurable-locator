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
    "../searchSetting/activitySearch",
    "widgets/geoLocation/geoLocation",
    "esri/tasks/RouteParameters",
    "esri/tasks/FeatureSet",
    "esri/SpatialReference",
    "esri/tasks/RouteTask",
    "esri/symbols/SimpleLineSymbol",
    "esri/units",
    "esri/request",
    "dojo/store/Memory",
    "widgets/locator/locator",
    "../searchSetting/eventPlannerHelper",
    "esri/dijit/Directions",
    "dojo/_base/Color",
    "esri/geometry/Extent",
    "dijit/a11yclick",
    "dojo/date/locale"

], function (declare, domConstruct, domStyle, domAttr, lang, on, domGeom, dom, array, domClass, query, string, Locator, Query, Deferred, DeferredList, QueryTask, Geometry, Graphic, Point, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic, urlUtils, ActivitySearch, GeoLocation, RouteParameters, FeatureSet, SpatialReference, RouteTask, SimpleLineSymbol, units, esriRequest, Memory, LocatorTool, EventPlannerHelper, Directions, Color, GeometryExtent, a11yclick, locale) {
    // ========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, ActivitySearch, EventPlannerHelper], {
        templateString: template,                                         // Variable for template string
        sharedNls: sharedNls,                                             // Variable for shared NLS
        acitivityListDiv: null,                                           // Variable store the activity list div
        locatorAddress: "",                                               // Variable for locator address
        isExtentSet: false,                                               // Variable for set the extent in share case
        todayDate: new Date(),                                            // Variable for geting today's date
        widgetName: null,                                                 // Variable to store the widget name
        selectedLayerTitle: null,                                         // Variable for selected layer title
        myListStore: [],                                                  // Array to store myList data
        geoLocationGraphicsLayerID: "geoLocationGraphicsLayer",           // Geolocation graphics layer id
        locatorGraphicsLayerID: "esriGraphicsLayerMapSettings",           // Locator graphics layer id
        /**
        * display locator, activity and event search in one panel
        *
        * @class
        * @name widgets/searchSetting/searchSetting
        */
        postCreate: function () {
            var contHeight, locatorParams, locatorObject, mapPoint, isTrue = false;
            this.myFromDate.constraints.min = this.todayDate;
            this.myToDate.constraints.min = this.todayDate;
            // Setting panel's title from config file
            this.searchPanelTitle.innerHTML = dojo.configData.SearchPanelTitle;
            this.activityPanelTitle.innerHTML = dojo.configData.ActivityPanelTitle;
            this.eventsPanelTitle.innerHTML = dojo.configData.EventPanelTitle;
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
            // Looping for showing and hiding event search div
            array.forEach(dojo.configData.EventSearchSettings, lang.hitch(this, function (EventSearchSetting) {
                // Checking condition for event search setting enable tag
                if (!EventSearchSetting.Enable) {
                    domStyle.set(this.divEventsPanel, "display", "none");
                } else {
                    isTrue = true;
                }
            }));
            // If activity search is not enable
            if (!dojo.configData.ActivitySearchSettings[0].Enable) {
                domStyle.set(this.divActivityPanel, "display", "none");
                if (!dojo.configData.ActivitySearchSettings[0].Enable && dojo.configData.SearchPanelTitle !== "" && !isTrue) {
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
                // Checking for feature search data of event search if it is present then
                if (this.featureSet && this.featureSet.length > 0) {
                    this._showActivitiesList();
                }
            })));
            // subscribing to store value for extent from other widget.
            topic.subscribe("extentSetValue", lang.hitch(this, function (value) {
                this.isExtentSet = value;
            }));
            domAttr.set(this.divSearchContainer, "title", "");
            // click for activity tab in search header panel
            this.own(on(this.divActivityPanel, a11yclick, lang.hitch(this, function () {
                this._showActivityTab();
            })));
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
            //click on "GO" button in activity search
            this.own(on(this.bottonGo, a11yclick, lang.hitch(this, function () {
                topic.publish("hideInfoWindow");
                topic.publish("extentSetValue", true);
                this.featureSet.length = 0;
                this._activityPlannerDateValidation();
            })));
            // change event for date in event planner
            this.own(on(this.myFromDate, "change", lang.hitch(this, function () {
                this.myToDate.reset();
                this.myToDate.constraints.min = this.myFromDate.value;
            })));
            // proxy setting for route services
            urlUtils.addProxyRule({
                urlPrefix: dojo.configData.DrivingDirectionSettings.RouteServiceURL,
                proxyUrl: dojo.configData.ProxyUrl
            });
            // calling function to showing the search tab
            this._showSearchTab();
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
            // Calback after adding graphics
            locatorObject.onGraphicAdd = lang.hitch(this, function () {
                dojo.addressLocation = locatorObject.selectedGraphic.geometry.x.toString() + "," + locatorObject.selectedGraphic.geometry.y.toString();
                dojo.doQuery = "false";
                topic.publish("createBuffer", locatorObject.selectedGraphic);
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
                topic.publish("removeGeolocationPushPin");
                if (candidate.geometry) {
                    locatorObject._toggleTexBoxControls(false);
                    locatorObject._locateAddressOnMap(candidate.geometry);
                }
                if (candidate && candidate.layer) {
                    this.selectedLayerTitle = candidate.layer.SearchDisplayTitle;
                }
                if (candidate && candidate.layer) {
                    topic.publish("queryLayer", candidate.geometry, candidate, "unifiedsearch");
                    if (locatorObject && locatorObject.selectedGraphic === null) {
                        dojo.addressLocation = candidate.geometry.x.toString() + "," + candidate.geometry.y.toString();
                    }
                }
            });
            // subscribing to store value of myList data.
            topic.subscribe("getAcitivityListDiv", lang.hitch(this, function (value) {
                this.acitivityListDiv = value;
            }));
            // subscribing fuction getting carousel Container object
            topic.subscribe("getCarouselContainer", lang.hitch(this, function (value, carouselPodData) {
                this.carouselContainer = value;
                this.carouselPodData = carouselPodData;
            }));
            // Publish for getting caousel container data
            topic.publish("getCarouselContainerData");
            // subscribing to store value of sortedList
            topic.subscribe("sortMyListData", lang.hitch(this, function (value) {
                this.sortedList = value;
            }));
            // subscribing fuction for setting myListStoreData
            topic.subscribe("getMyListStoreData", lang.hitch(this, function (value) {
                this.myListStore = value;
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
            // Function for share app
            setTimeout(lang.hitch(this, function () {
                if (window.location.toString().split("$sharedGeolocation=").length > 1 && window.location.toString().split("$sharedGeolocation=")[1].substring(0, 5) !== "false") {
                    var isZoomToGeolocation = this.setZoomForGeolocation();
                    // check  if  required fields in browsers that support for geolocation or not
                    if (Modernizr.geolocation) {
                        // dijit.registry stores a collection of all the geoLocation widgets within a page
                        if (dijit.registry.byId("geoLocation")) {
                            dijit.registry.byId("geoLocation").showCurrentLocation(true, isZoomToGeolocation);
                            dijit.registry.byId("geoLocation").onGeolocationComplete = lang.hitch(this, function (mapPoint, isPreLoaded) {
                                //variable to stored the gelocation point for share URL
                                dojo.sharedGeolocation = mapPoint;
                                if (mapPoint) {
                                    if (isPreLoaded) {
                                        dojo.doQuery = "false";
                                        topic.publish("createBuffer", mapPoint, "geolocation");
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
                        }
                    } else {
                        topic.publish("hideProgressIndicator");
                        alert(sharedNls.errorMessages.activitySerachGeolocationText);
                    }
                }
            }, 5000));
            // Function for share app
            setTimeout(lang.hitch(this, function () {
                var startDate, endDate, formatedStartDate, formatedEndDate, eventObjectId, activityObjectId;
                //check if eventplanner is there in share URL or not.
                if (window.location.toString().split("$eventplanner=").length > 1) {
                    startDate = window.location.toString().split("$startDate=")[1].split("$endDate=")[0].replace(new RegExp(",", 'g'), " ");
                    endDate = window.location.toString().split("$startDate=")[1].split("$endDate=")[1].split("$")[0].replace(new RegExp(",", 'g'), " ");
                    formatedStartDate = locale.format(new Date(startDate), { datePattern: "MM/dd/yyyy", selector: "date" });
                    formatedEndDate = locale.format(new Date(endDate), { datePattern: "MM/dd/yyyy", selector: "date" });
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
                    dojo.eventInfoWindowAttribute = eventObjectId;
                }
                //check if eventInfoWindowIdActivity is there in share URL or not.Its store the activity layer objectID.
                if (window.location.toString().split("$eventInfoWindowIdActivity=").length > 1) {
                    activityObjectId = window.location.toString().split("eventInfoWindowIdActivity=")[1].split("$")[0];
                    this._queryForActivityShare(activityObjectId);
                    dojo.eventInfoWindowIdActivity = activityObjectId;
                }
            }), 3000);
        },

        /**
        * change the date format with configured date format
        * @param {object} featureSet of featuer set
        * @param {object} eventSearchSettings of event search settings
        * @memberOf widgets/searchSetting/searchSetting
        */
        _changeDateFormatForSharedEvents: function (featureSet, eventSearchSettings) {
            var displayDateFormat = eventSearchSettings.DisplayDateFormat, i, key, j;
            // Checking for feature set
            if (featureSet) {
                // Looping of event search settings date field
                for (j = 0; j < eventSearchSettings.DateField.length; j++) {
                    // Looping for feature set
                    for (i = 0; i < featureSet.length; i++) {
                        // Getting key value from feature attribute foe setting date formate.
                        for (key in featureSet[i].attributes) {
                            if (featureSet[i].attributes.hasOwnProperty(key)) {
                                if (key === eventSearchSettings.DateField[j]) {
                                    if (featureSet[i].attributes[key] !== sharedNls.showNullValue) {
                                        featureSet[i].attributes[key] = dojo.date.locale.format(this.utcTimestampFromMs(featureSet[i].attributes[key]), { datePattern: displayDateFormat, selector: "date" });
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
        * Get the layer information after doing json call for comment layer's object Id
        * @param {data} layer url
        * @return {object} layer request
        * @memberOf widgets/searchSetting/searchSetting
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
        * Get object id key name from the layer
        * @param {object} object of layer
        * @return {object} object Id
        * @memberOf widgets/searchSetting/searchSetting
        */
        getObjectId: function (response) {
            var objectId, j;
            for (j = 0; j < response.fields.length; j++) {
                if (response.fields[j].type === "esriFieldTypeOID") {
                    objectId = response.fields[j].name;
                    break;
                }
            }
            return objectId;
        },

        /**
        * Get date field key name from layer
        * @param {object} object of layer
        * @return {array} array of date field key name
        * @memberOf widgets/searchSetting/searchSetting
        */
        getDateField: function (response) {
            var j, dateFieldArray = [], dateField;
            // Looping for getting date field name
            for (j = 0; j < response.fields.length; j++) {
            // Checking for date field type
                if (response.fields[j].type === "esriFieldTypeDate") {
                    dateField = response.fields[j].name;
                    dateFieldArray.push(dateField);
                }
            }
            return dateFieldArray;
        },

        /**
        * change the date format with configured date format
        * @param {object} object of featureSet
        * @return {object} object of event Search Settings
        * @memberOf widgets/searchSetting/searchSetting
        */
        _changeDateFormat: function (featureSet, eventSearchSettings) {
            var displayDateFormat = eventSearchSettings.DisplayDateFormat, i, key, k;
            // Checking feature set
            if (featureSet) {
                // Looping event searc setting date field for changing date formate
                for (i = 0; i < eventSearchSettings.DateField.length; i++) {
                    //  Looping feature set feature
                    for (k = 0; k < featureSet.features.length; k++) {
                        // Looping feature set feature attribute
                        for (key in featureSet.features[k].attributes) {
                            if (featureSet.features[k].attributes.hasOwnProperty(key)) {
                                // Checking date field and changing date field formate
                                if (key === eventSearchSettings.DateField[i]) {
                                    if (featureSet.features[k].attributes[key] !== sharedNls.showNullValue) {
                                        featureSet.features[k].attributes[key] = dojo.date.locale.format(this.utcTimestampFromMs(featureSet.features[k].attributes[key]), { datePattern: displayDateFormat, selector: "date" });
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
        * Get the key field value from the config file
        * @param {data} keyField value with $ sign
        * @member Of widgets/searchSetting/searchSetting
        */
        getKeyValue: function (data) {
            var firstPlace, secondPlace, keyValue;
            firstPlace = data.indexOf("{");
            secondPlace = data.indexOf("}");
            keyValue = data.substring(Number(firstPlace) + 1, secondPlace);
            return keyValue;
        },

        /**
        * hide eventPlanner list when date is not selected or selected date is not valid
        * @member Of widgets/searchSetting/searchSetting
        */
        _hideActivitiesList: function () {
            if (this.divEventContainer.childNodes.length > 1) {
                domConstruct.destroy(this.divEventContainer.children[1]);
            }
        },

        /**
        * Remove null value from the attribute.
        * @param {object} featureObject is object for feature
        * @return {object} feature set after removing null value
        * @member Of widgets/searchSetting/searchSetting
        */
        _removeNullValue: function (featureObject) {
            var i, j;
            if (featureObject) {
                // Looping feature set object for removing null value and setting null value from nls file
                for (i = 0; i < featureObject.length; i++) {
                    for (j in featureObject[i].attributes) {
                        if (featureObject[i].attributes.hasOwnProperty(j)) {
                            if (!featureObject[i].attributes[j]) {
                                featureObject[i].attributes[j] = sharedNls.showNullValue;
                            }
                            if (dojo.isString(featureObject[i].attributes[j]) && lang.trim(featureObject[i].attributes[j]) === "NA") {
                                featureObject[i].attributes[j] = sharedNls.showNullValue;
                            }
                        }
                    }
                }
            }
            return featureObject;
        },

        /**
        * Setting value to change for extent
        *@returns the boolean value for setting extent for geolocation
        * @member Of widgets/searchSetting/searchSetting
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
        }
    });
});
