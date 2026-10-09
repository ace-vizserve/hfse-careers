"use client";

import { createClient } from "@/lib/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type FileError, type FileRejection, useDropzone } from "react-dropzone";

const supabase = createClient();

interface FileWithPreview extends File {
  preview?: string;
  errors: readonly FileError[];
}

type UseSupabaseUploadOptions = {
  /**
   * Name of bucket to upload files to in your Supabase project
   */
  bucketName: string;
  /**
   * Folder to upload files to in the specified bucket within your Supabase project.
   *
   * Defaults to uploading files to the root of the bucket
   *
   * e.g If specified path is `test`, your file will be uploaded as `test/file_name`
   */
  path?: string;
  /**
   * Allowed MIME types for each file upload (e.g `image/png`, `text/html`, etc). Wildcards are also supported (e.g `image/*`).
   *
   * Defaults to allowing uploading of all MIME types.
   */
  allowedMimeTypes?: string[];
  /**
   * File extensions accepted alongside the MIME types (e.g `.pdf`).
   *
   * Safari reports an empty `file.type` for files picked from the Files app or
   * iCloud Drive, which fails a MIME-only check. Listing the extension gives
   * those files a way through.
   */
  allowedFileExtensions?: string[];
  /**
   * Maximum upload size of each file allowed in bytes. (e.g 1000 bytes = 1 KB)
   */
  maxFileSize?: number;
  /**
   * Maximum number of files allowed per upload.
   */
  maxFiles?: number;
  /**
   * The number of seconds the asset is cached in the browser and in the Supabase CDN.
   *
   * This is set in the Cache-Control: max-age=<seconds> header. Defaults to 3600 seconds.
   */
  cacheControl?: number;
  /**
   * When set to true, the file is overwritten if it exists.
   *
   * When set to false, an error is thrown if the object already exists. Defaults to `false`
   */
  upsert?: boolean;
};

type UseSupabaseUploadReturn = ReturnType<typeof useSupabaseUpload>;

/**
 * The name a file is stored under. Supabase Storage refuses an object key with
 * anything outside a short ASCII list ("Invalid key"), so a candidate's
 * "RESUMÉ.pdf" or "Vidhya`s CV.pdf" could never upload, however often they
 * retried. Accents are folded to their base letter and anything else outside
 * letters, digits, `.`, `_` and `-` becomes `-`. The page still shows the name
 * as the candidate chose it; only the stored key changes.
 */
export const toStorageName = (name: string) => {
  const dot = name.lastIndexOf(".");
  const [stem, extension] = dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ""];
  const clean = (part: string) =>
    part
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z0-9._-]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "");

  // A name in a script with no ASCII form (Chinese, Thai...) cleans to nothing.
  return `${clean(stem) || "file"}${clean(extension) ? `.${clean(extension)}` : ""}`;
};

/**
 * What the upload error alone cannot say. "Failed to fetch" means no reply at
 * all, which is either the network or a file the browser could not read: on
 * Android a PDF picked from Google Drive that was never downloaded is handed
 * over by name but fails when the upload reads it. Reading the first byte here
 * tells the two apart in the issue log.
 */
const describeFile = async (file: File) => {
  let readable = "yes";
  try {
    await file.slice(0, 1).arrayBuffer();
  } catch (error) {
    readable = `no (${error instanceof Error ? error.name : String(error)})`;
  }
  const online = typeof navigator === "undefined" ? "unknown" : String(navigator.onLine);
  return `size=${file.size} type=${file.type || "none"} readable=${readable} online=${online}`;
};

