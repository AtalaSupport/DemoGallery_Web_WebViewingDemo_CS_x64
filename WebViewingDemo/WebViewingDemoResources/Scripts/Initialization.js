var _viewer;
var _thumbs;
var _scanPage = 1;
var _serverUrl = 'WebViewingDemoResources/WebDocumentViewerHandler.ashx';
var _docUrl = '~/WebViewingDemoResources/startup.pdf';
var _thumbsShowing = true;

var _initialViewerWidth;
var _nothumbsViewerWidth;
var _testing;

var _uploads = null;


$(function () {

    try {
        InitializeViewers();

        window.onresize = function() {
			$(".atala-document-viewer").height($(".inner-viewer").height());
			$('.atala-document-thumbs').height($(".inner-viewer").height());
			$('.clickmeleft').height($(".inner-viewer").height());
			$('.clickmeright').height($(".inner-viewer").height());			
        };

        SetupClickBar();

        AddFileToolbar();

       MakeSessionCopyOfDocument();

    } //End Try
    catch (error) {
    console.log(error);
        AppendStatus(error);
    }
});


function InitializeViewers() {
    _viewer = new Atalasoft.Controls.WebDocumentViewer({
        parent: $('#_containerViewer'),
        toolbarparent: $('#_toolbar1'),
        serverurl: _serverUrl,
        allowannotations: true,
        showbuttontext: false,
        forcepagefit: true,
        upload: {
            uploadpath: 'TempSession',
            allowedfiletypes: '.jpg,.pdf,.tif,.tiff,.bmp,.jpeg,.gif,.png',
            allowedmaxfilesize: 10 * 1024 * 1024, // 10MB
            allowmultiplefiles: true,
            allowdragdrop: true,
        },
        tiling: true
    });

    _thumbs = new Atalasoft.Controls.WebDocumentThumbnailer({
            parent: $('#_containerThumbs'),
			serverurl: _serverUrl,			// server handler url to send image requests to
			documenturl: _docUrl, // + _docFile, 	// document url relative to the server handler url
            allowannotations: true,
            viewer: _viewer,
            maxwidth: 180,
            minwidth: 180
		});


    _viewer.bind('fileuploaderror', uploadError);

    function uploadError(e) {
        alert("uploadError...\n" + e.errorinfo);
    }

    _viewer.bind('uploadfinished', uploadDone);

    function uploadDone(e) {
        alert("uploadDone...");
    }

    /// Special means of inserting
    /// we ensure that we take the next item off the _uploads array, insert it
    /// then call ourselves as a callback. In this way, we ensure it's synchronous
    function insertAll(scrollToLast) {
        if (_uploads != null && _uploads.length > 0) {

            var currentFile = _uploads.shift();

            var destIndex = _viewer.getDocumentInfo().count;
            if (destIndex < 0)
            {
                destIndex = 0;
            }

            //console.log("Inserting... \n  fileName: " + currentFile.filepath + "\n  pageCount: " + currentFile.framecount + "\n  index: " + destIndex);

            var srcIndices = makeSrcArray(currentFile.framecount);
            // NOTE we must call ourselves after to do the scroll down

            // There is an error in the logic somewhere - this used to work and now it does not
            _thumbs.document.insertPages(currentFile.filepath, srcIndices, destIndex, function () { insertAll(scrollToLast); });

        } else if (scrollToLast) {
            _uploads = null;
            //console.log("srolling to last page");
            var currentPageCount = _thumbs.getDocumentInfo().count;
            if (currentPageCount > 0) {
                _thumbs.selectThumb(currentPageCount - 1, false, function () { _thumbs.scrollToThumb(currentPageCount - 1); });
            }
        } else {
            _uploads = null;
            console.log("done inserting - no scroll detected");
        }
    }

    _viewer.bind({
        'error': onError,
        'documentsaved': onDocumentSaved,
        'documentloaded': onDocumentLoaded,
        'fileaddedtoupload': onFileAdded,
        'fileuploaderror': uploadError,
		uploadfinished: function (eventObj) {
		    //alert('UPLOAD FINISHED');
		    
            // the following code will upon upload complete attempt to select and scroll to the last thumb in the viewer
		    var currentPageCount = _thumbs.getDocumentInfo().count;
		    //if (currentPageCount < 1) {
		    //    // open first, then insert
		    //    if (_uploads != null && _uploads.length > 0) {
		    //        var currentFile = _uploads.shift();
		    //        console.log("OPENING: " + currentFile.filepath)
		    //        _thumbs.openUrl(currentFile.filepath, '', function (){ insertAll(true); });
		    //    }
		    //} else {
		    //   insertAll(true);
            //}
            if (_uploads != null && _uploads.length > 0) {
                var currentFile = _uploads.shift();
                _thumbs.openUrl(currentFile.filepath, '', function () { insertAll(true); });
            }
		},
		fileuploadfinished: function (eventObj) {
		    alert('FILE UPLOAD FINISHED: ' + eventObj.customData.uploadedFilenath);
		    if (_uploads == null) {
		        // EMPTY, so start over
		        _uploads = new Array();
	        }
		    _uploads.push({ filepath:eventObj.customData.uploadedFilename, framecount:eventObj.customData.uploadedFrameCount })
		},
		beforehandlerrequest: function (eventObj) {
		    // this event fires just before we make a server side request
		    // we can put special things here where we need to set some extra data in the rquests

		    if (eventObj.request.type === 'fileupload') {
		        // for the file upload we are going to set a "seed" 
                // which wil be a guid to let us ensure users files don't collide with each other
		        eventObj.request.data.seed = guid();
            }
        }
	});


    function uploadError(e) {
        alert("uploadError...\n" + e.errorinfo);
    }

	$('body').bind('beforeunload', function() {
		_viewer.zoom(1);
		_thumbs.zoom(1);
	});


    // This is where we set up the defaults for the annotations we want to draw on click
	_viewer.annotations.setDefaults([
    {
        type: 'line',
        outline: { color: '#f00', opacity: 0.80, width: 15, endcap: { width: 'wide', height: 'long', style: 'block'} }
    },
    {
        type: 'freehand',
        outline: { color: '#00f', opacity: 0.80, width: 15 }
    },
    {
        type: 'text',
        text: { value: 'Double-click to change text', align: 'left', font: { color: '#009', family: 'Times New Roman', size: 36} },
        outline: { color: '#00a', opacity: 0.80, width: 1 },
        fill: { color: '#ff9', opacity: 1 }
    },
    {
        type: 'rectangle',
        fill: { color: 'black', opacity: 1 }
    }]);

    // This enables the stamp annotations
    _viewer.annotations.setStamps([
    {
        'name': 'Approved',
        'fill': {
            'color':'white',
            'opacity': 0.50
        },
        'outline': {
            'color': 'green',
            'width': 15
        },
        'text': {
            'value': 'APPROVED',
            'align': 'center',
            'font': {
                'bold': false,
                'color': 'green',
                'family': 'Georgia',
                'size': 64
            }
        }
    },
        {
            'name': 'Rejected',
            'fill': {
                'color': 'white',
                'opacity': 0.50
            },
            'outline': {
                'color': 'red',
                'width': 15
            },
            'text': {
                'value': 'REJECTED',
                'align': 'center',
                'font': {
                    'bold': false,
                    'color': 'red',
                    'family': 'Georgia',
                    'size': 64
                }
            }
        }    
    ]);


    //Don't show the ellipse annotation.
    $('.atala-ui-icon-ellipse').parent().css('display', 'none');

    //Don't show the multi-lines annotations.
    $('.atala-ui-icon-lines').parent().css('display', 'none');

    //Hide entries on the context menu when not appropriate.
    _viewer.bind('contextmenu', function (event, anno, menu) {
        if (anno.type === 'stamp')
            delete menu['Properties'];
    }); 

    SetViewerWidth();
}


