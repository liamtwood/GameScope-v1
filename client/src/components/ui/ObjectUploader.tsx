import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 * 
 * The component uses Uppy under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL).
 *   Typically used to fetch a presigned URL from the backend server for direct-to-S3
 *   uploads.
 * @param props.onComplete - Callback function called when upload is complete. Typically
 *   used to make post-upload API calls to update server state and set object ACL
 *   policies.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: ['image/*'], // Only allow images for profile photos
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("complete", (result) => {
        onComplete?.(result);
        setShowModal(false); // Close modal after upload
      })
  );

  return (
    <div>
      <Button 
        onClick={() => {
          console.log('Photo upload button clicked!');
          setShowModal(true);
        }} 
        className={buttonClassName}
      >
        {children}
      </Button>

      <style>{`
        .uppy-Dashboard-dropFilesHereHint,
        .uppy-Dashboard-browse,
        .uppy-DashboardAddFiles-info,
        .uppy-DashboardAddFiles-title,
        .uppy-Dashboard-dropFilesTitle,
        .uppy-Dashboard-dropFilesIcon,
        .uppy-Dashboard-AddFiles-title,
        .uppy-Dashboard-AddFiles-info {
          display: none !important;
        }
        .uppy-Dashboard-AddFiles {
          padding: 20px !important;
        }
        .uppy-Dashboard-AddFiles-browse {
          margin: 0 !important;
        }
      `}</style>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
        note=""
        hideUploadButton={false}
        hideRetryButton={false}
        hidePauseResumeButton={false}
        hideCancelButton={false}
        hideProgressAfterFinish={false}
        doneButtonHandler={() => setShowModal(false)}
        disableLocalFiles={false}
        plugins={['webcam']}
        locale={{
          strings: {
            browse: 'Select files',
            browseFiles: 'Select files',
            addMore: 'Add more files',
            importFrom: 'Import from %{name}',
            dashboardWindowTitle: 'Upload files',
            dashboardTitle: 'Upload files',
            copyLinkToClipboardSuccess: 'Link copied to clipboard.',
            copyLinkToClipboardFallback: 'Copy the URL below',
            fileSource: 'File source: %{name}',
            done: 'Done',
            localDisk: 'Local Disk',
            myDevice: 'My Device',
            folderAdded: {
              0: 'Added %{smart_count} file from %{folder}',
              1: 'Added %{smart_count} files from %{folder}'
            }
          }
        }}
      />
    </div>
  );
}