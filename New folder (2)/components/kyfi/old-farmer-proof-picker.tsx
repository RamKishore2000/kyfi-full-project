"use client";

import { type ChangeEvent, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Camera, ImagePlus, Images } from "lucide-react";
import {
  clearActiveNativePicker,
  consumePendingNativePhoto,
  NATIVE_MEDIA_RESULT_EVENT,
  rememberActiveNativePicker,
  rememberNativeMediaReturnRoute,
  restoreNativeMediaScrollPosition,
} from "@/lib/native-media-return";

type OldFarmerProofPickerProps = {
  image: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFileSelect?: (file: File) => void | Promise<void>;
  onRemove: () => void;
  pickerId?: string;
  onBeforeNativePick?: () => void;
  title?: string;
  hint?: string;
  previewClassName?: string;
};

const acceptedImageTypes = "image/png,image/jpeg,image/jpg,image/webp";
type NativePhotoResult = {
  dataUrl?: string;
  webPath?: string;
  format?: string;
};

async function nativePhotoToFile(photo: NativePhotoResult) {
  const source = photo.dataUrl || photo.webPath;
  if (!source) {
    return null;
  }

  const response = await fetch(source);
  const blob = await response.blob();
  const extension = photo.format || blob.type.split("/")[1] || "jpg";

  return new File([blob], `proof-${Date.now()}.${extension}`, {
    type: blob.type || "image/jpeg",
  });
}

export function OldFarmerProofPicker({
  image,
  onChange,
  onFileSelect,
  onRemove,
  pickerId = "old-farmer-proof",
  onBeforeNativePick,
  title = "Select one image proof",
  hint = "JPG, JPEG, PNG, or WebP will be saved as WebP.",
  previewClassName = "max-h-44 w-full rounded-2xl object-contain",
}: OldFarmerProofPickerProps) {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  useEffect(() => {
    if (!isNative || !onFileSelect) {
      return;
    }

    const consumePending = () => {
      const pendingPhoto = consumePendingNativePhoto(pickerId);
      if (!pendingPhoto) {
        return;
      }

      void nativePhotoToFile(pendingPhoto as NativePhotoResult)
        .then((file) => (file ? onFileSelect(file) : undefined))
        .then(() => {
          clearActiveNativePicker();
          restoreNativeMediaScrollPosition();
        })
        .catch(() => undefined);
    };

    consumePending();
    window.addEventListener(NATIVE_MEDIA_RESULT_EVENT, consumePending);

    return () => {
      window.removeEventListener(NATIVE_MEDIA_RESULT_EVENT, consumePending);
    };
  }, [isNative, onFileSelect, pickerId]);

  const handleNativePick = async (source: "camera" | "gallery") => {
    if (!onFileSelect) {
      return;
    }

    try {
      rememberNativeMediaReturnRoute();
      rememberActiveNativePicker(pickerId);
      onBeforeNativePick?.();
      const {
        Camera: NativeCamera,
        CameraResultType,
        CameraSource,
      } = await import("@capacitor/camera");
      const photo = await NativeCamera.getPhoto({
        allowEditing: false,
        quality: 85,
        resultType: CameraResultType.Uri,
        source:
          source === "camera" ? CameraSource.Camera : CameraSource.Photos,
      });

      const file = await nativePhotoToFile(photo);
      if (!file) {
        return;
      }

      clearActiveNativePicker();
      await onFileSelect(file);
      restoreNativeMediaScrollPosition();
    } catch {
      clearActiveNativePicker();
      restoreNativeMediaScrollPosition();
      // Camera/gallery cancellation should keep the user on the same modal.
    }
  };

  return (
    <div className="space-y-3">
      <label className="hidden cursor-pointer flex-col items-center justify-center gap-3 rounded-[22px] border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-5 text-center transition hover:border-[rgb(4,120,87)] hover:bg-emerald-50 md:flex">
        {image ? (
          <img
            src={image}
            alt="Selected proof preview"
            className={previewClassName}
          />
        ) : (
          <>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[rgb(4,120,87)] shadow-sm">
              <ImagePlus className="h-5 w-5" />
            </span>
            <span className="font-manrope text-sm font-semibold text-slate-800">
              {title}
            </span>
            <span className="font-manrope text-xs text-slate-500">{hint}</span>
          </>
        )}
        <input
          type="file"
          accept={acceptedImageTypes}
          className="sr-only"
          onChange={onChange}
        />
      </label>

      <div className="md:hidden">
        <div className="rounded-[24px] border border-emerald-100 bg-white/85 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="flex min-h-40 items-center justify-center rounded-[20px] border border-dashed border-emerald-200 bg-emerald-50/45 p-4 text-center">
            {image ? (
              <img
                src={image}
                alt="Selected proof preview"
                className="max-h-52 w-full rounded-2xl object-contain"
              />
            ) : (
              <div className="space-y-2">
                <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[rgb(4,120,87)] shadow-sm">
                  <ImagePlus className="h-5 w-5" />
                </span>
                <p className="font-manrope text-sm font-black text-slate-900">
                  Add proof image
                </p>
                <p className="font-manrope text-xs leading-5 text-slate-500">
                  Take a photo now or choose from gallery.
                </p>
              </div>
            )}
          </div>

          {isNative ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void handleNativePick("camera")}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[rgb(4,120,87)] px-3 py-3 font-manrope text-sm font-black text-white shadow-sm active:scale-[0.98]"
              >
                <Camera className="h-4 w-4" />
                Take photo
              </button>

              <button
                type="button"
                onClick={() => void handleNativePick("gallery")}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 font-manrope text-sm font-black text-slate-800 shadow-sm active:scale-[0.98]"
              >
                <Images className="h-4 w-4 text-[rgb(4,120,87)]" />
                Gallery
              </button>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[rgb(4,120,87)] px-3 py-3 font-manrope text-sm font-black text-white shadow-sm active:scale-[0.98]">
                <Camera className="h-4 w-4" />
                Take photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onClick={rememberNativeMediaReturnRoute}
                  onChange={onChange}
                />
              </label>

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 font-manrope text-sm font-black text-slate-800 shadow-sm active:scale-[0.98]">
                <Images className="h-4 w-4 text-[rgb(4,120,87)]" />
                Gallery
                <input
                  type="file"
                  accept={acceptedImageTypes}
                  className="sr-only"
                  onClick={rememberNativeMediaReturnRoute}
                  onChange={onChange}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {image ? (
        <button
          type="button"
          onClick={onRemove}
          className="text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          Remove selected image
        </button>
      ) : null}
    </div>
  );
}
