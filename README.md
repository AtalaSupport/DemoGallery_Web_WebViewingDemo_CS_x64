# Web Viewing Demo
Atalasoft's flagship HTML5 WebDocumentViewer and WebDocumentThumbnailer controls for viewing and annotation of documents  WebDocumentViewer API Reference.

## Licensing
This application as configured, requires at minimum DotImage Document Imaging as well as a license for our PdfReader addon, or a valid eval on the machine where you are building and running.  

If you do not have  PdfReader license, you can adjust the app to not require it (and lose the ability to open PDFs) by modifying the WebDocViewerHandler.ashx codebehind. To do so, comment out the following line and rebuild:

```csharp
RegisteredDecoders.Decoders.Add(new PdfDecoder() { Resolution = 200, RenderSettings = new RenderSettings() { AnnotationSettings = AnnotationRenderSettings.RenderNone } });
```


If you are using PDFs and you wish to burn annotations, you must also have a licnse for our DotPdf (separate from PdfReader), or a valid evaluation, or else saving with the burn flag true will fail.

> **NOTE**
> Developer licenses (Serials without an X in the first group) are for use on your local development machine only, and will display an error that they are to be used for development and testing on local host only if you access from any other URL than a localhost.  
> 
> You will need to use a sever license (a serial that has an X in the first group) activated for your machine if you wish to visit the server via any other URL ( such as http://yourMachineName/YourApp/ ).
> 
> Also note that running in a local copy of IIS (see below), you will need to place a valid license file/files for the components you're using into the application bin directory. This is not needed for using IIS Express as that picks up your Developer Licenses from their default location.  


## SDK Dependencies
This app was built based on 2026.2.0.0. It targets .NET Framework 4.6.2 and was created in Visual Studio 2022. However, it's fairly backward compatible as distributed. If you start adding references, you can run into issues if you're using an especially outdated version of DotImage. It should also open and run equally well in Visual Studio 2026 without undue modification.  

### SDK Installed Locally (Default)
Regardless, it assumes you have installed a valid copy of Atalasoft DotImage in the default location. If you have multiple versions installed, you may want to go to the Project Properties and visit the References tab to adjust the references folder. Defaults point to:  

`C:\Program Files (x86)\Atalasoft\DotImage 2026.2\bin\4.6.2\x64`

#### Web Resources
As this is a web application, it also requires our client side web resources. Again, this app was built on 2026.2.0.0, thus we've already included the needed resources in the WebDocViewer folder. If you need to back down to a different version, you must ensure both the references and WebDocViewer resources are updated.

These Resources are distributed with our SDK and can be found under:  
`C:\Program Files (x86)\Atalasoft\DotImage 2026.2\bin\WebResources\WebDocViewer`  

Additionally, if the resources for the version you're targeting differ from the versions we ship, you must modify the head section of the Default.aspx page accordingly. This is the content that is valid for 11.5.0.x - 2026.2.x.

```html
<head runat="server">
    <title>Simple Web Document Viewer with WebDocument Thumbnailer and Annotations</title>

    <script src="WebDocViewer/jquery-3.5.1.min.js" type="text/javascript"></script>
    <script src="WebDocViewer/jquery-ui-1.14.0.min.js" type="text/javascript"></script>
    <script src="WebDocViewer/raphael-min.js" type="text/javascript"></script>
    <script src="WebDocViewer/clipboard.min.js" type="text/javascript"></script>
    <script src="WebDocViewer/atalaWebDocumentViewer.js" type="text/javascript"></script>

    <link href="WebDocViewer/jquery-ui-1.14.0.min.css" rel="Stylesheet" type="text/css" />
    <link href="WebDocViewer/atalaWebDocumentViewer.css" rel="Stylesheet" type="text/css" />
</head>
```

> **NOTE**  
> The order these files are loaded in makes a difference - please do not alter the order. The version shipped along with a given DotImage SDK represents the current minimum. You MAY find you can update to use newer but please test thorougly. We fully QA and regersion test against the specific versions we ship with for the given version of DotImage at the time of release.  

### Using NuGet for SDK Dependencies
We do publish our SDK components to NuGet. We have chosen to base the demo on local installed SDK because this leads to much smaller applications (NuGet packages add a lot of overhead due to the way they're packaged and deployed, and many of our demos -- including this one -- are often used to reproduce issues that need to be submitted to support. Apps that use NuGet are often significantly larger and run up against our maximum support case upload size)

Still, if you wish to use NuGet for the dependencies instead of relying on locally installed SDK, you can.

- Take note of each of the references we've included:
    - Atalasoft.dotImage.dll
    - Atalasoft.dotImage.Lib.dll
    - Atalasoft.dotImage.WebControls.dll
    - Atalasoft.dotImage.PdfDoc.Bridge.dll
    - Atalasoft.dotImage.PdfReader.dll
    - Atalasoft.PdfDoc.dll
    - Atalasoft.Shared.dll
- Remove those referneces
- Open the NuGet Package Manger from `Tools -> NuGet Package Manager -> Manage NuGet Packages for this Solution`
- Browse for Atalasoft.DotImage.WebControls.x64
- Install this package, and it will pull in most of what is needed
- You may need to browse additionally for Atalasoft.DotImage.PdfReader.x64
- If you want the clientside resources, you'll want to browse next for Atalasoft.Web.Document.Viewer
    - NOTE that if you install from the NuGet for this, you will then need to adjust all of the WebDocViewer links as NuGet uses a different folder structure (see above)

### Web Server
#### IIS Express (Default)
This app was built using the built in IIS Express web server in VS2022. The defaults should "Just work" but it should be noted that we referenced our x64 assemblies, and thus you must make sure that your [IIS Express is running in 64 bit mode](https://www.atalasoft.com/kb2/KB/50051/HOWTO-IISExpress-in-64-bit-32-bit). If you need to run in 32 bit mode, you'll also need to remove the existing references and re-reference our X86 dlls (Shipped with the SDK as well)

When running in IIS Express, the default licensing (mentioned previously) should suffice.

#### Local IIS
You are of course, welcome to convert it to run in a local copy of IIS.

You must ensure you have it set up for the app pool to run x64 (app pool Advanced Properties and ensure that "Enable 32-bit applications" is **UNCHECKED**).  

You must also copy your licenses from
`C:\users\YOUR_USERNAME\ApPData\Local\Atalasoft\DotImage 2026.2\`
into the bin directory of the application

Please see the section on licensing above for additional discussion.


## Cloning this repository
To use this repro just use:  

```
git clone https://github.com/AtalaSupport/DemoGallery_Wev_WebViewingDemo_CS_x64.git WebViewingDemo
```

If you've got DotImage 2026.2 installed and licensed, it should just build and run.  

## Related documentation
In addition to this README, the Atalasoft documentation set includes the following:  
- API Reference (.chm file) gives the complete Atalasoft WingScan server-side class library for offline use. The latest versions are linked on [Atalasoft's APIs & Developer Guides page](https://www.atalasoft.com/Support/APIs-Dev-Guides).
- In addition, you can also refer to the following Atalasoft resources:
    - [Atalasoft Support](http://www.atalasoft.com/support/)
    - [Atalasoft Knowledgebase](http://www.atalasoft.com/kb2)
- [WDV Clientside API Reference](https://atalasoft.github.io/web-document-viewer/) applies to the client side (JavaScript) components.


## Getting Help for Atalasoft products
Atalasoft regularly updates our support [Knowledgebase](http://www.atalasoft.com/kb2) with the latest information about our products. To access some resources, you must have a valid Support Agreement with an authorized Atalasoft Reseller/Partner or with Atalasoft directly. Use the tools that Atalasoft provides for researching and identifying issues. 

Customers with an active evaluation, or those with active support / maintenance may [create a support case](https://www.atalasoft.com/Support/my-portal/Cases/Create-Case) 24/7, or call in to support ([+1 949 236-6510](tel:19492366510) ) during our normal support hours (Monday - Friday 8:00am to 5:00PM Eastern (New York) time).  

Customers who are unable to create a case or call in may [email our Sales Team](email:sales@atalasoft.com).  

