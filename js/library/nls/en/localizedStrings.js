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
    showNullValue: "N/A",
    buttons: {
        okButtonText: "OK",
        link: "Link",
        email: "Email",  // Shown next to icon for sharing the current map extents via email; works with shareViaEmail tooltip
        Facebook: "Facebook",  // Shown next to icon for sharing the current map extents via a Facebook post; works with shareViaFacebook tooltip
        Twitter: "Twitter",
        embedding: "Embedding"// Shown next to icon for sharing the current map extents via a Twitter tweet; works with shareViaTwitter tooltip
    },
    tooltips: {
        searchTooltips: "Search",
        routeTooltips: "Route",
        locateTooltips: "Locate",
        shareTooltips: "Share",
        helpTooltips: "Help",
        eventsTooltips: "Events",
        clearEntryTooltips: "Clear",
        hidePanelTooltips: "Hide panel",
        showPanelTooltips: "Show panel",
        printButtonooltips: "Print",
        closeTooltips: "Close"
    },
    titles: {
        directionsDisplayText: "Area of Interest",
        informationPanelTitle: "Information for current map view",
        webpageDisplayText: "Copy/Paste HTML into your web page",
        splashScreenContent: "Lorem ipsum dolor sit er elit lamet, consectetaur cillium adipisicing pecu, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Nam liber te conscient to factor tum poen legum odioque civiuda.",
        serchResultText: "SEARCH RESULT",
        directionText: "DIRECTIONS TO",
        galleryText: "GALLERY",
        commentText: "COMMENT",
        facitilyPanelAccessFeeText: "Access Fee:",
        facitilyPanelHoursOpenForText: "Hours Open For:",
        facitilyPanelManagementUnitText: "Management Unit:",
        facitilyPanelMarinaText: "Facility Type:",
        directionCurrentLocationText: "My Location",
        directionTextDistance: "Distance:",
        directionTextTime: "Duration:",
        activityTabName: "Events",
        activityListTabName: "My List",
        fromDateText: "From Date",
        toDateText: "To Date",
        gobuttonText: "Go",
        noLegendAvailable: "No Legend Available.",
        loadingText: "Loading...",
        galleryInfoTitle: "Gallery",
        informationTitle: "Information",
        commentInfoTitle: "Comments",
        backToMapText: "BACK TO MAP",
        orderByDate: "Order by Date",
        carouselUtilitiesText: "utilities",
        addToListTitle: "Add to list",
        directionFromText: "DIRECTIONS from "
    },
    errorMessages: {
        invalidSearch: "No results found",
        falseConfigParams: "Required configuration key values are either null or not exactly matching with layer attributes. This message may appear multiple times.",
        invalidLocation: "Current location not found.",
        invalidProjection: "Unable to project current location on map.",
        widgetNotLoaded: "Unable to load widgets.",
        shareLoadingFailed: "Unable to load share options.",
        shareFailed: "Unable to share.",
        imageDoesNotFound: "There are no photo available.",
        facilitydoestfound: "No facilities found in buffer area.",
        noCommentAvaiable: "No Comment available",
        activityPlannerInvalidToDate: "Please select valid To date",
        activityPlannerInvalidFromDate: "Please select valid From date",
        activityPlannerInvalidDates: "Please select the valid date",
        commentString: "Please Enter comment",
        maxLenghtCommentstring: "Comment should not exceed 250 characters .",
        commentError: "Unable to add comments. Comments table is either absent or does not have write acccess .",
        addedActivities: "All activities within specified date range are already added to the My List.",
        activitySerachGeolocationText: "Geolocation is not supported in selected browser.",
        portalUrlNotFound: "Portal URL cannot be empty",
        activityAlreadyadded: "Activity is already added"
    },
    notUsed: {
        addressDisplayText: "Address",
        backToMap: "Back to map"
    },
    //end of shared nls

    //App nls
    appErrorMessage: {
        layerTitleError: "Title and/or QueryLayerId parameters in SearchSettings do not match with configured operational layers.",
        titleNotMatching: "Title and/or QueryLayerId parameters in the InfoWindowSettings and SearchSettings do not match.",
        lengthDoNotMatch: "The number of objects in InfoWindowSettings and SearchSettings do not match.",
        webmapTitleError: "Title and/or QueryLayerId parameters in SearchSettings do not match with configured webmap"
    }
    //End of App nls
});
