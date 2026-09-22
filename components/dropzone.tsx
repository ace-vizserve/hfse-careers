"use client";

import { Button } from "@/components/ui/button";
import { type UseSupabaseUploadReturn } from "@/hooks/use-supabase-upload";
import { cn } from "@/lib/utils";
import { CheckCircle2Icon, File, FileTextIcon, X } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";
import { createContext, type PropsWithChildren, useCallback, useContext } from "react";

const formatBytes = (
  bytes: number,
  decimals = 2,
  size?: "bytes" | "KB" | "MB" | "GB" | "TB" | "PB" | "EB" | "ZB" | "YB",
) => {
  const k = 1000;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  if (bytes === 0 || bytes === undefined) return size !== undefined ? `0 ${size}` : "0 bytes";
  const i = size !== undefined ? sizes.indexOf(size) : Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

type DropzoneContextType = Omit<UseSupabaseUploadReturn, "getRootProps" | "getInputProps">;

const DropzoneContext = createContext<DropzoneContextType | undefined>(undefined);

type DropzoneProps = UseSupabaseUploadReturn & {
  className?: string;
};

const Dropzone = ({
  className,
  children,
  getRootProps,
  getInputProps,
  ...restProps
}: PropsWithChildren<DropzoneProps>) => {
  const isSuccess = restProps.isSuccess;
  const isActive = restProps.isDragActive;
  const isInvalid =
    (restProps.isDragActive && restProps.isDragReject) ||
    (restProps.errors.length > 0 && !restProps.isSuccess) ||
    restProps.files.some((file) => file.errors.length !== 0);

  return (
    <DropzoneContext.Provider value={{ ...restProps }}>
      <div className="relative">
        <div
          {...getRootProps({
            className: cn(
              "rounded-[9px] border border-[#B9C2D9] bg-[#F7F8FC] px-[18px] py-4 text-center transition-colors duration-300 text-[#10162B]",
              className,
              isSuccess ? "border-solid" : "border-dashed",
              isActive && "border-primary bg-primary/10",
              isInvalid && "border-destructive bg-destructive/10",
            ),
          })}>
          <input {...getInputProps()} />
          {children}
        </div>

        {/* While the file is in flight the drop target is inert, so it blurs
            behind a single spinner rather than showing a per-row one. */}
        {restProps.loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-[9px] bg-white/80 backdrop-blur-xs">
            <Spinner className="size-5 text-[#1E2FA8] opacity-70" />
            <p className="text-[12px] font-medium text-[#4A5273]">Uploading…</p>
          </div>
        )}
      </div>
    </DropzoneContext.Provider>
  );
};
const DropzoneContent = ({ className }: { className?: string }) => {
  const { files, removeFile, onUpload, loading, successNames, errors, maxFileSize, maxFiles, isSuccess } =
    useDropzoneContext();

  const exceedMaxFiles = files.length > maxFiles;

  const handleRemoveFile = useCallback(
    (fileName: string) => {
      removeFile(fileName);
    },
    [removeFile],
  );

  if (isSuccess) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-[9px] border border-[#A9E4CC] bg-[#E7F6EF] px-4 py-3",
          className,
        )}>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#CDEFE1]">
          <CheckCircle2Icon size={18} className="text-[#0B7A4F]" />
        </div>

        <div className="text-start min-w-0 shrink grow">
          <p className="text-[13px] font-semibold text-[#0B7A4F]">Upload complete</p>
          <p className="text-[11px] text-[#0B7A4F]">
            {files.length} file{files.length > 1 ? "s" : ""} uploaded successfully
          </p>
        </div>

        <Button
          type="button"
          variant="link"
          className="shrink-0 text-[#0B7A4F] hover:text-[#075C3B]"
          onClick={() => files.forEach((file) => handleRemoveFile(file.name))}>
          Replace
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {files.map((file, idx) => {
        const fileError = errors.find((e) => e.name === file.name);
        const isSuccessfullyUploaded = successNames.includes(file.name);

        return (
          <div key={`${file.name}-${idx}`} className="flex items-center gap-x-4 border-b py-2 first:mt-4 last:mb-4 ">
            {file.type.startsWith("image/") ? (
              <div className="h-10 w-10 rounded border overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                <img src={file.preview} alt={file.name} className="object-cover" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center">
                <File size={18} />
              </div>
            )}

            <div className="shrink grow flex flex-col items-start truncate">
              <p title={file.name} className="text-sm truncate max-w-full">
                {file.name}
              </p>
              {file.errors.length > 0 ? (
                <p className="text-xs text-destructive">
                  {file.errors
                    .map((e) =>
                      e.message.startsWith("File is larger than")
                        ? `File is larger than ${formatBytes(maxFileSize, 2)} (Size: ${formatBytes(file.size, 2)})`
                        : e.message,
                    )
                    .join(", ")}
                </p>
              ) : loading && !isSuccessfullyUploaded ? (
                <p className="text-xs text-muted-foreground">Uploading file...</p>
              ) : !!fileError ? (
                <p className="text-xs text-destructive">Failed to upload: {fileError.message}</p>
              ) : isSuccessfullyUploaded ? (
                <p className="text-xs text-primary">Successfully uploaded file</p>
              ) : (
                <p className="text-xs text-muted-foreground">{formatBytes(file.size, 2)}</p>
              )}
            </div>

            {!loading && (
              <Button
                type="button"
                size="icon"
                variant="link"
                className="shrink-0 justify-self-end text-muted-foreground hover:text-foreground"
                onClick={() => handleRemoveFile(file.name)}>
                <X />
              </Button>
            )}
          </div>
        );
      })}
      {exceedMaxFiles && (
        <p className="text-sm text-left mt-2 text-destructive">
          You may upload only up to {maxFiles} files, please remove {files.length - maxFiles} file
          {files.length - maxFiles > 1 ? "s" : ""}.
        </p>
      )}
      {errors.length > 0 && !exceedMaxFiles && (
        <div className="mt-2">
          <Button type="button" variant="outline" onClick={() => onUpload()} disabled={loading}>
            {loading ? (
              <>
                <Spinner className="mr-2 size-4" />
                Uploading...
              </>
            ) : (
              <>Retry upload</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

const DropzoneEmptyState = ({ className }: { className?: string }) => {
  const { maxFiles, maxFileSize, inputRef, isSuccess } = useDropzoneContext();

  if (isSuccess) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-3.5",
        className,
      )}>
      <div className="flex items-center gap-3">
        <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg border border-[#DDE2EE] bg-white">
          <FileTextIcon size={16} className="text-[#1E2FA8]" />
        </span>
        <div>
          <p className="text-[13px] font-medium text-[#10162B]">
            Drop your {maxFiles === 1 ? "resume" : "files"} here, or browse
          </p>
          {maxFileSize !== Number.POSITIVE_INFINITY && (
            <p className="mt-0.5 text-[11px] text-[#6C7591]">PDF only, up to {formatBytes(maxFileSize, 0)}</p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="min-h-[34px] flex-shrink-0 cursor-pointer rounded-md border border-[#D5DAE8] bg-white px-[15px] py-2 text-[12px] font-semibold text-[#10162B] shadow-[0_1px_2px_rgba(16,22,43,0.05)] transition-colors hover:bg-[#F7F8FC]">
        Browse files
      </button>
    </div>
  );
};

const useDropzoneContext = () => {
  const context = useContext(DropzoneContext);

  if (!context) {
    throw new Error("useDropzoneContext must be used within a Dropzone");
  }

  return context;
};

export { Dropzone, DropzoneContent, DropzoneEmptyState };
