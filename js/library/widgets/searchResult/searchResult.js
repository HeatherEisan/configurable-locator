/*global define,dojo,dojoConfig,esri,console*/
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
    "dojo/dom-attr",
    "dojo/dom-style",
    "dojo/dom",
    "dojo/_base/array",
    "dojo/on",
    "dojo/date",
    "dojo/text!./templates/searchResultTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/dom-class",
    "dojo/query",
    "dojo/topic",
    "dojo/string",
    "esri/tasks/RouteParameters",
    "esri/SpatialReference",
    "esri/units",
    "widgets/print/printMap",
    "../scrollBar/scrollBar"
], function (declare, domConstruct, lang, domAttr, domStyle, dom, array, on, date, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, domClass, query, topic, string, RouteParameters, SpatialReference, units, PrintMap, ScrollBar) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,
        searchResultScrollBar: null,
        facilityScrollBar: null,
        directionScrollBar: null,
        commentScrollBar: null,
        divPodInfoContainer: null,
        divdirectioncontent: null,
        divfacilitycontent: null,
        facilityContainer: null,
        directionContainer: null,
        currentIndex: null,
        printMap: null,
        isChecked: false,
        imageCount: null,
        isResultFound: false,

        /**
        * initialize carousel pod
        * @class
        * @name widgets/searchResult/searchResult
        */
        startup: function () {
            topic.subscribe("ShowHideResult", lang.hitch(this, function (isVisible) {
                this.isResultFound = isVisible;
                this._showHideResult(isVisible);
            }));
            dom.byId("esriCTParentDivContainer").appendChild(this.divToggle);
            dom.byId("esriCTParentDivContainer").appendChild(this.divCarouselContent);
            this.own(on(this.divImageBackground, "click", lang.hitch(this, function () {
                if (this.isResultFound) {
                    var isVisible = false;
                    if (domClass.contains(this.divCarouselContent, "esriCTzeroHeight")) {
                        isVisible = true;
                    }
                    this._showHideResult(isVisible);
                }
            })));
            this._createBoxContainer();
            topic.subscribe("carouselPodDisplayBlock", lang.hitch(this, function () {
                this._carouselPodDisplayBlock();
            }));

            topic.subscribe("createPod", lang.hitch(this, function () {
                this.isChecked = false;
            }));

            topic.subscribe("setSearchInfo", lang.hitch(this, function (result) {
                if (!this.isChecked) {
                    this._setSearchContent(result);
                    this._setGallery(result);
                    this._setDirectionCarouselPod(result);
                }
            }));
            topic.subscribe("getFeatures", lang.hitch(this, function (result) {
                if (!this.isChecked) {
                    this._setComment(result);
                }
            }));
            topic.subscribe("setFacilityCarouselPod", lang.hitch(this, function (result) {
                this._setFacilityCarouselPod(result);
            }));
        },

        /**
        * show and hide carousel pod
        * @param {Boolean} isVisible used for show and hide carousel pod
        * @memberOf widgets/searchResult/searchResult
        */
        _showHideResult: function (isVisible) {
            if (!isVisible) {
                this._wipeOutResults();
            } else {
                this._wipeInResults();
            }
        },

        /**
        * show the carousel pod set the legend box and esri logo
        * @memberOf widgets/searchResult/searchResult
        */
        _wipeInResults: function () {

            topic.publish("setLegendPositionUp");
            domStyle.set(this.divCarouselContent, "display", "block");
            domClass.add(this.divImageBackground, "esriCTResultImageBlock");
            domClass.replace(this.divCarouselContent, "esriCTbottomPanelHeight", "esriCTzeroHeight");
            domAttr.set(this.imgToggleResults, "src", "js/library/themes/images/down.png");
            domClass.replace(this.divToggle, "esriCTbottomPanelPosition", "esriCTzeroBottom");
        },

        /**
        * Hide the carousel pod set the legend box and ersi logo
        * @memberOf widgets/searchResult/searchResult
        */
        _wipeOutResults: function () {
            domStyle.set(this.divCarouselContent, "display", "none");
            domClass.replace(this.divCarouselContent, "esriCTzeroHeight", "esriCTbottomPanelHeight");
            domAttr.set(this.imgToggleResults, "src", "js/library/themes/images/up.png");
            domClass.replace(this.divToggle, "esriCTzeroBottom", "esriCTbottomPanelPosition");
            if (domStyle.get(this.divImageBackground, "display") === "block") {
                topic.publish("setLegendPositionDown");
            }
        },

        /**
        * create carousel pod and set it content
        * @memberOf widgets/searchResult/searchResult
        */
        _createBoxContainer: function () {
            var divCarouselPod, divGallerycontent, divcommentcontent, divHeader, divsearchcontent;
            domClass.add(this.resultboxPanelContent, "esriCTresultboxPanelContent");
            array.forEach(dojo.configData.Order, lang.hitch(this, function (carouselPod) {
                divCarouselPod = domConstruct.create("div", { "class": "esriCTBoxContainer" }, this.resultboxPanelContent);
                this.divPodInfoContainer = domConstruct.create("div", { "class": "esriCTInfoContainer" }, divCarouselPod);
                switch (carouselPod) {
                case "search":
                    divHeader = domConstruct.create("div", { "class": "esriCTDivHeadercontainer" }, this.divPodInfoContainer);
                    domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": sharedNls.titles.serchResultText }, divHeader);
                    divsearchcontent = domConstruct.create("div", { "class": "esriCTResultContent" }, divHeader);
                    domConstruct.create("div", { "class": "esriCTDivSearchContent" }, divsearchcontent);
                    domClass.add(divsearchcontent, "esriCTDivResultContentHeight");
                    break;
                case "facility":
                    this.facilityContainer = domConstruct.create("div", { "class": "esriCTDivHeadercontainer" }, this.divPodInfoContainer);
                    this.divfacilitycontent = domConstruct.create("div", {}, this.facilityContainer);
                    domConstruct.create("div", { "class": "esriCTdivFacilityContent" }, this.divfacilitycontent);
                    domClass.add(this.divfacilitycontent, "esriCTDivResultContentHeight");
                    break;
                case "directions":
                    this.directionContainer = domConstruct.create("div", { "class": "esriCTDivHeadercontainer" }, this.divPodInfoContainer);
                    this.divdirectioncontent = domConstruct.create("div", {}, this.directionContainer);
                    domConstruct.create("div", { "class": "esriCTDivDirectioncontent" }, this.divdirectioncontent);
                    domClass.add(this.divdirectioncontent, "esriCTDivResultContentHeight");
                    break;
                case "photogallery":
                    divHeader = domConstruct.create("div", { "class": "esriCTDivHeadercontainer" }, this.divPodInfoContainer);
                    domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": sharedNls.titles.galleryText }, divHeader);
                    divGallerycontent = domConstruct.create("div", { "class": "esriCTResultContent" }, divHeader);
                    domConstruct.create("div", { "class": "esriCTDivGalleryContent" }, divGallerycontent);
                    domClass.add(divGallerycontent, "esriCTDivResultContentHeight");
                    break;
                case "comments":
                    divHeader = domConstruct.create("div", { "class": "esriCTDivHeadercontainer" }, this.divPodInfoContainer);
                    domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": sharedNls.titles.commentText }, divHeader);
                    divcommentcontent = domConstruct.create("div", { "class": "esriCTResultContent" }, divHeader);
                    domConstruct.create("div", { "class": "esriCTDivCommentContent" }, divcommentcontent);
                    domClass.add(divcommentcontent, "esriCTDivResultContentHeight");
                    break;
                }
            }));
        },

        /**
        * show the carousel pod
        * @memberOf widgets/searchResult/searchResult
        */
        _carouselPodDisplayBlock: function () {
            domStyle.set(this.divCarouselContent, "display", "block");
        },

        /**
        * set the content in (Search result) carousel pod
        * @memberOf widgets/searchResult/searchResult
        */
        _setSearchContent: function (result) {
            var divHeaderContent, i, resultcontent = [];
            divHeaderContent = query('.esriCTDivSearchContent');
            domConstruct.empty(divHeaderContent[0]);
            this.spanFeatureListContainer = domConstruct.create("div", { "class": "esriCTSpanFeatureListContainer", "innerHTML": string.substitute(sharedNls.titles.numberOfFeaturesFoundNearAddress, [result.searchResult.features.length]) }, divHeaderContent[0]);
            for (i = 0; i < result.searchResult.features.length; i++) {
                resultcontent[i] = domConstruct.create("div", { "class": "esriCTSearchResultInfotext", "innerHTML": result.searchResult.features[i].attributes.NAME + "(" + parseFloat(result.searchResult.features[i].distance).toFixed(2) + "miles" + ")" }, divHeaderContent[0]);
                domAttr.set(resultcontent[i], "value", i);
                this.own(on(resultcontent[i], "click", lang.hitch(this, this._callFunctionOnClick, result, resultcontent[i], divHeaderContent[0])));
            }
            domClass.add(divHeaderContent[0].parentElement, "esriCTCarouselContentHeight");
            if (this.searchResultScrollBar) {
                this.searchResultScrollBar.removeScrollBar();
            }
            this.searchResultScrollBar = new ScrollBar({ domNode: divHeaderContent[0].parentElement });
            this.searchResultScrollBar.setContent(divHeaderContent[0]);
            this.searchResultScrollBar.createScrollBar();
        },

        /**
        * call all the function when click on search result data
        * @memberOf widgets/searchResult/searchResult
        */
        _callFunctionOnClick: function (result, resultcontent, divHeaderContent) {
            this.isChecked = true;
            this._showRouteOnClickResult(result, resultcontent);
            this._setFacility(result, resultcontent);
            topic.subscribe("setSearchInfo", lang.hitch(this, function (result) {
                this._setDirection(result, resultcontent);
            }));
            this._setGallery(result, resultcontent);
            this._setComment(result, resultcontent);
        },

        /**
        * call show route function when click on search result data
        * @memberOf widgets/searchResult/searchResult
        */
        _showRouteOnClickResult: function (result, resultcontent) {
            var i;
            for (i = 0; i <= result.searchResult.features.length; i++) {
                if (i === resultcontent.value) {
                    topic.publish("showRoute", result.searchResult, RouteParameters, result.searchResult.features[i], SpatialReference, units, result.mapPoint);
                }
            }
        },

        /**
        * set the content in (Facility) carousel pod if user click on search result data
        * @memberOf widgets/searchResult/searchResult
        */
        _setFacility: function (result, resultcontent) {
            var divHeaderContent, divHeader, divFacilityContainer, divFacilityContent, i;
            divHeaderContent = query('.esriCTdivFacilityContent');
            domConstruct.empty(divHeaderContent[0]);
            divHeader = domConstruct.create("div", {}, divHeaderContent[0]);
            if (resultcontent) {
                if (result.searchResult.features.length) {
                    for (i = 0; i < result.searchResult.features.length; i++) {
                        if (i === resultcontent.value) {
                            domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": result.searchResult.features[i].attributes.NAME }, divHeader);
                            divFacilityContainer = domConstruct.create("div", { "class": "esriCTResultContent" }, divHeaderContent[0]);
                            divFacilityContent = domConstruct.create("div", {}, divFacilityContainer);
                            domConstruct.create("div", { "class": "esriCTInfotext", "innerHTML": sharedNls.titles.facitilyPanelAccessFeeText + " " + result.searchResult.features[i].attributes.ACCESSFEE }, divFacilityContent);
                            domConstruct.create("div", { "class": "esriCTInfotext", "innerHTML": sharedNls.titles.facitilyPanelHoursOpenForText + " " + result.searchResult.features[i].attributes.OPERHOURS }, divFacilityContent);
                            domConstruct.create("div", { "class": "esriCTInfotext", "innerHTML": sharedNls.titles.facitilyPanelManagementUnitText + " " + result.searchResult.features[i].attributes.MANAGEUNIT }, divFacilityContent);
                            domConstruct.create("div", { "class": "esriCTInfotext", "innerHTML": sharedNls.titles.facitilyPanelMarinaText + " " + result.searchResult.features[i].attributes.Type }, divFacilityContent);
                            domClass.add(divFacilityContainer, "esriCTCarouselContentHeight");
                            break;
                        }
                    }
                }
            }
            if (this.facilityScrollBar) {
                this.facilityScrollBar.removeScrollBar();
            }
            this.facilityScrollBar = new ScrollBar({ domNode: divFacilityContainer });
            this.facilityScrollBar.setContent(divFacilityContent);
            this.facilityScrollBar.createScrollBar();
        },

        /**
        * set the content in (Facility) carousel pod when load at first time
        * @memberOf widgets/searchResult/searchResult
        */
        _setFacilityCarouselPod: function (result) {
            if (!this.isChecked) {
                var divHeaderContent, divHeader, divFacilityContainer, divFacilityContent;
                divHeaderContent = query('.esriCTdivFacilityContent');
                domConstruct.empty(divHeaderContent[0]);
                divHeader = domConstruct.create("div", {}, divHeaderContent[0]);
                domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": result.searchResult.features[0].attributes.NAME }, divHeader);
                divFacilityContainer = domConstruct.create("div", { "class": "esriCTResultContent" }, divHeaderContent[0]);
                divFacilityContent = domConstruct.create("div", {}, divFacilityContainer);
                domConstruct.create("div", { "class": "esriCTInfotext", "innerHTML": sharedNls.titles.facitilyPanelAccessFeeText + " " + result.searchResult.features[0].attributes.ACCESSFEE }, divFacilityContent);
                domConstruct.create("div", { "class": "esriCTInfotext", "innerHTML": sharedNls.titles.facitilyPanelHoursOpenForText + " " + result.searchResult.features[0].attributes.OPERHOURS }, divFacilityContent);
                domConstruct.create("div", { "class": "esriCTInfotext", "innerHTML": sharedNls.titles.facitilyPanelManagementUnitText + " " + result.searchResult.features[0].attributes.MANAGEUNIT }, divFacilityContent);
                domConstruct.create("div", { "class": "esriCTInfotext", "innerHTML": sharedNls.titles.facitilyPanelMarinaText + " " + result.searchResult.features[0].attributes.Type }, divFacilityContent);
                domClass.add(divFacilityContainer, "esriCTCarouselContentHeight");
                if (this.facilityScrollBar) {
                    this.facilityScrollBar.removeScrollBar();
                }
                this.facilityScrollBar = new ScrollBar({ domNode: divFacilityContainer });
                this.facilityScrollBar.setContent(divFacilityContent);
                this.facilityScrollBar.createScrollBar();
            }
        },

        /**
        * set the content in (Direction) carousel pod if user click on search result data
        * @memberOf widgets/searchResult/searchResult
        */
        _setDirection: function (result, resultcontent) {
            var divHeaderContent, i, divHeader, divDirectionContainer, divDrectionContent, distanceAndDuration, printButton;
            divHeaderContent = query('.esriCTDivDirectioncontent');
            domConstruct.empty(divHeaderContent[0]);
            divHeader = domConstruct.create("div", {}, divHeaderContent[0]);
            this.divPodInfoContainer.appendChild(this.divDirectionMain);
            if (resultcontent) {
                if (result.searchResult.features.length) {
                    for (i = 0; i < result.searchResult.features.length; i++) {
                        if (i === resultcontent.value) {
                            domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": sharedNls.titles.directionText + " " + result.searchResult.features[i].attributes.NAME }, divHeader);
                            printButton = domConstruct.create("div", { "class": "esriCTDivPrint" }, divHeader);
                            this.own(on(printButton, "click", lang.hitch(this, this._printMap)));
                            divDirectionContainer = domConstruct.create("div", { "class": "esriCTResultContent" }, divHeaderContent[0]);
                            distanceAndDuration = domConstruct.create("div", { "class": "esriCTDistanceAndDuration" }, divHeader);
                            domConstruct.create("div", { "class": "esriCTDivDistance", "innerHTML": sharedNls.titles.directionTextDistance + parseFloat(result.directionResult[0].directions.totalLength).toFixed(2) + "mi" }, distanceAndDuration);
                            domConstruct.create("div", { "class": "esriCTDivTime", "innerHTML": sharedNls.titles.directionTextTime + parseFloat(result.directionResult[0].directions.totalDriveTime).toFixed(2) + "min" }, distanceAndDuration);
                            divDrectionContent = domConstruct.create("div", {}, divDirectionContainer);
                            domConstruct.create("div", { "class": "esriCTInfotext", "innerHTML": ("1") + "." + result.directionResult[0].directions.features[i].attributes.text.replace('Location 1', result.addressResult) }, divDrectionContent);
                            for (i = 1; i < result.directionResult[0].directions.features.length; i++) {
                                domConstruct.create("div", { "class": "esriCTInfotext", "innerHTML": (i + 1) + "." + result.directionResult[0].directions.features[i].attributes.text + "(" + parseFloat(result.directionResult[0].directions.features[i].attributes.length).toFixed(2) + "miles" + ")" }, divDrectionContent);
                            }
                            domClass.add(divDirectionContainer, "esriCTCarouselContentHeight");
                            if (this.directionScrollBar) {
                                this.directionScrollBar.removeScrollBar();
                            }
                            this.directionScrollBar = new ScrollBar({ domNode: divDirectionContainer });
                            this.directionScrollBar.setContent(divDrectionContent);
                            this.directionScrollBar.createScrollBar();
                        }
                    }
                }
            }
        },

        /**
        * initialize the object of printMap Widget
        * @memberOf widgets/searchResult/searchResult
        */
        _printMap: function () {
            this.printMap = new PrintMap({ map: this.map });
        },

        /**
        * set the content in (Direction) carousel pod when load at first time
        * @memberOf widgets/searchResult/searchResult
        */
        _setDirectionCarouselPod: function (result) {
            var divHeaderContent, i, divHeader, divDirectionContainer, divDrectionContent, distanceAndDuration, printButton;
            divHeaderContent = query('.esriCTDivDirectioncontent');
            domConstruct.empty(divHeaderContent[0]);
            divHeader = domConstruct.create("div", {}, divHeaderContent[0]);
            this.divPodInfoContainer.appendChild(this.divDirectionMain);
            domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": sharedNls.titles.directionText + " " + result.searchResult.features[0].attributes.NAME }, divHeader);
            printButton = domConstruct.create("div", { "class": "esriCTDivPrint" }, divHeader);
            this.own(on(printButton, "click", lang.hitch(this, function () {
                this.printMap = new PrintMap({ map: this.map });
            })));
            divDirectionContainer = domConstruct.create("div", { "class": "esriCTResultContent" }, divHeaderContent[0]);
            distanceAndDuration = domConstruct.create("div", { "class": "esriCTDistanceAndDuration" }, divHeader);
            domConstruct.create("div", { "class": "esriCTDivDistance", "innerHTML": sharedNls.titles.directionTextDistance + parseFloat(result.directionResult[0].directions.totalLength).toFixed(2) + "mi" }, distanceAndDuration);
            domConstruct.create("div", { "class": "esriCTDivTime", "innerHTML": sharedNls.titles.directionTextTime + parseFloat(result.directionResult[0].directions.totalDriveTime).toFixed(2) + "min" }, distanceAndDuration);
            divDrectionContent = domConstruct.create("div", {}, divDirectionContainer);
            domConstruct.create("div", { "class": "esriCTInfotext", "innerHTML": ("1") + "." + result.directionResult[0].directions.features[0].attributes.text.replace('Location 1', result.addressResult) }, divDrectionContent);
            for (i = 1; i < result.directionResult[0].directions.features.length; i++) {
                domConstruct.create("div", { "class": "esriCTInfotext", "innerHTML": (i + 1) + "." + result.directionResult[0].directions.features[i].attributes.text + "(" + parseFloat(result.directionResult[0].directions.features[i].attributes.length).toFixed(2) + "miles" + ")" }, divDrectionContent);
            }
            domClass.add(divDirectionContainer, "esriCTCarouselContentHeight");
            if (this.directionScrollBar) {
                this.directionScrollBar.removeScrollBar();
            }
            this.directionScrollBar = new ScrollBar({ domNode: divDirectionContainer });
            this.directionScrollBar.setContent(divDrectionContent);
            this.directionScrollBar.createScrollBar();
        },

        /**
        * set the content in (Comments) carousel pod
        * @memberOf widgets/searchResult/searchResult
        */
        _setComment: function (result, resultcontent) {
            var divHeaderContent, i, j, divHeaderStar, divStar, utcMilliseconds, k, l, isCommentFound;
            if (!this.isChecked) {
                divHeaderContent = query('.esriCTDivCommentContent');
                domConstruct.empty(divHeaderContent[0]);
                for (i = 0; i < 10; i++) {
                    if (result[i]) {
                        for (j = 0; j < 5; j++) {
                            divHeaderStar = domConstruct.create("div", { "class": "esriCTHeaderRatingStar" }, divHeaderContent[0]);
                            divStar = domConstruct.create("div", { "class": "esriCTRatingStar" }, divHeaderStar);
                            if (j < result[i].attributes.RANK) {
                                domClass.add(divStar, "esriCTRatingStarChecked");
                            }
                        }
                        if (result[i].attributes.COMMENTS) {
                            utcMilliseconds = Number(dojo.string.substitute(dojo.configData.CommentsInfoPopupFieldsCollection.SubmitDate, result[i].attributes));
                            domConstruct.create("div", {
                                "class": "esriCTCommentDate",
                                "innerHTML": dojo.date.locale.format(this.utcTimestampFromMs(utcMilliseconds), {
                                    datePattern: dojo.configData.DateFormat,
                                    selector: "date"
                                })
                            }, divHeaderContent[0]);
                            domConstruct.create("div", { "class": "esriCTInfotext", "innerHTML": result[i].attributes.COMMENTS }, divHeaderContent[0]);
                        } else {
                            domConstruct.create("div", { "class": "esriCTInfotext", "innerHTML": sharedNls.errorMessages.noCommentAvaiable }, divHeaderContent[0]);
                        }
                    }
                }
            } else {
                isCommentFound = false;
                if (result.CommentResult.length !== 0) {
                    divHeaderContent = query('.esriCTDivCommentContent');
                    domConstruct.empty(divHeaderContent[0]);
                    for (k = 0; k < result.searchResult.features.length; k++) {
                        if (k === resultcontent.value) {
                            for (l = 0; l < result.CommentResult.length; l++) {
                                if (result.searchResult.features[k].attributes.OBJECTID === result.CommentResult[l].attributes.id) {
                                    isCommentFound = true;
                                    for (j = 0; j < 5; j++) {
                                        divHeaderStar = domConstruct.create("div", { "class": "esriCTHeaderRatingStar" }, divHeaderContent[0]);
                                        divStar = domConstruct.create("div", { "class": "esriCTRatingStar" }, divHeaderStar);
                                        if (j < result.CommentResult[l].attributes.RANK) {
                                            domClass.add(divStar, "esriCTRatingStarChecked");
                                        }
                                    }
                                    if (result.CommentResult[l].attributes.COMMENTS) {
                                        utcMilliseconds = Number(dojo.string.substitute(dojo.configData.CommentsInfoPopupFieldsCollection.SubmitDate, result.CommentResult[l].attributes));
                                        domConstruct.create("div", {
                                            "class": "esriCTCommentDate",
                                            "innerHTML": dojo.date.locale.format(this.utcTimestampFromMs(utcMilliseconds), {
                                                datePattern: dojo.configData.DateFormat,
                                                selector: "date"
                                            })
                                        }, divHeaderContent[0]);
                                        domConstruct.create("div", { "class": "esriCTInfotext", "innerHTML": result.CommentResult[l].attributes.COMMENTS }, divHeaderContent[0]);
                                    } else {
                                        domConstruct.create("div", { "class": "esriCTInfotext", "innerHTML": sharedNls.errorMessages.noCommentAvaiable }, divHeaderContent[0]);
                                    }
                                }
                            }
                        }
                    }
                }
                if (!isCommentFound) {
                    domConstruct.create("div", { "class": "esriCTInfotext", "innerHTML": sharedNls.errorMessages.noCommentAvaiable }, divHeaderContent[0]);
                }
            }
            domClass.add(divHeaderContent[0].parentElement, "esriCTCarouselContentHeight");
            if (this.commentScrollBar) {
                this.commentScrollBar.removeScrollBar();
            }
            this.commentScrollBar = new ScrollBar({ domNode: divHeaderContent[0].parentElement });
            this.commentScrollBar.setContent(divHeaderContent[0]);
            this.commentScrollBar.createScrollBar();
        },

        /**
        * convert the UTC time stamp from Millisecond
        * @returns Date
        * @memberOf widgets/searchResult/searchResult
        */
        utcTimestampFromMs: function (utcMilliseconds) {
            return this.localToUtc(new Date(utcMilliseconds));
        },

        /**
        * @returns Date
        * @memberOf widgets/searchResult/searchResult
        */
        localToUtc: function (localTimestamp) {
            return new Date(localTimestamp.getTime() + (localTimestamp.getTimezoneOffset() * 60000));
        },

        /**
        * set the images in (Gallery) carousel pod
        * @memberOf widgets/searchResult/searchResult
        */
        _setGallery: function (selectedFeature, resultcontent) {
            var divHeaderContent, layerIndex, layerID, i;
            divHeaderContent = query('.esriCTDivGalleryContent');
            domConstruct.empty(divHeaderContent[0]);
outerLoop:
            for (i = 0; i < selectedFeature.searchResult.features.length; i++) {
                if (this.map._layers) {
                    for (layerIndex = 0; layerIndex < dojo.configData.SearchSettings.length; layerIndex++) {
                        for (layerID in this.map._layers) {
                            if (this.map._layers.hasOwnProperty(layerID)) {
                                if (this.map._layers[layerID].url && this.map._layers[layerID].hasAttachments && (this.map._layers[layerID].url === dojo.configData.SearchSettings[layerIndex].QueryURL)) {
                                    if (!this.isChecked) {
                                        this.map._layers[layerID].queryAttachmentInfos(selectedFeature.searchResult.features[0].attributes[this.map._layers[layerID].objectIdField], lang.hitch(this, this._setAttachments), this._logError);
                                        break outerLoop;
                                    }
                                    if (i === resultcontent.value) {
                                        this.map._layers[layerID].queryAttachmentInfos(selectedFeature.searchResult.features[i].attributes[this.map._layers[layerID].objectIdField], lang.hitch(this, this._setAttachments), this._logError);
                                        break outerLoop;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },

        /**
        * query on attachment and show the image on carousel pod
        * @memberOf widgets/searchResult/searchResult
        */
        _setAttachments: function (response, resultcontent) {
            var divAttchment, divHeaderContent, divPreviousImg, divNextImg;
            this.imageCount = 0;
            divHeaderContent = query('.esriCTDivGalleryContent');
            if (response.length > 1) {
                divPreviousImg = domConstruct.create("div", { "class": "esriCTImgPrev" }, divHeaderContent[0]);
                divNextImg = domConstruct.create("div", { "class": "esriCTImgNext" }, divHeaderContent[0]);
                divAttchment = domConstruct.create("img", { "class": "esriCTDivAttchment" }, divHeaderContent[0]);
                domAttr.set(divAttchment, "src", response[0].url);
                this.own(on(divPreviousImg, "click", lang.hitch(this, this._previousImage, response, divAttchment)));
                this.own(on(divNextImg, "click", lang.hitch(this, this._nextImage, response, divAttchment)));

            } else if (response.length === 1) {
                divAttchment = domConstruct.create("img", { "class": "esriCTDivAttchment" }, divHeaderContent[0]);
                domAttr.set(divAttchment, "src", response[0].url);
            } else {
                domConstruct.create("div", { "class": "esriCTGalleryBox", "innerHTML": sharedNls.errorMessages.imageDoesNotFound }, divHeaderContent[0]);
            }
        },

        _previousImage: function (response, divAttchment) {
            this.imageCount--;
            if (this.imageCount < 0) {
                this.imageCount = response.length - 1;
            }
            domAttr.set(divAttchment, "src", response[this.imageCount].url);
        },
        _nextImage: function (response, divAttchment) {
            this.imageCount++;
            if (this.imageCount === response.length) {
                this.imageCount = 0;
            }
            domAttr.set(divAttchment, "src", response[this.imageCount].url);
        },
        /**
        * show error in console
        * @memberOf widgets/searchResult/searchResult
        */
        _logError: function (error) {
            console.log(error);
        }
    });
});
