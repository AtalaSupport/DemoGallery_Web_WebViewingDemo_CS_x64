using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.IO;
using System.Web.Script.Serialization;
using Atalasoft.Imaging;
using Atalasoft.Imaging.Codec;
using Atalasoft.Imaging.Codec.Pdf;

namespace WebViewingDemo
{
    /// <summary>
    /// Summary description for PrintHandler
    /// </summary>
    public class ProcessingHandler : IHttpHandler
    {
        public void ProcessRequest(HttpContext context)
        {
            // This will be the default dict  - so we are guaranteed a valid dict to use
            // regardless of what happens in the action methods
            Dictionary<string, object> returnDict = new Dictionary<string, object>();

            try
            {
                // in our app, we ALWAYS set "request: someString" indicating what operation we want to pefromr
                string foo = context.Request["request"];
                switch (context.Request["request"])
                {
                    case "InitializeDocument":
                        returnDict = InitializeDocument(context);
                        break;
                    case "PrintDocument":
                        returnDict = MakePrintPdf(context);
                        break;
                    case "DownloadDocument":
                        returnDict = MakeDownloadDoc(context);
                        break;
                    default:
                        throw new ArgumentException("request is either missing or does not match any existing service.");
                }
            }
            catch (Exception ex)
            {
                // if any exception happens that is somehow not handled elsewhere, this will 
                // set a false success and pass the error back
                returnDict.Clear();
                returnDict.Add("success", "false");
                returnDict.Add("error", ex.ToString());
            }

            //Don't cache.
            context.Response.Cache.SetCacheability(HttpCacheability.NoCache);
            context.Response.Cache.SetNoStore();

            //Write response.
            var serializer = new JavaScriptSerializer();
            context.Response.Write(serializer.Serialize(returnDict));
        }



        /// <summary>
        /// Needed for interface compliance
        /// </summary>
        public bool IsReusable
        {
            get
            {
                return false;
            }
        }

        #region ActionMethods
        /// <summary>
        /// This method is called to make a temp working copy of the current document
        /// It's useful for multi user applications where you must ensure a document is uniquely named
        /// </summary>
        /// <param name="context"></param>
        /// <returns></returns>
        private Dictionary<string, object> InitializeDocument(HttpContext context)
        {
            Dictionary<string, object> returnDict = new Dictionary<string, object>();

            string document = context.Request["document"];

            try
            {
                string saveDocPath = NewTempFileName(Path.GetExtension(document));
                string mappedDocPath = HttpContext.Current.Request.MapPath(document);
                string mappedSaveDocPath = HttpContext.Current.Request.MapPath(saveDocPath);

                saveDocPath = saveDocPath.Replace('\\', '/');

                File.Copy(mappedDocPath, mappedSaveDocPath, true);
                File.SetAttributes(mappedSaveDocPath, FileAttributes.Normal);

                returnDict.Add("success", "true");
                returnDict.Add("file", saveDocPath);

                return returnDict;
            }
            catch (Exception ex)
            {
                returnDict.Add("success", "false");
                returnDict.Add("error", ex.ToString());

                return returnDict;
            }
        }

        /// <summary>
        /// This is the method that will generate a self-printing PDF which is handy for .. printing
        /// </summary>
        /// <param name="context"></param>
        /// <returns></returns>
        private Dictionary<string, object> MakePrintPdf(HttpContext context)
        {
            // We will provide a dictionary to json to serialize as the response.
            Dictionary<string, object> returnDict = new Dictionary<string, object>();

            // old save just passed dowucment
            // but 10.7 bug needs a bit of a workaround
            //string document = context.Request["document"];
            string document = context.Request["document"];

            try
            {
                string saveDocPath = NewTempFileName(".pdf");
                string mappedDocPath = HttpContext.Current.Request.MapPath(document);
                string mappedSaveDocPath = HttpContext.Current.Request.MapPath(saveDocPath);

                saveDocPath = saveDocPath.Replace('\\', '/');

                //File.Copy(mappedDocPath, mappedSaveDocPath, true);
                using (Stream documentOut = File.Create(mappedSaveDocPath))
                {
                    using (FileSystemImageSource burnedDocument = new FileSystemImageSource(mappedDocPath, true))
                    {
                        PdfEncoder encoder = new PdfEncoder();
                        encoder.CreateSelfPrintingPdf = true;
                        encoder.Save(documentOut, burnedDocument, null);
                    }
                }

                File.SetAttributes(mappedSaveDocPath, FileAttributes.Normal);

                returnDict.Add("success", "true");
                returnDict.Add("file", saveDocPath);
            }
            catch (Exception ex)
            {
                returnDict.Add("success", "false");
                returnDict.Add("error", ex.ToString());
            }

            TryClean(document);
            return returnDict;
        }

