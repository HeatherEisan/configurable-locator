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

], function (declare, domConstruct, domStyle, lang, on, ScrollBar, dom, domClass, domUtils, InfoWindowBase, template, _WidgetBase, _TemplatedMixin, query, topic, sharedNls, _WidgetsInTemplateMixin) {
    return declare([InfoWindowBase, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,
        InfoShow: null,

        postCreate: function () {
            this.infoWindowContainer = domConstruct.create("div", {}, dom.byId("esriCTParentDivContainer"));
            this.infoWindowContainer.appendChild(this.domNode);
            this._anchor = domConstruct.create("div", { "class": "esriCTDivTriangle" }, this.domNode);
            domUtils.hide(this.domNode);

            this.own(on(this.divClose, "click", lang.hitch(this, function () {
                if (query(".map .logo-sm")) {
                    this.InfoShow = true;
                } else {
                    this.InfoShow = false;
                }
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
                topic.publish("setCommentScrollbar");
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
            domClass.add(tabNode, "infoSelectedTab");
            domClass.add(containerNode, "displayBlock");
        },

        show: function (detailsTab, screenPoint) {
            this.InfoShow = false;
            this.setLocation(screenPoint);
        },

        resize: function (width, height) {
            if (dojo.window.getBox().w <= 640) {
                this.infoWindowWidth = 180;
                this.infoWindowHeight = 30;
                domStyle.set(this.domNode, {
                    width: 180 + "px",
                    height: 30 + "px"
                });
            } else {
                this.infoWindowWidth = width;
                this.infoWindowHeight = height;
                domStyle.set(this.domNode, {
                    width: width + "px",
                    height: height + "px"
                });
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
            this.isShowing = true;
        },

        hide: function () {
            domUtils.hide(this.domNode);
            this.isShowing = false;
            this.onHide();
        },

        _hideInfoContainer: function () {
            this.own(on(this.divClose, "click", lang.hitch(this, function () {
                domUtils.hide(this.domNode);
            })));
        }
    });
});
