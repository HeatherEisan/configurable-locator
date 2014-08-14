/*global define,dojo,alert */
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
    "dojo/text!./templates/activitiesTemplate.html",
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
    "../scrollBar/scrollBar"
], function (declare, domConstruct, lang, on, dom, domAttr, domClass, html, domStyle, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic, DateTextBox, date, parser, locale, array, Query, QueryTask, Memory, ScrollBar) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,
        todayDate: new Date(),
        myListStore: new Memory(),
        featureSet: null,
        activityListScrollBar: null,
        myListScrollBar: null,

        /**
        * create activities widget
        *
        * @class
        * @name widgets/activities/activities
        */
        postCreate: function () {
            this.myFromDate.constraints.min = this.todayDate;
            this.myToDate.constraints.min = this.todayDate;

            /**
            * minimize other open header panel widgets and show activities
            */
            this.arrTabClass = [];
            topic.subscribe("toggleWidget", lang.hitch(this, function (widget) {
                if (widget !== "activities") {

                    if (html.coords(this.esriCTdivAppContainer).h > 0) {
                        domClass.replace(this.domNode, "esriCTActivitiesImg", "esriCTActivitiesImgSelected");
                        domClass.replace(this.esriCTdivAppContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                        domClass.replace(this.esriCTdivAppContainer, "esriCTZeroHeight", "esriCTFullHeight");
                    }
                }
            }));

            this.domNode = domConstruct.create("div", { "title": sharedNls.tooltips.activities, "class": "esriCTActivitiesImg" }, null);
            dom.byId("esriCTParentDivContainer").appendChild(this.esriCTdivAppContainer);
            this.own(on(this.domNode, "click", lang.hitch(this, function () {
                /**
                * minimize other open header panel widgets and show activities panel
                */
                topic.publish("toggleWidget", "activities");
                this._showActivityPlannerContainer();
            })));

            this.own(on(this.myFromDate, "change", lang.hitch(this, function () {
                this.myToDate.reset();
                this.myToDate.constraints.min = this.myFromDate.value;
            })));

            this.own(on(this.bottonGo, "click", lang.hitch(this, function () {
                this._activityPlannerDateValidation();
            })));

            this.own(on(this.activityTab, "click", lang.hitch(this, function () {
                this._showActivityListTab();
            })));

            this.own(on(this.activityListTab, "click", lang.hitch(this, function () {
                this._showActivityTab();
            })));

            this.own(on(this.orderByDate, "click", lang.hitch(this, function () {
                var sortedMyList;
                if (this.orderByDateImage.classList.contains("esriCTimgOrderByDateDown")) {
                    //sort with descending order of date
                    sortedMyList = this._sortMyList(false);
                } else if (this.orderByDateImage.classList.contains("esriCTimgOrderByDateUp")) {
                    //sort with ascending order of date
                    sortedMyList = this._sortMyList(true);
                }
                this._refreshMyList(null, sortedMyList);
            })));
        },

        /**
        * close activity panel if any other widget is opened
        * @memberOf widgets/activities/activities
        */
        _showActivityPlannerContainer: function () {
            if (html.coords(this.esriCTdivAppContainer).h > 0) {
                /**
                * when user clicks on activity icon in header panel, close the activity panel if it is open
                */
                domClass.replace(this.domNode, "esriCTActivitiesImg", "esriCTActivitiesImgSelected");
                domClass.replace(this.esriCTdivAppContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                domClass.replace(this.esriCTdivAppContainer, "esriCTZeroHeight", "esriCTActivityHeight");
            } else {
                /**
                * when user clicks on activity icon in header panel, open the activity panel if it is closed
                */
                domClass.replace(this.domNode, "esriCTActivitiesImgSelected", "esriCTActivitiesImg");
                domClass.replace(this.esriCTdivAppContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
                domClass.replace(this.esriCTdivAppContainer, "esriCTActivityHeight", "esriCTZeroHeight");
            }
        },

        /**
        * displays the activities list
        * @param {object} featureSet contains featureSet returned by querying activity layer
        * @memberOf widgets/activities/activities
        */
        _showActivitiesList: function (featureSet) {
            var activityList, sortedActivityList, activityPlannerContainer, plannerListTable, activityPlannerListRow, activityPlannerLeft = [], activityPlannerAddList = [], activityPlannerRight, eventDate, name, startDate, address, objectID, eventIndex;
            name = dojo.configData.ActivitiesFields.name;
            startDate = dojo.configData.ActivitiesFields.fromDate;
            address = dojo.configData.ActivitiesFields.address;
            objectID = dojo.configData.ActivitiesFields.objectID;
            if (featureSet) {
                this.featureSet = featureSet;
            }
            //hide the activities list if already present
            this._hideActivitiesList();
            activityPlannerContainer = domConstruct.create("div", { "class": "esriCTActivityPlannerContainer" }, this.activityPlanner);
            plannerListTable = domConstruct.create("div", { "class": "esriCTActivityPlannerListTable" }, activityPlannerContainer);
            //remove the event from activities list if it is already added to the MyList
            activityList = new Memory();
            array.forEach(this.featureSet.features, function (feature) {
                if (this.myListStore.query({ OBJECTID: feature.attributes[objectID] }).length === 0) {
                    activityList.add(feature.attributes);
                }
            }, this);
            //display an error message when no activities in the list
            if (this.featureSet.features.length === 0) {
                activityPlannerListRow = domConstruct.create("div", { "class": "esriCTActivityPlannerListError", "innerHTML": sharedNls.errorMessages.invalidSearch }, plannerListTable);
            } else if (activityList.data.length === 0) {
                activityPlannerListRow = domConstruct.create("div", { "class": "esriCTActivityPlannerListAddToList", "innerHTML": sharedNls.errorMessages.addedActivities }, plannerListTable);
            }
            //sort the activity list on event start date
            sortedActivityList = activityList.query({}, { sort: [{ attribute: startDate, ascending: true}] });
            array.forEach(sortedActivityList, function (activity, i) {
                activityPlannerListRow = domConstruct.create("div", { "class": "esriCTActivityPlannerList" }, plannerListTable);
                activityPlannerLeft[i] = domConstruct.create("div", { "class": "esriCTActivityPlannerLeft", "value": activity }, activityPlannerListRow);
                if (!activity[name]) {
                    activity[name] = sharedNls.showNullValue;
                }
                domConstruct.create("div", { "class": "esriCTActivityPlannerText", "innerHTML": activity[name] }, activityPlannerLeft[i]);
                //convert the date in millisecond to display date format
                eventDate = locale.format(this.utcTimestampFromMs(activity[startDate]), { datePattern: dojo.configData.EventPlannerDateFormat, selector: "date" });
                if (!activity[address]) {
                    activity[address] = sharedNls.showNullValue;
                }
                domConstruct.create("div", { "class": "esriCTActivityPlannerDates", "innerHTML": eventDate + "," + " " + activity[address] }, activityPlannerLeft[i]);
                activityPlannerRight = domConstruct.create("div", { "class": "esriCTActivityPlannerRight" }, activityPlannerListRow);
                activityPlannerAddList[i] = domConstruct.create("div", { "class": "esriCTActivityPlannerAddlist" }, activityPlannerRight);
                domConstruct.create("div", { "class": "esriCTActivityPlannerAddlistText", "innerHTML": "Add to List" }, activityPlannerAddList[i]);
                domConstruct.create("div", { "class": "esriCTplusRound" }, activityPlannerAddList[i]);
                on(activityPlannerAddList[i], "click", lang.hitch(this, function (e) {
                    eventIndex = array.indexOf(activityPlannerAddList, e.currentTarget);
                    this._addtoMyList(activityPlannerLeft[eventIndex].value);
                }));
            }, this);
            domStyle.set(activityPlannerContainer, "display", "block");
            if (this.activityListScrollBar) {
                this.activityListScrollBar.removeScrollBar();
            }
            this.activityListScrollBar = new ScrollBar({ domNode: activityPlannerContainer });
            this.activityListScrollBar.setContent(plannerListTable);
            this.activityListScrollBar.createScrollBar();
        },

        /**
        * hide activity list when date is not selected or selected date is not valid
        * @memberOf widgets/activities/activities
        */
        _hideActivitiesList: function () {
            if (this.activityPlanner.childElementCount > 1) {
                domConstruct.destroy(this.activityPlanner.children[1]);
            }
        },

        /**
        * show activity tab and block the Mylist tab
        * @memberOf widgets/activities/activities
        */
        _showActivityTab: function () {
            domStyle.set(this.activityList, "display", "block");
            domStyle.set(this.activityPlanner, "display", "none");
            domClass.replace(this.activityTab, "esriCTActivityTab", "esriCTActivityTabSelected");
            domClass.replace(this.activityListTab, "esriCTActivityListTabSelected", "esriCTActivityListTab");
            domClass.replace(this.activityPlanner, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
        },

        /**
        * show Mylist tap and block the activity tab
        * @memberOf widgets/activities/activities
        */
        _showActivityListTab: function () {
            domStyle.set(this.activityList, "display", "none");
            domStyle.set(this.activityPlanner, "display", "block");
            domClass.replace(this.activityTab, "esriCTActivityTabSelected", "esriCTActivityTab");
            domClass.replace(this.activityPlanner, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
            domClass.replace(this.activityListTab, "esriCTActivityListTab", "esriCTActivityListTabSelected");
            this._showActivitiesList();
        },

        /**
        * activityPlannr Date Validation
        * @memberOf widgets/activities/activities
        */
        _activityPlannerDateValidation: function () {
            var formattedFromDate, formattedToDate;
            if (this.myFromDate.validate() && this.myToDate.validate()) {
                formattedFromDate = locale.format(this.myFromDate.value, { datePattern: dojo.configData.EventPlannerDateFormat, selector: "date" });
                formattedToDate = locale.format(this.myToDate.value, { datePattern: dojo.configData.EventPlannerDateFormat, selector: "date" });
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
        * Date validation of two dates
        * @param {object} firstDate contains first date for comparison
        * @param {object} secDate contains second date for comparison
        * @memberOf widgets/activities/activities
        */
        _isDateValid: function (firstDate, secDate) {
            var isValid = true, formattedFirstDate, formattedSecDate;
            formattedFirstDate = locale.format(firstDate, { datePattern: dojo.configData.EventPlannerDateFormat, selector: "date" });
            formattedSecDate = locale.format(secDate, { datePattern: dojo.configData.EventPlannerDateFormat, selector: "date" });
            if (formattedFirstDate > formattedSecDate && formattedFirstDate !== formattedSecDate) {
                isValid = false;
            }
            return isValid;
        },

        /**
        * add the selected event to my list and displays the sorted list
        * @param {object} eventDetails contains activity details
        * @memberOf widgets/activities/activities
        */
        _addtoMyList: function (eventDetails) {
            var sortedMyList;
            //add the selected event object to the memory store
            this.myListStore.add(eventDetails);
            //display myList tab
            domClass.replace(this.activityTab, "esriCTActivityTab", "esriCTActivityTabSelected");
            domClass.replace(this.activityListTab, "esriCTActivityListTabSelected", "esriCTActivityListTab");
            domStyle.set(this.activityPlanner, "display", "none");
            domStyle.set(this.activityList, "display", "block");
            //sort with ascending order of date
            sortedMyList = this._sortMyList(true);
            this._refreshMyList(eventDetails, sortedMyList);
        },

        /**
        * displays the updated and sorted list
        * @param {object} eventDetails contains activity details of newly added event
        * @param {object} sortedMyList contains sorted activities list
        * @memberOf widgets/activities/activities
        */
        _refreshMyList: function (eventDetails, sortedMyList) {
            var myListContainer, myListTable, myListRow, myListLeft = [], eventIndex, myListRight, myListIcons, eventDate, name, startDate, address, objectID, myListDeleteIcon = [];
            name = dojo.configData.ActivitiesFields.name;
            startDate = dojo.configData.ActivitiesFields.fromDate;
            address = dojo.configData.ActivitiesFields.address;
            objectID = dojo.configData.ActivitiesFields.objectID;
            // remove the already added events to the display container while displaying
            if (this.activityList.childElementCount > 1) {
                domConstruct.destroy(this.activityList.children[1]);
            }
            myListContainer = domConstruct.create("div", { "class": "esriCTMyListContainer" }, this.activityList);
            myListTable = domConstruct.create("div", { "class": "esriCTMyListTable" }, myListContainer);
            array.forEach(sortedMyList, function (myListEvent, i) {
                myListRow = domConstruct.create("div", { "class": "esriCTMyListRow" }, myListTable);
                myListLeft[i] = domConstruct.create("div", { "class": "esriCTMyListLeft", "value": myListEvent }, myListRow);
                if (!myListEvent[name]) {
                    myListEvent[name] = sharedNls.showNullValue;
                }
                domConstruct.create("div", { "class": "esriCTMyListText", "innerHTML": myListEvent[name] }, myListLeft[i]);
                //convert the date in millisecond to display date format
                eventDate = locale.format(this.utcTimestampFromMs(myListEvent[startDate]), { datePattern: dojo.configData.EventPlannerDateFormat, selector: "date" });
                if (!myListEvent[address]) {
                    myListEvent[address] = sharedNls.showNullValue;
                }
                domConstruct.create("div", { "class": "esriCTMyListDates", "innerHTML": eventDate + "," + " " + myListEvent[address] }, myListLeft[i]);
                myListRight = domConstruct.create("div", { "class": "esriCTMyListRight" }, myListRow);
                myListIcons = domConstruct.create("div", { "class": "esriCTMyListIcons" }, myListRight);
                domConstruct.create("div", { "class": "esriCTDirectionAcitivityList" }, myListIcons);
                domConstruct.create("div", { "class": "esriCTAddAcitivityList" }, myListIcons);
                myListDeleteIcon[i] = domConstruct.create("div", { "class": "esriCTDeleteAcitivityList" }, myListIcons);
                //if new event is being added, highlight the added event
                if (eventDetails) {
                    if (myListEvent[objectID] === eventDetails[objectID]) {
                        domClass.add(myListRow, "esriCTMyListRowChecked");
                    }
                } else {
                    domClass.remove(myListRow, "esriCTMyListRowChecked");
                }
                on(myListDeleteIcon[i], "click", lang.hitch(this, function (e) {
                    eventIndex = array.indexOf(myListDeleteIcon, e.currentTarget);
                    this.myListStore.remove(myListLeft[eventIndex].value.id);
                    //sort with ascending order of date
                    sortedMyList = this._sortMyList(true);
                    this._refreshMyList(null, sortedMyList);
                }));
            }, this);
            domStyle.set(myListTable, "display", "block");
            if (this.myListScrollBar) {
                this.myListScrollBar.removeScrollBar();
            }
            this.myListScrollBar = new ScrollBar({ domNode: myListContainer });
            this.myListScrollBar.setContent(myListTable);
            this.myListScrollBar.createScrollBar();
        },

        /**
        * sort my list events in ascending or descending order
        * @param {object} ascendingFlag contains boolean flag for ascending value
        * @memberOf widgets/activities/activities
        */
        _sortMyList: function (ascendingFlag) {
            var sortResult, startDate;
            startDate = dojo.configData.ActivitiesFields.fromDate;
            if (ascendingFlag) {
                domClass.replace(this.orderByDateImage, "esriCTimgOrderByDateDown", "esriCTimgOrderByDateUp");
                sortResult = this.myListStore.query({}, { sort: [{ attribute: startDate, ascending: true}] });
            } else {
                domClass.replace(this.orderByDateImage, "esriCTimgOrderByDateUp", "esriCTimgOrderByDateDown");
                sortResult = this.myListStore.query({}, { sort: [{ attribute: startDate, descending: true}] });
            }
            return sortResult;
        },

        /**
        * query activities layer within given date range
        * @param {object} startDate contains user selected from date
        * @param {object} endDate contains user selected to date
        * @memberOf widgets/activities/activities
        */
        _queryForActivity: function (startDate, endDate) {
            var queryTask, queryLayer, startDateField;
            startDateField = dojo.configData.ActivitiesFields.fromDate;
            queryTask = new QueryTask(dojo.configData.EventsPlannerLayer.URL);
            queryLayer = new Query();
            queryLayer.where = startDateField + " >= '" + startDate + "'" + "AND" + " " + startDateField + "<='" + endDate + "'";
            queryLayer.outSpatialReference = this.map.spatialReference;
            queryLayer.returnGeometry = true;
            queryLayer.outFields = ["*"];
            queryTask.execute(queryLayer, lang.hitch(this, this._showActivitiesList));
        },

        /**
        * convert the UTC time stamp from Millisecond
        * @returns Date
        * @param {object} utcMilliseconds contains UTC millisecond
        * @memberOf widgets/activities/activities
        */
        utcTimestampFromMs: function (utcMilliseconds) {
            return this.localToUtc(new Date(utcMilliseconds));
        },

        /**
        * convert the local time to UTC
        * @param {object} localTimestamp contains Local time
        * @returns Date
        * @memberOf widgets/activities/activities
        */
        localToUtc: function (localTimestamp) {
            return new Date(localTimestamp.getTime() + (localTimestamp.getTimezoneOffset() * 60000));
        }
    });
});
