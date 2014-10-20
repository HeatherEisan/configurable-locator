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
        searchTooltips: "Rechercher",
        routeTooltips: "@fr@ Route",
        locateTooltips: "Emplacement actuel",
        shareTooltips: "Partager",
        helpTooltips: "Aide",
        eventsTooltips: "@fr@ Events",
        clearEntryTooltips: "@fr@ Clear",
        hidePanelTooltips: "@fr@ Hide panel",
        showPanelTooltips: "@fr@ Show panel",
        printButtonooltips: "@fr@ Print",
        closeTooltips: "@it@ Close"
    },
    titles: {
        directionsDisplayText: "@fr@ Directions",
        informationPanelTitle: "@fr@ Information for current map view",
        webpageDisplayText: "@fr@ Copy/Paste HTML into your web page",
        numberOfFeaturesFoundNearAddress: "Found ${0} facility(ies) near the address",
        splashScreenContent: "@fr@ Lorem ipsum dolor sit er elit lamet, consectetaur cillium adipisicing pecu, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Nam liber te conscient to factor tum poen legum odioque civiuda.",
        serchResultText: "@fr@ SEARCH RESULT",
        directionText: "@fr@ DIRECTIONS TO",
        galleryText: "@fr@ GALLERY",
        commentText: "@fr@ COMMENT",
        facitilyPanelAccessFeeText: "@fr@ Access Fee:",
        facitilyPanelHoursOpenForText: "@fr@ Hours Open For:",
        facitilyPanelManagementUnitText: "@fr@ Management Unit:",
        facitilyPanelMarinaText: "@fr@ Facility Type:",
        directionCurrentLocationText: "@fr@ My Location",
        directionTextDistance: "@fr@ Distance:",
        directionTextTime: "@fr@ Duration:",
        activityTabName: "@fr@ Events",
        activityListTabName: "@fr@ My List",
        fromDateText: "@fr@ From Date",
        toDateText: "@fr@ To Date",
        gobuttonText: "@fr@ Go",
        noLegendAvailable: "@fr@ No Legend Available.",
        loadingText: "@fr@ Loading...",
        galleryInfoTitle: "@fr@ Gallery",
        informationTitle: "@fr@ Information",
        commentInfoTitle: "@fr@ Comments",
        backToMapText: "@fr@ BACK TO MAP",
        orderByDate: "@fr@ Order by Date",
        carouselUtilitiesText: "@fr@ utilities",
        addToListTitle: "@fr@ Add to list",
        directionFromText: "@fr@DIRECTIONS from "
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
        commentString: "@fr@ Please enter comment",
        maxLenghtCommentstring: "@fr@ Comment should not exceed 250 characters .",
        commentError: "@fr@ Unable to add comments. Comments table is either absent or does not have write acccess .",
        addedActivities: "@fr@ All activities within specified date range are already added to the My List.",
        activitySerachGeolocationText: "@fr@ Geolocation is not supported in selected browser.",
        portalUrlNotFound: "@fr@ Portal URL cannot be empty",
        activityAlreadyadded: "@fr Activity is already added"
    },
    notUsed: {
        addressDisplayText: "@fr@ Address",
        backToMap: "@fr@ Back to map"
    },
    //end of shared nls

    //App nls
    appErrorMessage: {
        layerTitleError: "@fr Title and/or QueryLayerId parameters in SearchSettings do not match with configured operational layers.",
        titleNotMatching: "@fr Title and/or QueryLayerId parameters in the InfoWindowSettings and SearchSettings do not match.",
        lengthDoNotMatch: "@fr The number of objects in InfoWindowSettings and SearchSettings do not match.",
        webmapTitleError: "@fr Title and/or QueryLayerId parameters in SearchSettings do not match with configured webmap"
    }
    //End of App nls

});
