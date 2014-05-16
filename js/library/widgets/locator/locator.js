/*global define,dojo,dojoConfig:true,alert,esri */
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
    "../scrollBar/scrollBar",
    "dojo/Deferred",
    "dojo/DeferredList",
    "esri/tasks/QueryTask",
    "esri/geometry",
    "esri/tasks/BufferParameters",
    "esri/graphic",
    "dojo/_base/Color",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/PictureMarkerSymbol",
    "esri/layers/GraphicsLayer",
    "esri/tasks/GeometryService",
    "esri/geometry/Point",
    "dojo/text!./templates/locatorTemplate.html",
    "widgets/searchResult/searchResult",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/topic",
    "esri/tasks/RouteParameters",
    "esri/tasks/RouteTask",
    "esri/tasks/FeatureSet",
    "esri/SpatialReference",
    "esri/urlUtils",
    "esri/units"
], function (declare, domConstruct, domStyle, domAttr, lang, on, domGeom, dom, array, domClass, query, string, Locator, Query, ScrollBar, Deferred, DeferredList, QueryTask, Geometry, BufferParameters, Graphic, Color, SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, PictureMarkerSymbol, GraphicsLayer, GeometryService, Point, template, SearchResult, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic, RouteParameters, RouteTask, FeatureSet, SpatialReference, urlUtils, units) {
    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,

        lastSearchString: null,
        stagedSearch: null,
        locatorScrollbar: null,
        screenPoint: null,

        /**
        * display locator widget
        *
        * @class
        * @name widgets/locator/locator
        */
        postCreate: function () {
            /**
            * close locator widget if any other widget is opened
            * @param {string} widget Key of the newly opened widget
            */
            var searchResult = new SearchResult({ map: this.map });
            searchResult.startup();
            topic.subscribe("toggleWidget", lang.hitch(this, function (widget) {
                if (widget !== "locator") {
                    if (domGeom.getMarginBox(this.divAddressHolder).h > 0) {
                        domClass.replace(this.domNode, "esriCTHeaderSearch", "esriCTHeaderSearchSelected");
                        domClass.replace(this.divAddressHolder, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                        domClass.replace(this.divAddressHolder, "esriCTZeroHeight", "esriCTAddressContentHeight");
                        this.txtAddress.blur();
                    }
                }
            }));

            topic.subscribe("doBufferHandler", lang.hitch(this, function (feature) {
                this._doBuffer(feature.graphic);
            }));
            topic.subscribe("createInfoWindowContent", lang.hitch(this, function (mapPoint, attributes, fields, infoIndex, featureArray, count, zoomToFeature) {
                this._createInfoWindowContent(mapPoint, attributes, fields, infoIndex, featureArray, count, zoomToFeature);
            }));
            topic.subscribe("setlocateAddressOnMap", lang.hitch(this, function (mapPoint) {
                this._locateAddressOnMap(mapPoint);
            }));
            topic.subscribe("executeQueryForFeatures", lang.hitch(this, function (featureset, geometry, mapPoint) {
                this._executeQueryForFeatures(featureset, geometry, mapPoint);
            }));
            topic.subscribe("setMapTipPosition", this._onSetMapTipPosition);
            this.domNode = domConstruct.create("div", { "title": sharedNls.tooltips.search, "class": "esriCTHeaderSearch" }, null);
            domConstruct.place(this.divAddressContainer, dom.byId("esriCTParentDivContainer"));
            this.own(on(this.domNode, "click", lang.hitch(this, function () {
                domStyle.set(this.imgSearchLoader, "display", "none");
                domStyle.set(this.close, "display", "block");

                /**
                * minimize other open header panel widgets and show locator widget
                */
                topic.publish("toggleWidget", "locator");
                this._showLocateContainer();
            })));
            domStyle.set(this.divAddressContainer, "display", "block");
            domAttr.set(this.divAddressContainer, "title", "");
            domAttr.set(this.imgSearchLoader, "src", dojoConfig.baseURL + "/js/library/themes/images/loader.gif");
            this._setDefaultTextboxValue();
            this._attachLocatorEvents();
            this.own(on(this.ActivityPanel, "click", lang.hitch(this, function () {
                this._showActivityTab();
            })));

            this.own(on(this.SearchPanel, "click", lang.hitch(this, function () {
                this._showSearchTab();
            })));

            urlUtils.addProxyRule({
                urlPrefix: dojo.configData.RouteServiceURL,
                proxyUrl: dojoConfig.baseURL + dojo.configData.ProxyUrl
            });

        },

        _onSetMapTipPosition: function (selectedPoint, map, infoWindow) {
            if (selectedPoint) {
                var screenPoint = map.toScreen(selectedPoint);
                screenPoint.y = map.height - screenPoint.y;
                infoWindow.setLocation(screenPoint);
            }
        },

        /**
        * set default value of locator textbox as specified in configuration file
        * @param {array} dojo.configData.LocatorSettings.Locators Locator settings specified in configuration file
        * @memberOf widgets/locator/locator
        */
        _setDefaultTextboxValue: function () {
            var locatorSettings;
            locatorSettings = dojo.configData.LocatorSettings;

            /**
            * txtAddress Textbox for search text
            * @member {textbox} txtAddress
            * @private
            * @memberOf widgets/locator/locator
            */
            domAttr.set(this.txtAddress, "defaultAddress", locatorSettings.LocatorDefaultAddress);
        },

        /**
        * attach locator events
        * @memberOf widgets/locator/locator
        */
        _attachLocatorEvents: function () {
            this.own(on(this.divSearch, "click", lang.hitch(this, function (evt) {
                domStyle.set(this.imgSearchLoader, "display", "block");
                domStyle.set(this.close, "display", "none");

                this._locateAddress(evt);
            })));
            this.own(on(this.txtAddress, "keyup", lang.hitch(this, function (evt) {
                domStyle.set(this.close, "display", "block");

                this._submitAddress(evt);
            })));
            this.own(on(this.txtAddress, "dblclick", lang.hitch(this, function (evt) {
                this._clearDefaultText(evt);
            })));
            this.own(on(this.txtAddress, "blur", lang.hitch(this, function (evt) {
                this._replaceDefaultText(evt);
            })));
            this.own(on(this.txtAddress, "focus", lang.hitch(this, function () {
                domStyle.set(this.close, "display", "block");
                domClass.add(this.txtAddress, "esriCTColorChange");
            })));
            this.own(on(this.close, "click", lang.hitch(this, function () {
                this._hideText();
            })));
        },

        _hideText: function () {
            this.txtAddress.value = "";
            domConstruct.empty(this.divAddressResults, this.divAddressScrollContent);
            domAttr.set(this.txtAddress, "defaultAddress", this.txtAddress.value);
            domClass.remove(this.divAddressContent, "esriCTAddressContainerHeight");
            domClass.remove(this.divAddressContent, "esriCTAddressResultHeight");
            if (this.locatorScrollbar) {
                domClass.add(this.locatorScrollbar._scrollBarContent, "esriCTZeroHeight");
                this.locatorScrollbar.removeScrollBar();
            }
        },

        /**
        * show/hide locator widget and set default search text
        * @memberOf widgets/locator/locator
        */
        _showLocateContainer: function () {
            this.txtAddress.blur();
            if (domGeom.getMarginBox(this.divAddressHolder).h > 0) {

                /**
                * when user clicks on locator icon in header panel, close the search panel if it is open
                */
                domClass.replace(this.domNode, "esriCTHeaderSearch", "esriCTHeaderSearchSelected");
                domClass.replace(this.divAddressHolder, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                domClass.replace(this.divAddressHolder, "esriCTZeroHeight", "esriCTAddressContentHeight");
                this.txtAddress.blur();
            } else {

                /**
                * when user clicks on locator icon in header panel, open the search panel if it is closed
                */
                domClass.replace(this.domNode, "esriCTHeaderSearchSelected", "esriCTHeaderSearch");
                domClass.replace(this.txtAddress, "esriCTBlurColorChange", "esriCTColorChange");
                domClass.replace(this.divAddressHolder, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
                domClass.add(this.divAddressHolder, "esriCTAddressContentHeight");
                domStyle.set(this.txtAddress, "verticalAlign", "middle");
                this.txtAddress.value = domAttr.get(this.txtAddress, "defaultAddress");
                this.lastSearchString = lang.trim(this.txtAddress.value);
            }
            this._setHeightAddressResults();
        },

        /**
        * search address on every key press
        * @param {object} evt Keyup event
        * @memberOf widgets/locator/locator
        */
        _submitAddress: function (evt) {
            if (evt) {
                if (evt.keyCode === dojo.keys.ENTER) {
                    if (this.txtAddress.value !== '') {
                        domStyle.set(this.imgSearchLoader, "display", "block");
                        domStyle.set(this.close, "display", "none");
                        this._locateAddress(evt);
                        return;
                    }
                }

                /**
                * do not perform auto complete search if alphabets,
                * numbers,numpad keys,comma,ctl+v,ctrl +x,delete or
                * backspace is pressed
                */
                if ((!((evt.keyCode >= 46 && evt.keyCode < 58) || (evt.keyCode > 64 && evt.keyCode < 91) || (evt.keyCode > 95 && evt.keyCode < 106) || evt.keyCode === 8 || evt.keyCode === 110 || evt.keyCode === 188)) || (evt.keyCode === 86 && evt.ctrlKey) || (evt.keyCode === 88 && evt.ctrlKey)) {
                    evt.cancelBubble = true;
                    if (evt.stopPropagation) {
                        evt.stopPropagation();
                    }
                    domStyle.set(this.imgSearchLoader, "display", "none");
                    domStyle.set(this.close, "display", "block");
                    return;
                }

                /**
                * call locator service if search text is not empty
                */
                domStyle.set(this.imgSearchLoader, "display", "block");
                domStyle.set(this.close, "display", "none");
                if (domGeom.getMarginBox(this.divAddressContent).h > 0) {
                    if (lang.trim(this.txtAddress.value) !== '') {
                        if (this.lastSearchString !== lang.trim(this.txtAddress.value)) {
                            this.lastSearchString = lang.trim(this.txtAddress.value);
                            domConstruct.empty(this.divAddressResults);

                            /**
                            * clear any staged search
                            */
                            clearTimeout(this.stagedSearch);
                            if (lang.trim(this.txtAddress.value).length > 0) {

                                /**
                                * stage a new search, which will launch if no new searches show up
                                * before the timeout
                                */
                                this.stagedSearch = setTimeout(lang.hitch(this, function () {
                                    this.stagedSearch = this._locateAddress();
                                }), 500);
                            }
                        }
                    } else {
                        this.lastSearchString = lang.trim(this.txtAddress.value);
                        domStyle.set(this.imgSearchLoader, "display", "none");
                        domStyle.set(this.close, "display", "block");
                        domConstruct.empty(this.divAddressResults);
                    }
                }
            }
        },

        /**
        * perform search by addess if search type is address search
        * @memberOf widgets/locator/locator
        */
        _locateAddress: function () {
            domConstruct.empty(this.divAddressResults);
            if (lang.trim(this.txtAddress.value) === '') {
                domStyle.set(this.imgSearchLoader, "display", "none");
                domStyle.set(this.close, "display", "block");
                domConstruct.empty(this.divAddressResults);
                if (this.locatorScrollbar) {
                    domClass.remove(this.locatorScrollbar._scrollBarContent, "esriCTZeroHeight");
                }
                this._locatorErrBack();
                return;
            }
            this._searchLocation();
        },

        /**
        * call locator service and get search results
        * @memberOf widgets/locator/locator
        */
        _searchLocation: function () {
            var nameArray, locatorSettings, locator, searchFieldName, addressField, baseMapExtent, options, searchFields, addressFieldValues, addressFieldName, s,
                deferredArray, index, locatorDef, deferred, resultLength, deferredListResult, num, key, order, i, resultAttributes;

            nameArray = { Address: [] };
            domStyle.set(this.imgSearchLoader, "display", "block");
            domStyle.set(this.close, "display", "none");
            domAttr.set(this.txtAddress, "defaultAddress", this.txtAddress.value);
            this._setHeightAddressResults();

            /**
            * call locator service specified in configuration file
            */
            locatorSettings = dojo.configData.LocatorSettings;
            locator = new Locator(locatorSettings.LocatorURL);
            searchFieldName = locatorSettings.LocatorParameters.SearchField;
            addressField = {};
            addressField[searchFieldName] = lang.trim(this.txtAddress.value);
            if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length !== 0) {
                baseMapExtent = this.map.getLayer(this.map.layerIds[0]).fullExtent;
            } else {
                baseMapExtent = this.map.getLayer("defaultBasemap").fullExtent;
            }
            options = {};
            options.address = addressField;
            options.outFields = locatorSettings.LocatorOutFields;
            options[locatorSettings.LocatorParameters.SearchBoundaryField] = baseMapExtent;
            locator.outSpatialReference = this.map.spatialReference;
            searchFields = [];
            addressFieldValues = locatorSettings.FilterFieldValues;
            addressFieldName = locatorSettings.FilterFieldName;
            for (s in addressFieldValues) {
                if (addressFieldValues.hasOwnProperty(s)) {
                    searchFields.push(addressFieldValues[s]);
                }
            }

            /**
            * get results from locator service
            * @param {object} options Contains address, outFields and basemap extent for locator service
            * @param {object} candidates Contains results from locator service
            */
            deferredArray = [];

            for (index in dojo.configData.SearchSettings) {
                if (dojo.configData.SearchSettings.hasOwnProperty(index)) {
                    this._locateLayersearchResult(deferredArray, dojo.configData.SearchSettings[index]);
                }
            }
            locatorDef = locator.addressToLocations(options);
            locator.on("address-to-locations-complete", lang.hitch(this, function (candidates) {
                deferred = new Deferred();
                deferred.resolve(candidates);
                return deferred.promise;
            }), function () {
                domStyle.set(this.imgSearchLoader, "display", "none");
                domStyle.set(this.close, "display", "block");
                this._locatorErrBack();
            });
            deferredArray.push(locatorDef);
            deferredListResult = new DeferredList(deferredArray);
            deferredListResult.then(lang.hitch(this, function (result) {
                if (result) {
                    if (result.length > 0) {
                        for (num = 0; num < result.length; num++) {
                            if (dojo.configData.SearchSettings[num]) {
                                key = dojo.configData.SearchSettings[num].SearchDisplayTitle;
                                nameArray[key] = [];
                                for (order = 0; order < result[num][1].features.length; order++) {
                                    resultAttributes = result[num][1].features[order].attributes;
                                    for (i = 0; i < resultAttributes.length; i++) {
                                        if (resultAttributes.hasOwnProperty(i)) {
                                            if (!resultAttributes[i]) {
                                                resultAttributes[i] = sharedNls.showNullValue;
                                            }
                                        }
                                    }
                                    if (nameArray[key].length < dojo.configData.LocatorSettings.MaxResults) {
                                        nameArray[key].push({
                                            name: string.substitute(dojo.configData.SearchSettings[num].SearchDisplayFields, resultAttributes),
                                            attributes: resultAttributes,
                                            layer: dojo.configData.SearchSettings[num],
                                            geometry: result[num][1].features[order].geometry
                                        });
                                    }
                                }
                            } else {
                                this._addressResult(result[num][1], nameArray, searchFields, addressFieldName);
                            }
                            resultLength = result[num][1].length;
                        }
                        this._showLocatedAddress(nameArray, resultLength);
                    }
                } else {
                    domStyle.set(this.imgSearchLoader, "display", "none");
                    domStyle.set(this.close, "display", "block");
                    this.mapPoint = null;
                    this._locatorErrBack();
                }
            }));
        },

        /**
        * push results into nameArray
        * @memberOf widgets/locator/locator
        */
        _addressResult: function (candidates, nameArray, searchFields, addressFieldName) {
            var order, j;
            for (order = 0; order < candidates.length; order++) {
                if (candidates[order].attributes[dojo.configData.LocatorSettings.AddressMatchScore.Field] > dojo.configData.LocatorSettings.AddressMatchScore.Value) {
                    for (j in searchFields) {
                        if (searchFields.hasOwnProperty(j)) {
                            if (candidates[order].attributes[addressFieldName] === searchFields[j]) {
                                if (nameArray.Address.length < dojo.configData.LocatorSettings.MaxResults) {
                                    nameArray.Address.push({
                                        name: string.substitute(dojo.configData.LocatorSettings.DisplayField, candidates[order].attributes),
                                        attributes: candidates[order]
                                    });
                                }
                            }
                        }
                    }
                }
            }
        },

        _locateLayersearchResult: function (deferredArray, layerobject) {
            var queryTask, queryLayer, queryTaskResult, deferred, currentTime;

            domStyle.set(this.imgSearchLoader, "display", "block");
            domStyle.set(this.close, "display", "none");
            if (layerobject.QueryURL) {
                queryTask = new QueryTask(layerobject.QueryURL);
                queryLayer = new Query();
                currentTime = new Date();
                queryLayer.where = string.substitute(layerobject.SearchExpression, [lang.trim(this.txtAddress.value).toUpperCase()]) + " AND " + currentTime.getTime().toString() + "=" + currentTime.getTime().toString();
                queryLayer.outSpatialReference = this.map.spatialReference;
                queryLayer.returnGeometry = true;
                queryLayer.outFields = ["*"];
                queryTaskResult = queryTask.execute(queryLayer, lang.hitch(this, function (featureSet) {
                    deferred = new Deferred();
                    deferred.resolve(featureSet);
                    return deferred.promise;
                }), function (err) {
                    alert(err.message);
                });
                deferredArray.push(queryTaskResult);
            }
        },

        /**
        * filter valid results from results returned by locator service
        * @param {object} candidates Contains results from locator service
        * @memberOf widgets/locator/locator
        */
        _showLocatedAddress: function (candidates, resultLength) {
            var addrListCount = 0, addrList = [], candidateArray, divAddressCounty, candidate, listContainer, i, divAddressSearchCell;
            domConstruct.empty(this.divAddressResults);
            if (lang.trim(this.txtAddress.value) === "") {
                this.txtAddress.focus();
                domConstruct.empty(this.divAddressResults);
                this.locatorScrollbar = new ScrollBar({ domNode: this.divAddressScrollContent });
                this.locatorScrollbar.setContent(this.divAddressResults);
                this.locatorScrollbar.createScrollBar();
                domStyle.set(this.imgSearchLoader, "display", "none");
                domStyle.set(this.close, "display", "block");
                return;
            }

            /**
            * display all the located address in the address container
            * 'this.divAddressResults' div dom element contains located addresses, created in widget template
            */

            if (this.locatorScrollbar) {
                domClass.add(this.locatorScrollbar._scrollBarContent, "esriCTZeroHeight");
                this.locatorScrollbar.removeScrollBar();
            }
            this.locatorScrollbar = new ScrollBar({ domNode: this.divAddressScrollContent });
            this.locatorScrollbar.setContent(this.divAddressResults);
            this.locatorScrollbar.createScrollBar();
            if (resultLength > 0) {
                for (candidateArray in candidates) {
                    if (candidates.hasOwnProperty(candidateArray)) {
                        if (candidates[candidateArray].length > 0) {
                            divAddressCounty = domConstruct.create("div", { "class": "esriCTSearchGroupRow esriCTBottomBorder esriCTResultColor esriCTCursorPointer esriAddressCounty" }, this.divAddressResults);
                            divAddressSearchCell = domConstruct.create("div", { "class": "esriCTSearchGroupCell" }, divAddressCounty);
                            candidate = candidateArray + " (" + candidates[candidateArray].length + ")";
                            domConstruct.create("div", { "innerHTML": "+", "class": "esriCTPlusMinus" }, divAddressSearchCell);
                            domConstruct.create("div", { "innerHTML": candidate, "class": "esriCTGroupList" }, divAddressSearchCell);
                            domStyle.set(this.imgSearchLoader, "display", "none");
                            domStyle.set(this.close, "display", "block");
                            addrList.push(divAddressCounty);
                            this._toggleAddressList(addrList, addrListCount);
                            addrListCount++;
                            listContainer = domConstruct.create("div", { "class": "listContainer esriCTHideAddressList" }, this.divAddressResults);
                            for (i = 0; i < candidates[candidateArray].length; i++) {
                                this._displayValidLocations(candidates[candidateArray][i], i, candidates[candidateArray], listContainer);
                            }
                        }
                    }
                }
            } else {
                domStyle.set(this.imgSearchLoader, "display", "none");
                domStyle.set(this.close, "display", "block");
                this.mapPoint = null;
                this._locatorErrBack();
            }
        },

        _toggleAddressList: function (addressList, idx) {
            var listStatusSymbol;
            on(addressList[idx], "click", lang.hitch(this, function () {
                if (domClass.contains(query(".listContainer")[idx], "esriCTShowAddressList")) {
                    domClass.toggle(query(".listContainer")[idx], "esriCTShowAddressList");
                    listStatusSymbol = (domAttr.get(query(".esriCTPlusMinus")[idx], "innerHTML") === "+") ? "-" : "+";
                    domAttr.set(query(".esriCTPlusMinus")[idx], "innerHTML", listStatusSymbol);
                    this.locatorScrollbar.resetScrollBar();
                    return;
                }
                domClass.add(query(".listContainer")[idx], "esriCTShowAddressList");
                domAttr.set(query(".esriCTPlusMinus")[idx], "innerHTML", "-");
                this.locatorScrollbar.resetScrollBar();
            }));
        },

        /**
        * display valid result in search panel
        * @param {object} candidate Contains valid result to be displayed in search panel
        * @return {Boolean} true if result is displayed successfully
        * @memberOf widgets/locator/locator
        */
        _displayValidLocations: function (candidate, index, candidateArray, listContainer) {
            var _this, candidateDate, esriCTrow;
            _this = this;

            domClass.remove(this.divAddressContent, "esriCTAddressResultHeight");
            domClass.add(this.divAddressContent, "esriCTAddressContainerHeight");
            esriCTrow = domConstruct.create("div", { "class": "esriCTrowTable" }, listContainer);
            candidateDate = domConstruct.create("div", { "class": "esriCTContentBottomBorder esriCTCursorPointer" }, esriCTrow);
            domAttr.set(candidateDate, "index", index);
            try {
                if (candidate.name) {
                    domAttr.set(candidateDate, "innerHTML", candidate.name);
                } else {
                    domAttr.set(candidateDate, "innerHTML", candidate);
                }
                if (candidate.attributes.location) {
                    domAttr.set(candidateDate, "x", candidate.attributes.location.x);
                    domAttr.set(candidateDate, "y", candidate.attributes.location.y);
                    domAttr.set(candidateDate, "address", string.substitute(dojo.configData.LocatorSettings.DisplayField, candidate.attributes.attributes));
                }
            } catch (err) {
                alert(sharedNls.errorMessages.falseConfigParams);
            }
            candidateDate.onclick = function () {
                var layer, infoIndex, geoLocationPushpin, symbol, lineColor, locatorMarkupSymbol, fillColor;
                if (_this.map.infoWindow) {
                    _this.map.infoWindow.hide();
                }
                _this.txtAddress.value = this.innerHTML;
                domAttr.set(_this.txtAddress, "defaultAddress", _this.txtAddress.value);

                _this._hideAddressContainer();
                if (candidate.geometry) {
                    if (candidate.geometry.type) {
                        if (candidate.geometry.type === "point") {
                            geoLocationPushpin = dojoConfig.baseURL + dojo.configData.LocatorSettings.DefaultLocatorSymbol;
                            locatorMarkupSymbol = new PictureMarkerSymbol(geoLocationPushpin, dojo.configData.LocatorSettings.MarkupSymbolSize.width, dojo.configData.LocatorSettings.MarkupSymbolSize.height);
                            _this._graphicLayerOnMap(candidate.geometry, locatorMarkupSymbol);
                        } else {
                            lineColor = new Color();
                            lineColor.setColor();
                            fillColor = new Color();
                            fillColor.setColor();
                            fillColor.a = 0.25;
                            symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, lineColor, 3), fillColor);
                            _this._graphicLayerOnMap(candidate.geometry, symbol);
                        }
                    }
                } else if (candidate.attributes.location) {
                    _this.mapPoint = new Point(domAttr.get(this, "x"), domAttr.get(this, "y"), _this.map.spatialReference);
                    _this._locateAddressOnMap(_this.mapPoint);
                } else {
                    if (candidateArray[domAttr.get(candidateDate, "index", index)]) {
                        layer = candidateArray[domAttr.get(candidateDate, "index", index)].layer.QueryURL;
                        for (infoIndex = 0; infoIndex < dojo.configData.SearchSettings.length; infoIndex++) {
                            if (dojo.configData.InfoWindowSettings[infoIndex] && dojo.configData.InfoWindowSettings[infoIndex].InfoQueryURL === layer) {
                                _this._showFeatureResultsOnMap(candidateArray, candidate, infoIndex, index);
                            } else if (dojo.configData.SearchSettings[infoIndex].QueryURL === layer) {
                                _this._showRoadResultsOnMap(candidate);
                            }
                        }
                    }
                }
            };
        },

        /**
        * add graphic on graphic layer of map
        * @memberOf widgets/locator/locator
        */
        _graphicLayerOnMap: function (geometry, symbol) {
            var graphic;
            graphic = new esri.Graphic(geometry, symbol, { "address": this.txtAddress.value }, null);
            this.map.getLayer("esriGraphicsLayerMapSettings").clear();
            this.map.getLayer("esriGraphicsLayerMapSettings").add(graphic);
            topic.publish("hideProgressIndicator");
            this.addressLocation = graphic;
        },

        /**
        * add pushpin on map
        * @memberOf widgets/locator/locator
        */
        _locateAddressOnMap: function (mapPoint) {
            var geoLocationPushpin, locatorMarkupSymbol;
            geoLocationPushpin = dojoConfig.baseURL + dojo.configData.LocatorSettings.DefaultLocatorSymbol;
            locatorMarkupSymbol = new PictureMarkerSymbol(geoLocationPushpin, dojo.configData.LocatorSettings.MarkupSymbolSize.width, dojo.configData.LocatorSettings.MarkupSymbolSize.height);
            this._graphicLayerOnMap(mapPoint, locatorMarkupSymbol);
            topic.publish("hideProgressIndicator");
        },

        /**
       * locate road on map
       * @memberOf widgets/locator/locator
       */
        _showRoadResultsOnMap: function (candidate) {
            var candidatePoint;
            this.map.setLevel(dojo.configData.ZoomLevel);
            candidatePoint = candidate.geometry.getPoint(0, 0);
            this.map.centerAt(candidatePoint);
            topic.publish("hideProgressIndicator");

        },

        /**
        * Query layer to fetch the data
        * @memberOf widgets/locator/locator
        */
        _showFeatureResultsOnMap: function (candidateArray, candidate, infoIndex, index) {
            var queryTask, queryLayer, featurePoint;

            domStyle.set(this.imgSearchLoader, "display", "block");
            domStyle.set(this.close, "display", "none");
            this.txtAddress.value = (candidate.name);
            if (candidate.layer.QueryURL) {
                queryTask = new QueryTask(candidate.layer.QueryURL);
                queryLayer = new Query();
                queryLayer.where = "1=1";
                queryLayer.outSpatialReference = this.map.spatialReference;
                queryLayer.returnGeometry = true;
                queryLayer.outFields = ["*"];
                queryTask.execute(queryLayer, lang.hitch(this, function (featureSet) {

                    if (featureSet.features[index].geometry.type === "point") {
                        this._createInfoWindowContent(featureSet.features[index].geometry, featureSet.features[index].attributes, featureSet.fields, infoIndex, null, null, this.map);
                    } else if (featureSet.features[index].geometry.type === "polyline") {
                        featurePoint = featureSet.features[index].geometry.getPoint(0, 0);
                        this._createInfoWindowContent(featurePoint, featureSet.features[index].attributes, featureSet.fields, infoIndex, null, null, this.map);
                    }
                }), function (err) {
                    alert(err.message);
                });
            }
        },

        /**
        * Create info window on map and populate the result
        * @memberOf widgets/locator/locator
        */
        _createInfoWindowContent: function (geometry, attributes, fields, infoIndex, featureArray, count, zoomToFeature) {
            var infoPopupFieldsCollection, infoPopupHeight, infoPopupWidth,
                divInfoDetailsTab, key, divInfoRow, i, fieldNames, divLink, j, infoTitle, mapPoint, utcMilliseconds;
            this.map.infoWindow.hide();
            mapPoint = this._getMapPoint(geometry);
            if (featureArray) {
                if (featureArray.length > 1 && count !== featureArray.length - 1) {
                    domClass.add(query(".esriCTInfoWindowRightArrow")[0], "esriCTShowInfoRightArrow");
                    domAttr.set(query(".esriCTdivInfoFeatureCount")[0], "innerHTML", count);
                } else {
                    domClass.remove(query(".esriCTInfoWindowRightArrow")[0], "esriCTShowInfoRightArrow");
                    domAttr.set(query(".esriCTdivInfoFeatureCount")[0], "innerHTML", "");
                }
                if (count > 0 && count < featureArray.length) {
                    domClass.add(query(".esriCTInfoWindowLeftArrow")[0], "esriCTShowInfoLeftArrow");
                    domAttr.set(query(".esriCTdivInfoFeatureCount")[0], "innerHTML", count + 1);
                } else {
                    domClass.remove(query(".esriCTInfoWindowLeftArrow")[0], "esriCTShowInfoLeftArrow");
                    domAttr.set(query(".esriCTdivInfoFeatureCount")[0], "innerHTML", count + 1);
                }
            } else {
                domClass.remove(query(".esriCTInfoWindowRightArrow")[0], "esriCTShowInfoRightArrow");
                domClass.remove(query(".esriCTInfoWindowLeftArrow")[0], "esriCTShowInfoLeftArrow");
                domAttr.set(query(".esriCTdivInfoFeatureCount")[0], "innerHTML", "");
                domAttr.set(query(".esriCTdivInfoTotalFeatureCount")[0], "innerHTML", "");
            }
            if (dojo.configData.SearchSettings[infoIndex].InfoWindowData) {
                infoPopupFieldsCollection = dojo.configData.SearchSettings[infoIndex].InfoWindowData;
                divInfoDetailsTab = domConstruct.create("div", { "class": "esriCTInfoDetailsTab" }, null);
                this.divInfoDetailsContainer = domConstruct.create("div", { "class": "esriCTInfoDetailsContainer" }, divInfoDetailsTab);
            } else {
                divInfoDetailsTab = domConstruct.create("div", { "class": "esriCTInfoDetailsTab" }, null);
                this.divInfoDetailsContainer = domConstruct.create("div", { "class": "esriCTInfoDetailsContainerError", "innerHTML": sharedNls.errorMessages.emptyInfoWindowContent }, divInfoDetailsTab);
            }
            infoPopupHeight = dojo.configData.InfoPopupHeight;
            infoPopupWidth = dojo.configData.InfoPopupWidth;
            if (infoPopupFieldsCollection) {
                for (key = 0; key < infoPopupFieldsCollection.length; key++) {
                    divInfoRow = domConstruct.create("div", { "className": "esriCTDisplayRow" }, this.divInfoDetailsContainer);
                    // Create the row's label
                    this.divInfoDisplayField = domConstruct.create("div", { "className": "esriCTDisplayField", "innerHTML": infoPopupFieldsCollection[key].DisplayText }, divInfoRow);
                    this.divInfoFieldValue = domConstruct.create("div", { "className": "esriCTValueField" }, divInfoRow);
                    for (i in attributes) {
                        if (attributes.hasOwnProperty(i)) {
                            if (!attributes[i]) {
                                attributes[i] = sharedNls.showNullValue;
                            }
                        }
                    }
                    for (j = 0; j < fields.length; j++) {
                        if (fields[j].type === "esriFieldTypeDate") {
                            if (attributes[fields[j].name]) {
                                if (Number(attributes[fields[j].name])) {
                                    utcMilliseconds = Number(attributes[fields[j].name]);
                                    attributes[fields[j].name] = dojo.date.locale.format(this.utcTimestampFromMs(utcMilliseconds), {
                                        datePattern: dojo.configData.DatePattern,
                                        selector: "date"
                                    });
                                }
                            }
                        }
                    }
                    fieldNames = string.substitute(infoPopupFieldsCollection[key].FieldName, attributes);
                    if (string.substitute(infoPopupFieldsCollection[key].FieldName, attributes).match("http:") || string.substitute(infoPopupFieldsCollection[key].FieldName, attributes).match("https:")) {

                        divLink = domConstruct.create("div", { "class": "esriCTLink", "innerHTML": sharedNls.buttons.link }, this.divInfoFieldValue);

                        on(divLink, "click", this._openDetailWindow);
                    } else {
                        this.divInfoFieldValue.innerHTML = fieldNames;
                    }
                }
                infoTitle = string.substitute(dojo.configData.SearchSettings[infoIndex].InfoWindowHeaderField, attributes);
                dojo.selectedMapPoint = mapPoint;
                this._setInfoWindowZoomLevel(mapPoint, infoTitle, divInfoDetailsTab, infoPopupWidth, infoPopupHeight, count, zoomToFeature);
            } else {
                infoTitle = sharedNls.errorMessages.emptyInfoWindowTitle;
                dojo.selectedMapPoint = mapPoint;
                this._setInfoWindowZoomLevel(mapPoint, infoTitle, divInfoDetailsTab, infoPopupWidth, infoPopupHeight, count, zoomToFeature);
                topic.publish("hideProgressIndicator");
            }
        },

        /**
        *open infowindow link on new page
        * @memberOf widgets/locator/locator
        */
        _openDetailWindow: function () {
            var link = domAttr.get(this, "link");
            window.open(link);
        },

        /**
        * @returns Date
        * @memberOf widgets/locator/locator
        */
        utcTimestampFromMs: function (utcMilliseconds) {
            return this.localToUtc(new Date(utcMilliseconds));
        },
        /**
        * @returns Date
        * @memberOf widgets/locator/locator
        */

        localToUtc: function (localTimestamp) {
            return new Date(localTimestamp.getTime() + (localTimestamp.getTimezoneOffset() * 60000));
        },

        /**
        *set the zoom level an screen point and infowindow
        * @memberOf widgets/locator/locator
        */
        _setInfoWindowZoomLevel: function (mapPoint, infoTitle, divInfoDetailsTab, infoPopupWidth, infoPopupHeight, count, zoomToFeature) {
            var extentChanged, screenPoint, zoomDeferred;
            if (this.map.getLevel() !== dojo.configData.ZoomLevel && zoomToFeature) {
                zoomDeferred = this.map.setLevel(dojo.configData.ZoomLevel);
                this.map.infoWindow.hide();
                zoomDeferred.then(lang.hitch(this, function () {
                    extentChanged = this.map.setExtent(this._calculateCustomMapExtent(mapPoint));
                    extentChanged.then(lang.hitch(this, function () {
                        topic.publish("hideProgressIndicator");
                        screenPoint = this.map.toScreen(dojo.selectedMapPoint);
                        screenPoint.y = this.map.height - screenPoint.y;
                        topic.publish("setInfoWindowOnMap", infoTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight, count);
                    }));
                }));
            } else {
                extentChanged = this.map.setExtent(this._calculateCustomMapExtent(mapPoint));
                this.map.infoWindow.hide();
                extentChanged.then(lang.hitch(this, function () {
                    topic.publish("hideProgressIndicator");
                    screenPoint = this.map.toScreen(dojo.selectedMapPoint);
                    screenPoint.y = this.map.height - screenPoint.y;
                    topic.publish("setInfoWindowOnMap", infoTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight, count);
                }));
            }
        },

        /**
        *Fetch the geometry type of the mapPoint
        * @memberOf widgets/locator/locator
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
        *open link on new page
        * @memberOf widgets/locator/locator
        */
        _makeWindowOpenHandler: function (link) {
            return function () {
                window.open(link);
            };
        },

        /**
        *Calculate offset point to show infow window
        * @memberOf widgets/locator/locator
        */
        _calculateCustomMapExtent: function (mapPoint) {
            var width, height, ratioHeight, totalYPoint, infoWindowHeight, xmin, ymin, xmax, ymax;
            width = this.map.extent.getWidth();
            height = this.map.extent.getHeight();
            ratioHeight = height / this.map.height;
            totalYPoint = dojo.configData.InfoPopupHeight + 30 + 61;
            infoWindowHeight = height - (ratioHeight * totalYPoint);
            xmin = mapPoint.x - (width / 2);
            ymin = mapPoint.y - infoWindowHeight;
            xmax = xmin + width;
            ymax = ymin + height;
            return new esri.geometry.Extent(xmin, ymin, xmax, ymax, this.map.spatialReference);
        },

        /**
        * hide search panel
        * @memberOf widgets/locator/locator
        */
        _hideAddressContainer: function () {
            domClass.replace(this.domNode, "esriCTHeaderSearch", "esriCTHeaderSearchSelected");
            this.txtAddress.blur();
            domClass.replace(this.divAddressHolder, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
            domClass.replace(this.divAddressHolder, "esriCTZeroHeight", "esriCTAddressContentHeight");
        },

        /**
        * set height of the search panel
        * @memberOf widgets/locator/locator
        */
        _setHeightAddressResults: function () {

            var height;
            /**
            * divAddressContent Container for search results
            * @member {div} divAddressContent
            * @private
            * @memberOf widgets/locator/locator
            */
            height = domGeom.getMarginBox(this.divAddressContent).h;
            if (height > 0) {

                /**
                * divAddressScrollContent Scrollbar container for search results
                * @member {div} divAddressScrollContent
                * @private
                * @memberOf widgets/locator/locator
                */
                domStyle.set(this.divAddressScrollContent, "height", (height - 120) + "px");
            }
        },

        /**
        * display search by address tab
        * @memberOf widgets/locator/locator
        */
        _showAddressSearchView: function () {
            if (domStyle.get(this.imgSearchLoader, "display", "block") === "block") {
                return;
            }
            this.txtAddress.value = domAttr.get(this.txtAddress, "defaultAddress");
            this.lastSearchString = lang.trim(this.txtAddress.value);
            domConstruct.empty(this.divAddressResults);
        },

        /**
        * display error message if locator service fails or does not return any results
        * @memberOf widgets/locator/locator
        */
        _locatorErrBack: function () {
            var errorAddressCounty;
            domConstruct.empty(this.divAddressResults);
            domStyle.set(this.imgSearchLoader, "display", "none");
            domStyle.set(this.close, "display", "block");
            domClass.remove(this.divAddressContent, "esriCTAddressContainerHeight");
            domClass.add(this.divAddressContent, "esriCTAddressResultHeight");
            errorAddressCounty = domConstruct.create("div", { "class": "esriCTBottomBorder esriCTCursorPointer esriCTAddressCounty" }, this.divAddressResults);
            domAttr.set(errorAddressCounty, "innerHTML", sharedNls.errorMessages.invalidSearch);
        },

        /**
        * clear default value from search textbox
        * @param {object} evt Dblclick event
        * @memberOf widgets/locator/locator
        */
        _clearDefaultText: function (evt) {
            var target;
            target = window.event ? window.event.srcElement : evt ? evt.target : null;
            if (!target) {
                return;
            }
            target.style.color = "#FFF";
            target.value = '';
            this.txtAddress.value = "";
            domAttr.set(this.txtAddress, "defaultAddress", this.txtAddress.value);
            domConstruct.empty(this.divAddressResults);
        },

        /**
        * set default value to search textbox
        * @param {object} evt Blur event
        * @memberOf widgets/locator/locator
        */
        _replaceDefaultText: function (evt) {
            var target;
            target = window.event ? window.event.srcElement : evt ? evt.target : null;
            if (!target) {
                return;
            }
            this._resetTargetValue(target, "defaultAddress");
        },

        /**
        * set default value to search textbox
        * @param {object} target Textbox dom element
        * @param {string} title Default value
        * @param {string} color Background color of search textbox
        * @memberOf widgets/locator/locator
        */
        _resetTargetValue: function (target, title) {
            if (target.value === '' && domAttr.get(target, title)) {
                target.value = target.title;
                if (target.title === "") {
                    target.value = domAttr.get(target, title);
                }
            }
            if (domClass.contains(target, "esriCTColorChange")) {
                domClass.remove(target, "esriCTColorChange");
            }
            domClass.add(target, "esriCTBlurColorChange");
            this.lastSearchString = lang.trim(this.txtAddress.value);
        },

        /**
        * show search result tap
        * @memberOf widgets/locator/locator
        */
        _showSearchTab: function () {
            domStyle.set(this.searchTextCointainer, "display", "block");
            domStyle.set(this.esriCTActivityContainer, "display", "none");
            domStyle.set(this.divAddressScrollContent, "display", "block");
            domClass.replace(this.ActivityPanel, "esriCTActivityPanel", "esriCTActivityPanelSelected");
            domClass.replace(this.SearchPanel, "esriCTSearchPanel", "esriCTSearchPanelSelected");
            domClass.replace(this.esriCTActivityContainer, "esriCTShowRouteContainerHeight", "esriCTHideContainerHeight");

        },

        /**
        * show Activity result tap
        * @memberOf widgets/locator/locator
        */
        _showActivityTab: function () {
            domStyle.set(this.searchTextCointainer, "display", "none");
            domStyle.set(this.esriCTActivityContainer, "display", "block");
            domStyle.set(this.divAddressScrollContent, "display", "none");
            domClass.replace(this.ActivityPanel, "esriCTActivityPanelSelected", "esriCTActivityPanel");
            domClass.replace(this.esriCTActivityContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
            domClass.replace(this.SearchPanel, "esriCTSearchPanelSelected", "esriCTSearchPanel");
        },

        /**
        * get buffer result on map
        * @memberOf widgets/locator/locator
        */
        _doBuffer: function (mapPoint) {
            var params, geometryService;
            geometryService = new GeometryService(dojo.configData.GeometryService);
            if (mapPoint.geometry && dojo.configData.BufferDistance) {
                params = new BufferParameters();
                params.distances = [dojo.configData.BufferDistance];
                params.unit = GeometryService.UNIT_STATUTE_MILE;
                params.bufferSpatialReference = this.map.spatialReference;
                params.outSpatialReference = this.map.spatialReference;
                params.geometries = [mapPoint.geometry];

                geometryService.buffer(params, lang.hitch(this, function (geometries) {
                    this._showBuffer(geometries, mapPoint);
                }));
            }
        },

        /**
        * show buffer result on map
        * @memberOf widgets/locator/locator
        */
        _showBuffer: function (geometries, mapPoint) {
            this._clearBuffer();
            this._clearRoute();
            var self, bufferSymbol;
            self = this;
            bufferSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([parseInt(dojo.configData.BufferSymbology.LineSymbolColor.split(",")[0], 10), parseInt(dojo.configData.BufferSymbology.LineSymbolColor.split(",")[1], 10), parseInt(dojo.configData.BufferSymbology.FillSymbolColor.split(",")[2], 10), parseFloat(dojo.configData.BufferSymbology.FillSymbolTransparency.split(",")[0], 10)]), 2
                ),
                new Color([parseInt(dojo.configData.BufferSymbology.FillSymbolColor.split(",")[0], 10), parseInt(dojo.configData.BufferSymbology.FillSymbolColor.split(",")[1], 10), parseInt(dojo.configData.BufferSymbology.LineSymbolColor.split(",")[2], 10), parseFloat(dojo.configData.BufferSymbology.LineSymbolTransparency.split(",")[0], 10)])
                );
            self._addGraphic(self.map.getLayer("tempBufferLayer"), bufferSymbol, geometries[0]);

            this._queryLayer(geometries[0], mapPoint);

        },

        /**
       * add graphic layer on map of buffer and set expand
       * create an object of graphic
       * @memberOf widgets/locator/locator
       */
        _addGraphic: function (layer, symbol, point, attr) {
            var graphic;
            if (attr) {
                graphic = new Graphic(point, symbol, attr, null);
            } else {
                graphic = new Graphic(point, symbol, null, null);
            }
            layer.add(graphic);
            this.map.setExtent(point.getExtent().expand(1.6));
        },

        /**
      * clear buffer on map
      * @memberOf widgets/locator/locator
      */
        _clearBuffer: function () {
            var layer, graphic, i, count;
            layer = this.map.getLayer("tempBufferLayer");
            if (layer) {
                count = layer.graphics.length;
                for (i = 0; i < count; i++) {
                    graphic = layer.graphics[i];
                    if (graphic.geometry.type === "polygon") {
                        layer.remove(graphic);
                    }
                }
            }
        },

        /**
        * query layer to fetch the features
        * @memberOf widgets/locator/locator
        */
        _queryLayer: function (geometry, mapPoint) {
            var queryTask, queryLayer, featureSet, features;
            queryTask = new esri.tasks.QueryTask(dojo.configData.OperationalLayers[0].ServiceURL);
            queryLayer = new esri.tasks.Query();
            queryLayer.outFields = ["*"];
            queryLayer.returnGeometry = true;
            queryLayer.geometry = geometry;
            queryLayer.where = "1=1";
            queryTask.execute(queryLayer, lang.hitch(this, function (relatedRecords) {
                if (relatedRecords.features.length !== 0) {
                    var i;
                    featureSet = new esri.tasks.FeatureSet();
                    features = [];
                    if (relatedRecords.features.length > 0) {

                        for (i in relatedRecords.features) {
                            if (relatedRecords.features.hasOwnProperty(i)) {
                                features.push(relatedRecords.features[i]);
                            }
                        }
                        featureSet.features = features;
                        this._executeQueryForFeatures(featureSet, geometry, mapPoint);
                    }
                } else {
                    topic.publish("ShowHideResult", false);
                    alert(sharedNls.errorMessages.facilitydoestfound);
                }
            }));

        },

        /**
        * create route within buffer geometry
        * @memberOf widgets/locator/locator
        */
        _displayRouteOfNearestFeature: function (features, RouteParameters, featureSet, SpatialReference, units, mapPoint) {
            var routeTask, routeParams, geoLocationPushpin, locatorMarkupSymbol, graphics;
            routeParams = new RouteParameters();
            routeParams.stops = new FeatureSet();
            routeParams.returnRoutes = false;
            routeParams.returnDirections = true;
            routeParams.directionsLengthUnits = units.MILES;
            routeParams.outSpatialReference = new SpatialReference({ wkid: 102100 });
            geoLocationPushpin = dojoConfig.baseURL + dojo.configData.LocatorSettings.DefaultLocatorSymbol;
            locatorMarkupSymbol = new PictureMarkerSymbol(geoLocationPushpin, dojo.configData.LocatorSettings.MarkupSymbolSize.width, dojo.configData.LocatorSettings.MarkupSymbolSize.height);
            graphics = new esri.Graphic(mapPoint.geometry, locatorMarkupSymbol, {}, null);
            routeParams.stops.features.push(graphics);
            routeParams.stops.features.push(featureSet);
            routeTask = new RouteTask(dojo.configData.RouteServiceURL);
            routeTask.solve(routeParams);
            dojo.connect(routeTask, "onSolveComplete", lang.hitch(this, function (solveResult) {
                this._showRoute(solveResult, features, mapPoint);
            }));
        },

        /**
        * show route of nearest feature within buffer geometry
        * @memberOf widgets/locator/locator
        */
        _showRoute: function (solveResult, features, mapPoint) {
            var directions, symbols, address;
            directions = solveResult.routeResults[0].directions;
            symbols = new SimpleLineSymbol().setColor(dojo.configData.RouteColor).setWidth(dojo.configData.RouteWidth);
            this.map.getLayer("routeLayerId").add(new esri.Graphic(directions.mergedGeometry, symbols, null, null));
            this.map.getLayer("routeLayerId").show();
            topic.publish("ShowHideResult", true);
            features.features.sort(function (a, b) {
                return parseFloat(a.distance) - parseFloat(b.distance);
            });
            if (mapPoint && mapPoint.attributes && mapPoint.attributes.address) {
                address = mapPoint.attributes.address;
            } else {
                address = sharedNls.titles.directionCurrentLocationText;
            }
            topic.publish("setSearchInfo", { "directionResult": solveResult.routeResults, "searchResult": features, "addressResult": address });
            this._queryCommentLayer(features.features[0]);
        },

        /**
        * get the feature within buffer and sort it in ascending order.
        * @memberOf widgets/locator/locator
        */
        _executeQueryForFeatures: function (featureset, geometry, mapPoint) {
            var featureSet = [], i, j, dist;
            for (i = 0; i < featureset.features.length; i++) {
                for (j in featureset.features[i].attributes) {
                    if (featureset.features[i].attributes.hasOwnProperty(j)) {
                        if (!featureset.features[i].attributes[j]) {
                            featureset.features[i].attributes[j] = "NA";
                        }
                    }
                }
                if (mapPoint) {
                    dist = this._getDistance(mapPoint.geometry, featureset.features[i].geometry);
                }
                try {

                    featureSet[i] = featureset.features[i];
                    featureSet[i].distance = dist.toString();
                } catch (err) {
                    alert(sharedNls.errorMessages.falseConfigParams);
                }
            }
            if (dist) {
                featureSet.sort(function (a, b) {
                    return parseFloat(a.distance) - parseFloat(b.distance);
                });
            }
            this._displayRouteOfNearestFeature(featureset, RouteParameters, featureSet[0], SpatialReference, units, mapPoint);
        },

        /**
        * calculate the distance between the puspin(start point) and nearest feature(end point)
        * @memberOf widgets/locator/locator
        */
        _getDistance: function (startPoint, endPoint) {
            var sPoint, ePoint, lon1, lat1, lon2, lat2, theta, dist;
            sPoint = esri.geometry.webMercatorToGeographic(startPoint);
            ePoint = esri.geometry.webMercatorToGeographic(endPoint);
            lon1 = sPoint.x;
            lat1 = sPoint.y;
            lon2 = ePoint.x;
            lat2 = ePoint.y;
            theta = lon1 - lon2;
            dist = Math.sin(this._deg2Rad(lat1)) * Math.sin(this._deg2Rad(lat2)) + Math.cos(this._deg2Rad(lat1)) * Math.cos(this._deg2Rad(lat2)) * Math.cos(this._deg2Rad(theta));
            dist = Math.acos(dist);
            dist = this._rad2Deg(dist);
            dist = dist * 60 * 1.1515;
            return (dist * 10) / 10;
        },

        _deg2Rad: function (deg) {
            return (deg * Math.PI) / 180.0;
        },

        //Convert the radians to degrees
        _rad2Deg: function (rad) {
            return (rad / Math.PI) * 180.0;
        },

        _clearRoute: function () {
            var layer, graphic, i, count;
            layer = this.map.getLayer("routeLayerId").clear();
            if (layer) {
                count = layer.graphics.length;
                for (i = 0; i < count; i++) {
                    graphic = layer.graphics[i];
                    if (graphic.geometry.type === "polygon") {
                        layer.remove(graphic);
                    }
                }
            }
        },

        /**
        * qurey on Comment Layer
        * @memberOf widgets/locator/locator
        */
        _queryCommentLayer: function (feature) {
            var queryTask, esriQuery, featureSet, features;
            queryTask = new esri.tasks.QueryTask(dojo.configData.CommentsLayer.URL);
            esriQuery = new esri.tasks.Query();
            esriQuery.outFields = ["*"];
            esriQuery.returnGeometry = true;
            esriQuery.where = "ID=" + feature.attributes.OBJECTID;
            queryTask.execute(esriQuery, lang.hitch(this, function (relatedRecords) {
                featureSet = new esri.tasks.FeatureSet();
                features = [];
                if (relatedRecords.features.length > 0) {
                    var i;
                    for (i in relatedRecords.features) {
                        if (relatedRecords.features.hasOwnProperty(i)) {
                            features.push(relatedRecords.features[i]);
                        }
                    }
                    featureSet.features = features;
                }
                topic.publish("getFeatures", relatedRecords);
            }));
        }
    });
});
