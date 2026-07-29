import { useState, useRef } from "react";
import "./uploadFile.css";

function UploadFile({ showModal, onClose, onUploadSuccess}) {
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [closing, setClosing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);

  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);

  const clearFile = () => {
    setFileName("");
    setFile(null);
    setProgress(0);
    setIsUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const closeModal = (
    forceClose = false
  ) => {
    if (
      isUploading &&
      !forceClose
    ) {
      return;
    }
  
    setClosing(true);
  
    window.setTimeout(() => {
      setClosing(false);
      clearFile();
      onClose?.();
    }, 200);
  };

  const allowedExtensions =
  new Set([
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
  ]);

const acceptedFileTypes =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx";

const getFileExtension = (
  selectedFile
) => {
  return (
    selectedFile?.name
      ?.split(".")
      .pop()
      ?.toLowerCase() || ""
  );
};

  const maxSize = 10 * 1024 * 1024;

  const validateFile = (
    selectedFile
  ) => {
    const extension =
      getFileExtension(
        selectedFile
      );
  
    if (
      !allowedExtensions.has(
        extension
      )
    ) {
      alert(
        "Supported files: PDF, DOC, DOCX, XLS, XLSX, PPT and PPTX."
      );
  
      return false;
    }
  
    if (
      selectedFile.size >
      maxSize
    ) {
      alert(
        "File must be under 10MB."
      );
  
      return false;
    }
  
    return true;
  };

  const getFileIcon = () => {
    if (!fileName) return "↥";

    const ext = fileName.split(".").pop().toLowerCase();

    if (ext === "pdf") return "📄";
    if (ext === "doc" || ext === "docx") return "📝";
    if (ext === "xls" || ext === "xlsx") return "📊";
    if (ext === "ppt" || ext === "pptx") return "📑";

    return "📁";
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    if (validateFile(selectedFile)) {
      setFileName(selectedFile.name);
      setFile(selectedFile);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);

    const droppedFile = event.dataTransfer.files[0];
    if (!droppedFile) return;

    if (validateFile(droppedFile)) {
      setFileName(droppedFile.name);
      setFile(droppedFile);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const uploadToBackend = async () => {
    if (isUploading) {
      return;
    }

    if (!file) {
      alert("No file selected");
      return;
    }

    setIsUploading(true);
    setProgress(1);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    xhr.open("POST", "http://localhost:5000/api/files/ingest");

    const token = localStorage.getItem("nexo_token");

    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setProgress(percent);
      }
    };

    xhr.onload = async () => {
      let responseData = {};
    
      try {
        responseData =
          JSON.parse(
            xhr.responseText ||
              "{}"
          );
      } catch (error) {
        console.error(
          "Failed to parse upload response:",
          error
        );
      }
    
      if (
        xhr.status >= 200 &&
        xhr.status < 300
      ) {
        setProgress(100);
    
        try {
          await onUploadSuccess?.(
            file,
            responseData
          );
    
          setIsUploading(false);
    
          /*
            forceClose avoids the old
            isUploading state closure.
          */
          closeModal(true);
        } catch (error) {
          console.error(
            "Upload success callback failed:",
            error
          );
    
          setIsUploading(false);
    
          alert(
            "The file uploaded, but the Canvas note could not be created."
          );
        }
    
        return;
      }
    
      setIsUploading(false);
      setProgress(0);
    
      console.error(
        "Upload failed:",
        responseData ||
          xhr.responseText
      );
    
      alert(
        responseData?.error ||
          xhr.responseText ||
          "Upload failed."
      );
    };

    xhr.onerror = () => {
      setIsUploading(false);
      console.error("Upload failed");
      alert("Upload failed");
    };

    xhr.send(formData);
  };

  if (!showModal) {
    return null;
  }

  return (
    <div className="upload-overlay">
      <div className="upload-modal">
        <div className={`upload-modal-card ${closing ? "modal-closing" : ""}`}>
          <div className="upload-modal-header">
            <div className="upload-modal-title-group">
              <h2>Upload Documents</h2>
              <p>Select or drag and drop your files here</p>
            </div>

            <button
              className="upload-close-btn"
              onClick={closeModal}
              aria-label="Close"
              disabled={isUploading}
            >
              ×
            </button>
          </div>

          <div className="upload-divider" />

          <div
            className={`upload-drop-zone ${dragging ? "drag-active" : ""} ${isUploading ? "uploading" : ""}`}
            onClick={isUploading ? undefined : handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="upload-icon-circle">
              <div className="upload-arrow">{getFileIcon()}</div>
            </div>

            <div className="upload-main-text">
              Click to browse or drag and drop
            </div>

            <div className="upload-sub-text">
              PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX (Max 10MB)
            </div>

            {fileName && (
              <div className="upload-file-name">Selected file: {fileName}</div>
            )}

            {progress > 0 && (
              <div className="upload-progress">
                <div
                  className="upload-progress-bar"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>

          <div className="upload-footer">
            <button className="upload-cancel-btn" onClick={closeModal} disabled={isUploading}>
              Cancel
            </button>

            <button
              type="button"
              className="upload-done-btn"
              onClick={uploadToBackend}
              disabled={
                isUploading || !file
              }
            >
              {isUploading
                ? "Uploading..."
                : "Done"}
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept={acceptedFileTypes}
            style={{
              display: "none",
            }}
            onChange={
              handleFileSelect
            }
          />
        </div>
      </div>
    </div>
  );
}

export default UploadFile;