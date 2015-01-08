<%@ WebHandler Language="C#" Class="ICalender" %>

using System;
using System.Web;

public class ICalender : IHttpHandler {
    public void ProcessRequest(HttpContext ctx)
    {
        /*
         * These are the local variables which will grab the parameters from the query string.
         */
        string startDate = ctx.Request.QueryString["startDate"];
        string endDate = ctx.Request.QueryString["endDate"];
        string location = ctx.Request.QueryString["location"];
        string summary = ctx.Request.QueryString["summary"];
        string description = ctx.Request.QueryString["description"];
        string organizer = ctx.Request.QueryString["organizer"];
        string filename = ctx.Request.QueryString["filename"];
        ctx.Response.ContentType = "text/calendar";
        //If file name is nothing then it ICS file should take default file name.
        if (filename == "undefined")
        {
            ctx.Response.AddHeader("Content-disposition", "attachment; filename=event.ics" );
        }
        else
        {
            ctx.Response.AddHeader("Content-disposition", "attachment; filename=" + filename + ".ics");
        }
        ctx.Response.Write("BEGIN:VCALENDAR");
        ctx.Response.Write("\nVERSION:2.0");
        ctx.Response.Write("\nMETHOD:PUBLISH");
        ctx.Response.Write("\nBEGIN:VEVENT");
        //If Organizer is defined then only it will add it to ICS file.
        if (organizer != "")
        {
            ctx.Response.Write("\nORGANIZER:MAILTO:" + organizer);
        }
        // If Start Date and End Date is nothing then it should current Date as a start date and no end date so that it will create all day event.
        if (startDate == "" || endDate == "")
        {
            ctx.Response.Write("\nDTSTART:" + (DateTime.Now.Year + "" + DateTime.Now.Month + "" + DateTime.Now.Day));

        }
        else
        {
            ctx.Response.Write("\nDTSTART:" + startDate);
            ctx.Response.Write("\nDTEND:" + endDate);
        }
        ctx.Response.Write("\nLOCATION:" + location);
        ctx.Response.Write("\nSUMMARY:" + summary);
        ctx.Response.Write("\nDESCRIPTION:" + description);
        ctx.Response.Write("\nPRIORITY:5");
        ctx.Response.Write("\nCLASS:PUBLIC");
        ctx.Response.Write("\nEND:VEVENT");
        ctx.Response.Write("\nEND:VCALENDAR");
        ctx.Response.End();
    }
    public bool IsReusable
    {
        get
        {
            return false;
        }
    }
}