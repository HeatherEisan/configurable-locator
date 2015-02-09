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
    "esri/units",
    "dijit/_WidgetBase",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/topic",
    "dijit/a11yclick",
    "dojo/_base/array",
    "widgets/carouselContainer/carouselContainer"

], function (declare, domConstruct, domStyle, domAttr, lang, on, dom, domClass, query, string, Query, units, _WidgetBase, sharedNls, topic, a11yclick, array, CarouselContainer) {
    // ========================================================================================================================//

    return declare([_WidgetBase], {
        sharedNls: sharedNls,                                // Variable for shared NLS

        /**
        * This file creats bottom pod data search from any layer
        */


        /**
        * create carousel Container
        * @memberOf widgets/commonHelper/carouselContainerHelper
        */
        _createCarouselContainer: function () {
            this.carouselContainer = new CarouselContainer();
            this.carouselContainer.createPod(dom.byId("esriCTParentDivContainer"), dojo.configData.BottomPanelToggleButtonText);
        },

        /**
        * create carousel pod and set it content
        * @memberOf widgets/commonHelper/carouselContainerHelper
        */
        createCarouselPod: function () {
            var divCarouselPod, divGallerycontent, divPodInfoContainer, divcommentcontent, divHeader, divsearchcontent, i, key, carouselPodKey;
            // Looping for pod settings array from config file for getting value
            for (i = 0; i < dojo.configData.PodSettings.length; i++) {
                // Getting key from pod settings
                for (key in dojo.configData.PodSettings[i]) {
                    if (dojo.configData.PodSettings[i].hasOwnProperty(key)) {
                        // If in config pod settings is enabled then set carousel pod key name to key mached
                        if (dojo.configData.PodSettings && dojo.configData.PodSettings[i][key].Enabled) {
                            divCarouselPod = domConstruct.create("div", { "class": "esriCTBoxContainer" });
                            divPodInfoContainer = domConstruct.create("div", { "class": "esriCTInfoContainer" }, divCarouselPod);
                            carouselPodKey = key;
                            // If comment settings is enabled then only set comment pod visible to user.
                            if (!dojo.configData.ActivitySearchSettings[0].CommentsSettings.Enabled) {
                                if (carouselPodKey.toLowerCase() === "commentspod") {
                                    carouselPodKey = "default";
                                }
                            }
                            if (!dojo.configData.DrivingDirectionSettings.GetDirections) {
                                if (dojo.configData.PodSettings[i].DirectionsPod) {
                                    carouselPodKey = "default";
                                }
                            }
                        } else {
                            // In else scenario set key to default.
                            carouselPodKey = "default";
                        }
                        // Switch for carouse pod key for creating div
                        switch (carouselPodKey.toLowerCase()) {
                            // If it is a search pod
                        case "searchresultpod":
                            divHeader = domConstruct.create("div", { "class": "esriCTDivHeadercontainer" }, divPodInfoContainer);
                            domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": sharedNls.titles.searchResultText }, divHeader);
                            divsearchcontent = domConstruct.create("div", { "class": "esriCTResultContent" }, divHeader);
                            domConstruct.create("div", { "class": "esriCTDivSearchResulContent" }, divsearchcontent);
                            break;
                        case "facilityinformationpod":
                            // If it is a facility pod
                            this.facilityContainer = domConstruct.create("div", { "class": "esriCTDivHeadercontainer" }, divPodInfoContainer);
                            this.divfacilitycontent = domConstruct.create("div", {}, this.facilityContainer);
                            domConstruct.create("div", { "class": "esriCTdivFacilityContent" }, this.divfacilitycontent);
                            break;
                        case "directionspod":
                            // If it is a direction pod
                            if (dojo.configData.DrivingDirectionSettings.GetDirections) {
                                this.directionContainer = domConstruct.create("div", { "class": "esriCTDivHeadercontainer" }, divPodInfoContainer);
                                domConstruct.create("div", { "class": "esriCTDivDirectioncontent" }, this.directionContainer);
                            }
                            break;
                        case "gallerypod":
                            // If it is a gallery pod
                            divHeader = domConstruct.create("div", { "class": "esriCTDivHeadercontainer" }, divPodInfoContainer);
                            domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": sharedNls.titles.galleryText }, divHeader);
                            divGallerycontent = domConstruct.create("div", { "class": "esriCTResultContent" }, divHeader);
                            domConstruct.create("div", { "class": "esriCTDivGalleryContent" }, divGallerycontent);
                            break;
                        case "commentspod":
                            // If it is a comment pod
                            divHeader = domConstruct.create("div", { "class": "esriCTDivHeadercontainer" }, divPodInfoContainer);
                            domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": sharedNls.titles.commentText }, divHeader);
                            divcommentcontent = domConstruct.create("div", { "class": "esriCTResultContent" }, divHeader);
                            domConstruct.create("div", { "class": "esriCTDivCommentContent" }, divcommentcontent);
                            break;
                        case "default":
                            // If default then break
                            break;
                        }
                        // If it is not default then create carousel pod data
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
        * @memberOf widgets/commonHelper/carouselContainerHelper
        */
        setSearchContent: function (result, isBufferNeeded, queryURL, widgetName, activityData) {
            var isPodEnabled = this.getPodStatus("SearchResultPod"), subStringRouteUnit, searchContenTitle, searchedFacilityObject, divHeaderContent, resultcontent = [], milesCalulatedData, searchContenData, g, l, serchSetting, intialSearchSettingData;
            if (isPodEnabled) {
                // If it is comming from unified search and geolocation then set search content title and search contend Data
                if (widgetName.toLowerCase() === "unifiedsearch" || widgetName.toLowerCase() === "geolocation") {
                    searchContenTitle = sharedNls.titles.numberOfFeaturesFoundNearAddress;
                } else if (widgetName.toLowerCase() === "activitysearch") {
                    // If it is comming from activity search and geolocation then set search content title and search contend Data
                    searchContenTitle = sharedNls.titles.numberOfFoundFeatureNearAddress;
                } else if (widgetName.toLowerCase() === "event") {
                    // If it is comming from event search and geolocation then set search content title and search contend Data
                    searchContenTitle = sharedNls.titles.numberOfFoundEventsNearAddress;
                }
                serchSetting = this.getSearchSetting(queryURL);
                searchContenData = this.getKeyValue(serchSetting.SearchDisplayFields);
                divHeaderContent = query('.esriCTDivSearchResulContent');
                if (divHeaderContent.length > 0) {
                    domConstruct.empty(divHeaderContent[0]);
                    this.spanFeatureListContainer = domConstruct.create("div", { "class": "esriCTSpanFeatureListContainer", "innerHTML": string.substitute(searchContenTitle, [result.length]) }, divHeaderContent[0]);
                    // looping for result for showing data in pod
                    array.forEach(result, lang.hitch(this, function (resultData, i) {
                        if (!isBufferNeeded && result[i].distance) {
                            subStringRouteUnit = this._getSubStringUnitData();
                            milesCalulatedData = " (" + parseFloat(result[i].distance).toFixed(2) + subStringRouteUnit + sharedNls.showApproxString + ")";
                        } else {
                            milesCalulatedData = "";
                        }
                        // if it is not comming from event layer
                        if (widgetName.toLowerCase() !== "event") {
                            // If result length is greater than 1
                            resultcontent[i] = domConstruct.create("div", { "class": "esriCTSearchResultInfotext" }, divHeaderContent[0]);
                            if (i === 0) {
                                intialSearchSettingData = serchSetting;
                            }
                            if (result.length > 1) {
                                // If it is comming from unified search and geolocation
                                if (widgetName.toLowerCase() === "unifiedsearch" || widgetName.toLowerCase() === "geolocation") {
                                    // Looping for activity data featched from unified search
                                    for (g = 0; g < activityData.length; g++) {
                                        // Looping for features
                                        for (l = 0; l < activityData[g].records.features.length; l++) {
                                            if (activityData[g].records.features[l].distance === result[i].distance) {
                                                domAttr.set(resultcontent[i], "QueryURL", activityData[g].queryURL);
                                                serchSetting = this.getSearchSetting(activityData[g].queryURL);
                                                searchContenData = this.getKeyValue(serchSetting.SearchDisplayFields);
                                            }
                                        }
                                    }
                                } else {
                                    domAttr.set(resultcontent[i], "QueryURL", queryURL);
                                }
                                resultcontent[i].innerHTML = result[i].attributes[searchContenData] + milesCalulatedData;
                                domAttr.set(resultcontent[i], "value", i);
                                searchedFacilityObject = { "FeatureData": result, "SelectedRow": resultcontent[i], "IsBufferNeeded": isBufferNeeded, "QueryLayer": queryURL, "WidgetName": widgetName, "searchedFacilityIndex": i, "activityData": activityData };
                                this.own(on(resultcontent[i], a11yclick, lang.hitch(this, function (event) {
                                    topic.publish("extentSetValue", true);
                                    this._clickOnSearchedFacility(searchedFacilityObject, event);
                                })));
                                // If it is comming from share url then show data in search pod
                                if (window.location.href.toString().split("$selectedSearchResult=").length > 1 && Number(window.location.href.toString().split("$selectedSearchResult=")[1].split("$")[0]) === i) {
                                    // Checking when it is not a shared link
                                    if (this.isExtentSet === true) {
                                        return;
                                    }
                                    queryURL = domAttr.get(resultcontent[i], "QueryURL");
                                    searchedFacilityObject = { "FeatureData": result, "SelectedRow": resultcontent[i], "IsBufferNeeded": isBufferNeeded, "QueryLayer": queryURL, "WidgetName": widgetName, "searchedFacilityIndex": i, "activityData": activityData };
                                    domClass.add(resultcontent[i], "esriCTDivHighlightFacility");
                                    this._clickOnSearchedFacility(searchedFacilityObject, null);
                                    this.isFirstSearchResult = true;
                                } else if (query('.esriCTDivHighlightFacility').length < 1 && !this.isFirstSearchResult) {
                                    domClass.add(resultcontent[0], "esriCTDivHighlightFacility");
                                }
                            } else {
                                // If it is comming from unified search and geolocation then loop through the activity data
                                if (widgetName.toLowerCase() === "unifiedsearch" || widgetName.toLowerCase() === "geolocation") {
                                    // Looping for activity data for getting query URL on the basis of direction
                                    for (g = 0; g < activityData.length; g++) {
                                        // Looping for features
                                        for (l = 0; l < activityData[g].records.features.length; l++) {
                                            if (activityData[g].records.features[l].distance === result[i].distance) {
                                                domAttr.set(resultcontent[i], "QueryURL", activityData[g].queryURL);
                                                serchSetting = this.getSearchSetting(activityData[g].queryURL);
                                                searchContenData = this.getKeyValue(serchSetting.SearchDisplayFields);
                                            }
                                        }
                                    }
                                }
                                if (i === 0) {
                                    intialSearchSettingData = serchSetting;
                                }
                                resultcontent[i] = domConstruct.create("div", { "class": "esriCTSearchResultInfotextForEvent", "innerHTML": result[i].attributes[searchContenData] + milesCalulatedData }, divHeaderContent[0]);
                            }
                        } else {
                            if (i === 0) {
                                intialSearchSettingData = serchSetting;
                            }
                            resultcontent[i] = domConstruct.create("div", { "class": "esriCTSearchResultInfotextForEvent", "innerHTML": result[i].attributes[searchContenData] + milesCalulatedData }, divHeaderContent[0]);
                        }
                    }));
                }
            }
            if (intialSearchSettingData) {
                this.searchSettingData = intialSearchSettingData;
            }
        },

        /**
        * call all the function when click on search result data
        * @param {object} searchedFacilityObject contains route result, features in buffer area, search address,mapPoint, comment layer info
        * @memberOf widgets/commonHelper/carouselContainerHelper
        */
        _clickOnSearchedFacility: function (searchedFacilityObject, event) {
            var pushPinGemotery, widgetName, routeObject, queryObject, highlightedDiv, queryURL, rowIndex;
            topic.publish("hideInfoWindow");
            // If feature data has some items
            if (searchedFacilityObject.FeatureData.length > 1) {
                // If event is available then get tuery URL and row index from event.
                if (event !== null) {
                    queryURL = domAttr.get(event.currentTarget, "QueryURL");
                    rowIndex = domAttr.get(event.currentTarget, "value");
                }
                // If event is not available then get tuery URL and row index from event.
                if (event === null) {
                    queryURL = searchedFacilityObject.QueryLayer;
                    rowIndex = searchedFacilityObject.searchedFacilityIndex;
                }
                // query for getting highlighed div
                highlightedDiv = query('.esriCTDivHighlightFacility')[0];
                if (highlightedDiv) {
                    domClass.replace(highlightedDiv, "esriCTSearchResultInfotext", "esriCTDivHighlightFacility");
                }
                // If event is not available then change the selected row.
                if (event !== null) {
                    domClass.replace(event.currentTarget, "esriCTDivHighlightFacility", "esriCTSearchResultInfotext");
                }
                dojo.searchFacilityIndex = Number(rowIndex);
                // If it is comming from activity search pod then remove buffer layer.
                if (searchedFacilityObject.WidgetName.toLowerCase() === "activitysearch") {
                    this.removeBuffer();
                }
                widgetName = "SearchedFacility";
                topic.publish("showProgressIndicator");
                this.removeHighlightedCircleGraphics();
                // If any point is ther on map related to geolocation settings else it is locator settings.
                if (this.map.getLayer(this.geoLocationGraphicsLayerID) && this.map.getLayer(this.geoLocationGraphicsLayerID).graphics.length > 0) {
                    pushPinGemotery = this.map.getLayer(this.geoLocationGraphicsLayerID).graphics;
                } else if (this.map.getLayer(this.locatorGraphicsLayerID).graphics.length > 0) {
                    pushPinGemotery = this.map.getLayer(this.locatorGraphicsLayerID).graphics;
                } else {
                    pushPinGemotery = [this.selectedGraphic];
                }
                // If data is found then call show route function.
                if (pushPinGemotery[0]) {
                    routeObject = { "StartPoint": pushPinGemotery[0], "EndPoint": searchedFacilityObject.FeatureData, "Index": Number(rowIndex), "WidgetName": widgetName, "QueryURL": queryURL, "activityData": searchedFacilityObject.activityData };
                    this.showRoute(routeObject);
                } else if (this.selectedGraphic) {
                    routeObject = { "StartPoint": this.selectedGraphic, "EndPoint": searchedFacilityObject.FeatureData, "Index": Number(rowIndex), "WidgetName": widgetName, "QueryURL": queryURL, "activityData": searchedFacilityObject.activityData };
                    this.showRoute(routeObject);
                } else {
                    // Else call query comment layer.
                    queryObject = { "FeatureData": searchedFacilityObject.FeatureData, "SolveRoute": null, "Index": Number(rowIndex), "QueryURL": queryURL, "WidgetName": widgetName, "Address": null, "IsRouteCreated": false };
                    topic.publish("showProgressIndicator");
                    this.queryCommentLayer(queryObject);
                }
            }
        },

        /**
        * set the content in (Facility) carousel pod if user click on search result data
        * @param {object} facilityObject contans feature, widget name, selected facility, Layer URL
        * @memberOf widgets/commonHelper/carouselContainerHelper
        */
        setFacility: function (facilityObject) {
            var divHeaderContent, layerId, layerTitle, facilityContenTitle, infoPodAddtoList, isEventSearched = false, infowWindowData, divHeader, facilityDiv, divFacilityContainer, divFacilityContent, k, j, m, p, activityImageDiv, SearchSettingsLayers, isPodEnabled, divFacilityImages,
                spanHeaderAddToList, _self = this, listData, isAlreadyAdded, t, objectIDField, serchSetting;
            isPodEnabled = this.getPodStatus("FacilityInformationPod");
            // If pod is enabled
            if (isPodEnabled) {
                divHeaderContent = query('.esriCTdivFacilityContent');
                // If div is created
                if (divHeaderContent.length > 0) {
                    domConstruct.empty(divHeaderContent[0]);
                    divHeader = domConstruct.create("div", {}, divHeaderContent[0]);
                    serchSetting = this.getSearchSetting(facilityObject.QueryURL);
                    facilityContenTitle = this.getKeyValue(serchSetting.SearchDisplayFields);
                    layerId = serchSetting.QueryLayerId;
                    layerTitle = serchSetting.Title;
                    facilityObject.Feature = this.removeNullValue(facilityObject.Feature);
                    if (facilityObject.WidgetName.toLowerCase() === "unifiedsearch" || facilityObject.WidgetName.toLowerCase() === "geolocation") {
                        // If it is comming from unified search than loop throug the activity data
                        for (t = 0; t < facilityObject.activityData.length; t++) {
                            // If distance is matched than set layer id and layer title
                            if (parseFloat(facilityObject.Feature[facilityObject.SelectedItem.value].distance) === parseFloat(facilityObject.activityData[t].records.features[facilityObject.SelectedItem.value].distance)) {
                                if (facilityObject.activityData[t].queryURL === dojo.configData.ActivitySearchSettings[0].QueryURL) {
                                    serchSetting = this.getSearchSetting(facilityObject.activityData[t].queryURL);
                                    facilityContenTitle = this.getKeyValue(serchSetting.SearchDisplayFields);
                                    layerId = serchSetting.QueryLayerId;
                                    layerTitle = serchSetting.Title;
                                } else {
                                    isEventSearched = true;
                                    serchSetting = this.getSearchSetting(facilityObject.activityData[t].queryURL);
                                    facilityContenTitle = this.getKeyValue(serchSetting.SearchDisplayFields);
                                    layerId = serchSetting.QueryLayerId;
                                    layerTitle = serchSetting.Title;
                                }
                                for (p = 0; p < dojo.configData.InfoWindowSettings.length; p++) {
                                    if (facilityObject.activityData[t].queryURL === dojo.configData.InfoWindowSettings[p].InfoQueryURL) {
                                        infowWindowData = dojo.configData.InfoWindowSettings[p].InfoWindowData;
                                        break;
                                    }
                                }
                                break;
                            }
                        }
                    } else {
                        // If it is not unified search than get info window settings
                        // Looping through infow window data for getting facility information
                        for (p = 0; p < dojo.configData.InfoWindowSettings.length; p++) {
                            if (facilityObject.QueryURL === dojo.configData.InfoWindowSettings[p].InfoQueryURL) {
                                infowWindowData = dojo.configData.InfoWindowSettings[p].InfoWindowData;
                                if (facilityObject.QueryURL !== dojo.configData.ActivitySearchSettings[0].QueryURL) {
                                    isEventSearched = true;
                                }
                                break;
                            }
                        }
                    }
                    // If facility object has feature
                    if (facilityObject.SelectedItem && facilityObject.Feature) {
                        domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": facilityObject.Feature[facilityObject.SelectedItem.value].attributes[facilityContenTitle] }, divHeader);
                        spanHeaderAddToList = domConstruct.create("span", { "class": "esriCTSpanHeaderAddToList" }, divHeader);
                        infoPodAddtoList = domConstruct.create("div", { "class": "esriCTInfoAddToList" }, spanHeaderAddToList);
                        domAttr.set(infoPodAddtoList, "LayerId", layerId);
                        domAttr.set(infoPodAddtoList, "LayerTitle", layerTitle);
                        if (dijit.registry.byId("myList")) {
                            domConstruct.create("div", { "class": "esriCTInfoAddToListIcon" }, infoPodAddtoList);
                            domConstruct.create("div", { "class": "esriCTInfoAddToListText", "innerHTML": sharedNls.titles.addToListTitle }, infoPodAddtoList);

                            // On click for add to list item
                            this.own(on(infoPodAddtoList, a11yclick, function (event) {
                                layerId = domAttr.get(event.currentTarget, "LayerId");
                                layerTitle = domAttr.get(event.currentTarget, "LayerTitle");
                                array.forEach(dojo.configData.EventSearchSettings, lang.hitch(this, function (settings, eventSettingIndex) {
                                    if (settings.QueryLayerId === layerId && settings.Title === layerTitle) {
                                        objectIDField = settings.ObjectID;
                                    }
                                }));
                                // Looping for activity search setting for getting object id
                                array.forEach(dojo.configData.ActivitySearchSettings, lang.hitch(this, function (settings, activitySettingIndex) {
                                    if (settings.QueryLayerId === layerId && settings.Title === layerTitle) {
                                        objectIDField = settings.ObjectID;
                                    }
                                }));
                                isAlreadyAdded = false;
                                // If my store has data
                                if (_self.myListStore && _self.myListStore.length > 0) {
                                    // looping for my list data
                                    for (listData = 0; listData < _self.myListStore.length; listData++) {
                                        // Comparing object id for my list and facility object id value
                                        if (_self.myListStore[listData].value[_self.myListStore[listData].key] === facilityObject.Feature[facilityObject.SelectedItem.value].attributes[objectIDField]) {
                                            alert(sharedNls.errorMessages.activityAlreadyadded);
                                            isAlreadyAdded = true;
                                            break;
                                        }
                                    }
                                }
                                // If activity is not added then add to my list
                                if (!isAlreadyAdded) {
                                    if (query(".esriCTEventsImg")[0]) {
                                        topic.publish("toggleWidget", "myList");
                                        topic.publish("showActivityPlannerContainer");
                                    }
                                    topic.publish("addToMyList", facilityObject.Feature[facilityObject.SelectedItem.value], facilityObject.WidgetName, layerId, layerTitle);
                                }
                            }));
                        }
                        divFacilityContainer = domConstruct.create("div", { "class": "esriCTResultContent" }, divHeaderContent[0]);
                        divFacilityContent = domConstruct.create("div", {}, divFacilityContainer);
                        if (infowWindowData.length === 0) {
                            domConstruct.create("div", { "class": "esriCTInfoText", "innerHTML": sharedNls.errorMessages.feildNotconfigure }, divFacilityContent);
                        }
                        // Looping for info window data to set value
                        for (j = 0; j < infowWindowData.length; j++) {
                            facilityDiv = domConstruct.create("div", { "class": "esriCTInfoText" }, divFacilityContent);
                            if (string.substitute(infowWindowData[j].FieldName, facilityObject.Feature[facilityObject.SelectedItem.value].attributes).substring(0, 4) === "http") {
                                facilityDiv.innerHTML = infowWindowData[j].DisplayText + " ";
                                domConstruct.create("a", { "class": "esriCTinfoWindowHyperlink", "href": string.substitute(infowWindowData[j].FieldName, facilityObject.Feature[facilityObject.SelectedItem.value].attributes), "title": string.substitute(infowWindowData[j].FieldName, facilityObject.Feature[facilityObject.SelectedItem.value].attributes), "innerHTML": sharedNls.titles.infoWindowTextURL, "target": "_blank" }, facilityDiv);
                            } else if (string.substitute(infowWindowData[j].FieldName, facilityObject.Feature[facilityObject.SelectedItem.value].attributes).substring(0, 3) === "www") {
                                domConstruct.create("a", { "class": "esriCTinfoWindowHyperlink", "href": "http://" + string.substitute(infowWindowData[j].FieldName, facilityObject.Feature[facilityObject.SelectedItem.value].attributes), "title": "http://" + string.substitute(infowWindowData[j].FieldName, facilityObject.Feature[facilityObject.SelectedItem.value].attributes), "innerHTML": sharedNls.titles.infoWindowTextURL, "target": "_blank" }, facilityDiv);
                            } else {
                                facilityDiv.innerHTML = infowWindowData[j].DisplayText + " " + string.substitute(infowWindowData[j].FieldName, facilityObject.Feature[facilityObject.SelectedItem.value].attributes);
                            }
                        }
                        // If it is not comming from event layer then set facility icons
                        if (facilityObject.WidgetName.toLowerCase() !== "event" && dojo.configData.ActivitySearchSettings[0].Enable && !isEventSearched) {
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
                                            domConstruct.create("img", { "src": SearchSettingsLayers.ActivityList[k].Image, "title": SearchSettingsLayers.ActivityList[k].Alias }, activityImageDiv);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (serchSetting) {
                this.searchSettingData = serchSetting;
            }
        },

        /**
        * set the content in (Direction) carousel pod if user click on search result data
        * @param {object} directionObject contains widget name, solve route results, selected facility
        * @param {boolean} isInfoWindowClick
        * @memberOf widgets/commonHelper/carouselContainerHelper
        */
        setDirection: function (directionObject, isInfoWindowClick) {
            var isPodEnabled = this.getPodStatus("DirectionsPod"), divHeaderContent, directionTitle, serchSetting, divHeader, divDirectionContainer, divDrectionContent, distanceAndDuration, printButton, j, divDrectionList, printmapData, ConvertedTime, minutes, g, l;
            // If info window is clicked
            if (isInfoWindowClick) {
                isPodEnabled = true;
                divHeaderContent = query('.esriCTDirectionMainContainer');
            } else {
                divHeaderContent = query('.esriCTDivDirectioncontent');
            }
            // If Pod is enabled
            if (isPodEnabled) {
                if (divHeaderContent.length > 0) {
                    domConstruct.empty(divHeaderContent[0]);
                    // If it is comming from unified search
                    serchSetting = this.getSearchSetting(directionObject.QueryURL);
                    directionTitle = this.getKeyValue(serchSetting.SearchDisplayFields);
                    if (directionObject.WidgetName.toLowerCase() === "searchedfacility") {
                        if (directionObject.activityData) {
                            for (g = 0; g < directionObject.activityData.length; g++) {
                                // Looping for features
                                for (l = 0; l < directionObject.activityData[g].records.features.length; l++) {
                                    if (directionObject.activityData[g].records.features[l].distance === directionObject.Feature[directionObject.SelectedItem.value].distance) {
                                        serchSetting = this.getSearchSetting(directionObject.activityData[g].queryURL);
                                        directionTitle = this.getKeyValue(serchSetting.SearchDisplayFields);
                                    }
                                }
                            }
                        } else {
                            serchSetting = this.getSearchSetting(directionObject.QueryURL);
                            directionTitle = this.getKeyValue(serchSetting.SearchDisplayFields);
                        }
                    }
                    if (directionObject.WidgetName.toLowerCase() === "unifiedsearch" || directionObject.WidgetName.toLowerCase() === "geolocation") {
                        // Looping for activity data featched from unified search
                        for (g = 0; g < directionObject.activityData.length; g++) {
                            // Looping for features
                            for (l = 0; l < directionObject.activityData[g].records.features.length; l++) {
                                if (directionObject.activityData[g].records.features[l].distance === directionObject.Feature[directionObject.SelectedItem.value].distance) {
                                    serchSetting = this.getSearchSetting(directionObject.activityData[g].queryURL);
                                    directionTitle = this.getKeyValue(serchSetting.SearchDisplayFields);
                                }
                            }
                        }
                    }
                    divHeader = domConstruct.create("div", {}, divHeaderContent[0]);
                    // If direction is found than set direction data in div
                    if (directionObject.SelectedItem) {
                        domConstruct.create("div", { "class": "esriCTSpanHeader", "innerHTML": sharedNls.titles.directionText + " " + directionObject.Feature[directionObject.SelectedItem.value].attributes[directionTitle] }, divHeader);
                        //set start location text
                        directionObject.SolveRoute[0].directions.features[0].attributes.text = directionObject.SolveRoute[0].directions.features[0].attributes.text.replace('Location 1', directionObject.Address);
                        if (directionObject.WidgetName.toLowerCase() !== "infoactivity" && directionObject.WidgetName.toLowerCase() !== "infoevent") {
                            printButton = domConstruct.create("div", { "class": "esriCTDivPrint", "title": sharedNls.tooltips.printButtonTooltips }, divHeader);
                            minutes = directionObject.SolveRoute[0].directions.totalDriveTime;
                            ConvertedTime = this.convertMinToHr(minutes);
                            printmapData = {
                                "Features": directionObject.SolveRoute[0].directions.features,
                                "Title": sharedNls.titles.directionText + " " + directionObject.Feature[directionObject.SelectedItem.value].attributes[directionTitle],
                                "Distance": sharedNls.titles.directionTextDistance + parseFloat(directionObject.SolveRoute[0].directions.totalLength).toFixed(2) + this._getSubStringUnitData(),
                                "Time": sharedNls.titles.directionTextTime + ConvertedTime
                            };
                            this.own(on(printButton, a11yclick, lang.hitch(this, this.print, printmapData)));
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
            if (serchSetting) {
                this.searchSettingData = serchSetting;
            }
        },

        /**
        * set the images in (Gallery) carousel pod
        * @param {object} selectedFeature contains the information of search result
        * @param {object} resultcontent store the value of the click of search result
        * @memberOf widgets/commonHelper/carouselContainerHelper
        */
        setGallery: function (selectedFeature, resultcontent) {
            var isPodEnabled = this.getPodStatus("GalleryPod"), divHeaderContent, layerID, isAttachmentFound = false, serchSetting, g, l;
            serchSetting = this.getSearchSetting(selectedFeature.QueryURL);
            if (selectedFeature.WidgetName.toLowerCase() === "searchedfacility") {
                if (selectedFeature.activityData) {
                    for (g = 0; g < selectedFeature.activityData.length; g++) {
                        // Looping for features
                        for (l = 0; l < selectedFeature.activityData[g].records.features.length; l++) {
                            if (selectedFeature.activityData[g].records.features[l].distance === selectedFeature.FeatureData[resultcontent.value].distance) {
                                serchSetting = this.getSearchSetting(selectedFeature.activityData[g].queryURL);
                            }
                        }
                    }
                } else {
                    serchSetting = this.getSearchSetting(selectedFeature.QueryURL);
                }
            }
            if (selectedFeature.WidgetName.toLowerCase() === "unifiedsearch" || selectedFeature.WidgetName.toLowerCase() === "geolocation") {
                // Looping for activity data featched from unified search
                for (g = 0; g < selectedFeature.activityData.length; g++) {
                    // Looping for features
                    for (l = 0; l < selectedFeature.activityData[g].records.features.length; l++) {
                        if (selectedFeature.activityData[g].records.features[l].distance === selectedFeature.FeatureData[resultcontent.value].distance) {
                            serchSetting = this.getSearchSetting(selectedFeature.activityData[g].queryURL);
                        }
                    }
                }
            }
            // IF pod is enabled
            if (isPodEnabled) {
                divHeaderContent = query('.esriCTDivGalleryContent');
                if (divHeaderContent.length > 0) {
                    domConstruct.empty(divHeaderContent[0]);
                }
                // If map has layer
                if (this.map._layers) {
                    // Looping for layer id in map layer
                    for (layerID in this.map._layers) {
                        if (this.map._layers.hasOwnProperty(layerID)) {
                            // If map has layr id than query on the basis of object id for getting attachments.
                            if (this.map._layers[layerID].url && this.map._layers[layerID].hasAttachments && (this.map._layers[layerID].url === serchSetting.QueryURL)) {
                                this.map._layers[layerID].queryAttachmentInfos(selectedFeature.FeatureData[resultcontent.value].attributes[this.map._layers[layerID].objectIdField], lang.hitch(this, this.setAttachments), this.logError);
                                isAttachmentFound = true;
                                break;
                            }
                        }
                    }
                }
                if (!isAttachmentFound) {
                    domConstruct.create("div", { "class": "esriCTGalleryBox", "innerHTML": sharedNls.errorMessages.imageDoesNotFound }, divHeaderContent[0]);
                }
            }
        },

        /**
        * query on attachment and show the images on carousel pod
        * @param {object} response contain the images which are in the feature layer
        * @memberOf widgets/commonHelper/carouselContainerHelper
        */
        setAttachments: function (response) {
            topic.publish("showProgressIndicator");
            var divAttchment, divHeaderContent, divPreviousImg, divNextImg;
            this.imageCount = 0;
            divHeaderContent = query('.esriCTDivGalleryContent');
            // Looping if gallery div has data
            if (divHeaderContent.length > 0) {
                domConstruct.empty(divHeaderContent[0]);
                // If response is found show attachment in div
                if (response.length > 1) {
                    divPreviousImg = domConstruct.create("div", { "class": "esriCTImgPrev" }, divHeaderContent[0]);
                    divNextImg = domConstruct.create("div", { "class": "esriCTImgNext" }, divHeaderContent[0]);
                    divAttchment = domConstruct.create("img", { "class": "esriCTDivAttchment" }, divHeaderContent[0]);
                    domAttr.set(divAttchment, "src", response[0].url);
                    this.own(on(divPreviousImg, a11yclick, lang.hitch(this, this._previousImage, response, divAttchment)));
                    this.own(on(divNextImg, a11yclick, lang.hitch(this, this._nextImage, response, divAttchment)));
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
        * @memberOf widgets/commonHelper/carouselContainerHelper
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
        * @memberOf widgets/commonHelper/carouselContainerHelper
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
        * @memberOf widgets/commonHelper/carouselContainerHelper
        */
        logError: function (error) {
            console.log(error);
        },

        /**
        * set the content in (Comments) carousel pod
        * @param {object} feature contains feature
        * @param {object} result contains features array
        * @param {object} resultcontent store the value of the click of search result
        * @memberOf widgets/commonHelper/carouselContainerHelper
        */
        setComment: function (feature, result, resultcontent) {
            var isPodEnabled = this.getPodStatus("CommentsPod"), divHeaderContent, isActivityLayerFound = false, j, index, divHeaderStar, divStar, commentAttribute, utcMilliseconds, l, isCommentFound, rankFieldAttribute, esriCTCommentDateStar, divCommentRow, updatedCommentAttribute;
            // If pod is enabled
            //  this.removeCommentPod();
            if (isPodEnabled) {
                // looping in activity search for setting comment data
                for (index = 0; index < dojo.configData.ActivitySearchSettings.length; index++) {
                    // Checking for search setting to enable and disable comment pod
                    if (this.searchSettingData) {
                        // Checking with layer id and lyer title for comment pod and setting boolean value for activity sarch layer
                        if (this.searchSettingData.QueryLayerId === dojo.configData.ActivitySearchSettings[0].QueryLayerId) {
                            if (this.searchSettingData.Title === dojo.configData.ActivitySearchSettings[0].Title) {
                                isActivityLayerFound = true;
                            }
                        }
                    }
                    // If comment setting is set enable and if it is an Activity layer setting than do further things
                    if (dojo.configData.ActivitySearchSettings[index].CommentsSettings.Enabled && isActivityLayerFound) {
                        // Add comment pod for activity layer
                        this.addCommentPod();
                        divHeaderContent = query('.esriCTDivCommentContent');
                        // If length is equal to 0
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
                        // If reault is found and has data
                        if (result.length !== 0) {
                            divHeaderContent = query('.esriCTDivCommentContent');
                            if (divHeaderContent[0]) {
                                domConstruct.empty(divHeaderContent[0]);
                            }
                            // Looping for result data
                            for (l = 0; l < result.length; l++) {
                                rankFieldAttribute = string.substitute(dojo.configData.ActivitySearchSettings[index].CommentsSettings.RankField, result[l].attributes);
                                commentAttribute = string.substitute(dojo.configData.ActivitySearchSettings[index].CommentsSettings.CommentField, result[l].attributes);
                                updatedCommentAttribute = this._getFormattedCommentText(commentAttribute);
                                if (feature[resultcontent.value].attributes[this.objectIdForCommentLayer] === Number(result[l].attributes.id)) {
                                    if (updatedCommentAttribute) {
                                        divCommentRow = domConstruct.create("div", { "class": "esriCTDivCommentRow" }, divHeaderContent[0]);
                                        isCommentFound = true;
                                        esriCTCommentDateStar = domConstruct.create("div", { "class": "esriCTCommentDateStar" }, divCommentRow);
                                        divHeaderStar = domConstruct.create("div", { "class": "esriCTHeaderRatingStar" }, esriCTCommentDateStar);
                                        // Looping for showing 5 star in comment div
                                        for (j = 0; j < 5; j++) {
                                            divStar = domConstruct.create("span", { "class": "esriCTRatingStar" }, divHeaderStar);
                                            if (j < rankFieldAttribute) {
                                                domClass.add(divStar, "esriCTRatingStarChecked");
                                            }
                                        }
                                        if (string.substitute(dojo.configData.ActivitySearchSettings[index].CommentsSettings.SubmissionDateField, result[l].attributes) === sharedNls.showNullValue) {
                                            utcMilliseconds = sharedNls.showNullValue;
                                        } else {
                                            utcMilliseconds = Number(dojo.string.substitute(dojo.configData.ActivitySearchSettings[index].CommentsSettings.SubmissionDateField, result[l].attributes));
                                        }
                                        domConstruct.create("div", { "class": "esriCTCommentText", "innerHTML": updatedCommentAttribute }, divCommentRow);
                                        if (utcMilliseconds === sharedNls.showNullValue) {
                                            domConstruct.create("div", { "class": "esriCTCommentDate", "innerHTML": sharedNls.showNullValue }, esriCTCommentDateStar);
                                        } else {
                                            domConstruct.create("div", { "class": "esriCTCommentDate", "innerHTML": dojo.date.locale.format(this.utcTimestampFromMs(utcMilliseconds), { datePattern: dojo.configData.ActivitySearchSettings[index].CommentsSettings.DisplayDateFormat, selector: "date" }) }, esriCTCommentDateStar);
                                        }
                                    }
                                }
                            }
                        }
                        // If comment is not found than show comment not found in div
                        if (!isCommentFound) {
                            divCommentRow = domConstruct.create("div", { "class": "esriCTDivCommentRow" }, divHeaderContent[0]);
                            domConstruct.create("div", { "class": "esriCTInfotextRownoComment", "innerHTML": sharedNls.errorMessages.noCommentAvaiable }, divCommentRow);
                        }
                    } else {
                        this.removeCommentPod();
                        return;
                    }
                }
            }
        },

        /**
        * initialize the object of printMap Widget
        * @param {object} directions contains solve route result
        * @memberOf widgets/commonHelper/carouselContainerHelper
        */
        print: function (directions) {
            topic.publish("showProgressIndicator");
            this._esriDirectionsWidget._printDirections();
            topic.publish("hideProgressIndicator");
        },

        /**
        * get the setting name by passing query layer
        * @ return search setting Data
        * @memberOf widgets/commonHelper/carouselContainerHelper
        */
        getSearchSetting: function (queryURL) {
            var settingData;
            // Looping for getting object id from event search.
            array.forEach(dojo.configData.EventSearchSettings, lang.hitch(this, function (settings, eventSettingIndex) {
                if (settings.QueryURL === queryURL) {
                    settingData = settings;
                }
            }));
            // Looping for getting object id from activity search.
            array.forEach(dojo.configData.ActivitySearchSettings, lang.hitch(this, function (settings, activitySettingIndex) {
                if (settings.QueryURL === queryURL) {
                    settingData = settings;
                }
            }));
            return settingData;
        },

        /**
        * get the Unit text from confing file after removing esri text
        * @ return route unit name
        * @memberOf widgets/commonHelper/carouselContainerHelper
        */
        _getSubStringUnitData: function () {
            var routeUnitString, unitsValue, unitName, defaultUnit = "Miles";
            // If in direction unit found esri than set unit value
            if (this._esriDirectionsWidget.directionsLengthUnits.substring(0, 4) === "esri") {
                unitsValue = this._esriDirectionsWidget.directionsLengthUnits.substring(4, this._esriDirectionsWidget.directionsLengthUnits.length).toUpperCase();
            } else {
                // Else set it to kilometers.
                unitsValue = "KILOMETERS";
            }
            // Switch for units value and setting unit name according to it.
            switch (unitsValue) {
            case "MILES":
                unitName = "Miles";
                break;
            case "METERS":
                unitName = "Meters";
                break;
            case "KILOMETERS":
                unitName = "Kilometers";
                break;
            case "NAUTICALMILES":
                unitName = "Nautical Miles";
                break;
            default:
                unitName = defaultUnit;
                break;
            }
            routeUnitString = " " + unitName;
            return routeUnitString;
        }
    });
});
