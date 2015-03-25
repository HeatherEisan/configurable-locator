/*global define,dojo,dojoConfig:true,alert,esri,Modernizr,console,dijit,appGlobals*/
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
    "esri/tasks/QueryTask",
    "esri/geometry",
    "esri/graphic",
    "dojo/date/locale",
    "esri/geometry/Point",
    "dojo/text!./templates/searchSettingTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/topic",
    "esri/request",
    "dijit/form/DateTextBox",
    "dojo/date",
    "dojo/parser",
    "dojo/store/Memory",
    "esri/units",
    "../carouselContainer/carouselContainer",
    "dijit/a11yclick"

], function (declare, domConstruct, domStyle, domAttr, lang, on, array, domClass, query, string, Locator, Query, QueryTask, Geometry, Graphic, locale, Point, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic, esriRequest, DateTextBox, date, parser, Memory, units, CarouselContainer, a11yclick) {
    // ========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,              // Variable for template string
        sharedNls: sharedNls,                  // Variable for shared NLS
        featureSet: [],                        // Variable to store feature searched from event search
        featureSetOfInfoWindow: null,          // Variable to set features added from info window
        addToListFeatures: [],                 // Array to store feature added to mylist from info window or info pod
        dateFieldArray: [],                    // Array to store date field name from layer to change date format
        isEventShared: false,                  // variable to store event shared information

        /**
        * In this file we create event search panel UI, query on layer for getting event data, share functions
        * @memberOf widgets/searchSetting/eventPlanner
        */

        /**
        * Query for activity in share window
        * @param {object} object of layer
        * @memberOf widgets/searchSetting/eventPlannerHelper
        */
        _queryForActivityShare: function (activityObjectId) {
            var queryTask, queryLayer, activityLayer, layerRequestData;
            // Looping for activity search for query on layer.
            array.forEach(appGlobals.configData.ActivitySearchSettings, (lang.hitch(this, function (ActivitySearchSettings) {
                activityLayer = ActivitySearchSettings.QueryURL;
                queryTask = new QueryTask(activityLayer);
                queryLayer = new Query();
                queryLayer.objectIds = [activityObjectId];
                queryLayer.outSpatialReference = this.map.spatialReference;
                queryLayer.returnGeometry = true;
                queryLayer.outFields = ["*"];
                layerRequestData = this._queryLayerForLayerInformation(activityLayer);
                layerRequestData.then(lang.hitch(this, function (response) {
                    topic.publish("showProgressIndicator");
                    this.dateFieldArray = this.getDateField(response);
                    queryTask.execute(queryLayer, lang.hitch(this, this._activityResult, ActivitySearchSettings));
                }), function (error) {
                    console.log("Error: ", error.message);
                    topic.publish("hideProgressIndicator");
                });
            })));
        },

        /**
        * Result got after query for event in share window
        * @param {object} object of layer
        * @memberOf widgets/searchSettings/eventPlannerHelper
        */
        _activityResult: function (activitySearchSettings, featureSet) {
            var activityFeatureList = [], i, queryLayerId, featureSetArray = [], eventCalenderContainer, activityDataObject, g;
            // If feature set is found then remove null value from feature and change date format
            if (featureSet) {
                featureSet.features = this._removeNullValue(featureSet.features);
                featureSet.features = this._formatedDataForShare(featureSet.features);
            }
            // If feature set is found
            if (featureSet) {
                this.featureSetOfInfoWindow = featureSet.features;
                appGlobals.shareOptions.eventInfoWindowData = this.featureSetOfInfoWindow[0].geometry;
                // Looping feature set for adding item in my List
                for (i = 0; i < featureSet.features.length; i++) {
                    queryLayerId = parseInt(appGlobals.configData.ActivitySearchSettings[0].QueryLayerId, 10);
                    activityDataObject = { "eventDetails": featureSet.features[i].attributes, "featureSet": featureSet.features[i], "infoWindowClick": true, "layerId": queryLayerId, "layerTitle": appGlobals.configData.ActivitySearchSettings[0].Title, "ObjectIDField": appGlobals.configData.ActivitySearchSettings[0].ObjectID, "StartDateField": "" };
                    activityFeatureList.push(activityDataObject[i]);
                    topic.publish("addtoMyListFunction", activityDataObject, "activitySearch");
                }
                // Checking in shared link to calculate route
                if (window.location.toString().split("$infoRoutePoint=").length > 1) {
                    if (window.location.toString().split("$infoRoutePoint=")[1].split("$")[0]) {
                        for (g = 0; g < featureSet.features.length; g++) {
                            if (Number(window.location.toString().split("$infoRoutePoint=")[1].split("$")[0]) === featureSet.features[g].attributes[appGlobals.configData.ActivitySearchSettings[0].ObjectID]) {
                                featureSetArray.push(featureSet.features[g]);
                                topic.publish("replaceApplicationHeaderContainer");
                                topic.publish("executeQueryForFeatures", featureSetArray, appGlobals.configData.ActivitySearchSettings[0].QueryURL, "activitySearch");
                            }
                        }
                    }
                }
                eventCalenderContainer = query(".esriCTAddEventList")[0];
                domClass.replace(eventCalenderContainer, "esriCTActivityCalender", "esriCTAddEventList");
            }
        },

        /**
        * Query for layer in the case of share window
        * @param {string} activityObjectId value of the object id
        * @param {object} settings of settings
        * @memberOf widgets/searchSetting/eventPlannerHelper
        */
        _queryForActivityForAddressSearch: function (activityObjectId, settings) {
            var queryTask, queryLayer, layer;
            // Looping for activity search for query on layer.
            layer = settings.QueryURL;
            queryTask = new QueryTask(layer);
            queryLayer = new Query();
            queryLayer.objectIds = [activityObjectId];
            queryLayer.outSpatialReference = this.map.spatialReference;
            queryLayer.returnGeometry = true;
            queryLayer.outFields = ["*"];
            topic.publish("showProgressIndicator");
            // querying for layer for data
            queryTask.execute(queryLayer, lang.hitch(this, this._queryForLayerInAddressSearch, layer));
        },

        /**
        * Query for layer
        * @param {string} URL contains the url
        * @param {object} result contains result set
        * @memberOf widgets/searchSetting/eventPlannerHelper
        */
        _queryForLayerInAddressSearch: function (URL, result) {
            var resultSet, routeObject;
            // function for getting date field
            this.dateFieldArray = this.getDateField(result);
            resultSet = result.features[0];
            // calling the show route
            routeObject = { "StartPoint": resultSet, "EndPoint": [resultSet], "Index": 0, "WidgetName": "unifiedsearch", "QueryURL": URL };
            topic.publish("showRoute", routeObject);
        },

        /**
        * show event tab in panel
        * @memberOf widgets/searchSetting/eventPlannerHelper
        */
        _showEventTab: function () {
            domStyle.set(this.divActivityContainer, "display", "none");
            domStyle.set(this.divSearchContent, "display", "none");
            domStyle.set(this.divEventContainer, "display", "block");
            domClass.replace(this.divEventsPanel, "esriCTEventsPanelSelected", "esriCTEventsPanel");
            domClass.replace(this.divActivityPanel, "esriCTActivityPanel", "esriCTActivityPanelSelected");
            domClass.replace(this.divSearchPanel, "esriCTSearchPanelSelected", "esriCTDivSearchPanel");
            domClass.replace(this.divEventContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
        },
        /**
        * activityPlanner Date Validation
        * @memberOf widgets/searchSetting/eventPlannerHelper
        */
        _activityPlannerDateValidation: function () {
            var formattedFromDate, formattedToDate;
            // checking for my date and to date validation
            if (this.myFromDate.validate() && this.myToDate.validate()) {
                formattedFromDate = locale.format(this.myFromDate.value, { datePattern: "yyyy-MM-dd", selector: "date", locale: "en-us" });
                formattedToDate = locale.format(this.myToDate.value, { datePattern: "yyyy-MM-dd", selector: "date", locale: "en-us" });
                try {
                    this._queryForActivity(formattedFromDate, formattedToDate);
                } catch (error) {
                    alert(error);
                }
            } else {
                this._hideActivitiesList();
                if (!this.myFromDate.validate() || !this._isDateValid(this.todayDate, this.myFromDate.value)) {
                    alert(sharedNls.errorMessages.activityPlannerInvalidFromDate);
                } else if (!this.myToDate.validate() || !this._isDateValid(this.myFromDate.value, this.myToDate.value)) {
                    alert(sharedNls.errorMessages.activityPlannerInvalidToDate);
                } else {
                    alert(sharedNls.errorMessages.activityPlannerInvalidDates);
                }
            }
        },

        /**
        * query events layer within given date range
        * @param {object} startDate contains user selected from date
        * @param {object} endDate contains user selected to date
        * @memberOf widgets/searchSetting/eventPlannerHelper
        */
        _queryForActivity: function (startDate, endDate) {
            var queryTask, queryLayer, eventLayer;
            this.dateFieldArray = null;
            appGlobals.shareOptions.eventPlannerQuery = this.myFromDate.value.toString() + "," + this.myToDate.value.toString();
            // Looping in event search setting to query  on layer
            array.forEach(appGlobals.configData.EventSearchSettings, (lang.hitch(this, function (eventSearchSettings) {
                eventLayer = eventSearchSettings.QueryURL;
                if (eventLayer) {
                    queryTask = new QueryTask(eventLayer);
                    queryLayer = new Query();
                    queryLayer.where = string.substitute(eventSearchSettings.SearchExpressionForDate, { "0": "'" + startDate + "'", "1": "'" + endDate + "'" });
                    queryLayer.outSpatialReference = this.map.spatialReference;
                    queryLayer.returnGeometry = true;
                    queryLayer.outFields = ["*"];
                    topic.publish("showProgressIndicator");
                    queryTask.execute(queryLayer, lang.hitch(this, this._showActivitiesList, eventSearchSettings), function (err) {
                        topic.publish("hideProgressIndicator");
                        alert(sharedNls.errorMessages.unableToPerformQuery);
                    });
                } else {
                    alert(sharedNls.errorMessages.eventLayerNotconfigured);
                    appGlobals.shareOptions.eventIndex = null;
                    appGlobals.shareOptions.eventPlannerQuery = null;
                    appGlobals.shareOptions.activitySearch = null;
                    appGlobals.shareOptions.doQuery = null;
                    appGlobals.shareOptions.mapClickedPoint = null;
                }
            })));
        },

        /**
        * Date validation of two dates
        * @param {object} firstDate contains first date for comparison
        * @param {object} secDate contains second date for comparison
        * @memberOf widgets/searchSetting/eventPlannerHelper
        */
        _isDateValid: function (firstDate, secDate) {
            var isValid = true, formattedFirstDate, formattedSecDate, dateFormat = "yyyy-MM-dd";
            formattedFirstDate = locale.format(firstDate, { datePattern: dateFormat, selector: "date" });
            formattedSecDate = locale.format(secDate, { datePattern: dateFormat, selector: "date" });
            // Checking for date validation
            if (formattedFirstDate > formattedSecDate && formattedFirstDate !== formattedSecDate) {
                isValid = false;
            }
            return isValid;
        },

        /**
        * displays the events list
        * @param {object} featureSet contains featureSet returned by querying eventPlanner layer
        * @memberOf widgets/searchSetting/eventPlannerHelper
        */
        _showActivitiesList: function (eventSearchSettings, featureSet) {
            topic.publish("showProgressIndicator");
            var splitedField, fieldValue, finalText, fieldName, objectIdField, nameField, sortedActivityList, activityPlannerContainer, plannerListTable, activityPlannerListRow, activityPlannerLeft = [],
                activityPlannerAddList = [], eventSearchSettingsIndex, eventFeatureObject, activityPlannerRight, name, startDateAtt, objectIDAttr, eventDataObject, objectId, featureArray = [], widgetName,
                activityList, eventSettingsWithActivity, eventSettingsWithActivityArray = [], isDataFound, t, objectIDValue;
            // Checking event search setting for setting field name and value
            if (eventSearchSettings) {
                objectIdField = eventSearchSettings.ObjectID;
                nameField = eventSearchSettings.SearchDisplayFields;
                startDateAtt = eventSearchSettings.SortingKeyField ? this.getKeyValue(eventSearchSettings.SortingKeyField) : "";
                objectIDAttr = objectIdField;
                // Looping for event search setting for getting event search index
                array.forEach(appGlobals.configData.EventSearchSettings, lang.hitch(this, function (settings, eventSettingIndex) {
                    if (settings.QueryLayerId === eventSearchSettings.QueryLayerId && settings.Title === eventSearchSettings.Title) {
                        eventSearchSettingsIndex = eventSettingIndex;
                    }
                }));
                // Looping for feature set for storing data in feature set array for further use
                if (featureSet && featureSet.features) {
                    eventFeatureObject = { "key": eventSearchSettings.ObjectID, "startDateKey": startDateAtt, "value": featureSet, "eventSettingsIndex": eventSearchSettingsIndex };
                    eventFeatureObject.value = this._changeDateFormat(eventFeatureObject.value);
                    eventFeatureObject.value.features = this._removeNullValue(eventFeatureObject.value.features);
                    this.featureSet.push(eventFeatureObject);
                }
            }
            widgetName = "Event";
            topic.publish("setEventFeatrueSet", this.featureSet);
            //hide the eventPlanner list if already present
            this._hideActivitiesList();
            activityPlannerContainer = domConstruct.create("div", { "class": "esriCTEventPlannerContainer" }, this.divEventContainer);
            plannerListTable = domConstruct.create("div", { "class": "esriCTEventPlannerListTable" }, activityPlannerContainer);
            //remove the event from eventPlanner list if it is already added to the MyList
            activityList = new Memory();
            eventSettingsWithActivity = {};
            eventSettingsWithActivityArray = [];
            // Looping feature set  for getting start date and object ID field
            if (this.featureSet && this.featureSet.length > 0) {
                array.forEach(this.featureSet, lang.hitch(this, function (featureResult, g) {
                    startDateAtt = this.featureSet[g].startDateKey;
                    objectIdField = this.featureSet[g].key;
                    // Looping feature set's feature for storing data in event and activity array for further use
                    array.forEach(this.featureSet[g].value.features, function (featureSet, index) {
                        isDataFound = false;
                        // Checking my list store data
                        if (this.myListStore.length > 0) {
                            // Looping in my list store array
                            for (t = 0; t < this.myListStore.length; t++) {
                                if (this.myListStore[t].value[this.myListStore[t].key] === featureSet.attributes[this.featureSet[g].key]) {
                                    isDataFound = true;
                                    break;
                                }
                            }
                            // If date found then set event array else activity array with data
                            if (!isDataFound) {
                                activityList.add(featureSet.attributes);
                                eventSettingsWithActivity = { "index": index, "eventSettingsIndex": this.featureSet[g].eventSettingsIndex };
                                index++;
                                eventSettingsWithActivityArray.push(eventSettingsWithActivity);
                            }
                        } else {
                            activityList.add(featureSet.attributes);
                            eventSettingsWithActivity = { "index": index, "eventSettingsIndex": this.featureSet[g].eventSettingsIndex };
                            index++;
                            eventSettingsWithActivityArray.push(eventSettingsWithActivity);
                        }
                    }, this);
                }));
            }
            //display an error message when no eventPlanner in the list
            if (this.featureSet && this.featureSet.length === 1 && (this.featureSet[0].value.features.length === 0 || (eventFeatureObject && eventFeatureObject.value.features.length === 0))) {
                activityPlannerListRow = domConstruct.create("div", { "class": "esriCTEventPlannerListError", "innerHTML": sharedNls.errorMessages.invalidSearch }, plannerListTable);
            } else if (this.myFromDate.value && this.myToDate.value && activityList.data.length === 0) {
                activityPlannerListRow = domConstruct.create("div", { "class": "esriCTEventPlannerListAddToList", "innerHTML": sharedNls.errorMessages.addedActivities }, plannerListTable);
                domClass.replace(plannerListTable, "esriCTPlannerListAddedActivities", "esriCTEventPlannerListTable");
            }
            //sort the eventPlanner list on event start date
            sortedActivityList = activityList.query({}, { sort: [{ attribute: startDateAtt, ascending: true }] });
            // Looping for sorted activity list for setting data in event searh panel
            array.forEach(sortedActivityList, function (eventPlanner, k) {
                var configEventSettings, activityPlannerAddListObject;
                configEventSettings = appGlobals.configData.EventSearchSettings[0];
                nameField = configEventSettings.SearchDisplayFields;
                finalText = "";
                splitedField = configEventSettings.SearchDisplaySubFields ? configEventSettings.SearchDisplaySubFields.split(',') : "";
                array.forEach(splitedField, function (splitedFieldValue, splitedFieldIndex) {
                    fieldName = this.getKeyValue(splitedFieldValue);
                    fieldValue = eventPlanner[fieldName] !== appGlobals.configData.ShowNullValueAs ? eventPlanner[fieldName] : "";
                    finalText = finalText === "" ? fieldValue : finalText + (fieldValue === "" ? fieldValue : ", " + fieldValue);
                }, this);
                objectIDAttr = configEventSettings.ObjectID;
                name = string.substitute(nameField, eventPlanner);
                objectIDValue = eventPlanner[objectIDAttr];
                activityPlannerListRow = domConstruct.create("div", { "class": "esriCTEventPlannerList" }, plannerListTable);
                activityPlannerLeft[k] = domConstruct.create("div", { "class": "esriCTEventPlannerLeft", "value": eventPlanner }, activityPlannerListRow);
                if (!name) {
                    name = appGlobals.configData.ShowNullValueAs;
                }
                domConstruct.create("div", { "class": "esriCTEventPlannerText", "innerHTML": name }, activityPlannerLeft[k]);
                domConstruct.create("div", { "class": "esriCTEventPlannerDates", "innerHTML": finalText }, activityPlannerLeft[k]);
                activityPlannerRight = domConstruct.create("div", { "class": "esriCTEventPlannerRight" }, activityPlannerListRow);
                if (dijit.registry.byId("myList")) {
                    activityPlannerAddList[k] = domConstruct.create("div", { "class": "esriCTEventPlannerAddlist", "title": sharedNls.tooltips.addToListTooltip }, activityPlannerRight);
                    domAttr.set(activityPlannerAddList[k], "ObjectIDField", objectIDAttr);
                    domAttr.set(activityPlannerAddList[k], "StartDateField", startDateAtt);
                    domAttr.set(activityPlannerAddList[k], "objectIDValue", objectIDValue);
                    activityPlannerAddListObject = { "activityPlannerAddList": activityPlannerAddList, "activityPlannerLeft": activityPlannerLeft, "widgetName": widgetName, "eventSearchSettings": configEventSettings };

                    // On click on add to list button
                    this.own(on(activityPlannerAddList[k], a11yclick, lang.hitch(this, function (event) {
                        this._clickOnActivityPlannerAddList(event, activityPlannerAddListObject);
                    })));
                }
                // On click on event row to show info window
                this.own(on(activityPlannerLeft[k], a11yclick, lang.hitch(this, function (event) {
                    this._clickOnActivityPlannerLeft(event, configEventSettings);
                })));
            }, this);
            // function for share in the case of event search from event search
            setTimeout(lang.hitch(this, function () {
                var searchSettings, startDateAttribute, settingsName, settingsIndex, g, searchSetting, queryLayerId;
                // Checking share url for adding item in my list panel
                if (window.location.href.split("$eventIndex=")[1] && window.location.href.split("$eventIndex=")[1].substring(0, 16) !== "$eventRoutePoint" && this.isEventShared) {
                    // Looping url's object id for storing data in my list panel
                    array.forEach(window.location.href.split("$eventIndex=")[1].split("$")[0].split(","), lang.hitch(this, function (objectIdOfEvent) {
                        // Looping feature set for getting feature information
                        if (this.featureSet && this.featureSet.length > 0) {
                            array.forEach(this.featureSet, lang.hitch(this, function (featureSetResult) {
                                searchSettings = appGlobals.configData.EventSearchSettings[featureSetResult.eventSettingsIndex];
                                startDateAttribute = searchSettings.SortingKeyField ? this.getKeyValue(searchSettings.SortingKeyField) : "";
                                queryLayerId = parseInt(searchSettings.QueryLayerId, 10);
                                array.forEach(featureSetResult.value.features, lang.hitch(this, function (featureSet, indexNumber) {
                                    if (Number(objectIdOfEvent) === featureSet.attributes[featureSetResult.key]) {
                                        eventDataObject = { "eventDetails": featureSet.attributes, "featureSet": featureSet, "infoWindowClick": false, "layerId": queryLayerId, "layerTitle": searchSettings.Title, "ObjectIDField": searchSettings.ObjectID, "StartDateField": startDateAttribute };
                                        topic.publish("addtoMyListFunction", eventDataObject, widgetName);
                                        this.isEventShared = false;
                                    }
                                }));
                            }));
                        }
                    }));
                    // Checking share url for event route point for calculating route
                    if (window.location.toString().split("$eventRoutePoint=").length > 1 && window.location.toString().split("$eventRoutePoint=")[1].substring(0, 1) !== "$") {
                        objectId = window.location.toString().split("$eventRoutePoint=")[1].split("$")[0];
                        for (g = 0; g < this.myListStore.length; g++) {
                            if (this.myListStore[g].value[this.myListStore[g].key] === Number(objectId)) {
                                featureArray.push(this.myListStore[g].featureSet);
                                settingsName = this.myListStore[g].settingsName;
                                settingsIndex = this.myListStore[g].eventSettingsIndex;
                                appGlobals.shareOptions.infoRoutePoint = null;
                                appGlobals.shareOptions.eventRoutePoint = objectId;
                                break;
                            }
                        }
                        // Checking for setting name for getting search setting name
                        if (settingsName === "eventsettings") {
                            searchSetting = appGlobals.configData.EventSearchSettings[settingsIndex];
                        } else {
                            searchSetting = appGlobals.configData.ActivitySearchSettings[settingsIndex];
                        }
                        topic.publish("replaceApplicationHeaderContainer");
                        topic.publish("executeQueryForFeatures", featureArray, searchSetting.QueryURL, "Event");
                    }
                }
            }), 3000);
            domStyle.set(activityPlannerContainer, "display", "block");
            topic.publish("hideProgressIndicator");
        },

        /**
        * add item in my list panel
        * @param {object} activityPlannerAddListObject contains the activity Planner Add to List Object
        * @memberOf widgets/searchSetting/eventPlannerHelper
        */
        _clickOnActivityPlannerAddList: function (event, activityPlannerAddListObject) {
            var eventIndex, eventDataObject, objectIDField, startDateField, objectIDValue, featureSetValue, queryLayerId;
            topic.publish("extentSetValue", true);
            eventIndex = array.indexOf(activityPlannerAddListObject.activityPlannerAddList, event.currentTarget);
            objectIDField = domAttr.get(event.currentTarget, "ObjectIDField");
            startDateField = domAttr.get(event.currentTarget, "StartDateField");
            objectIDValue = domAttr.get(event.currentTarget, "objectIDValue");
            // Checking for feature set for getting feature set for adding them in my list
            if (this.featureSet && this.featureSet.length > 0) {
                array.forEach(this.featureSet, lang.hitch(this, function (featureResult) {
                    array.forEach(featureResult.value.features, lang.hitch(this, function (featureSet, indexNumber) {
                        if (Number(objectIDValue) === featureSet.attributes[featureResult.key]) {
                            featureSetValue = featureSet;
                        }
                    }));
                }));
            }
            appGlobals.shareOptions.addToListIndex = activityPlannerAddListObject.activityPlannerAddList;
            queryLayerId = parseInt(activityPlannerAddListObject.eventSearchSettings.QueryLayerId, 10);
            eventDataObject = { "eventDetails": activityPlannerAddListObject.activityPlannerLeft[eventIndex].value, "featureSet": featureSetValue, "infoWindowClick": false, "layerId": queryLayerId, "layerTitle": activityPlannerAddListObject.eventSearchSettings.Title, "ObjectIDField": objectIDField, "StartDateField": startDateField };
            topic.publish("addtoMyListFunction", eventDataObject, activityPlannerAddListObject.widgetName);
            topic.publish("toggleWidget", "myList");
            topic.publish("showActivityPlannerContainer");
        },

        /**
        * Click on event row to show info window
        * @param {object} eventSearchSettings contains event Search Settings Object
        * @memberOf widgets/searchSetting/eventPlannerHelper
        */
        _clickOnActivityPlannerLeft: function (event, eventSearchSettings) {
            var featureData, activityListObjectId, infoWindowParameter, mapPoint;
            topic.publish("extentSetValue", true);
            activityListObjectId = event.currentTarget.value[eventSearchSettings.ObjectID];
            // Checking for feature set for getting feature data for showing info window
            if (this.featureSet && this.featureSet.length > 0) {
                array.forEach(this.featureSet, lang.hitch(this, function (featureSetData) {
                    array.forEach(featureSetData.value.features, lang.hitch(this, function (featureSet, index) {
                        if (featureSet.attributes[featureSetData.key] === activityListObjectId) {
                            featureData = featureSet;
                        }
                    }));
                }));
            }
            infoWindowParameter = {
                "mapPoint": featureData.geometry,
                "attribute": featureData.attributes,
                "layerId": eventSearchSettings.QueryLayerId,
                "layerTitle": eventSearchSettings.Title,
                "featureArray": featureData,
                "featureSet": featureData,
                "IndexNumber": 1,
                "widgetName": "listclick"
            };
            mapPoint = featureData.geometry;
            topic.publish("extentFromPoint", mapPoint);
            appGlobals.shareOptions.mapClickedPoint = mapPoint;
            topic.publish("createInfoWindowContent", infoWindowParameter);
            topic.publish("hideCarouselContainer");
            topic.publish("setZoomAndCenterAt", featureData.geometry);
        },

        /**
        * Convert the  degrees  to radians
        * @param {object} deg is degree which converts to radians
        * @return radians value
        * @memberOf widgets/searchSetting/eventPlannerHelper
        */
        deg2Rad: function (deg) {
            return (deg * Math.PI) / 180.0;
        },

        /**
        * Convert the radians to degrees
        * @param {object} rad is radians which converts to degree
        * @return degree value
        * @memberOf widgets/searchSetting/eventPlannerHelper
        */
        rad2Deg: function (rad) {
            return (rad / Math.PI) * 180.0;
        },
        /**
        * convert the UTC time stamp from Millisecond
        * @param {object} utcMilliseconds contains UTC millisecond
        * @returns Date
        * @memberOf widgets/searchSetting/eventPlannerHelper
        */
        utcTimestampFromMs: function (utcMilliseconds) {
            return this.localToUtc(new Date(utcMilliseconds));
        },

        /**
        * convert the local time to UTC
        * @param {object} localTimestamp contains Local time
        * @returns Date
        * @memberOf widgets/searchSetting/eventPlannerHelper
        */
        localToUtc: function (localTimestamp) {
            return new Date(localTimestamp.getTime());
        }
    });
});
