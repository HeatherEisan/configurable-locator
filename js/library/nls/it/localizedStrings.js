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
    showApproxString: "@it@ Approx",
    buttons: {
        okButtonText: "@it@ OK",
        email: "@it@ Email",  // Shown next to icon for sharing the current map extents via email; works with shareViaEmail tooltip
        Facebook: "Facebook",  // Shown next to icon for sharing the current map extents via a Facebook post; works with shareViaFacebook tooltip
        Twitter: "Twitter",
        embedding: "Embedding"  // Shown next to icon for sharing the current map extents via a Twitter tweet; works with shareViaTwitter tooltip
    },
    tooltips: {
        searchTooltips: "Cerca",
        routeTooltips: "@it@ Driving Directions",
        locateTooltips: "Posizione corrente",
        shareTooltips: "Condividi",
        helpTooltips: "Guida",
        eventsTooltips: "@it@ My List",
        clearEntryTooltips: "@it@ Clear",
        hidePanelTooltips: "@it@ Hide panel",
        showPanelTooltips: "@it@ Show panel",
        printButtonTooltips: "@it@ Print",
        closeTooltips: "@it@ Close",
        clearEntry: "@it@ Clear",
        search: "@it@ Search",
        carouselPodToggleButtonShowTooltips: "@it@ Show",
        carouselPodToggleButtonHideTooltips: "@it@ Hide",
        routeForListTooltips: "@it@ Driving Directions - List Items",
        addToCalanderForListTooltips: "@it@ Add to Calendar - List Items",
        printForListTooltips: "@it@ Print - List Items",
        deleteFromListTooltips: "@it@ Delete from List",
        addToCalanderTooltips: "@it@ Add to Calendar",
        galleryInfoTooltips: "@it@ Gallery",
        informationTooltips: "@it@ Information",
        commentInfoTooltips: "@it@ Comments",
        addToListTooltips: "@it@ Add to My List"
    },
    titles: {
        webpageDisplayText: "@it@ Copy/Paste HTML into your web page",
        searchResultText: "@it@ Search Result",
        directionText: "@it@ Directions to",
        galleryText: "@it@ Gallery",
        commentText: "@it@ Comment",
        directionCurrentLocationText: "@it@ My Location",
        directionTextDistance: "@it@ Distance:",
        directionTextTime: "@it@ Duration:",
        activityListTabName: "@it@ My List",
        fromDateText: "@it@ From Date",
        toDateText: "@it@ To Date",
        goButtonText: "@it@ Go",
        facilityInfo: "@it@ Facility Info",
        noLegendAvailable: "@it@ No Legend Available",
        backToMapText: "@it@ Back to Map",
        orderByDate: "@it@ Order by Date",
        carouselUtilitiesText: "@it@ Utilities",
        addToListTitle: "@it@ Add to List",
        postComment: "@it@ Post Comment",
        rating: "@it@ Rating",
        backButton: "@it@ Back",
        submitButton: "@it@ Submit",
        postCommentText: "@it@ Enter Comment",
        numberOfFeaturesFoundNearAddress: "@it@ Found ${0} facility(ies) near the address",
        numberOfFoundFeatureNearAddress: "@it@ Found ${0} facility(ies)",
        numberOfFoundEventsNearAddress: "@it@ Found ${0} Event",
        infoWindowTextURL: "@it@ More info"
    },
    errorMessages: {
        invalidSearch: "Nessun risultato trovato.",
        falseConfigParams: "Valori chiave di configurazione obbligatori sono null o non esattamente corrispondenti con gli attributi di livello. Questo messaggio può apparire più volte.",
        invalidLocation: "@it@ Current location not found.",
        invalidProjection: "@it@ Unable to plot current location on the map.",
        widgetNotLoaded: "@it@ Unable to load widgets.",
        shareLoadingFailed: "@it@ Unable to shorten URL, Bit.ly failed to load.",
        shareFailed: "@it@ Unable to share.",
        imageDoesNotFound: "@it@ There are no photo available.",
        facilitydoestfound: "@it@  No facilities found in buffer area.",
        noCommentAvaiable: "@it@  No Comment available",
        routeComment: "@it@ Route could not be calculated from current location.",
        activityNotSelected: "@it@ Please select activity to search.",
        activityPlannerInvalidToDate: "@it@ Please select valid To date",
        activityPlannerInvalidFromDate: "@it@ Please select valid From Date",
        activityPlannerInvalidDates: "@it@ Please select the valid Date",
        commentString: "@it@ Please enter comment",
        maxLenghtCommentstring: "@it@ Comment should not exceed 250 characters .",
        commentError: "@it@ Unable to add comments. Comments table is either absent or does not have write acccess .",
        addedActivities: "@it@ All activities within specified date range are already added to the My List.",
        activitySerachGeolocationText: "@it@ Geolocation is not supported in selected browser.",
        portalUrlNotFound: "@it@ Portal URL cannot be empty",
        activityAlreadyadded: "@it@ This feature is already added to list",
        errorInQueringLayer: "@it@ Failed to query Comment layer",
        loadingText: "@it@ Loading...",
        noLegend: "@it@ No Legend Available.",
        noBasemap: "@it@ No Basemap Found",
        feildNotconfigure: "@it@ Feilds are not configured.",
        geolocationWidgetNotFoundMessage: "@it@ Geolocation widget is not configured.",
        routeDoesNotCreate: "@it@ Unable to route to these addresses",
        enablePodSettingsInConfig: "@it@ Please enable the PodSettings in Config."
    },
    notUsed: {
        addressDisplayText: "@it@ Address",
        backToMap: "@it@ Back to Map"
    },
    //end of shared nls

    //App nls
    appErrorMessage: {
        webmapTitleError: "@it@ Title and/or QueryLayerId parameters in SearchSettings do not match with configured webmap"
    }
    //End of App nls
});
