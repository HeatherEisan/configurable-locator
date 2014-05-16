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
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "esri/request",
    "esri/tasks/query",
    "esri/tasks/QueryTask"
], function (declare, domConstruct, domStyle, lang, array, query, domAttr, on, dom, domClass, template, topic, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, esriRequest, Query, QueryTask) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,

        divLegendList: null,
        layerObject: null,
        logoContainer: null,
        _layerCollection: {},
        _featureLayerCollectrion: {},
        _rendererArray: [],
        newLeft: 0,
        divRightArrow: null,
        divLeftArrow: null,
        /**
        * create legends widget
        * @class
        * @name widgets/legends/legends
        */
        postCreate: function () {
            this._createLegendContainerUI();
            this.logoContainer = (query(".map .logo-sm") && query(".map .logo-sm")[0])
                || (query(".map .logo-med") && query(".map .logo-med")[0]);
            topic.subscribe("setMaxLegendLength", lang.hitch(this, function () {
                this._setMaxLegendLengthResult();
            }));

            topic.subscribe("setMinLegendLength", lang.hitch(this, function () {
                this._setMinLegendLengthResult();
            }));

            if (this.isExtentBasedLegend) {
                this.map.on("extent-change", lang.hitch(this, function (evt) {
                    this._UpdatedLegend(this.map.extent);
                }));
            }
        },

        /**
        * update legend data
        * @memberOf widgets/legends/legends
        */
        _UpdatedLegend: function (geometry) {
            var defQueryArray, layerObject, rendererObject, index, queryResult, queryDefList, i, resultListArray, legendListWidth, layer;
            defQueryArray = [];
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
                            queryResult = this._fireQueryOnExtentChange(geometry);

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

            resultListArray = [];
            legendListWidth = [];
            if (defQueryArray.length > 0) {
                domConstruct.empty(this.divlegendContainer);
                domConstruct.create("span", { innerHTML: "Loading...", marginTop: "5px" }, this.divlegendContainer);
                queryDefList = new dojo.DeferredList(defQueryArray);
                queryDefList.then(lang.hitch(this, function (result) {
                    domConstruct.empty(this.divlegendContainer);
                    for (i = 0; i < result.length; i++) {
                        if (result[i][0] && result[i][1] > 0) {
                            resultListArray.push(result[i][1]);

                            this._addLegendSymbol(this._rendererArray[i], this._layerCollection[this._rendererArray[i].layerUrl].layerName);
                            legendListWidth.push(this.divLegendlist.offsetWidth);
                        }
                    }
                    this._addlegendListWidth(legendListWidth);
                }));
            }
        },

        /**
        * set legendconatiner width to maximum
        * @memberOf widgets/legends/legends
        */
        _setMaxLegendLengthResult: function () {
            domClass.remove(this.logoContainer, "esriCTMapLogoPositionChange");
            domClass.add(this.logoContainer, "esriCTMapLogoURL");
            domClass.add(this.esriCTDivLegendContainer, "esriCTLegendPositionChange");
            if (this.esriCTLegendRightBox) {
                domClass.add(this.esriCTLegendRightBox, "esriCTLegendRightBoxShift");
            }
            if (this.divRightArrow) {
                domClass.add(this.divRightArrow, "esriCTRightArrowShift");
            }
        },

        /**
        * set legendconatiner width to minimum
        * @memberOf widgets/legends/legends
        */
        _setMinLegendLengthResult: function () {
            domClass.remove(this.logoContainer, "esriCTMapLogoURL");
            domClass.remove(this.esriCTDivLegendContainer, "esriCTLegendPositionChange");
            domClass.add(this.logoContainer, "esriCTMapLogoPositionChange");
            if (this.esriCTLegendRightBox) {
                domClass.replace(this.esriCTLegendRightBox, "esriCTLegendRightBox", "esriCTLegendRightBoxShift");
            }
            if (this.divRightArrow) {
                domClass.replace(this.divRightArrow, "esriCTRightArrow", "esriCTRightArrowShift");
            }
        },

        /**
        * reset legend container
        * @memberOf widgets/legends/legends
        */
        _resetLegendContainer: function () {
            this.newLeft = 0;
            domStyle.set(this.divlegendContainer, "left", (this.newLeft) + "px");
            this._resetSlideControls();
        },

        /**
        * create legend container UI
        * @memberOf widgets/legends/legends
        */
        _createLegendContainerUI: function () {
            var divlegendContainer;
            this.esriCTLegendContainer = domConstruct.create("div", {}, dom.byId("esriCTParentDivContainer"));
            this.esriCTLegendContainer.appendChild(this.esriCTDivLegendContainer);
            divlegendContainer = domConstruct.create("div", { "class": "esriCTdivlegendlist" }, this.divlegendList);
            this.divlegendContainer = domConstruct.create("div", { "class": "divlegendContent" }, divlegendContainer);
            this.divLeftArrow = domConstruct.create("div", { "class": "esriCTLeftArrow" }, this.legendbox);
            domStyle.set(this.divLeftArrow, "display", "none");
            on(this.divLeftArrow, "click", lang.hitch(this, function () {
                this._slideLeft();
            }));
            this.divRightArrow = domConstruct.create("div", { "class": "esriCTRightArrow" }, this.legendbox);
            on(this.divRightArrow, "click", lang.hitch(this, function () {
                this._slideRight();
            }));
        },

        /**
        * slide legend content right
        * @memberOf widgets/legends/legends
        */
        _slideRight: function () {
            this.newLeft = this.newLeft - (200 + 9);
            domStyle.set(this.divlegendContainer, "left", (this.newLeft) + "px");
            this._resetSlideControls();
        },

        /**
        * slide legend content left
        * @memberOf widgets/legends/legends
        */
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
                domStyle.set(this.divlegendContainer, "left", (this.newLeft) + "px");
                this._resetSlideControls();
            }
        },

        /**
        * reset slide controls
        * @memberOf widgets/legends/legends
        */
        _resetSlideControls: function () {
            if (this.newLeft > query(".esriCTdivlegendlist")[0].offsetWidth - this.divlegendContainer.offsetWidth) {
                domStyle.set(this.divRightArrow, "display", "block");
                domStyle.set(this.divRightArrow, "cursor", "pointer");
            } else {
                domStyle.set(this.divRightArrow, "display", "none");
                domStyle.set(this.divRightArrow, "cursor", "default");
            }
            if (this.newLeft === 0) {
                domStyle.set(this.divLeftArrow, "display", "none");
                domStyle.set(this.divLeftArrow, "cursor", "default");
            } else {
                domStyle.set(this.divLeftArrow, "display", "block");
                domStyle.set(this.divLeftArrow, "cursor", "pointer");
            }
        },

        /*
        * fires query for the renderer present in the current extent
        * @memberOf widgets/legends/legends
        */
        _fireQueryOnExtentChange: function (currentExtent) {
            var queryParams;
            queryParams = new Query();
            queryParams.outFields = ["*"];
            queryParams.geometry = currentExtent;
            queryParams.spatialRelationship = "esriSpatialRelContains";
            queryParams.returnGeometry = false;
            return queryParams;
        },

        /*
        * performs query task for the no of features present in the current extent
        * @memberOf widgets/legends/legends
        */
        _executeQueryTask: function (layer, defQueryArray, queryParams) {
            var queryTask, queryDeferred;
            queryTask = new QueryTask(layer);
            defQueryArray.push(queryTask.executeForCount(queryParams, function (count) {
                queryDeferred = new dojo.Deferred();
                queryDeferred.resolve(count);
                return queryDeferred.promise;
            }, function (error) {
                console.log(error);
            }));
        },

        /*
        * get layer response
        * @memberOf widgets/legends/legends
        */
        _resolveUsingResponse: function (response) {
            var deferred;
            deferred = new dojo.Deferred();
            deferred.resolve(response);
            return deferred.promise;
        },

        /*
        * log error in console
        * @memberOf widgets/legends/legends
        */
        _logError: function (error) {
            console.log("Error: ", error.message);
        },

        /*
        * initiates the creation of legend
        * @memberOf widgets/legends/legends
        */
        startup: function (layerArray) {
            var index, mapServerURL, defArray, i, params, layersRequest, deferredList;
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
                this.mapServerArray = this._removeDuplicate(this.mapServerArray);
                defArray = [];

                for (i = 0; i < this.mapServerArray.length; i++) {
                    params = {
                        url: this.mapServerArray[i] + "/legend",
                        content: { f: "json" },
                        handleAs: "json",
                        callbackParamName: "callback"
                    };
                    layersRequest = esriRequest(params);
                    defArray.push(layersRequest.then(this._resolveUsingResponse, this._logError));
                }
                deferredList = new dojo.DeferredList(defArray);
                deferredList.then(lang.hitch(this, this._addLegendsList));
            }
        },

        /*
        * create legend list
        * @memberOf widgets/legends/legends
        */
        _addLegendsList: function (result) {
            var i;
            domConstruct.empty(this.divlegendContainer);
            for (i = 0; i < result.length; i++) {
                this._createLegendList(result[i][1], this.mapServerArray[i]);
            }
        },

        /*
        * add legend field values in layer collections
        * @memberOf widgets/legends/legends
        */
        _addFieldValue: function () {
            var layer, params, layersRequest, deferredList, layerObject, i, defArray = [], layerTempArray = [];

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
                        defArray.push(layersRequest.then(this._resolveUsingResponse, this._logError));
                    }
                }
            }
            deferredList = new dojo.DeferredList(defArray);
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

        /*
        * remove redundent data
        * @memberOf widgets/legends/legends
        */
        _removeDuplicate: function (mapServerArray) {
            var filterArray;
            filterArray = [];

            array.filter(mapServerArray, function (item) {
                if (array.indexOf(filterArray, item) === -1) {
                    filterArray.push(item);
                }
            });
            return filterArray;
        },

        /*
        * create legend list UI
        * @memberOf widgets/legends/legends
        */
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

        /*
        * set legend container width
        * @memberOf widgets/legends/legends
        */
        _addlegendListWidth: function (legendListWidth) {
            var listWidth, total, j;
            listWidth = legendListWidth;
            total = 0;
            for (j = 0; j < listWidth.length; j++) {
                total += listWidth[j];
            }
            if (total === 0) {
                total = "auto";
            } else {
                total += 10;
                total += "px";
            }
            domStyle.set(this.divlegendContainer, "width", total);
            this._resetSlideControls();
        },

        /*
        * create legend symbol
        * @memberOf widgets/legends/legends
        */
        _addLegendSymbol: function (legend, layerName) {
            var divLegendImage, image, divLegendLabel;

            if (legend) {
                this.divLegendlist = domConstruct.create("div", { "class": "esriCTLegendListContent" }, this.divlegendContainer);
                divLegendImage = domConstruct.create("div", { "class": "esriCTLegend" }, null);
                image = this._createImage("data:image/gif;base64," + legend.imageData, "", false, legend.width, legend.height);
                domConstruct.place(image, divLegendImage);
                this.divLegendlist.appendChild(divLegendImage);

                if (legend.label) {
                    divLegendLabel = dojo.create("div", { "class": "esriCTLegendLabel", "innerHTML": legend.label }, null);

                } else {
                    divLegendLabel = dojo.create("div", { "class": "esriCTLegendLabel", "innerHTML": layerName }, null);
                }
                this.divLegendlist.appendChild(divLegendLabel);
            }
        },

        /*
        * displays the picture marker symbol
        * @memberOf widgets/legends/legends
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

