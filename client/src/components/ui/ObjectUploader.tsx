import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { BackgroundRemover } from "@/utils/backgroundRemoval";

// Note: Uppy CSS will be imported in the component that uses DashboardModal

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
  enableBackgroundRemoval?: boolean;
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
  enableBackgroundRemoval = false,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() => {
    console.log('Creating Uppy instance...');
    return new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: ['image/*'], // Only allow images for profile photos
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: async () => {
          console.log('Getting upload parameters...');
          const result = await onGetUploadParameters();
          console.log('Upload parameters received:', result);
          return result;
        },
      })
      .on("complete", (result) => {
        console.log('Upload complete:', result);
        onComplete?.(result);
        setShowModal(false); // Close modal after upload
      })
      .on("error", (error) => {
        console.error('Upload error:', error);
      });
  });

  return (
    <div>
      <Button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowModal(true);
        }} 
        className={buttonClassName}
        type="button"
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

      {showModal && (
        <div style={{ zIndex: 9999, position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '20px', borderRadius: '8px', minWidth: '400px' }}>
            <h3>Photo Upload</h3>
            <p>Upload your photo here</p>
            <input 
              type="file" 
              accept="image/*" 
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  console.log('File selected:', file.name);
                  
                  let fileToUpload = file;
                  
                  // Apply background removal if enabled
                  console.log('Background removal check:', enableBackgroundRemoval);
                  if (enableBackgroundRemoval) {
                    try {
                      console.log('Starting background removal process...', {
                        fileName: file.name,
                        fileSize: file.size,
                        fileType: file.type
                      });
                      
                      // Ensure the file is an image
                      if (!file.type.startsWith('image/')) {
                        console.warn('File is not an image, skipping background removal');
                      } else {
                        const backgroundRemover = new BackgroundRemover();
                        console.log('BackgroundRemover instance created');
                        
                        // Try multiple approaches for better background removal
                        let processedBlob;
                        try {
                          // First try manual mode with high tolerance
                          processedBlob = await backgroundRemover.removeBackground(file, {
                            tolerance: 80,
                            preserveInternalWhite: false,
                            mode: 'manual'
                          });
                        } catch (error) {
                          console.log('Manual mode failed, trying color mode');
                          processedBlob = await backgroundRemover.removeBackground(file, {
                            tolerance: 60,
                            preserveInternalWhite: false,
                            mode: 'color'
                          });
                        }
                        
                        console.log('Background removal completed successfully', {
                          originalSize: file.size,
                          processedSize: processedBlob.size
                        });
                        
                        // Create processed file for upload
                        fileToUpload = new File([processedBlob], file.name.replace(/\.[^.]+$/, '.png'), {
                          type: 'image/png'
                        });
                        console.log('Processed file created for upload');
                      }
                    } catch (error) {
                      console.error('Background removal failed:', error);
                      if (error instanceof Error) {
                        console.error('Error details:', {
                          message: error.message,
                          stack: error.stack
                        });
                      }
                      // Continue with original file if background removal fails
                      console.log('Continuing with original file due to background removal failure');
                    }
                  } else {
                    console.log('Background removal disabled for this upload');
                  }
                  
                  onGetUploadParameters().then((params) => {
                    console.log('Got upload params:', params);
                    // Upload the processed file
                    fetch(params.url, {
                      method: 'PUT',
                      body: fileToUpload,
                      headers: { 'Content-Type': fileToUpload.type }
                    }).then(response => {
                      if (response.ok) {
                        console.log('Upload successful!');
                        const uploadURL = params.url.split('?')[0];
                        onComplete?.({ successful: [{ uploadURL }] } as any);
                        setShowModal(false);
                      } else {
                        console.error('Upload failed:', response.status);
                      }
                    }).catch(error => {
                      console.error('Upload error:', error);
                    });
                  });
                }
              }}
            />
            <br />
            <button onClick={() => setShowModal(false)} style={{ marginTop: '10px' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}