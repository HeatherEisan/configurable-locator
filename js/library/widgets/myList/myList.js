/*global define,dojo,alert,console*/
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
    "dojo/_base/lang",
    "dojo/on",
    "dojo/dom",
    "dojo/dom-attr",
    "dojo/dom-class",
    "dojo/_base/html",
    "dojo/dom-style",
    "dojo/text!./templates/myListTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/topic",
    "dijit/form/DateTextBox",
    "dojo/date",
    "dojo/parser",
    "dojo/date/locale",
    "dojo/_base/array",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "dojo/store/Memory",
    "esri/units",
    "dojo/string",
    "esri/request",
    "dojo/query",
    "widgets/printForEvent/printForEventWindow",
    "dijit/a11yclick"
], function (declare, domConstruct, lang, on, dom, domAttr, domClass, html, domStyle, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic, DateTextBox, date, parser, locale, array, Query, QueryTask, Memory, units, string, esriRequest, query, PrintForEventWindow, a11yclick) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,            // Variable for template string
        sharedNls: sharedNls,                // Variable for shared NLS
        todayDate: new Date(),               // Variable for geting today's date
        myListStore: [],                     // Array to store event and activity added from list
        featureSet: null,                    // Variable to store feature searched from event search
        addToListFeatures: [],               // Array to store feature added to mylist from info window or infow pod
        dateFieldArray: [],                  // Array to store date field name from layer to change date formate
        /**
        * create myList widget to store feature added from activity and event, User can search show route, add to calender, find route for list, print for list.
        *
        * @class
        * @name widgets/myList/myList
        */
        postCreate: function () {
            /**
            * minimize other open header panel widgets and show myList
            */
            topic.subscribe("toggleWidget", lang.hitch(this, function (widget) {
                // Checking if widget name is 'myList' then show panel.
                if (widget !== "myList") {
                    // Checking if panel is open for replacing class.
                    if (html.coords(this.applicationHeaderActivityContainer).h > 0) {
                        domClass.replace(this.domNode, "esriCTEventsImg", "esriCTEventsImgSelected");
                        domClass.replace(this.applicationHeaderActivityContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                    }
                }
            }));

            this.domNode = domConstruct.create("div", { "title": sharedNls.tooltips.eventsTooltips, "class": "esriCTEventsImg" }, null);
            dom.byId("esriCTParentDivContainer").appendChild(this.applicationHeaderActivityContainer);

            /** Subscribe functions for calling them from other widget */
            // Subscring for shoing myList container.
            topic.subscribe("showActivityPlannerContainer", lang.hitch(this, function () {
                this._showMyListContainer();
            }));

            // Subscring to store feature set searched from event search in eventPlannerHelper.js file.
            topic.subscribe("setEventFeatrueSet", lang.hitch(this, function (value) {
                this.featureSet = value;
            }));

            // Subscring to refresh myList panel data from other file.
            topic.subscribe("refreshMyList", lang.hitch(this, function (eventObject, widgetName) {
                this._refreshMyList(eventObject, widgetName);
            }));

            // Subscring to show route from list
            topic.subscribe("eventForListForShare", lang.hitch(this, function () {
                this._drawRouteForListItem();
            }));

            // Subscring for storing myList data from other file
            topic.subscribe("getMyListData", lang.hitch(this, function (value) {
                this.myListStore = value;
            }));

            // Subscring for replacing class
            topic.subscribe("replaceClassForMyList", lang.hitch(this, function () {
                this._replaceClassForMyList();
            }));

            // Subscring for call sort my list function from other file
            topic.subscribe("sortMyList", lang.hitch(this, function (ascendingFlag, featureSet) {
                this.sortedList = this._sortMyList(ascendingFlag, featureSet);
                topic.publish("sortMyListData", this.sortedList);
            }));

            // Subscring for replacing class for application header container.
            topic.subscribe("replaceApplicationHeaderContainer", lang.hitch(this, function () {
                domClass.replace(this.applicationHeaderActivityContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
            }));

            // Subscring for getting widget name
            topic.subscribe("showWidgetName", lang.hitch(this, function (widgetName) {
                this.widgetName = widgetName;
            }));
            /** End for subscribe function for calling them from other widget */

            /** On click functions */
            // Function to show myList container on click.
            this.own(on(this.domNode, a11yclick, lang.hitch(this, function () {
                /**
                * minimize other open header panel widgets and show events panel
                */
                topic.publish("toggleWidget", "myList");
                this._showMyListContainer();
            })));

            // Function to sort data by clicking on order by button.
            this.own(on(this.orderByDate, a11yclick, lang.hitch(this, function () {
                var isExtentSet = true, sortedMyList, eventObject, divHeaderContent;
                divHeaderContent = query('.esriCTMyListHeaderTextDisable');
                if (divHeaderContent.length > 0) {
                    return;
                }
                topic.publish("extentSetValue", isExtentSet);
                if (dojo.hasClass(this.orderByDateImage, "esriCTImgOrderByDateDown")) {
                    //sort with descending order of date
                    sortedMyList = this._sortMyList(false, this.featureSet);
                } else if (dojo.hasClass(this.orderByDateImage, "esriCTImgOrderByDateUp")) {
                    //sort with ascending order of date
                    sortedMyList = this._sortMyList(true, this.featureSet);
                }
                eventObject = { "EventDeatils": null, "SortedData": sortedMyList, "InfowindowClick": false };
                // show data in mylist panel after order by list.
                this._refreshMyList(eventObject);
            })));

            // On click on route for list icon in my list panel.
            this.own(on(this.directionForEvents, a11yclick, lang.hitch(this, function () {
                topic.publish("extentSetValue", true);
                this._drawRouteForListItem();
            })));

            // Click on print for list icon
            this.own(on(this.printEventList, a11yclick, lang.hitch(this, function () {
                topic.publish("extentSetValue", true);
                this._printForEventList();
            })));

            // On click on calender icon for list
            on(this.calenderForEvent, a11yclick, lang.hitch(this, function () {
                topic.publish("extentSetValue", true);
                this._showDataForCalendar();
            }));
            /** End of On click functions */
        },

        /**
        * Show and close My list panel
        * @memberOf widgets/myList/myList
        */
        _showMyListContainer: function () {
            if (html.coords(this.applicationHeaderActivityContainer).h > 1) {
                /**
                * when user clicks on eventPlanner icon in header panel, close the eventPlanner panel if it is open
                */
                domClass.replace(this.domNode, "esriCTEventsImg", "esriCTEventsImgSelected");
                domClass.replace(this.applicationHeaderActivityContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
            } else {
                /**
                * when user clicks on eventPlanner icon in header panel, open the eventPlanner panel if it is closed
                */
                domClass.replace(this.domNode, "esriCTEventsImgSelected", "esriCTEventsImg");
                this._showActivityTab();
                domClass.replace(this.applicationHeaderActivityContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
            }
        },

        /**
        * displays the updated and sorted list
        * @param {object} object of event deails having Event attributes, sorted event details, infowindow click
        * @param widgetName string for refresh page according to info window click
        * @memberOf widgets/myList/myList
        */
        _refreshMyList: function (eventObject, widgetName) {
            var myListContainer, searchSetting, evenObjectID, featureArray = [], startDateAttribute, isDateFound = false, startDateFeild, AddressField, myListTable, myListRow, myListLeft = [], myListRight, myListIcons, eventDate, name, address, objectIdField, myListDeleteIcon = [], splitedField,
                directionAcitivityList = [], addToCalender = [], layerId, layerTitle, n;
            topic.publish("showProgressIndicator");
            dojo.addToListEvents = eventObject;
            // Checking feature set data length for removing null value from features.
            if (this.featureSet && this.featureSet.length > 0) {
                for (n = 0; n < this.featureSet.length; n++) {
                    this.featureSet[n].value.features = this._removeNullValue(this.featureSet[n].value.features);
                }
            }
            // Checking added feature details for getting object id value.
            if (eventObject.EventDeatils) {
                evenObjectID = string.substitute("${" + eventObject.key + "}", eventObject.EventDeatils);
            }
            // Checking activity list container's length
            if (this.activityList.childNodes.length > 1) {
                domConstruct.destroy(this.activityList.children[1]);
            }
            myListContainer = domConstruct.create("div", { "class": "esriCTMyListContainer" }, this.activityList);
            myListTable = domConstruct.create("div", { "class": "esriCTMyListTable" }, myListContainer);
            // Looping for creating row in my list panel from sorted data.
            array.forEach(eventObject.SortedData, function (myListEvent, j) {
                var isStartDateFound = false;
                // Checking if my list item's search setting name for getting value from config.
                if (myListEvent.settingsName === "eventsettings") {
                    searchSetting = dojo.configData.EventSearchSettings;
                } else {
                    searchSetting = dojo.configData.ActivitySearchSettings;
                }
                // Checking if my list item's search setting name for getting value from config.
                if (myListEvent.settingsName === "eventsettings") {
                    splitedField = searchSetting[myListEvent.eventSettingsIndex].SearchDisplaySubFields.split(',');
                    startDateFeild = splitedField[0];
                    AddressField = splitedField[1];
                    startDateAttribute = this._getKeyValue(startDateFeild);
                    name = string.substitute(searchSetting[myListEvent.eventSettingsIndex].SearchDisplayFields, myListEvent.value);
                    eventDate = myListEvent.value[myListEvent.startDateField];
                    address = string.substitute(AddressField, myListEvent.value);
                    layerId = searchSetting[myListEvent.eventSettingsIndex].QueryLayerId;
                    layerTitle = searchSetting[myListEvent.eventSettingsIndex].Title;
                } else {
                    name = string.substitute(searchSetting[0].SearchDisplayFields, myListEvent.value);
                    eventDate = sharedNls.showNullValue;
                    address = sharedNls.showNullValue;
                    layerId = searchSetting[0].QueryLayerId;
                    layerTitle = searchSetting[0].Title;

                }
                objectIdField = string.substitute("${" + myListEvent.key + "}", myListEvent.value);
                myListRow = domConstruct.create("div", { "class": "esriCTMyListRow" }, myListTable);
                myListLeft[j] = domConstruct.create("div", { "class": "esriCTMyListLeft", "value": myListEvent.value }, myListRow);
                // Checking if name field has no value then set to N/A
                if (!name) {
                    name = sharedNls.showNullValue;
                }
                domConstruct.create("div", { "class": "esriCTMyListText", "innerHTML": name }, myListLeft[j]);
                // Checking if address field has no value then set to N/A
                if (!address) {
                    address = sharedNls.showNullValue;
                }
                // Checking if eventDate field has no value then do not set event date and address
                if (eventDate !== sharedNls.showNullValue) {
                    domConstruct.create("div", { "class": "esriCTMyListDates", "innerHTML": eventDate + "," + " " + address }, myListLeft[j]);
                }
                myListRight = domConstruct.create("div", { "class": "esriCTMyListRight" }, myListRow);
                myListIcons = domConstruct.create("div", { "class": "esriCTMyListIcons" }, myListRight);
                domAttr.set(myListLeft[j], "LayerId", layerId);
                domAttr.set(myListLeft[j], "LayerTitle", layerTitle);
                // On click on my list item to show info window.
                on(myListLeft[j], a11yclick, lang.hitch(this, function (event) {
                    this._clickOnMyListRow(event);
                }));
                directionAcitivityList[j] = domConstruct.create("div", { "title": sharedNls.tooltips.routeTooltips, "class": "esriCTDirectionEventList", "value": myListEvent.value }, myListIcons);
                domAttr.set(directionAcitivityList[j], "ObjectID", objectIdField);
                domAttr.set(directionAcitivityList[j], "LayerId", layerId);
                domAttr.set(directionAcitivityList[j], "LayerTitle", layerTitle);
                // On click on my list item to calculate route and show data in bottom pod.
                on(directionAcitivityList[j], a11yclick, lang.hitch(this, function (event) {
                    this._clickOnRouteButton(event, directionAcitivityList[j], featureArray, eventObject);
                }));
                // Checking if list have no start date attribute.
                if (myListEvent.startDateField !== "") {
                    isStartDateFound = true;
                    isDateFound = true;
                }
                // If start date found then change the add to calendar icon color.
                if (isStartDateFound) {
                    addToCalender[j] = domConstruct.create("div", { "title": sharedNls.tooltips.addToCalanderTooltips, "class": "esriCTAddEventList" }, myListIcons);
                    domAttr.set(addToCalender[j], "WidgetName", "eventlistitem");
                } else {
                    addToCalender[j] = domConstruct.create("div", { "title": sharedNls.tooltips.addToCalanderTooltips, "class": "esriCTActivityCalender" }, myListIcons);
                    domAttr.set(addToCalender[j], "WidgetName", "activitylistitem");
                }
                domAttr.set(addToCalender[j], "ObjectID", objectIdField);
                // On click on my list add to calendar icon
                this.own(on(addToCalender[j], a11yclick, lang.hitch(this, function (event) {
                    this._clickOnAddToCalander(event);
                })));
                myListDeleteIcon[j] = domConstruct.create("div", { "title": sharedNls.tooltips.deleteFromListTooltips, "class": "esriCTDeleteEventList" }, myListIcons);
                domAttr.set(myListDeleteIcon[j], "ID", myListEvent.id);
                //if new event is being added, highlight the added event
                if (eventObject.EventDeatils) {
                    if (objectIdField === evenObjectID) {
                        domClass.add(myListRow, "esriCTMyListRowChecked");
                    }
                } else {
                    domClass.remove(myListRow, "esriCTMyListRowChecked");
                }
                domAttr.set(myListDeleteIcon[j], "ObjectID", objectIdField);
                domAttr.set(myListDeleteIcon[j], "SettingsName", myListEvent.settingsName);
                domAttr.set(myListDeleteIcon[j], "StartDate", startDateAttribute);
                // On click to delete item from my list
                this.own(on(myListDeleteIcon[j], a11yclick, lang.hitch(this, function (event) {
                    this._clickOnMyListDeleteIcon(event, myListDeleteIcon, myListLeft, eventObject);
                })));
            }, this);
            domStyle.set(myListTable, "display", "block");
            widgetName = "Event";
            if (isDateFound) {
                domClass.replace(this.calenderForEvent, "esriCTHeaderAddAcitivityList", "esriCTHeaderAddAcitivityListDisable");
            } else {
                domClass.replace(this.calenderForEvent, "esriCTHeaderAddAcitivityListDisable", "esriCTHeaderAddAcitivityList");
            }
            if (!isDateFound) {
                domClass.replace(this.orderByDateList, "esriCTMyListHeaderTextDisable", "esriCTMyListHeaderText");
                domClass.replace(this.orderByDateImage, "esriCTImgOrderByDateDownDisable", "esriCTImgOrderByDateDown");
                domClass.replace(this.orderByDateImage, "esriCTImgOrderByDateDisable", "esriCTImgOrderByDate");
                domClass.replace(this.orderByDateImage, "esriCTImgOrderByDateDisable", "esriCTImgOrderByDateUp");
            }
            topic.publish("hideProgressIndicator");
        },

        /**
        * Function to show info window on the click of my list item
        * @param {event} event contains the event data
        * @memberOf widgets/myList/myList
        */
        _clickOnMyListRow: function (event) {
            var featureData, mapPoint, objectIDforRow, LayerId, LayerTitle, g, activityListObjectId, infoWindowParameter;
            topic.publish("hideCarouselContainer");
            LayerId = domAttr.get(event.currentTarget, "LayerId");
            LayerTitle = domAttr.get(event.currentTarget, "LayerTitle");
            topic.publish("extentSetValue", true);
            objectIDforRow = this.getObjectIdFromSettings(LayerId, LayerTitle);
            activityListObjectId = event.currentTarget.value[objectIDforRow];
            // Looping for getting feaure data for showing info window.
            for (g = 0; g < this.myListStore.length; g++) {
                if (this.myListStore[g].value[this.myListStore[g].key] === Number(activityListObjectId)) {
                    featureData = this.myListStore[g].featureSet;
                    break;
                }
            }
            infoWindowParameter = {
                "mapPoint": featureData.geometry,
                "attribute": featureData.attributes,
                "layerId": LayerId,
                "layerTitle": LayerTitle,
                "featureArray": featureData,
                "featureSet": featureData,
                "IndexNumber": 1,
                "widgetName": "listclick"
            };
            mapPoint = featureData.geometry;
            topic.publish("extentFromPoint", mapPoint);
            dojo.mapClickedPoint = mapPoint;
            topic.publish("createInfoWindowContent", infoWindowParameter);
            this.setZoomAndCenterAt(featureData.geometry);
        },

        /**
        * Function get object id on the basic of layer id and layer title
        * @param {LayerId} layer id value
        * @param {LayerTitle} layer title value
        * @memberOf widgets/myList/myList
        */
        getObjectIdFromSettings: function (LayerId, LayerTitle) {
            var objectID;
            // Looping for getting object id from event search.
            array.forEach(dojo.configData.EventSearchSettings, lang.hitch(this, function (settings, eventSettingIndex) {
                if (settings.QueryLayerId === LayerId && settings.Title === LayerTitle) {
                    objectID = settings.ObjectID;
                }
            }));
            // Looping for getting object id from activity search.
            array.forEach(dojo.configData.ActivitySearchSettings, lang.hitch(this, function (settings, activitySettingIndex) {
                if (settings.QueryLayerId === LayerId && settings.Title === LayerTitle) {
                    objectID = settings.ObjectID;
                }
            }));
            return objectID;
        },

        /**
        * Function get object id on the basic of setting name
        * @param {LayerId} layer id value
        * @param {LayerTitle} layer title value
        * @memberOf widgets/myList/myList
        */
        getObjectIdFromAddToList: function (featureData) {
            var objectID, searchSetting;
            // Checking for setting name for setting search setting and returning  object id field.
            if (featureData.settingsName === "eventsettings") {
                searchSetting = dojo.configData.EventSearchSettings[featureData.settingsIndex];
            } else if (featureData.settingsName === "activitysettings") {
                searchSetting = dojo.configData.ActivitySearchSettings[featureData.settingsIndex];
            }
            if (searchSetting) {
                objectID = searchSetting.ObjectID;
            }
            return objectID;
        },

        /**
        * Function get object id on the basic of setting name
        * @param {LayerId} layer id value
        * @param {LayerTitle} layer title value
        * @memberOf widgets/myList/myList
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
        * Function to show route on the click of my list item
        * @param {directionAcitivityList} event contains the event data
        * @param {featureArray} event feature
        * @param {eventObject} contains event data information
        * @memberOf widgets/myList/myList
        */
        _clickOnRouteButton: function (event, directionAcitivityList, featureArray, eventObject) {
            var infoLayerId, infoLayerTitle, widgetName, queryURL;
            topic.publish("extentSetValue", true);
            infoLayerId = domAttr.get(event.currentTarget, "LayerId");
            infoLayerTitle = domAttr.get(event.currentTarget, "LayerTitle");
            queryURL = this.getQueryUrl(infoLayerId, infoLayerTitle);
            topic.publish("getInfowWindowWidgetName", infoLayerTitle, infoLayerId);
            // Checking for widget name to show widget name
            if (this.widgetName === "InfoActivity") {
                widgetName = "activitysearch";
            } else if (this.widgetName === "InfoEvent") {
                widgetName = "event";
            }
            domClass.replace(this.domNode, "esriCTEventsImg", "esriCTEventsImgSelected");
            this._drawRouteForSingleListItem(directionAcitivityList, featureArray, eventObject, widgetName, queryURL);
        },

        /**
        * Function for add an event to calander on the click of Add To Calander
        * @param {event} event contains the event data
        * @memberOf widgets/myList/myList
        */
        _clickOnAddToCalander: function (event) {
            var featureData = [], l, layerName, layerInfowData;
            layerInfowData = domAttr.get(event.currentTarget, "ObjectID");
            layerName = domAttr.get(event.currentTarget, "WidgetName");
            // Checking for layer name to store feature data to create ICS file to adding them in calendar.
            if (layerName === "eventlistitem") {
                for (l = 0; l < this.myListStore.length; l++) {
                    if (this.myListStore[l].value[this.myListStore[l].key] === Number(layerInfowData)) {
                        featureData.push(this.myListStore[l]);
                        break;
                    }
                }
                this._createICSFile(featureData); //passing the parameter as array becasue this will create single ICS file.
            }
        },

        /**
        * Function to delete an event/facility from my list on the click of My List Delete Icon
        * @param {myListDeleteIcon} myListDeleteIcon object
        * @param {myListLeft} myListLeft having  data of my list panel
        * @param {eventObject} contains event data information
        * @memberOf widgets/myList/myList
        */
        _clickOnMyListDeleteIcon: function (event, myListDeleteIcon, myListLeft, eventObject) {
            var eventIndex, searchSetting, infoWindowArray = null, objId, eventIndexArray = null, infoWindowArrayActivity, objectID, eventObjectToRefresh, m, settingsName, startDate;
            topic.publish("extentSetValue", true);
            eventIndex = array.indexOf(myListDeleteIcon, event.currentTarget);
            settingsName = domAttr.get(event.currentTarget, "SettingsName");
            objectID = domAttr.get(event.currentTarget, "ObjectID");

            startDate = domAttr.get(event.currentTarget, "StartDate");
            if (settingsName === "eventsettings") {
                searchSetting = dojo.configData.EventSearchSettings;
            } else {
                searchSetting = dojo.configData.ActivitySearchSettings;
            }
            if (dojo.eventInfoWindowAttribute) {
                infoWindowArray = dojo.eventInfoWindowAttribute.split(",");
            }
            if (dojo.eventInfoWindowIdActivity) {
                infoWindowArrayActivity = dojo.eventInfoWindowIdActivity.split(",");
            }
            if (dojo.eventIndex) {
                eventIndexArray = dojo.eventIndex.split(",");
            }
            dojo.eventInfoWindowAttribute = null;
            dojo.eventIndex = null;
            for (m = 0; m < this.myListStore.length; m++) {
                objId = this.myListStore[m].value[this.myListStore[m].key].toString();
                if (infoWindowArray) {
                    if (array.indexOf(infoWindowArray, objId) > -1 && myListLeft[eventIndex].value[this.myListStore[m].key].toString() === objId) {
                        infoWindowArray.splice(array.indexOf(infoWindowArray, objId), 1);
                    }
                }
                if (infoWindowArrayActivity) {
                    if (array.indexOf(infoWindowArrayActivity, objId) > -1 && myListLeft[eventIndex].value[this.myListStore[m].key].toString() === objId) {
                        infoWindowArrayActivity.splice(array.indexOf(infoWindowArrayActivity, objId), 1);
                    }
                }
                if (eventIndexArray) {
                    if (array.indexOf(eventIndexArray, objId) > -1 && myListLeft[eventIndex].value[this.myListStore[m].key].toString() === objId) {
                        eventIndexArray.splice(array.indexOf(eventIndexArray, objId), 1);
                    }
                }
            }
            if (infoWindowArray) {
                dojo.eventInfoWindowAttribute = infoWindowArray.join(",");
            }
            if (infoWindowArrayActivity) {
                dojo.eventInfoWindowIdActivity = infoWindowArrayActivity.join(",");
            }
            if (eventIndexArray) {
                dojo.eventIndex = eventIndexArray.join(",");
            }
            eventIndex = array.indexOf(myListDeleteIcon, event.currentTarget);
            this.myListStore.splice(eventIndex, 1);
            if ((this.myListStore.length === 0)) {
                domClass.replace(this.directionForEvents, "esriCTHeaderDirectionAcitivityListDisable", "esriCTHeaderDirectionAcitivityList");
                domClass.replace(this.calenderForEvent, "esriCTHeaderAddAcitivityListDisable", "esriCTHeaderAddAcitivityList");
                domClass.replace(this.printEventList, "esriCTHeaderPrintAcitivityListDisable", "esriCTHeaderPrintAcitivityList");
                domClass.replace(this.orderByDateList, "esriCTMyListHeaderTextDisable", "esriCTMyListHeaderText");
                domClass.replace(this.orderByDateImage, "esriCTImgOrderByDateDownDisable", "esriCTImgOrderByDateDown");
                domClass.replace(this.orderByDateImage, "esriCTImgOrderByDateDisable", "esriCTImgOrderByDate");
                domClass.replace(this.orderByDateImage, "esriCTImgOrderByDateDisable", "esriCTImgOrderByDateUp");
            }
            //sort with ascending order of date
            eventObject.SortedData = this._sortMyList(true, this.featureSet);
            eventObjectToRefresh = { "EventDeatils": null, "SortedData": eventObject.SortedData, "InfowindowClick": eventObject.InfowindowClick, "layerId": searchSetting.QueryLayerId, "layerTitle": searchSetting.Title, "settingsName": settingsName, "key": objectID, "startDateField": startDate };
            this._refreshMyList(eventObjectToRefresh);
        },

        /**
        * Function to create ICS file for add to calendar button
        * @param {featureData} featureDate is a require parameter which will contain attribute information from feature.
        * @memberOf widgets/myList/myList
        */
        _createICSFile: function (featureData) {
            var calStartDate, calEndDate, searchSetting, calLocation, calSummary, calDescription, calOrganizer, sd, sd1, ed, ed1, startDateAttr, endDateAttr, summary, description, organizerAttr, addToCalendarSettings, firstFeild, secondField, thirdField, locationFirstValue, locationSecondValue, locationThirdValue;
            // Loop through the feature data for getting feature data items
            array.forEach(featureData, lang.hitch(this, function (featureDataItem, o) {
                var locationFirstValueString, locationSecondValueString, locationThirdValueString, tempString1 = "", tempString2 = "", tempString3 = "";
                if (featureDataItem.settingsName === "eventsettings") {
                    searchSetting = dojo.configData.EventSearchSettings[featureDataItem.eventSettingsIndex];
                    organizerAttr = searchSetting.AddToCalendarSettings[0].Organizer;
                    startDateAttr = this._getKeyValue(searchSetting.AddToCalendarSettings[0].StartDate);
                    endDateAttr = this._getKeyValue(searchSetting.AddToCalendarSettings[0].EndDate);
                    addToCalendarSettings = searchSetting.AddToCalendarSettings[0].Location.split(',');
                    firstFeild = addToCalendarSettings[0];
                    secondField = addToCalendarSettings[1];
                    thirdField = addToCalendarSettings[2];
                    locationFirstValue = this._getKeyValue(firstFeild);
                    locationSecondValue = this._getKeyValue(secondField);
                    locationThirdValue = this._getKeyValue(thirdField);
                    summary = this._getKeyValue(searchSetting.AddToCalendarSettings[0].Summary);
                    description = this._getKeyValue(searchSetting.AddToCalendarSettings[0].Description);
                }
                // Checking for start date
                if (startDateAttr === "") {
                    sd1 = "";
                } else {
                    calStartDate = featureDataItem.featureSet.attributes[startDateAttr];
                    sd = new Date(calStartDate);
                    sd1 = sd.getFullYear() + this._getMonth(sd) + sd.getDate() + "T020000Z";
                }
                if (endDateAttr === "") {
                    ed1 = "";
                } else {
                    calEndDate = featureDataItem.featureSet.attributes[endDateAttr];
                    ed = new Date(calEndDate);
                    ed1 = ed.getFullYear() + this._getMonth(ed) + ed.getDate() + "T100000Z";
                }
                locationFirstValueString = featureDataItem.featureSet.attributes[locationFirstValue].toString();
                locationSecondValueString = featureDataItem.featureSet.attributes[locationSecondValue].toString();
                locationThirdValueString = featureDataItem.featureSet.attributes[locationThirdValue].toString();
                // Checks the null value for location's settings first value
                if (locationFirstValueString !== sharedNls.showNullValue) {
                    tempString1 = locationFirstValueString;
                } else {
                    tempString1 = sharedNls.showNullValue;
                }
                // Checks the null value for location's settings second value
                if (locationSecondValueString !== sharedNls.showNullValue) {
                    if (locationFirstValueString !== "") {
                        tempString2 = "," + locationSecondValueString;
                    }
                } else {
                    tempString2 = sharedNls.showNullValue;
                }
                // Checks the null value for location's settings third value
                if (locationThirdValueString !== sharedNls.showNullValue) {

                    if (locationSecondValueString !== "" || locationFirstValueString !== "") {
                        tempString3 = "," + locationThirdValueString;
                    } else {
                        tempString3 = locationThirdValueString;
                    }
                } else {
                    if (locationSecondValueString !== "" || locationFirstValueString !== "") {
                        tempString3 = "," + sharedNls.showNullValue;
                    } else {
                        tempString3 = sharedNls.showNullValue;
                    }
                }
                calLocation = tempString1 + tempString2 + tempString3;
                calSummary = featureDataItem.featureSet.attributes[summary];
                calDescription = featureDataItem.featureSet.attributes[description];
                calOrganizer = organizerAttr;
                // Open Ics file for add to calendar
                window.open("ICalendar.ashx?startDate=" + sd1.toString() + "&endDate=" + ed1.toString() + "&location=" + calLocation + "&summary=" + calSummary + "&description=" + calDescription + "&organizer=" + calOrganizer + "&filename=" + calSummary);
            }));
        },

        /**
        * Function to generate ICS files in the case of multiple events.
        * @memberOf widgets/myList/myList
        */
        /*
        */
        _showDataForCalendar: function () {
            var featureArray = [], sortResult, t, sortedDataKey, startDateFound;
            sortResult = this._sortDate(this.ascendingFlag);
            for (t = 0; t < sortResult.length; t++) {
                startDateFound = false;
                // Looping fro getting date field
                for (sortedDataKey in sortResult[t].value) {
                    if (sortResult[t].value.hasOwnProperty(sortedDataKey)) {
                        if (sortedDataKey === sortResult[t].startDateField) {

                            startDateFound = true;
                            break;
                        }
                    }
                }
                // If date field found then store sorted data for creating ICS file
                if (startDateFound) {
                    featureArray.push(sortResult[t]);
                }
            }
            if (sortResult && sortResult.length > 0) {
                this._createICSFile(featureArray);
            }
        },

        /*
        * Function to get a month from a date.
        * @memberOf widgets/myList/myList
        */
        _getMonth: function (date) {
            var month = date.getMonth();
            month = month * 100 / 100 + 1;
            return month < 10 ? '0' + month : month; // ('' + month) for string result
        },

        /**
        * replace class for my list container
        * @memberOf widgets/myList/myList
        */
        _replaceClassForMyList: function () {
            domClass.replace(this.directionForEvents, "esriCTHeaderDirectionAcitivityList", "esriCTHeaderDirectionAcitivityListDisable");
            domClass.replace(this.calenderForEvent, "esriCTHeaderAddAcitivityList", "esriCTHeaderAddAcitivityListDisable");
            domClass.replace(this.printEventList, "esriCTHeaderPrintAcitivityList", "esriCTHeaderPrintAcitivityListDisable");
            domClass.replace(this.orderByDateList, "esriCTMyListHeaderText", "esriCTMyListHeaderTextDisable");
            domClass.replace(this.orderByDateImage, "esriCTImgOrderByDateDown", "esriCTImgOrderByDateDownDisable");
            domClass.replace(this.orderByDateImage, "esriCTImgOrderByDate", "esriCTImgOrderByDateDisable");
        },

        /**
        * sort my list events in ascending or descending order
        * @param string ascendingFlag contains boolean flag for ascending value
        * @param {featureSet} contains the feature set data
        * @memberOf widgets/myList/myList
        */
        _sortMyList: function (ascendingFlag, featureSet) {
            var sortResult;
            this.ascendingFlag = ascendingFlag;
            topic.publish("getMyListStoreData", this.myListStore);
            // Checking for order for data
            if (ascendingFlag) {
                if (this.myListStore.length > 0) {
                    domClass.replace(this.orderByDateImage, "esriCTImgOrderByDateDown", "esriCTImgOrderByDateUp");
                }
                sortResult = this._sortDate(ascendingFlag);
            } else {
                if (this.myListStore.length > 0) {
                    domClass.replace(this.orderByDateImage, "esriCTImgOrderByDateUp", "esriCTImgOrderByDateDown");
                }
                sortResult = this._sortDate(ascendingFlag);
            }
            return sortResult;
        },

        /**
        * sort date by order
        * @param string startDate contains date attribute
        * @param string ascendingFlag contains boolean flag for ascending value
        * @memberOf widgets/myList/myList
        */
        _sortDate: function (ascendingFlag) {
            var sortResult = [], sortedEventData = [], sortedActivityData = [], t, startDateFound, p, q, sortedDataKey, sortedDateArray;
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
        * get the key field value from the config file
        * @param {data} keyField value with $ sign
        * @memberOf widgets/myList/myList
        */
        _getKeyValue: function (data) {
            var firstPlace, secondPlace, keyValue;
            firstPlace = data.indexOf("{");
            secondPlace = data.indexOf("}");
            keyValue = data.substring(Number(firstPlace) + 1, secondPlace);
            return keyValue;
        },

        /**
        * show eventPlanner tab and block the Mylist tab
        * @memberOf widgets/myList/myList
        */
        _showActivityTab: function () {
            domStyle.set(this.activityList, "display", "block");
            domClass.replace(this.activityListTab, "esriCTEventListTabSelected", "esriCTEventListTab");
        },

        /**
        * function to draw route for single list item
        *@param {eventListObject} feature set for single event list item
        *@param {featureArray} feature array object
        *@param {eventObject} contaning the data related to event item
        *@param string widgetName contains the data from it is comming
        *@param string queryURL contains query url for layer
        * @memberOf widgets/myList/myList
        */
        _drawRouteForSingleListItem: function (eventListObject, featureArray, eventObject, widgetName, queryURL) {
            var isIndexFound = false, objectidOfEvents, g;
            dojo.infowindowDirection = null;
            topic.publish("getAcitivityListDiv", eventListObject);
            topic.publish("hideInfoWindow");
            topic.publish("showProgressIndicator");
            objectidOfEvents = domAttr.get(eventListObject, "ObjectID");
            featureArray.length = 0;
            // Looping in my list store array to get feature data
            for (g = 0; g < this.myListStore.length; g++) {
                if (this.myListStore[g].value[this.myListStore[g].key] === Number(objectidOfEvents)) {
                    featureArray.push(this.myListStore[g].featureSet);
                    dojo.eventRoutePoint = objectidOfEvents;
                    break;
                }
            }
            // Looping in feature set for getting feature type.
            if (this.featureSet && this.featureSet.length > 0) {
                array.forEach(this.featureSet, lang.hitch(this, function (featureSetData) {
                    array.forEach(featureSetData.value.features, lang.hitch(this, function (featureSet, indexNumber) {
                        if (Number(objectidOfEvents) === featureSet.attributes[featureSetData.key]) {
                            eventObject.InfowindowClick = false;
                            isIndexFound = true;
                        }
                    }));
                }));
                if (!isIndexFound) {
                    dojo.eventRoutePoint = null;
                    dojo.infoRoutePoint = Number(objectidOfEvents);
                }
            } else {
                dojo.infoRoutePoint = Number(objectidOfEvents);
            }
            domClass.replace(this.applicationHeaderActivityContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
            topic.publish("getExecuteQueryForFeatures", featureArray, queryURL, widgetName);
        },

        /**
        * convert the UTC time stamp from Millisecond
        * @returns Date
        * @param {object} utcMilliseconds contains UTC millisecond
        * @memberOf widgets/myList/myList
        */
        utcTimestampFromMs: function (utcMilliseconds) {
            return this.localToUtc(new Date(utcMilliseconds));
        },

        /**
        * convert the local time to UTC
        * @param {object} localTimestamp contains Local time
        * @returns Date
        * @memberOf widgets/myList/myList
        */
        localToUtc: function (localTimestamp) {
            return new Date(localTimestamp.getTime());
        },

        /**
        * drow route for event list items
        * @memberOf widgets/myList/myList
        */
        _drawRouteForListItem: function () {
            var eventListArrayList, q, sortResult;
            topic.publish("hideInfoWindow");
            dojo.eventForListClicked = "true";
            dojo.eventRoutePoint = null;
            dojo.addressLocation = null;
            dojo.infowindowDirection = null;
            dojo.doQuery = "false";
            dojo.searchFacilityIndex = -1;
            dojo.addressLocationDirectionActivity = null;
            dojo.sharedGeolocation = null;
            dojo.infoRoutePoint = null;
            sortResult = this._sortDate(this.ascendingFlag);
            eventListArrayList = [];
            // Looping for getting feature set.
            for (q = 0; q < sortResult.length; q++) {
                eventListArrayList.push(sortResult[q].featureSet);
            }
            if (eventListArrayList.length > 0) {
                topic.publish("eventForListClick", eventListArrayList);
            } else {
                topic.publish("hideInfoWindow");
            }
        },

        /**
        * Setting extent for gemetry on center
        * @memberOf widgets/myList/myList
        */
        setZoomAndCenterAt: function (gemetry) {
            if (window.location.href.toString().split("$extentChanged=").length > 1) {
                if (this.isExtentSet) {
                    this.map.centerAndZoom(gemetry, dojo.configData.ZoomLevel);
                }
            } else {
                this.map.centerAndZoom(gemetry, dojo.configData.ZoomLevel);
            }
        },

        /**
        * print event List data
        * @memberOf widgets/myList/myList
        */
        _printForEventList: function () {
            var directionData, activityNameField, sortedDataKey, displayDateFormat, nameField, isDataFound, splitedField, AddressField, sortResult, eventDataArray = [], l, searchSetting;
            sortResult = this._sortDate(this.ascendingFlag);
            // Looping for sort data for getting date field.
            for (l = 0; l < sortResult.length; l++) {
                isDataFound = false;
                for (sortedDataKey in sortResult[l].value) {
                    if (sortResult[l].value.hasOwnProperty(sortedDataKey)) {
                        if (sortedDataKey === sortResult[l].startDateField) {
                            isDataFound = true;
                            break;
                        }
                    }
                }
                // Checking if data is comming from event feature.
                if (sortResult[l].settingsName === "eventsettings") {
                    searchSetting = dojo.configData.EventSearchSettings;
                    displayDateFormat = searchSetting[sortResult[l].eventSettingsIndex].DisplayDateFormat;
                    nameField = this._getKeyValue(searchSetting[sortResult[l].eventSettingsIndex].SearchDisplayFields);
                    splitedField = searchSetting[sortResult[l].eventSettingsIndex].SearchDisplaySubFields.split(',');
                    AddressField = this._getKeyValue(splitedField[1]);
                } else {
                    searchSetting = dojo.configData.ActivitySearchSettings;
                    activityNameField = this._getKeyValue(searchSetting[sortResult[l].eventSettingsIndex].SearchDisplayFields);
                }
                // If date found then set address and start date field.
                if (isDataFound) {
                    directionData = {
                        "Name": sortResult[l].value[nameField] === "" ? sharedNls.showNullValue : sortResult[l].value[nameField],
                        "Address": sortResult[l].value[AddressField] === "" ? sharedNls.showNullValue : sortResult[l].value[AddressField],
                        "StartDate": sortResult[l].value[sortResult[l].startDateField] === "" ? sharedNls.showNullValue : dojo.date.locale.format(this.utcTimestampFromMs(sortResult[l].value[sortResult[l].startDateField]), { datePattern: displayDateFormat, selector: "date" })
                    };
                } else {
                    directionData = {
                        "Name": sortResult[l].value[activityNameField] === "" ? sharedNls.showNullValue : sortResult[l].value[activityNameField],
                        "Address": "",
                        "StartDate": ""
                    };
                }
                eventDataArray.push(directionData);
            }
            // If event data has value then show print for list.
            if (eventDataArray.length > 0) {
                this.printForEventList = new PrintForEventWindow({ "eventListData": eventDataArray });
            }
        },

        /**
        * Remove null value from the attribute.
        * @param {object} featureObject is object for feature
        * @return {object} feature set after removing null value
        * @memberOf widgets/myList/myList
        */
        _removeNullValue: function (featureObject) {
            var i, j;
            if (featureObject) {
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
        }
    });
});
