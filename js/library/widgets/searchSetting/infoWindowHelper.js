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
    "esri/geometry/Extent",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/topic",
    "dojo/date",
    "dojo/date/locale",
    "widgets/locator/locator",
    "dijit/a11yclick",
    "dojo/NodeList-manipulate"

], function (declare, domConstruct, domStyle, domAttr, lang, on, domGeom, dom, array, domClass, query, string, Locator, Query, Deferred, DeferredList, QueryTask, Geometry, Graphic, Point, GeometryExtent, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic, date, locale, LocatorTool, a11yclick) {
    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        sharedNls: sharedNls,                                   // Variable for shared NLS
        featureArrayInfoWindow: null,                           // Variable store the feature in infowindow
        rankValue: null,                                        // Variable for the rank value in post commnet tab
        isDirectionCalculated: false,                           // Variable for Direction calculate
        infoWindowFeatureData: [],                              // array to store for feature data of infoWindow

        /**
        * positioning the infoWindow on extent change
        * @param {object} selectedPoint contains feature
        * @param {object} map
        * @param {object} infoWindow
        * @memberOf widgets/searchSetting/infoWindowHelper
        */
        _onSetMapTipPosition: function (selectedPoint, map, infoWindow) {
            // check if faeture is contain
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
            //check the zoomlevel of map and set infowindow zoom level according to it
            if (this.map.getLevel() !== dojo.configData.ZoomLevel && infoWindowZoomLevelObject.InfoWindowParameter) {
                zoomDeferred = this.map.setLevel(dojo.configData.ZoomLevel);
                zoomDeferred.then(lang.hitch(this, function () {
                    // check if "$extentChanged=" is present in url
                    if (window.location.href.toString().split("$extentChanged=").length > 1) {
                        if (this.isExtentSet) {
                            extentChanged = this.map.setExtent(this._calculateCustomMapExtent(infoWindowZoomLevelObject.mapPoint));
                        } else {
                            topic.publish("hideProgressIndicator");
                            screenPoint = this.map.toScreen(dojo.selectedMapPoint);
                            screenPoint.y = this.map.height - screenPoint.y;
                            topic.publish("setInfoWindowOnMap", infoWindowZoomLevelObject.MobileTitle, screenPoint, infoWindowZoomLevelObject.InfoPopupWidth, infoWindowZoomLevelObject.InfoPopupHeight);
                        }
                    } else {
                        extentChanged = this.map.setExtent(this._calculateCustomMapExtent(dojo.selectedMapPoint));
                    }
                    if (extentChanged) {
                        extentChanged.then(lang.hitch(this, function () {
                            topic.publish("hideProgressIndicator");
                            screenPoint = this.map.toScreen(dojo.selectedMapPoint);
                            screenPoint.y = this.map.height - screenPoint.y;
                            topic.publish("setInfoWindowOnMap", infoWindowZoomLevelObject.MobileTitle, screenPoint, infoWindowZoomLevelObject.InfoPopupWidth, infoWindowZoomLevelObject.InfoPopupHeight);
                        }));
                    }
                }));
            } else {
                // check if "$extentChanged=" is present in url
                if (window.location.href.toString().split("$extentChanged=").length > 1) {
                    if (this.isExtentSet) {
                        extentChanged = this.map.setExtent(this._calculateCustomMapExtent(dojo.selectedMapPoint));
                    } else {
                        topic.publish("hideProgressIndicator");
                        screenPoint = this.map.toScreen(dojo.selectedMapPoint);
                        screenPoint.y = this.map.height - screenPoint.y;
                        topic.publish("setInfoWindowOnMap", infoWindowZoomLevelObject.MobileTitle, screenPoint, infoWindowZoomLevelObject.InfoPopupWidth, infoWindowZoomLevelObject.InfoPopupHeight);
                    }
                } else {
                    extentChanged = this.map.setExtent(this._calculateCustomMapExtent(dojo.selectedMapPoint));
                }
                if (extentChanged) {
                    extentChanged.then(lang.hitch(this, function () {
                        topic.publish("hideProgressIndicator");
                        screenPoint = this.map.toScreen(dojo.selectedMapPoint);
                        screenPoint.y = this.map.height - screenPoint.y;
                        topic.publish("setInfoWindowOnMap", infoWindowZoomLevelObject.MobileTitle, screenPoint, infoWindowZoomLevelObject.InfoPopupWidth, infoWindowZoomLevelObject.InfoPopupHeight);
                    }));
                }
            }
        },

        /**
        * get the string of service URL using query operation
        * @param {number} key for service URL
        * @memberOf widgets/searchSetting/infoWindowHelper
        */
        _getQueryString: function (key) {
            var extentValue = "", regex, qs;
            regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
            qs = regex.exec(window.location.href);
            if (qs && qs.length > 0) {
                extentValue = qs[1];
            }
            return extentValue;
        },

        /**
        *Fetch the geometry type of the mapPoint
        * @param {object} geometry Contains the geometry service
        * return selected MapPoint
        * @memberOf widgets/searchResult/infoWindowHelper
        */
        _getMapPoint: function (geometry) {
            var selectedMapPoint, mapPoint, rings, points;
            //if geometry type is point
            if (geometry.type === "point") {
                selectedMapPoint = geometry;
                //if geometry type is polyline
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
            var infoPopupHeight, queryURL, serchSetting, infoWindowZoomLevelObject, galaryObject, featureSet = [], index, infoPopupWidth, infoTitle, widgetName, commentObject, directionObject;
            featureSet.push(infoWindowParameter.featureSet);
            this.infoWindowFeatureData = infoWindowParameter.featureArray;
            index = this._getInfowWindowIndex(infoWindowParameter.layerTitle, infoWindowParameter.layerId);
            queryURL = this.getQueryUrl(infoWindowParameter.layerId, infoWindowParameter.layerTitle);
            serchSetting = this.getSearchSetting(queryURL);
            widgetName = this._getInfowWindowWidgetName(infoWindowParameter.layerTitle, infoWindowParameter.layerId);
            topic.publish("getInfoWidgetName", widgetName);
            // To know the click of feature in Event plannner.
            this._getMapPoint(infoWindowParameter.mapPoint);
            this.highlightFeature(infoWindowParameter.mapPoint);
            infoPopupHeight = dojo.configData.InfoPopupHeight;
            infoPopupWidth = dojo.configData.InfoPopupWidth;
            this._infoWindowInformationTab(infoWindowParameter.attribute, index, widgetName, featureSet, Number(infoWindowParameter.IndexNumber), infoWindowParameter.featureArray.length, infoWindowParameter.widgetName, infoWindowParameter.layerId, infoWindowParameter.layerTitle);
            galaryObject = { "attribute": infoWindowParameter.attribute, "widgetName": widgetName };
            topic.publish("galaryObject", galaryObject);
            this._infoWindowGalleryTab(galaryObject);
            commentObject = { "attribute": infoWindowParameter.attribute, "widgetName": widgetName, "index": index };
            topic.publish("commentObject", commentObject);
            this._infoWindowCommentTab(commentObject);
            /*direction tab*/
            directionObject = { "attribute": infoWindowParameter.attribute, "widgetName": widgetName, "featureSet": infoWindowParameter.featureSet, "QueryURL": queryURL };
            topic.publish("directionObject", directionObject);
            //Check if InfowindowContent available if not then showing infp title as mobile title.
            //In WebMap case infowindow contents will be not available
            if (dojo.configData.InfoWindowSettings[index].MobileCalloutField) {
                infoTitle = string.substitute(dojo.configData.InfoWindowSettings[index].MobileCalloutField, infoWindowParameter.attribute);
            } else {
                infoTitle = string.substitute(serchSetting.SearchDisplayFields, infoWindowParameter.attribute);
            }
            infoWindowZoomLevelObject = { "Mappoint": infoWindowParameter.mapPoint, "MobileTitle": infoTitle, "InfoPopupWidth": infoPopupWidth, "InfoPopupHeight": infoPopupHeight, "InfoWindowParameter": infoWindowParameter.featureCount };
            dojo.selectedMapPoint = infoWindowParameter.mapPoint;
            this._setInfoWindowZoomLevel(infoWindowZoomLevelObject);
            topic.publish("hideProgressIndicator");
        },

        /**
        * It gets the info window index from info window settings of selected feature
        * @param {layerTitle} layerTitle of feature
        * @param {layerId} layerID of feature
        * @memberOf widgets/searchResult/infoWindowHelper
        */
        _getInfowWindowIndex: function (layerTitle, layerId) {
            var index, i;
            // looping for getting the feture Title and Layerid
            for (i = 0; i < dojo.configData.InfoWindowSettings.length; i++) {
                if (layerTitle === dojo.configData.InfoWindowSettings[i].Title && layerId === dojo.configData.InfoWindowSettings[i].QueryLayerId) {
                    index = i;
                    break;
                }
            }
            return index;
        },

        /**
        * Function get object id on the basic of setting name
        * @param {LayerId} layer id value
        * @param {LayerTitle} layer title value
        * @memberOf widgets/searchResult/infoWindowHelper
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
        * It gets the feature type from  selected feature
        * @param {layerTitle} layerTitle of feature
        * @param {layerId} layerID of feature
        * @memberOf widgets/searchResult/infoWindowHelper
        */
        _getInfowWindowWidgetName: function (layerTitle, layerId) {
            var widgetName = "", key, j;
            for (key in dojo.configData) {
                if (dojo.configData.hasOwnProperty(key)) {
                    if (key === "ActivitySearchSettings" || key === "EventSearchSettings") {
                        if (dojo.configData.ActivitySearchSettings[0].Title === layerTitle && dojo.configData.ActivitySearchSettings[0].QueryLayerId === layerId) {
                            widgetName = "InfoActivity";
                            break;
                        }
                        for (j = 0; j < dojo.configData.EventSearchSettings.length; j++) {
                            if (dojo.configData.EventSearchSettings[j].Title === layerTitle && dojo.configData.EventSearchSettings[j].QueryLayerId === layerId) {
                                widgetName = "InfoEvent";
                                break;
                            }
                        }
                    }
                }
            }
            return widgetName;
        },


        /**
        * infoWindow Direction tab
        * @param {field} attribute is the field of feature
        * @param {Sting} widgetName is name of widget
        * @param {object} endPoint contain feature
        * @memberOf widgets/searchResult/infoWindowHelper
        */
        _infoWindowDirectionTab: function (directionObject) {
            var directionMainContainer, serchSetting, locatorInfoWindowObject, locatorInfoWindowParams, searchContentData, divHeader, infoWindowMapPoint, routeObject, infoWindowPoint, point, mapLogoPostionDown, imgCustomLogo, pushPinGemotery;
            //check direction container is present
            if (dojo.byId("getDirContainer")) {
                domConstruct.empty(dojo.byId("getDirContainer"));
            }
            directionMainContainer = domConstruct.create("div", { "class": "esriCTDirectionMainContainer" }, dojo.byId("getDirContainer"));
            serchSetting = this.getSearchSetting(directionObject.QueryURL);
            searchContentData = string.substitute(serchSetting.SearchDisplayFields, directionObject.attribute);
            divHeader = domConstruct.create("div", {}, directionMainContainer);
            domConstruct.create("div", { "class": "esriCTSpanHeaderInfoWindow", "innerHTML": sharedNls.titles.directionText + " " + searchContentData }, divHeader);
            this.removeHighlightedCircleGraphics();
            //check if it is geolocation graphic or address search graphic
            if (this.map.getLayer(this.geoLocationGraphicsLayerID).graphics.length > 0) {
                pushPinGemotery = this.map.getLayer(this.geoLocationGraphicsLayerID).graphics;
            } else {
                pushPinGemotery = this.map.getLayer(this.locatorGraphicsLayerID).graphics;
            }
            if (pushPinGemotery && pushPinGemotery[0]) {
                this.removeHighlightedCircleGraphics();
                routeObject = { "StartPoint": pushPinGemotery[0], "EndPoint": [directionObject.featureSet], "Index": 0, "WidgetName": directionObject.widgetName, "QueryURL": directionObject.QueryURL };
                this.showRoute(routeObject);
            }
            //locatorInfoWindowParams is the object of locator.js created for unified search
            locatorInfoWindowParams = {
                defaultAddress: dojo.configData.LocatorSettings.LocatorDefaultAddress,
                preLoaded: false,
                parentDomNode: directionMainContainer,
                map: this.map,
                graphicsLayerId: this.locatorGraphicsLayerID,
                locatorSettings: dojo.configData.LocatorSettings,
                configSearchSettings: dojo.configData.SearchSettings
            };
            infoWindowMapPoint = this.map.getLayer(locatorInfoWindowParams.graphicsLayerId);
            locatorInfoWindowObject = new LocatorTool(locatorInfoWindowParams);
            locatorInfoWindowObject.candidateClicked = lang.hitch(this, function (graphic) {
                //set variable for infowindow direction in case of share
                dojo.infowindowDirection = directionObject.featureSet.geometry.x.toString() + "," + directionObject.featureSet.geometry.y.toString();
                if (locatorInfoWindowObject && locatorInfoWindowObject.selectedGraphic) {
                    dojo.infowindowDirection = dojo.infowindowDirection + "," + locatorInfoWindowObject.selectedGraphic.geometry.x.toString() + "," + locatorInfoWindowObject.selectedGraphic.geometry.y.toString();
                }
                if (graphic && graphic.attributes && graphic.attributes.address) {
                    this.locatorAddress = graphic.attributes.address;
                }
                //check if the layer information is in the graphic
                if (graphic && graphic.layer) {
                    this.selectedLayerTitle = graphic.layer.SearchDisplayTitle;
                }
                dojo.eventInfoWindowData = null;
                dojo.sharedGeolocation = null;
                dojo.infoRoutePoint = null;
                topic.publish("showProgressIndicator");
                this.removeGeolocationPushPin();
                this.carouselContainer.hideCarouselContainer();
                if (dojo.configData.CustomLogoUrl) {
                    // if ShowLegend is 'True' then set Legend Poition Down and place the customLogo image at the bottom of screen
                    if (dojo.configData.ShowLegend) {
                        imgCustomLogo = query('.esriCTCustomMapLogo')[0];
                        this.carouselContainer._setLegendPositionDown();
                        domClass.replace(imgCustomLogo, "esriCTCustomMapLogoBottom", "esriCTCustomMapLogoPostionChange");
                    } else {
                        mapLogoPostionDown = query('.esriControlsBR')[0];
                        imgCustomLogo = query('.esriCTCustomMapLogo')[0];
                        // if ShowLegend is 'False' then remove all classess which holds esriLogo and customLogo position above the bottom of screen
                        if (query('.esriCTDivMapPositionTop')[0]) {
                            domClass.remove(mapLogoPostionDown, "esriCTDivMapPositionTop");
                        }
                        if (query('.esriCTDivMapPositionUp')[0]) {
                            domClass.remove(mapLogoPostionDown, "esriCTDivMapPositionUp");
                        }
                        if (query('.esriCTCustomMapLogoPostion')[0]) {
                            domClass.remove(imgCustomLogo, "esriCTCustomMapLogoPostion");
                        }
                    }
                }
                this.removeHighlightedCircleGraphics();
                //if layer informnation contains in graphic
                if (graphic && graphic.layer) {
                    this._queryLayer(graphic.geometry, graphic, directionObject.widgetName);
                    if (locatorInfoWindowObject && locatorInfoWindowObject.selectedGraphic === null) {
                        dojo.infowindowDirection = dojo.infowindowDirection + "," + graphic.geometry.x.toString() + "," + graphic.geometry.y.toString();
                    }
                    //if address is locate then pass startPoint and endPoint to showroute function
                } else {
                    routeObject = { "StartPoint": infoWindowMapPoint.graphics[0], "EndPoint": [directionObject.featureSet], "Index": 0, "WidgetName": directionObject.widgetName, "QueryURL": directionObject.QueryURL };
                    this.showRoute(routeObject);
                }
            });
            setTimeout(lang.hitch(this, function () {
                if (window.location.href.toString().split("$infowindowDirection=").length > 1 && !this.isDirectionCalculated) {
                    this.isDirectionCalculated = true;
                    var mapPoint = new Point(window.location.href.toString().split("$infowindowDirection=")[1].split("$")[0].split(",")[2], window.location.href.toString().split("$infowindowDirection=")[1].split("$")[0].split(",")[3], this.map.spatialReference);
                    dojo.infowindowDirection = window.location.href.toString().split("$infowindowDirection=")[1].split("$")[0]; //mapPoint;
                    locatorInfoWindowObject._locateAddressOnMap(mapPoint, true);
                    routeObject = { "StartPoint": infoWindowMapPoint.graphics[0], "EndPoint": [directionObject.featureSet], "Index": 0, "WidgetName": directionObject.widgetName, "QueryURL": directionObject.QueryURL };
                    this.showRoute(routeObject);
                    if (window.location.href.toString().split("$mapClickPoint=").length > 1) {
                        infoWindowPoint = window.location.href.toString().split("$mapClickPoint=")[1].split("$")[0].split(",");
                        point = new Point(parseFloat(infoWindowPoint[0]), parseFloat(infoWindowPoint[1]), this.map.spatialReference);
                        topic.publish("showInfoWindowOnMap", point);
                    }
                }
            }), 1000);
        },

        /**
        * Information Tab for InfoWindow
        * @param {field} attributes is the field of feature
        * @param {number} InfoIndex is the faeture layer id
        * @param {string} widgetName is name of widget
        * @param {object} featureSet Contain set of features
        * @param {number} index
        * @param {number} featureCount Contain no.of feature
        * @param {string} featureClickName Contain name of feature
        * @param {number} layerId Contain layer id
        * @param {string} layerTitle Contain layer Title
        * @memberOf widgets/SearchSetting/InfoWindowHelper
        */
        _infoWindowInformationTab: function (attributes, infoIndex, widgetName, featureSet, index, featureCount, featureClickName, layerId, layerTitle) {
            var divInfoRow, divInformationContent, queryURLData, serchSetting, divHeader, divAddToListContainer, contentDiv, divFacilityContent, divPaginationPrevNext, divPaginationContainer, facilityDiv,
                divAccessfee, SearchSettingsLayers, activityImageDiv, i, j, key, k, value, isAlreadyAdded, listData, objectIDField;
            //if information tap container is present
            if (dojo.byId("informationTabContainer")) {
                domConstruct.empty(dojo.byId("informationTabContainer"));
            }
            if (featureClickName === "listclick") {
                featureCount = 1;
            }
            divInfoRow = domConstruct.create("div", { "class": "esriCTInfoWindoContainerOuter" }, dojo.byId("informationTabContainer"));
            divInformationContent = domConstruct.create("div", { "class": "esriCTInfoWindoContainer" }, divInfoRow);
            divHeader = domConstruct.create("div", { "class": "esriCTDivHeadercontainerInfo" }, divInformationContent);
            domConstruct.create("div", { "class": "esriCTheadText", "innerHTML": sharedNls.titles.facilityInfo }, divHeader);
            divPaginationContainer = domConstruct.create("div", { "class": "esriCTPaginationContainer" }, divHeader);
            this.divPaginationCount = domConstruct.create("div", { "class": "esriCTTPaginationList", "innerHTML": index + "/" + featureCount }, divPaginationContainer);
            divPaginationPrevNext = domConstruct.create("div", { "class": "esriCTTPaginationPrevNext" }, divPaginationContainer);
            this.previousButton = domConstruct.create("div", { "class": "esriCTTPaginationPrev" }, divPaginationPrevNext);
            this.nextButton = domConstruct.create("div", { "class": "esriCTTPaginationNext" }, divPaginationPrevNext);
            contentDiv = domConstruct.create("div", { "class": "esriCTDivClear" }, divInformationContent);
            divFacilityContent = domConstruct.create("div", { "class": "esriCTUtilityImgContainer" }, divInformationContent);
            if (featureCount === 1) {
                domClass.replace(divPaginationContainer, "esriCTPaginationDisContainer", "esriCTPaginationContainer");
                domClass.replace(this.previousButton, "esriCTTPaginationDisPrev", "esriCTTPaginationPrev");
                domClass.replace(this.nextButton, "esriCTTPaginationDisNext", "esriCTTPaginationNext");
            } else if (index === 1) {
                domClass.replace(this.previousButton, "esriCTTPaginationDisPrev", "esriCTTPaginationPrev");
            } else if (featureCount === index) {
                domClass.replace(this.nextButton, "esriCTTPaginationDisNext", "esriCTTPaginationNext");
            }
            this.own(on(this.previousButton, a11yclick, lang.hitch(this, this.previousButtonClick, featureCount)));
            this.own(on(this.nextButton, a11yclick, lang.hitch(this, this.nextButtonClick, featureCount)));
            queryURLData = this.getQueryUrl(layerId, layerTitle);
            serchSetting = this.getSearchSetting(queryURLData);
            //looping for attributes of feature and if it is null the show N/A
            for (i in attributes) {
                if (attributes.hasOwnProperty(i)) {
                    if (!attributes[i] || attributes[i] === " ") {
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
                        if (key !== serchSetting.ObjectID) {
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
                    facilityDiv = domConstruct.create("div", { "class": "esriCTSecondChild" }, divAccessfee);
                    if (string.substitute(dojo.configData.InfoWindowSettings[infoIndex].InfoWindowData[k].FieldName, attributes).substring(0, 4) === "http") {
                        domConstruct.create("a", { "href": string.substitute(dojo.configData.InfoWindowSettings[infoIndex].InfoWindowData[k].FieldName, attributes), "innerHTML": string.substitute(dojo.configData.InfoWindowSettings[infoIndex].InfoWindowData[k].FieldName, attributes) }, facilityDiv);
                        domClass.add(facilityDiv, "esriCTWordBreak");
                    } else {
                        facilityDiv.innerHTML = string.substitute(dojo.configData.InfoWindowSettings[infoIndex].InfoWindowData[k].FieldName, attributes);
                    }
                }
            }
            // if widgetName is "infoactivity" and ActivitySearchSettings is enable from config
            if (widgetName.toLowerCase() === "infoactivity" && dojo.configData.ActivitySearchSettings[0].Enable) {
                for (j = 0; j < dojo.configData.ActivitySearchSettings.length; j++) {
                    SearchSettingsLayers = dojo.configData.ActivitySearchSettings[j];
                    //looping for ActivityList to show the activity images in infowindow
                    for (i = 0; i < SearchSettingsLayers.ActivityList.length; i++) {
                        if (dojo.string.substitute(SearchSettingsLayers.ActivityList[i].FieldName, attributes)) {
                            if (attributes[dojo.string.substitute(SearchSettingsLayers.ActivityList[i].FieldName, attributes)] === "Yes") {
                                activityImageDiv = domConstruct.create("div", { "class": "esriCTActivityImage" }, divFacilityContent);
                                domConstruct.create("img", { "src": SearchSettingsLayers.ActivityList[i].Image, "title": SearchSettingsLayers.ActivityList[i].Alias }, activityImageDiv);
                            }
                        }
                    }
                }
            }
            divAddToListContainer = domConstruct.create("div", { "class": "esriCTInfoAddlist" }, divInfoRow);
            domConstruct.create("div", { "class": "esriCTInfoAddToListIcon" }, divAddToListContainer);
            domConstruct.create("div", { "class": "esriCTInfoAddToListText", "innerHTML": sharedNls.titles.addToListTitle }, divAddToListContainer);
            this.own(on(divAddToListContainer, a11yclick, lang.hitch(this, function () {
                array.forEach(dojo.configData.EventSearchSettings, lang.hitch(this, function (settings, eventSettingIndex) {
                    //check the layerId and layerTitle object
                    if (settings.QueryLayerId === layerId && settings.Title === layerTitle) {
                        objectIDField = settings.ObjectID;
                    }
                }));
                array.forEach(dojo.configData.ActivitySearchSettings, lang.hitch(this, function (settings, activitySettingIndex) {
                    if (settings.QueryLayerId === layerId && settings.Title === layerTitle) {
                        objectIDField = settings.ObjectID;
                    }
                }));
                isAlreadyAdded = false;
                //check MylistData length
                if (this.myListStoreData.length > 0) {
                    for (listData = 0; listData < this.myListStoreData.length; listData++) {
                        if (this.myListStoreData[listData].value[this.myListStoreData[listData].key] === featureSet[0].attributes[objectIDField]) {
                            alert(sharedNls.errorMessages.activityAlreadyadded);
                            isAlreadyAdded = true;
                            break;
                        }
                    }
                }
                //check if feature is not added in myList
                if (!isAlreadyAdded) {
                    if (query(".esriCTEventsImg")[0]) {
                        topic.publish("toggleWidget", "myList");
                        topic.publish("showActivityPlannerContainer");
                    }
                    topic.publish("addToMyList", featureSet[0], widgetName, layerId, layerTitle);
                }
            })));
        },

        /**
        * Comment Tab for InfoWindow
        * @param {object} commentObject contain attribute, index, featureLayer, widget name
        * @memberOf widgets/SearchSetting/InfoWindowHelper
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
        * Gallery Tab for InfoWindow
        * @param {object} galaryObject contain attribute, index, featureLayer, widget name, attachment
        * @memberOf widgets/SearchSetting/InfoWindowHelper
        */
        _infoWindowGalleryTab: function (galaryObject) {
            var hasLayerAttachments;
            //check the node "this.galleryContainer"
            if (this.galleryContainer) {
                domConstruct.destroy(this.galleryContainer);
            }
            this.galleryContainer = domConstruct.create("div", { "class": "esriCTGalleryInfoContainer" }, dojo.byId("galleryTabContainer"));
            if (galaryObject.attribute) {
                hasLayerAttachments = this._setGallaryForInfoWindow(galaryObject.attribute, galaryObject.widgetName);
            }
            //if attachment is not on the layer
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
            //check widgetName is "infoactivity"
            if (widgetName.toLowerCase() === "infoactivity") {
                searchSettingsData = dojo.configData.ActivitySearchSettings;
                //check widgetName is "infoevent"
            } else if (widgetName.toLowerCase() === "infoevent") {
                searchSettingsData = dojo.configData.EventSearchSettings;
            }
            //check map
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
        * @param {object} response is the information about the attachment
        * @memberOf widgets/SearchSetting/InfoWindowHelper
        */
        _getAttachments: function (response) {
            var divAttchmentInfo, divPreviousImgInfo, divNextImgInfo;
            this.imageCountInfo = 0;
            //check response length which contain the information of attachment
            if (response.length > 1) {
                divPreviousImgInfo = domConstruct.create("div", { "class": "esriCTImgPrev" }, this.galleryContainer);
                divNextImgInfo = domConstruct.create("div", { "class": "esriCTImgNext" }, this.galleryContainer);
                divAttchmentInfo = domConstruct.create("img", { "class": "esriCTDivAttchmentInfo" }, this.galleryContainer);
                domAttr.set(divAttchmentInfo, "src", response[0].url);
                this.own(on(divPreviousImgInfo, a11yclick, lang.hitch(this, this._previousImageInfo, response, divAttchmentInfo)));
                this.own(on(divNextImgInfo, a11yclick, lang.hitch(this, this._nextImageInfo, response, divAttchmentInfo)));
                // check if response(attchment) length is only 1
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
            // if the image count value is -1 then set the image count value is 0
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
            // check if image is found then change the sorce of that image
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
                //loop for the ActivitySearchSettings
                for (i = 0; i < dojo.configData.ActivitySearchSettings.length; i++) {
                    divCommentContainer = query('.esriCTCommentContainer')[0];
                    divContentDiv = domConstruct.create("div", { "class": "esriCTCommentInfoContent" }, divCommentContainer);
                    this.removeNullValue(result);
                    if (result.length > 0) {
                        //loop for result which conatin comments of facility
                        for (l = 0; l < result.length; l++) {
                            commentValue = string.substitute(dojo.configData.ActivitySearchSettings[i].CommentsSettings.CommentField, result[l].attributes);
                            if (commentValue !== sharedNls.showNullValue) {
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
                                domConstruct.create("div", { "class": "esriCTCommentText", "innerHTML": commentValue }, divCommentRow);
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
        * @memberOf widgets/SearchSetting/InfoWindowHelper
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
        * @memberOf widgets/SearchSetting/InfoWindowHelper
        */
        _submitButton: function (selectedFeatureID, result) {
            var commentsLayer, commentGraphic, currenDate, divCommentRowCont, currentDateFormat, attr, self, setAttribute, updatedComments, i, k, l, currentMonth, divCommentRow, outerCommentContainer,
                destroyCommentText, esriCTCommentDateStar, divHeaderStar, divStar, backToMapHide, backText, contentDivAfterNewComment, divContentDiv;
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
                        //verify the windows width
                        if (dojo.window.getBox().w <= 768) {
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
        * @memberOf widgets/SearchSetting/InfoWindowHelper
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
        * @memberOf widgets/SearchSetting/InfoWindowHelper
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
        * @memberOf widgets/SearchSetting/InfoWindowHelper
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
        * @memberOf widgets/SearchSetting/InfoWindowHelper
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
        * Get date from the layer
        * @param {object} date field of layer
        * @memberOf widgets/SearchSetting/InfoWindowHelper
        */
        _getObjectId: function (response) {
            var objectId, j;
            //loop for the json response and store the objectId in esriFieldTypeOID
            for (j = 0; j < response.fields.length; j++) {
                //check whether objectId type feild from layer is equal to "esriFieldTypeOID"
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
            //check if infoWindow width is grether than map width
            if (infoWidth > this.map.width) {
                diff = infoWidth - this.map.width;
            } else {
                diff = 0;
            }
            ratioHeight = height / this.map.height;
            ratioWidth = width / this.map.width;
            totalYPoint = dojo.configData.InfoPopupHeight + 30 + 61;
            xmin = mapPoint.x - (width / 2);
            //validate the width of window
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
