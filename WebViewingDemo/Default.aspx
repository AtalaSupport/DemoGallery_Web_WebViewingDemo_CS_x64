<%@ Page Title="Home Page" Language="C#" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="WebViewingDemo._Default" %>

<!DOCTYPE />

<html xmlns="http://www.w3.org/1999/xhtml">
<head id="Head1" runat="server">
    <title></title>

    <meta http-equiv="X-UA-Compatible" content="IE=edge" />

    <script src="WebDocViewer/jquery-3.5.1.min.js" type="text/javascript"></script>
    <script src="WebDocViewer/jquery-ui-1.14.0.min.js" type="text/javascript"></script>
    <script src="WebDocViewer/clipboard.min.js" type="text/javascript"></script>
    <script src="WebDocViewer/raphael-min.js" type="text/javascript"></script>
    <script src="WebDocViewer/atalaWebDocumentViewer.js" type="text/javascript"></script>

    <link href="WebDocViewer/jquery-ui-1.14.0.min.css" rel="Stylesheet" type="text/css" />
    <link href="WebDocViewer/atalaWebDocumentViewer.css" rel="Stylesheet" type="text/css" />

    <link href="WebViewingDemoResources/Scripts/Bootstrap.min.css" rel="stylesheet" type="text/css" />
    <link href="WebViewingDemoResources/Scripts/DemoNew.css" rel="stylesheet" type="text/css" />
    <script src="WebViewingDemoResources/Scripts/Initialization.js" type="text/javascript"></script>

    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<form id="form1" runat="server">

    <div class="container" style="width: 900px;" >
        <div class="page-header">
            <div class="row">
                <a href="#" class="pull-right"><img src="WebViewingDemoResources/small_logo.png"></a>
                <div>
                    <h1>Atalasoft Web Document Viewer Demo</h1>
                    <p class="lead">Simple web page that shows how to use and customize Web Document Viewer</p>
                </div>
            </div>
        </div>


        <div class="main-viewer">
            <div id="_demoToolbar"></div>
            <div id="_toolbar1" style="display:inline-block;" class="atala-document-toolbar"></div>
            <div class="inner-viewer">
                <div id="_containerThumbs" class="atala-document-thumbs"></div>
                <div class="clickmeleft"></div>
                <div id="_containerViewer" class="atala-document-viewer"></div>
            </div>
        </div>

        <div id="LoadingGif" class="loadingGif" style="display: none;"></div>
        <div id="results" title="Results" style="display: none; overflow: auto;">
            <div id="resultsText" style="overflow: auto;"></div>
        </div>
    </div>
</form>

</body>
</html>