// MUST return false to avoid a postback
function SaveFile() {
    burnAllAnnos();
    // we are passing in the save directory for these temp files
    _viewer.save('Saved');
    return false;
}


/// This function will handle the upload
function uploadFile() {
    var files = [];
    for (var i = 0; i < document.getElementsByName('fileUpload')[0].files.length; i++) {
        files.push(document.getElementsByName('fileUpload')[0].files[i]);
    }
    
    // adding filtering so that we trigger the file added event for error reporting
    var filteredFiles = _viewer.filterFilesForUpload(files, null, null);
    _viewer.uploadFiles(filteredFiles);

    return false;
}


// Sets properties needed to Burn all annotations on a single page
function burnAllAnnosOnPage(pageIndex) {
    var annos = _viewer.getAnnotationsFromPage(pageIndex);
    if (annos != null) {
        for (var i = 0; i < annos.length; i++) {
            var anno = annos[i];
            anno.burn = true;
            anno.update();
        }
    }
}

// Sets properties needed to burn all annos on all pages
function burnAllAnnos() {
    var pageCount = _viewer.getDocumentInfo().count;
    if (pageCount != null && pageCount > 0) {
        for (var i = 0; i < pageCount; i++) {
            burnAllAnnosOnPage(i);
        }
    }
}