const useSupabaseUpload = (options: UseSupabaseUploadOptions) => {
  const {
    bucketName,
    path,
    allowedMimeTypes = [],
    allowedFileExtensions = [],
    maxFileSize = Number.POSITIVE_INFINITY,
    maxFiles = 1,
    cacheControl = 3600,
    upsert = true,
  } = options;

  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // `detail` describes the file behind a failure, for the issue log only.
  const [errors, setErrors] = useState<{ name: string; message: string; detail?: string }[]>([]);
  const [successes, setSuccesses] = useState<string[]>([]);
  const [successNames, setSuccessNames] = useState<string[]>([]);

  // Files already handed to Supabase (in flight, uploaded, or failed). Keeps the
  // auto-upload effect from re-sending the same file on every render.
  const attemptedRef = useRef<Set<string>>(new Set());
  // Public URL per uploaded file name, so removing a file also drops its URL.
  const urlByNameRef = useRef<Map<string, string>>(new Map());

  const isSuccess = useMemo(() => {
    if (errors.length === 0 && successes.length === 0) {
      return false;
    }
    if (errors.length === 0 && successes.length === files.length) {
      return true;
    }
    return false;
  }, [errors.length, successes.length, files.length]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      const validFiles = acceptedFiles
        .filter((file) => !files.find((x) => x.name === file.name))
        .map((file) => {
          (file as FileWithPreview).preview = URL.createObjectURL(file);
          (file as FileWithPreview).errors = [];
          return file as FileWithPreview;
        });

      const invalidFiles = fileRejections.map(({ file, errors }) => {
        (file as FileWithPreview).preview = URL.createObjectURL(file);
        (file as FileWithPreview).errors = errors;
        return file as FileWithPreview;
      });

      const newFiles = [...files, ...validFiles, ...invalidFiles];

      setFiles(newFiles);
    },
    [files, setFiles],
  );

  const dropzoneProps = useDropzone({
    onDrop,
    noClick: true,
    accept: allowedMimeTypes.reduce((acc, type) => ({ ...acc, [type]: allowedFileExtensions }), {}),
    maxSize: maxFileSize,
    maxFiles: maxFiles,
    multiple: maxFiles !== 1,
  });

  const uploadFiles = useCallback(
    async (filesToUpload: FileWithPreview[]) => {
      if (filesToUpload.length === 0) {
        return;
      }

      const batchNames = filesToUpload.map((file) => file.name);
      batchNames.forEach((name) => attemptedRef.current.add(name));
      setLoading(true);

      const responses = await Promise.all(
        filesToUpload.map(async (file) => {
          const { error, data } = await supabase.storage
            .from(bucketName)
            .upload(!!path ? `${path}/${toStorageName(file.name)}` : toStorageName(file.name), file, {
              cacheControl: cacheControl.toString(),
              upsert,
            });
          if (error) {
            return { name: file.name, publicUrl: undefined, message: error.message, detail: await describeFile(file) };
          } else {
            const {
              data: { publicUrl },
            } = supabase.storage.from(bucketName).getPublicUrl(data.path);
            return { name: file.name, publicUrl, message: undefined };
          }
        }),
      );

      const uploaded = responses.filter((x) => x.message === undefined);
      uploaded.forEach((x) => urlByNameRef.current.set(x.name, x.publicUrl as string));

      // Only touch these when something actually landed. Setting them
      // unconditionally hands out a new array identity even for a batch that
      // failed outright, and consumers that mirror `successes` into form state
      // read that as "the upload was cleared".
      if (uploaded.length > 0) {
        setSuccessNames((prev) => Array.from(new Set([...prev, ...uploaded.map((x) => x.name)])));
        setSuccesses((prev) => Array.from(new Set([...prev, ...uploaded.map((x) => x.publicUrl as string)])));
      }

      // Only the files in this batch had their outcome re-decided, so an error
      // belonging to a file outside the batch is left untouched.
      setErrors((prev) => [
        ...prev.filter((e) => !batchNames.includes(e.name)),
        ...responses
          .filter((x) => x.message !== undefined)
          .map((x) => ({ name: x.name, message: x.message as string, detail: x.detail })),
      ]);

      setLoading(false);
    },
    [bucketName, path, cacheControl, upsert],
  );

  // Upload as soon as a valid file lands, so there is no second click to miss.
  useEffect(() => {
    if (loading || files.length === 0 || files.length > maxFiles) {
      return;
    }

    const pending = files.filter((file) => file.errors.length === 0 && !attemptedRef.current.has(file.name));

    if (pending.length > 0) {
      void uploadFiles(pending);
    }
  }, [files, loading, maxFiles, uploadFiles]);

  // Manual retry for files whose upload failed. A failed file is never retried
  // automatically, otherwise a persistent error would loop forever.
  const onUpload = useCallback(async () => {
    const failed = files.filter((file) => errors.some((e) => e.name === file.name));
    const targets =
      failed.length > 0
        ? failed
        : files.filter((file) => file.errors.length === 0 && !successNames.includes(file.name));

    targets.forEach((file) => attemptedRef.current.delete(file.name));

    await uploadFiles(targets);
  }, [files, errors, successNames, uploadFiles]);

  const removeFile = useCallback((fileName: string) => {
    attemptedRef.current.delete(fileName);
    const publicUrl = urlByNameRef.current.get(fileName);
    urlByNameRef.current.delete(fileName);

    setFiles((prev) => prev.filter((file) => file.name !== fileName));
    setErrors((prev) => prev.filter((e) => e.name !== fileName));
    setSuccessNames((prev) => prev.filter((name) => name !== fileName));
    if (publicUrl) {
      setSuccesses((prev) => prev.filter((url) => url !== publicUrl));
    }
  }, []);

  useEffect(() => {
    if (files.length === 0) {
      setErrors([]);
    }

    // If the number of files doesn't exceed the maxFiles parameter, remove the error 'Too many files' from each file
    if (files.length <= maxFiles) {
      let changed = false;
      const newFiles = files.map((file) => {
        if (file.errors.some((e) => e.code === "too-many-files")) {
          file.errors = file.errors.filter((e) => e.code !== "too-many-files");
          changed = true;
        }
        return file;
      });
      if (changed) {
        setFiles(newFiles);
      }
    }
  }, [files.length, setFiles, maxFiles]);

  return {
    files,
    setFiles,
    removeFile,
    successes,
    successNames,
    isSuccess,
    loading,
    errors,
    setErrors,
    onUpload,
    maxFileSize: maxFileSize,
    maxFiles: maxFiles,
    allowedMimeTypes,
    ...dropzoneProps,
  };
};

export { useSupabaseUpload, type UseSupabaseUploadOptions, type UseSupabaseUploadReturn };
