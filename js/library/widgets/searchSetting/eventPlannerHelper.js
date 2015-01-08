/*global define,dojo,dojoConfig:true,alert,esri,Modernizr,console*/
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

], function (declare, domConstruct, domStyle, domAttr, lang, on, array, domClass, query, string, Locator, Query, Deferred, DeferredList, QueryTask, Geometry, Graphic, locale, Point, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic, esriRequest, DateTextBox, date, parser, Memory, units, CarouselContainer, a11yclick) {
    // ========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,              // Variable for template string
        sharedNls: sharedNls,                  // Variable for shared NLS
        myListStore: [],                       // Array to store event and activity added from list
        featureSet: [],                        // Variable to store feature searched from event search
        featureSetOfInfoWindow: null,          // Variable to set feaures added from info window
        addToListFeatures: [],                 // Array to store feature added to mylist from info window or infow pod
        dateFieldArray: [],                    // Array to store date field name from layer to change date formate
        isEventShared: false,                  // variable to store event shared information

        /**
        * In this file we create event search panel UI, query on layer for getting event data, share functions
        * @memberOf widgets/searchSettings/eventPlanner
        */

        /**
        * Query for event in share window
        * @param {object} object of layer
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _queryForEventShare: function (eventObjectId) {
            var queryTask, queryLayer, eventLayer, layerRequestData;
            // Looping for event search for query on layer.
            array.forEach(dojo.configData.EventSearchSettings, (lang.hitch(this, function (eventSearchSettings) {
                eventLayer = eventSearchSettings.QueryURL;
                queryTask = new QueryTask(eventLayer);
                queryLayer = new Query();
                queryLayer.objectIds = [eventObjectId];
                queryLayer.outSpatialReference = this.map.spatialReference;
                queryLayer.returnGeometry = true;
                queryLayer.outFields = ["*"];
                layerRequestData = this._queryLayerForLayerInformation(eventLayer);
                layerRequestData.then(lang.hitch(this, function (response) {
                    topic.publish("showProgressIndicator");
                    this.dateFieldArray = this._getDateField(response);
                    queryTask.execute(queryLayer, lang.hitch(this, this._eventResult, eventSearchSettings));
                }), function (error) {
                    console.log("Error: ", error.message);
                    topic.publish("hideProgressIndicator");
                });
            })));
        },

        /**
        * Result got after query for event in share window
        * @param {eventSearchSettings} object of layer
        * @param {featureSet} object of feature set
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _eventResult: function (eventSearchSettings, featureSet) {
            var eventFeatureList = [], i, featureSetArray = [], eventDataObject, g, splitedField, startDateField, startDateAttribute;
            // If feature set got from service call then remove null value and change if date field is found
            if (featureSet) {
                featureSet.features = this._removeNullValue(featureSet.features);
                featureSet.features = this._changeDateFormatForSharedEvents(featureSet.features, eventSearchSettings);
            }
            // If feature set got from service call
            if (featureSet) {
                this.featureSetOfInfoWindow = featureSet.features;
                dojo.eventInfoWindowData = featureSet.geometry;
                // Looping feature set for getting start date field and adding them in my list
                for (i = 0; i < featureSet.features.length; i++) {
                    splitedField = eventSearchSettings.SearchDisplaySubFields.split(',');
                    startDateField = splitedField[0];
                    startDateAttribute = this._getKeyValue(startDateField);
                    eventDataObject = { "eventDetails": featureSet.features[i].attributes, "featureSet": featureSet.features[i], "infoWindowClick": true, "layerId": eventSearchSettings.QueryLayerId, "layerTitle": eventSearchSettings.Title, "ObjectIDField": eventSearchSettings.ObjectID, "StartDateField": startDateAttribute };
                    eventFeatureList.push(eventDataObject[i]);
                    this._addtoMyList(eventDataObject, "Event");
                }
                // Checking for route in shared link for calculating route
                if (window.location.toString().split("$infoRoutePoint=").length > 1) {
                    if (window.location.toString().split("$infoRoutePoint=")[1].split("$")[0]) {
                        for (g = 0; g < featureSet.features.length; g++) {
                            if (Number(window.location.toString().split("$infoRoutePoint=")[1].split("$")[0]) === featureSet.features[g].attributes[eventSearchSettings.ObjectID]) {
                                featureSetArray.push(featureSet.features[g]);
                            }
                        }
                    }
                    topic.publish("replaceApplicationHeaderContainer");
                    topic.publish("getExecuteQueryForFeatures", featureSetArray, eventSearchSettings.QueryURL, "Event");
                }
            }
        },

        /**
        * Query for activity in share window
        * @param {object} object of layer
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _queryForActivityShare: function (activityObjectId) {
            var queryTask, queryLayer, activityLayer, layerRequestData;
            // Looping for activity search for query on layer.
            array.forEach(dojo.configData.ActivitySearchSettings, (lang.hitch(this, function (ActivitySearchSettings) {
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
                    this.dateFieldArray = this._getDateField(response);
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
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _activityResult: function (ActivitySearchSettings, featureSet) {
            var activityFeatureList = [], i, featureSetArray = [], eventCalenderContainer, activityDataObject, g;
            // If feature set is found then remove null value from feature and change date formate
            if (featureSet) {
                featureSet.features = this._removeNullValue(featureSet.features);
                featureSet.features = this._changeDateFormatForSharedEvents(featureSet.features, ActivitySearchSettings);
            }
            // If feature set is found
            if (featureSet) {
                this.featureSetOfInfoWindow = featureSet.features;
                dojo.eventInfoWindowData = featureSet.geometry;
                // Looping feature set for adding item in my List
                for (i = 0; i < featureSet.features.length; i++) {
                    activityDataObject = { "eventDetails": featureSet.features[i].attributes, "featureSet": featureSet.features[i], "infoWindowClick": true, "layerId": dojo.configData.ActivitySearchSettings[0].QueryLayerId, "layerTitle": dojo.configData.ActivitySearchSettings[0].Title, "ObjectIDField": dojo.configData.ActivitySearchSettings[0].ObjectID, "StartDateField": "" };
                    activityFeatureList.push(activityDataObject[i]);
                    this._addtoMyList(activityDataObject, "activitySearch");
                }
                // Checking in shared link to calculate route
                if (window.location.toString().split("$infoRoutePoint=").length > 1) {
                    if (window.location.toString().split("$infoRoutePoint=")[1].split("$")[0]) {
                        for (g = 0; g < featureSet.features.length; g++) {
                            if (Number(window.location.toString().split("$infoRoutePoint=")[1].split("$")[0]) === featureSet.features[g].attributes[ActivitySearchSettings.ObjectID]) {
                                featureSetArray.push(featureSet.features[g]);
                            }
                        }
                    }
                    topic.publish("replaceApplicationHeaderContainer");
                    topic.publish("getExecuteQueryForFeatures", featureSetArray, dojo.configData.ActivitySearchSettings[0].QueryURL, "activitySearch");
                }
                eventCalenderContainer = query(".esriCTAddEventList")[0];
                domClass.replace(eventCalenderContainer, "esriCTActivityCalender", "esriCTAddEventList");
            }
        },

        /**
        * change the date format
        * @param {featureSet} object of featuer set
        * @param {eventSearchSettings} object of event search settings
        * @memberOf widgets/eventPlanner/eventPlanner
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
        * show event tab
        * @memberOf widgets/eventPlanner/eventPlanner
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
        * activityPlannr Date Validation
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _activityPlannerDateValidation: function () {
            var dateFormat, formattedFromDate, formattedToDate, i;
            // Looping for event planner date formate.
            for (i = 0; i < dojo.configData.EventSearchSettings.length; i++) {
                dateFormat = dojo.configData.EventSearchSettings[i].DisplayDateFormat;
            }
            // checking for my date and to date validation
            if (this.myFromDate.validate() && this.myToDate.validate()) {
                formattedFromDate = locale.format(this.myFromDate.value, { datePattern: dateFormat, selector: "date", locale: "en-us" });
                formattedToDate = locale.format(this.myToDate.value, { datePattern: dateFormat, selector: "date", locale: "en-us" });
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
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _queryForActivity: function (startDate, endDate) {
            var queryTask, queryLayer, eventLayer;
            this.dateFieldArray = null;
            dojo.eventPlannerQuery = this.myFromDate.value.toString() + "," + this.myToDate.value.toString();
            // Looping in event search setting to query  on layer
            array.forEach(dojo.configData.EventSearchSettings, (lang.hitch(this, function (eventSearchSettings) {
                eventLayer = eventSearchSettings.QueryURL;
                queryTask = new QueryTask(eventLayer);
                queryLayer = new Query();
                queryLayer.where = string.substitute(eventSearchSettings.SearchExpressionForDate, { "0": "'" + startDate + "'", "1": "'" + endDate + "'" });
                queryLayer.outSpatialReference = this.map.spatialReference;
                queryLayer.returnGeometry = true;
                queryLayer.outFields = ["*"];
                topic.publish("showProgressIndicator");
                queryTask.execute(queryLayer, lang.hitch(this, this._showActivitiesList, eventSearchSettings));
            })));
        },

        /**
        * Date validation of two dates
        * @param {object} firstDate contains first date for comparison
        * @param {object} secDate contains second date for comparison
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _isDateValid: function (firstDate, secDate) {
            var isValid = true, formattedFirstDate, formattedSecDate, dateFormat, i;
            // Looping for event search setting for getting date formate
            for (i = 0; i < dojo.configData.EventSearchSettings.length; i++) {
                dateFormat = dojo.configData.EventSearchSettings[i].DisplayDateFormat;
            }
            formattedFirstDate = locale.format(firstDate, { datePattern: dateFormat, selector: "date" });
            formattedSecDate = locale.format(secDate, { datePattern: dateFormat, selector: "date" });
            // Checking for date validation
            if (formattedFirstDate > formattedSecDate && formattedFirstDate !== formattedSecDate) {
                isValid = false;
            }
            return isValid;
        },

        /**
        * Get the layer information after doing json call
        * @param {data} layer url
        * @return layer request
        * @memberOf widgets/eventPlanner/eventPlanner
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
        * @return object Id
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
        },

        /**
        * Get date field from layer
        * @param {object} object of layer
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _getDateField: function (response) {
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
        * displays the events list
        * @param {object} featureSet contains featureSet returned by querying eventPlanner layer
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _showActivitiesList: function (eventSearchSettings, featureSet) {
            topic.publish("showProgressIndicator");
            var splitedField, startDateFeild, objectIdField, nameField, sortedActivityList, activityPlannerContainer, plannerListTable, activityPlannerListRow, activityPlannerLeft = [],
                activityPlannerAddList = [], eventSearchSettingsIndex, eventFeatureObject, activityPlannerRight, name, startDate, address, startDateAtt, objectIDAttr, eventDataObject, objectId, featureArray = [], widgetName,
                activityList, eventSettingsWithActivity, eventSettingsWithActivityArray = [], isDataFound, t, objectIDValue;
            // Checking event search setting for setting field name and value
            if (eventSearchSettings) {
                objectIdField = eventSearchSettings.ObjectID;
                nameField = eventSearchSettings.SearchDisplayFields;
                splitedField = eventSearchSettings.SearchDisplaySubFields.split(',');
                startDateFeild = splitedField[0];
                startDateAtt = this._getKeyValue(startDateFeild);
                objectIDAttr = objectIdField;
                // Looping for event search setting for getting event search index
                array.forEach(dojo.configData.EventSearchSettings, lang.hitch(this, function (settings, eventSettingIndex) {
                    if (settings.QueryLayerId === eventSearchSettings.QueryLayerId && settings.Title === eventSearchSettings.Title) {
                        eventSearchSettingsIndex = eventSettingIndex;
                    }
                }));
                // Looping for feature set for storing data in feature set array for further use
                if (featureSet && featureSet.features) {
                    eventFeatureObject = { "key": eventSearchSettings.ObjectID, "startDateKey": startDateAtt, "value": featureSet, "eventSettingsIndex": eventSearchSettingsIndex };
                    eventFeatureObject.value = this._changeDateFormat(eventFeatureObject.value, eventSearchSettings);
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
            if (eventFeatureObject && eventFeatureObject.value.features.length === 0) {
                activityPlannerListRow = domConstruct.create("div", { "class": "esriCTEventPlannerListError", "innerHTML": sharedNls.errorMessages.invalidSearch }, plannerListTable);
            } else if (this.myFromDate.value && this.myToDate.value && activityList.data.length === 0) {
                activityPlannerListRow = domConstruct.create("div", { "class": "esriCTEventPlannerListAddToList", "innerHTML": sharedNls.errorMessages.addedActivities }, plannerListTable);
                domClass.replace(plannerListTable, "esriCTPlannerListAddedActivities", "esriCTEventPlannerListTable");
            }
            //sort the eventPlanner list on event start date
            sortedActivityList = activityList.query({}, { sort: [{ attribute: startDateAtt, ascending: true}] });
            // Looping for sorted activity list for setting data in event searh panel
            array.forEach(sortedActivityList, function (eventPlanner, k) {
                var configEventSettings, activityPlannerAddListObject, AddressField;
                configEventSettings = dojo.configData.EventSearchSettings[0];
                nameField = configEventSettings.SearchDisplayFields;
                splitedField = configEventSettings.SearchDisplaySubFields.split(',');
                startDateFeild = splitedField[0];
                AddressField = splitedField[1];
                objectIDAttr = configEventSettings.ObjectID;
                name = string.substitute(nameField, eventPlanner);
                startDate = string.substitute(startDateFeild, eventPlanner);
                address = string.substitute(AddressField, eventPlanner);
                objectIDValue = eventPlanner[objectIDAttr];
                activityPlannerListRow = domConstruct.create("div", { "class": "esriCTEventPlannerList" }, plannerListTable);
                activityPlannerLeft[k] = domConstruct.create("div", { "class": "esriCTEventPlannerLeft", "value": eventPlanner }, activityPlannerListRow);
                if (!name) {
                    name = sharedNls.showNullValue;
                }
                domConstruct.create("div", { "class": "esriCTEventPlannerText", "innerHTML": name }, activityPlannerLeft[k]);
                //convert the date in millisecond to display date format
                if (!address) {
                    address = sharedNls.showNullValue;
                }
                domConstruct.create("div", { "class": "esriCTEventPlannerDates", "innerHTML": startDate + "," + " " + address }, activityPlannerLeft[k]);
                activityPlannerRight = domConstruct.create("div", { "class": "esriCTEventPlannerRight" }, activityPlannerListRow);
                activityPlannerAddList[k] = domConstruct.create("div", { "class": "esriCTEventPlannerAddlist" }, activityPlannerRight);
                domConstruct.create("div", { "class": "esriCTEventPlannerAddlistText", "innerHTML": sharedNls.titles.addToListTitle }, activityPlannerAddList[k]);
                domConstruct.create("div", { "class": "esriCTPlusRound" }, activityPlannerAddList[k]);
                domAttr.set(activityPlannerAddList[k], "ObjectIDField", objectIDAttr);
                domAttr.set(activityPlannerAddList[k], "StartDateField", startDateAtt);
                domAttr.set(activityPlannerAddList[k], "objectIDValue", objectIDValue);
                activityPlannerAddListObject = { "activityPlannerAddList": activityPlannerAddList, "activityPlannerLeft": activityPlannerLeft, "widgetName": widgetName, "eventSearchSettings": configEventSettings };
                // On click on add to list button
                this.own(on(activityPlannerAddList[k], a11yclick, lang.hitch(this, function (event) {
                    this._clickOnActivityPlannerAddList(event, activityPlannerAddListObject);
                })));
                // On click on event row to show info window
                this.own(on(activityPlannerLeft[k], a11yclick, lang.hitch(this, function (event) {
                    this._clickOnActivityPlannerLeft(event, configEventSettings);
                })));
            }, this);
            setTimeout(lang.hitch(this, function () {
                var searchSettings, startDateData, startDateAttribute, settingsName, settingsIndex, g, searchSetting;
                // Checking share url for adding item in my list panel
                if (window.location.href.split("$eventIndex=")[1] && window.location.href.split("$eventIndex=")[1].substring(0, 16) !== "$eventRoutePoint" && this.isEventShared) {
                    // Looping url's object id for storing data in my list panel
                    array.forEach(window.location.href.split("$eventIndex=")[1].split("$")[0].split(","), lang.hitch(this, function (objectIdOfEvent, a) {
                        // Looping feature set for getting feature information
                        if (this.featureSet && this.featureSet.length > 0) {
                            array.forEach(this.featureSet, lang.hitch(this, function (featureSetResult) {
                                searchSettings = dojo.configData.EventSearchSettings[featureSetResult.eventSettingsIndex];
                                splitedField = searchSettings.SearchDisplaySubFields.split(',');
                                startDateData = splitedField[0];
                                startDateAttribute = this._getKeyValue(startDateData);
                                array.forEach(featureSetResult.value.features, lang.hitch(this, function (featureSet, indexNumber) {
                                    if (Number(objectIdOfEvent) === featureSet.attributes[featureSetResult.key]) {
                                        eventDataObject = { "eventDetails": featureSet.attributes, "featureSet": featureSet, "infoWindowClick": false, "layerId": searchSettings.QueryLayerId, "layerTitle": searchSettings.Title, "ObjectIDField": searchSettings.ObjectID, "StartDateField": startDateAttribute };
                                        this._addtoMyList(eventDataObject, widgetName);
                                        this.isEventShared = false;
                                    }
                                }));
                            }));
                        }
                    }));
                    // Checking share url for event route poing for calculating route
                    if (window.location.toString().split("$eventRoutePoint=").length > 1 && window.location.toString().split("$eventRoutePoint=")[1].substring(0, 1) !== "$") {
                        if (window.location.toString().split("$sharedGeolocation=")[1] && window.location.toString().split("$sharedGeolocation=")[1].substring(0, 5) === "false") {
                            objectId = window.location.toString().split("$eventRoutePoint=")[1].split("$")[0];
                            for (g = 0; g < this.myListStore.length; g++) {
                                if (this.myListStore[g].value[this.myListStore[g].key] === Number(objectId)) {
                                    featureArray.push(this.myListStore[g].featureSet);
                                    settingsName = this.myListStore[g].settingsName;
                                    settingsIndex = this.myListStore[g].eventSettingsIndex;
                                    dojo.infoRoutePoint = null;
                                    dojo.eventRoutePoint = objectId;
                                    break;
                                }
                            }
                            // Checking for setting name for getting search setting name
                            if (settingsName === "eventsettings") {
                                searchSetting = dojo.configData.EventSearchSettings[settingsIndex];
                            } else {
                                searchSetting = dojo.configData.ActivitySearchSettings[settingsIndex];
                            }
                            topic.publish("replaceApplicationHeaderContainer");
                            topic.publish("getExecuteQueryForFeatures", featureArray, searchSetting.QueryURL, "Event");
                        } else if (window.location.toString().split("$eventRouteforList=").length > 1) {
                            topic.publish("eventForListForShare");
                        }
                    } else if (window.location.toString().split("$eventRouteforList=").length > 1) {
                        topic.publish("eventForListForShare");
                    }
                }
            }), 3000);
            domStyle.set(activityPlannerContainer, "display", "block");
            topic.publish("hideProgressIndicator");
        },

        /**
        * add item in my list panel
        * @param {activityPlannerAddListObject} contains the activity Planner Add to List Object
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _clickOnActivityPlannerAddList: function (event, activityPlannerAddListObject) {
            var eventIndex, eventDataObject, objectIDField, startDateField, objectIDValue, featureSetValue;
            topic.publish("extentSetValue", true);
            eventIndex = array.indexOf(activityPlannerAddListObject.activityPlannerAddList, event.currentTarget);
            objectIDField = domAttr.get(event.currentTarget, "ObjectIDField");
            startDateField = domAttr.get(event.currentTarget, "StartDateField");
            objectIDValue = domAttr.get(event.currentTarget, "objectIDValue");
            // Checking for feature set for gegging feature set for adding them in my list
            if (this.featureSet && this.featureSet.length > 0) {
                array.forEach(this.featureSet, lang.hitch(this, function (featureResult) {
                    array.forEach(featureResult.value.features, lang.hitch(this, function (featureSet, indexNumber) {
                        if (Number(objectIDValue) === featureSet.attributes[featureResult.key]) {
                            featureSetValue = featureSet;
                        }
                    }));
                }));
            }
            dojo.addToListIndex = activityPlannerAddListObject.activityPlannerAddList;
            eventDataObject = { "eventDetails": activityPlannerAddListObject.activityPlannerLeft[eventIndex].value, "featureSet": featureSetValue, "infoWindowClick": false, "layerId": activityPlannerAddListObject.eventSearchSettings.QueryLayerId, "layerTitle": activityPlannerAddListObject.eventSearchSettings.Title, "ObjectIDField": objectIDField, "StartDateField": startDateField };
            this._addtoMyList(eventDataObject, activityPlannerAddListObject.widgetName);
            topic.publish("toggleWidget", "myList");
            topic.publish("showActivityPlannerContainer");
        },

        /**
        * Click on event row to show info window
        * @param {eventSearchSettings} contains theevent Search Settings Object
        * @memberOf widgets/eventPlanner/eventPlanner
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
            dojo.mapClickedPoint = mapPoint;
            this.setZoomAndCenterAt(featureData.geometry);
            this.hideCarouselContainer();
            topic.publish("createInfoWindowContent", infoWindowParameter);
        },

        /**
        * change the date format
        * @memberOf widgets/eventPlanner/eventPlanner
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
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _getKeyValue: function (data) {
            var firstPlace, secondPlace, keyValue;
            firstPlace = data.indexOf("{");
            secondPlace = data.indexOf("}");
            keyValue = data.substring(Number(firstPlace) + 1, secondPlace);
            return keyValue;
        },

        /**
        * hide eventPlanner list when date is not selected or selected date is not valid
        * @memberOf widgets/eventPlanner/eventPlanner
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
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _removeNullValue: function (featureObject) {
            var i, j;
            if (featureObject) {
                // Looping feature set object
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
        * function for adding item in my list panel
        * @param {eventDataObject} contains the event object information
        * @return {widgetName} contains the widget name
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _addtoMyList: function (eventDataObject, widgetName) {
            topic.publish("showProgressIndicator");
            var sortedMyList, eventObject, l, eventSearchSettingsIndex, listObject, settingName;
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
                sortedMyList = this.sortedList; //this._sortMyList(true, this.featureSet);
                if (!eventDataObject.infoWindowClick) {
                    eventObject = { "EventDeatils": eventDataObject.eventDetails, "SortedData": sortedMyList, "InfowindowClick": eventDataObject.infoWindowClick, "layerId": eventDataObject.layerId, "layerTitle": eventDataObject.layerTitle, "settingsName": settingName, "key": eventDataObject.ObjectIDField, "startDateField": eventDataObject.StartDateField };
                } else {
                    eventObject = { "EventDeatils": eventDataObject.eventDetails, "SortedData": sortedMyList, "InfowindowClick": eventDataObject.infoWindowClick, "layerId": eventDataObject.layerId, "layerTitle": eventDataObject.layerTitle, "settingsName": settingName, "key": eventDataObject.ObjectIDField, "startDateField": eventDataObject.StartDateField };
                }
            } else {
                eventObject = { "EventDeatils": eventDataObject.eventDetails, "SortedData": this.sortedList, "InfowindowClick": eventDataObject.infoWindowClick, "layerId": eventDataObject.layerId, "layerTitle": eventDataObject.layerTitle, "settingsName": settingName, "key": eventDataObject.ObjectIDField, "startDateField": eventDataObject.StartDateField };
            }
            topic.publish("refreshMyList", eventObject, widgetName);
            dojo.eventIndex = null;
            // Looping my list store for adding object id in an array for share application
            for (l = 0; l < this.myListStore.length; l++) {
                if (!dojo.eventInfoWindowAttribute || (dojo.eventInfoWindowAttribute && dojo.eventInfoWindowAttribute.indexOf(this.myListStore[l].value[this.myListStore[l].key].toString()) === -1)) {
                    if (dojo.eventIndex) {
                        dojo.eventIndex += "," + this.myListStore[l].value[this.myListStore[l].key].toString();
                    } else {
                        dojo.eventIndex = this.myListStore[l].value[this.myListStore[l].key].toString();
                    }
                }
            }
            topic.publish("hideProgressIndicator");
        }
    });
});