// This is needed because the insertPages call needs an array of indices
// so we pass in a number of pages to generate the needed src indicies array
function makeSrcArray(count) {
    var returnArray = new Array();
    for (var i = 0; i < count; i++) {
        returnArray.push(i);
    }
    return returnArray;
}

function onError(e) {
    _testing = e.message;
    alert('Error: ' + e.name + '\n' + e.message);
}

// This will handle the file added event
function onFileAdded(eventObj) {
    if (!eventObj.success) {
        switch (eventObj.reason) {
            case 1:
                alert("The size of file exceeds 1 Mb permitted.");
                break;
            case 2:
                alert("Prohibited file type.");
                break;
            case 3:
                alert("File with same name is already added to upload. ");
                break;
        }

    }
}

// The save is only used in this app as part of "print" so save will
// always end with us attempting to open the file that was saved
function onDocumentSaved(e) {
    if (e.success) {
        var request = $.ajax({
            url: 'WebViewingDemoResources/ProcessingHandler.ashx',
            data: {
                request: "PrintDocument",
                document: e.fileName,
            },
            dataType: 'json',
            success: function (data, status) {
                if (data.success != 'true') {
                    alert(data.error);
                }
                else {
                    var str = data.file;
                    var n = str.replace("~", "");
                    // Code change added to fix issue with Google Chrome not auto printing anymore
                    var win = window.open(n, 'Print');
                    win.focus();
                    win.print();
                }
            }
        });
    }
}


function onDocumentLoaded(e) {
}



function AddFileToolbar() {   
    var toolbar = $('<div />');

    toolbar.append(AddFileBrowseInput());
    toolbar.append(AddFileUploadButton());
    toolbar.append(AddClearViewerButton());
    toolbar.append(AddPrintButton());
    $('#_demoToolbar').append(toolbar);
}

function AddFileBrowseInput() {
    var browserThing = $('<input type="file" multiple="true" name="fileUpload" style="display: inline-block;" class="ui-button ui-widget ui-state-default ui-corner-all atala-ui-button" />');
    return browserThing;
}

function AddFileUploadButton() {
    var uploadButton = $('<button id="btn_upload" title="Upload File" style="display: inline-block;" class="ui-button ui-widget ui-state-default ui-corner-all atala-ui-button" role="button">Upload File</button>');
    uploadButton.click(uploadFile);
    return uploadButton;
}

function AddClearViewerButton() {
    var uploadButton = $('<button id="btn_clear" title="Clear Viewer" style="display: inline-block;" class="ui-button ui-widget ui-state-default ui-corner-all atala-ui-button" role="button">Clear Viewers</button>');
    uploadButton.click(clearViewers);
    return uploadButton;
}


