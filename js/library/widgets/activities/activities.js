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
    "dojo/parser",
    "dojo/date/locale"
], function (declare, domConstruct, lang, on, dom, domAttr, domClass, html, domStyle, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic, DateTextBox, parser, locale) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,
        addToMyListCarPooling: null,
        addToMyListBoadRamp: null,

        /**
        * create activities widget
        *
        * @class
        * @name widgets/activities/activities
        */
        postCreate: function () {

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
                this._showActivityResult();
            })));

            domStyle.set(this.activityPlannerListRowCarPooling, "display", "none");
            domStyle.set(this.activityPlannerListRowBoatRamp, "display", "none");
            this.own(on(this.bottonGo, "click", lang.hitch(this, function () {
                this._showDate();
            })));
            this.own(on(this.esriCTActivityPlannerBoatAddlist, "click", lang.hitch(this, function () {
                this._addtoMyList();
            })));
            this.own(on(this.esriCTActivityPlannerCarAddlist, "click", lang.hitch(this, function () {
                this._addtoMyList();
            })));
            this.own(on(this.esriCTActivityPlannerBoatRampAddlist, "click", lang.hitch(this, function () {
                this._addtoMyList();
            })));

            this.own(on(this.ActivityTab, "click", lang.hitch(this, function () {
                this._showActivityListTab();
            })));

            this.own(on(this.ActivityListTab, "click", lang.hitch(this, function () {
                this._showActivityTab();
            })));
        },

        /**
        * close activity panel if any other widget is opened
        * @param {string} widget Key of the newly opened widget
        */
        _showActivityResult: function () {
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
        * show activity tab
        * @memberOf widgets/activities/activities
        */
        _showActivityTab: function () {
            domStyle.set(this.ActivityList, "display", "block");
            domStyle.set(this.ActivityPlaner, "display", "none");
            domClass.replace(this.ActivityTab, "esriCTActivityTab", "esriCTActivityTabSelected");
            domClass.replace(this.ActivityListTab, "esriCTActivityListTabSelected", "esriCTActivityListTab");
            domClass.replace(this.ActivityPlaner, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
        },

        /**
        * show ActivityMyList tap
        * @memberOf widgets/activities/activities
        */
        _showActivityListTab: function () {
            domStyle.set(this.ActivityList, "display", "none");
            domStyle.set(this.ActivityPlaner, "display", "block");
            domClass.replace(this.ActivityTab, "esriCTActivityTabSelected", "esriCTActivityTab");
            domClass.replace(this.ActivityPlaner, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
            domClass.replace(this.ActivityListTab, "esriCTActivityListTab", "esriCTActivityListTabSelected");
        },

        _showDate: function () {
            var todayDate, nextValue, fromDate;
            todayDate = new Date();
            domStyle.set(this.activityPlannerContainer, "display", "none");
            domStyle.set(this.activityPlannerListRowCarPooling, "display", "none");
            domStyle.set(this.activityPlannerListRowBoatRamp, "display", "none");
            if (this.myFromDate.value.toString() !== "Invalid Date" && this.myToDate.value.toString() !== "Invalid Date") {
                fromDate = new Date(this.myFromDate.value);
                if (this._isDateValid(todayDate, fromDate)) {
                    if (this._isDateValid(fromDate, this.myToDate.value)) {
                        domStyle.set(this.activityPlannerContainer, "display", "block");
                        nextValue = dojo.date.locale.format(fromDate, { datePattern: "MM/dd/yyyy", selector: "date" });
                        domAttr.set(this.activityPlannerDates, "innerHTML", nextValue + "," + " " + "Lake View Hotel");
                        fromDate.setDate(fromDate.getDate() + 1);

                        if (this._isDateValid(fromDate, this.myToDate.value)) {
                            nextValue = dojo.date.locale.format(fromDate, { datePattern: "MM/dd/yyyy", selector: "date" });
                            this.addToMyListCarPooling = domAttr.set(this.activityPlannerCarPoolingDates, "innerHTML", nextValue + "," + " " + "Hill View Garden");
                            domStyle.set(this.activityPlannerListRowCarPooling, "display", "block");

                            fromDate.setDate(fromDate.getDate() + 1);
                            if (this._isDateValid(fromDate, this.myToDate.value)) {
                                nextValue = dojo.date.locale.format(fromDate, { datePattern: "MM/dd/yyyy", selector: "date" });
                                this.addToMyListBoadRamp = domAttr.set(this.activityPlannerBoatRampDates, "innerHTML", nextValue + "," + " " + "Lake View Hotel");
                                domStyle.set(this.activityPlannerListRowBoatRamp, "display", "block");
                            }
                        }
                    } else {
                        alert("Please select valid To date");

                    }
                } else {
                    alert("Please select valid From date");
                }

            } else {
                alert("Please select the valid date");
            }
        },

        _isDateValid: function (firstDate, secDate) {
            var isValid = false;
            if (firstDate.getUTCFullYear() === secDate.getUTCFullYear()) {
                if (firstDate.getMonth() === secDate.getMonth()) {
                    if (firstDate.getDate() <= secDate.getDate()) {
                        isValid = true;
                    } else {
                        isValid = false;
                    }
                } else if (firstDate.getMonth() < secDate.getMonth()) {
                    isValid = true;
                } else {
                    isValid = false;
                }
            } else if (firstDate.getUTCFullYear() < secDate.getUTCFullYear()) {
                isValid = true;
            } else {
                isValid = false;
            }

            return isValid;
        },

        _addtoMyList: function () {
            domStyle.set(this.myListTable, "display", "block");
            domStyle.set(this.ActivityPlaner, "display", "none");
            domClass.replace(this.ActivityTab, "esriCTActivityTab", "esriCTActivityTabSelected");
            domClass.replace(this.ActivityListTab, "esriCTActivityListTabSelected", "esriCTActivityListTab");
            domStyle.set(this.ActivityList, "display", "block");
            domAttr.set(this.MyListLeftcolfirst, "innerHTML", this.myFromDate.displayedValue + "," + " " + "Lake View Hotel");
            if (this.addToMyListCarPooling) {
                domStyle.set(this.esriCTMyListRowCarPooling, "display", "block");
                domAttr.set(this.MyListLeftcolsecond, "innerHTML", this.addToMyListCarPooling.innerText);
            } else {
                domStyle.set(this.esriCTMyListRowCarPooling, "display", "none");
            }
            if (this.addToMyListBoadRamp) {
                domStyle.set(this.esriCTMyListRowBoatRamp, "display", "block");
                domAttr.set(this.MyListLeftcolthird, "innerHTML", this.addToMyListBoadRamp.innerText);
            } else {
                domStyle.set(this.esriCTMyListRowBoatRamp, "display", "none");
            }
        }
    });
});
