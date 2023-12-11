import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {app} from '@/config/firebase';

export const startFileUpload = async ({ file }: { file: File | null }) => {
  if (!file) {
    alert('No file selected');
    return null;
  }

  const storage = getStorage(app);
  const storageRef = ref(storage, '/files/' + file.name);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    console.log('Uploaded a blob or file!');

    // After a successful upload, get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('File available at', downloadURL);

    return { downloadURL, fileName: file.name }; // Return the download URL on success
  } catch (error) {
    console.error('Error uploading file:', error);
    return null; // Indicating an error occurred
  }
};
