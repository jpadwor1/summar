'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import Dropzone, { useDropzone } from 'react-dropzone';
import { Cloud, File, Loader2 } from 'lucide-react';
import { useUploadThing } from '@/lib/useUploadThing';
import { useToast } from './ui/use-toast';
import { useRouter } from 'next/navigation';
import { trpc } from '@/app/_trpc/client';
import { startFileUpload } from '@/lib/actions';

const UploadDropzone = ({ isSubscribed }: { isSubscribed: boolean }) => {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  // const { startUpload } = useUploadThing(
  //   isSubscribed ? 'proPlanUploader' : 'freePlanUploader'
  // );
  const { toast } = useToast();
  const { mutate: startPolling } = trpc.getFile.useMutation({
    onSuccess: (file) => {
      router.push(`/dashboard/${file.id}`);
    },
    retry: true,
    retryDelay: 500,
  });
  const { mutate: createFile } = trpc.getCreateFile.useMutation({
    onSuccess: (file) => {
      router.push(`/dashboard/${file?.id}`);
    },
  });
  const startSimulatedProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return prev;
        }
        return prev + 5;
      });
    }, 500);
    return interval;
  };

  const { open, getRootProps, getInputProps } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    onDrop: (acceptedFiles: File[]) => {
      // Only taking the first file, as multiple is set to false
      setFile(acceptedFiles[0]);
    },
    multiple: false,
    maxFiles: 1,
  });

  return (
    <Dropzone
      multiple={false}
      noClick={true}
      onDrop={async (acceptedFiles: File[]) => {
        setIsUploading(true);
        const progressInterval = startSimulatedProgress();

        // Assuming only the first file is relevant
        const selectedFile = acceptedFiles[0];
        setFile(selectedFile);

        const uploadResult = await startFileUpload({ file: selectedFile });
        if (uploadResult) {
          const { downloadURL } = uploadResult;
          // Use the download URL as needed
          clearInterval(progressInterval);
          setUploadProgress(100);

          createFile({ downloadURL, fileName: selectedFile.name });
          // Call startPolling or any other subsequent action
          startPolling({ downloadURL });

          // Rest of your logic after successful upload
        } else {
          clearInterval(progressInterval);
          setUploadProgress(0);
          setIsUploading(false);
          toast({
            title: 'Something went wrong',
            description: 'Please try again later',
            variant: 'destructive',
          });
        }
      }}
    >
      {({ getRootProps, getInputProps, acceptedFiles }) => (
        <div
          {...getRootProps()}
          className='border h-64 m-4 border-dashed border-gray-300 rounded-lg'
        >
          <div className='flex items-center justify-center w-full h-full'>
            <label
              htmlFor='dropzone-file'
              className='flex flex-col items-center justify-center w-full h-full rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100'
            >
              <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                <Cloud className='h-6 w-6 text-zinc-500 mb-2 ' />
                <p className='mb-2 text-small text-zinc-700'>
                  <span className='font-semibold'>Click to Upload </span>
                  or drag and drop
                </p>
                <p className='text-xs text-zinc-500'>
                  PDF (up to {isSubscribed ? '16MB' : '4MB'})
                </p>
              </div>

              {acceptedFiles && acceptedFiles[0] ? (
                <div className='max-w-xs bg-white flex items-center rounded-md overflow-hidden outline outline-[1px] outline-zinc-200 divide-x divide-zinc-200'>
                  <div className='px-3 py-2 h-full grid place-items-center'>
                    <File className='h-4 w-4 text-blue-500' />
                  </div>
                  <div className='px-3 py-2 h-full text-sm truncate'>
                    {acceptedFiles[0].name}
                  </div>
                </div>
              ) : null}

              {isUploading ? (
                <div className='w-full mt-4 max-w-xs mx-auto'>
                  <Progress
                    value={uploadProgress}
                    className='h-1 w-full bg-zinc-200'
                  />
                  {uploadProgress === 100 ? (
                    <div className='flex gap-1 items-center justify-center text-sm text-zinc-700 text-center pt-2'>
                      <Loader2 className='h-3 w-3 animate-spin ' />
                      Redirecting...
                    </div>
                  ) : null}
                </div>
              ) : null}

              <input
                {...getInputProps()}
                type='file'
                id='dropzone-file'
                className='hidden'
              />
            </label>
          </div>
        </div>
      )}
    </Dropzone>
  );
};

const UploadButton = ({ isSubscribed }: { isSubscribed: boolean }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) setIsOpen(v);
      }}
    >
      <DialogTrigger
        onClick={() => {
          setIsOpen(true);
        }}
        asChild
      >
        <Button>Upload PDF</Button>
      </DialogTrigger>

      <DialogContent>
        <UploadDropzone isSubscribed={isSubscribed} />
      </DialogContent>
    </Dialog>
  );
};

export default UploadButton;
