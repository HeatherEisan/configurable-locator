/*global define,dojo */
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
    "dojo/on",
    "dojo/dom-attr",
    "../scrollBar/scrollBar",
    "dojo/dom",
    "dojo/dom-class",
    "esri/domUtils",
    "esri/InfoWindowBase",
    "dojo/text!./templates/infoWindow.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/query",
    "dojo/topic",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dijit/_WidgetsInTemplateMixin"

], function (declare, domConstruct, domStyle, lang, on, domAttr, ScrollBar, dom, domClass, domUtils, InfoWindowBase, template, _WidgetBase, _TemplatedMixin, query, topic, sharedNls, _WidgetsInTemplateMixin) {
    return declare([InfoWindowBase, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,
        InfoShow: true,

        postCreate: function () {
            this.infoWindowContainer = domConstruct.create("div", {}, dom.byId("esriCTParentDivContainer"));
            this.infoWindowContainer.appendChild(this.domNode);
            this._anchor = domConstruct.create("div", { "class": "esriCTDivTriangle" }, this.domNode);
            domUtils.hide(this.domNode);
            domAttr.set(this.backToMap, "innerHTML", "Back To Map");
            this.own(on(this.backToMap, "click", lang.hitch(this, function () {
                this._closeInfowindow();
            })));
            this.own(on(this.esriCTMobileArrow, "click", lang.hitch(this, function () {
                this.InfoShow = false;
                this._openInfowindow();
            })));
            topic.subscribe("openMobileInfowindow", lang.hitch(this, function () {
                this._openInfowindow();
            }));
            topic.subscribe("onWindowResize", lang.hitch(this, function () {
                this.onWindowResize();
            }));
            if (!dojo.configData.CommentsLayer.Visibility) {
                domStyle.set(this.commentsTab, "display", "none");
                domClass.add(this.informationTab, "esriCTInfoInformationTabNotCommenet");
                domClass.add(this.galleryTab, "esriCTInfoGalleryTabNotCommenet");
                domClass.add(this.getDir, "esriCTInfoDirectionTabNotCommenet");
            }
            this.own(on(this.divClose, "click", lang.hitch(this, function () {
                this.InfoShow = true;
                domUtils.hide(this.domNode);
                this.map.getLayer("highlightLayerId").clear();
            })));
            this.own(on(this.esriCTMobileCloseDiv, "click", lang.hitch(this, function () {
                dojo.featurePoint = null;
                this.InfoShow = true;
                dojo.setMapTipPosition = true;
                domUtils.hide(this.domNode);
            })));
            this.own(on(this.informationTab, "click", lang.hitch(this, function () {
                this._showInformationTab(this.informationTab, dojo.byId("informationTabContainer"));
                domClass.remove(this.getDirselect, "esriCTImageTabselected");
                domClass.add(this.getDirselect, "esriCTImageTab");
            })));
            this.own(on(this.galleryTab, "click", lang.hitch(this, function () {
                this._showInformationTab(this.galleryTab, dojo.byId("galleryTabContainer"));
                domClass.remove(this.getDirselect, "esriCTImageTabselected");
                domClass.add(this.getDirselect, "esriCTImageTab");
            })));
            this.own(on(this.commentsTab, "click", lang.hitch(this, function () {
                this._showInformationTab(this.commentsTab, dojo.byId("commentsTabContainer"));
                domClass.remove(this.getDirselect, "esriCTImageTabselected");
                domClass.add(this.getDirselect, "esriCTImageTab");
            })));
            this.own(on(this.getDir, "click", lang.hitch(this, function () {
                this._showInformationTab(this.getDir, dojo.byId("getDirContainer"));
                domClass.add(this.getDirselect, "esriCTImageTabselected");
                domClass.remove(this.getDirselect, "esriCTImageTab");
            })));
        },

        _showInformationTab: function (tabNode, containerNode) {
            var infoContainer, infoTab;
            infoContainer = query('.displayBlock')[0];
            infoTab = query('.infoSelectedTab')[0];
            if (infoContainer) {
                domClass.remove(infoContainer, "displayBlock");
            }
            if (infoTab) {
                domClass.remove(infoTab, "infoSelectedTab");
            }
            domClass.remove(this.getDirselect, "esriCTImageTabselected");
            domClass.add(this.getDirselect, "esriCTImageTab");
            domClass.add(tabNode, "infoSelectedTab");
            domClass.add(containerNode, "displayBlock");
        },

        show: function (detailsTab, screenPoint) {
            this.InfoShow = false;
            this._showInformationTab(this.informationTab, dojo.byId("informationTabContainer"));
            this.setLocation(screenPoint);
        },

        resize: function (width, height) {
            if (dojo.window.getBox().w <= 767) {
                this.infoWindowWidth = 180;
                this.infoWindowHeight = 30;
                this.infoWindowResizeOnMap();
                domStyle.set(this.domNode, {
                    width: 180 + "px",
                    height: 30 + "px"
                });
            } else {
                this.onWindowResize();
                this.infoWindowWidth = width;
                this.infoWindowHeight = height;
                domStyle.set(this.domNode, {
                    width: width + "px",
                    height: height + "px"
                });
            }
            this.resizeInfoScrollContainer();
        },

        /**
        * set title of infowindow
        * @memberOf widgets/infoWindow/infoWindow
        */
        setTitle: function (mobTitle) {
            if (mobTitle.length > 0) {
                this.spanDirection.innerHTML = mobTitle;
                this.spanDirection.title = mobTitle;
            } else {
                this.esriCTheadderPanel.innerHTML = "";
                this.spanDirection.innerHTML = "";
            }
        },

        setLocation: function (location) {
            if (location.spatialReference) {
                location = this.map.toScreen(location);
            }
            domStyle.set(this.domNode, {
                left: (location.x - (this.infoWindowWidth / 2)) + "px",
                bottom: (location.y + 25) + "px"
            });
            if (!this.InfoShow) {
                domUtils.show(this.domNode);
            }
        },

        hide: function () {
            domUtils.hide(this.domNode);
            this.isShowing = false;
            this.onHide();
            dojo.openInfowindow = false;
        },

        _hideInfoContainer: function () {
            this.own(on(this.divClose, "click", lang.hitch(this, function () {
                domUtils.hide(this.domNode);
            })));
        },

        /**
        * Set parameter on window resize
        * @memberOf widgets/infoWindow/infoWindow
        */
        onWindowResize: function () {
            this.infoWindowzIndex = 997;
            domStyle.set(this.domNode, { zIndex: 997 });
        },

        /**
        * Set parameter for info window
        * @memberOf widgets/infoWindow/infoWindow
        */
        infoWindowResizeOnMap: function () {
            if (this.isMobileInfoWindowOpen) {
                this.infoWindowzIndex = 1002;
                domStyle.set(this.domNode, { zIndex: 1002 });
            } else {
                this.infoWindowzIndex = 997;
                domStyle.set(this.domNode, { zIndex: 997 });
            }
        },

        /**
        * Create info winodw for mobile
        * @memberOf widgets/infoWindow/infoWindow
        */
        _openInfowindow: function () {
            domClass.remove(query(".cloasedivmobile")[0], "scrollbar_footerVisible");
            domClass.add(query(".esriCTInfoContent")[0], "esriCTShowInfoContent");
            domClass.add(query(".divInfoMobileContent")[0], "divHideInfoMobileContent");
            domClass.add(query(".esriCTDivTriangle")[0], "esriCThidedivTriangle");
            domClass.add(query(".esriCTInfoWindow")[0], "esriCTinfoWindowHeightWidth");
            if (dojo.window.getBox().w <= 767) {
                var divInfoContentHeight = document.documentElement.clientHeight - 60,
                    esriInfoStyle = { height: divInfoContentHeight + 'px' };
                domAttr.set(this.divInfoScrollContent, "style", esriInfoStyle);
                if (this.infoContainerScrollbar) {
                    domClass.add(this.infoContainerScrollbar._scrollBarContent, "esriCTZeroHeight");
                    this.infoContainerScrollbar.removeScrollBar();
                }
                this.infoContainerScrollbar = new ScrollBar({
                    domNode: this.divInfoScrollContent
                });
                this.infoContainerScrollbar.setContent(this.divInfoDetailsScroll);
                this.infoContainerScrollbar.createScrollBar();
                dojo.onInfoWindowResize = true;
                this.isMobileInfoWindowOpen = true;
                this.infoWindowResizeOnMap();
            }
        },

        resizeInfoScrollContainer: function () {
            var divInfoContentHeight = document.documentElement.clientHeight - 60,
                esriInfoStyle = { height: divInfoContentHeight + 'px' };
            domAttr.set(this.divInfoScrollContent, "style", esriInfoStyle);
            if (this.infoContainerScrollbar) {
                domClass.add(this.infoContainerScrollbar._scrollBarContent, "esriCTZeroHeight");
                this.infoContainerScrollbar.removeScrollBar();
            }
            this.infoContainerScrollbar = new ScrollBar({
                domNode: this.divInfoScrollContent
            });
            this.infoContainerScrollbar.setContent(this.divInfoDetailsScroll);
            this.infoContainerScrollbar.createScrollBar();
            this.infoWindowResizeOnMap();
        },
        /**
        * Hide mobile info window
        * @memberOf widgets/infoWindow/infoWindow
        */
        _closeInfowindow: function () {
            dojo.onInfoWindowResize = false;
            this.isMobileInfoWindowOpen = false;
            this.infoWindowResizeOnMap();
            domClass.remove(query(".esriCTInfoContent")[0], "esriCTShowInfoContent");
            domClass.remove(query(".divInfoMobileContent")[0], "divHideInfoMobileContent");
            domClass.remove(query(".esriCThidedivTriangle")[0], "esriCThidedivTriangle");
            domClass.remove(query(".esriCTInfoWindow")[0], "esriCTinfoWindowHeightWidth");
            domClass.add(query(".cloasedivmobile")[0], "scrollbar_footerVisible");
        }
    });
});
