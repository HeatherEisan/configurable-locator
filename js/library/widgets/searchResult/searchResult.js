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
    "dojo/text!./templates/searchResultTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/dom-class",
    "dojo/query",
    "dojo/topic",
    "dojo/string",
    "../scrollBar/scrollBar"
], function (declare, domConstruct, lang, domAttr, domStyle, dom, array, on, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, domClass, query, topic, string, ScrollBar) {

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



        /**
        * initialize carousel pod
        * @class
        * @name widgets/searchResult/searchResult
        */
        startup: function () {
            topic.subscribe("ShowHideResult", lang.hitch(this, function (isVisible) {
                this._showHideResult(isVisible);
            }));
            dom.byId("esriCTParentDivContainer").appendChild(this.divToggle);
            dom.byId("esriCTParentDivContainer").appendChild(this.divCarouselContent);
            this.own(on(this.divImageBackground, "click", lang.hitch(this, function () {
                var isVisible;
                if (domClass.contains(this.divCarouselContent, "esriCTzeroHeight")) {
                    isVisible = true;
                } else {
                    isVisible = false;
                }
                this._showHideResult(isVisible);
            })));
            this._createBoxContainer();
            topic.subscribe("setSearchInfo", lang.hitch(this, function (result) {
                this._setSearchContent(result);
                this._setFacility(result);
                this._setGallery(result.searchResult.features[0]);
                this._setDirection(result);
            }));
            topic.subscribe("getFeatures", lang.hitch(this, function (result) {
                this._setComment(result);
            }));
        },

        /**
        * show and hide carousel pod
        * @param {boolean} isVisible used for show and hide carousel pod
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
        * show the carousel pod set the legend box and ersi log according to it.
        * @memberOf widgets/searchResult/searchResult
        */
        _wipeInResults: function () {
            topic.publish("setMaxLegendLength");
            domClass.add(this.divImageBackground, "esriCTResultImageBlock");
            domClass.replace(this.divCarouselContent, "esriCTbottomPanelHeight", "esriCTzeroHeight");
            domAttr.set(this.imgToggleResults, "src", "js/library/themes/images/down.png");
            domClass.replace(this.divToggle, "esriCTbottomPanelPosition", "esriCTzeroBottom");
        },

        /**
        * Hide the carousel pod set the legend box and ersi log according to it.
        * @memberOf widgets/searchResult/searchResult
        */
        _wipeOutResults: function () {
            topic.publish("setMinLegendLength");
            domClass.replace(this.divCarouselContent, "esriCTzeroHeight", "esriCTbottomPanelHeight");
            domAttr.set(this.imgToggleResults, "src", "js/library/themes/images/up.png");
            domClass.replace(this.divToggle, "esriCTzeroBottom", "esriCTbottomPanelPosition");
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
        * set the content in (Search result) carousel pod
        * @memberOf widgets/searchResult/searchResult
        */
        _setSearchContent: function (result) {
            var divHeaderContent, i;
            divHeaderContent = query('.esriCTDivSearchContent');
            domConstruct.empty(divHeaderContent[0]);
            this.spanFeatureListContainer = domConstruct.create("div", { "class": "esriCTSpanFeatureListContainer", "innerHTML": string.substitute(sharedNls.titles.numberOfFeaturesFoundNearAddress, [result.searchResult.features.length]) }, divHeaderContent[0]);
            for (i = 0; i < result.searchResult.features.length; i++) {
                domConstruct.create("div", { "class": "esriCTInfotext", "innerHTML": result.searchResult.features[i].attributes.NAME + "(" + parseFloat(result.searchResult.features[i].distance).toFixed(2) + "miles" + ")" }, divHeaderContent[0]);
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
        * set the content in (Facility) carousel pod
        * @memberOf widgets/searchResult/searchResult
        */
        _setFacility: function (result) {
            var divHeaderContent, divHeader, divFacilityContainer, divFacilityContent;

            divHeaderContent = query('.esriCTdivFacilityContent');

            domConstruct.empty(divHeaderContent[0]);
            divHeader = domConstruct.create("div", {}, divHeaderContent[0]);
            if (result.searchResult.features.length) {
                domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": result.searchResult.features[0].attributes.NAME }, divHeader);
            }
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
        },

        /**
        * set the content in (Direction) carousel pod
        * @memberOf widgets/searchResult/searchResult
        */
        _setDirection: function (result) {
            var divHeaderContent, i, divHeader, divDirectionContainer, divDrectionContent;
            divHeaderContent = query('.esriCTDivDirectioncontent');
            domConstruct.empty(divHeaderContent[0]);
            divHeader = domConstruct.create("div", {}, divHeaderContent[0]);

            this.divPodInfoContainer.appendChild(this.divDirectionMain);
            domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": sharedNls.titles.directionText + " " + result.searchResult.features[0].attributes.NAME }, divHeader);
            divDirectionContainer = domConstruct.create("div", { "class": "esriCTResultContent" }, divHeaderContent[0]);
            divDrectionContent = domConstruct.create("div", {}, divDirectionContainer);
            domConstruct.create("div", { "class": "esriCTInfotext", "innerHTML": ("1") + "." + result.directionResult[0].directions.features[0].attributes.text.replace('Location 1', result.addressResult) }, divDrectionContent);
            for (i = 1; i < result.directionResult[0].directions.features.length; i++) {
                domConstruct.create("div", { "class": "esriCTInfotext", "innerHTML": (i + 1) + "." + result.directionResult[0].directions.features[i].attributes.text }, divDrectionContent);
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
        _setComment: function (result) {
            var divHeaderContent, i, j, divHeaderStar;
            divHeaderContent = query('.esriCTDivCommentContent');
            domConstruct.empty(divHeaderContent[0]);
            for (i = 0; i < 10; i++) {
                if (result.features[i]) {
                    for (j = 0; j < 5; j++) {
                        divHeaderStar = domConstruct.create("div", { "class": "esriCTRatingStar" }, divHeaderContent[0]);
                        if (j < result.features[i].attributes.RANK) {
                            domClass.add(divHeaderStar, "esriCTRatingStarChecked");
                        }
                    }
                    if (result.features[i].attributes.COMMENTS) {
                        domConstruct.create("div", { "class": "esriCTInfotext", "innerHTML": result.features[i].attributes.COMMENTS }, divHeaderContent[0]);
                    } else {
                        domConstruct.create("div", { "class": "esriCTInfotext", "innerHTML": sharedNls.errorMessages.noCommentAvaiable }, divHeaderContent[0]);
                    }
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
        * set the images in (Gallery) carousel pod
        * @memberOf widgets/searchResult/searchResult
        */
        _setGallery: function (selectedFeature) {
            var divHeaderContent, layerIndex, layerID;
            divHeaderContent = query('.esriCTDivGalleryContent');
            domConstruct.empty(divHeaderContent[0]);
            if (this.map._layers) {
                for (layerIndex = 0; layerIndex < dojo.configData.SearchSettings.length; layerIndex++) {
                    for (layerID in this.map._layers) {
                        if (this.map._layers.hasOwnProperty(layerID)) {
                            if (this.map._layers[layerID].url && this.map._layers[layerID].hasAttachments && (this.map._layers[layerID].url === dojo.configData.SearchSettings[layerIndex].QueryURL)) {
                                this.map._layers[layerID].queryAttachmentInfos(selectedFeature.attributes[this.map._layers[layerID].objectIdField], this._setAttachments, this._logError);
                            }
                        }
                    }
                }
            }
        },
        _setAttachments: function (response) {
            var i, divAttchment, divHeaderContent;
            divHeaderContent = query('.esriCTDivGalleryContent');
            if (response.length > 0) {
                for (i = 0; i < response.length; i++) {
                    divAttchment = domConstruct.create("img", { "class": "esriCTDivAttchment" }, divHeaderContent[0]);
                    domAttr.set(divAttchment, "src", response[i].url);
                }
            } else {
                domConstruct.create("div", { "class": "esriCTGalleryBox", "innerHTML": sharedNls.errorMessages.imageDoesNotFound }, divHeaderContent[0]);
            }
        },

        _logError: function (error) {
            console.log(error);
        }
    });
});
