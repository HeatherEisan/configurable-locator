/*global define,dojo,console */
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
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/query",
    "dojo/dom-attr",
    "dojo/on",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/text!./templates/legendsTemplate.html",
    "dojo/topic",
    "dojo/Deferred",
    "dojo/DeferredList",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "esri/request",
    "esri/tasks/query",
    "esri/geometry/Extent",
    "dojo/dom-geometry",
    "esri/tasks/QueryTask"
], function (declare, domConstruct, domStyle, lang, array, query, domAttr, on, dom, domClass, template, topic, Deferred, DeferredList, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, esriRequest, Query, GeometryExtent, domGeom, QueryTask) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,
        divLegendList: null,
        layerObject: null,
        logoContainer: null,
        _layerCollection: {},
        _rendererArray: [],
        newLeft: 0,
        total: 0,
        /**
        * create legends widget
        * @class
        * @name widgets/legends/legends
        */
        postCreate: function () {
            this._createLegendContainerUI();
            var currentExtentLegend, legendDefaultExtent, legendListWidth = [];
            this.logoContainer = (query(".map .logo-sm") && query(".map .logo-sm")[0])
                || (query(".map .logo-med") && query(".map .logo-med")[0]);
            topic.subscribe("setLegendPositionUp", lang.hitch(this, function () {
                this._setLegendPositionUp();
            }));

            topic.subscribe("setLegendPositionDown", lang.hitch(this, function () {
                this._setLegendPositionDown();
            }));

            if (window.location.toString().split("?extent=").length > 1) {
                this.shareLegendExtent = true;
                currentExtentLegend = this._getQueryString('extent');
                legendDefaultExtent = currentExtentLegend.split(',');
                legendDefaultExtent = new GeometryExtent({ "xmin": parseFloat(legendDefaultExtent[0]), "ymin": parseFloat(legendDefaultExtent[1]), "xmax": parseFloat(legendDefaultExtent[2]), "ymax": parseFloat(legendDefaultExtent[3]), "spatialReference": { "wkid": this.map.spatialReference.wkid} });
            }
            if (this.isExtentBasedLegend) {
                this.map.on("extent-change", lang.hitch(this, function (evt) {
                    var defQueryArray = [], queryResult, layerObject, rendererObject, index, resultListArray = [],
                        queryDefList, arryList = 0, boxWidth, i, layer;
                    this._resetLegendContainer();
                    this._rendererArray.length = 0;
                    for (layer in this._layerCollection) {
                        if (this._layerCollection.hasOwnProperty(layer)) {
                            layerObject = this._layerCollection[layer];
                            rendererObject = this._layerCollection[layer].legend;
                            if (rendererObject.length) {
                                for (index = 0; index < rendererObject.length; index++) {
                                    rendererObject[index].layerUrl = layer;
                                    this._rendererArray.push(rendererObject[index]);
                                    if (this.shareLegendExtent) {
                                        queryResult = this._fireQueryOnExtentChange(legendDefaultExtent);
                                    } else {
                                        queryResult = this._fireQueryOnExtentChange(evt.extent);
                                    }
                                    if (layerObject.rendererType === "uniqueValue") {
                                        if (rendererObject[index].values) {
                                            queryResult.where = layerObject.fieldName + " = " + "'" + rendererObject[index].values[0] + "'";
                                        } else {
                                            queryResult.where = "1=1";
                                        }
                                    } else if (layerObject.rendererType === "classBreaks") {
                                        queryResult.where = rendererObject[index - 1] ? layerObject.fieldName + ">" + rendererObject[index - 1].values[0] + " AND " + layerObject.fieldName + "<=" + rendererObject[index].values[0] : layerObject.fieldName + "=" + rendererObject[index].values[0];
                                    } else {
                                        queryResult.where = "1=1";
                                    }
                                    this._executeQueryTask(layer, defQueryArray, queryResult);
                                }
                            }
                        }
                    }
                    legendListWidth = [];
                    if (defQueryArray.length > 0) {
                        domConstruct.empty(this.divlegendContainer);
                        domConstruct.create("span", { innerHTML: sharedNls.titles.loadingText, "class": "esriCTLegendText" }, this.divlegendContainer);
                        queryDefList = new DeferredList(defQueryArray);
                        queryDefList.then(lang.hitch(this, function (result) {
                            domConstruct.empty(this.divlegendContainer);
                            for (i = 0; i < result.length; i++) {
                                if (result[i][0] && result[i][1] > 0) {
                                    resultListArray.push(result[i][1]);
                                    this._addLegendSymbol(this._rendererArray[i], this._layerCollection[this._rendererArray[i].layerUrl].layerName);
                                    legendListWidth.push(this.divLegendlist.offsetWidth);
                                }
                            }

                            for (i = 0; i < resultListArray.length; i++) {
                                arryList += resultListArray[i];
                            }
                            this._addlegendListWidth(this.legendListWidth);
                            boxWidth = this.legendbox.offsetWidth + 200;
                            if (query(".esriCTHeaderRouteContainer")[0]) {
                                boxWidth -= query(".esriCTHeaderRouteContainer")[0].offsetWidth;
                            }
                            if (arryList <= 0 || this.divlegendContainer.offsetWidth < boxWidth) {
                                domStyle.set(this.divRightArrow, "display", "none");
                            } else {
                                domStyle.set(this.divRightArrow, "display", "block");
                            }

                            if (resultListArray.length === 0) {
                                domConstruct.create("span", { innerHTML: sharedNls.titles.noLegendAvailable, "class": "esriCTLegendText" }, this.divlegendContainer);
                            }
                        }));
                    }
                }));
            }
        },

        _getQueryString: function (key) {
            var extentValue = "", regex, qs;
            regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
            qs = regex.exec(window.location.href);
            if (qs && qs.length > 0) {
                extentValue = qs[1];
            }
            return extentValue;
        },

        _setLegendPositionUp: function () {
            domClass.remove(this.esriCTdivLegendbox, "esriCTLegendChangePositionDown");
            domClass.remove(this.logoContainer, "esriCTMapLogoPositionChange");
            domClass.add(this.logoContainer, "esriCTMapLogoURL");
            domClass.add(this.divlegendContainer, "esriCTLegendPositionChange");
            domClass.add(this.esriCTdivLegendbox, "esriCTLegendChangePositionUp");
        },

        _setLegendPositionDown: function () {
            domClass.remove(this.logoContainer, "esriCTMapLogoURL");
            domClass.remove(this.divlegendContainer, "esriCTLegendPositionChange");
            domClass.add(this.logoContainer, "esriCTMapLogoPositionChange");
            domClass.remove(this.esriCTdivLegendbox, "esriCTLegendChangePositionUp");
            domClass.add(this.esriCTdivLegendbox, "esriCTLegendChangePositionDown");
        },

        _resetLegendContainer: function () {
            this.newLeft = 0;
            domStyle.set(query(".divlegendContent")[0], "left", (this.newLeft) + "px");
            this._resetSlideControls();
        },

        _createLegendContainerUI: function () {
            var divlegendContainer, divLeftArrow;
            this.esriCTLegendContainer = domConstruct.create("div", {}, dom.byId("esriCTParentDivContainer"));
            this.esriCTLegendContainer.appendChild(this.esriCTdivLegendbox);
            divlegendContainer = domConstruct.create("div", { "class": "divlegendContainer" }, this.divlegendList);
            this.divlegendContainer = domConstruct.create("div", { "class": "divlegendContent" }, divlegendContainer);
            divLeftArrow = domConstruct.create("div", { "class": "esriCTLeftArrow" }, this.legendbox);
            domStyle.set(divLeftArrow, "display", "none");
            on(divLeftArrow, "click", lang.hitch(this, function () {
                this._slideLeft();
            }));
            this.divRightArrow = domConstruct.create("div", { "class": "esriCTRightArrow" }, this.legendbox);
            domStyle.set(this.divRightArrow, "display", "block");
            on(this.divRightArrow, "click", lang.hitch(this, function () {
                this._slideRight();
            }));
        },

        _slideRight: function () {
            var difference = query(".divlegendContainer")[0].offsetWidth - query(".divlegendContent")[0].offsetWidth;
            if (this.newLeft > difference) {
                domStyle.set(query(".esriCTLeftArrow")[0], "display", "block");
                domStyle.set(query(".esriCTLeftArrow")[0], "cursor", "pointer");
                this.newLeft = this.newLeft - (200 + 9);
                domStyle.set(query(".divlegendContent")[0], "left", (this.newLeft) + "px");
                this._resetSlideControls();
            }
        },

        _slideLeft: function () {
            if (this.newLeft < 0) {
                if (this.newLeft > -(200 + 9)) {
                    this.newLeft = 0;
                } else {
                    this.newLeft = this.newLeft + (200 + 9);
                }
                if (this.newLeft >= -10) {
                    this.newLeft = 0;
                }
                domStyle.set(query(".divlegendContent")[0], "left", (this.newLeft) + "px");
                this._resetSlideControls();
            }
        },

        _resetSlideControls: function () {
            if (this.newLeft > query(".divlegendContainer")[0].offsetWidth - query(".divlegendContent")[0].offsetWidth) {
                domStyle.set(query(".esriCTRightArrow")[0], "display", "block");
                domStyle.set(query(".esriCTRightArrow")[0], "cursor", "pointer");
            } else {
                domStyle.set(query(".esriCTRightArrow")[0], "display", "none");
                domStyle.set(query(".esriCTRightArrow")[0], "cursor", "default");
            }
            if (this.newLeft === 0) {
                domStyle.set(query(".esriCTLeftArrow")[0], "display", "none");
                domStyle.set(query(".esriCTLeftArrow")[0], "cursor", "default");
            } else {
                domStyle.set(query(".esriCTLeftArrow")[0], "display", "block");
                domStyle.set(query(".esriCTLeftArrow")[0], "cursor", "pointer");
            }
        },

        /*
        * fires query for the renderer present in the current extent
        */
        _fireQueryOnExtentChange: function (currentExtent) {
            var queryParams = new Query();
            queryParams.outFields = ["*"];
            queryParams.geometry = currentExtent;
            queryParams.spatialRelationship = "esriSpatialRelContains";
            queryParams.returnGeometry = false;
            return queryParams;
        },

        /*
        * performs query task for the no of features present in the current extent
        */
        _executeQueryTask: function (layer, defQueryArray, queryParams) {
            var queryTask = new QueryTask(layer);
            defQueryArray.push(queryTask.executeForCount(queryParams, function (count) {
                var queryDeferred = new Deferred();
                queryDeferred.resolve(count);
                return queryDeferred.promise;
            }, function (error) {
                console.log(error);
            }));
        },

        /*
        * initiates the creation of legend
        */
        startup: function (layerArray) {
            var mapServerURL, index, defArray = [], params, layersRequest, deferredList;
            this.mapServerArray = [];
            this.featureServerArray = [];
            for (index = 0; index < layerArray.length; index++) {
                if (layerArray[index].indexOf("/FeatureServer") !== -1) {
                    layerArray[index] = layerArray[index].replace("/FeatureServer", "/MapServer");
                }
                mapServerURL = layerArray[index].split("/");
                mapServerURL.pop();
                mapServerURL = mapServerURL.join("/");
                this.mapServerArray.push(mapServerURL);
            }

            this.mapServerArray = this._removeDuplicate(this.mapServerArray);

            for (index = 0; index < this.mapServerArray.length; index++) {

                params = {
                    url: this.mapServerArray[index] + "/legend",
                    content: { f: "json" },
                    handleAs: "json",
                    callbackParamName: "callback"
                };
                layersRequest = esriRequest(params);
                defArray.push(layersRequest.then(this._getLayerDetail, this._displayError));
            }
            deferredList = new DeferredList(defArray);
            deferredList.then(lang.hitch(this, function (result) {
                domConstruct.empty(this.divlegendContainer);
                for (index = 0; index < result.length; index++) {
                    this._createLegendList(result[index][1], this.mapServerArray[index]);
                }
            }));
        },

        _getLayerDetail: function (response) {
            var deferred = new Deferred();
            deferred.resolve(response);
            return deferred.promise;
        },

        _displayError: function (error) {
            console.log("Error: ", error.message);
        },

        _addFieldValue: function () {
            var defArray = [], layerTempArray = [], params, layersRequest, deferredList, layerObject, i, layer;
            for (layer in this._layerCollection) {
                if (this._layerCollection.hasOwnProperty(layer)) {
                    if (this._layerCollection[layer].legend && this._layerCollection[layer].legend.length > 1) {
                        layerTempArray.push(layer);
                        params = {
                            url: layer,
                            content: { f: "json" },
                            handleAs: "json",
                            callbackParamName: "callback"
                        };
                        layersRequest = esriRequest(params);
                        defArray.push(layersRequest.then(this._getLayerDetail, this._displayError));
                    }
                }
            }
            deferredList = new DeferredList(defArray);
            deferredList.then(lang.hitch(this, function (result) {
                for (i = 0; i < result.length; i++) {
                    if (result[i][0]) {
                        layerObject = result[i][1];
                        if (layerObject.drawingInfo && layerObject.drawingInfo.renderer && layerObject.drawingInfo.renderer.type === "uniqueValue") {
                            this._layerCollection[layerTempArray[i]].rendererType = "uniqueValue";
                            this._layerCollection[layerTempArray[i]].fieldName = layerObject.drawingInfo.renderer.field1 || layerObject.drawingInfo.renderer.field2 || layerObject.drawingInfo.renderer.field3;

                        } else if (layerObject.drawingInfo && layerObject.drawingInfo.renderer && layerObject.drawingInfo.renderer.type === "classBreaks") {
                            this._layerCollection[layerTempArray[i]].rendererType = "classBreaks";
                            this._layerCollection[layerTempArray[i]].fieldName = layerObject.drawingInfo.renderer.field;
                        }
                    }
                }
            }));
        },

        _removeDuplicate: function (mapServerArray) {
            var filterArray = [];
            array.filter(mapServerArray, function (item) {
                if (array.indexOf(filterArray, item) === -1) {
                    filterArray.push(item);
                }
            });
            return filterArray;
        },

        _createLegendList: function (layerList, mapServerUrl) {
            var i, j;
            this.legendListWidth = [];
            for (i = 0; i < layerList.layers.length; i++) {
                this._layerCollection[mapServerUrl + '/' + layerList.layers[i].layerId] = layerList.layers[i];
                for (j = 0; j < layerList.layers[i].legend.length; j++) {
                    this._addLegendSymbol(layerList.layers[i].legend[j], layerList.layers[i].layerName);
                    this.legendListWidth.push(this.divLegendlist.offsetWidth);
                }
            }
            this._addlegendListWidth(this.legendListWidth);
            this._addFieldValue();
        },

        _addlegendListWidth: function (legendListWidth) {
            var listWidth = legendListWidth, total = 0, j;
            for (j = 0; j < listWidth.length - 1; j++) {
                total += listWidth[j];
            }
            domStyle.set(query(".divlegendContent")[0], "width", total + 100 + "px");
        },

        _addLegendSymbol: function (legend, layerName) {
            var divLegendImage, image, divLegendLabel;
            if (legend) {
                this.divLegendlist = domConstruct.create("div", { "class": "divLegendlist" }, this.divlegendContainer);
                divLegendImage = domConstruct.create("div", { "class": "legend" }, null);
                image = this._createImage("data:image/gif;base64," + legend.imageData, "", false, legend.width, legend.height);
                domConstruct.place(image, divLegendImage);
                this.divLegendlist.appendChild(divLegendImage);
                if (legend.label) {
                    divLegendLabel = domConstruct.create("div", { "class": "legendlbl", "innerHTML": legend.label }, null);
                } else {
                    divLegendLabel = domConstruct.create("div", { "class": "legendlbl", "innerHTML": layerName }, null);
                }
                this.divLegendlist.appendChild(divLegendLabel);
            }
        },

        /*
        * displays the picture marker symbol
        */
        _createImage: function (imageSrc, title, isCursorPointer, imageWidth, imageHeight) {
            var imgLocate, imageHeightWidth;
            imgLocate = domConstruct.create("img");
            imageHeightWidth = { width: imageWidth + 'px', height: imageHeight + 'px' };
            domAttr.set(imgLocate, "style", imageHeightWidth);
            if (isCursorPointer) {
                domStyle.set(imgLocate, "cursor", "pointer");
            }
            domAttr.set(imgLocate, "src", imageSrc);
            domAttr.set(imgLocate, "title", title);
            return imgLocate;
        }
    });
});
