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
    showNullValue: "@it@ N/A",
    showApproxString: "@fr@ Approx",
    buttons: {
        okButtonText: "@fr@ OK",
        email: "Email",  // Shown next to icon for sharing the current map extents via email; works with shareViaEmail tooltip
        Facebook: "Facebook",  // Shown next to icon for sharing the current map extents via a Facebook post; works with shareViaFacebook tooltip
        Twitter: "Twitter",
        embedding: "Embedding"// Shown next to icon for sharing the current map extents via a Twitter tweet; works with shareViaTwitter tooltip
    },
    tooltips: {
        searchTooltips: "Rechercher",
        routeTooltips: "@fr@ Driving Directions",
        locateTooltips: "@fr@ Emplacement actuel",
        shareTooltips: "@fr@ Partager",
        helpTooltips: "Aide",
        eventsTooltips: "@fr@ My List",
        clearEntryTooltips: "@fr@ Clear",
        hidePanelTooltips: "@fr@ Hide panel",
        showPanelTooltips: "@fr@ Show panel",
        printButtonooltips: "@fr@ Print",
        closeTooltips: "@fr@ Close",
        clearEntry: "@fr@ Clear",
        search: "@fr@ Search",
        routeForListTooltips: "@fr@ DDriving Directions - List Items",
        addToCalanderForListTooltips: "@fr@ Add to Calendar - List Items",
        printForListTooltips: "@fr@ Print - List Items",
        deleteFromListTooltips: "@fr@ Delete from List",
        addToCalanderTooltips: "@fr@ Add to Calander"
    },
    titles: {
        webpageDisplayText: "@fr@ Copy/Paste HTML into your web page",
        serchResultText: "@fr@ SEARCH RESULT",
        directionText: "@fr@ DIRECTIONS TO",
        galleryText: "@fr@ GALLERY",
        commentText: "@fr@ COMMENT",
        directionCurrentLocationText: "@fr@ My Location",
        directionTextDistance: "@fr@ Distance:",
        directionTextTime: "@fr@ Duration:",
        activityListTabName: "@fr@ My List",
        fromDateText: "@fr@ From Date",
        toDateText: "@fr@ To Date",
        gobuttonText: "@fr@ Go",
        noLegendAvailable: "@fr@ No Legend Available.",
        galleryInfoTitle: "@fr@ Gallery",
        informationTitle: "@fr@ Information",
        commentInfoTitle: "@fr@ Comments",
        backToMapText: "@fr@ BACK TO MAP",
        orderByDate: "@fr@ Order by Date",
        carouselUtilitiesText: "@fr@ utilities",
        addToListTitle: "@fr@ Add to list",
        unifiedSearchTabText: "@fr@Search",
        activitySearchTabText: "@fr@Activity",
        eventSearchTabText: "@fr@Events",
        postComment: "@fr@ Post Comment",
        rating: "@fr@ rating",
        backButton: "@fr@ Back",
        submitButton: "@fr@ Submit",
        postCommentText: "@fr@ Enter comment",
        numberOfFeaturesFoundNearAddress: "@es@ Found ${0} facility(ies) near the address",
        numberOfFoundFeatureNearAddress: "@fr@ Found ${0} facility(ies)",
        numberOfFoundEventsNearAddress: "@fr@ Found ${0} Event",
        facilityInfo: "@fr@ facility info",
        carouselPodToggleButtonText: "@fr@ Result"

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
        activityAlreadyadded: "@fr@ This feature is already added to list",
        errorInQueringLayer: "@fr@ Failed to query Comment layer",
        loadingText: "@fr@ Loading...",
        noLegend: "@fr@ No Legend Available.",
        noBasemap: "@fr@ No Basemap Found",
        feildNotconfigure: "@fr@ Feilds are not configured.",
        geolocationWidgetNotFoundMessage: "@fr@ Geolocation widget is not configured."
    },
    notUsed: {
        addressDisplayText: "@fr@ Address",
        backToMap: "@fr@ Back to map"
    },
    //end of shared nls

    //App nls
    appErrorMessage: {
        webmapTitleError: "@fr Title and/or QueryLayerId parameters in SearchSettings do not match with configured webmap"
    }
    //End of App nls
});
