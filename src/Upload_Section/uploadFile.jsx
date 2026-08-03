import { useState, useRef } from "react";
import { buildApiUrl } from "../api.js";
import "./uploadFile.css";


function UploadFile({ showModal, onClose, onUploadSuccess}) {
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [closing, setClosing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);

  const [selectedFiles, setSelectedFiles] = useState([]);

  const clearFile = () => {
    setSelectedFiles([]);
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
    if (selectedFiles.length === 0) {
      return "↥";
    }

    if (selectedFiles.length > 1) {
      return "📚";
    }

    const ext = getFileExtension(selectedFiles[0]);

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
    const files = Array.from(event.target.files || []);

    const validFiles = files.filter((file) => validateFile(file));

    setSelectedFiles(validFiles);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);

    const droppedFiles = Array.from(event.dataTransfer.files || []);

    const validFiles = droppedFiles.filter((file) => validateFile(file));

    setSelectedFiles(validFiles);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const uploadSingleFile = (fileToUpload, fileIndex, totalFiles) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", fileToUpload);

      const xhr = new XMLHttpRequest();

      xhr.open("POST", buildApiUrl("/files/ingest"));

      const token = localStorage.getItem("nexo_token");

      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const singleFilePercent = event.loaded / event.total;
          const totalPercent = Math.round(
            ((fileIndex + singleFilePercent) / totalFiles) * 100
          );

          setProgress(totalPercent);
        }
      };

      xhr.onload = () => {
        let responseData = null;

        try {
          responseData = JSON.parse(xhr.responseText);
        } catch {
          responseData = {
            error: xhr.responseText || "Invalid upload response",
          };
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(responseData);
        } else {
          reject(
            new Error(
              responseData?.error ||
              responseData?.detail ||
              `Upload failed with status ${xhr.status}`
            )
          );
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error while uploading file"));
      };

      xhr.send(formData);
    });
  };

  const uploadToBackend = async () => {
    if (isUploading) {
      return;
    }

    if (selectedFiles.length === 0) {
      alert("No file selected");
      return;
    }

    setIsUploading(true);

    const totalFiles = selectedFiles.length;
    const uploadedResults = [];

    for (let index = 0; index < selectedFiles.length; index++) {
      const currentFile = selectedFiles[index];

      const fileBaseProgress = Math.round((index / totalFiles) * 100);
      setProgress(fileBaseProgress);

      try {
        const result = await uploadSingleFile(currentFile, index, totalFiles);

        uploadedResults.push({
          file: currentFile,
          result,
        });

        if (onUploadSuccess) {
          onUploadSuccess(currentFile, result);
        }
      } catch (error) {
        console.error("Upload failed:", currentFile.name, error);

        if (onUploadSuccess) {
          onUploadSuccess(currentFile, {
            file: currentFile.name,
            success: false,
            error: error.message || "Upload failed",
          });
        }
      }
    }

    setIsUploading(false);
    setProgress(100);

    closeModal(true);
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
              onClick={() => closeModal()}
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

            {selectedFiles.length > 0 && (
              <div className="upload-file-name">
                {selectedFiles.length} file(s) selected:
                <ul className="upload-file-list">
                  {selectedFiles.map((file) => (
                    <li key={`${file.name}-${file.size}`}>
                      {file.name}
                    </li>
                  ))}
                </ul>
              </div>
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
            <button className="upload-cancel-btn" onClick={() => closeModal()} disabled={isUploading}>
              Cancel
            </button>

            <button
              className="upload-done-btn"
              onClick={uploadToBackend}
              disabled={isUploading || selectedFiles.length === 0}
            >
              {isUploading ? "Uploading..." : "Done"}
            </button>
          </div>

          <input
            type="file"
            multiple
            accept={acceptedFileTypes}
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />
        </div>
      </div>
    </div>
  );
}

export default UploadFile;