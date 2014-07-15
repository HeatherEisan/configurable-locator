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
    "widgets/geoLocation/geoLocation",
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
    "esri/units",
    "../locator/locatorHelper"

], function (declare, domConstruct, domStyle, domAttr, lang, on, domGeom, dom, array, domClass, query, string, Locator, Query, ScrollBar, Deferred, DeferredList, QueryTask, Geometry, BufferParameters, Graphic, Color, SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, PictureMarkerSymbol, GraphicsLayer, GeometryService, Point, template, SearchResult, GeoLocation, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic, RouteParameters, RouteTask, FeatureSet, SpatialReference, urlUtils, units, locatorHelper) {
    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, locatorHelper], {
        templateString: template,
        sharedNls: sharedNls,
        lastSearchString: null,
        stagedSearch: null,
        locatorScrollbar: null,
        screenPoint: null,
        isResultFound: false,
        activitySearchFeature: null,
        /**
        * display locator widget
        *
        * @class
        * @name widgets/locator/locator
        */
        postCreate: function () {
            var contHeight, searchResult, locatorParams, FGeometry;
            /**
            * close locator widget if any other widget is opened
            * @param {string} widget Key of the newly opened widget
            */
            searchResult = new SearchResult({ map: this.map });
            searchResult.startup();
            topic.subscribe("toggleWidget", lang.hitch(this, function (widget) {
                if (widget !== "locator") {
                    if (domGeom.getMarginBox(this.divAddressHolder).h > 0) {
                        domClass.replace(this.domNode, "esriCTHeaderSearch", "esriCTHeaderSearchSelected");
                        domClass.replace(this.divAddressHolder, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                        this.txtAddress.blur();
                    }
                } else {
                    if (domClass.contains(this.divAddressHolder, "esriCTHideContainerHeight")) {
                        contHeight = domStyle.get(this.divAddressContent, "height");
                        domStyle.set(this.divAddressHolder, "height", contHeight + 2 + "px");
                    }
                }
            }));
            topic.subscribe("doBufferHandler", lang.hitch(this, function (feature) {
                if (!this.searchFacility) {
                    this.searchFacility = false;
                    this._doBuffer(feature.graphic);
                } else {
                    if (feature.geometry) {
                        FGeometry = feature;
                    } else if (feature.graphic.geometry) {
                        FGeometry = feature.graphic;
                    }
                    if (this.activitySearchFeature) {
                        this._displayRouteOfNearestFeature(null, RouteParameters, this.activitySearchFeature, SpatialReference, units, FGeometry, null);
                    }
                }
            }));
            topic.subscribe("showRoute", lang.hitch(this, function (features, RouteParameters, featureSet, SpatialReference, units, mapPoint, featureIndex) {
                this._setStartPoint(featureSet.attributes.NAME);
                this._displayRouteOfNearestFeature(features, RouteParameters, featureSet, SpatialReference, units, mapPoint, featureIndex);
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
                this._showLocateContainer(locatorParams);
            })));
            domStyle.set(this.divAddressContainer, "display", "block");
            domAttr.set(this.divAddressContainer, "title", "");
            domAttr.set(this.imgSearchLoader, "src", dojoConfig.baseURL + "/js/library/themes/images/loader.gif");
            this._setDefaultTextboxValue(this.txtAddress);

            locatorParams = {
                divSearch: this.divSearch,
                divAddressContent: this.divAddressContent,
                imgSearchLoader: this.imgSearchLoader,
                txtAddress: this.txtAddress,
                close: this.close,
                divAddressResults: this.divAddressResults,
                divAddressScrollContainer: this.divAddressScrollContainer,
                divAddressScrollContent: this.divAddressScrollContent,
                lastSearchString: this.lastSearchString,
                locatorScrollBar: this.ScrolldivAddressResults,
                showBuffer: true
            };
            this._attachLocatorEvents(locatorParams);
            this.own(on(this.ActivityPanel, "click", lang.hitch(this, function () {
                this._showActivityTab();
            })));
            this._showActivitySearchContainer();
            this.own(on(this.SearchPanel, "click", lang.hitch(this, function () {
                this._showSearchTab();
            })));
            urlUtils.addProxyRule({
                urlPrefix: dojo.configData.RouteServiceURL,
                proxyUrl: dojoConfig.baseURL + dojo.configData.ProxyUrl
            });
        },

        /**
        * positioning the infoWindow on extent change
        * @param {object}map point
        * @param {object} map
        * @param {object} infoWindow
        * @memberOf widgets/locator/locator
        */
        _onSetMapTipPosition: function (selectedPoint, map, infoWindow) {
            if (selectedPoint) {
                var screenPoint = map.toScreen(selectedPoint);
                screenPoint.y = map.height - screenPoint.y;
                infoWindow.setLocation(screenPoint);
            }
        },

        /**
        * set default value of locator textbox as specified in configuration file
        * @memberOf widgets/locator/locator
        */
        _setDefaultTextboxValue: function (locatorParams) {   //divSearch
            var locatorSettings;
            locatorSettings = dojo.configData.LocatorSettings;

            domAttr.set(locatorParams, "defaultAddress", locatorSettings.LocatorDefaultAddress);


        },

        /**
        * attach locator events
        * @memberOf widgets/locator/locator
        */
        _attachLocatorEvents: function (locatorParams) {
            this.own(on(locatorParams.divSearch, "click", lang.hitch(this, function (evt) {
                domStyle.set(locatorParams.imgSearchLoader, "display", "block");
                domStyle.set(locatorParams.close, "display", "none");

                this._locateAddress(evt, locatorParams);
            })));
            this.own(on(locatorParams.txtAddress, "keyup", lang.hitch(this, function (evt) {
                domStyle.set(locatorParams.close, "display", "block");

                this._submitAddress(evt, locatorParams);
            })));
            this.own(on(locatorParams.txtAddress, "dblclick", lang.hitch(this, function (evt) {
                this._clearDefaultText(evt, locatorParams);
            })));
            this.own(on(locatorParams.txtAddress, "blur", lang.hitch(this, function (evt) {
                this._replaceDefaultText(evt, locatorParams);
            })));
            this.own(on(locatorParams.txtAddress, "focus", lang.hitch(this, function () {
                domStyle.set(locatorParams.close, "display", "block");
                domClass.add(locatorParams.txtAddress, "esriCTColorChange");
            })));
            this.own(on(locatorParams.close, "click", lang.hitch(this, function () {
                this._hideText(locatorParams);
            })));
        },

        /**
        * hide the text when address container is blank
        * @memberOf widgets/locator/locator
        */
        _hideText: function (locatorParams) {
            locatorParams.txtAddress.value = "";
            domConstruct.empty(locatorParams.divAddressResults, locatorParams.divAddressScrollContent);
            domAttr.set(locatorParams.txtAddress, "defaultAddress", locatorParams.txtAddress.value);
            if (locatorParams.divAddressContent) {
                domClass.remove(locatorParams.divAddressContent, "esriCTAddressContainerHeight");
                domClass.remove(locatorParams.divAddressContent, "esriCTAddressResultHeight");
            }
            if (locatorParams.locatorScrollbar) {
                domClass.add(locatorParams.locatorScrollbar._scrollBarContent, "esriCTZeroHeight");
                locatorParams.locatorScrollbar.removeScrollBar();
            }
        },

        /**
        * show/hide locator widget and set default search text
        * @memberOf widgets/locator/locator
        */
        _showLocateContainer: function (locatorParams) {
            locatorParams.txtAddress.blur();
            if (domGeom.getMarginBox(this.divAddressHolder).h > 0) {

                /**
                * when user clicks on locator icon in header panel, close the search panel if it is open
                */
                domClass.replace(this.domNode, "esriCTHeaderSearch", "esriCTHeaderSearchSelected");
                domClass.replace(this.divAddressHolder, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                locatorParams.txtAddress.blur();
            } else {

                /**
                * when user clicks on locator icon in header panel, open the search panel if it is closed
                */
                domClass.replace(this.domNode, "esriCTHeaderSearchSelected", "esriCTHeaderSearch");
                domClass.replace(locatorParams.txtAddress, "esriCTBlurColorChange", "esriCTColorChange");
                domClass.replace(this.divAddressHolder, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
                domStyle.set(locatorParams.txtAddress, "verticalAlign", "middle");
                locatorParams.txtAddress.value = domAttr.get(locatorParams.txtAddress, "defaultAddress");
                locatorParams.lastSearchString = lang.trim(locatorParams.txtAddress.value);
            }
            this._setHeightAddressResults();
        },

        /**
        * search address on key press and image loader is show on text area
        * @param {object} evt Keyup event
        * @memberOf widgets/locator/locator
        */
        _submitAddress: function (evt, locatorParams) {
            if (evt) {
                if (evt.keyCode === dojo.keys.ENTER) {
                    if (locatorParams.txtAddress.value !== '') {
                        domStyle.set(locatorParams.imgSearchLoader, "display", "block");
                        domStyle.set(locatorParams.close, "display", "none");
                        this._locateAddress(evt, locatorParams);
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
                    domStyle.set(locatorParams.imgSearchLoader, "display", "none");
                    domStyle.set(locatorParams.close, "display", "block");
                    return;
                }

                /**
                * call locator service if search text is not empty
                */
                domStyle.set(locatorParams.imgSearchLoader, "display", "block");
                domStyle.set(locatorParams.close, "display", "none");
                if (locatorParams.divAddressContent && domGeom.getMarginBox(locatorParams.divAddressContent).h > 0) {
                    if (lang.trim(locatorParams.txtAddress.value) !== '') {
                        if (locatorParams.lastSearchString !== lang.trim(locatorParams.txtAddress.value)) {
                            locatorParams.lastSearchString = lang.trim(locatorParams.txtAddress.value);
                            domConstruct.empty(locatorParams.divAddressResults);

                            /**
                            * clear any staged search
                            */
                            clearTimeout(this.stagedSearch);
                            if (lang.trim(locatorParams.txtAddress.value).length > 0) {

                                /**
                                * stage a new search, which will launch if no new searches show up
                                * before the timeout
                                */
                                this.stagedSearch = setTimeout(lang.hitch(this, function () {
                                    this.stagedSearch = this._locateAddress(evt, locatorParams);
                                }), 500);
                            }
                        }
                    } else {
                        this.lastSearchString = lang.trim(locatorParams.txtAddress.value);
                        domStyle.set(locatorParams.imgSearchLoader, "display", "none");
                        domStyle.set(locatorParams.close, "display", "block");
                        domConstruct.empty(locatorParams.divAddressResults);
                    }
                }
            }
        },

        /**
        * perform search by address if search type is address search
        * @memberOf widgets/locator/locator
        */
        _locateAddress: function (event, locatorParams) {
            domConstruct.empty(locatorParams.divAddressResults);
            if (lang.trim(locatorParams.txtAddress.value) === '') {
                domStyle.set(locatorParams.imgSearchLoader, "display", "none");
                domStyle.set(locatorParams.close, "display", "block");
                domConstruct.empty(locatorParams.divAddressResults);
                if (locatorParams.locatorScrollbar) {
                    domClass.remove(locatorParams.locatorScrollbar._scrollBarContent, "esriCTZeroHeight");
                }
                this._locatorErrBack(locatorParams);
                return;
            }

            this._searchLocation(locatorParams);
        },

        /**
        * call locator service and get search results
        * @memberOf widgets/locator/locator
        */
        _searchLocation: function (locatorParams) {
            var nameArray, locatorSettings, locator, searchFieldName, addressField, baseMapExtent, options, searchFields, addressFieldValues, addressFieldName, s,
                deferredArray, index, locatorDef, deferred, resultLength, deferredListResult, num, key, order, i, resultAttributes;

            nameArray = { Address: [] };
            domStyle.set(locatorParams.imgSearchLoader, "display", "block");
            domStyle.set(locatorParams.close, "display", "none");
            domAttr.set(locatorParams.txtAddress, "defaultAddress", locatorParams.txtAddress.value);
            /**
            * call locator service specified in configuration file
            */
            locatorSettings = dojo.configData.LocatorSettings;
            locator = new Locator(locatorSettings.LocatorURL);
            searchFieldName = locatorSettings.LocatorParameters.SearchField;
            addressField = {};
            addressField[searchFieldName] = lang.trim(locatorParams.txtAddress.value);
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
                    this._locateLayersearchResult(deferredArray, dojo.configData.SearchSettings[index], locatorParams);
                }
            }
            locatorDef = locator.addressToLocations(options);
            locator.on("address-to-locations-complete", lang.hitch(this, function (candidates) {
                deferred = new Deferred();
                deferred.resolve(candidates);
                return deferred.promise;
            }), function () {
                domStyle.set(locatorParams.imgSearchLoader, "display", "none");
                domStyle.set(locatorParams.close, "display", "block");
                this._locatorErrBack(locatorParams);
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
                                this._addressResult(result[num][1], nameArray, searchFields, addressFieldName, locatorParams);
                            }
                            resultLength = result[num][1].length;
                        }
                        this._showLocatedAddress(nameArray, resultLength, locatorParams);
                    }
                } else {
                    domStyle.set(locatorParams.imgSearchLoader, "display", "none");
                    domStyle.set(locatorParams.close, "display", "block");
                    this.mapPoint = null;
                    this._locatorErrBack(locatorParams);
                }
            }));
        },

        /**
        * push results into nameArray
        * @param {object} candidates contains results from locator service
        * @param {array}  nameArray contains result of feature layer
        * @param {object} searchFields contains StreetAddress, StreetName, PointAddress, PO
        * @param {string} addressFieldName contains Addr_Type
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

        /**
        * query on feature layer
        * @param {array} deferredArray to store the array
        * @param {object} layerobject contains the URL of featrure layer
        * @memberOf widgets/locator/locator
        */
        _locateLayersearchResult: function (deferredArray, layerobject, locatorParams) {
            var queryTask, queryLayer, queryTaskResult, deferred, currentTime;
            domStyle.set(locatorParams.imgSearchLoader, "display", "block");
            domStyle.set(locatorParams.close, "display", "none");
            if (layerobject.QueryURL) {
                queryTask = new QueryTask(layerobject.QueryURL);
                queryLayer = new Query();
                currentTime = new Date();
                queryLayer.where = string.substitute(layerobject.SearchExpression, [lang.trim(locatorParams.txtAddress.value).toUpperCase()]) + " AND " + currentTime.getTime().toString() + "=" + currentTime.getTime().toString();
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
        * @param {object} resultLength Contains result length of the address
        * @memberOf widgets/locator/locator
        */
        _showLocatedAddress: function (candidates, resultLength, locatorParams) {
            var addrListCount = 0, addrList = [], candidateArray, divAddressCounty, candidate, listContainer, i, divAddressSearchCell;
            domConstruct.empty(locatorParams.divAddressResults);
            if (lang.trim(locatorParams.txtAddress.value) === "") {
                locatorParams.txtAddress.focus();
                domConstruct.empty(locatorParams.divAddressResults);
                locatorParams.locatorScrollbar = new ScrollBar({ domNode: locatorParams.divAddressScrollContent });
                locatorParams.locatorScrollbar.setContent(locatorParams.divAddressResults);
                locatorParams.locatorScrollbar.createScrollBar();
                domStyle.set(locatorParams.imgSearchLoader, "display", "none");
                domStyle.set(locatorParams.close, "display", "block");
                return;
            }

            /**
            * display all the located address in the address container
            * 'this.divAddressResults' div dom element contains located addresses, created in widget template
            */

            if (locatorParams.locatorScrollbar) {
                domClass.add(locatorParams.locatorScrollbar._scrollBarContent, "esriCTZeroHeight");
                locatorParams.locatorScrollbar.removeScrollBar();
            }
            locatorParams.locatorScrollbar = new ScrollBar({ domNode: locatorParams.divAddressScrollContent });
            locatorParams.locatorScrollbar.setContent(locatorParams.divAddressResults);
            locatorParams.locatorScrollbar.createScrollBar();
            if (resultLength > 0) {
                domClass.add(this.divAddressHolder, "esriCTAddressContentHeight");
                for (candidateArray in candidates) {
                    if (candidates.hasOwnProperty(candidateArray)) {
                        if (candidates[candidateArray].length > 0) {
                            divAddressCounty = domConstruct.create("div", { "class": "esriCTSearchGroupRow esriCTBottomBorder esriCTResultColor esriCTCursorPointer esriAddressCounty" }, locatorParams.divAddressResults);
                            divAddressSearchCell = domConstruct.create("div", { "class": "esriCTSearchGroupCell" }, divAddressCounty);
                            candidate = candidateArray + " (" + candidates[candidateArray].length + ")";
                            domConstruct.create("div", { "innerHTML": "+", "class": "esriCTPlusMinus" }, divAddressSearchCell);
                            domConstruct.create("div", { "innerHTML": candidate, "class": "esriCTGroupList" }, divAddressSearchCell);
                            domStyle.set(locatorParams.imgSearchLoader, "display", "none");
                            domStyle.set(locatorParams.close, "display", "block");
                            addrList.push(divAddressCounty);
                            this._toggleAddressList(addrList, addrListCount, locatorParams);
                            addrListCount++;
                            listContainer = domConstruct.create("div", { "class": "listContainer esriCTHideAddressList" }, locatorParams.divAddressResults);
                            for (i = 0; i < candidates[candidateArray].length; i++) {
                                this._displayValidLocations(candidates[candidateArray][i], i, candidates[candidateArray], listContainer, locatorParams);
                            }
                        }
                    }
                }
            } else {
                domStyle.set(locatorParams.imgSearchLoader, "display", "none");
                domStyle.set(locatorParams.close, "display", "block");
                this.mapPoint = null;
                this._locatorErrBack(locatorParams);
            }
        },

        /**
        * show and hide the address list
        * @param {object} addressList Contains list of address result
        * @param idx store index
        * @memberOf widgets/locator/locator
        */
        _toggleAddressList: function (addressList, idx, obj) {
            on(addressList[idx], "click", function () {
                var listStatusSymbol, outputContainer, plusMinusContainer;
                outputContainer = query(".listContainer", this.parentElement)[idx];
                plusMinusContainer = query(".esriCTPlusMinus", this.parentElement)[idx];
                if (outputContainer && plusMinusContainer) {
                    if (domClass.contains(outputContainer, "esriCTShowAddressList")) {
                        domClass.toggle(outputContainer, "esriCTShowAddressList");
                        listStatusSymbol = (domAttr.get(plusMinusContainer, "innerHTML") === "+") ? "-" : "+";
                        domAttr.set(plusMinusContainer, "innerHTML", listStatusSymbol);
                        obj.locatorScrollbar.resetScrollBar();
                        return;
                    }
                    domClass.add(outputContainer, "esriCTShowAddressList");
                    domAttr.set(plusMinusContainer, "innerHTML", "-");
                    obj.locatorScrollbar.resetScrollBar();
                }
            });
        },

        /**
        * display valid result in search panel
        * @param {object} candidate Contains valid result to be displayed in search panel
        * @param {number} index store the index of address result
        * @param {array} candidateArray Contains list of a address results
        * @param {object} listContainer having search result list
        * @memberOf widgets/locator/locator
        */
        _displayValidLocations: function (candidate, index, candidateArray, listContainer, locatorParams) {
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
                if (locatorParams && locatorParams.showBuffer) {
                    _this.searchFacility = false;
                } else {
                    _this.searchFacility = true;
                }

                topic.publish("createPod");
                var layer, infoIndex, geoLocationPushpin, symbol, lineColor, locatorMarkupSymbol, fillColor;
                if (_this.map.infoWindow) {
                    _this.map.infoWindow.hide();
                }
                locatorParams.txtAddress.value = this.innerHTML;
                domAttr.set(locatorParams.txtAddress, "defaultAddress", locatorParams.txtAddress.value);

                _this._hideAddressContainer(locatorParams);

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
                    _this._locateAddressOnMap(_this.mapPoint, locatorParams);
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
        * @param {object} geometry contains geometry
        * @param {object} symbol contains Graphic
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
        * @param {map point}
        * @memberOf widgets/locator/locator
        */
        _locateAddressOnMap: function (mapPoint, locatorParams) {
            var geoLocationPushpin, locatorMarkupSymbol;
            geoLocationPushpin = dojoConfig.baseURL + dojo.configData.LocatorSettings.DefaultLocatorSymbol;
            locatorMarkupSymbol = new PictureMarkerSymbol(geoLocationPushpin, dojo.configData.LocatorSettings.MarkupSymbolSize.width, dojo.configData.LocatorSettings.MarkupSymbolSize.height);
            this._graphicLayerOnMap(mapPoint, locatorMarkupSymbol);
            topic.publish("hideProgressIndicator");
        },

        /**
        * locate road on map
        * @param {Object} candidate Contains address result data
        * @memberOf widgets/locator/locator
        */
        _showRoadResultsOnMap: function (candidate) {
            var candidatePoint;
            this.map.setLevel(dojo.configData.ZoomLevel);
            candidatePoint = candidate.geometry.getPoint(0, 0);
            this.map.centerAt(candidatePoint);
            topic.publish("hideProgressIndicator");
        }
    });
});
