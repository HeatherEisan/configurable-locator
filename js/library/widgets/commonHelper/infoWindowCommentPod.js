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
    "dijit/a11yclick",
    "dojo/NodeList-manipulate"

], function (declare, domConstruct, domStyle, domAttr, lang, on, domGeom, dom, array, domClass, query, string, Locator, Query, Deferred, DeferredList, QueryTask, Geometry, Graphic, Point, GeometryExtent, _WidgetBase, sharedNls, topic, date, locale, a11yclick) {
    //========================================================================================================================//

    return declare([_WidgetBase], {
        sharedNls: sharedNls,                                   // Variable for shared NLS
        /**
        * display info window comment pod and posting data on feature
        *
        * @class
        * @name widgets/commonHelper/infoWindowCommentPod
        */
        /**
        * Comment Tab for InfoWindow
        * @param {object} commentObject contain attribute, index, featureLayer, widget name
        * @memberOf widgets/commonHelper/infoWindowCommentPod
        */
        _infoWindowCommentTab: function (commentObject) {
            var SearchSettingsLayersForComment, searchSettingsData, i, outerCommentContainer, queryObject;
            //check widgetName is "infoactivity"
            if (commentObject.widgetName.toLowerCase() === "infoactivity") {
                searchSettingsData = dojo.configData.ActivitySearchSettings;
                //check widgetName is "infoevent"
            } else if (commentObject.widgetName.toLowerCase() === "infoevent") {
                searchSettingsData = dojo.configData.EventSearchSettings;
            }
            //loop for the searchSettingsData to fetch the information
            for (i = 0; i < searchSettingsData.length; i++) {
                SearchSettingsLayersForComment = searchSettingsData[i];
                // check if "SearchSettingsLayersForComment.CommentsSettings" contain comment
                if (SearchSettingsLayersForComment.CommentsSettings && SearchSettingsLayersForComment.CommentsSettings.Enabled) {
                    //check if commnet container is there or not
                    if (dojo.byId("commentsTabContainer")) {
                        domConstruct.empty(dojo.byId("commentsTabContainer"));
                    }
                    outerCommentContainer = domConstruct.create("div", { "class": "esriCTCommentInfoOuterContainer" }, dojo.byId("commentsTabContainer"));
                    domConstruct.create("div", { "class": "esriCTCommentContainer" }, outerCommentContainer);
                    queryObject = { "FeatureData": commentObject.attribute, "SolveRoute": null, "Index": commentObject.infoIndex, "QueryURL": searchSettingsData[0].QueryURL, "WidgetName": commentObject.widgetName, "Address": null, "IsRouteCreated": false };
                    topic.publish("showProgressIndicator");
                    this.queryCommentLayer(queryObject);
                }
            }
        },

        /**
        * set infoWindow Comments
        * @param {object} result contain comments of feature
        * @param {field} featureId is ObhectID
        * @param {number} resultcontent contails index number of feature
        * @memberOf widgets/commonHelper/infoWindowCommentPod
        */
        _setInfoWindowComment: function (result, resultcontent, featureId) {
            var j, divHeaderStar, divStar, utcMilliseconds, l, isCommentFound = false, divCommentRow, postCommentContainer, i, commentValue, divContentDiv,
                esriCTCommentDateStar, postCommentButton, infocontainer, divCommentContainer, divCommentRowCont, updatedCommentValue;
            try {
                //loop for the ActivitySearchSettings
                for (i = 0; i < dojo.configData.ActivitySearchSettings.length; i++) {
                    divCommentContainer = query('.esriCTCommentContainer')[0];
                    divContentDiv = domConstruct.create("div", { "class": "esriCTCommentInfoContent" }, divCommentContainer);
                    this.removeNullValue(result);
                    if (result.length > 0) {
                        //loop for result which conatin comments of facility
                        for (l = 0; l < result.length; l++) {
                            commentValue = string.substitute(dojo.configData.ActivitySearchSettings[i].CommentsSettings.CommentField, result[l].attributes);
                            updatedCommentValue = this._getFormattedCommentText(commentValue);
                            if (updatedCommentValue !== sharedNls.showNullValue) {
                                divCommentRowCont = domConstruct.create("div", { "class": "esriCTDivCommentRowCont" }, divContentDiv);
                                divCommentRow = domConstruct.create("div", { "class": "esriCTDivCommentRow" }, divCommentRowCont);
                                esriCTCommentDateStar = domConstruct.create("div", { "class": "esriCTCommentDateStar" }, divCommentRow);
                                divHeaderStar = domConstruct.create("div", { "class": "esriCTHeaderRatingStar" }, esriCTCommentDateStar);
                                isCommentFound = true;
                                //loop for rating star
                                for (j = 0; j < 5; j++) {
                                    divStar = domConstruct.create("span", { "class": "esriCTRatingStar" }, divHeaderStar);
                                    if (j < string.substitute(dojo.configData.ActivitySearchSettings[i].CommentsSettings.RankField, result[l].attributes)) {
                                        domClass.add(divStar, "esriCTRatingStarChecked");
                                    }
                                }
                                if (string.substitute(dojo.configData.ActivitySearchSettings[i].CommentsSettings.SubmissionDateField, result[l].attributes) === null) {
                                    utcMilliseconds = 0;
                                } else {
                                    utcMilliseconds = Number(dojo.string.substitute(dojo.configData.ActivitySearchSettings[i].CommentsSettings.SubmissionDateField, result[l].attributes));
                                }
                                domConstruct.create("div", { "class": "esriCTCommentText", "innerHTML": updatedCommentValue }, divCommentRow);
                                domConstruct.create("div", { "class": "esriCTCommentDateInfoWindow", "innerHTML": dojo.date.locale.format(this.utcTimestampFromMs(utcMilliseconds), { datePattern: dojo.configData.ActivitySearchSettings[i].CommentsSettings.DisplayDateFormat, selector: "date" }) }, esriCTCommentDateStar);
                            }
                        }
                    }
                }
                //check if comment not found
                if (!isCommentFound) {
                    domConstruct.empty(divContentDiv);
                    domConstruct.create("div", { "class": "esriCTNullCommentText", "innerHTML": sharedNls.errorMessages.noCommentAvaiable }, divContentDiv);
                }
                domClass.add(divCommentContainer, "esriCTInfoContentComment");
                postCommentContainer = domConstruct.create("div", { "class": "esriCTButtonDiv" }, null);
                postCommentButton = domConstruct.create("div", { "class": "esriCTInfoPostButton", "innerHTML": sharedNls.titles.postComment }, postCommentContainer);
                infocontainer = query('.esriCTCommentContainer')[0];
                domConstruct.place(postCommentContainer, infocontainer, "after");
                //click of postCommentButton on commnet panel in infowindow
                this.own(on(postCommentButton, a11yclick, lang.hitch(this, function () {
                    this._postComment(featureId, result);
                })));
            } catch (error) {
                alert(error);
            }
        },

        /**
        * set the content in infoWindow for post comment
        * @param {object} commentID is objectID from layer
        * @param {object} result contains Date,Comment and star
        * @memberOf widgets/commonHelper/infoWindowCommentPod
        */
        _postComment: function (commentID, result) {
            var divStarRating, postCommentContainer, buttonDiv, backButton, submitButton, j, starInfoWindow = [], backToMapHide, postCommentContent, outerCommentContainer, textAreaContainerdiv;
            backToMapHide = query('.esriCTCloseDivMobile')[0];
            outerCommentContainer = query('.esriCTCommentInfoOuterContainer')[0];
            //check "backToMapHide" node
            if (backToMapHide) {
                domStyle.set(backToMapHide, "display", "none");
            }
            domStyle.set(outerCommentContainer, "display", "none");
            if (dojo.byId("divCTPostCommentContainer")) {
                domConstruct.destroy(dojo.byId("divCTPostCommentContainer"));
            }
            postCommentContainer = domConstruct.create("div", { "id": "divCTPostCommentContainer", "class": "esriCTCommentInfoOuterContainer" }, dojo.byId("commentsTabContainer"));
            postCommentContent = domConstruct.create("div", { "class": "esriCTPostCommentContainer" }, postCommentContainer);
            domConstruct.create("div", { "class": "esriCTHeaderTextRating", "innerHTML": sharedNls.titles.rating }, postCommentContent);
            divStarRating = domConstruct.create("div", { "class": "esriCTStarPostComment" }, postCommentContent);
            //loop for the rating stars
            for (j = 0; j < 5; j++) {
                this.rankValue = 0;
                this._checked = false;
                starInfoWindow[j] = domConstruct.create("div", { "class": "esriCTRatingStarPostComment" }, divStarRating);
                this.own(on(starInfoWindow[j], a11yclick, lang.hitch(this, this._selectedStarForPostComment, starInfoWindow, starInfoWindow[j], j)));
                this.own(on(starInfoWindow[j], "mouseover", lang.hitch(this, this._selectHoverStars, starInfoWindow, j)));
                this.own(on(starInfoWindow[j], "mouseout", lang.hitch(this, this._deSelectHoverStars, starInfoWindow, j)));
            }
            textAreaContainerdiv = domConstruct.create("div", { "class": "textAreaContainerdiv" }, postCommentContainer);
            domConstruct.create("textarea", { "class": "textAreaContainer", "id": "txtComments", "placeholder": sharedNls.titles.postCommentText }, textAreaContainerdiv);

            buttonDiv = domConstruct.create("div", { "class": "esriCTButtonDiv" }, postCommentContainer);
            backButton = domConstruct.create("div", { "class": "esriCTInfoBackButton", "innerHTML": sharedNls.titles.backButton }, buttonDiv);
            submitButton = domConstruct.create("div", { "class": "esriCTInfoSubmitButton", "innerHTML": sharedNls.titles.submitButton }, buttonDiv);
            //click of backButton of comment tap in infowindow
            this.own(on(backButton, a11yclick, lang.hitch(this, function () {
                this._backButton();
            })));
            //click of submit button of comment in infowindow
            this.own(on(submitButton, a11yclick, lang.hitch(this, function () {
                this._submitButton(commentID, result);
            })));
        },

        /**
        * submit button in infoWindow for post comment
        * @param {object} selectedFeatureID contains selected featureID
        * @param {object} result contains Date,Comment and star
        * @memberOf widgets/commonHelper/infoWindowCommentPod
        */
        _submitButton: function (selectedFeatureID, result) {
            var commentsLayer, commentGraphic, currenDate, divCommentRowCont, currentDateFormat, attr, self, setAttribute, updatedComments, i, k, l, currentMonth, divCommentRow, outerCommentContainer,
                destroyCommentText, esriCTCommentDateStar, divHeaderStar, divStar, backToMapHide, backText, contentDivAfterNewComment, divContentDiv, comment, updatedComment;
            self = this;
            outerCommentContainer = query('.esriCTCommentInfoOuterContainer')[0];
            divContentDiv = query('.esriCTCommentInfoContent')[0];
            topic.publish("showProgressIndicator");
            backText = query('.esriCTInfoBackButton')[0];
            backToMapHide = query('.esriCTCloseDivMobile')[0];
            //check comment Text value
            if (lang.trim(dojo.byId("txtComments").value) === "" && self.rankValue === 0) {
                domStyle.set(outerCommentContainer, "display", "none");
                alert(sharedNls.errorMessages.commentString);
                topic.publish("hideProgressIndicator");
            } else if (lang.trim(dojo.byId("txtComments").value) === "") {
                dojo.byId("txtComments").focus();
                alert(sharedNls.errorMessages.commentString);
                topic.publish("hideProgressIndicator");
            } else if (dojo.byId("txtComments").value.length > 250) {
                dojo.byId("txtComments").focus();
                alert(sharedNls.errorMessages.maxLenghtCommentstring);
                topic.publish("hideProgressIndicator");
            } else {
                //loop for ActivitySearchSettings  which is from config file
                for (i = 0; i < dojo.configData.ActivitySearchSettings.length; i++) {
                    commentsLayer = new esri.layers.FeatureLayer(dojo.configData.ActivitySearchSettings[i].CommentsSettings.QueryURL, {
                        mode: esri.layers.FeatureLayer.MODE_SELECTION,
                        outFields: ["*"]
                    });
                    commentGraphic = new esri.Graphic();
                    currenDate = new Date();
                    currentMonth = currenDate.getMonth();
                    currentMonth = currentMonth + 1;
                    currentDateFormat = currentMonth + " " + currenDate.getDate() + ", " + currenDate.getFullYear();
                    attr = {};
                    // setting comment attributs for applying on feature
                    attr[dojo.configData.ActivitySearchSettings[i].CommentsSettings.ForeignKeyFieldForActivity] = selectedFeatureID;
                    attr[this.getKeyValue(dojo.configData.ActivitySearchSettings[i].CommentsSettings.CommentField)] = lang.trim(dojo.byId("txtComments").value);
                    attr[this.getKeyValue(dojo.configData.ActivitySearchSettings[i].CommentsSettings.SubmissionDateField)] = currentDateFormat; // date.utcMsFromTimestamp(date.localToUtc(date.localTimestampNow()));
                    attr[this.getKeyValue(dojo.configData.ActivitySearchSettings[i].CommentsSettings.RankField)] = this.rankValue;
                    comment = lang.trim(dojo.byId("txtComments").value);
                    updatedComment = self._getFormattedCommentText(comment);
                    setAttribute = {
                        comments: updatedComment,
                        submitId: currentDateFormat,
                        rank: self.rankValue
                    };
                }
                commentGraphic.setAttributes(attr);
                updatedComments = [];
                commentsLayer.applyEdits([commentGraphic], null, null, lang.hitch(this, function (msg) {
                    if (!msg[0].error) {
                        //verify the windows width
                        if (dojo.window.getBox().w <= 767) {
                            domStyle.set(backText, "display", "none");
                            if (backToMapHide) {
                                domStyle.set(backToMapHide, "display", "block");
                            }
                        }
                        updatedComments.push({ "attributes": setAttribute });
                        // loop for result which contain Date,Comment and star
                        for (i = 0; i < result.length; i++) {
                            updatedComments.push(result[i]);
                        }
                        domStyle.set(dojo.byId("divCTPostCommentContainer"), "display", "none");
                        domStyle.set(outerCommentContainer, "display", "block");
                        destroyCommentText = query('.esriCTNullCommentText')[0];
                        //verify "destroyCommentText" node
                        if (destroyCommentText) {
                            domConstruct.destroy(destroyCommentText);
                        }

                        divCommentRowCont = domConstruct.create("div", { "class": "esriCTDivCommentRowCont" }, divContentDiv);
                        divCommentRow = domConstruct.create("div", { "class": "esriCTDivCommentRow" }, divCommentRowCont);

                        esriCTCommentDateStar = domConstruct.create("div", { "class": "esriCTCommentDateStar" }, divCommentRow);
                        divHeaderStar = domConstruct.create("div", { "class": "esriCTHeaderRatingStar" }, esriCTCommentDateStar);
                        //loop for the rating star
                        for (k = 0; k < 5; k++) {
                            divStar = domConstruct.create("span", { "class": "esriCTRatingStar" }, divHeaderStar);
                            if (k < setAttribute.rank) {
                                domClass.add(divStar, "esriCTRatingStarChecked");
                            }
                        }
                        domConstruct.create("div", { "class": "esriCTCommentText", "innerHTML": setAttribute.comments }, divCommentRow);
                        for (l = 0; l < dojo.configData.ActivitySearchSettings.length; l++) {
                            domConstruct.create("div", { "class": "esriCTCommentDateInfoWindow", "innerHTML": dojo.date.locale.format(this.utcTimestampFromMs(currenDate.getTime()), { datePattern: dojo.configData.ActivitySearchSettings[l].CommentsSettings.DisplayDateFormat, selector: "date" }) }, esriCTCommentDateStar);
                        }
                        contentDivAfterNewComment = query('.esriCTDivCommentRowCont')[0];
                        if (contentDivAfterNewComment && contentDivAfterNewComment.children.length > 0) {
                            contentDivAfterNewComment.insertBefore(divCommentRow, contentDivAfterNewComment.children[0]);
                        } else {
                            divContentDiv.appendChild(divCommentRow);
                        }
                        topic.publish("hideProgressIndicator");
                    }
                }), function (err) {
                    topic.publish("hideProgressIndicator");
                    alert(sharedNls.errorMessages.commentError);
                });
            }
        },

        /**
        * backButton in infoWindow for post comment block
        * @memberOf widgets/commonHelper/infoWindowCommentPod
        */
        _backButton: function () {
            var backToMapHide, outerCommentContainer;
            backToMapHide = query('.esriCTCloseDivMobile')[0];
            outerCommentContainer = query('.esriCTCommentInfoOuterContainer')[0];
            domStyle.set(dojo.byId("divCTPostCommentContainer"), "display", "none");
            domStyle.set(outerCommentContainer, "display", "block");
            //validate the width of window
            if (dojo.window.getBox().w <= 768) {
                domStyle.set(backToMapHide, "display", "block");
            }
        },

        /**
        * selected star for postComment in infoWindow for post comment block
        * @param {object} result contains Date,Comment and star
        * @param {object} starInfoWindow contains stars for infoWindow in comment panel
        * @param {object} j contains the selected star for infoWindow in comment panel
        * @memberOf widgets/commonHelper/infoWindowCommentPod
        */
        _selectedStarForPostComment: function (result, starInfoWindow, j) {
            var i;
            // check if a node result has class="esriCTRatingStarChecked" present
            if ((dojo.hasClass(result[j], "esriCTRatingStarChecked")) && this._checked) {
                // loop through 0 to 4 as there are 5 rating stars.
                for (i = 4; i >= j; i--) {
                    domClass.replace(result[i], "esriCTRatingStar");
                }
                //check if rating star is selected.
                if (j !== 0) {
                    domClass.add(result[j], "esriCTRatingStarChecked");
                    this.rankValue = j + 1;
                } else {
                    //when no rating is selected
                    this.rankValue = j;
                }
            } else {
                //loop for the rating selected star
                for (i = 0; i <= j; i++) {
                    domClass.add(result[i], "esriCTRatingStarChecked");
                    this._checked = true;
                    this.rankValue = j + 1;
                }
            }
            this.checkedStars = query('.esriCTRatingStarChecked');
        },

        /**
        * star selected on hover for postComment in infoWindow for post comment block
        * @param {object} result contains Date,Comment and star
        * @param {object} j contains the selected star for infoWindow in comment panel
        * @memberOf widgets/commonHelper/infoWindowCommentPod
        */
        _selectHoverStars: function (result, j) {
            var i;
            //check whether result contain data
            if (result) {
                //loop for selected star for infoWindow in comment panel
                for (i = 0; i <= j; i++) {
                    // check if a node result has class="esriCTRatingStar" present or class="esriCTRatingStarPostComment"
                    if (dojo.hasClass(result[i], "esriCTRatingStar") || dojo.hasClass(result[i], "esriCTRatingStarPostComment")) {
                        domClass.add(result[i], "esriCTRatingStarHover");
                    }
                }
            }
        },

        /**
        * star selected on hover for postComment in infoWindow for post comment block
        * @param {object} result contains Date,Comment and star
        * @param {object} j contains the selected star for infoWindow in comment panel
        * @memberOf widgets/commonHelper/infoWindowCommentPod
        */
        _deSelectHoverStars: function (result, j) {
            var i;
            //check whether result contain data
            if (result) {
                //loop for selected star for infoWindow in comment panel
                for (i = 0; i <= j; i++) {
                    // check if a node result has class="esriCTRatingStarHover" present
                    if (dojo.hasClass(result[i], "esriCTRatingStarHover")) {
                        domClass.remove(result[i], "esriCTRatingStarHover");
                    }
                }
            }
        },

        /**
        * This function is called for submitting comment on click of submit button
        * @param{object} commentText contains the comments data
        * @return{data} value contains the formatted comments data
        * @memberOf widgets/commonHelper/infoWindowCommentPod
        */
        _getFormattedCommentText: function (commentText) {
        // Checking for comment text for checking multiline comments
            if (commentText) {
                commentText = commentText.replace(/(?:\r\n|\r|\n)/g, '<br />');
            }
            return commentText;
        }
    });
});