        private Dictionary<string, object> MakeDownloadDoc(HttpContext context)
        {
            // We will provide a dictionary to json to serialize as the response.
            Dictionary<string, object> returnDict = new Dictionary<string, object>();

            // old save just passed dowucment
            // but 10.7 bug needs a bit of a workaround
            //string document = context.Request["document"];
            string document = context.Request["document"].Replace(".pdf", ".tif");

            string saveFolder = context.Request["saveFolder"];
            string saveFormat = context.Request["saveFormat"];

            // expects ".pdf" or ".tif" etc...
            string newfile = NewTempFileName(saveFormat);

            string savedDocDir = saveFolder + "/" + Path.GetDirectoryName(document).Replace("\\", "/");
            //string savedDocDir = Path.GetDirectoryName(document).Replace("/", "");

            try
            {
                using (Stream documentOut = File.Create(HttpContext.Current.Request.MapPath(newfile)))
                using (FileSystemImageSource burnedDocument = new FileSystemImageSource(HttpContext.Current.Request.MapPath(savedDocDir + document), true))
                {
                    switch (saveFormat)
                    {
                        case ".tif":
                            TiffEncoder tiffEnc = new TiffEncoder();
                            tiffEnc.Save(documentOut, burnedDocument, null);
                            break;
                        case ".pdf":
                            PdfEncoder pdfEnc = new PdfEncoder() { SizeMode = PdfPageSizeMode.FitToPage };
                            pdfEnc.Save(documentOut, burnedDocument, null);
                            break;
                        default:
                            throw new System.NotImplementedException("No handler exists for desired saveFormat: " + saveFormat);
                            break;
                    }

                }

                returnDict.Add("file", newfile);
                returnDict.Add("success", "true");
            }
            catch (Exception ex)
            {
                returnDict.Add("success", "false");
                returnDict.Add("error", ex.ToString());
            }

            TryClean(document);
            return returnDict;
        }
        #endregion ActionMethods


        #region UtilityMethods
        /// <summary>
        /// tries to remove a document and its xml and returns a status
        /// 
        /// the status will only ever return false if it hit an actual exception 
        /// this means that if it tried to remove a file that is not there, it will 
        /// return success since the end goal is to make sure the file is not there and 
        /// in such a case, that is already true.
        /// </summary>
        /// <param name="documentPath"></param>
        /// <param name="xmpPath"></param>
        /// <returns></returns>
        private bool TryClean(string documentPath, string xmpPath = null)
        {
            try
            {
                string fullDocPath = HttpContext.Current.Request.MapPath(documentPath);

                if (File.Exists(fullDocPath))
                {
                    File.Delete(fullDocPath);
                }

                if (xmpPath != null)
                {
                    if (File.Exists(HttpContext.Current.Request.MapPath(xmpPath)))
                    {
                        File.Delete(HttpContext.Current.Request.MapPath(xmpPath));
                    }
                }

                try
                {
                    string savedPath = @"Saves\"; //Probably should find a better place to have this (web.config? Passed with each web call?)

                    string savedPathDoc = HttpContext.Current.Request.MapPath(Path.Combine(savedPath, Path.GetFileName(fullDocPath)));
                    string savedPathXmp = Path.Combine(Path.GetDirectoryName(savedPathDoc), Path.GetFileNameWithoutExtension(savedPathDoc) + ".xmp");

                    if (File.Exists(savedPathDoc))
                    {
                        File.Delete(savedPathDoc);
                    }

                    if (File.Exists(savedPathXmp))
                    {
                        File.Delete(savedPathXmp);
                    }
                }
                catch (Exception) { }

                File.Delete(HttpContext.Current.Request.MapPath(documentPath));
                return !File.Exists(HttpContext.Current.Request.MapPath(documentPath));
            }
            catch (Exception)
            {
                return false;
            }
        }

        ///// <summary>
        ///// Very app-specific ... in this app we will use a "TempSession" directory and when we need
        ///// a temporary file for some reason, we will make up a new filename and return it
        ///// 
        ///// NOTE: this does not create any file and it returns the WEB PATH within this app not
        ///// the ABSOLUTE PATH on disk - when you need the absolute path somewhere, use
        ///// HTTPContext.Current.Request.MapPath() method to map it (context.Request.MapPath() if you have been
        ///// passed a HTTPContext)
        ///// </summary>
        ///// <param name="ext"></param>
        ///// <returns>string containing a temp filename</returns>
        private string NewTempFileName(string ext = "")
        {
            string tempDir = string.Empty;

            try
            {
                //tempDir = ConfigurationManager.AppSettings["TempDirectory"];
                tempDir = "~/WebViewingDemoResources/TempSession/";
            }
            catch (Exception)
            {
                //Don't do anything.
            }

            return Path.Combine(tempDir, Guid.NewGuid().ToString() + ext);
        }
        #endregion UtilityMethods
    }
}