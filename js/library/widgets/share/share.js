/*global define,dojo,window,alert,esri,parent:true */
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
    "dojo/_base/lang",
    "dojo/dom-attr",
    "dojo/on",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-geometry",
    "dojo/dom-style",
    "dojo/string",
    "esri/request",
    "dojo/_base/html",
    "dojo/text!./templates/shareTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/topic",
    "dijit/a11yclick",
    "widgets/share/commonShare"
], function (declare, domConstruct, lang, domAttr, on, dom, domClass, domGeom, domStyle, string, esriRequest, html, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, topic, a11yclick, commonShare) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,
        /**
        * create share widget
        *
        * @class
        * @name widgets/share/share
        */
        postCreate: function () {
            var applicationHeaderDiv;

            /**
            * close share panel if any other widget is opened
            * @param {string} widget Key of the newly opened widget
            */
            topic.subscribe("toggleWidget", lang.hitch(this, function (widgetID) {
                if (widgetID !== "share") {

                    /**
                    * divAppContainer Sharing Options Container
                    * @member {div} divAppContainer
                    * @private
                    * @memberOf widgets/share/share
                    */
                    if (html.coords(this.divAppContainer).h > 0) {
                        domClass.replace(this.domNode, "esriCTImgSocialMedia", "esriCTImgSocialMediaSelected");
                        domClass.replace(this.divAppContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                        domClass.replace(this.divAppContainer, "esriCTZeroHeight", "esriCTFullHeight");
                    }
                } else {
                    if (domClass.contains(this.divAppContainer, "esriCTHideContainerHeight")) {
                        this._setShareContainerHeight();
                    }
                }
            }));
            this.domNode = domConstruct.create("div", { "title": sharedNls.tooltips.shareTooltips, "class": "esriCTImgSocialMedia" }, null);
            applicationHeaderDiv = domConstruct.create("div", { "class": "esriCTApplicationShareicon" }, dom.byId("esriCTParentDivContainer"));
            applicationHeaderDiv.appendChild(this.divAppContainer);
            this.own(on(this.domNode, a11yclick, lang.hitch(this, function () {

                /**
                * minimize other open header panel widgets and show share panel
                */
                topic.publish("toggleWidget", "share");
                this._shareLink();
                this._showHideShareContainer();
            })));
            on(this.imgEmbedding, a11yclick, lang.hitch(this, function () {
                this._showEmbeddingContainer();
            }));
            /**
                * add event handlers to sharing options
                */
            on(this.tdFacebook, a11yclick, lang.hitch(this, function () { this._share("facebook"); }));
            on(this.tdTwitter, a11yclick, lang.hitch(this, function () { this._share("twitter"); }));
            on(this.tdMail, a11yclick, lang.hitch(this, function () { this._share("email"); }));
        },

        /**
        * set embedding container
        * @memberOf widgets/share/share
        */
        _showEmbeddingContainer: function () {
            var height;
            // Get the margin-box size of a node
            if (domGeom.getMarginBox(this.divShareContainer).h > 1) {
                domClass.add(this.divShareContainer, "esriCTShareBorder");
                domClass.replace(this.divShareContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
            } else {
                height = domGeom.getMarginBox(this.divShareCodeContainer).h + domGeom.getMarginBox(this.divShareCodeContent).h;
                domClass.remove(this.divShareContainer, "esriCTShareBorder");
                domClass.replace(this.divShareContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
                domStyle.set(this.divShareContainer, "height", height + "px");
            }
            this._setShareContainerHeight(height);
        },

        /**
        * set embedding container height
        * @memberOf widgets/share/share
        */
        _setShareContainerHeight: function (embContainerHeight) {
            var contHeight = domStyle.get(this.divAppHolder, "height");
            //calulate height if a node with id="this.divShareContainer" has class="esriCTShowContainerHeight" present
            if (domClass.contains(this.divShareContainer, "esriCTShowContainerHeight")) {
                if (embContainerHeight) {
                    contHeight += embContainerHeight;
                } else {
                    contHeight += domStyle.get(this.divShareContainer, "height");
                }
            }
            domStyle.set(this.divAppContainer, "height", contHeight + 60 + "px");
        },

        /* show and hide share container
        * @memberOf widgets/share/share
        */
        _showHideShareContainer: function () {
            if (html.coords(this.divAppContainer).h > 0) {
                /**
                * when user clicks on share icon in header panel, close the sharing panel if it is open
                */
                domClass.replace(this.domNode, "esriCTImgSocialMedia", "esriCTImgSocialMediaSelected");
                domClass.replace(this.divAppContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                domClass.replace(this.divAppContainer, "esriCTZeroHeight", "esriCTFullHeight");
            } else {
                /**
                * when user clicks on share icon in header panel, open the sharing panel if it is closed
                */
                domClass.replace(this.domNode, "esriCTImgSocialMediaSelected", "esriCTImgSocialMedia");
                domClass.replace(this.divAppContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
                domClass.replace(this.divAppContainer, "esriCTFullHeight", "esriCTZeroHeight");
            }
        },

        /**
        * return current map extent
        * @return {string} Current map extent
        * @memberOf widgets/share/share
        */
        _getMapExtent: function () {
            var extents = Math.round(this.map.extent.xmin).toString() + "," + Math.round(this.map.extent.ymin).toString() + "," + Math.round(this.map.extent.xmax).toString() + "," + Math.round(this.map.extent.ymax).toString();
            return extents;
        },

        /**
          * display sharing panel
          * @param {array} dojo.configData.MapSharingOptions Sharing option settings specified in configuration file
          * @memberOf widgets/share/share
          */
        _shareLink: function () {
            var mapExtent, url, urlStr, clickCoords, eventIndex, geolocationCoords;
            /**
            * get current map extent to be shared
            */
            if (domGeom.getMarginBox(this.divShareContainer).h <= 1) {
                domClass.add(this.divShareContainer, "esriCTShareBorder");
            }
            this.divShareCodeContent.value = "<iframe width='100%' height='100%' src='" + location.href + "'></iframe> ";
            domAttr.set(this.divShareCodeContainer, "innerHTML", sharedNls.titles.webpageDisplayText);
            mapExtent = this._getMapExtent();
            url = esri.urlToObject(window.location.toString());
            urlStr = encodeURI(url.path) + "?extent=" + mapExtent;
            //dojo.addressLocation variable is use to store the address geometry in unified search and append in shared URL
            if (dojo.addressLocation) {
                urlStr += "$address=" + dojo.addressLocation;
            }
            //dojo.mapClickedPoint variable is use to store infowindow Point(geometry)and append in shared URL
            if (dojo.mapClickedPoint) {
                clickCoords = dojo.mapClickedPoint.x + "," + dojo.mapClickedPoint.y + "," + dojo.screenPoint;
                urlStr += "$mapClickPoint=" + clickCoords;
            }
            //dojo.infowindowDirection variable is use to store the infowindow direction geometry and append in shared URL
            if (dojo.infowindowDirection) {
                urlStr += "$infowindowDirection=" + dojo.infowindowDirection.toString();
            }
            //dojo.activitySearch variable is use to store the activity name and append in shared URL
            if (dojo.activitySearch) {
                urlStr += "$activitySearch=" + dojo.activitySearch.join(",");
            }
            //dojo.isShowPod variable is use to store minimize and maximize state of carousel pod and append in shared URL
            if (dojo.isShowPod && dojo.isShowPod.toString() === "false") {
                urlStr += "$isShowPod=" + dojo.isShowPod.toString();
            }
            //dojo.doQuery variable is use for maintain the activity state and append in shared URL
            if (dojo.doQuery) {
                urlStr += "$doQuery=" + dojo.doQuery.toString();
            }
            //dojo.searchFacilityIndex variable is use to store the index of facility and append in shared URL
            if (dojo.searchFacilityIndex >= 0) {
                urlStr += "$selectedSearchResult=" + dojo.searchFacilityIndex;
            }
            //dojo.selectedBasemapIndex variable is use to store the index of Basemap and append in shared URL
            if (dojo.selectedBasemapIndex !== null) {
                urlStr += "$selectedBasemapIndex=" + dojo.selectedBasemapIndex;
            }
            //dojo.addressLocationDirectionActivity variable is use to store direction geometry in bottom pod and append in shared URL
            if (dojo.addressLocationDirectionActivity) {
                urlStr += "$addressLocationDirectionActivity=" + dojo.addressLocationDirectionActivity.toString();
            }
            //dojo.sharedGeolocation variable is use to store Geolocation geometry and append in shared URL
            if (dojo.sharedGeolocation) {
                if (dojo.sharedGeolocation === "false") {
                    geolocationCoords = dojo.sharedGeolocation.toString();
                } else {
                    geolocationCoords = dojo.sharedGeolocation.geometry.x.toString() + "," + dojo.sharedGeolocation.geometry.y.toString();
                }
                urlStr += "$sharedGeolocation=" + geolocationCoords;
            }
            //dojo.addressLocationDirection variable is use to store address direction geometry and append in shared URL
            if (dojo.addressLocationDirection) {
                urlStr += "$addressLocationDirection=" + dojo.addressLocationDirection.toString();
            }
            if (dojo.eventOrderInMyList) {
                urlStr += "$eventOrderInMyList=" + dojo.eventOrderInMyList;
            }
            //dojo.eventInfoWindowIdActivity variable is use to store event array of ObjectID for add to list and append in shared URL
            if (dojo.eventInfoWindowData) {
                urlStr += "$eventInfoWindowData=" + dojo.eventInfoWindowData.x.toString() + "," + dojo.eventInfoWindowData.y.toString();
            }
            //dojo.eventInfoWindowAttribute variable is use to store mapPoint(geometry)for add to list and append in shared URL
            if (dojo.eventInfoWindowAttribute) {
                urlStr += "$eventInfoWindowAttribute=" + dojo.eventInfoWindowAttribute;
            }
            //dojo.eventInfoWindowIdActivity variable is use to store array of ObjectID for add to list and append in shared URL
            if (dojo.eventInfoWindowIdActivity) {
                urlStr += "$eventInfoWindowIdActivity=" + dojo.eventInfoWindowIdActivity;
            }
            //dojo.infoRoutePoint variable is use to store direction Point(geomerty) for add to list and append in shared URL
            if (dojo.infoRoutePoint) {
                urlStr += "$infoRoutePoint=" + dojo.infoRoutePoint.toString();
            }
            //dojo.eventForListClicked variable is use to store Activity array of ObjectID for add to list and append in shared URL
            if (dojo.eventForListClicked) {
                urlStr += "$eventRouteforList=" + dojo.eventForListClicked.toString();
            }
            //dojo.eventRoutePoint variable is use to store event route Point(geometry) and append in shared URL
            if (dojo.eventRoutePoint) {
                urlStr += "$eventRoutePoint=" + dojo.eventRoutePoint.toString();
            }
            //dojo.eventIndex variable is use to store event objectId search from datePicker and append in shared URL
            if (dojo.eventIndex && dojo.eventPlannerQuery === undefined) {
                urlStr += "$eventIndex=" + dojo.eventIndex.toString();
            }
            //dojo.eventIndex variable is use to store true/false if search the event from datePicker and append in shared URL
            if (dojo.eventPlannerQuery) {
                eventIndex = "";
                if (dojo.eventIndex) {
                    eventIndex = dojo.eventIndex.toString();
                }
                urlStr += "$eventplanner=" + "true" + "$startDate=" + dojo.eventPlannerQuery.split(",")[0].replace(new RegExp(" ", 'g'), ",").toString() + "$endDate=" + dojo.eventPlannerQuery.split(",")[1].replace(new RegExp(" ", 'g'), ",").toString() + "$eventIndex=" + eventIndex;
            }
            urlStr += "$extentChanged=true";
            this.getTinyUrl = commonShare.getTinyLink(urlStr, dojo.configData.MapSharingOptions.TinyURLServiceURL);
        },

        /**
        * share application detail with selected share option
        * @param {string} site Selected share option
        * @param {string} tinyUrl Tiny URL for sharing
        * @param {string} urlStr Long URL for sharing
        * @memberOf widgets/share/share
        */
        _share: function (site) {
            /*
            * hide share panel once any of the sharing options is selected
            */
            domClass.replace(this.domNode, "esriCTImgSocialMedia", "esriCTImgSocialMediaSelected");
            if (html.coords(this.divAppContainer).h > 0) {
                domClass.replace(this.divAppContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                domClass.add(this.divAppContainer, "esriCTZeroHeight");
            }
            //Do the share
            commonShare.share(this.getTinyUrl, dojo.configData.MapSharingOptions, site);
        }
    });
});
