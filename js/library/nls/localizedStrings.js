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
    root: {
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
            closeTooltips: "Close",
            clearEntry: "Clear",
            search: "Search"
        },
        titles: {
            directionsDisplayText: "Area of Interest",
            informationPanelTitle: "Information for current map view",
            webpageDisplayText: "Copy/Paste HTML into your web page",
            numberOfFeaturesFoundNearAddress: "Found ${0} facility(ies) near the address",
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
            facilityInfo: "facility info",
            postComment: "Post Comment",
            rating: "rating",
            backButton: "Back",
            submitButton: "Submit",
            postCommentText: "Enter comment",
            loadingText: "Loading...",
            galleryInfoTitle: "Gallery",
            informationTitle: "Information",
            commentInfoTitle: "Comments",
            backToMapText: "BACK TO MAP",
            orderByDate: "Order by Date",
            carouselUtilitiesText: "utilities",
            eventsINMylist: "Events in MyList",
            numberOfFoundFeatureNearAddress: "Found ${0} facility(ies)",
            numberOfFoundEventsNearAddress: "Found ${0} Event",
            addToListTitle: "Add to list"
        },
        errorMessages: {
            invalidSearch: "No results found",
            falseConfigParams: "Required configuration key values are either null or not exactly matching with layer attributes. This message may appear multiple times.",
            invalidLocation: "Current location not found.",
            invalidProjection: "Unable to plot current location on the map.",
            widgetNotLoaded: "Unable to load widgets.",
            shareLoadingFailed: "Unable to shorten URL, Bit.ly failed to load.",
            shareFailed: "Unable to share.",
            invalidBasemapQuery: "Invalid BasemapQuery",
            noBasemap: "No Basemap Found",
            imageDoesNotFound: "No photos available.",
            facilitydoestfound: "No facilities found in buffer area.",
            noCommentAvaiable: "No comments available.",
            routeComment: "Route could not be calculated from current location.",
            activityNotSelected: "Please select activity to search.",
            activityPlannerInvalidToDate: "Please select valid To Date",
            activityPlannerInvalidFromDate: "Please select valid From Date",
            activityPlannerInvalidDates: "Please select the valid date",
            commentString: "Please enter comment",
            maxLenghtCommentstring: "Comment should not exceed 250 characters .",
            commentError: "Unable to add comments. Comments table is either absent or does not have write acccess .",
            addedActivities: "All activities within specified date range are already added to the My List.",
            activitySerachGeolocationText: "Geolocation is not supported in selected browser.",
            portalUrlNotFound: "Portal URL cannot be empty",
            activityAlreadyadded: "Activity is already added",
            errorInQueringLayer: "Failed to query Comment layer",
            loadingText: "Loading...",
            noLegend: "No Legend Available."
        }
    },
    es: true,
    fr: true,
    it: true
});
