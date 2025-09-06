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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Photo</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Choose a photo to upload</p>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                id="photo-upload"
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
                          // First try smart mode with moderate tolerance
                          processedBlob = await backgroundRemover.removeBackground(file, {
                            tolerance: 45,
                            preserveInternalWhite: true,
                            mode: 'smart'
                          });
                        } catch (error) {
                          console.log('Manual mode failed, trying color mode');
                          processedBlob = await backgroundRemover.removeBackground(file, {
                            tolerance: 35,
                            preserveInternalWhite: true,
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
              
              <label 
                htmlFor="photo-upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Choose File
              </label>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
              Maximum file size: 10MB. Only image files are allowed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}