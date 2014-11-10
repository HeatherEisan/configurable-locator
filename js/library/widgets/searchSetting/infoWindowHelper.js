/*global define,dojo,dojoConfig:true,alert,esri,console,Modernizr */
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
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/topic",
    "dojo/date",
    "dojo/date/locale",
    "widgets/locator/locator",
    "dojo/NodeList-manipulate"

], function (declare, domConstruct, domStyle, domAttr, lang, on, domGeom, dom, array, domClass, query, string, Locator, Query, Deferred, DeferredList, QueryTask, Geometry, Graphic, Point, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic, date, locale, LocatorTool) {
    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        sharedNls: sharedNls,
        featureArrayInfoWindow: null,
        rankValue: null,

        /**
        * positioning the infoWindow on extent change
        * @param {object} selectedPoint contains feature
        * @param {object} map
        * @param {object} infoWindow
        * @memberOf widgets/searchResult/infoWindowHelper
        */
        _onSetMapTipPosition: function (selectedPoint, map, infoWindow) {
            if (selectedPoint) {
                var screenPoint = map.toScreen(selectedPoint);
                screenPoint.y = map.height - screenPoint.y;
                infoWindow.setLocation(screenPoint);
            }
        },

        /**
        *set the zoom level an screen point and infowindow
        * @param {object} infoWindowZoomLevelObject contain featurePoint,attribute, layerId, layerTitle,featureSet
        * @memberOf widgets/searchResult/infoWindowHelper
        */
        _setInfoWindowZoomLevel: function (infoWindowZoomLevelObject) {
            var extentChanged, screenPoint, zoomDeferred;
            dojo.selectedMapPoint = infoWindowZoomLevelObject.Mappoint;
            if (this.map.getLevel() !== dojo.configData.ZoomLevel && infoWindowZoomLevelObject.InfoWindowParameter) {
                zoomDeferred = this.map.setLevel(dojo.configData.ZoomLevel);
                zoomDeferred.then(lang.hitch(this, function () {
                    extentChanged = this.map.setExtent(this._calculateCustomMapExtent(infoWindowZoomLevelObject.mapPoint));
                    extentChanged.then(lang.hitch(this, function () {
                        topic.publish("hideProgressIndicator");
                        screenPoint = this.map.toScreen(dojo.selectedMapPoint);
                        screenPoint.y = this.map.height - screenPoint.y;
                        topic.publish("setInfoWindowOnMap", infoWindowZoomLevelObject.MobileTitle, screenPoint, infoWindowZoomLevelObject.InfoPopupWidth, infoWindowZoomLevelObject.InfoPopupHeight);
                    }));
                }));
            } else {
                extentChanged = this.map.setExtent(this._calculateCustomMapExtent(dojo.selectedMapPoint));
                extentChanged.then(lang.hitch(this, function () {
                    topic.publish("hideProgressIndicator");
                    screenPoint = this.map.toScreen(dojo.selectedMapPoint);
                    screenPoint.y = this.map.height - screenPoint.y;
                    topic.publish("setInfoWindowOnMap", infoWindowZoomLevelObject.MobileTitle, screenPoint, infoWindowZoomLevelObject.InfoPopupWidth, infoWindowZoomLevelObject.InfoPopupHeight);
                }));
            }
        },

        /**
        *Fetch the geometry type of the mapPoint
        * @param {object} geometry Contains the geometry service
        * @memberOf widgets/searchResult/infoWindowHelper
        */
        _getMapPoint: function (geometry) {
            var selectedMapPoint, mapPoint, rings, points;
            if (geometry.type === "point") {
                selectedMapPoint = geometry;
            } else if (geometry.type === "polyline") {
                selectedMapPoint = geometry.getPoint(0, 0);
            } else if (geometry.type === "polygon") {
                mapPoint = geometry.getExtent().getCenter();
                if (!geometry.contains(mapPoint)) {
                    //if the center of the polygon does not lie within the polygon
                    rings = Math.floor(geometry.rings.length / 2);
                    points = Math.floor(geometry.rings[rings].length / 2);
                    selectedMapPoint = geometry.getPoint(rings, points);
                } else {
                    //if the center of the polygon lies within the polygon
                    selectedMapPoint = geometry.getExtent().getCenter();
                }
            }
            return selectedMapPoint;
        },

        /**
        * Create info window on map and populate the result
        * @param {object} infoWindowParameter  contains the mapPoint,attribute,layerId, featureArray, featureCount
        * @memberOf widgets/searchResult/infoWindowHelper
        */
        _createInfoWindowContent: function (infoWindowParameter) {
            var infoPopupHeight, infoWindowZoomLevelObject, featureSet = [], index, infoPopupWidth, infoTitle, i, j, widgetName, key;
            featureSet.push(infoWindowParameter.featureSet);
            for (i = 0; i < dojo.configData.InfoWindowSettings.length; i++) {
                if (infoWindowParameter.layerTitle === dojo.configData.InfoWindowSettings[i].Title && infoWindowParameter.layerId === dojo.configData.InfoWindowSettings[i].QueryLayerId) {
                    index = i;
                    break;
                }
            }
            widgetName = "";
            for (key in dojo.configData) {
                if (dojo.configData.hasOwnProperty(key)) {
                    if (key === "ActivitySearchSettings" || key === "EventSearchSettings") {
                        if (dojo.configData.ActivitySearchSettings[0].Title === infoWindowParameter.layerTitle && dojo.configData.ActivitySearchSettings[0].QueryLayerId === infoWindowParameter.layerId) {
                            widgetName = "InfoActivity";
                            break;
                        }
                        for (j = 0; j < dojo.configData.EventSearchSettings.length; j++) {
                            if (dojo.configData.EventSearchSettings[j].Title === infoWindowParameter.layerTitle && dojo.configData.EventSearchSettings[j].QueryLayerId === infoWindowParameter.layerId) {
                                widgetName = "InfoEvent";
                                break;
                            }
                        }
                    }
                }
            }
            topic.publish("getInfoWidgetName", widgetName);
            // To know the click of feature in Event plannner.
            this._getMapPoint(infoWindowParameter.mapPoint);
            this.highlightFeature(infoWindowParameter.mapPoint);
            infoPopupHeight = dojo.configData.InfoPopupHeight;
            infoPopupWidth = dojo.configData.InfoPopupWidth;
            this._infoWindowInformationTab(infoWindowParameter.attribute, index, widgetName, featureSet);
            this._infoWindowGalleryTab(infoWindowParameter.attribute, widgetName);
            this._infoWindowCommentTab(index, widgetName, infoWindowParameter.attribute);
            /*direction tab*/
            this._infoWindowDirectionTab(infoWindowParameter.attribute, widgetName, infoWindowParameter.featureSet);

            //Check if InfowindowContent available if not then showing infp title as mobile title.
            //In WebMap case infowindow contents will be not available
            if (dojo.configData.InfoWindowSettings[index].MobileCalloutField) {
                infoTitle = string.substitute(dojo.configData.InfoWindowSettings[index].MobileCalloutField, infoWindowParameter.attribute);
            } else {
                if (widgetName.toLowerCase() === "infoactivity") {
                    infoTitle = string.substitute(dojo.configData.ActivitySearchSettings[0].SearchDisplayFields, infoWindowParameter.attribute);
                } else if (widgetName.toLowerCase() === "infoevent") {
                    infoTitle = string.substitute(dojo.configData.EventSearchSettings[0].SearchDisplayFields, infoWindowParameter.attribute);
                }
            }
            infoWindowZoomLevelObject = { "Mappoint": infoWindowParameter.mapPoint, "MobileTitle": infoTitle, "InfoPopupWidth": infoPopupWidth, "InfoPopupHeight": infoPopupHeight, "InfoWindowParameter": infoWindowParameter.featureCount };
            dojo.selectedMapPoint = infoWindowParameter.mapPoint;
            this._setInfoWindowZoomLevel(infoWindowZoomLevelObject);
            topic.publish("hideProgressIndicator");
        },

        /**
        * infoWindow Direction tab
        * @param {field} attribute is the field of feature
        * @param {Sting} widgetName is name of widget
        * @param {object} endPoint contain feature
        * @memberOf widgets/searchResult/infoWindowHelper
        */
        _infoWindowDirectionTab: function (attribute, widgetName, endPoint) {
            var directionMainContainer, locatorInfoWindowObject, locatorInfoWindowParams, searchContentData, divHeader, infoWindowMapPoint, routeObject;
            if (dojo.byId("getDirContainer")) {
                domConstruct.empty(dojo.byId("getDirContainer"));
            }
            directionMainContainer = domConstruct.create("div", { "class": "esriCTDirectionMainContainer" }, dojo.byId("getDirContainer"));
            if (widgetName.toLowerCase() === "infoactivity") {
                searchContentData = string.substitute(dojo.configData.ActivitySearchSettings[0].SearchDisplayFields, attribute);
            } else if (widgetName.toLowerCase() === "infoevent") {
                searchContentData = string.substitute(dojo.configData.EventSearchSettings[0].SearchDisplayFields, attribute);
            }
            divHeader = domConstruct.create("div", {}, directionMainContainer);
            domConstruct.create("div", { "class": "esriCTSpanHeaderInfoWindow", "innerHTML": sharedNls.titles.directionText + " " + searchContentData }, divHeader);
            locatorInfoWindowParams = {
                defaultAddress: dojo.configData.LocatorSettings.LocatorDefaultAddress,
                preLoaded: false,
                parentDomNode: directionMainContainer,
                map: this.map,
                graphicsLayerId: "esriGraphicsLayerMapSettings",
                locatorSettings: dojo.configData.LocatorSettings,
                configSearchSettings: dojo.configData.SearchSettings
            };
            infoWindowMapPoint = this.map.getLayer(locatorInfoWindowParams.graphicsLayerId);
            locatorInfoWindowObject = new LocatorTool(locatorInfoWindowParams);
            setTimeout(lang.hitch(this, function () {
                if (window.location.href.toString().split("$addressLocationDirection=").length > 1) {
                    var mapPoint = new Point(window.location.href.toString().split("$addressLocationDirection=")[1].split("$")[0].split(",")[0], window.location.href.toString().split("$addressLocationDirection=")[1].split("$")[0].split(",")[1], this.map.spatialReference);
                    locatorInfoWindowObject._locateAddressOnMap(mapPoint, true);
                    routeObject = { "StartPoint": infoWindowMapPoint.graphics[0], "EndPoint": [endPoint], "Index": 0, "WidgetName": widgetName, "QueryURL": null };
                    this.showRoute(routeObject);
                }
            }), 8000);

            locatorInfoWindowObject.candidateClicked = lang.hitch(this, function (graphic) {
                dojo.addressLocationDirection = locatorInfoWindowObject.selectedGraphic.geometry.x.toString() + "," + locatorInfoWindowObject.selectedGraphic.geometry.y.toString();
                if (graphic && graphic.attributes && graphic.attributes.address) {
                    this.locatorAddress = graphic.attributes.address;
                }
                topic.publish("showProgressIndicator");
                this.removeGeolocationPushPin();
                this.carouselContainer.hideCarouselContainer();
                this.carouselContainer._setLegendPositionDown();
                this.removeRouteAndGraphics();
                routeObject = { "StartPoint": infoWindowMapPoint.graphics[0], "EndPoint": [endPoint], "Index": 0, "WidgetName": widgetName, "QueryURL": null };
                this.showRoute(routeObject);
            });
        },

        /**
        * Information Tab for InfoWindow
        * @param {field} attribute is the field of feature
        * @param {number} InfoIndex is the faeture layer id
        * @param {string} widgetName is name of widget
        * @param {object} featureSet Contain set of features
        * @memberOf widgets/SearchSetting/InfoWindowHelper
        */
        _infoWindowInformationTab: function (attributes, infoIndex, widgetName, featureSet) {
            var divInfoRow, divInformationContent, divHeader, divAddToListContainer, contentDiv, divFacilityContent,
                divAccessfee, SearchSettingsLayers, activityImageDiv, i, j, key, k, value, isAlreadyAdded, listData;
            if (dojo.byId("informationTabContainer")) {
                domConstruct.empty(dojo.byId("informationTabContainer"));
            }
            divInfoRow = domConstruct.create("div", { "class": "esriCTInfoWindoContainerOuter" }, dojo.byId("informationTabContainer"));
            divInformationContent = domConstruct.create("div", { "class": "esriCTInfoWindoContainer" }, divInfoRow);
            divHeader = domConstruct.create("div", { "class": "esriCTDivHeadercontainerInfo" }, divInformationContent);
            domConstruct.create("div", { "class": "esriCTheadText", "innerHTML": sharedNls.titles.facilityInfo }, divHeader);
            if (widgetName.toLowerCase() === "infoevent") {
                divAddToListContainer = domConstruct.create("div", { "class": "esriCTInfoAddlist" }, divHeader);
                domConstruct.create("div", { "class": "esriCTInfoAddToListIcon" }, divAddToListContainer);
                domConstruct.create("div", { "class": "esriCTInfoAddToListText", "innerHTML": sharedNls.titles.addToListTitle }, divAddToListContainer);
                this.own(on(divAddToListContainer, "click", lang.hitch(this, function () {
                    topic.publish("getEventObjectID", this.objectIdForEventLayer);
                    isAlreadyAdded = false;
                    if (this.myListStoreData.data.length > 0) {
                        for (listData = 0; listData < this.myListStoreData.data.length; listData++) {
                            if (this.myListStoreData.data[listData][this.objectIdForEventLayer] === featureSet[0].attributes[this.objectIdForEventLayer]) {
                                alert(sharedNls.errorMessages.activityAlreadyadded);
                                isAlreadyAdded = true;
                                break;
                            }
                        }
                    }
                    if (!isAlreadyAdded) {
                        topic.publish("toggleWidget", "Activities");
                        topic.publish("addToMyList", featureSet[0]);
                    }
                })));
            }
            contentDiv = domConstruct.create("div", { "class": "esriCTDivClear" }, divInformationContent);
            divFacilityContent = domConstruct.create("div", {}, divInformationContent);
            for (i in attributes) {
                if (attributes.hasOwnProperty(i)) {
                    if (!attributes[i]) {
                        attributes[i] = sharedNls.showNullValue;
                    }
                }
            }
            if (dojo.configData.InfoWindowSettings[infoIndex].ShowAllFields === false) {
                for (j = 0; j < dojo.configData.InfoWindowSettings[infoIndex].InfoWindowData.length; j++) {
                    divAccessfee = domConstruct.create("div", { "class": "esriCTInfofacility" }, contentDiv);
                    domConstruct.create("div", { "class": "esriCTFirstChild", "innerHTML": dojo.configData.InfoWindowSettings[infoIndex].InfoWindowData[j].DisplayText }, divAccessfee);
                    domConstruct.create("div", { "class": "esriCTSecondChild", "innerHTML": string.substitute(dojo.configData.InfoWindowSettings[infoIndex].InfoWindowData[j].FieldName, attributes) }, divAccessfee);
                }
            } else if (dojo.configData.InfoWindowSettings[infoIndex].ShowAllFields === true) {
                for (key in attributes) {
                    if (attributes.hasOwnProperty(key)) {
                        if (key !== "OBJECTID") {
                            value = attributes[key];
                            divAccessfee = domConstruct.create("div", { "class": "esriCTInfofacility" }, contentDiv);
                            domConstruct.create("div", { "class": "esriCTFirstChild", "innerHTML": key }, divAccessfee);
                            domConstruct.create("div", { "class": "esriCTSecondChild", "innerHTML": value }, divAccessfee);
                        }
                    }
                }
            } else {
                for (k = 0; k < dojo.configData.InfoWindowSettings[infoIndex].InfoWindowData.length; k++) {
                    divAccessfee = domConstruct.create("div", { "class": "esriCTInfofacility" }, contentDiv);
                    domConstruct.create("div", { "class": "esriCTFirstChild", "innerHTML": dojo.configData.InfoWindowSettings[infoIndex].InfoWindowData[k].DisplayText }, divAccessfee);
                    domConstruct.create("div", { "class": "esriCTSecondChild", "innerHTML": string.substitute(dojo.configData.InfoWindowSettings[infoIndex].InfoWindowData[k].FieldName, attributes) }, divAccessfee);
                }
            }
            if (widgetName.toLowerCase() === "infoactivity") {
                for (j = 0; j < dojo.configData.ActivitySearchSettings.length; j++) {
                    SearchSettingsLayers = dojo.configData.ActivitySearchSettings[j];
                    for (i = 0; i < SearchSettingsLayers.ActivityList.length; i++) {
                        if (dojo.string.substitute(SearchSettingsLayers.ActivityList[i].FieldName, attributes)) {
                            if (attributes[dojo.string.substitute(SearchSettingsLayers.ActivityList[i].FieldName, attributes)] === "Yes") {
                                activityImageDiv = domConstruct.create("div", { "class": "esriCTActivityImage" }, divFacilityContent);
                                domConstruct.create("img", { "src": SearchSettingsLayers.ActivityList[i].Image }, activityImageDiv);
                            }
                        }
                    }
                }
            }
        },

        /**
        * Comment Tab for InfoWindow
        * @param {number} infoIndex is layer id
        * @param {string} widgetName is name of widget
        * @param {field} attribute is the field of feature
        * @memberOf widgets/SearchSetting/InfoWindowHelper
        */
        _infoWindowCommentTab: function (infoIndex, widgetName, attribute) {
            var SearchSettingsLayersForComment, searchSettingsData, i, outerCommentContainer, queryObject;
            if (widgetName.toLowerCase() === "infoactivity") {
                searchSettingsData = dojo.configData.ActivitySearchSettings;
            } else if (widgetName.toLowerCase() === "infoevent") {
                searchSettingsData = dojo.configData.EventSearchSettings;
            }
            for (i = 0; i < searchSettingsData.length; i++) {
                SearchSettingsLayersForComment = searchSettingsData[i];
                if (SearchSettingsLayersForComment.CommentsSettings && SearchSettingsLayersForComment.CommentsSettings.Enabled) {
                    if (dojo.byId("commentsTabContainer")) {
                        domConstruct.empty(dojo.byId("commentsTabContainer"));
                    }
                    outerCommentContainer = domConstruct.create("div", { "class": "esriCTCommentInfoOuterContainer" }, dojo.byId("commentsTabContainer"));
                    domConstruct.create("div", { "class": "esriCTCommentContainer" }, outerCommentContainer);
                    queryObject = { "FeatureData": attribute, "SolveRoute": null, "Index": infoIndex, "QueryURL": searchSettingsData[0].QueryURL, "WidgetName": widgetName, "Address": null, "IsRouteCreated": false };
                    topic.publish("showProgressIndicator");
                    this.queryCommentLayer(queryObject);
                }
            }
        },

        /**
        * Gallery Tab for InfoWindow
        * @param {field} attribute is the field of feature
        * @param {string} widgetName is name of widget
        * @memberOf widgets/SearchSetting/InfoWindowHelper
        */
        _infoWindowGalleryTab: function (attribute, widgetName) {
            var hasLayerAttachments;
            if (this.galleryContainer) {
                domConstruct.destroy(this.galleryContainer);
            }
            this.galleryContainer = domConstruct.create("div", { "class": "esriCTGalleryInfoContainer" }, dojo.byId("galleryTabContainer"));
            if (attribute) {
                hasLayerAttachments = this._setGallaryForInfoWindow(attribute, widgetName);
            }
            if (!hasLayerAttachments) {
                domConstruct.create("div", { "class": "esriCTGalleryBox", "innerHTML": sharedNls.errorMessages.imageDoesNotFound }, this.galleryContainer);
            }
        },

        /**
        * Set Gallary For InfoWindow
        * @param {field} attribute is the field of feature
        * @param {field} widgetName is the name of the widget
        * @memberOf widgets/SearchSetting/InfoWindowHelper
        */
        _setGallaryForInfoWindow: function (attribute, widgetName) {
            var layerIndex, layerID, searchSettingsData, hasLayerAttachments = false;
            if (widgetName.toLowerCase() === "infoactivity") {
                searchSettingsData = dojo.configData.ActivitySearchSettings;
            } else if (widgetName.toLowerCase() === "infoevent") {
                searchSettingsData = dojo.configData.EventSearchSettings;
            }
            if (this.map._layers) {
                for (layerIndex = 0; layerIndex < searchSettingsData.length; layerIndex++) {
                    for (layerID in this.map._layers) {
                        if (this.map._layers.hasOwnProperty(layerID)) {
                            if (this.map._layers[layerID].url && this.map._layers[layerID].hasAttachments && (this.map._layers[layerID].url === searchSettingsData[layerIndex].QueryURL)) {
                                hasLayerAttachments = true;
                                this.map._layers[layerID].queryAttachmentInfos(attribute[this.map._layers[layerID].objectIdField], lang.hitch(this, this._getAttachments), this._errorLog);
                            }
                        }
                    }
                }
            }
            return hasLayerAttachments;
        },

        /**
        * Get Attachments For InfoWindow
        * @param {object} responce is the information about the attachment
        * @memberOf widgets/SearchSetting/InfoWindowHelper
        */
        _getAttachments: function (response) {
            var divAttchmentInfo, divPreviousImgInfo, divNextImgInfo;
            this.imageCountInfo = 0;
            if (response.length > 1) {
                divPreviousImgInfo = domConstruct.create("div", { "class": "esriCTImgPrev" }, this.galleryContainer);
                divNextImgInfo = domConstruct.create("div", { "class": "esriCTImgNext" }, this.galleryContainer);
                divAttchmentInfo = domConstruct.create("img", { "class": "esriCTDivAttchmentInfo" }, this.galleryContainer);
                domAttr.set(divAttchmentInfo, "src", response[0].url);
                this.own(on(divPreviousImgInfo, "click", lang.hitch(this, this._previousImageInfo, response, divAttchmentInfo)));
                this.own(on(divNextImgInfo, "click", lang.hitch(this, this._nextImageInfo, response, divAttchmentInfo)));
            } else if (response.length === 1) {
                divAttchmentInfo = domConstruct.create("img", { "class": "esriCTDivAttchmentInfo" }, this.galleryContainer);
                domAttr.set(divAttchmentInfo, "src", response[0].url);
            } else {
                domConstruct.create("div", { "class": "esriCTGalleryBox", "innerHTML": sharedNls.errorMessages.imageDoesNotFound }, this.galleryContainer);
            }
        },


        /**
        * change the image when click on previous arrow of image
        * @param {object} response contain the images which are in the feature layer
        * @param {node} divAttchmentInfo is domNode
        * @memberOf widgets/SearchSetting/InfoWindowHelper
        */
        _previousImageInfo: function (response, divAttchmentInfo) {
            this.imageCountInfo--;
            if (this.imageCountInfo < 0) {
                this.imageCountInfo = response.length - 1;
            }
            domAttr.set(divAttchmentInfo, "src", response[this.imageCountInfo].url);
        },

        /**
        * change the image when click on next arrow of image
        * @param {object} response contain the images which are in the feature layer
        * @param {node} divAttchmentInfo is domNode
        * @memberOf widgets/SearchSetting/InfoWindowHelper
        */
        _nextImageInfo: function (response, divAttchmentInfo) {
            this.imageCountInfo++;
            if (this.imageCountInfo === response.length) {
                this.imageCountInfo = 0;
            }
            domAttr.set(divAttchmentInfo, "src", response[this.imageCountInfo].url);
        },

        /**
        * change the image when click on next arrow of image
        * @param {object} error contain the error string
        * @memberOf widgets/SearchSetting/InfoWindowHelper
        */
        _errorLog: function (error) {
            console.log(error);
        },

        /**
        * set infoWindow Comments
        * @param {object} result contain comments of feature
        * @param {field} featureId is ObhectID
        * @param {number} resultcontent contails index number of feature
        * @memberOf widgets/SearchSetting/InfoWindowHelper
        */
        _setInfoWindowComment: function (result, resultcontent, featureId) {
            var j, divHeaderStar, divStar, utcMilliseconds, l, isCommentFound = false, divCommentRow, postCommentContainer, i, commentValue, divContentDiv,
                esriCTCommentDateStar, postCommentButton, infocontainer, divCommentContainer, divCommentRowCont;
            try {
                for (i = 0; i < dojo.configData.ActivitySearchSettings.length; i++) {
                    divCommentContainer = query('.esriCTCommentContainer')[0];
                    divContentDiv = domConstruct.create("div", { "class": "esriCTCommentInfoContent" }, divCommentContainer);
                    this.removeNullValue(result);
                    if (result.length > 0) {
                        for (l = 0; l < result.length; l++) {
                            commentValue = string.substitute(dojo.configData.ActivitySearchSettings[i].CommentsSettings.CommentField, result[l].attributes);
                            if (commentValue !== sharedNls.showNullValue) {
                                divCommentRowCont = domConstruct.create("div", { "class": "esriCTDivCommentRowCont" }, divContentDiv);
                                divCommentRow = domConstruct.create("div", { "class": "esriCTDivCommentRow" }, divCommentRowCont);
                                esriCTCommentDateStar = domConstruct.create("div", { "class": "esriCTCommentDateStar" }, divCommentRow);
                                divHeaderStar = domConstruct.create("div", { "class": "esriCTHeaderRatingStar" }, esriCTCommentDateStar);
                                isCommentFound = true;
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
                                domConstruct.create("div", { "class": "esriCTCommentText", "innerHTML": commentValue }, divCommentRow);
                                domConstruct.create("div", { "class": "esriCTCommentDateInfoWindow", "innerHTML": dojo.date.locale.format(this.utcTimestampFromMs(utcMilliseconds), { datePattern: dojo.configData.ActivitySearchSettings[i].CommentsSettings.DisplayDateFormat, selector: "date" }) }, esriCTCommentDateStar);
                            }
                        }
                    }
                }
                if (!isCommentFound) {
                    domConstruct.empty(divContentDiv);
                    domConstruct.create("div", { "class": "esriCTNullCommentText", "innerHTML": sharedNls.errorMessages.noCommentAvaiable }, divContentDiv);
                }
                domClass.add(divCommentContainer, "esriCTInfoContentComment");
                postCommentContainer = domConstruct.create("div", { "class": "esriCTButtonDiv" }, null);
                postCommentButton = domConstruct.create("div", { "class": "esriCTInfoPostButton", "innerHTML": sharedNls.titles.postComment }, postCommentContainer);
                infocontainer = query('.esriCTCommentContainer')[0];

                domConstruct.place(postCommentContainer, infocontainer, "after");
                this.own(on(postCommentButton, "click", lang.hitch(this, function () {
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
        * @memberOf widgets/SearchSetting/InfoWindowHelper
        */
        _postComment: function (commentID, result) {
            var divStarRating, postCommentContainer, buttonDiv, backButton, submitButton, j, starInfoWindow = [], backToMapHide, postCommentContent, outerCommentContainer;
            backToMapHide = query('.esriCTCloseDivMobile')[0];
            outerCommentContainer = query('.esriCTCommentInfoOuterContainer')[0];
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
            for (j = 0; j < 5; j++) {
                this.rankValue = 0;
                this._checked = false;
                starInfoWindow[j] = domConstruct.create("div", { "class": "esriCTRatingStarPostComment" }, divStarRating);
                this.own(on(starInfoWindow[j], "click", lang.hitch(this, this._selectedStarForPostComment, starInfoWindow, starInfoWindow[j], j)));
                this.own(on(starInfoWindow[j], "mouseover", lang.hitch(this, this._selectHoverStars, starInfoWindow, j)));
                this.own(on(starInfoWindow[j], "mouseout", lang.hitch(this, this._deSelectHoverStars, starInfoWindow, j)));
            }
            domConstruct.create("textarea", { "class": "textAreaContainer", "id": "txtComments", "placeholder": sharedNls.titles.postCommentText }, postCommentContent);
            buttonDiv = domConstruct.create("div", { "class": "esriCTButtonDiv" }, postCommentContainer);
            backButton = domConstruct.create("div", { "class": "esriCTInfoBackButton", "innerHTML": sharedNls.titles.backButton }, buttonDiv);
            submitButton = domConstruct.create("div", { "class": "esriCTInfoSubmitButton", "innerHTML": sharedNls.titles.submitButton }, buttonDiv);
            this.own(on(backButton, "click", lang.hitch(this, function () {
                this._backButton();
            })));
            this.own(on(submitButton, "click", lang.hitch(this, function () {
                this._submitButton(commentID, result);
            })));
        },

        /**
        * submit button in infoWindow for post comment
        * @param {object} selectedFeatureID contains selected featureID
        * @param {object} result contains Date,Comment and star
        * @memberOf widgets/SearchSetting/InfoWindowHelper
        */
        _submitButton: function (selectedFeatureID, result) {
            var commentsLayer, commentGraphic, currenDate, currentDateFormat, attr, self, setAttribute, updatedComments, i, k, l, currentMonth, divCommentRow, outerCommentContainer,
                destroyCommentText, esriCTCommentDateStar, divHeaderStar, divStar, backToMapHide, backText, contentDivAfterNewComment, divContentDiv;
            self = this;
            outerCommentContainer = query('.esriCTCommentInfoOuterContainer')[0];
            divContentDiv = query('.esriCTCommentInfoContent')[0];
            topic.publish("showProgressIndicator");
            backText = query('.esriCTInfoBackButton')[0];
            backToMapHide = query('.esriCTCloseDivMobile')[0];
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
                    attr[dojo.configData.ActivitySearchSettings[i].CommentsSettings.ForeignKeyFieldForActivity] = selectedFeatureID;
                    attr[this.getKeyValue(dojo.configData.ActivitySearchSettings[i].CommentsSettings.CommentField)] = lang.trim(dojo.byId("txtComments").value);
                    attr[this.getKeyValue(dojo.configData.ActivitySearchSettings[i].CommentsSettings.SubmissionDateField)] = currentDateFormat; // date.utcMsFromTimestamp(date.localToUtc(date.localTimestampNow()));
                    attr[this.getKeyValue(dojo.configData.ActivitySearchSettings[i].CommentsSettings.RankField)] = this.rankValue;
                    setAttribute = {
                        comments: lang.trim(dojo.byId("txtComments").value),
                        submitId: currentDateFormat,
                        rank: self.rankValue
                    };
                }
                commentGraphic.setAttributes(attr);
                updatedComments = [];
                commentsLayer.applyEdits([commentGraphic], null, null, lang.hitch(this, function (msg) {
                    if (!msg[0].error) {
                        if (dojo.window.getBox().w <= 768) {
                            domStyle.set(backText, "display", "none");
                            if (backToMapHide) {
                                domStyle.set(backToMapHide, "display", "block");
                            }
                        }
                        updatedComments.push({ "attributes": setAttribute });
                        for (i = 0; i < result.length; i++) {
                            updatedComments.push(result[i]);
                        }
                        domStyle.set(dojo.byId("divCTPostCommentContainer"), "display", "none");
                        domStyle.set(outerCommentContainer, "display", "block");
                        destroyCommentText = query('.esriCTNullCommentText')[0];
                        if (destroyCommentText) {
                            domConstruct.destroy(destroyCommentText);
                        }
                        if (divCommentRow && divCommentRow.parentElement === null) {
                            divCommentRow = domConstruct.create("div", { "class": "esriCTDivCommentRow" }, null);
                        } else {
                            divCommentRow = domConstruct.create("div", { "class": "esriCTDivCommentRow" }, divContentDiv);
                        }
                        esriCTCommentDateStar = domConstruct.create("div", { "class": "esriCTCommentDateStar" }, divCommentRow);
                        divHeaderStar = domConstruct.create("div", { "class": "esriCTHeaderRatingStar" }, esriCTCommentDateStar);

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
        * @memberOf widgets/SearchSetting/InfoWindowHelper
        */
        _backButton: function () {
            var backToMapHide, outerCommentContainer;
            backToMapHide = query('.esriCTCloseDivMobile')[0];
            outerCommentContainer = query('.esriCTCommentInfoOuterContainer')[0];
            domStyle.set(dojo.byId("divCTPostCommentContainer"), "display", "none");
            domStyle.set(outerCommentContainer, "display", "block");
            if (dojo.window.getBox().w <= 768) {
                domStyle.set(backToMapHide, "display", "block");
            }
        },

        /**
        * selected star for postComment in infoWindow for post comment block
        * @param {object} result contains Date,Comment and star
        * @param {object} starInfoWindow contains stars for infoWindow in comment panel
        * @param {object} j contains the selected star for infoWindow in comment panel
        * @memberOf widgets/SearchSetting/InfoWindowHelper
        */
        _selectedStarForPostComment: function (result, starInfoWindow, j) {
            var i;
            if ((dojo.hasClass(result[j], "esriCTRatingStarChecked")) && this._checked) {
                for (i = 4; i >= j; i--) {
                    domClass.replace(result[i], "esriCTRatingStar");
                }
                if (j !== 0) {
                    domClass.add(result[j], "esriCTRatingStarChecked");
                    this.rankValue = j + 1;
                } else {
                    //when no rating is selected
                    this.rankValue = j;
                }
            } else {
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
        * @memberOf widgets/SearchSetting/InfoWindowHelper
        */
        _selectHoverStars: function (result, j) {
            var i;
            if (result) {
                for (i = 0; i <= j; i++) {
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
        * @memberOf widgets/SearchSetting/InfoWindowHelper
        */
        _deSelectHoverStars: function (result, j) {
            var i;
            if (result) {
                for (i = 0; i <= j; i++) {
                    if (dojo.hasClass(result[i], "esriCTRatingStarHover")) {
                        domClass.remove(result[i], "esriCTRatingStarHover");
                    }
                }
            }
        },


        /**
        * Get date from the layer
        * @param {object} date field of layer
        * @memberOf widgets/SearchSetting/InfoWindowHelper
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
        * Calculate offset point to show infow window
        * @param {mapPoint}
        * @memberOf widgets/SearchSetting/InfoWindowHelper
        */
        _calculateCustomMapExtent: function (mapPoint) {
            var width, infoWidth, height, diff, ratioHeight, ratioWidth, totalYPoint, xmin,
                ymin, xmax, ymax;
            width = this.map.extent.getWidth();
            infoWidth = (this.map.width / 2) + dojo.configData.InfoPopupWidth / 2 + 400;
            height = this.map.extent.getHeight();
            if (infoWidth > this.map.width) {
                diff = infoWidth - this.map.width;
            } else {
                diff = 0;
            }
            ratioHeight = height / this.map.height;
            ratioWidth = width / this.map.width;
            totalYPoint = dojo.configData.InfoPopupHeight + 30 + 61;
            xmin = mapPoint.x - (width / 2);
            if (dojo.window.getBox().w >= 680) {
                ymin = mapPoint.y - height + (ratioHeight * totalYPoint);
                xmax = xmin + width + diff * ratioWidth;
            } else {
                ymin = mapPoint.y - (height / 2);
                xmax = xmin + width;
            }
            ymax = ymin + height;
            return new esri.geometry.Extent(xmin, ymin, xmax, ymax, this.map.spatialReference);
        }
    });
});