function AddPrintButton() {
    var printButton = $('<button id="btn_saveDocument" title="Print" style="display: inline-block;" class="ui-button ui-widget ui-state-default ui-corner-all  atala-ui-button" role="button">Print</button>');
    printButton.click(SaveFile);
    printButton.button({
        icons: { primary: 'atala-ui-icon atala-ui-icon-save-document' }, text: true
    });
    
    return printButton;
}


function clearViewers() {
    _thumbs.OpenUrl('', '');
    // CRITICAL - if you do not return false it causes a postback!
    return false;
}

function SetupClickBar() {

    var clickBar = $(".clickmeleft");

    clickBar.click(function (event) {

        var mainThumbs = $(".atala-document-thumbs");

        if (_thumbsShowing) {
            mainThumbs.animate({ width: '0px' }, 500, function () {
                mainThumbs.hide();
                $(".atala-document-viewer").animate({ width: _nothumbsViewerWidth }, 250, function () { });
            });
            _thumbsShowing = false;
            clickBar.removeClass("clickmeleft");
            clickBar.removeClass("clickmehoverleft");
            clickBar.addClass("clickmeright");
        }
        else {
            mainThumbs.show();
            mainThumbs.animate({ width: '130px' }, 500);
            _thumbsShowing = true;
            $(".atala-document-viewer").css("width", _initialViewerWidth);
            clickBar.removeClass("clickmeright");
            clickBar.removeClass("clickmehoverright");
            clickBar.addClass("clickmeleft");
        }
    });

    clickBar.hover(
        function () {
            if (_thumbsShowing)
                clickBar.addClass("clickmehoverleft");
            else
                clickBar.addClass("clickmehoverright");
        },
        function () {
            if (_thumbsShowing)
                clickBar.removeClass("clickmehoverleft");
            else
                clickBar.removeClass("clickmehoverright");
        }
    );

}

function SetViewerWidth() {

    var totalWidth = parseInt($('.main-viewer').css('width'), 10);
    var thumbsWidth = parseInt($(".atala-document-thumbs").css('width'), 10);
    var clickWidth = parseInt($(".clickmeleft").css('width'), 10);

    _initialViewerWidth = totalWidth - (thumbsWidth + clickWidth + 3);
    _nothumbsViewerWidth = totalWidth - clickWidth - 2;
    $('.atala-document-viewer').css('width', _initialViewerWidth);

}

function ShowLoadingGif(gif) {

    var viewer = $('.atala-document-viewer');
    var pos = viewer.position();
    var w = viewer.width();
    var h = viewer.height();

    var dim = $('.dimwrapper');
    dim.show();
    dim.css("left", (pos.left - 7));
    dim.css("top", (pos.top + 1));
    dim.css("height", h);
    dim.css("width", w);
    dim.css("background-color", "#424242");
    dim.css("opacity", 0.75);

    gif.show();
    gif.css("left", ((pos.left + w / 2) - 55));
    gif.css("top", ((pos.top + h / 2) - 55));
    gif.css("height", h);
    gif.css("width", w);
}


function MakeSessionCopyOfDocument() {

    var request = $.ajax({
        url: 'WebViewingDemoResources/ProcessingHandler.ashx',
        data: {
            request: "InitializeDocument",
            document: _docUrl
        },
        cache: false,
        dataType: 'json',
        success: function (data, status) {
            if (data.success != 'true') {
                alert(data.error);
            }
            else {
                _docUrl = data.file;
                _thumbs.openUrl(_docUrl, '');
            }
        }
    });
}

function AppendStatus(error){
    console.log(error);
    alert(error);
}

/*
 * The s4 and guid functions are used to provide a reasonably random value to ensure that print file names
 * are not "guessable" and will not collide with other print file names.
 * "Not guessable" is important since in order for the print to work the PDF needs to be reachable by browser
 * feel free to use your own and/or also add the users sessionID to the values if you wish.
 */
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
     .toString(16)
     .substring(1);
};

function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

