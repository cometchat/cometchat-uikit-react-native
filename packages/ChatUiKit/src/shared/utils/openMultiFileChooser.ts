import { NativeModules, Platform } from 'react-native';
import { DEFAULT_MAX_ATTACHMENT_COUNT } from '../modals/AttachmentPickerConfiguration';

const { FileManager } = NativeModules;

export type PickedFile = {
  uri: string;
  name: string;
  type: string;
  size: number;
};

export async function openMultiFileChooser(
  pickerType: 'media' | 'document' | 'camera' | 'audio',
  existingCount: number,
  maxAttachmentCount?: number,
  allowedMimeTypes?: string[],
  allowMultipleSelection?: boolean
): Promise<PickedFile[]> {
  const max = maxAttachmentCount ?? DEFAULT_MAX_ATTACHMENT_COUNT;

  // allowMultipleSelection === false → cap the pick at ONE file. Otherwise: how many MORE files this pick
  // may add (server count limit − already staged), clamped to ≥ 1 so the native media picker always gets a
  // valid cap even at capacity. Only the MEDIA picker honors the cap natively (iOS PHPicker.selectionLimit,
  // Android 13+ EXTRA_PICK_IMAGES_MAX); doc/audio pickers ignore it, so mapAndFilter also trims to 1 below.
  const singleSelect = allowMultipleSelection === false;
  const remaining = singleSelect ? 1 : Math.max(1, max - existingCount);

  // The picker ALWAYS opens (no at-capacity block, so the Attach button never feels broken). We return
  // the FULL picked set — the composer's acceptPickedAttachments REJECTS the whole over-limit pick and
  // shows the §6.3 count toast; that reject-all is the hard enforcement for pickers the OS can't cap.

  try {
    if (pickerType === 'camera') {
      const file = await openCameraNative();
      if (!file) return [];
      return mapAndFilter([file], allowedMimeTypes, allowMultipleSelection);
    }

    if (pickerType === 'media') {
      // Both platforms support multi-select: Android uses gallery picker, iOS uses PHPickerViewController
      const files = await openFileChooserMultiNative('image', remaining);
      return mapAndFilter(files, allowedMimeTypes, allowMultipleSelection);
    }

    if (pickerType === 'audio') {
      // Multi-select audio: iOS document picker (public.audio), Android ACTION_OPEN_DOCUMENT (audio/*).
      // Both already set allowsMultipleSelection / EXTRA_ALLOW_MULTIPLE natively.
      const files = await openFileChooserMultiNative('audio', remaining);
      return mapAndFilter(files, allowedMimeTypes, allowMultipleSelection);
    }

    // document — multi-select on both platforms via openFileChooserMulti
    const files = await openFileChooserMultiNative('file', remaining);
    return mapAndFilter(files, allowedMimeTypes, allowMultipleSelection);
  } catch {
    return [];
  }
}

function openCameraNative(): Promise<PickedFile | null> {
  return new Promise(resolve => {
    if (Platform.OS === 'ios') {
      FileManager.openCamera('image', (result: any) => {
        resolve(toPickedFile(result));
      });
    } else {
      FileManager.openCamera('image', 50, (result: any) => {
        resolve(toPickedFile(result));
      });
    }
  });
}

function openFileChooserMultiNative(fileType: string, maxSelection: number): Promise<PickedFile[]> {
  return new Promise(resolve => {
    FileManager.openFileChooserMulti(fileType, maxSelection, (result: any) => {
      if (!result) { resolve([]); return; }
      const items: any[] = Array.isArray(result) ? result : [result];
      resolve(
        items
          .filter((f: any) => f && !f.error && f.uri)
          .map((f: any) => toPickedFile(f)!)
      );
    });
  });
}

function toPickedFile(f: any): PickedFile | null {
  if (!f || f.error || !f.uri) return null;
  // Prefer local file copy (fileCopyUri) over content URI so the SDK gets a stable file:// path
  const uri = (f.fileCopyUri ?? f.uri) as string;
  return {
    uri,
    name: f.name ?? 'file',
    type: f.type ?? 'application/octet-stream',
    size: f.size ?? 0,
  };
}

function mapAndFilter(
  files: PickedFile[],
  allowedMimeTypes?: string[],
  allowMultipleSelection?: boolean
): PickedFile[] {
  let out = files.filter(f => f.uri.length > 0);

  if (allowedMimeTypes && allowedMimeTypes.length > 0) {
    out = out.filter(f => allowedMimeTypes.includes(f.type));
  }

  // allowMultipleSelection === false → single-file pick. The media picker enforces this via its cap; the
  // OS doc/audio pickers can't be capped to 1, so keep only the first file here.
  if (allowMultipleSelection === false) {
    out = out.slice(0, 1);
  }

  // §6.1 — NO size gate here. Per-file size is server-authoritative and enforced by the SDK
  // (a file over file.size.max is rejected with ERR_FILE_SIZE_EXCEEDED → onFileRejected). There is
  // NO combined/batch total cap — size is validated per file, never as a message total.

  return out;
}
