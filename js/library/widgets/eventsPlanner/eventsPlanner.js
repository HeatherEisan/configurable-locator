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
    "dojo/text!./templates/eventsPlannerTemplate.html",
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
    "widgets/printForEvent/printForEventWindow"
], function (declare, domConstruct, lang, on, dom, domAttr, domClass, html, domStyle, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic, DateTextBox, date, parser, locale, array, Query, QueryTask, Memory, units, string, esriRequest, PrintForEventWindow) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,
        objectId: null,
        todayDate: new Date(),
        myListStore: new Memory(),
        featureSet: null,
        infowIndexForMyList: null,
        featureSetOfInfoWindow: null,
        addToListFeatures: [],
        dateFieldArray: [],
        isEventShared: false,
        /**
        * create eventsPlanner widget
        *
        * @class
        * @name widgets/eventsPlanner/eventsPlanner
        */
        postCreate: function () {
            this.myFromDate.constraints.min = this.todayDate;
            this.myToDate.constraints.min = this.todayDate;

            /**
            * minimize other open header panel widgets and show eventsPlanner
            */
            this.arrTabClass = [];
            topic.subscribe("toggleWidget", lang.hitch(this, function (widget) {
                if (widget !== "eventsPlanner") {

                    if (html.coords(this.applicationHeaderActivityContainer).h > 0) {
                        domClass.replace(this.domNode, "esriCTEventsImg", "esriCTEventsImgSelected");
                        domClass.replace(this.applicationHeaderActivityContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                    }
                }
            }));

            this.domNode = domConstruct.create("div", { "title": sharedNls.tooltips.eventsTooltips, "class": "esriCTEventsImg" }, null);
            dom.byId("esriCTParentDivContainer").appendChild(this.applicationHeaderActivityContainer);
            this.own(on(this.domNode, "click", lang.hitch(this, function () {
                /**
                * minimize other open header panel widgets and show events panel
                */
                topic.publish("toggleWidget", "eventsPlanner");
                this._showActivityPlannerContainer();
            })));
            this.own(on(this.myFromDate, "change", lang.hitch(this, function () {
                this.myToDate.reset();
                this.myToDate.constraints.min = this.myFromDate.value;
            })));
            this.own(on(this.bottonGo, "click", lang.hitch(this, function () {
                topic.publish("hideInfoWindow");
                this.featureSet = null;
                this._activityPlannerDateValidation();
            })));

            this.own(on(this.activityTab, "click", lang.hitch(this, function () {
                this._showActivityListTab();
            })));
            this.own(on(this.activityListTab, "click", lang.hitch(this, function () {
                this._showActivityTab();
            })));
            this.own(on(this.orderByDate, "click", lang.hitch(this, function () {
                var sortedMyList, eventObject;
                if (dojo.hasClass(this.orderByDateImage, "esriCTImgOrderByDateDown")) {
                    //sort with descending order of date
                    sortedMyList = this._sortMyList(false, this.featureSet);
                } else if (dojo.hasClass(this.orderByDateImage, "esriCTImgOrderByDateUp")) {
                    //sort with ascending order of date
                    sortedMyList = this._sortMyList(true, this.featureSet);
                }
                eventObject = { "EventDeatils": null, "SortedData": sortedMyList, "InfowindowClick": false };
                this._refreshMyList(eventObject);
            })));
            topic.subscribe("getInfoWidgetName", lang.hitch(this, function (value) {
                this.infowIndexForMyList = value;
            }));

            topic.subscribe("addToMyList", lang.hitch(this, function (featureArray) {
                var infoWindowClick = true, eventDataObject;
                this.featureSetOfInfoWindow = featureArray;
                this.addToListFeatures.push(this.featureSetOfInfoWindow);
                eventDataObject = { "eventDetails": featureArray.attributes, "featureSet": this.featureSet, "infoWindowClick": infoWindowClick };
                this._addtoMyList(eventDataObject);
            }));

            topic.subscribe("getEventObjectID", lang.hitch(this, function (value) {
                this.objectId = value;
            }));
            this.own(on(this.directionForEvents, "click", lang.hitch(this, function () {
                this._eventForListClick();
            })));
            this.own(on(this.printEventList, "click", lang.hitch(this, function () {
                this._printForEventList();
            })));
            setTimeout(lang.hitch(this, function () {
                if (window.location.toString().split("$eventplanner=").length > 1) {
                    var startDate, endDate;
                    startDate = window.location.toString().split("$startDate=")[1].split("$endDate=")[0].replace(new RegExp(",", 'g'), "/");
                    endDate = window.location.toString().split("$startDate=")[1].split("$endDate=")[1].split("$")[0].replace(new RegExp(",", 'g'), "/");
                    this._queryForActivity(startDate, endDate);
                    this.isEventShared = true;
                    if (window.location.toString().split("$eventRoutePoint=")[1] !== "") {
                        dojo.eventRoutePoint = window.location.toString().split("$eventRoutePoint=")[1].split("$")[0];
                        topic.publish("getExecuteQueryForFeatures", dojo.eventRoutePoint, dojo.configData.EventSearchSettings[0].QueryURL, "Event");
                    }
                }
            }), 5000);
        },

        /**
        * close eventPlanner panel if any other widget is opened
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _showActivityPlannerContainer: function () {
            if (html.coords(this.applicationHeaderActivityContainer).h > 1) {
                /**
                * when user clicks on eventPlanner icon in header panel, close the eventPlanner panel if it is open
                */
                domClass.replace(this.domNode, "esriCTEventsImg", "esriCTEventsImgSelected");
                domClass.replace(this.applicationHeaderActivityContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                // domClass.replace(this.applicationHeaderActivityContainer, "esriCTZeroHeight", "esriCTEventHeight");
            } else {
                /**
                * when user clicks on eventPlanner icon in header panel, open the eventPlanner panel if it is closed
                */
                domClass.replace(this.domNode, "esriCTEventsImgSelected", "esriCTEventsImg");
                domClass.replace(this.applicationHeaderActivityContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
            }
        },

        /**
        * displays the events list
        * @param {object} featureSet contains featureSet returned by querying eventPlanner layer
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _showActivitiesList: function (featureSet) {
            topic.publish("showProgressIndicator");
            var _self = this, splitedField, AddressField, startDateFeild, infoWindowParameter, activityListObjectId, objectIdField, displayDateFormat, nameField, activityList, sortedActivityList, activityPlannerContainer, plannerListTable, activityPlannerListRow, activityPlannerLeft = [],
                activityPlannerAddList = [], activityPlannerRight, eventDate, name, startDate, l, address, eventIndex, startDateAtt, objectIDAttr, a, eventDataObject;
            array.forEach(dojo.configData.EventSearchSettings, lang.hitch(this, function (eventSearchSettings, eventSettingIndex) {
                if (featureSet) {
                    this.featureSet = this._changeDateFormat(featureSet, eventSettingIndex);
                    this.featureSet.features = this._removeNullValue(this.featureSet.features);
                }
                objectIdField = this.objectId;
                displayDateFormat = eventSearchSettings.DisplayDateFormat;
                nameField = eventSearchSettings.SearchDisplayFields;
                splitedField = eventSearchSettings.SearchDisplaySubFields.split(',');
                startDateFeild = splitedField[0];
                AddressField = splitedField[1];
                startDateAtt = this._getKeyValue(startDateFeild);
                objectIDAttr = objectIdField;
                //hide the eventPlanner list if already present
                this._hideActivitiesList();
                activityPlannerContainer = domConstruct.create("div", { "class": "esriCTEventPlannerContainer" }, this.activityPlanner);
                plannerListTable = domConstruct.create("div", { "class": "esriCTEventPlannerListTable" }, activityPlannerContainer);
                //remove the event from eventPlanner list if it is already added to the MyList
                activityList = new Memory();
                if (this.featureSet) {
                    array.forEach(this.featureSet.features, function (feature) {
                        if (this.myListStore.query({ OBJECTID: feature.attributes[objectIDAttr] }).length === 0) {
                            activityList.add(feature.attributes);
                        }
                    }, this);
                    //display an error message when no eventPlanner in the list
                    if (this.featureSet.features.length === 0) {
                        activityPlannerListRow = domConstruct.create("div", { "class": "esriCTEventPlannerListError", "innerHTML": sharedNls.errorMessages.invalidSearch }, plannerListTable);
                    } else if (this.myFromDate.value && this.myToDate.value && activityList.data.length === 0) {
                        activityPlannerListRow = domConstruct.create("div", { "class": "esriCTEventPlannerListAddToList", "innerHTML": sharedNls.errorMessages.addedActivities }, plannerListTable);
                    }
                }
                //sort the eventPlanner list on event start date
                sortedActivityList = activityList.query({}, { sort: [{ attribute: startDateAtt, ascending: true}] });
                array.forEach(sortedActivityList, function (eventPlanner, k) {
                    name = string.substitute(nameField, eventPlanner);
                    startDate = string.substitute(startDateFeild, eventPlanner);
                    address = string.substitute(AddressField, eventPlanner);
                    activityPlannerListRow = domConstruct.create("div", { "class": "esriCTEventPlannerList" }, plannerListTable);
                    activityPlannerLeft[k] = domConstruct.create("div", { "class": "esriCTEventPlannerLeft", "value": eventPlanner }, activityPlannerListRow);
                    if (!name) {
                        name = sharedNls.showNullValue;
                    }
                    domConstruct.create("div", { "class": "esriCTEventPlannerText", "innerHTML": name }, activityPlannerLeft[k]);
                    //convert the date in millisecond to display date format
                    eventDate = dojo.date.locale.format(_self.utcTimestampFromMs(startDate), { datePattern: displayDateFormat, selector: "date" });
                    if (!address) {
                        address = sharedNls.showNullValue;
                    }
                    domConstruct.create("div", { "class": "esriCTEventPlannerDates", "innerHTML": eventDate + "," + " " + address }, activityPlannerLeft[k]);
                    activityPlannerRight = domConstruct.create("div", { "class": "esriCTEventPlannerRight" }, activityPlannerListRow);
                    activityPlannerAddList[k] = domConstruct.create("div", { "class": "esriCTEventPlannerAddlist" }, activityPlannerRight);
                    domConstruct.create("div", { "class": "esriCTEventPlannerAddlistText", "innerHTML": "Add to List" }, activityPlannerAddList[k]);
                    domConstruct.create("div", { "class": "esriCTPlusRound" }, activityPlannerAddList[k]);
                    on(activityPlannerAddList[k], "click", lang.hitch(this, function (e) {
                        eventIndex = array.indexOf(activityPlannerAddList, e.currentTarget);
                        dojo.addToListIndex = activityPlannerAddList;
                        eventDataObject = { "eventDetails": activityPlannerLeft[eventIndex].value, "featureSet": this.featureSet, "infoWindowClick": false };
                        if (dojo.eventIndex) {
                            dojo.eventIndex += "," + eventIndex.toString();
                        } else {
                            dojo.eventIndex = eventIndex.toString();
                        }
                        this._addtoMyList(eventDataObject);
                    }));

                    on(activityPlannerLeft[k], "click", lang.hitch(this, function (e) {
                        activityListObjectId = e.currentTarget.value[this.objectId];
                        var featureData;
                        if (this.featureSet) {
                            for (l = 0; l < this.featureSet.features.length; l++) {
                                if (this.featureSet.features[l].attributes[this.objectId] === activityListObjectId) {
                                    featureData = this.featureSet.features[l];
                                }
                            }
                        }
                        infoWindowParameter = {
                            "mapPoint": featureData.geometry,
                            "attribute": featureData.attributes,
                            "layerId": eventSearchSettings.QueryLayerId,
                            "layerTitle": eventSearchSettings.Title,
                            "featureArray": featureData,
                            "featureSet": featureData
                        };
                        dojo.mapClickedPoint = featureData.geometry;
                        topic.publish("createInfoWindowContent", infoWindowParameter);
                    }));
                }, this);
                setTimeout(lang.hitch(this, function () {
                    if (window.location.href.split("$eventIndex=")[1] !== "$eventRoutePoint=" && this.isEventShared) {
                        for (a = 0; a < window.location.href.split("$eventIndex=")[1].split("$")[0].split(",").length; a++) {
                            eventDataObject = { "eventDetails": activityPlannerLeft[a].value, "featureSet": this.featureSet, "infoWindowClick": false };
                            this._addtoMyList(eventDataObject);
                            this.isEventShared = false;
                        }
                    }
                }), 5000);
                domStyle.set(activityPlannerContainer, "display", "block");
            }));
            topic.publish("hideProgressIndicator");
        },

        /**
        * Get the layer information after doing json call
        * @param {data} layer url
        * @return layer request
        * @memberOf widgets/eventPlanner/eventPlanner
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
            if (this.activityPlanner.childNodes.length > 1) {
                domConstruct.destroy(this.activityPlanner.children[1]);
            }
        },

        /**
        * show eventPlanner tab and block the Mylist tab
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _showActivityTab: function () {
            domStyle.set(this.activityList, "display", "block");
            domStyle.set(this.activityPlanner, "display", "none");
            domClass.replace(this.activityTab, "esriCTEventTab", "esriCTEventTabSelected");
            domClass.replace(this.activityListTab, "esriCTEventListTabSelected", "esriCTEventListTab");
            domClass.replace(this.activityPlanner, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
        },

        /**
        * change the date format
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _changeDateFormat: function (featureSet, index) {
            var displayDateFormat = dojo.configData.EventSearchSettings[index].DisplayDateFormat, i, key, k;
            if (featureSet) {
                for (i = 0; i < this.dateFieldArray.length; i++) {
                    for (k = 0; k < featureSet.features.length; k++) {
                        for (key in featureSet.features[k].attributes) {
                            if (featureSet.features[k].attributes.hasOwnProperty(key)) {
                                if (key === this.dateFieldArray[i]) {
                                    featureSet.features[k].attributes[key] = dojo.date.locale.format(this.utcTimestampFromMs(featureSet.features[k].attributes[key]), { datePattern: displayDateFormat, selector: "date" });
                                }
                            }
                        }
                    }
                }
            }
            return featureSet;
        },

        /**
        * show Mylist tap and block the eventPlanner tab
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _showActivityListTab: function () {
            domStyle.set(this.activityList, "display", "none");
            domStyle.set(this.activityPlanner, "display", "block");
            domClass.replace(this.activityTab, "esriCTEventTabSelected", "esriCTEventTab");
            domClass.replace(this.activityPlanner, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
            domClass.replace(this.activityListTab, "esriCTEventListTab", "esriCTEventListTabSelected");
            this._showActivitiesList();
        },

        /**
        * activityPlannr Date Validation
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _activityPlannerDateValidation: function () {
            var dateFormat, formattedFromDate, formattedToDate, i;
            for (i = 0; i < dojo.configData.EventSearchSettings.length; i++) {
                dateFormat = dojo.configData.EventSearchSettings[i].DisplayDateFormat;
            }
            if (this.myFromDate.validate() && this.myToDate.validate()) {
                formattedFromDate = locale.format(this.myFromDate.value, { datePattern: dateFormat, selector: "date" });
                formattedToDate = locale.format(this.myToDate.value, { datePattern: dateFormat, selector: "date" });
                try {
                    this._queryForActivity(formattedFromDate, formattedToDate);
                    //this._queryForActivity(dojo.fromDate, dojo.toDate);
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
        * Date validation of two dates
        * @param {object} firstDate contains first date for comparison
        * @param {object} secDate contains second date for comparison
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _isDateValid: function (firstDate, secDate) {
            var isValid = true, formattedFirstDate, formattedSecDate, dateFormat, i;
            for (i = 0; i < dojo.configData.EventSearchSettings.length; i++) {
                dateFormat = dojo.configData.EventSearchSettings[i].DisplayDateFormat;
            }
            formattedFirstDate = locale.format(firstDate, { datePattern: dateFormat, selector: "date" });
            formattedSecDate = locale.format(secDate, { datePattern: dateFormat, selector: "date" });
            if (formattedFirstDate > formattedSecDate && formattedFirstDate !== formattedSecDate) {
                isValid = false;
            }
            return isValid;
        },

        _addtoMyList: function (eventDataObject) {
            topic.publish("showProgressIndicator");
            var sortedMyList, eventObject;
            //add the selected event object to the memory store
            this.myListStore.add(eventDataObject.eventDetails);
            if (this.myListStore.data.length > 0) {
                domClass.replace(this.directionForEvents, "esriCTHeaderDirectionAcitivityList", "esriCTHeaderDirectionAcitivityListDisable");
                domClass.replace(this.shareForEvent, "esriCTHeaderShareAcitivityList ", "esriCTHeaderShareAcitivityListDisable");
                domClass.replace(this.calenderForEvent, "esriCTHeaderAddAcitivityList ", "esriCTHeaderAddAcitivityListDisable");
                domClass.replace(this.printEventList, "esriCTHeaderPrintAcitivityList", "esriCTHeaderPrintAcitivityListDisable");
                domClass.replace(this.orderByDateList, "esriCTMyListHeaderText", "esriCTMyListHeaderTextDisable");
                domClass.replace(this.orderByDateImage, "esriCTImgOrderByDateDown", "esriCTImgOrderByDateDownDisable");
                domClass.replace(this.orderByDateImage, "esriCTImgOrderByDate", "esriCTImgOrderByDateDisable");
            }
            //display myList tab
            if (!eventDataObject.infowindowClick) {
                domClass.replace(this.activityTab, "esriCTEventTab", "esriCTEventTabSelected");
                domClass.replace(this.activityListTab, "esriCTEventListTabSelected", "esriCTEventListTab");
                domStyle.set(this.activityPlanner, "display", "none");
                domStyle.set(this.activityList, "display", "block");
            } else {
                domClass.replace(this.domNode, "esriCTEventsImgSelected", "esriCTEventsImg");
                domClass.replace(this.applicationHeaderActivityContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
                this._showActivityTab();
            }
            //sort with ascending order of date
            sortedMyList = this._sortMyList(true, this.featureSet);
            if (!eventDataObject.infowindowClick) {
                eventObject = { "EventDeatils": eventDataObject.eventDetails, "SortedData": sortedMyList, "InfowindowClick": eventDataObject.infowindowClick };
            } else {
                eventObject = { "EventDeatils": eventDataObject.eventDetails, "SortedData": sortedMyList, "InfowindowClick": eventDataObject.infowindowClick };
            }
            this._refreshMyList(eventObject);
            topic.publish("hideProgressIndicator");
        },

        /**
        * displays the updated and sorted list
        * @param {object} object of event deails having Event attributes, sorted event details, infowindow click
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _refreshMyList: function (eventObject) {
            topic.publish("showProgressIndicator");
            var myListContainer, isIndexFound = false, evenObjectID, featureArray = [], eventObjectToRefresh, startDateFeild, AddressField, myListTable, myListRow, myListLeft = [], myListRight, widgetName, myListIcons, eventDate, name, address, objectIdField, myListDeleteIcon = [], k, directionAcitivityList = [], objectidOfEvents, index, splitedField, eventIndex,
                activityListObjectId, l, infoWindowParameter;
            dojo.addToListEvents = eventObject;
            if (this.featureSet) {
                this.featureSet.features = this._removeNullValue(this.featureSet.features);
            }
            widgetName = "Event";
            array.forEach(dojo.configData.EventSearchSettings, lang.hitch(this, function (eventSearchSettings) {
                splitedField = eventSearchSettings.SearchDisplaySubFields.split(',');
                startDateFeild = splitedField[0];
                AddressField = splitedField[1];
                if (eventObject.EventDeatils) {
                    evenObjectID = string.substitute("${" + this.objectId + "}", eventObject.EventDeatils);
                }
                // remove the already added events to the display container while displaying
                if (this.activityList.childNodes.length > 1) {
                    domConstruct.destroy(this.activityList.children[1]);
                }
                myListContainer = domConstruct.create("div", { "class": "esriCTMyListContainer" }, this.activityList);
                myListTable = domConstruct.create("div", { "class": "esriCTMyListTable" }, myListContainer);
                array.forEach(eventObject.SortedData, function (myListEvent, j) {
                    name = string.substitute(eventSearchSettings.SearchDisplayFields, myListEvent);
                    eventDate = string.substitute(startDateFeild, myListEvent);
                    address = string.substitute(AddressField, myListEvent);
                    objectIdField = string.substitute("${" + this.objectId + "}", myListEvent);
                    myListRow = domConstruct.create("div", { "class": "esriCTMyListRow" }, myListTable);
                    myListLeft[j] = domConstruct.create("div", { "class": "esriCTMyListLeft", "value": myListEvent }, myListRow);
                    if (!name) {
                        name = sharedNls.showNullValue;
                    }
                    domConstruct.create("div", { "class": "esriCTMyListText", "innerHTML": name }, myListLeft[j]);
                    //convert the date in millisecond to display date format
                    if (!address) {
                        address = sharedNls.showNullValue;
                    }
                    domConstruct.create("div", { "class": "esriCTMyListDates", "innerHTML": eventDate + "," + " " + address }, myListLeft[j]);
                    myListRight = domConstruct.create("div", { "class": "esriCTMyListRight" }, myListRow);
                    myListIcons = domConstruct.create("div", { "class": "esriCTMyListIcons" }, myListRight);
                    on(myListLeft[j], "click", lang.hitch(this, function (e) {
                        activityListObjectId = e.currentTarget.value[this.objectId];
                        var featureData, isFeatureDataFound = false;
                        if (this.featureSet) {
                            for (l = 0; l < this.featureSet.features.length; l++) {
                                if (this.featureSet.features[l].attributes[this.objectId] === activityListObjectId) {
                                    featureData = this.featureSet.features[l];
                                    isFeatureDataFound = true;
                                }
                            }
                        }
                        if (!isFeatureDataFound) {
                            featureData = this.featureSetOfInfoWindow;
                        }
                        infoWindowParameter = {
                            "mapPoint": featureData.geometry,
                            "attribute": featureData.attributes,
                            "layerId": eventSearchSettings.QueryLayerId,
                            "layerTitle": eventSearchSettings.Title,
                            "featureArray": featureData,
                            "featureSet": featureData
                        };
                        dojo.mapClickedPoint = featureData.geometry;
                        topic.publish("createInfoWindowContent", infoWindowParameter);
                    }));
                    directionAcitivityList[j] = domConstruct.create("div", { "class": "esriCTDirectionEventList" }, myListIcons);
                    domAttr.set(directionAcitivityList[j], "ObjectID", objectIdField);
                    on(directionAcitivityList[j], "click", lang.hitch(this, function (e) {
                        topic.publish("getAcitivityListDiv", directionAcitivityList[j]);
                        topic.publish("hideInfoWindow");
                        topic.publish("showProgressIndicator");
                        objectidOfEvents = domAttr.get(e.currentTarget, "ObjectID");
                        featureArray.length = 0;
                        if (this.featureSet) {
                            for (k = 0; k < this.featureSet.features.length; k++) {
                                if (Number(objectidOfEvents) === this.featureSet.features[k].attributes[this.objectId]) {
                                    eventObject.InfowindowClick = false;
                                    index = k;
                                    isIndexFound = true;
                                    break;
                                }
                            }
                            if (isIndexFound) {
                                featureArray.push(this.featureSet.features[index]);
                                dojo.eventRoutePoint = this.featureSet.features[index].attributes.OBJECTID;
                                dojo.featureObject = this.featureSet;
                            } else {
                                featureArray.push(this.featureSetOfInfoWindow);
                            }
                        } else {
                            featureArray.push(this.featureSetOfInfoWindow);
                        }
                        topic.publish("getExecuteQueryForFeatures", featureArray, dojo.configData.EventSearchSettings[0].QueryURL, widgetName);
                    }));
                    domConstruct.create("div", { "class": "esriCTAddEventList" }, myListIcons);
                    myListDeleteIcon[j] = domConstruct.create("div", { "class": "esriCTDeleteEventList" }, myListIcons);
                    //if new event is being added, highlight the added event
                    if (eventObject.EventDeatils) {
                        if (objectIdField === evenObjectID) {
                            domClass.add(myListRow, "esriCTMyListRowChecked");
                        }
                    } else {
                        domClass.remove(myListRow, "esriCTMyListRowChecked");
                    }
                    on(myListDeleteIcon[j], "click", lang.hitch(this, function (e) {
                        eventIndex = array.indexOf(myListDeleteIcon, e.currentTarget);
                        this.myListStore.remove(myListLeft[eventIndex].value.id);
                        if (!(this.myListStore.data.length > 0)) {
                            domClass.replace(this.directionForEvents, "esriCTHeaderDirectionAcitivityListDisable", "esriCTHeaderDirectionAcitivityList");
                            domClass.replace(this.shareForEvent, "esriCTHeaderShareAcitivityListDisable", "esriCTHeaderShareAcitivityList");
                            domClass.replace(this.calenderForEvent, "esriCTHeaderAddAcitivityListDisable", "esriCTHeaderAddAcitivityList");
                            domClass.replace(this.printEventList, "esriCTHeaderPrintAcitivityListDisable", "esriCTHeaderPrintAcitivityList");
                            domClass.replace(this.orderByDateList, "esriCTMyListHeaderTextDisable", "esriCTMyListHeaderText");
                            domClass.replace(this.orderByDateImage, "esriCTImgOrderByDateDown", " esriCTImgOrderByDateDownDisable");
                            domClass.replace(this.orderByDateImage, "esriCTImgOrderByDate", "esriCTImgOrderByDateDisable");
                        }
                        //sort with ascending order of date
                        eventObject.SortedData = this._sortMyList(true, this.featureSet);
                        eventObjectToRefresh = { "EventDeatils": null, "SortedData": eventObject.SortedData, "InfowindowClick": eventObject.InfowindowClick };
                        this._refreshMyList(eventObjectToRefresh);
                    }));
                }, this);

                domStyle.set(myListTable, "display", "block");
            }));
            topic.publish("hideProgressIndicator");
        },

        /**
        * sort my list events in ascending or descending order
        * @param {object} ascendingFlag contains boolean flag for ascending value
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _sortMyList: function (ascendingFlag, featureSet) {
            this.ascendingFlag = ascendingFlag;
            var sortResult, i, startDate, startDateFeild, splitedField, _self = this;
            topic.publish("getMyListStoreData", this.myListStore);
            for (i = 0; i < dojo.configData.EventSearchSettings.length; i++) {
                splitedField = dojo.configData.EventSearchSettings[i].SearchDisplaySubFields.split(',');
                startDateFeild = splitedField[0];
                startDate = _self._getKeyValue(startDateFeild);
                if (ascendingFlag) {
                    domClass.replace(this.orderByDateImage, "esriCTImgOrderByDateDown", "esriCTImgOrderByDateUp");
                    sortResult = this.myListStore.query({}, { sort: [{ attribute: startDate, ascending: true}] });
                } else {
                    domClass.replace(this.orderByDateImage, "esriCTImgOrderByDateUp", "esriCTImgOrderByDateDown");
                    sortResult = this.myListStore.query({}, { sort: [{ attribute: startDate, descending: true}] });
                }
            }
            return sortResult;
        },

        /**
        * query events layer within given date range
        * @param {object} startDate contains user selected from date
        * @param {object} endDate contains user selected to date
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _queryForActivity: function (startDate, endDate) {
            var queryTask, queryLayer, eventLayer, layerRequestData;
            this.dateFieldArray = null;
            dojo.eventPlannerQuery = startDate.toString() + "," + endDate.toString();
            array.forEach(dojo.configData.EventSearchSettings, (lang.hitch(this, function (eventSearchSettings) {
                eventLayer = eventSearchSettings.QueryURL;
                queryTask = new QueryTask(eventLayer);
                queryLayer = new Query();
                queryLayer.where = string.substitute(eventSearchSettings.SearchExpressionForDate, { "0": "'" + startDate + "'", "1": "'" + endDate + "'" });
                //dojo.eventPlannerQuery = queryLayer.where;
                queryLayer.outSpatialReference = this.map.spatialReference;
                queryLayer.returnGeometry = true;
                queryLayer.outFields = ["*"];
                layerRequestData = this._getLayerInformation(eventLayer);
                layerRequestData.then(lang.hitch(this, function (response) {
                    topic.publish("showProgressIndicator");
                    var objectId;
                    objectId = this._getObjectId(response);
                    this.objectId = objectId;
                    this.dateFieldArray = this._getDateField(response);
                    queryTask.execute(queryLayer, lang.hitch(this, this._showActivitiesList));
                }), function (error) {
                    console.log("Error: ", error.message);
                    topic.publish("hideProgressIndicator");
                });
            })));
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
        * convert the UTC time stamp from Millisecond
        * @returns Date
        * @param {object} utcMilliseconds contains UTC millisecond
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        utcTimestampFromMs: function (utcMilliseconds) {
            return this.localToUtc(new Date(utcMilliseconds));
        },

        /**
        * convert the local time to UTC
        * @param {object} localTimestamp contains Local time
        * @returns Date
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        localToUtc: function (localTimestamp) {
            return new Date(localTimestamp.getTime() + (localTimestamp.getTimezoneOffset() * 60000));
        },

        /**
        * route for event list
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _eventForListClick: function () {
            var featureArray = [], splitedField, startDateFeild, g, k, l, featureArrayMyList, eventListArrayList, q, u, sortResult, t;
            topic.publish("hideInfoWindow");
            array.forEach(dojo.configData.EventSearchSettings, lang.hitch(this, function (eventSearchSettings) {
                splitedField = eventSearchSettings.SearchDisplaySubFields.split(',');
                startDateFeild = this._getKeyValue(splitedField[0]);
            }), this);
            if (this.myListStore.data.length > 0) {
                for (l = 0; l < this.myListStore.data.length; l++) {
                    for (k = 0; k < this.featureSet.features.length; k++) {
                        if (this.myListStore.data[l][this.objectId] === this.featureSet.features[k].attributes[this.objectId]) {
                            featureArray.push(this.featureSet.features[k]);
                        }
                    }
                    for (g = 0; g < this.addToListFeatures.length; g++) {
                        if (this.myListStore.data[l][this.objectId] === this.addToListFeatures[g].attributes[this.objectId]) {
                            featureArray.push(this.addToListFeatures[g]);
                        }
                    }
                }
                featureArrayMyList = new Memory();
                for (t = 0; t < featureArray.length; t++) {
                    featureArrayMyList.add(featureArray[t].attributes);
                }
                if (this.ascendingFlag) {
                    sortResult = featureArrayMyList.query({}, { sort: [{ attribute: startDateFeild, ascending: true}] });
                } else {
                    sortResult = featureArrayMyList.query({}, { sort: [{ attribute: startDateFeild, descending: true}] });
                }
                eventListArrayList = [];
                for (q = 0; q < sortResult.length; q++) {
                    for (u = 0; u < featureArray.length; u++) {
                        if (sortResult[q][this.objectId] === featureArray[u].attributes[this.objectId]) {
                            eventListArrayList.push(featureArray[u]);
                        }
                    }
                }
                topic.publish("eventForListClick", eventListArrayList);
            }
        },

        /**
        * print event List data
        * @memberOf widgets/eventPlanner/eventPlanner
        */
        _printForEventList: function () {
            var directionData, displayDateFormat, nameField, splitedField, startDateFeild, AddressField, sortResult, eventDataArray = [], l;
            array.forEach(dojo.configData.EventSearchSettings, lang.hitch(this, function (eventSearchSettings) {
                displayDateFormat = eventSearchSettings.DisplayDateFormat;
                nameField = this._getKeyValue(eventSearchSettings.SearchDisplayFields);
                splitedField = eventSearchSettings.SearchDisplaySubFields.split(',');
                startDateFeild = this._getKeyValue(splitedField[0]);
                AddressField = this._getKeyValue(splitedField[1]);
            }), this);
            if (this.ascendingFlag) {
                sortResult = this.myListStore.query({}, { sort: [{ attribute: startDateFeild, ascending: true}] });
            } else {
                sortResult = this.myListStore.query({}, { sort: [{ attribute: startDateFeild, descending: true}] });
            }
            if (sortResult.length > 0) {
                for (l = 0; l < sortResult.length; l++) {
                    directionData = {
                        "Name": sortResult[l][nameField] === "" ? sharedNls.showNullValue : sortResult[l][nameField],
                        "Address": sortResult[l][AddressField] === "" ? sharedNls.showNullValue : sortResult[l][AddressField],
                        "StartDate": sortResult[l][startDateFeild] === "" ? sharedNls.showNullValue : dojo.date.locale.format(this.utcTimestampFromMs(sortResult[l][startDateFeild]), { datePattern: displayDateFormat, selector: "date" })
                    };
                    eventDataArray.push(directionData);
                }
                this.printForEventList = new PrintForEventWindow({ "eventListData": eventDataArray });
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
                for (i = 0; i < featureObject.length; i++) {
                    for (j in featureObject[i].attributes) {
                        if (featureObject[i].attributes.hasOwnProperty(j)) {
                            if (!featureObject[i].attributes[j]) {
                                featureObject[i].attributes[j] = sharedNls.showNullValue;
                            }
                            if (dojo.isString(featureObject[i].attributes[j]) && lang.trim(featureObject[i].attributes[j]) === "") {
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
