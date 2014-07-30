/*global define */
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
define({
    showNullValue: "@fr@ N/A",
    buttons: {
        okButtonText: "@fr@ OK",
        link: "@fr@ Link",
        email: "Email",  // Shown next to icon for sharing the current map extents via email; works with shareViaEmail tooltip
        Facebook: "Facebook",  // Shown next to icon for sharing the current map extents via a Facebook post; works with shareViaFacebook tooltip
        Twitter: "Twitter",
        embedding: "Embedding"// Shown next to icon for sharing the current map extents via a Twitter tweet; works with shareViaTwitter tooltip
    },
    tooltips: {
        search: "Rechercher",
        route: "@fr@ Route",
        locate: "Emplacement actuel",
        share: "Partager",
        help: "Aide",
        clearEntry: "@fr@ Clear",
        hidePanel: "@fr@ Hide panel",
        showPanel: "@fr@ Show panel",
        printButton: "@fr@ Print",
        close: "@it@ Close"
    },
    titles: {
        directionsDisplayText: "@fr@ Directions",
        informationPanelTitle: "@fr@ Information for current map view",
        webpageDisplayText: "@fr@ Copy/paste HTML into your web page",
        numberOfFeaturesFoundNearAddress: "Found ${0} facility(ies) near the address",
        splashScreenContent: "@fr@ Lorem ipsum dolor sit er elit lamet, consectetaur cillium adipisicing pecu, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Nam liber te conscient to factor tum poen legum odioque civiuda.",
        serchResultText: "@fr@ SEARCH RESULT",
        directionText: "@fr@ DIRECTIONS TO",
        galleryText: "@fr@ GALLERY",
        commentText: "@fr@ COMMENT",
        facitilyPanelAccessFeeText: "@fr@ Access Fee:",
        facitilyPanelHoursOpenForText: "@fr@ Hours Open For:",
        facitilyPanelManagementUnitText: "@fr@ Management Unit:",
        facitilyPanelMarinaText: "@fr@ Marina:",
        directionCurrentLocationText: "@fr@ My Location",
        directionTextDistance: "@fr@ Distance:",
        directionTextTime: "@fr@ Duration:",
        activityTabName: "@fr@ Activities",
        activityListTabName: "@fr@ My List",
        fromDateText: "@fr@ From Date",
        toDateText: "@fr@ To Date",
        gobuttonText: "@fr@ Go",
        noLegendAvailable: "@fr@ No Legend Available.",
        loadingText: "@fr@ Loading...",
        galleryInfoText: "@fr@ Gallery",
        informationText: "@fr@ Information",
        commentInfoText: "@fr@ Comments"
    },
    errorMessages: {
        invalidSearch: "Aucun résultat",
        falseConfigParams: "Valeurs clés de configuration requis sont null ou pas exactement correspondant à des attributs de la couche. Ce message peut apparaître plusieurs fois.",
        invalidLocation: "@fr@ Current location not found.",
        invalidProjection: "@fr@ Unable to plot current location on the map.",
        widgetNotLoaded: "@fr@ Unable to load widgets.",
        shareLoadingFailed: "@fr@ Unable to shorten URL, Bit.ly failed to load.",
        shareFailed: "@fr@ Unable to share.",
        imageDoesNotFound: "@fr@ There are no photo available.",
        facilitydoestfound: "@fr@  No facilities found in buffer area.",
        noCommentAvaiable: "@fr@  No Comment available",
        routeComment: "@fr@ Route could not be calculated from current location.",
        activityNotSelected: "@fr@ Please select activity to search.",
        activityPlannerInvalidToDate: "@fr@ Please select valid To date",
        activityPlannerInvalidFromDate: "@fr@ Please select valid From date",
        activityPlannerInvalidDates: "@fr@ Please select the valid date",
        commentString: "@fr@ Please Enter comment",
        maxLenghtCommentstring: "@fr@ Comment should not exceed 250 characters .",
        commentError: "@fr@ Unable to add comments. Comments table is either absent or does not have write acccess ."
    },
    notUsed: {
        addressDisplayText: "@fr@ Address",
        backToMap: "@fr@ Back to map"
    }
});
