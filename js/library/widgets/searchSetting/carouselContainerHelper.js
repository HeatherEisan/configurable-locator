/*global define,dojo,dojoConfig:true,alert,console,esri,Modernizr,dijit */
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
    "dojo/dom",
    "dojo/dom-class",
    "dojo/query",
    "dojo/string",
    "esri/tasks/query",
    "dojo/text!./templates/searchSettingTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/topic"

], function (declare, domConstruct, domStyle, domAttr, lang, on, dom, domClass, query, string, Query, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic) {
    // ========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,

        /**
        * create carousel pod and set it content
        * @memberOf widgets/searchSettings/carouselContainerHelper
        */
        createCarouselPod: function () {
            var divCarouselPod, divGallerycontent, divPodInfoContainer, divcommentcontent, divHeader, divsearchcontent, i, key, carouselPodKey;
            for (i = 0; i < dojo.configData.BottomPanelInfoPodSettings.length; i++) {
                for (key in dojo.configData.BottomPanelInfoPodSettings[i]) {
                    if (dojo.configData.BottomPanelInfoPodSettings[i].hasOwnProperty(key)) {
                        if (dojo.configData.BottomPanelInfoPodSettings && dojo.configData.BottomPanelInfoPodSettings[i][key].Enabled) {
                            divCarouselPod = domConstruct.create("div", { "class": "esriCTBoxContainer" });
                            divPodInfoContainer = domConstruct.create("div", { "class": "esriCTInfoContainer" }, divCarouselPod);
                            carouselPodKey = key;
                            if (!dojo.configData.ActivitySearchSettings[0].CommentsSettings.Enabled) {
                                if (carouselPodKey.toLowerCase() === "commentspod") {
                                    carouselPodKey = "default";
                                }
                            }
                        } else {
                            carouselPodKey = "default";
                        }
                        switch (carouselPodKey.toLowerCase()) {
                        case "searchresultpod":
                            divHeader = domConstruct.create("div", { "class": "esriCTDivHeadercontainer" }, divPodInfoContainer);
                            domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": sharedNls.titles.serchResultText }, divHeader);
                            divsearchcontent = domConstruct.create("div", { "class": "esriCTResultContent" }, divHeader);
                            domConstruct.create("div", { "class": "esriCTDivSearchResulContent" }, divsearchcontent);
                            break;
                        case "facilityinformationpod":
                            this.facilityContainer = domConstruct.create("div", { "class": "esriCTDivHeadercontainer" }, divPodInfoContainer);
                            this.divfacilitycontent = domConstruct.create("div", {}, this.facilityContainer);
                            domConstruct.create("div", { "class": "esriCTdivFacilityContent" }, this.divfacilitycontent);
                            break;
                        case "directionspod":
                            this.directionContainer = domConstruct.create("div", { "class": "esriCTDivHeadercontainer" }, divPodInfoContainer);
                            domConstruct.create("div", { "class": "esriCTDivDirectioncontent" }, this.directionContainer);
                            break;
                        case "gallerypod":
                            divHeader = domConstruct.create("div", { "class": "esriCTDivHeadercontainer" }, divPodInfoContainer);
                            domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": sharedNls.titles.galleryText }, divHeader);
                            divGallerycontent = domConstruct.create("div", { "class": "esriCTResultContent" }, divHeader);
                            domConstruct.create("div", { "class": "esriCTDivGalleryContent" }, divGallerycontent);
                            break;
                        case "commentspod":
                            divHeader = domConstruct.create("div", { "class": "esriCTDivHeadercontainer" }, divPodInfoContainer);
                            domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": sharedNls.titles.commentText }, divHeader);
                            divcommentcontent = domConstruct.create("div", { "class": "esriCTResultContent" }, divHeader);
                            domConstruct.create("div", { "class": "esriCTDivCommentContent" }, divcommentcontent);
                            break;
                        case "default":
                            break;
                        }
                        if (carouselPodKey.toLowerCase() !== "default") {
                            domAttr.set(divCarouselPod, "CarouselPodName", carouselPodKey);
                            this.carouselPodData.push(divCarouselPod);
                        }
                    }
                }
            }
        },

        /**
        * set the content in (Search result) carousel pod
        * @param {object} result contains features
        * @param {boolean} isBufferNeeded
        * @param {object} queryURL contains Layer URL
        * @param {string} widgetName contains name of widgets
        * @memberOf widgets/searchResult/carouselContainerHelper
        */
        setSearchContent: function (result, isBufferNeeded, queryURL, widgetName) {
            var isPodEnabled = this.getPodStatus("SearchResultPod"), subStringRouteUnit, searchContenTitle, searchedFacilityObject, divHeaderContent, i, resultcontent = [], milesCalulatedData, searchContenData;
            if (isPodEnabled) {
                if (widgetName.toLowerCase() === "unifiedsearch") {
                    searchContenTitle = sharedNls.titles.numberOfFeaturesFoundNearAddress;
                    searchContenData = this.getKeyValue(dojo.configData.ActivitySearchSettings[0].SearchDisplayFields);
                } else if (widgetName.toLowerCase() === "activitysearch") {
                    searchContenTitle = sharedNls.titles.numberOfFoundFeatureNearAddress;
                    searchContenData = this.getKeyValue(dojo.configData.ActivitySearchSettings[0].SearchDisplayFields);
                } else if (widgetName.toLowerCase() === "event") {
                    searchContenTitle = sharedNls.titles.numberOfFoundEventsNearAddress;
                    searchContenData = this.getKeyValue(dojo.configData.EventSearchSettings[0].SearchDisplayFields);
                }
                divHeaderContent = query('.esriCTDivSearchResulContent');
                if (divHeaderContent.length > 0) {
                    domConstruct.empty(divHeaderContent[0]);
                    this.spanFeatureListContainer = domConstruct.create("div", { "class": "esriCTSpanFeatureListContainer", "innerHTML": string.substitute(searchContenTitle, [result.length]) }, divHeaderContent[0]);
                    for (i = 0; i < result.length; i++) {
                        if (!isBufferNeeded && result[i].distance) {
                            subStringRouteUnit = this._getSubStringUnitData();
                            milesCalulatedData = " (" + parseFloat(result[i].distance).toFixed(2) + subStringRouteUnit + ")";
                        } else {
                            milesCalulatedData = "";
                        }
                        if (widgetName.toLowerCase() !== "event") {
                            resultcontent[i] = domConstruct.create("div", { "class": "esriCTSearchResultInfotext", "innerHTML": result[i].attributes[searchContenData] + milesCalulatedData }, divHeaderContent[0]);
                            domClass.add(resultcontent[0], "esriCTDivHighlightFacility");
                            domAttr.set(resultcontent[i], "value", i);
                            searchedFacilityObject = { "FeatureData": result, "SelectedRow": resultcontent[i], "IsBufferNeeded": isBufferNeeded, "QueryLayer": queryURL, "WidgetName": widgetName };
                            this.own(on(resultcontent[i], "click", lang.hitch(this, this._clickOnSearchedFacility, searchedFacilityObject)));
                        } else {
                            resultcontent[i] = domConstruct.create("div", { "class": "esriCTSearchResultInfotextForEvent", "innerHTML": result[i].attributes[searchContenData] + milesCalulatedData }, divHeaderContent[0]);
                        }
                    }
                }
            }
        },

        /**
        * set the content in (Facility) carousel pod if user click on search result data
        * @param {object} facilityObject contans feature, widget name, selected facility, Layer URL
        * @memberOf widgets/searchResult/carouselContainerHelper
        */
        setFacility: function (facilityObject) {
            var divHeaderContent, facilityContenTitle, infowWindowData, divHeader, divFacilityContainer, divFacilityContent, k, j, m, p, activityImageDiv, SearchSettingsLayers, isPodEnabled, divFacilityImages;
            isPodEnabled = this.getPodStatus("FacilityInformationPod");
            if (isPodEnabled) {
                divHeaderContent = query('.esriCTdivFacilityContent');
                if (divHeaderContent.length > 0) {
                    domConstruct.empty(divHeaderContent[0]);
                    divHeader = domConstruct.create("div", {}, divHeaderContent[0]);
                    if (facilityObject.WidgetName.toLowerCase() === "unifiedsearch") {
                        facilityContenTitle = this.getKeyValue(dojo.configData.ActivitySearchSettings[0].SearchDisplayFields);
                    } else if (facilityObject.WidgetName.toLowerCase() === "activitysearch") {
                        facilityContenTitle = this.getKeyValue(dojo.configData.ActivitySearchSettings[0].SearchDisplayFields);
                    } else if (facilityObject.WidgetName.toLowerCase() === "event") {
                        facilityContenTitle = this.getKeyValue(dojo.configData.EventSearchSettings[0].SearchDisplayFields);
                    } else if (facilityObject.WidgetName.toLowerCase() === "searchedfacility") {
                        facilityContenTitle = this.getKeyValue(dojo.configData.ActivitySearchSettings[0].SearchDisplayFields);
                    }
                    facilityObject.Feature = this.removeNullValue(facilityObject.Feature);
                    for (p = 0; p < dojo.configData.InfoWindowSettings.length; p++) {
                        if (facilityObject.QueryURL === dojo.configData.InfoWindowSettings[p].InfoQueryURL) {
                            infowWindowData = dojo.configData.InfoWindowSettings[p].InfoWindowData;
                            break;
                        }
                    }
                    if (facilityObject.SelectedItem && facilityObject.Feature) {
                        domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": facilityObject.Feature[facilityObject.SelectedItem.value].attributes[facilityContenTitle] }, divHeader);
                        divFacilityContainer = domConstruct.create("div", { "class": "esriCTResultContent" }, divHeaderContent[0]);
                        divFacilityContent = domConstruct.create("div", {}, divFacilityContainer);
                        if (infowWindowData.length === 0) {
                            domConstruct.create("div", { "class": "esriCTInfoText", "innerHTML": "Feilds are not configured." }, divFacilityContent);
                        }
                        for (j = 0; j < infowWindowData.length; j++) {
                            domConstruct.create("div", { "class": "esriCTInfoText", "innerHTML": infowWindowData[j].DisplayText + " " + string.substitute(infowWindowData[j].FieldName, facilityObject.Feature[facilityObject.SelectedItem.value].attributes) }, divFacilityContent);
                        }
                        if (facilityObject.WidgetName.toLowerCase() !== "event") {
                            domConstruct.create("div", { "class": "esriCTCarouselUtilitiesHeader", "innerHTML": sharedNls.titles.carouselUtilitiesText }, divFacilityContent);
                            divFacilityImages = domConstruct.create("div", { "class": "esriCTDivFacilityImages" }, divFacilityContent);
                            if (facilityObject.Feature) {
                                for (m = 0; m < dojo.configData.ActivitySearchSettings.length; m++) {
                                    SearchSettingsLayers = dojo.configData.ActivitySearchSettings[m];
                                }
                                for (k = 0; k < SearchSettingsLayers.ActivityList.length; k++) {
                                    if (dojo.string.substitute(SearchSettingsLayers.ActivityList[k].FieldName, facilityObject.Feature[facilityObject.SelectedItem.value].attributes)) {
                                        if (facilityObject.Feature[facilityObject.SelectedItem.value].attributes[dojo.string.substitute(SearchSettingsLayers.ActivityList[k].FieldName, facilityObject.Feature[facilityObject.SelectedItem.value].attributes)] === "Yes") {
                                            activityImageDiv = domConstruct.create("div", { "class": "esriCTActivityImage" }, divFacilityImages);
                                            domConstruct.create("img", { "src": SearchSettingsLayers.ActivityList[k].Image }, activityImageDiv);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },

        /**
        * set the content in (Direction) carousel pod if user click on search result data
        * @param {object} directionObject contains widget name, solve route results, selected facility
        * @param {boolean} isInfoWindowClick
        * @memberOf widgets/searchResult/carouselContainerHelper
        */
        setDirection: function (directionObject, isInfoWindowClick) {
            var isPodEnabled = this.getPodStatus("DirectionsPod"), divHeaderContent, directionTitle, divHeader, divDirectionContainer, divDrectionContent, distanceAndDuration, printButton, j, divDrectionList, printmapData, ConvertedTime, minutes;
            if (isInfoWindowClick) {
                isPodEnabled = true;
                divHeaderContent = query('.esriCTDirectionMainContainer');
            } else {
                divHeaderContent = query('.esriCTDivDirectioncontent');
            }
            if (isPodEnabled) {
                if (divHeaderContent.length > 0) {
                    domConstruct.empty(divHeaderContent[0]);
                    if (directionObject.WidgetName.toLowerCase() === "unifiedsearch") {
                        directionTitle = this.getKeyValue(dojo.configData.ActivitySearchSettings[0].SearchDisplayFields);
                    } else if (directionObject.WidgetName.toLowerCase() === "activitysearch") {
                        directionTitle = this.getKeyValue(dojo.configData.ActivitySearchSettings[0].SearchDisplayFields);
                    } else if (directionObject.WidgetName.toLowerCase() === "event") {
                        directionTitle = this.getKeyValue(dojo.configData.EventSearchSettings[0].SearchDisplayFields);
                    } else {
                        directionTitle = this.getKeyValue(dojo.configData.ActivitySearchSettings[0].SearchDisplayFields);
                    }
                    if (isInfoWindowClick) {
                        if (directionObject.WidgetName.toLowerCase() === "infoactivity") {
                            directionTitle = this.getKeyValue(dojo.configData.ActivitySearchSettings[0].SearchDisplayFields);
                        }
                        if (directionObject.WidgetName.toLowerCase() === "infoevent") {
                            directionTitle = this.getKeyValue(dojo.configData.EventSearchSettings[0].SearchDisplayFields);
                        }
                    }
                    divHeader = domConstruct.create("div", {}, divHeaderContent[0]);
                    if (directionObject.SelectedItem) {
                        domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": sharedNls.titles.directionText + " " + directionObject.Feature[directionObject.SelectedItem.value].attributes[directionTitle] }, divHeader);
                        //set start location text
                        directionObject.SolveRoute[0].directions.features[0].attributes.text = directionObject.SolveRoute[0].directions.features[0].attributes.text.replace('Location 1', directionObject.Address);
                        if (directionObject.WidgetName.toLowerCase() !== "infoactivity" && directionObject.WidgetName.toLowerCase() !== "infoevent") {
                            printButton = domConstruct.create("div", { "class": "esriCTDivPrint", "title": sharedNls.tooltips.printButtonooltips }, divHeader);
                            minutes = directionObject.SolveRoute[0].directions.totalDriveTime;
                            ConvertedTime = this.convertMinToHr(minutes);
                            printmapData = {
                                "Features": directionObject.SolveRoute[0].directions.features,
                                "Title": sharedNls.titles.directionText + " " + directionObject.Feature[directionObject.SelectedItem.value].attributes[directionTitle],
                                "Distance": sharedNls.titles.directionTextDistance + parseFloat(directionObject.SolveRoute[0].directions.totalLength).toFixed(2) + this._getSubStringUnitData(),
                                "Time": sharedNls.titles.directionTextTime + ConvertedTime
                            };
                            this.own(on(printButton, "click", lang.hitch(this, this.print, printmapData)));
                        }
                        minutes = directionObject.SolveRoute[0].directions.totalDriveTime;
                        ConvertedTime = this.convertMinToHr(minutes);
                        divDirectionContainer = domConstruct.create("div", { "class": "esriCTDirectionResultContent" }, divHeaderContent[0]);
                        distanceAndDuration = domConstruct.create("div", { "class": "esriCTDistanceAndDuration" }, divHeader);
                        domConstruct.create("div", { "class": "esriCTDivDistance", "innerHTML": sharedNls.titles.directionTextDistance + " " + parseFloat(directionObject.SolveRoute[0].directions.totalLength).toFixed(2) + this._getSubStringUnitData() }, distanceAndDuration);
                        domConstruct.create("div", { "class": "esriCTDivTime", "innerHTML": sharedNls.titles.directionTextTime + " " + ConvertedTime }, distanceAndDuration);
                        divDrectionContent = domConstruct.create("div", { "class": "esriCTDirectionRow" }, divDirectionContainer);
                        divDrectionList = domConstruct.create("ol", {}, divDrectionContent);
                        domConstruct.create("li", { "class": "esriCTInfotextDirection", "innerHTML": directionObject.SolveRoute[0].directions.features[0].attributes.text }, divDrectionList);
                        for (j = 1; j < directionObject.SolveRoute[0].directions.features.length; j++) {
                            domConstruct.create("li", { "class": "esriCTInfotextDirection", "innerHTML": directionObject.SolveRoute[0].directions.features[j].attributes.text + " (" + parseFloat(directionObject.SolveRoute[0].directions.features[j].attributes.length).toFixed(2) + this._getSubStringUnitData() + ")" }, divDrectionList);
                        }
                    }
                }
                topic.publish("hideProgressIndicator");
            }
        },

        /**
        * set the images in (Gallery) carousel pod
        * @param {object} selectedFeature contains the information of search result
        * @param {object} resultcontent store the value of the click of search result
        * @memberOf widgets/searchResult/carouselContainerHelper
        */
        setGallery: function (selectedFeature, resultcontent) {
            var isPodEnabled = this.getPodStatus("GalleryPod"), divHeaderContent, layerID;
            if (isPodEnabled) {
                divHeaderContent = query('.esriCTDivGalleryContent');
                if (divHeaderContent.length > 0) {
                    domConstruct.empty(divHeaderContent[0]);
                }
                if (this.map._layers) {
                    for (layerID in this.map._layers) {
                        if (this.map._layers.hasOwnProperty(layerID)) {
                            if (this.map._layers[layerID].url && this.map._layers[layerID].hasAttachments && (this.map._layers[layerID].url === dojo.configData.ActivitySearchSettings[0].QueryURL)) {
                                this.map._layers[layerID].queryAttachmentInfos(selectedFeature[resultcontent.value].attributes[this.map._layers[layerID].objectIdField], lang.hitch(this, this.setAttachments), this.logError);
                                break;
                            }
                        }
                    }
                }
            }
        },

        /**
        * query on attachment and show the images on carousel pod
        * @param {object} response contain the images which are in the feature layer
        * @memberOf widgets/searchResult/carouselContainerHelper
        */
        setAttachments: function (response) {
            topic.publish("showProgressIndicator");
            var divAttchment, divHeaderContent, divPreviousImg, divNextImg;
            this.imageCount = 0;
            divHeaderContent = query('.esriCTDivGalleryContent');
            if (divHeaderContent.length > 0) {
                domConstruct.empty(divHeaderContent[0]);
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
            }
            topic.publish("hideProgressIndicator");
        },

        /**
        * change the image when click on previous arrow of image
        * @param {object} response contain the images which are in the feature layer
        * @param {node} divAttchmentInfo is domNode
        * @memberOf widgets/searchResult/carouselContainerHelper
        */
        _previousImage: function (response, divAttchment) {
            this.imageCount--;
            if (this.imageCount < 0) {
                this.imageCount = response.length - 1;
            }
            domAttr.set(divAttchment, "src", response[this.imageCount].url);
        },

        /**
        * change the image when click on next arrow of image
        * @param {object} response contain the images which are in the feature layer
        * @param {node} divAttchmentInfo is domNode
        * @memberOf widgets/searchResult/carouselContainerHelper
        */
        _nextImage: function (response, divAttchment) {
            this.imageCount++;
            if (this.imageCount === response.length) {
                this.imageCount = 0;
            }
            domAttr.set(divAttchment, "src", response[this.imageCount].url);
        },

        /**
        * show error in console
        * @memberOf widgets/searchResult/carouselContainerHelper
        */
        logError: function (error) {
            console.log(error);
        },

        /**
        * set the content in (Comments) carousel pod
        * @param {object} feature contains feature
        * @param {object} result contains features array
        * @param {object} resultcontent store the value of the click of search result
        * @memberOf widgets/searchResult/carouselContainerHelper
        */
        setComment: function (feature, result, resultcontent) {
            var isPodEnabled = this.getPodStatus("CommentsPod"), divHeaderContent, j, index, divHeaderStar, divStar, commentAttribute, utcMilliseconds, l, isCommentFound, rankFieldAttribute, esriCTCommentDateStar, divCommentRow;
            if (isPodEnabled) {
                for (index = 0; index < dojo.configData.ActivitySearchSettings.length; index++) {
                    if (dojo.configData.ActivitySearchSettings[index].CommentsSettings.Enabled) {
                        divHeaderContent = query('.esriCTDivCommentContent');
                        if (result.length === 0) {
                            if (divHeaderContent[0]) {
                                domConstruct.empty(divHeaderContent[0]);
                            }
                            divCommentRow = domConstruct.create("div", { "class": "esriCTRowNoComment" }, divHeaderContent[0]);
                            domConstruct.create("div", { "class": "esriCTInfotextRownoComment", "innerHTML": sharedNls.errorMessages.noCommentAvaiable }, divCommentRow);
                            return;
                        }
                        result = this.removeNullValue(result);
                        isCommentFound = false;
                        if (result.length !== 0) {
                            divHeaderContent = query('.esriCTDivCommentContent');
                            if (divHeaderContent[0]) {
                                domConstruct.empty(divHeaderContent[0]);
                            }
                            for (l = 0; l < result.length; l++) {
                                rankFieldAttribute = string.substitute(dojo.configData.ActivitySearchSettings[index].CommentsSettings.RankField, result[l].attributes);
                                commentAttribute = string.substitute(dojo.configData.ActivitySearchSettings[index].CommentsSettings.CommentField, result[l].attributes);
                                if (feature[resultcontent.value].attributes[this.objectIdForCommentLayer] === Number(result[l].attributes.id)) {
                                    if (commentAttribute) {
                                        divCommentRow = domConstruct.create("div", { "class": "esriCTDivCommentRow" }, divHeaderContent[0]);
                                        isCommentFound = true;
                                        esriCTCommentDateStar = domConstruct.create("div", { "class": "esriCTCommentDateStar" }, divCommentRow);
                                        divHeaderStar = domConstruct.create("div", { "class": "esriCTHeaderRatingStar" }, esriCTCommentDateStar);
                                        for (j = 0; j < 5; j++) {
                                            divStar = domConstruct.create("span", { "class": "esriCTRatingStar" }, divHeaderStar);
                                            if (j < rankFieldAttribute) {
                                                domClass.add(divStar, "esriCTRatingStarChecked");
                                            }
                                        }
                                        if (string.substitute(dojo.configData.ActivitySearchSettings[index].CommentsSettings.SubmissionDateField, result[l].attributes) === null) {
                                            utcMilliseconds = 0;
                                        } else {
                                            utcMilliseconds = Number(dojo.string.substitute(dojo.configData.ActivitySearchSettings[index].CommentsSettings.SubmissionDateField, result[l].attributes));
                                        }
                                        domConstruct.create("div", { "class": "esriCTCommentText", "innerHTML": commentAttribute }, divCommentRow);
                                        domConstruct.create("div", { "class": "esriCTCommentDate", "innerHTML": dojo.date.locale.format(this.utcTimestampFromMs(utcMilliseconds), { datePattern: dojo.configData.ActivitySearchSettings[index].CommentsSettings.DisplayDateFormat, selector: "date" }) }, esriCTCommentDateStar);
                                    }
                                }
                            }
                        }
                        if (!isCommentFound) {
                            divCommentRow = domConstruct.create("div", { "class": "esriCTDivCommentRow" }, divHeaderContent[0]);
                            domConstruct.create("div", { "class": "esriCTInfotextRownoComment", "innerHTML": sharedNls.errorMessages.noCommentAvaiable }, divCommentRow);
                        }
                    }
                }
            }
        },

        /**
        * get the Unit text from confing file after removing esri text
        * @memberOf widgets/searchResult/carouselContainerHelper
        */
        _getSubStringUnitData: function () {
            var routeUnitString, subStringRouteUnit;
            routeUnitString = dojo.configData.DrivingDirectionSettings.RouteUnit;
            if (routeUnitString !== "") {
                subStringRouteUnit = " " + routeUnitString.substring(4, routeUnitString.length);
            } else {
                subStringRouteUnit = dojo.configData.DrivingDirectionSettings.RouteUnit;
            }
            return subStringRouteUnit;
        }
    });
});
