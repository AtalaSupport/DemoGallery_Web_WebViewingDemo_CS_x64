using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Atalasoft.Imaging.WebControls;
using Atalasoft.Imaging.Codec.Pdf;
using Atalasoft.Imaging.Codec;
using System.IO;
using System.Collections.Concurrent;

namespace WebViewingDemo
{
    /// <summary>
    /// Summary description for WebDocumentViewerHandler
    /// </summary>
    public class WebDocumentViewerHandler : WebDocumentRequestHandler
    {
        // This is a special storage we will be using to map client files back to file names
        private readonly ConcurrentDictionary<string, string> _renamedFilesMap = new ConcurrentDictionary<string, string>();

        static WebDocumentViewerHandler()
        {
            RegisteredDecoders.Decoders.Add(new PdfDecoder() { Resolution = 200, RenderSettings = new RenderSettings() { AnnotationSettings = AnnotationRenderSettings.None } });
        }

        public WebDocumentViewerHandler()
        {
            this.FileUpload += WebDocumentViewerHandler_FileUpload;
            this.FileUploaded += WebDocumentViewerHandler_FileUploaded;
            this.FileUploadResponseSend += WebDocumentViewerHandler_FileUploadResponseSend;
        }

        #region New File Upload Stuff
        /*The new file upload stuff unfortunately does not make unique file names on its own
         * so we need to take care to upload files with unique names (using GUIDS)
         * 
         * The thing is we don't want to TRUST the client data 100% either
         * so we pas in a 'seed' in the request that is a GUID the clientside made
         * we ahve stored a file with a GUID known only server side as part of its name
         * so there's now a file
         * 
         *     uploadDir\GUID_OriginalFileName.foo
         *     
         * To do this we need to handle the 
         *  FileUpload (to redirect the incoming file to a stream of our choice and store the temp file name)
         *  FileUploaded (To properly close the stream once done)
         *  FileUPloadResponseSend (to pass the stored file name back to the client (and also clear it from the stored list))
         */


        /// <summary>
        /// We are taking the original file name and parsing it a bit differently in order that we make
        /// uploadDir\GUID_FileName.foo
        /// This is because we need to make this backward compatible with the old upload that used a third party
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        void WebDocumentViewerHandler_FileUpload(object sender, FileUploadEventArgs e)
        {
            /// NOTE: if you are not using FileUpload in your solution
            /// you want to handle this FileUPload event and set e.Cancel to true
            /// This is best practice for security as it prevents any possibility of uploads
            /// However in this demo, we're using the feature so we must turn it on explicitly
            /// NOTE that cancel can be used to abort an upload if connditions are not right
            e.Cancel = false;
            // first ensure there is a seed, that it's non empty and that it's not already in the map
            if (!e.Params.Keys.Contains("seed") || e.Params["seed"] == null || e.Params["seed"] == "" || _renamedFilesMap.ContainsKey(e.Params["seed"]))
            {
                e.Cancel = true;
                throw new Exception("bad seed - No can do");
            }
            else
            {
                // we are not relying on the user provided data for the GUID - we will generate our own
                string newFileName = string.Format("{0}{1}", Guid.NewGuid().ToString(), Path.GetExtension(e.FileName));

                // storing our new filename mapping somwhere we can go fetch it back later
                _renamedFilesMap.TryAdd(e.Params["seed"], Path.Combine(e.SaveFolder, newFileName));

                // upload path nees to be mapped to a full real file for the destination stream
                string uplodPath = HttpContext.Current.Request.MapPath(e.SaveFolder);

                // provides the actual file stream to the secure and unique file name
                e.DestinationStream = new FileStream(Path.Combine(uplodPath, newFileName), FileMode.Create);
            }
        }


        /// <summary>
        /// Just responsibly closing the stream here .. we ahve a direct handle on the stream so no need to dig into 
        /// _renamedFilesMap
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        void WebDocumentViewerHandler_FileUploaded(object sender, FileUploadedEventArgs e)
        {
            if (e.DestinationStream != null)
            {
                e.DestinationStream.Close();
                e.DestinationStream.Dispose();
            }

        }


        /// <summary>
        /// This final step retrieves the unique GUID filename from the _renamedFilesMap and deletes it before 
        /// passing the uploaded file name back to the client, finishing the responses
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        void WebDocumentViewerHandler_FileUploadResponseSend(object sender, ResponseSendEventArgs e)
        {
            string value;

            // we will attempt to fetch the correct file for the passed in seed and add that filename
            // to our custom respnse - we will return empty string if we fail
            if (_renamedFilesMap.TryRemove(e.Params["seed"], out value))
            {
                e.CustomResponseData.Add("uploadedFilename", value);
                e.CustomResponseData.Add("uploadedFrameCount", countFrames(value).ToString());
            }
            else
            {
                e.CustomResponseData.Add("uploadedFilename", "");
                e.CustomResponseData.Add("uploadedFrameCount", "0");
            }

        }

        private int countFrames(string value)
        {
            int returnCount = 0;
            string mappedPath = HttpContext.Current.Request.MapPath(value);
            if (File.Exists(mappedPath))
            {
                using (FileStream fs = new FileStream(mappedPath, FileMode.Open, FileAccess.Read, FileShare.Read))
                {
                    returnCount = RegisteredDecoders.GetImageInfo(fs).FrameCount;
                }
            }
            return returnCount;

        }
        #endregion New File Upload Stuff

    }
}